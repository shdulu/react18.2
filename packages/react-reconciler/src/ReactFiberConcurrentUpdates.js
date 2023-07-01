import { HostRoot } from "./ReactWorkTags";

const concurrentQueue = [];
let concurrentQueuesIndex = 0;

/**
 * 把更新先缓存到 concurrentQueue 数组中
 *
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update) {
  concurrentQueue[concurrentQueuesIndex++] = fiber;
  concurrentQueue[concurrentQueuesIndex++] = queue;
  concurrentQueue[concurrentQueuesIndex++] = update;
}

export function finishQueueingConcurrentUpdates() {
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  // debugger
  while (i < endIndex) {
    const fiber = concurrentQueue[i++];
    const queue = concurrentQueue[i++];
    const update = concurrentQueue[i++];
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      if (pending === null) {
        update.next = update;
      } else {
        update.next = pending.next;
        pending.next = update;
      }
      queue.pending = update;
    }
  }
}

// 并发更新 - 处理更新优先级
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let parent = sourceFiber.return; // 当前fiber的夫fiber
  let node = sourceFiber; // 当前fiber
  while (parent !== null) {
    // 一直找到parent为null --> HostRootFiber
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode; // FiberRootNode
  }
  return null;
}

/**
 * 把更新对象添加到更新队列中
 *
 * @export
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update) {
  enqueueUpdate(fiber, queue, update);
  return getRootForUpdatedFiber(fiber);
}

/**
 * 从当前更新fiber找到根fiber -> FiberRootNode div#root
 *
 * @param {*} sourceFiber
 * @return {*}
 */
function getRootForUpdatedFiber(sourceFiber) {
  let node = sourceFiber;
  let parent = node.return;
  while (parent !== null) {
    node = parent;
    parent = node.return;
  }
  return node.tag === HostRoot ? node.stateNode : null;
}
