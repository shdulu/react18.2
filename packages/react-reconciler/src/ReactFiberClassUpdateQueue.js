// UpdateQueue is a linked list of prioritized updates.

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

export function createUpdate() {
  const update = {};
  return update;
}

export function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const pending = updateQueue.shared.pending; // pending指针
  if (pending === null) {
    // This is the first update. Create a circular list.
    // 这是第一个update, 创建一个单向循环链表
    update.next = update;
  } else {
    update.next = pending.next
    pending.next = update
  }
  // 每次队列变化把pending指向到 最后的update， 最后一个update的next指向第一个更新
  updateQueue.shared.pending = update 
}
