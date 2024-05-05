const root = document.getElementById("root");

listenToAllSupportedEvents(root);

function listenToAllSupportedEvents(root) {
  const allNativeEvents = ["click", "foucs"];
  allNativeEvents.forEach((domEventName) => {
    listenToNativeEvent(domEventName, true, root);
    listenToNativeEvent(domEventName, false, root);
  });
}

function listenToNativeEvent(domEventName, isCapture, target) {
  const eventSystemFlags = isCapture ? 4 : 0;
  const listener = createEventListerWrapperWithPriority(
    target,
    domEventName,
    eventSystemFlags,
    isCapture
  );

  // 给容器注册监听原生事件
  if (isCapture) {
    target.addEventListener(domEventName, listener, true);
  } else {
    target.addEventListener(domEventName, listener, false);
  }
}

function createEventListerWrapperWithPriority(
  target,
  domEventName,
  eventSystemFlags,
  isCapture
) {
  const listenerWrapper = dispatchEvent;
  return listenerWrapper.bind(null, domEventName, eventSystemFlags, target);
}

// 当root容器冒泡或者捕获阶段触发到监听事件的时候执行此事件
function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  const nativeEventTarget =
    nativeEvent.target || nativeEvent.srcElement || window;
  // 从真实dom节点获取对应的fiber节点
  // const targetInst = getClosestInstanceFromNode();
  console.log("dispatchEvent", eventSystemFlags, nativeEventTarget);
  dispatchEventForPluginEventSystem();
}

function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst,
  target
) {
  // 
}
