import getEventTarget from "./getEventTarget";
import { getClosestInstanceFromNode } from "../client/ReactDOMComponentTree";
import { dispatchEventForPluginEventSystem } from "./DOMPluginEvnetSystem";

import {
  // getCurrentPriorityLevel as getCurrentSchedulerPriorityLevel,
  IdlePriority as IdleSchedulerPriority,
  ImmediatePriority as ImmediateSchedulerPriority,
  LowPriority as LowSchedulerPriority,
  NormalPriority as NormalSchedulerPriority,
  UserBlockingPriority as UserBlockingSchedulerPriority,
} from "react-reconciler/src/Scheduler";

import {
  DiscreteEventPriority,
  ContinuousEventPriority,
  DefaultEventPriority,
  IdleEventPriority,
  setCurrentUpdatePriority,
  getCurrentUpdatePriority,
} from "react-reconciler/src/ReactEventPriorities";

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
  const listenerWrapper = dispatchDiscreteEvent;
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

/**
 * 事件代理的执行函数
 *
 * @param {*} domEventName 事件名 click
 * @param {*} eventSystemFlags 阶段 0冒泡 4捕获
 * @param {*} container 容器 div#root
 * @param {*} nativeEvent 原生事件
 */
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  // 在点击按钮的时候需要设置更新的优先级
  const previousPriority = getCurrentUpdatePriority();
  try {
    // 把当前更新优先级设置为离散事件优先级
    setCurrentUpdatePriority(DiscreteEventPriority);
    dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    setCurrentUpdatePriority(previousPriority);
  }
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

export function getEventPriority(domEventName) {
  switch (domEventName) {
    // Used by SimpleEventPlugin:
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    // Used by polyfills:
    // eslint-disable-next-line no-fallthrough
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    // Only enableCreateEventHandleAPI:
    // eslint-disable-next-line no-fallthrough
    case "beforeblur":
    case "afterblur":
    // Not used by React but could be by user code:
    // eslint-disable-next-line no-fallthrough
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return DiscreteEventPriority;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    // Not used by React but could be by user code:
    // eslint-disable-next-line no-fallthrough
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return ContinuousEventPriority;
    // case "message": {
    //   // We might be in the Scheduler callback.
    //   // Eventually this mechanism will be replaced by a check
    //   // of the current priority on the native scheduler.
    //   const schedulerPriority = getCurrentSchedulerPriorityLevel();
    //   switch (schedulerPriority) {
    //     case ImmediateSchedulerPriority:
    //       return DiscreteEventPriority;
    //     case UserBlockingSchedulerPriority:
    //       return ContinuousEventPriority;
    //     case NormalSchedulerPriority:
    //     case LowSchedulerPriority:
    //       return DefaultEventPriority;
    //     case IdleSchedulerPriority:
    //       return IdleEventPriority;
    //     default:
    //       return DefaultEventPriority;
    //   }
    // }
    default:
      return DefaultEventPriority;
  }
}
