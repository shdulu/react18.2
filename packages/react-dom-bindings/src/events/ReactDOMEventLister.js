import getEventTarget from "./getEventTarget";
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree";
import { dispatchEventForPluginEventSystem } from "./DOMPluginEvnetSystem";

/**
 * 返回带有优先级的执行函数
 *
 * @export
 * @param {*} targetContainer 容器 div#root
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0冒泡 4捕获
 * @param {*} isCapturePhaseListener 是否捕获
 */
export function createEventListerWrapperWithPriority(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  const listenerWrapper = dispatchDiscretEvent;
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

/**
 *
 *
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0冒泡 4捕获
 * @param {*} container 容器 div#root
 * @param {*} nativeEvent 原生事件
 */
function dispatchDiscretEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
}

/**
 * 此方法就是委托给容器的回调，当容器#root在捕获或者冒泡阶段处理事件的时候会执行此函数
 *
 * @export
 * @param {*} domEventName
 * @param {*} eventSystemFlags
 * @param {*} container
 * @param {*} nativeEvent
 */
export function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  // 获取事件源，它是一个真实DOM
  const nativeEventTarget = getEventTarget(nativeEvent);
  const targetInst = getClosestInstanceFromNode(nativeEventTarget);
  dispatchEventForPluginEventSystem(
    domEventName, // click
    eventSystemFlags, // 0 4
    nativeEvent, // 原生事件
    targetInst, // 此真实DOM对应的fiber
    targetContainer // 目标容器
  );
}
