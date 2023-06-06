import { dispatchEvent } from "react-dom-bindings/src/events/ReactDOMEventLister";
import ReactSharedInternals from "shared/ReactSharedInternals";

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentRenderingFiber = null; // 当前正在渲染中的fiber
let workInProgressHook = null; //

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
};

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    pending: null,
  };
  hook.queue = queue;
  const dispatch = dispatchReducerAction.bind(
    null,
    currentRenderingFiber,
    queue
  );
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
  console.log(fiber, queue, action);
}

/**
 * 挂载构建中的hook
 *
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, // hook的状态
    queue: null, // 存放本hook的更新队列 构成一个双向循环链表
    next: null, // 指向下一个hook，一个函数里面可能会有多个hook，它们会组成一个循环链表
  };
  // 构建一个单向循环链表
  if (workInProgressHook === null) {
    // 当前函数对应的fiber的状态memoizedState 指向hooks链表中的第一个
    // 函数组件的memoizedState属性存的是hook的单链表
    currentRenderingFiber.memoizedState = workInProgressHook = hook;
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
  currentRenderingFiber = workInProgress; // 当前正在执行的fiber
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  // 需要在函数组件执行前给 ReactCurrentDispatcher.current 赋值
  const children = Component(props);
  return children;
}
