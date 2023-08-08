import { push, peek, pop } from "./SchedulerMinHeap";
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
} from "../SchedulerPriorities";

// 任务ID计数器
let taskIdCounter = 1;
// 任务最小堆
const taskQueue = [];
let scheduleHostCallback = null;
let startTime = -1;
let currentTask = null;
let currentPriorityLevel = NormalPriority;
// React 每一帧向浏览器申请5ms，用于自己任务的执行
// 如果5ms内没有完成，React也会放弃控制权，把控制权交还浏览器
const frameInterval = 5;

const channel = new MessageChannel();
var port2 = channel.port2;
var port1 = channel.port1;

port1.onmessage = performWorkUntilDeadline;

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Times out immediately
var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out 250 ms
var USER_BLOCKING_PRIORITY_TIMEOUT = 250;
// 正常优先级过期时间 5 s
var NORMAL_PRIORITY_TIMEOUT = 5000;
// 低优先级过期时间 10 s
var LOW_PRIORITY_TIMEOUT = 10000;
// Never times out
var IDLE_PRIORITY_TIMEOUT = maxSigned31BitInt;

/**
 * 按优先级执行任务
 *
 * @export
 * @param {*} priorityLevel
 * @param {*} callback
 */
function scheduleCallback(priorityLevel, callback) {
  // 获取开始执行当前时间
  const currentTime = getCurrentTime();
  // 此任务的开始时间
  const startTime = currentTime;
  let timeout; // 超时时间内高优先级优先执行，过了超时时间不能被打断执行
  switch (priorityLevel) {
    case ImmediatePriority:
      timeout = IMMEDIATE_PRIORITY_TIMEOUT; // -1
      break;
    case UserBlockingPriority:
      timeout = USER_BLOCKING_PRIORITY_TIMEOUT; // 250
      break;
    case IdlePriority:
      timeout = IDLE_PRIORITY_TIMEOUT; // 1073741823
      break;
    case LowPriority:
      timeout = LOW_PRIORITY_TIMEOUT; // 10000
      break;
    case NormalPriority:
    default:
      timeout = NORMAL_PRIORITY_TIMEOUT; // 5000
      break;
  }
  // 计算此任务的过期时间
  const expirationTime = startTime + timeout;
  const newTask = {
    id: taskIdCounter++, // 自增id
    callback, // 真正要执行的任务
    priorityLevel, // 任务优先级别
    startTime, // 任务开始时间
    expirationTime, // 任务过期时间
    sortIndex: -1, // 排序依赖
  };
  // 向最小堆里添加任务，排序的依据是过期时间
  // 队首的优先级最高
  newTask.sortIndex = expirationTime
  push(taskQueue, newTask); // [task1, task2, task3]
  requestHostCallback(workLoop);
  return newTask;
}

function cancelCallback(task) {
  console.log('cancelCallback..........')
  task.callback = null;
}

// /**
//  * 开始执行任务队列中的任务
//  *
//  * @param {*} startTime
//  */
// function flushWork(startTime) {
//   return workLoop(startTime);
// }

function requestHostCallback(callback) {
  // 先缓存回调函数
  scheduleHostCallback = callback;
  // 执行工作直到截止时间
  schedulePerformWorkUntilDeadline();
}

function schedulePerformWorkUntilDeadline() {
  port2.postMessage(null);
}

function shouldYieldToHost() {
  // 当前时间 - 开始时间就是过去了的时间
  const timeElapsed = getCurrentTime() - startTime;
  // 判断申请时间片是否过期
  if (timeElapsed < frameInterval) {
    return false;
  }
  // 过期放弃执行任务交还浏览器控制权
  return true;
}

/**
 *
 *
 * @param {*} startTime
 */
function workLoop(startTime) {
  let currentTime = startTime;
  currentTask = peek(taskQueue); // 取出任务最小堆中堆顶优先级最高的任务
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      // 如果此任务的过期事件小于当前时间，也就是说没有过期，并且需要放弃执行-申请的时间片到期了
      // 跳出工作循环
      // 如果任务过期了必须要执行不能跳出
      break;
    }
    // 取出当前任务中的回调函数 - performConcurrentWorkOnRoot()
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      currentTask.callback = null;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      const continuationCallback = callback(didUserCallbackTimeout);
      currentTime = getCurrentTime()
      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback;
        return true; // 还有任务要执行返回true
      }
      // 如果此任务已经完成则不需要继续执行了，可以把此任务弹出
      if (currentTask === peek(taskQueue)) {
        pop(taskQueue);
      }
    } else {
      pop(taskQueue);
    }
    // 如果当前的任务执行完了，或者当前任务不合法，取出下一个任务执行
    currentTask = peek(taskQueue);
  }
  // 如果循环结束还有未完成的任务，那就表示 hasMoreWork = true
  if (currentTask !== null) {
    return true;
    // 返回 ture  hasMoreWork- true 申请下一个时间片
  }
  return false;
}

function performWorkUntilDeadline() {
  if (scheduleHostCallback !== null) {
    // 先获取开始执行任务的时间
    // 本次申请时间片的开始时间
    startTime = getCurrentTime();
    // 是否有更多的工作要做
    let hasMoreWork = true;
    try {
      // 执行并判断有没有返回值
      hasMoreWork = scheduleHostCallback(startTime);
    } finally {
      // 执行完以后如果为true，说明还有更多工作要做
      if (hasMoreWork) {
        // 活没有干完，在申请一个时间片继续执行
        schedulePerformWorkUntilDeadline();
      } else {
        scheduleHostCallback = null;
      }
    }
  }
}

function getCurrentTime() {
  // https://developer.mozilla.org/zh-CN/docs/Web/API/Performance/now
  // 返回值表示为从time origin之后到当前调用时经过的时间
  // 自创建上下文以来经过的时间
  const hasPerformanceNow =
    typeof performance === "object" && typeof performance.now === "function";
  if (hasPerformanceNow) {
    return performance.now();
  } else {
    const localDate = Date;
    const initialTime = localDate.now();
    return localDate.now() - initialTime;
  }
}

// function getCurrentPriorityLevel() {
//   return currentPriorityLevel;
// }

export {
  cancelCallback as unstable_cancelCallback,
  scheduleCallback as unstable_scheduleCallback,
  shouldYieldToHost as unstable_shouldYield,
  ImmediatePriority as unstable_ImmediatePriority,
  UserBlockingPriority as unstable_UserBlockingPriority,
  NormalPriority as unstable_NormalPriority,
  LowPriority as unstable_LowPriority,
  IdlePriority as unstable_IdlePriority,
};
