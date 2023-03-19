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
  return root;
}
