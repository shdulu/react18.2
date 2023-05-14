import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { createFiberFromElement, createFiberFromText } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
import isArray from "shared/isArray";
/**
 *
 *
 * @param {*} shouldTrackSideEffects 是否更新副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
  /**
   *
   *
   * @param {*} returnFiber 父fiber节点
   * @param {*} currentFirstFiber
   * @param {*} element 子虚拟DOM
   * @return {Fiber} 
   */
  function reconcileSingleElement(returnFiber, currentFirstFiber, element) {
    // 因为我们实现的是初次挂载，老节点的currentFirstFiber 肯定是没有的，可以直接根据虚拟DOM创建新的Fiber
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
    if (shouldTrackSideEffects) {
      // 需要添加副作用 - 插入操作
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
   * @param {*} currentFirstFiber
   * @param {*} newChildren
   */
  function reconcileChildrenArray(returnFiber, currentFirstFiber, newChildren) {
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
    return resultingFirstChild
  }
  /**
   * 比较子fibers DOM-DIFF 就是用老的子fiber链表和新的虚拟DOM进行比较的过程
   *
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstFiber 老fiber第一个子fiber current一般指老的
   * @param {*} newChild 新的子虚拟DOM
   */
  function reconcileChildFibers(returnFiber, currentFirstFiber, newChild) {
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          // 返回新的fiber 并设置副作用
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstFiber, newChild)
          );

        default:
          break;
      }
    }
    // [hello 文本节点， span虚拟DOM元素]
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstFiber, newChild);
    }
    return null;
  }
  return reconcileChildFibers;
}

export const mountChildFibers = createChildReconciler(false);
export const reconcileChildFibers = createChildReconciler(true);
