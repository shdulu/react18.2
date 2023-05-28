// 绑定真实事件

/**
 *
 *
 * @export
 * @param {*} target div#root
 * @param {*} eventType click
 * @param {*} listener 事件监听函数
 */
export function addEventCaptureLister(target, eventType, listener) {
  target.addEventListener(eventType, listener, true);
  return listener;
}

/**
 *
 *
 * @export
 * @param {*} target div#root
 * @param {*} eventType click
 * @param {*} listener 事件监听函数
 */
export function addEventBubbleLister(target, eventType, listener) {
  target.addEventListener(eventType, listener, false);
  return listener;
}
