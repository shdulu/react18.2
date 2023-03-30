import logger from "shared/logger";
import { HostRoot, HostComponent, HostText } from "./ReactWorkTags";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";

/**
 * 根据新的虚拟DOM生成新的Fiber链表
 *
 * @param {*} current 老的父Fiber
 * @param {*} workInProgress 新的
 * @param {*} nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // 没有老Fiber, 说明此fiber是新创建的 - 挂载子Fiber
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 如果没有老Fiber话，做DOM-DIFF 拿老的子fiber链表和新的子虚拟DOM进行比较，进行最小化的更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

function updateHostRoot(current, workInProgress) {
  // 需要知道它的子虚拟DOM，知道它的儿子的虚拟DOM信息
  processUpdateQueue(workInProgress); // workInProgress.memoizedState={element}
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  // 根据新的虚拟DOM生成子fiber链表
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child; // child -> element 对应的fiber
}
function updateHostComponent(current, workInProgress) {}

/**
 * 根据虚拟DOM构建新的fiber链表 child .sibling
 *
 * @export
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber
 * @return {*}
 */
export function beginWork(current, workInProgress) {
  logger("beginWork", workInProgress);
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return null;
    default:
  }
  // return null
}
