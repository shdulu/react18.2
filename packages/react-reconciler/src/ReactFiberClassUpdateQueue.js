/**
 * 初始化更新队列
 *
 * @export
 * @param {*} fiber
 */
export function initializeUpdateQueue(fiber) {
  // 创建一个新的更新队列
  const queue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: {
      pending: null, // 循环链表
    //   lanes: NoLanes,
      hiddenCallbacks: null,
    },
    callbacks: null,
  };
  fiber.updateQueue = queue;
}
