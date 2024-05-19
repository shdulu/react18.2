import { HostRoot } from "./ReactWorkTags";
import { mergeLanes } from "./ReactFiberLane";
const concurrentQueues = [];
let concurrentQueuesIndex = 0;

/**
 * 把更新先缓存到 concurrentQueues 数组中
 * 多个 hook 的并发更新通过本地缓存数组，先存起来
 *
 * @param {*} fiber
 * @param {*} queue
 * @param {*} update
 */
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;
  // 当我们想一个fiber上添加一个更新的时候，要把此更新的赛道合并到此fiber的赛道上
  fiber.lanes = mergeLanes(fiber.lanes, lane);
}

/**
 * 完成
 *
 * @export
 */
export function finishQueueingConcurrentUpdates() {
  debugger
  const endIndex = concurrentQueuesIndex;
  concurrentQueuesIndex = 0;
  let i = 0;
  while (i < endIndex) {
    const fiber = concurrentQueues[i++];
    const queue = concurrentQueues[i++];
    const update = concurrentQueues[i++];
    const lane = concurrentQueues[i++];
    if (queue !== null && update !== null) {
      const pending = queue.pending;
      // 构成循环链表
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

/**
 * 把更新对象添加到更新队列中
 *
 * @export
 * @param {*} fiber 函数组件对应的fiber
 * @param {*} queue 要更新的hook对应的更新队列
 * @param {*} update 更新对象
 * @param {*} lane 待更新的车道
 */
export function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
  // 从当前fiber找到根节点 root
  return getRootForUpdatedFiber(fiber);
}

/**
 * 更新并发入队
 *
 * @export
 * @param {*} fiber 根fiber
 * @param {*} queue shareQueue 待生效的队列
 * @param {*} update 更新
 * @param {*} lane 待更新的车道
 */
export function enqueueConcurrentClassUpdate(fiber, queue, update, lane) {
  enqueueUpdate(fiber, queue, update, lane);
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
