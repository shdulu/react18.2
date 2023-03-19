import { createFiberRoot } from "./ReactFiberRoot";
/**
 * 调用 createFiberRoot 函数创建 FiberRootNode
 *
 * @export
 * @param {Container} containerInfo div#root
 * @return {FiberRootNode}
 */
export function createContainer(containerInfo) {
  return createFiberRoot(containerInfo);
}
