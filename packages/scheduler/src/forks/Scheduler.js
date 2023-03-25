// 此处后面会实现一个优先队列
export function scheduleCallback(callback) {
  // 告诉浏览器空闲的时候执行
  requestIdleCallback(callback);
}
