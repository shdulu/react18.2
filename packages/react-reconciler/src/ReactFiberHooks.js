import { dispatchEvent } from "react-dom-bindings/src/events/ReactDOMEventLister";
import ReactSharedInternals from "shared/ReactSharedInternals";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null; // 当前正在渲染中的fiber
let workInProgressHook = null; //

let currentHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
};
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
};

/**
 * 构建新的hooks
 *
 */
function updateWorkInProgressHook() {
  // 获取将要构建的新的hook的老hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  // 根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

function updateReducer(reducer, initialArg) {
  // 根据老的hook获取新的hook
  const hook = updateWorkInProgressHook();
  // 获取新的hook的更新队列
  const queue = hook.queue;
  // 获取老的hook
  const current = currentHook;
  // 获取将要生效的更新队列
  const pendingQueue = queue.pending;
  // 初始化一个新的状态，取值为当前的状态
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    do {
      const action = update.action;
      newState = reducer(newState, action);
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

/**
 * useReducer hooks 执行实际执行此函数
 *
 * @param {*} reducer reducer -> useReducer 执行的action函数
 * @param {*} initialArg 初始默认值
 * @return {*}
 */
function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    // 当前hooks的更新队列
    pending: null,
    dispatch: null,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新
 *
 * @param {*} fiber Function 对用的fiber
 * @param {*} queue hook 对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  // debugger;
  // 更新会在每个hook里存放一个更新队列，更新队列是一个更新对象的循环链表
  const update = {
    action, // 更新动作 {type: 'add', payload: 1}
    next: null,
  };
  // 1. 把当前最新的更新对象添加到更新队列中，并且返回当前的根fiber节点,
  // 2.入队并发的hook更新
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

/**
 * 挂载构建中的hook
 *
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, // hook的状态 - 指向链表头
    queue: null, // 存放本hook的更新队列 构成一个双向循环链表 queue.pending=update
    next: null, // 指向下一个hook，一个函数里面可能会有多个hook，它们会组成一个单向链表
  };
  // 构建一个单向循环链表
  if (workInProgressHook === null) {
    // 当前函数对应的fiber的状态memoizedState 指向hooks链表中的第一个
    // 函数组件的memoizedState属性存的是hook的单链表
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

/**
 * 渲染函数组件
 *
 * @export
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress; // 当前正在执行的fiber
  // React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  if (current !== null && current.memoizedState !== null) {
    // 如果有老的fiber，并且有老的hook链表 - 更新
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // - 初次挂载
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }

  // 需要在函数组件执行前给 ReactCurrentDispatcher.current 赋值
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  return children;
}
