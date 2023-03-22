import { createFiberRoot } from "./ReactFiberRoot";
import { createUpdate } from "./ReactFiberClassUpdateQueue";
import { markUpdateLaneFromFiberToRoot } from './' 
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

/**
 * 更新容器，把虚拟dom element变成真实DOM插入到container容器中
 *
 * @export
 * @param {*} element 虚拟DOM
 * @param {*} container DOM容器 FiberRootNode实例
 */
export function updateContainer(element, container) {
  // 获取当前根fiber
  const current = container.current;
  // 创建更新
  const update = createUpdate();
  // 要更新的虚拟DOM
  update.payload = { element };
  // 把此更新对象添加到current这个根Fiber的更新队列上

  // 更新入队
  const root = enqueueUpdate(current, update);
  debugger;
  return markUpdateLaneFromFiberToRoot()
  //
}
