import logger from "shared/logger";
import { HostRoot, HostComponent, HostText } from "./ReactWorkTags";

function updateHostRoot(current, workInProgress) {
  // 需要知道它的子虚拟DOM，知道它的儿子的虚拟DOM信息
  processUpdateQueue(workInProgress); // workInProgress.memoizedState={element}
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  // 协调子节点 DOM-DIFF 算法
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child; // child -> element 对应的fiber
}
function updateHostComponent(current, workInProgress) {}

function processUpdateQueue() {}

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
