import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

function resolveDispatcher() {
  // 函数执行前要给 current 赋值
  const dispatcher = ReactCurrentDispatcher.current;
  return dispatcher;
}
/**
 *
 *
 * @export
 * @param {*} reducer 处理函数，用于根据老状态和动作计算新状态
 * @param {*} initialArg 初始状态
 */
export function useReducer(reducer, initialArg) {
  ;
  // resolveDispatcher() 执行返回一个全局共享对象，在函数组件渲染阶段 renderWithHooks 函数中给这个变量赋值
  // dispatcher: {useReducer, useState, useEffect}
  const dispatcher = resolveDispatcher();

  // renderWithHooks执行给 -> ReactCurrentDispatcher.current 添加 useReducer属性
  // 调用useReducer实际是执行
  return dispatcher.useReducer(reducer, initialArg);
}

export function useState(initialState) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useState(initialState);
}

/**
 * 1. 执行组件的渲染，渲染的过程中会收集副作用effect
 * 2. 在提交阶段之后会开启一个新的 **宏任务** 执行create，如果create之前有销毁函数则先执行销毁函数
 * 3. 应用场景: DOM操作、添加定时器、调用接口、监控日志
 *
 * @export
 * @param {*} create
 * @param {*} deps
 */
export function useEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useEffect(create, deps);
}

export function useLayoutEffect(create, deps) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useLayoutEffect(create, deps);
}

export function useRef(initialValue) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useRef(initialValue);
}
