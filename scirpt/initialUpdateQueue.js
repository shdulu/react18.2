function initializeUpdateQueue(fiber) {
  // 创建一个新的更新队列
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
function enqueueUpdate(fiber, update) {
  const updateQueue = fiber.updateQueue;
  const shared = updateQueue.shared;
  const pending = shared.pending;
  // pending.next 永远指向第一个，而pending指向最后一个
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update; // 此处修改倒数第二个指向最后一个
  }
  updateQueue.shared.pending = update;
}
function processUpdateQueue(fiber) {
  const queue = fiber.updateQueue;
  const pending = queue.shared.pending;
  if (pending !== null) {
    queue.shared.pending = null;
    // 最后一个更新
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

let fiber = { memoizedState: { id: 1 } };
debugger
initializeUpdateQueue(fiber);
let update1 = createUpdate();
update1.payload = { name: "shdulu" };
enqueueUpdate(fiber, update1);

let update2 = createUpdate();
update2.payload = { age: 18 };
enqueueUpdate(fiber, update2);

//  基于老状态计算新状态
processUpdateQueue(fiber);

console.log(fiber.memoizedState);
