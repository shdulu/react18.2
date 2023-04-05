import logger, { indent } from "shared/logger";
import { HostComponent, HostText } from "./ReactWorkTags";
import {
  createTextInstance,
  createInstance,
  appendInitialChild,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { NoFlags } from "./ReactFiberFlags";

/**
 * 把当前完成的fiber所有的子节点对应的真实DOM都挂载到自己父parent真实dom上
 *
 * @param {*} parent 当前完成的fiber真实dom节点
 * @param {*} workInProgress 完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    appendInitialChild(parent, node.stateNode);
    node = node.sibling;
  }
}

/**
 * 完成一个fiber 节点
 *
 * @export
 * @param {*} current 老fiber
 * @param {*} workInProgress 新的构建的fiber
 */
export function completeWork(current, workInProgress) {
  indent.number -= 2;
  logger(" ".repeat(indent.number) + "completeWork", workInProgress);
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    // 原生节点类型
    case HostComponent:
      // 创建真实的DOM节点
      const { type } = workInProgress;
      const instance = createInstance(type, newProps, workInProgress);
      workInProgress.stateNode = instance;
      // 初次渲染把自己所有的儿子都添加到自己身上
      appendAllChildren(instance, workInProgress);

      break;
    case HostText:
      // 如果是文本节点 - 创建真实的文本节点
      const newText = newProps;
      // 创建真实的DOM节点并赋值给stateNode属性
      workInProgress.stateNode = createTextInstance(newText);
      // 向上冒泡属性
      bubbleProperties(workInProgress);
      break;
    default:
      break;
  }
}

/**
 * 每当一个节点完成，需要冒泡收集此fiber节点的所有子节点的副作用
 * flags - 自己的副作用
 * subtreeFlags - 自己的儿子们的副作用
 * 目的是把副作用冒泡到根节点统一处理
 *
 * @param {*} completedWork 当前完成的fiber 节点
 */
function bubbleProperties(completedWork) {
  let subtreeFlags = NoFlags;
  let child = completedWork.child;
  // 遍历当前fiber的子节点，把所有子节点的副作用，以及子节点的子节点的副作用全部合并起来
  while (child !== null) {
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  completedWork.subtreeFlags = subtreeFlags; // 子节点副作用收集
}
