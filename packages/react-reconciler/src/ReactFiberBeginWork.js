import logger, { indent } from "shared/logger";
import {
  HostRoot,
  HostComponent,
  HostText,
  IndeterminateComponent,
  FunctionComponent,
} from "./ReactWorkTags";
import { processUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { shouldSetTextContent } from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { renderWithHooks } from "./ReactFiberHooks";

/**
 * 根据新的虚拟DOM生成新的Fiber链表
 *
 * @param {*} current 老的父Fiber
 * @param {*} workInProgress 新的
 * @param {*} nextChildren 新的子虚拟DOM
 */
function reconcileChildren(current, workInProgress, nextChildren) {
  if (current === null) {
    // 没有老Fiber, 说明此fiber是新创建的 - 挂载子Fiber
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 如果没有老Fiber话，做DOM-DIFF 拿老的子fiber链表和新的子虚拟DOM进行比较，进行最小化的更新
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

function updateHostRoot(current, workInProgress) {
  // 需要知道它的子虚拟DOM，知道它的儿子的虚拟DOM信息
  processUpdateQueue(workInProgress); // workInProgress.memoizedState={element}
  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  // 根据新的虚拟DOM生成子fiber链表
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child; // child -> element 对应的fiber
}
/**
 * 构建原生组件的fiber链表
 *
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 */
function updateHostComponent(current, workInProgress) {
  const { type } = workInProgress;
  const nextProps = workInProgress.pendingProps;
  let nextChildren = nextProps.children;
  // 判断当前虚拟DOM它的儿子是不是一个文本的独生子
  const isDirectTextChild = shouldSetTextContent(type, nextProps);
  if (isDirectTextChild) {
    nextChildren = null;
  }
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

/**
 * 挂载函数组件
 *
 * @export
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件类型 也就是函数组件的定义
 */
export function mountIndeterminateComponent(
  current,
  workInProgress,
  Component
) {
  const props = workInProgress.pendingProps;
  const value = renderWithHooks(current, workInProgress, Component, props); // 函数组件的返回
  workInProgress.tag = FunctionComponent;
  reconcileChildren(current, workInProgress, value);
  return workInProgress.child;
}

/**
 * 根据虚拟DOM构建新的fiber链表 child .sibling
 *
 * @export
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的fiber
 * @return {*}
 */
export function beginWork(current, workInProgress) {
  logger(" ".repeat(indent.number) + "beginWork", workInProgress);
  indent.number += 2;
  switch (workInProgress.tag) {
    case HostRoot: // 根节点类型
      return updateHostRoot(current, workInProgress);
    case HostComponent: // 原生节点类型
      return updateHostComponent(current, workInProgress);
    case IndeterminateComponent:
      debugger
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type
      );
    case HostText:
      return null;
    default:
      return null;
  }
}
