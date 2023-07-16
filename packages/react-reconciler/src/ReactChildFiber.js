import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import isArray from "shared/isArray";
/**
 *
 *
 * @param {*} shouldTrackSideEffects 是否更新副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  function useFiber(fiber, pendingProps) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  /**
   *
   *
   * @param {*} returnFiber
   * @param {*} childToDelete
   */
  function deleteChild(returnFiber, childToDelete) {
    if (!shouldTrackSideEffects) return;
    const deletions = returnFiber.deletions;
    if (deletions === null) {
      returnFiber.deletions = [childToDelete];
      returnFiber.flags |= ChildDeletion; // 打上副作用标识 - 有子节点将要删除
    } else {
      returnFiber.deletions.push(childToDelete);
    }
  }

  /**
   * 删除从currentFirstChild之后所有的fiber节点
   *
   * @param {*} returnFiber
   * @param {*} currentFirstChild
   * @return {*}
   */
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return;
    let childToDelete = currentFirstChild;
    while (childToDelete !== null) {
      deleteChild(returnFiber, childToDelete);
      childToDelete = childToDelete.sibling;
    }
    return null;
  }

  /**
   * 协调单元素
   *
   * @param {*} returnFiber 根fiber div#root 对应的fiber
   * @param {*} currentFirstChild
   * @param {*} element 新的虚拟DOM对象
   * @return {Fiber} 返回新的第一个子fiber
   */
  function reconcileSingleElement(returnFiber, currentFirstChild, element) {
    // 新的虚拟dom的key，也就是唯一标识
    debugger;
    const key = element.key;
    // 老的FunctionComponent 对应的fiber
    let child = currentFirstChild;
    while (child !== null) {
      // 1. 判断key是否相同: 判断此老fiber对用的key和新的虚拟dom对象的key是否一样
      if (child.key === key) {
        // 2. 判断老fiber对应得类型和新虚拟dom元素对用的类型是否相同
        if (child.type === element.type) {
          deleteRemainingChildren(returnFiber, child.sibling);
          // 如果key一样，类型也一样，则认为此节点可以复用, 删除其他子节点,复用此节点
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          // 如果找到了key一样类型不一样，不能复用此老fiber，把剩下的全部删除
          deleteRemainingChildren(returnFiber, child);
        }
      } else {
        // key 不同删除老的fiber
        deleteChild(returnFiber, child);
      }
      child = child.sibling;
    }

    // 因为我们实现的是初次挂载，老节点的currentFirstChild 肯定是没有的，可以直接根据虚拟DOM创建新的Fiber
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  /**
   * 设置副作用
   *
   * @param {*} newFiber
   * @return {*}
   */
  function placeSingleChild(newFiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      // 需要添加副作用且alternate为空 - 插入操作
      // 要在最后的提交阶段插入此节点
      // React 的渲染分成 渲染(创建fiber树)和提交（更新真实DOM）两个阶段
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  /**
   *
   *
   * @param {*} returnFiber
   * @param {*} newChild
   */
  function createChild(returnFiber, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      // 字符串或者数字创建文本节点fiber
      const created = createFiberFromText(`${newChild}`);
      created.return = returnFiber;
      return created;
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        default:
          break;
      }
    }
    return null;
  }

  function placeChild(newFiber, newIdx) {
    newFiber.index = newIdx;
    if (shouldTrackSideEffects) {
      // 如果一个fiber它的flags上有Placement, 说明此节点需要创建真实DOM并插入父容器中
      // 如果父fiber节点是初次挂载， shouldTrackSideEffects=false，不需要添加flags
      // 这种情况下会在完成阶段，把所有的子节点全部挂载在自己身上
      newFiber.flags |= Placement;
    }
  }
  /**
   *
   *
   * @param {*} returnFiber
   * @param {*} currentFirstChild
   * @param {*} newChildren
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    let resultingFirstChild = null; // 返回的第一个新儿子
    let previousNewFiber = null; // 上一个的一个新的fiber
    let newIdx = 0;
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(returnFiber, newChildren[newIdx]);
      if (newFiber === null) continue;
      placeChild(newFiber, newIdx);
      // 如果previousNewFiber=null，说明这是第一个fiber
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber; // 这个newFiber 就是大儿子
      } else {
        // 说明不是大儿子，就把这个newFiber添加上一个子节点的后面
        previousNewFiber.sibling = newFiber;
      }
      // 让newFiber成为最后一个或者说上一个子fiber
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }
  /**
   * 比较子fibers DOM-DIFF 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   *
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstChild 老fiber第一个子fiber current一般指老的
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstChild, newChild) {
    // 现在需要处理更新的逻辑，处理dom diff
    // 现在暂时只考虑新的节点
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          // 返回新的fiber 并设置副作用
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );

        default:
          break;
      }
    }
    // [hello 文本节点， span虚拟DOM元素]
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }
    return null;
  }
  return reconcileChildFibers;
}

export const mountChildFibers = createChildReconciler(false);
export const reconcileChildFibers = createChildReconciler(true);
