/**
 * root 根容器节点 实现事件监听
 *
 * @export
 * @param {*} rootContainerElement 根容器
 */

import { allNativeEvents } from "./EventRegistry";
import * as SimpleEventPlugin from "./plugins/SimpleEvnetPlugin";

SimpleEventPlugin.registerEvents();

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2);

export function listenToAllSupportedEvents(rootContainerElement) {
  // 监听根容器，也就是div#root只监听一次
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = true;
    // 遍历所有原生的事件[click]，进行监听
    allNativeEvents.forEach((domEventName) => {
      console.log("domEventName:", domEventName);
      // 监听原生事件
      listenToNativeEvent(domEventName, true, rootContainerElement);
      listenToNativeEvent(domEventName, false, rootContainerElement);
    });
  }
}

/**
 * 注册原生事件
 *
 * @export
 * @param {*} domEventName 原生事件
 * @param {*} isCapturePhaseListener 是否是捕获节点
 * @param {*} target 目标DOM节点， div#root 容器节点
 */
export function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  target
) {
  //
}
