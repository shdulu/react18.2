import { MutationMask, Placement } from "./ReactFiberFlags";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

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

function commitPlacement() {}

/**
 * 遍历fiber树，执行fiber上的副作用
 *
 * @export
 * @param {*} finishedWork fiber树
 * @param {*} root 根节点
 */
export function commitMutationEffectsOnFiber(finishedWork, root) {
  switch (finishedWork.tag) {
    case HostRoot:
    case HostComponent:
    case HostText:
      // 先遍历它们的子节点，处理它们的子节点上的副作用
      recursivelyTraverseMutationEffects(root, finishedWork);
      // 在处理自己身上的副作用
      commitReconciliationEffects(finishedWork);
      break;
    default:
      break;
  }
}
