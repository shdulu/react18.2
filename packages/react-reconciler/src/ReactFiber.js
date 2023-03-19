import { HostRoot } from "./ReactWorkTags";
import { NoFlags } from "./ReactFiberFlags";

/**
 *
 *
 * @param {*} tag fiber的类型，函数组件0、类组件1、原生组件5、根元素3
 * @param {*} pendingProps 新属性，等待处理或者生效的属性
 * @param {*} key 唯一的标识
 */
function FiberNode(tag, pendingProps, key) {
  // Instance
  this.tag = tag;
  this.key = key;
  this.type = null; // fiber类型， 来自虚拟DOM节点的type
  // 虚拟DOM -> Fiber节点 -> 真实DOM
  this.stateNode = null; // 此fiber 对应的真是DOM节点

  // Fiber
  this.return = null; // 指向父节点
  this.child = null; // 指向第一个子节点
  this.sibling = null; // 指向弟弟节点

  // fiber 通过虚拟DOM节点创建，虚拟DOM会提供pendingProps用来创建fiber节点的属性，处理完成会赋值给memoizedProps
  this.pendingProps = pendingProps; // 等待生效的属性
  this.memoizedProps = null; // 已经生效的属性
  // fiber 状态属性，每个fiber都会有自己的状态，每一种fiber状态存在的类型不一样
  // 类组件对应的fiber 存的是类的实例状态
  // HostRoot存的是要渲染的元素
  this.memoizedState = null;
  this.updateQueue = null; // fiber 更新队列

  // Effects react18 新增
  this.flags = NoFlags; // 副作用标识，标识针对此fiber节点进行何种操作
  this.subtreeFlags = NoFlags; // 子节点副作用标识-性能优化
  // React 执行两个阶段 1. render计算副作用 2. commit提交副作用


  //   this.deletions = null;
  //   this.lanes = NoLanes;
  //   this.childLanes = NoLanes;

  // fiber轮替 - 双缓存DOM-DIFF
  // We use a double buffering pooling technique because we know that we'll
  // only ever need at most two versions of a tree. We pool the "other" unused
  // node that we're free to reuse. This is lazily created to avoid allocating
  // extra objects for things that are never updated. It also allow us to
  // reclaim the extra memory if needed.
  this.alternate = null;
}
function createFiber(tag, pendingProps, key) {
  return new FiberNode();
}
export function createHostRootFiber() {
  return createFiber(HostRoot, null, null);
}
