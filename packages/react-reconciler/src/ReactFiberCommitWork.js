import {
  appendChild,
  insertBefore,
  commitUpdate,
  removeChild,
} from "react-dom-bindings/src/client/ReactDOMHostConfig";
import {
  MutationMask,
  Passive,
  Placement,
  Update,
  LayoutMask,
  Ref,
} from "./ReactFiberFlags";
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from "./ReactHookEffectTags";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./ReactWorkTags";

let HostParent = null;

/**
 * 递归遍历处理变更的副作用
 *
 * @param {*} root 根节点
 * @param {*} parentFiber 父fiber
 */
function recursivelyTraverseMutationEffects(root, parentFiber) {
  // 先执行需要删除的子节点副作用
  const deletions = parentFiber.deletions;
  if (deletions !== null) {
    // 父fiber有要删除的子fiber
    for (let i = 0; i < deletions.length; i++) {
      const childToDelete = deletions[i];
      commitDeletionEffects(root, parentFiber, childToDelete);
    }
  }
  // 在去处理剩下的子节点
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
    }
    // 检查此原生节点是否稳定可以放置
    if (!(node.flags & Placement)) {
      return node.stateNode;
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
  switch (finishedWork.tag) {
    case FunctionComponent: {
      // 先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 在处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      if (flags & Update) {
        commitHookEffectListUnmount(HookHasEffect | HookLayout, finishedWork);
      }
      break;
    }
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
      if (flags & Ref) {
        // 提交阶段如果有Ref副作用
        commitAttachRef(finishedWork);
      }
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

/**
 * 提交删除副作用
 *
 * @param {*} root 根节点
 * @param {*} returnFiber 父fiber
 * @param {*} deleteFiber 删除的fiber
 */
function commitDeletionEffects(root, returnFiber, deleteFiber) {
  let parent = returnFiber;
  // 一直向上找，找到真实DOM节点为止
  findParent: while (parent !== null) {
    switch (parent.tag) {
      case HostComponent:
        HostParent = parent.stateNode;
        break findParent; // 跳出findParent循环，非跳出switch
      case HostRoot: {
        HostParent = parent.stateNode.containerInfo;
        break findParent;
      }
      default:
        break;
    }
    parent = parent.return;
  }
  commitDeletionEffectsOnFiber(root, returnFiber, deleteFiber);
  HostParent = null;
}

/**
 *
 *
 * @param {*} finishedRoot
 * @param {*} nearestMountedAncestor 最近的真实dom节点的fiber
 * @param {*} deleteFiber
 */
function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deleteFiber
) {
  switch (deleteFiber.tag) {
    case HostComponent:
    case HostText:
      {
        // 当要删除一个节点的时候要先删除他的子节点，然后再把自己删除
        recursivelyTraverseDeletionEffects(
          finishedRoot,
          nearestMountedAncestor,
          deleteFiber
        );
        if (HostParent !== null) {
          removeChild(HostParent, deleteFiber.stateNode);
        }
      }
      break;

    default:
      break;
  }
}

/**
 *
 *
 * @param {*} finishedRoot
 * @param {*} nearestMountedAncestor
 * @param {*} parent
 */
function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent
) {
  let child = parent.child;
  while (child !== null) {
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, child);
    child = child.sibling;
  }
}

// useEffect 卸载
export function commitPassiveUnmountEffects(finishedWork) {
  commitPassiveUnmountOnFiber(finishedWork);
}
function commitPassiveUnmountOnFiber(finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    }
    case FunctionComponent: {
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      if (flags & Passive) {
        commitHookPassiveUnmountEffects(
          finishedWork,
          HookHasEffect | HookPassive // 1 | 8
        );
      }
      break;
    }
    default:
      break;
  }
}
// 深度优先递归
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveUnmountOnFiber(child);
      child = child.sibling;
    }
  }
}
function commitHookPassiveUnmountEffects(finishedWork, hookFlags) {
  commitHookEffectListUnmount(hookFlags, finishedWork);
}

function commitHookEffectListUnmount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      // 如果此effect类型和传入的相同，都是9 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        const destory = effect.destory;
        if (destory !== undefined) {
          // unmount 阶段如果存在destory那么就执行
          destory();
        }
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

/**
 *
 *
 * @export
 * @param {*} root 根节点
 * @param {*} finishedWork 根fiber
 */
export function commitPassiveMountEffects(root, finishedWork) {
  commitPassiveMountOnFiber(root, finishedWork);
}

function commitPassiveMountOnFiber(finishedRoot, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      break;
    }
    case FunctionComponent: {
      recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork);
      if (flags & Passive) {
        commitHookPassiveMountEffects(
          finishedWork,
          HookHasEffect | HookPassive // 1 | 8
        );
      }
      break;
    }
    default:
      break;
  }
}
/**
 * 深度优先的递归遍历
 *
 * @param {*} root
 * @param {*} parentFiber
 */
function recursivelyTraversePassiveMountEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & Passive) {
    let child = parentFiber.child;
    while (child !== null) {
      commitPassiveMountOnFiber(root, child);
      child = child.sibling;
    }
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}

function commitHookEffectListMount(flags, finishedWork) {
  const updateQueue = finishedWork.updateQueue;
  const lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;
  if (lastEffect !== null) {
    const firstEffect = lastEffect.next;
    let effect = firstEffect;
    do {
      // 如果此effect类型和传入的相同，都是9 HookHasEffect | PassiveEffect
      if ((effect.tag & flags) === flags) {
        // mount阶段 - 执行 create 返回 destory 存在effect上在 unmount阶段执行destory
        const create = effect.create;
        effect.destory = create();
      }
      effect = effect.next;
    } while (effect !== firstEffect);
  }
}

/**
 * 同步执行
 *
 * @export
 * @param {*} finishedWork
 * @param {*} root
 */
export function commitLayoutEffects(finishedWork, root) {
  const current = finishedWork.alternate;
  commitLayoutEffectOnFiber(root, current, finishedWork);
}
/**
 *
 *
 * @param {*} finishedRoot
 * @param {*} current
 * @param {*} finishedWork
 */
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  const flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case HostRoot: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    }
    case FunctionComponent: {
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & LayoutMask) {
        commitHookLayoutEffects(
          finishedWork,
          HookHasEffect | HookLayout // 1 | 4 执行有hasEffect 标识且有layout标识的副作用
        );
      }
      break;
    }
    default:
      break;
  }
}

function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & LayoutMask) {
    let child = parentFiber.child;
    while (child !== null) {
      const current = child.alternate;
      commitLayoutEffectOnFiber(root, current, child);
      child = child.sibling;
    }
  }
}

function commitHookLayoutEffects(finishedWork, hookFlags) {
  commitHookEffectListMount(hookFlags, finishedWork);
}

function commitAttachRef(finishedWork) {
  const ref = finishedWork.ref;
  if (ref !== null) {
    const instance = finishedWork.stateNode;
    // ref 属性可以接受一个函数，把instance实例作为参数传递
    if (typeof ref === "function") {
      ref(instance);
    } else {
      // ref 也可以接受一个属性，把 instance实例赋值给ref属性的current
      ref.current = instance;
    }
  }
}
