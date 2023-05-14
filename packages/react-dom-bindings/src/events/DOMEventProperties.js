import { registerTwoPhaseEvent } from "./EventRegistry";
// 简单事件列表
const simpleEventPluginEvents = [
  "abort",
  "auxClick",
  "cancel",
  "canPlay",
  "canPlayThrough",
  "click",
  "close",
  "contextMenu",
  "copy",
  "cut",
  "drag",
  "dragEnd",
  "dragEnter",
  "dragExit",
  "dragLeave",
  "dragOver",
  "dragStart",
  "drop",
  "durationChange",
  "emptied",
  "encrypted",
  "ended",
  "error",
  "gotPointerCapture",
  "input",
  "invalid",
  "keyDown",
  "keyPress",
  "keyUp",
  "load",
  "loadedData",
  "loadedMetadata",
  "loadStart",
  "lostPointerCapture",
  "mouseDown",
  "mouseMove",
  "mouseOut",
  "mouseOver",
  "mouseUp",
  "paste",
  "pause",
  "play",
  "playing",
  "pointerCancel",
  "pointerDown",
  "pointerMove",
  "pointerOut",
  "pointerOver",
  "pointerUp",
  "progress",
  "rateChange",
  "reset",
  "resize",
  "seeked",
  "seeking",
  "stalled",
  "submit",
  "suspend",
  "timeUpdate",
  "touchCancel",
  "touchEnd",
  "touchStart",
  "volumeChange",
  "scroll",
  "toggle",
  "touchMove",
  "waiting",
  "wheel",
];
// 原生事件名映射React事件名
export const topLevelEventsToReactNames = new Map();

function registerSimpleEvent(domEventName, reactName) {
  // 把原生事件名和处理函数的名字进行映射或者绑定，click => onClick
  topLevelEventsToReactNames.set(domEventName, reactName);
  registerTwoPhaseEvent(reactName, [domEventName]);
}

export function registerSimpleEvents() {
  for (let i = 0; i < simpleEventPluginEvents.length; i++) {
    const eventName = simpleEventPluginEvents[i];
    const domEventName = eventName.toLowerCase();
    // 首字符大写事件名
    const capitalizeEvent = eventName[0].toUpperCase() + eventName.slice(1);
    // 注册事件
    registerSimpleEvent(domEventName, `on${capitalizeEvent}`);
  }
}
