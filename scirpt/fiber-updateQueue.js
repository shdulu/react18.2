function initializeUpdateQueue(fiber) {
  const queue = {
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

function createUpdate() {
  return {};
}

// 更新入队
function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const shared = updateQueue.shared;
  const pending = shared.pending;
  if (pending === null) {
    // pending 一直指向链表尾部最后一个更新
    // 第一个入队
    update.next = update;
  } else {
    update.next = pending.next; // 新入队的更新指向头部
    pending.next = update; // 头部指向新入队的更新
  }
  updateQueue.shared.pending = update; // pending 指向新入队的更新
}

let fiber = { memoizedState: { id: 1 } };
initializeUpdateQueue(fiber);

let update1 = createUpdate();
update1.payload = { name: "shdulu", label: "update1" };
enqueueUpdate(fiber, update1);

let update2 = createUpdate();
update2.payload = { age: 90, label: "update2" };
enqueueUpdate(fiber, update2);

// 基于老状态计算新状态
processUpdateQueue(fiber);

function processUpdateQueue(fiber) {
  const queue = fiber.updateQueue;
  const pending = queue.shared.pending;
  if (pending !== null) {
    queue.shared.pending = null;
    const lastPendingUpdate = pending;
    const firstPendingUpdate = lastPendingUpdate.next;
    // 把环状链表剪开
    lastPendingUpdate.next = null;
    let newState = fiber.memoizedState;
    let update = firstPendingUpdate;
    while (update) {
      newState = getStateFromUpdate(update, newState);
      update = update.next;
    }
    fiber.memoizedState = newState;
  }
}

function getStateFromUpdate(update, newState) {
  return Object.assign({}, newState, update.payload);
}
