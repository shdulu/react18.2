/**
 * 调度最小堆 用来处理任务的优先级
 * peek() 查看堆的顶点
 * pop() 弹出堆的定点后需要调用siftDown 函数向下调整堆
 * push() 添加新节点后需要调用siftUp 函数向上调整堆
 * siftDown() 向下调整堆结构, 保证最小堆
 * siftUp() 需要向上调整堆结构, 保证最小堆
 *
 * */

/**
 * 向最小堆里添加一个节点
 *
 * @param {*} heap 最小堆
 * @param {*} node 节点
 */
export function push(heap, node) {
  // 获取元素的数量
  const index = heap.length;
  // 先把添加的元素放在数组的尾部
  heap.push(node);
  siftUp(heap, node, index);
}

/**
 * 查看最小堆顶的元素
 *
 * @param {*} heap
 */
export function peek(heap) {
  return heap.length === 0 ? null : heap[0];
}

/**
 * 弹出最小堆的堆顶元素
 *
 * @param {*} heap
 */
export function pop(heap) {
  if (heap.length === 0) {
    return null;
  }
  const first = heap[0];
  const last = heap.pop();
  if (last !== first) {
    heap[0] = last;
    siftDown(heap, last, 0);
  }
  return first;
}

/**
 * 向上调整某个节点使其位于正确的位置
 *
 * @param {*} heap 最小堆
 * @param {*} node 节点
 * @param {*} i 节点所在的索引
 */
function siftUp(heap, node, i) {
  let index = i;
  while (index > 0) {
    // 获取父节点的索引，子节点的索引减1,左移1位
    const parentIndex = (index - 1) >>> 1; // 或者(index-1)/2取整
    const parent = heap[parentIndex];
    if (compare(parent, node) > 0) {
      // 如果父节点存在且父节点比子节点大，交换位置
      heap[parentIndex] = node;
      heap[index] = parent;
      index = parentIndex;
    } else {
      // 如果子节点比父节点大
      return;
    }
  }
}

function compare(a, b) {
  const diff = a.sortIndex - b.sortIndex;
  return diff !== 0 ? diff : a.id - b.id;
}

/**
 * 向下调整某个节点使其位于正确的位置
 *
 * @param {*} heap 最小堆
 * @param {*} node 节点
 * @param {*} i 节点所在的索引
 */
function siftDown(heap, node, i) {
  let index = i;
  const length = heap.length;
  const halfLength = length >>> 1;
  while (index < halfLength) {
    const leftIndex = (index + 1) * 2 - 1;
    const left = heap[leftIndex];
    const rightIndex = leftIndex + 1;
    const right = heap[rightIndex];
    // 如果左子节点存在，并且左子节点比父节点要小
    if (compare(left, node) < 0) {
      // 如果右节点存在，且右节点比左节点小
      if (rightIndex < length && compare(right, left) < 0) {
        heap[index] = right;
        heap[rightIndex] = node;
        index = rightIndex;
      } else {
        heap[index] = left;
        heap[leftIndex] = node;
        index = leftIndex;
      }
    } else if (rightIndex < length && compare(right, node) < 0) {
      heap[index] = right;
      heap[rightIndex] = node;
      index = rightIndex;
    } else {
      return;
    }
  }
}
