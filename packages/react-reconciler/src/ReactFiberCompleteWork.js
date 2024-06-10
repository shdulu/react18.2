import {
  HostComponent,
  HostRoot,
  HostText,
  FunctionComponent,
} from "./ReactWorkTags";
import {
  createTextInstance,
  createInstance,
  appendInitialChild,
  finalizeInitialChildren,
  prepareUpdate,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { NoFlags, Ref, Update } from "./ReactFiberFlags";
import { NoLanes, mergeLanes } from "./ReactFiberLane";
import logger, { indent } from "shared/logger";

function markRef(workInProgress) {
  workInProgress.flags |= Ref;
}

/**
 * 这里有点绕需要理解
 * 把当前完成的fiber所有的子节点对应的真实DOM都挂载到自己父parent真实dom上
 *
 * @param {*} parent 当前完成的fiber真实dom节点
 * @param {*} workInProgress 完成的fiber
 */
function appendAllChildren(parent, workInProgress) {
  let node = workInProgress.child;
  while (node) {
    // 处理原生节点或者文本节点
    if (node.tag === HostComponent || node.tag === HostText) {
      appendInitialChild(parent, node.stateNode);
    } else if (node.child !== null) {
      // 如果第一个儿子不是一个原生节点，说明它可能是一个函数组件节点
      node = node.child;
      continue;
    }
    if (node === workInProgress) return;
    // 当前节点没有弟弟 - 找叔叔
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return; // 循环结束
      }
      node = node.return; // 回到父节点
    }
    node = node.sibling; // 找父节点的 弟弟节点
  }
}

function markUpdate(workInProgress) {
  // 给当前的fiber添加更新的副作用
  workInProgress.flags |= Update;
}

/**
 * 在fiber的完成阶段准备更新DOM
 * 更新阶段执行，
 *
 * @param {*} current button的老fiber
 * @param {*} workInProgress button的新fiber
 * @param {*} type 类型
 * @param {*} newProps 新属性
 */
function updateHostComponent(current, workInProgress, type, newProps) {
  const oldProps = current.memoizedProps; // 老的属性
  const instance = workInProgress.stateNode; // 老的dom节点
  // 比较新老属性收集属性的差异 - 返回差异属性的数组
  ;
  const updatePayload = prepareUpdate(instance, type, oldProps, newProps);
  // 让原生组件的新fiber更新队列等于

  // 原生組件的更新队列是一个成对的数组列表
  // [
  //   "id",
  //   1717295876085,
  //   "onClick",
  //   () => {...},
  //   "children",
  //   6,
  //   "style",
  //   {
  //     color: "red",
  //   },
  // ];

  workInProgress.updateQueue = updatePayload;
  if (updatePayload) {
    // 如果有更新队列给fiber打Update标记!!!
    // 这里给变化的dom加上副作用标识 -> 在commit提交阶段修改dom
    markUpdate(workInProgress);
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
    case HostRoot:
      bubbleProperties(workInProgress);
      break;
    // 原生节点类型
    case HostComponent:
      // 创建真实的DOM节点
      const { type } = workInProgress;
      if (current !== null && workInProgress.stateNode !== null) {
        // 如果老fiber存在且老fiber上有真实DOM节点，要走节点更新逻辑
        updateHostComponent(current, workInProgress, type, newProps);
        if (current.ref !== workInProgress.ref) {
          // 新老ref不相同，添加Ref副作用
          markRef(workInProgress);
        }
      } else {
        const instance = createInstance(type, newProps, workInProgress);
        // 初次渲染子节点是没有副作用的
        // 没有老节点: 初次渲染把自己所有的儿子都添加到自己身上
        appendAllChildren(instance, workInProgress);
        workInProgress.stateNode = instance;
        finalizeInitialChildren(instance, type, newProps);
        if (workInProgress.ref !== null) {
          // 添加Ref副作用
          markRef(workInProgress);
        }
      }
      bubbleProperties(workInProgress);
      break;
    case FunctionComponent:
      bubbleProperties(workInProgress);
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
  let newChildLanes = NoLanes;
  let subtreeFlags = NoFlags;
  let child = completedWork.child;
  // 遍历当前fiber的子节点，把所有子节点的副作用，以及子节点的子节点的副作用全部合并起来
  while (child !== null) {
    newChildLanes = mergeLanes(
      newChildLanes,
      mergeLanes(child.lanes, child.childLanes)
    );
    subtreeFlags |= child.subtreeFlags;
    subtreeFlags |= child.flags;
    child = child.sibling;
  }
  // TODO 这里和源码实现不一样注意
  completedWork.childLanes = newChildLanes;
  completedWork.subtreeFlags = subtreeFlags; // 子节点副作用收集
}
