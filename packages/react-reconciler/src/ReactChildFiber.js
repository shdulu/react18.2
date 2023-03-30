import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { createFiberFromElement } from "./ReactFiber";
import { Placement } from "./ReactFiberFlags";
/**
 *
 *
 * @param {*} shouldTrackSideEffects 是否更新副作用
 */
function createChildReconciler(shouldTrackSideEffects) {
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
    if(shouldTrackSideEffects) {
      // 需要添加副作用 - 插入操作
      // 要在最后的提交阶段插入此节点
      // React 的渲染分成 渲染(创建fiber树)和提交（更新真实DOM）两个阶段
      newFiber.flags |= Placement
    }
    return newFiber
  }
  /**
   *
   *
   * @param {*} returnFiber 新的父fiber
   * @param {*} currentFirstFiber
   * @param {*} newChild
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
  }
  return reconcileChildFibers;
}

export const mountChildFibers = createChildReconciler(false);
export const reconcileChildFibers = createChildReconciler(true);
