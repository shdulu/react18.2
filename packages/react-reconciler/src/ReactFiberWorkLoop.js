// fiber 的工作循环
import {
  shouldYield,
  scheduleCallback as Scheduler_scheduleCallback,
  ImmediatePriority as ImmediateSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  IdlePriority as IdleSchedulerPriority,
} from "./Scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import { NoFlags, MutationMask, Passive } from "./ReactFiberFlags";
import {
  NoLane,
  NoLanes,
  markRootUpdated,
  getNextLanes,
  getHighestPriorityLane,
  includesSyncLane,
  includesBlockingLane,
} from "./ReactFiberLane";
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  setCurrentUpdatePriority,
} from "./ReactEventPriorities";
import { getCurrentEventPriority } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  scheduleSyncCallback,
  flushSyncCallbacks,
} from "./ReactFiberSyncTaskQueue";

import {
  commitMutationEffectsOnFiber,
  commitPassiveUnmountEffects,
  commitPassiveMountEffects,
  commitLayoutEffects,
} from "./ReactFiberCommitWork";
import { finishQueueingConcurrentUpdates } from "./ReactFiberConcurrentUpdates";

let workInProgress = null; // 正在构建中的fiber 树
let workInProgressRoot = null; // 当前正在调度的根节点
let rootDoesHavePassiveEffects = false; // 此根节点上有没有useEffect类似的副作用
let rootWithPendingPassiveEffects = null; // 具有useEffect 副作用的根节点 FiberRootNode
let workInProgressRootRenderLanes = NoLanes;
const RootInProgress = 0; // 构建fiber树进行中
const RootCompleted = 5; // 构建fiber树已完成
let workInProgressRootExitStatus = RootInProgress; // 当渲染工作结束的时候，当前的fiber树处于什么状态，默认进行中

/**
 * 计划更新root
 * 任务调度功能
 *
 * @export
 * @param {*} root
 * @param {*} fiber
 * @param {*} lane
 */
export function scheduleUpdateOnFiber(root, fiber, lane) {
  markRootUpdated(root, lane);
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

/**
 *
 *
 * @param {*} root
 * @return {*}
 */
function ensureRootIsScheduled(root) {
  // 获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes); // 32
  // 没有要执行的任务
  if (nextLanes === NoLanes) {
    return;
  }
  // 获取最新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  // 新的回调任务
  let newCallbackNode;
  if (includesSyncLane(newCallbackPriority)) {
    // 同步优先级任务
    // 先把 performSyncWorkOnRoot 添加到同步队列中
    scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root));
    // 在把 flushSyncCallbacks 放入微任务
    // https://developer.mozilla.org/zh-CN/docs/Web/API/queueMicrotask
    queueMicrotask(flushSyncCallbacks);
    // 如果是同步执行的话
    newCallbackNode = null;
  } else {
    // 如果不是同步，需要调度一个新的任务
    let schedulerPriorityLevel;
    switch (lanesToEventPriority(nextLanes)) {
      case DiscreteEventPriority:
        schedulerPriorityLevel = ImmediateSchedulerPriority;
        break;
      case ContinuousEventPriority:
        schedulerPriorityLevel = UserBlockingSchedulerPriority;
        break;
      case DefaultEventPriority:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
      case IdleEventPriority:
        schedulerPriorityLevel = IdleSchedulerPriority;
        break;
      default:
        schedulerPriorityLevel = NormalSchedulerPriority;
        break;
    }
    newCallbackNode = Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  // 在根节点上执行的任务是 newCallbackNode
  root.callbackNode = newCallbackNode;
}
/**
 * 并发渲染
 * 根据虚拟DOM构建fiber，要创建真实的DOM节点，插入到容器
 * 执行root上的并发更新工作
 *
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  console.log('performConcurrentWorkOnRoot...........................')
  // 先获取当前根节点上的任务
  const originalCallbackNode = root.callbackNode;
  // 获取当前优先级最高的车道
  const lanes = getNextLanes(root, NoLanes);
  if (lanes === NoLanes) {
    return null;
  }
  // 如果不包含阻塞的车道且没有超时，就可以并行渲染，就可以启用时间分片
  const shouldTimeSlice = !includesBlockingLane(root, lanes) && !didTimeout;
  console.log("shouldTimeSlice", shouldTimeSlice);
  // 执行渲染，得到退出的状态
  const exitStatus = shouldTimeSlice
    ? renderRootConcurrent(root, lanes)
    : renderRootSync(root, lanes);
  // 如果不是渲染中的话，说明已经渲染完了
  if (exitStatus !== RootInProgress) {
    const finishedWork = root.current.alternate; // 新构建出来的fiber树
    root.finishedWork = finishedWork;
    commitRoot(root);
  }
  // 说明任务没有完成
  if (root.callbackNode === originalCallbackNode) {
    return performConcurrentWorkOnRoot.bind(null, root);
  }
  return null;
}

/**
 * 在根上执行同步工作
 *
 */
function performSyncWorkOnRoot(root) {
  // 计算最高优先级的lane
  const lanes = getNextLanes(root);
  // 渲染新的fiber树
  renderRootSync(root, lanes);
  // 获取渲染完成的fiber根节点
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
  return null;
}

function renderRootConcurrent(root, lanes) {
  // 因为在构建fiber树的过程中，此方法会反复进入，
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes) {
    // 只有第一次进来的时候才会创建新的fiber树
    prepareFreshStack(root, lanes);
  }
  // 并发工作循环，在当前分配的时间片(5ms)内执行fiber树的构建或者渲染
  workLoopConcurrent();
  if (workInProgress !== null) {
    // fiber树的构建还没有完成,返回构建中在下一帧继续
    return RootInProgress;
  }
  // 渲染工作完全结束
  return workInProgressRootExitStatus;
}

function flushPassiveEffect() {
  console.log(
    "下一个宏任务中 flushPassiveEffect ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
  );
  if (rootWithPendingPassiveEffects !== null) {
    const root = rootWithPendingPassiveEffects;
    // 执行卸载副作用 destory
    commitPassiveUnmountEffects(root.current);
    // 执行挂载副作用 create
    commitPassiveMountEffects(root, root.current);
  }
}

function commitRoot(root) {
  const previousUpdatePriority = getCurrentUpdatePriority();
  try {
    // 把当前的更新优先级设置为 1 -> 提交阶段无法中断
    setCurrentUpdatePriority(DiscreteEventPriority);
    commitRootImpl(root);
  } finally {
    setCurrentUpdatePriority(previousUpdatePriority);
  }
}

/**
 * completeWork 完成进入到 commit阶段，会有dom节点的更新
 *
 * @param {*} root
 */
function commitRootImpl(root) {
  const { finishedWork } = root;
  workInProgressRoot = null;
  workInProgressRootRenderLanes = null;
  root.callbackNode = null;
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true;
      // 有空闲时间 - 开启一个宏任务
      Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffect);
    }
  }
  console.log("开始 commit ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
  // 判断子树是否有副作用
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffect = (finishedWork.flags & MutationMask) !== NoFlags;
  // 如果自己有副作用或者子节点有副作用，就提交DOM操作
  if (subtreeHasEffects || rootHasEffect) {
    // 当DOM执行变更之后
    console.log(
      "DOM 执行变更 commitMutationEffectsOnFiber ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
    );
    commitMutationEffectsOnFiber(finishedWork, root);
    // 执行 useLayoutEffect -> DOM 变更之后UI渲染之前执行
    console.log(
      "DOM 执行变更后 commitLayoutEffects ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
    );
    commitLayoutEffects(finishedWork, root);
    if (rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  // 等DOM变更后，就可以把root的current指向新的
  root.current = finishedWork;
}

/**
 *
 *
 * @param {*} root
 * @param {*} renderLanes
 */
function prepareFreshStack(root, renderLanes) {
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = renderLanes;
  workInProgressRoot = root;
  // 完成队列的并发更新
  finishQueueingConcurrentUpdates();
}

/**
 *
 *
 * @param {*} root
 * @param {*} renderLanes
 */
function renderRootSync(root, renderLanes) {
  // 如果新的根和老的根不一样，或者新的渲染优先级和老的渲染优先级不一样
  if (
    root !== workInProgressRoot ||
    workInProgressRootRenderLanes !== renderLanes
  ) {
    prepareFreshStack(root, renderLanes);
  }
  workLoopSync();
}

function workLoopConcurrent() {
  // 如果有下一个要构建的fiber，且时间片没有过期
  while (workInProgress !== null && !shouldYield()) {
    // 执行工作单元
    sleep(6);
    performUnitOfWork(workInProgress);
    console.log("shouldYield:", shouldYield(), workInProgress);
  }
}

function workLoopSync() {
  // Perform work without checking if we need to yield between fiber.
  while (workInProgress !== null) {
    // 执行工作单元
    performUnitOfWork(workInProgress);
  }
}
/**
 * 执行一个工作单元
 *
 * @param {Fiber} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  // 获取新的fiber 对应的老fiber
  const current = unitOfWork.alternate;
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
  // 完成当前fiber的子fiber链表构建后
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    // 如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}

/**
 *
 *
 * @param {*} unitOfWork
 * @return {*}
 */
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate; // 对应的老fiber
    const returnFiber = completedWork.return; // 父fiber
    // 执行此fiber的完成工作，如果是原生组件的话就是创建真实的dom节点
    completeWork(current, completedWork);
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟，说明当前完成的就是父fiber的最后一个节点
    // 也就是一个父fiber所有的子fiber全部完成了
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
  // 如果走到这里说明fiber树全部构建完毕,把构建状态设置为完成
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}

export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLane) {
    return updateLane;
  }
  const eventLane = getCurrentEventPriority();
  return eventLane;
}

function sleep(duration) {
  const timeStamp = new Date().getTime();
  const endTime = timeStamp + duration;
  while (true) {
    if (new Date().getTime() > endTime) {
      return;
    }
  }
}
