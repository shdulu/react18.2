import { createHostRootFiber } from "./ReactFiber";
import { initializeUpdateQueue } from "./ReactFiberClassUpdateQueue";
import { NoLanes, NoLane, createLaneMap, NoTimestamp } from "./ReactFiberLane";

function FiberRootNode(containerInfo) {
  this.containerInfo = containerInfo; // div#root
  // 表示此根上有那些车道等待被处理
  this.pendingLanes = NoLanes;
  this.current = null;
  this.finishedWork = null;
  this.callbackNode = null;
  this.callbackPriority = NoLane;
  // 过期时间存放每个赛道过期时间
  this.expirationTimes = createLaneMap(NoTimestamp);
  // 过期的赛道
  this.expiredLanes = NoLanes;
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
  // FiberRootNode 的实例 div#root
  const root = new FiberRootNode(containerInfo);
  // 创建div#root 对应的 fiber根节点 HostRootFiber
  const uninitializedFiber = createHostRootFiber();
  // div#root根容器的current指向根节点fiber
  root.current = uninitializedFiber;
  // 根节点fiber的stateNode属性指向，指向FiberRootNode真实DOM
  uninitializedFiber.stateNode = root;

  // 给fiber添加更新队列
  initializeUpdateQueue(uninitializedFiber);
  return root;
}
