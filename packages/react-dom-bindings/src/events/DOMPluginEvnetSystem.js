import { IS_CAPTURE_PHASE } from "./EventSystemFlags";
import { createEventListerWrapperWithPriority } from "./ReactDOMEventLister";
import { addEventCaptureLister, addEventBubbleLister } from "./EventLister";
import getListener from "./getListener";

/**
 * root 根容器节点 实现事件监听
 *
 * @export
 * @param {*} rootContainerElement 根容器
 */

import { allNativeEvents } from "./EventRegistry";
import * as SimpleEventPlugin from "./plugins/SimpleEvnetPlugin";
import getEventTarget from "./getEventTarget";
import { HostComponent } from "react-reconciler/src/ReactWorkTags";

// 给allNativeEvents添加事件列表
SimpleEventPlugin.registerEvents();

const listeningMarker = `_reactListening` + Math.random().toString(36).slice(2);

/**
 * 在div#root 根元素节点上绑定事件
 *
 * @export
 * @param {*} rootContainerElement div#root 根元素
 */
export function listenToAllSupportedEvents(rootContainerElement) {
  // 监听根容器，也就是div#root只监听一次
  if (!rootContainerElement[listeningMarker]) {
    // 已经绑过打上已绑定标记， 不在执行绑定事件
    rootContainerElement[listeningMarker] = true;
    // 遍历所有原生的事件[click,...]，进行监听
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
 * @param {*} isCapturePhaseListener 是否是捕获阶段
 * @param {*} target 目标DOM节点， div#root 容器节点
 */
export function listenToNativeEvent(
  domEventName,
  isCapturePhaseListener,
  target
) {
  let eventSystemFlags = 0; // 默认是0指的是冒泡， 4是捕获
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

/**
 *
 *
 * @param {*} targetContainer div#root
 * @param {*} domEventName click
 * @param {*} eventSystemFlags 默认是0指的是冒泡， 4是捕获
 * @param {*} isCapturePhaseListener 是否是捕获阶段
 */
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  const listener = createEventListerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
  if (isCapturePhaseListener) {
    addEventCaptureLister(targetContainer, domEventName, listener);
  } else {
    addEventBubbleLister(targetContainer, domEventName, listener);
  }
}

export function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  dispatchEventForPlugins(
    domEventName,
    eventSystemFlags,
    nativeEvent,
    targetInst,
    targetContainer
  );
}

function dispatchEventForPlugins(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  targetContainer
) {
  const nativeEventTarget = getEventTarget(nativeEvent);
  // 派发事件的数组
  const dispatchQueue = [];
  extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
  console.log("dispatchQueue", dispatchQueue);
}

function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget,
  eventSystemFlags,
  targetContainer
) {
  SimpleEventPlugin.extractEvents(
    dispatchQueue,
    domEventName,
    targetInst,
    nativeEvent,
    nativeEventTarget,
    eventSystemFlags,
    targetContainer
  );
}

export function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  isCapturePhase
) {
  const captureName = reactName + "Capture";
  const reactEventName = isCapturePhase ? captureName : reactName;
  const listeners = [];
  let instance = targetFiber;
  while (instance !== null) {
    const { stateNode, tag } = instance;
    if (tag === HostComponent && stateNode !== null) {
      if (reactEventName !== null) {
        const listener = getListener(instance, reactEventName);
        if (listener) {
          listeners.push(listener);
        }
      }
    }
    instance = instance.return;
  }
  return listeners;
}
