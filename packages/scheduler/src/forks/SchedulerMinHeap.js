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
function push(heap, node) {
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
function peek(heap) {}

/**
 * 弹出最小堆的堆顶元素
 *
 * @param {*} heap
 */
function pop(heap) {}

/**
 * 向上调整某个节点使其位于正确的位置
 *
 * @param {*} heap 最小堆
 * @param {*} node 节点
 * @param {*} i 节点所在的索引
 */
function siftUp(heap, node, i) {
    
}

/**
 * 向下调整某个节点使其位于正确的位置
 *
 * @param {*} heap 最小堆
 * @param {*} node 节点
 * @param {*} i 节点所在的索引
 */
function siftDown(heap, node, i) {}

let heap = [];

push(heap, { sortIndex: 1 });
push(heap, { sortIndex: 2 });
push(heap, { sortIndex: 3 });
