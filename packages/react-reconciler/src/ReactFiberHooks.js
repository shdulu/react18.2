import ReactSharedInternals from "shared/ReactSharedInternals";

const { ReactCurrentDispatcher } = ReactSharedInternals;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
};

function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  return [initialArg];
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
  ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  // 需要在函数组件执行前给 ReactCurrentDispatcher.current 赋值
  const children = Component(props);
  return children;
}
