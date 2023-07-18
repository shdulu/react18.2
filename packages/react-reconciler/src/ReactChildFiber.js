// DON-DIFF 相关

import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import {
  createFiberFromElement,
  createFiberFromText,
  createWorkInProgress,
} from "./ReactFiber";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import isArray from "shared/isArray";
import { HostText } from "./ReactWorkTags";
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

  /**
   * 把新fiber放到新索引的位置
   *
   * @param {*} newFiber
   * @param {*} lastPlacedIndex
   * @param {*} newIdx
   */
  function placeChild(newFiber, lastPlacedIndex, newIdx) {
    // 指定新的fiber在新的挂载索引
    newFiber.index = newIdx;
    if (!shouldTrackSideEffects) {
      return lastPlacedIndex;
    }
    // 获取老fiber
    const current = newFiber.alternate;
    if (current !== null) {
      const oldIndex = current.index;
      // 如果找到的老fiber的索引比lastPlacedIndex要小，则老fiber对应的dom节点需要移动
      if (oldIndex < lastPlacedIndex) {
        newFiber.flags |= Placement;
        return lastPlacedIndex;
      } else {
        return oldIndex;
      }
    } else {
      // 标记插入
      newFiber.flags |= Placement;
      return lastPlacedIndex;
    }
  }

  function updateElement(returnFiber, current, element) {
    const elementType = element.type;
    if (current !== null) {
      // 判断是否类型一样，则key和type都一样，可以复用老的fiebr和真实DOM
      if (current.type === elementType) {
        const existing = useFiber(current, element.props);
        existing.return = returnFiber;
        return existing;
      }
    }
    const created = createFiberFromElement(element);
    created.return = returnFiber;
    return created;
  }

  function updateSlot(returnFiber, oldFiber, newChild) {
    const key = oldFiber !== null ? oldFiber.key : null;
    if (newChild !== null && typeof newChild === "object") {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          // 如果key一样进入更新元素的逻辑
          if (newChild.key === key) {
            return updateElement(returnFiber, oldFiber, newChild);
          }
        }
        default:
          return null;
      }
    }
    return null;
  }

  /**
   * 子节点数组DOM-DIFF
   *
   * @param {*} returnFiber
   * @param {*} currentFirstChild
   * @param {*} newChildren
   */
  function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren) {
    debugger
    let resultingFirstChild = null; // 返回的第一个新儿子
    let previousNewFiber = null; // 上一个的一个新的fiber
    let newIdx = 0; // 用来遍历新的虚拟dom的索引
    let oldFiber = currentFirstChild; // 第一个老fiber
    let nextOldFiber = null; // 下一个
    let lastPlacedIndex = 0; // 上一个不需要移动的节点索引

    // 开始第一轮循环，如果老fiber有值，新的虚拟dom也有值
    for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
      // 先暂存下一了老fiber
      nextOldFiber = oldFiber.sibling;
      // 试图更新或者试图复用老fiber
      const newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx]);
      if (newFiber === null) {
        break;
      }
      if (shouldTrackSideEffects) {
        if (oldFiber && newFiber.alternate === null) {
          // 没有复用老fiber，创建出来的新fiber.需要删除老fiber，打上需要删除的标识，提交阶段会执行删除DOM的操作
          deleteChild(returnFiber, oldFiber);
        }
      }
      // 指定新fiber的位置
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    // 如果说新的虚拟dom已经循环完毕,遍历剩下的老fiber标记为删除，DIFF结束
    if (newIdx === newChildren.length) {
      deleteRemainingChildren(returnFiber, oldFiber);
      return resultingFirstChild;
    }
    if (oldFiber === null) {
      // 第二轮遍历
      // 如果老的fiber已经没有了，新的虚拟dom还有进入插入新节点的逻辑
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) continue;
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
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
    }

    // 开始处理移动的情况
    const existingChildren = mapRemainingChildren(returnFiber, oldFiber);
    // 开始遍历剩下的虚拟dom子节点
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = updateFromMap(
        existingChildren,
        returnFiber,
        newIdx,
        newChildren[newIdx]
      );
      if (newFiber !== null) {
        if (shouldTrackSideEffects) {
          if (newFiber.alternate !== null) {
            // 如果要跟踪副作用，并且有老fiber
            existingChildren.delete(
              newFiber.key === null ? newIdx : newFiber.key
            );
          }
        }
        // 指定新的fiber存放位置，并且给 lastPlacedIndex 赋值
        lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
        if (previousNewFiber === null) {
          resultingFirstChild = newFiber; // 这个newFiber 就是大儿子
        } else {
          // 说明不是大儿子，就把这个newFiber添加上一个子节点的后面
          previousNewFiber.sibling = newFiber;
        }
        // 让newFiber成为最后一个或者说上一个子fiber
        previousNewFiber = newFiber;
      }
    }
    if (shouldTrackSideEffects) {
      // 等全部处理完之后，删除map中所有剩下的老fiber
      existingChildren.forEach((child) => deleteChild(returnFiber, child));
    }
    return resultingFirstChild;
  }

  /**
   * 更新文本内容
   *
   * @param {*} returnFiber
   * @param {*} current
   * @param {*} textContent
   */
  function updateTextNode(returnFiber, current, textContent) {
    if (current === null || current.createWorkInProgress !== HostText) {
      const created = createFiberFromText(textContent);
      created.return = returnFiber;
      return created;
    } else {
      const existing = useFiber(current, textContent);
      existing.return = returnFiber;
      return existing;
    }
  }
  function updateFromMap(existingChildren, returnFiber, newIdx, newChild) {
    if (
      (typeof newChild === "string" && newChild !== "") ||
      typeof newChild === "number"
    ) {
      const matchedFiber = existingChildren.get(newIdx) || null;
      return updateTextNode(returnFiber, matchedFiber, "" + newChild);
    }
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const matchedFiber =
            existingChildren.get(
              newChild.key === null ? newIdx : newChild.key
            ) || null;
          return updateElement(returnFiber, matchedFiber, newChild);
        }
        default:
          break;
      }
    }
  }
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    const existingChildren = new Map();
    let existingChild = currentFirstChild;
    while (existingChild !== null) {
      if (existingChild.key !== null) {
        existingChildren.set(existingChild.key, existingChild);
      } else {
        existingChildren.set(existingChild.index, existingChild);
      }
      existingChild = existingChild.sibling;
    }
    return existingChildren;
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
