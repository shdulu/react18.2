import { createHostRootFiber } from "./ReactFiber";
import { initializeUpdateQueue } from "./ReactFiberClassUpdateQueue";

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo; // div#root
}
/**
 * 这里是真正的创建 FiberRootNode
 * fiber 根节点 本地就是 div#root 是一个真实的DDM 节点，与fiber无关
 *
 * @export
 * @param {Container} containerInfo
 * @return {FiberRootNode}
 */
export function createFiberRoot(containerInfo) {
  const root = new FiberRootNode(containerInfo);
  // 创建div#root 对应的 fiber根节点 HostRootFiber
  const uninitializedFiber = createHostRootFiber();
  // 根容器的current 指向当前的根fiber
  root.current = uninitializedFiber;
  // 根fiber的stateNode，也就是真实DOM节点指向FiberRootNode
  uninitializedFiber.stateNode = root;

  // 给fiber添加更新队列
  initializeUpdateQueue(uninitializedFiber);
  return root;
}
