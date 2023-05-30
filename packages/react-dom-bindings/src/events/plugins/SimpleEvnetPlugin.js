import {
  registerSimpleEvents,
  topLevelEventsToReactNames,
} from "../DOMEventProperties";
import { IS_CAPTURE_PHASE } from "../EventSystemFlags";
import { accumulateSinglePhaseListeners } from "../DOMPluginEvnetSystem";
import { SyntheticMouseEvent } from "../SyntheticEvent";

/**
 * 把要执行的回调函数添加到dispatchQueue中
 *
 * @param {*} dispatchQueue 派发队列，里面放置我们的监听函数
 * @param {*} domEventName DOM事件名
 * @param {*} targetInst 目标fiber
 * @param {*} nativeEvent 原生事件
 * @param {*} nativeEventTarget 原生事件源
 * @param {*} eventSystemFlags 0 表示冒泡 4表示捕获
 * @param {*} targetContainer
 */
function extractEvents(
  dispatchQueue,
  domEventName,
  targetInst,
  nativeEvent,
  nativeEventTarget, // click => onClick
  eventSystemFlags,
  targetContainer
) {
  const reactName = topLevelEventsToReactNames.get(domEventName); // click => onClick
  let SyntheticEventCtor; // 合成事件的构造函数
  switch (domEventName) {
    case "click":
      SyntheticEventCtor = SyntheticMouseEvent;
      break;

    default:
      break;
  }

  const isCapturePhase = (eventSystemFlags & IS_CAPTURE_PHASE) !== 0;

  // 累加单阶段的监听函数
  const listeners = accumulateSinglePhaseListeners(
    targetInst,
    reactName,
    nativeEvent.type,
    isCapturePhase
  );
  // 如果有要执行的监听函数的话[onClickCapture, onClick]
  if (listeners.length > 0) {
    // new 合成事件的构造函数，创建合成事件的实例
    const event = new SyntheticEventCtor(
      reactName,
      domEventName,
      targetInst,
      nativeEvent.type,
      isCapturePhase
    );

    dispatchQueue.push({
      event, // 合成事件的实例
      listeners, // 监听函数的数组
    });
  }
  console.log("listeners", listeners);
}

export { registerSimpleEvents as registerEvents, extractEvents };
