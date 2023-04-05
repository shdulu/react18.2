// fiber 的工作循环

import { scheduleCallback } from "../../scheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";

let workInProgress = null; // 正在构建中的fiber 树
// FiberRootNode.current 当前页面中的fiber 树

/**
 * 计划更新root
 * 任务调度功能
 *
 * @export
 * @param {*} root
 */
export function scheduleUpdateOnFiber(root, fiber) {
  // 确保调度执行root上的更新
  ensureRootIsScheduled(root);
}

function ensureRootIsScheduled(root) {
  // 告诉浏览器要执行 performConcurrentWorkOnRoot
  scheduleCallback(performConcurrentWorkOnRoot.bind(null, root));
}
/**
 * 根据虚拟DOM构建fiber，要创建真实的DOM节点，插入到容器
 * 执行root上的并发更新工作
 *
 * @param {*} root
 */
function performConcurrentWorkOnRoot(root) {
  // 第一次渲染以同步的方式渲染根节点，初次渲染的时候都是同步的
  renderRootSync(root);
}
function prepareFreshStack(root) {
  workInProgress = createWorkInProgress(root.current, null);
  console.log("workInProgress", workInProgress);
}

function renderRootSync(root) {
  // 开始构建fiber树
  prepareFreshStack(root);
  workLoopSync();
}
function workLoopSync() {
  // Perform work without checking if we need to yield between fiber.
  while (workInProgress !== null) {
    // 执行工作单元
    performUnitOfWork(workInProgress);
  }
}
/**
 * 执行一个工作单元
 *
 * @param {Fiber} unitOfWork
 */
function performUnitOfWork(unitOfWork) {
  // 获取新的fiber 对应的老fiber
  const current = unitOfWork.alternate;
  const next = beginWork(current, unitOfWork);
  // 完成当前fiber的子fiber链表构建后
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If this doesn't spawn new work, complete the current work.
    completeUnitOfWork(unitOfWork);
  } else {
    // 如果有子节点，就让子节点成为下一个工作单元
    workInProgress = next;
  }
}

function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate; // 对应的老fiber
    const returnFiber = completedWork.return; // 父fiber
    // 执行此fiber的完成工作，如果是原生组件的话就是创建真实的dom节点
    completeWork(current, completedWork);
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }
    // 如果没有弟弟，说明当前完成的就是父fiber的最后一个节点
    // 也就是一个父fiber所有的子fiber全部完成了
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}
