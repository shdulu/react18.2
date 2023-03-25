import { HostRoot } from "./ReactWorkTags";

// 并发更新 - 处理更新优先级
export function markUpdateLaneFromFiberToRoot(sourceFiber) {
  let parent = sourceFiber.return; // 当前fiber的夫fiber
  let node = sourceFiber; // 当前fiber
  while (parent !== null) {
    // 一直找到parent为null --> HostRootFiber
    node = parent;
    parent = parent.return;
  }
  if (node.tag === HostRoot) {
    return node.stateNode; // FiberRootNode
  }
  return null;
}
