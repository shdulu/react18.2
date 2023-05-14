export const allNativeEvents = new Set();

/**
 * 注册两个阶段的事件
 * 当我在页面里触发click事件的时候，会走事件处理函数
 * 事件处理函数需要找到DOM元素对应的要执行React事件 onClick onClickCapture
 * @export
 * @param {*} registrationName React 事件名 onClick
 * @param {*} dependencies 原生事件数组 [click]
 */
export function registerTwoPhaseEvent(registrationName, dependencies) {
  // 注册冒泡事件的对应关系
  registerDirectEvnet(registrationName, dependencies);
  // 注册捕获事件的对应关系
  registerDirectEvnet(registrationName + "Capture", dependencies);
}

export function registerDirectEvnet(registrationName, dependencies) {
  for (let i = 0; i < dependencies.length; i++) {
    allNativeEvents.add(dependencies[i]);
  }
}
