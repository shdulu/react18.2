import {
  appendChild,
  insertBefore,
  commitUpdate
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import { MutationMask, Placement, Update } from "./ReactFiberFlags";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

function recursivelyTraverseMutationEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & MutationMask) {
    let { child } = parentFiber;
    while (child !== null) {
      commitMutationEffectsOnFiber(child, root);
      child = child.sibling;
    }
  }
}

function commitReconciliationEffects(finishedWork) {
  const { flags } = finishedWork;
  // 如果此fiber要执行插入操作的话
  if (flags & Placement) {
    // 进行插入操作，也就是把此fiber对应的真实DOM节点添加到父真实DOM节点上
    commitPlacement(finishedWork);
    // 把flags 里的Placement删除
    finishedWork.flags & ~Placement;
  }
}

function isHostParent(fiber) {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}

function getHostParentFiber(fiber) {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
}

/**
 * 把子节点对应的真实DOM插入到父节点DOM中
 *
 * @param {*} node 将要插入的fiber节点
 * @param {*} before
 * @param {*} parent 父真实DOM节点
 */
function insertOrAppendPlacementNode(node, before, parent) {
  const { tag } = node;
  // 判断此fiber对用的节点是否未真实dom节点
  const isHost = tag === HostComponent || tag === HostText;
  if (isHost) {
    // 如果是真实DOM节点类型的fiber 获取fiber的真实dom直接插入到父节点
    const { stateNode } = node;
    if (before) {
      // 插入到最近的弟弟真实DOM的前面
      insertBefore(parent, stateNode, before);
    } else {
      appendChild(parent, stateNode);
    }
  } else {
    // 如果不是真实dom节点类型fiber，获取大儿子，依次递归执行子节点的 dom插入操作
    const { child } = node;
    if (child !== null) {
      insertOrAppendPlacementNode(child, before, parent);
      let { sibling } = child;
      while (sibling !== null) {
        insertOrAppendPlacementNode(sibling, before, parent);
        sibling = sibling.sibling;
      }
    }
  }
}

/**
 * 找离fiber最近的真实DOM节点类型的弟弟，做为插入的锚点位置
 *
 * @param {Fiber} fiber
 */
function getHostSibling(fiber) {
  let node = fiber;
  siblings: while (true) {
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        // If we pop out of the root or hit the parent the fiber we are the
        // last sibling.
        return null;
      }
      node = node.return;
    }
    // node.sibling.return = node.return;
    node = node.sibling;
    // 如果弟弟不是原生节点也不是文本节点
    while (node.tag !== HostComponent && node.tag !== HostText) {
      // 如果此节点是一个将要插入的节点，找它的弟弟
      if (node.flags & Placement) {
        // If we don't have a child, try the siblings instead.
        continue siblings;
      } else {
        node = node.child;
      }
      if (!(node.flags & Placement)) {
        return node.stateNode;
      }
    }
  }
}

/**
 * 把此fiber的真实DOM插入到父DOM里
 *
 * @param {*} finishedWork
 */
function commitPlacement(finishedWork) {
  // 拿到finishedWork fiber 真实DOM的父fiber
  const parentFiber = getHostParentFiber(finishedWork);
  switch (parentFiber.tag) {
    case HostRoot: {
      const parent = parentFiber.stateNode.containerInfo;
      const before = getHostSibling(finishedWork); // 获取最近的真实DOM节点的弟弟
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    case HostComponent: {
      const parent = parentFiber.stateNode;
      const before = getHostSibling(finishedWork); // 获取最近的真实DOM节点的弟弟
      insertOrAppendPlacementNode(finishedWork, before, parent);
      break;
    }
    default:
      break;
  }
}

/**
 * 遍历fiber树，执行fiber上的副作用
 *
 * @export
 * @param {*} finishedWork fiber树
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  const current = finishedWork.alternate;
  const flags = finishedWork.flags;
  debugger
  switch (finishedWork.tag) {
    case FunctionComponent:
    case HostRoot:
    case HostText: {
      // 先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 在处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    }
    case HostComponent: {
      // 先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 在处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      // 处理DOM更新
      if (flags & Update) {
        // 获取真实DOM
        const instance = finishedWork.stateNode;
        if (instance !== null) {
          // 更新真实DOM
          const newProps = finishedWork.memoizedProps;
          const oldProps = current !== null ? current.memoizedProps : newProps;
          const type = finishedWork.type;
          const updatePayload = finishedWork.updateQueue;
          finishedWork.updateQueue = null;
          if (updatePayload) {
            // 更新队列里有值-提交更新
            debugger
            commitUpdate(
              instance,
              updatePayload,
              type,
              oldProps,
              newProps,
              finishedWork
            );
          }
        }
      }
      break;
    }
    default:
      break;
  }
}
