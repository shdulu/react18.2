let NoLanes = 0b00;
let NoLane = 0b00;
let SyncLane = 0b01;
let InputContinuousHydrationLane = 0b10;

function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}

function mergeLanes(a, b) {
  return a | b;
}

function initializeUpdateQueue(fiber) {
  let queue = {
    baseState: fiber.memoizedState, // 本次更新前当前fiber的状态，更新会基于他计算
    firstBaseUpdate: null, // 本次更新前该fiber上保存的上次跳过的更新链表头
    lastBaseUpdate: null, // 本次更新前该fiber上保存的上次跳过的更新链表
    shared: {
      pending: null,
    },
  };
  fiber.updateQueue = queue;
}

// 演示如何给fiber添加不同优先级的更新
// 在执行渲染的时候总是优先级高的先执行，跳过优先级低的更新
let fiber = { memoizedState: "" };

initializeUpdateQueue(fiber);

let updateA = {
  id: "A",
  payload: (state) => state + "A",
  lane: SyncLane,
};
enqueueUpdate(fiber, updateA);
let updateB = {
  id: "B",
  payload: (state) => state + "B",
  lane: SyncLane,
};
enqueueUpdate(fiber, updateB);
let updateC = {
  id: "C",
  payload: (state) => state + "C",
  lane: InputContinuousHydrationLane,
};
enqueueUpdate(fiber, updateC);
let updateD = {
  id: "D",
  payload: (state) => state + "D",
  lane: SyncLane,
};
enqueueUpdate(fiber, updateD);

function enqueueUpdate(fiber, update) {
  let updateQueue = fiber.updateQueue;
  let sharedQueue = updateQueue.shared;
  let pending = sharedQueue.pending;
  if (pending === null) {
    update.next = update;
  } else {
    update.next = pending.next;
    pending.next = update;
  }
  sharedQueue.pending = update;
}

function processUpdateQueue(fiber, renderLanes) {
  let queue = fiber.updateQueue;
  // 老链表头
  let firstBaseUpdate = queue.firstBaseUpdate;
  // 老链表尾
  let lastBaseUpdate = queue.lastBaseUpdate;
  // 新链表尾
  let pendingQueue = queue.shared.pending;
  // 合并新老链表
  if (pendingQueue !== null) {
    queue.shared.pending = null;
    // 新链表尾
    let lastPendingUpdate = pendingQueue;
    // 新链表尾
    let firstPendingUpdate = lastPendingUpdate.next;
    // 把老链表剪断变成单链表
    lastPendingUpdate.next = null;
    if (lastBaseUpdate === null) {
      // 如果没有老链表
      firstBaseUpdate = firstPendingUpdate;
    } else {
      lastBaseUpdate.next = firstPendingUpdate;
    }
    lastBaseUpdate = lastPendingUpdate;
  }
  if (firstBaseUpdate !== null) {
    let newState = queue.baseState;
    let newLanes = NoLane;
    let newBaseState = null;
    let newFirstBaseUpdate = null;
    let newLastBaseUpdate = null;
    let update = firstBaseUpdate;
    do {
      const updateLane = update.lane;
      if (!isSubsetOfLanes(renderLanes, updateLane)) {
        const clone = {
          id: update.id,
          lane: updateLane,
          payload: update.payload,
        };
        if (newLastBaseUpdate === null) {
          newFirstBaseUpdate = newLastBaseUpdate = clone;
          newBaseState = newState;
        } else {
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newLanes = mergeLanes(newLanes, updateLane);
      } else {
        if (newLastBaseUpdate !== null) {
          const clone = {
            id: update.id,
            lane: NoLane,
            payload: update.payload,
          };
          newLastBaseUpdate = newLastBaseUpdate.next = clone;
        }
        newState = getStateFromUpdate(update, newState);
      }
      update = update.next;
    } while (update);
    if (!newLastBaseUpdate) {
      newBaseState = newState;
    }
    queue.baseState = newBaseState;
    queue.firstBaseUpdate = newFirstBaseUpdate;
    queue.lastBaseUpdate = newLastBaseUpdate;
    fiber.lane = newLanes;

    fiber.memoizedState = newState;
  }
}

function getStateFromUpdate(update, prevState) {
  return update.payload(prevState);
}

// 处理更新队列 - 需要指定一个渲染优先级
processUpdateQueue(fiber, SyncLane);
console.log(fiber.memoizedState); // BD

let updateE = {
  id: "E",
  payload: (state) => state + "E",
  lane: InputContinuousHydrationLane,
};
enqueueUpdate(fiber, updateE);
let updateF = {
  id: "F",
  payload: (state) => state + "F",
  lane: SyncLane,
};
enqueueUpdate(fiber, updateF);

processUpdateQueue(fiber, InputContinuousHydrationLane);
console.log(fiber.memoizedState);
