import { createFiberRoot } from "./ReactFiberRoot";
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import {
  scheduleUpdateOnFiber,
  requestUpdateLane,
  requestEventTime,
} from "./ReactFiberWorkLoop";

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
 * @param {ReactNodeList} element render -> 虚拟DOM
 * @param {*} container DOM容器 FiberRootNode实例
 */
export function updateContainer(element, container) {

  debugger
  // 获取当前根fiber
  const current = container.current;
  
  // 请求一个更新的车道
  const lane = requestUpdateLane(current);
  // 创建更新
  const update = createUpdate(lane);
  // 要更新的虚拟DOM
  update.payload = { element };
  // 把此更新对象添加到current这个根Fiber的更新队列上
  // 更新入队
  const root = enqueueUpdate(current, update, lane);
  if (root !== null) {
    const eventTime = requestEventTime();
    // 初始挂载阶段 调度 更新fiber
    scheduleUpdateOnFiber(root, current, lane, eventTime);
  }
}
