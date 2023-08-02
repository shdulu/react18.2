// UpdateQueue is a linked list of prioritized updates.
import { enqueueConcurrentClassUpdate } from "./ReactFiberConcurrentUpdates";
import assign from "shared/assign";
export const UpdateState = 0;

/**
 * 初始化更新队列
 *
 * @export
 * @param {*} fiber
 */
export function initializeUpdateQueue(fiber) {
  // 创建一个新的更新队列
  const queue = {
    shared: {
      pending: null, // 循环链表
    },
  };
  fiber.updateQueue = queue;
}

export function createUpdate(lane) {
  const update = {
    tag: UpdateState,
    lane,
    next: null,
  };
  return update;
}

/**
 *
 *
 * @param {*} fiber
 * @param {*} update
 * @param {*} lane
 * @return {*} 
 */
export function enqueueUpdate(fiber, update, lane) {
  // 获取更新队列
  const updateQueue = fiber.updateQueue
  // 获取共享队列
  const sharedQueue = updateQueue.shared
  // 并发更新
  return enqueueConcurrentClassUpdate(fiber, sharedQueue, update, lane)
}

/**
 * 根据老状态和更新队列中的更新计算最新状态
 * @param {Fiber} workInProgress 要计算的fiber
 * @export
 */
export function processUpdateQueue(workInProgress) {
  const queue = workInProgress.updateQueue;
  const pendingQueue = queue.shared.pending;
  if (pendingQueue !== null) {
    // 如果有更新 或者说更新队列里有内容
    queue.shared.pending = null; // 清除等待生效的更新
    const lastPendingUpdate = pendingQueue;
    // 指向第一个更新
    const firstPendingUpdate = lastPendingUpdate.next;
    // 把更新链表剪开，变成一个单链表
    lastPendingUpdate.next = null;
    // 获取老状态 null
    let newState = workInProgress.memoizedState;
    let update = firstPendingUpdate;
    while (update) {
      // 根据老状态和更新计算新状态
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    // 把计算得到的状态赋值给 memoizedState
    workInProgress.memoizedState = newState;
  }
}
/**
 * 根据老状态和更新
 *
 * @param {*} update
 * @param {*} prevState
 */
function getStateFromUpdate(update, prevState) {
  switch (update.tag) {
    case UpdateState:
      const { payload } = update;
      // Merge the partial state and the previous state.
      return assign({}, prevState, payload);

    default:
      break;
  }
}
