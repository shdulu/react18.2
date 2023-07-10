import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

function resolveDispatcher() {
  // 函数执行前要给 current 赋值
  return ReactCurrentDispatcher.current;
}
/**
 *
 *
 * @export
 * @param {*} reducer 处理函数，用于根据老状态和动作计算新状态
 * @param {*} initialArg 初始状态
 */
export function useReducer(reducer, initialArg) {
  const dispatcher = resolveDispatcher();
  // renderWithHooks执行给 -> ReactCurrentDispatcher.current 添加 useReducer属性
  // 调用useReducer实际是执行
  return dispatcher.useReducer(reducer, initialArg);
}

export function useState(reducer, initialArg) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(reducer, initialArg);
}
