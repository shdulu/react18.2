
// fiber 的工作循环
import {
  now,
  shouldYield,
  scheduleCallback as Scheduler_scheduleCallback,
  cancelCallback as Scheduler_cancelCallback,
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
  includesExpiredLane,
  markStarvedLanesAsExpired,
  NoTimestamp,
  mergeLanes,
  markRootFinished,
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
// 当前的时间发生时间
let currentEventTime = NoTimestamp;

/**
 * 计划更新root
 * 任务调度功能
 *
 * @export
 * @param {*} root
 * @param {*} fiber
 * @param {*} lane
 */
export function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
  markRootUpdated(root, lane);
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root, eventTime);
}

// Use this function to schedule a task for a root. There's only one task per
// root; if a task was already scheduled, we'll check to make sure the priority
// of the existing task is the same as the priority of the next level that the
// root has work on. This function is called on every update, and right before
// exiting a task.
/**
 *
 *
 * @param {*} root
 * @return {*}
 */
function ensureRootIsScheduled(root, currentTime) {
  // 先获取当前根上执行的任务
  const existingCallbackNode = root.callbackNode;
  // 把所有饿死的赛道标记为过期
  markStarvedLanesAsExpired(root, currentTime);
  // 获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, workInProgressRootRenderLanes);
  // 没有要执行的任务
  if (nextLanes === NoLanes) {
    root.callbackNode = null;
    root.callbackPriority = NoLane;
    return;
  }

  // 获取最新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  // 获取现在根上正在运行的优先级
  const existingCallbackPriority = root.callbackPriority;
  // 如果新的优先级和老的优先级 可以同步进行批量更新
  if (existingCallbackPriority === newCallbackPriority) {
    // 同步任务会先注册回调，同步多个同步任务的调度完成后才会执行最后的scheduleSyncCallback
    return;
  }
  if (existingCallbackNode !== null) {
    console.log("Scheduler_cancelCallback.............");
    Scheduler_cancelCallback(existingCallbackNode);
  }
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
    
    // Scheduler_scheduleCallback 返回正在调取的任务
    newCallbackNode = Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }
  // 在根节点上执行的任务是 newCallbackNode
  root.callbackPriority = newCallbackPriority;
  root.callbackNode = newCallbackNode;
}
/**
 * Scheduler 调取器执行的函数
 * 
 * 并发渲染
 * 根据虚拟DOM构建fiber，要创建真实的DOM节点，插入到容器
 * 执行root上的并发更新工作
 *
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, didTimeout) {
  
  // 先获取当前根节点上的任务
  const originalCallbackNode = root.callbackNode;
  // 获取当前优先级最高的车道
  const lanes = getNextLanes(root, NoLanes);
  if (lanes === NoLanes) {
    return null;
  }

  // 是否不包含阻塞车道
  const nonIncludesBlockingLane = !includesBlockingLane(root, lanes);
  // 是否不包含过期的车道
  const nonIncludesExpiredLane = !includesExpiredLane(root, lanes);
  // 时间片没有过期
  const nonTimeout = !didTimeout;
  // 不包含阻塞车道且不包含过期车道且没有超时，就可以并行渲染可以启用时间分片
  const shouldTimeSlice =
    nonIncludesBlockingLane && nonIncludesExpiredLane && nonTimeout;
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
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
  // 渲染工作完全结束
  return workInProgressRootExitStatus;
}

function flushPassiveEffects() {
  console.log(
    "下一个宏任务中 flushPassiveEffects ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"
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
  workInProgressRootRenderLanes = NoLanes;
  root.callbackNode = null;
  root.callbackPriority = NoLane;
  // 合并统计当前新的根上剩下的车道
  const remainingLanes = mergeLanes(
    finishedWork.lanes,
    finishedWork.childLanes
  );
  markRootFinished(root, remainingLanes);
  if (
    (finishedWork.subtreeFlags & Passive) !== NoFlags ||
    (finishedWork.flags & Passive) !== NoFlags
  ) {
    if (!rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = true;
      // 有空闲时间 - 开启一个宏任务
      Scheduler_scheduleCallback(NormalSchedulerPriority, flushPassiveEffects);
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
    root.current = finishedWork;
    if (rootDoesHavePassiveEffects) {
      rootDoesHavePassiveEffects = false;
      rootWithPendingPassiveEffects = root;
    }
  }
  // 等DOM变更后，就可以把root的current指向新的
  root.current = finishedWork;
  // 在提交之后因为根上可能存在跳过的更新，所以需要重新再次调度
  //
  ensureRootIsScheduled(root, now());
}

/**
 *
 *
 * @param {*} root
 * @param {*} renderLanes
 */
function prepareFreshStack(root, renderLanes) {
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = renderLanes;
  // 完成队列的并发更新
  finishQueueingConcurrentUpdates();
}

/**
 * 构建fiber 树
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
  workInProgressRoot = null;
  workInProgressRootRenderLanes = NoLanes;
  return workInProgressRootExitStatus;
}

function workLoopConcurrent() {
  // 如果有下一个要构建的fiber，且时间片没有过期
  while (workInProgress !== null && !shouldYield()) {
    // 执行工作单元
    sleep(5);
    performUnitOfWork(workInProgress);
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
    // 如果没有子节点了，开始完成work
    // 不同类型的fiber完成work做的事情不一样
    // 如果是原生fiber创建真实dom节点
    
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
    // 完成当前去找他的弟弟
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // 如果有弟弟去构建弟弟对应的fiber子链表
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟，说明当前完成的就是父fiber的最后一个节点
    // 也就是一个父fiber所有的子fiber全部完成了
    // 所有子fiber完成了去完成父fiber
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null); // 一直递归上跟fiber退出循环
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

// 请求当前的时间
export function requestEventTime() {
  currentEventTime = now();
  return currentEventTime;
}
