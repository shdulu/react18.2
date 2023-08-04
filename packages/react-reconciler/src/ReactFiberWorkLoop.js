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
  SyncLane,
} from "./ReactFiberLane";
import {
  getCurrentUpdatePriority,
  lanesToEventPriority,
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
} from "./ReactEventPriorities";
import { getCurrentEventPriority } from "react-dom-bindings/src/client/ReactDOMHostConfig";

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
let workInProgressRenderLanes = NoLanes;

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
  // 获取最新的调度优先级
  let newCallbackPriority = getHighestPriorityLane(nextLanes);
  if (newCallbackPriority === SyncLane) {
    // TODO
  } else {
    // 如果不是童虎，需要调度一个新的任务
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
    Scheduler_scheduleCallback(
      schedulerPriorityLevel,
      performConcurrentWorkOnRoot.bind(null, root)
    );
  }

  // /** 批量更新防止多次调用 start */
  // if (workInProgressRoot) return;
  // workInProgressRoot = root;
  // /**批量更新防止多次调用 end*/
  // scheduleCallback(
  //   NormalSchedulerPriority,
  //   performConcurrentWorkOnRoot.bind(null, root)
  // );
}
/**
 * 根据虚拟DOM构建fiber，要创建真实的DOM节点，插入到容器
 * 执行root上的并发更新工作
 *
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root, timeout) {
  // 获取当前优先级最高的车道
  const nextLanes = getNextLanes(root, NoLanes);
  if (nextLanes === NoLanes) {
    return null;
  }
  // 第一次渲染以同步的方式渲染根节点，初次渲染的时候都是同步的
  renderRootSync(root, nextLanes);
  // 开始进入提交阶段，就是执行副作用，修改真实DOM
  const finishedWork = root.current.alternate; // 新构建出来的fiber树
  root.finishedWork = finishedWork;
  commitRoot(root);
  return null
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

/**
 * completeWork 完成进入到 commit阶段，会有dom节点的更新
 *
 * @param {*} root
 */
function commitRoot(root) {
  const { finishedWork } = root;
  workInProgressRoot = null;
  workInProgressRenderLanes = null;
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
  if (
    root !== workInProgressRoot ||
    workInProgressRenderLanes !== renderLanes
  ) {
    workInProgress = createWorkInProgress(root.current, null);
  }
  // 渲染lane
  workInProgressRenderLanes = renderLanes;
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
  // 开始构建fiber树
  prepareFreshStack(root, renderLanes);
  workLoopSync();
}

function workLoopConcurrent() {
  // 如果有下一个要构建的fiber，且时间片没有过期
  while (workInProgress !== null && !shouldYield()) {
    // 执行工作单元
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
  const next = beginWork(current, unitOfWork, workInProgressRenderLanes);
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
}

export function requestUpdateLane() {
  const updateLane = getCurrentUpdatePriority();
  if (updateLane !== NoLane) {
    return updateLane;
  }
  const eventLane = getCurrentEventPriority();
  return eventLane;
}
