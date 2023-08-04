import {
  DefaultLane,
  InputContinuousLane,
  NoLane,
  SyncLane,
  IdleLane,
  getHighestPriorityLane,
  includesNonIdleWork,
} from "./ReactFiberLane";

export const DiscreteEventPriority = SyncLane; // 2
// 连续事件的优先级 mousemove
export const ContinuousEventPriority = InputContinuousLane; // 8
// 默认事件车道
export const DefaultEventPriority = DefaultLane; // 32
// 离散事件优先级 chick onchange
// 空闲事件优先级
export const IdleEventPriority = IdleLane; // 2^29

let currentUpdatePrioyity = NoLane;

// 获取当前的更新事件优先级
export function getCurrentUpdatePriority() {
  return currentUpdatePrioyity;
}

export function setCurrentUpdatePriority(newPriority) {
  currentUpdatePrioyity = newPriority;
}

export function isHigherEventPriority(eventPriority, lane) {
  return eventPriority !== 0 && eventPriority < lane;
}

/**
 * 把lane车道转成事件优先级
 * 事件优先级有4个
 *
 * @export
 * @param {*} lanes
 * @return {*}
 */
export function lanesToEventPriority(lanes) {
  // 获取最高优先级的lane
  let lane = getHighestPriorityLane(lanes);

  if (!isHigherEventPriority(DiscreteEventPriority, lane)) {
    return DiscreteEventPriority; // 2
  }
  if (!isHigherEventPriority(ContinuousEventPriority, lane)) {
    return ContinuousEventPriority; // 8
  }
  if (includesNonIdleWork(lane)) {
    return DefaultEventPriority; // 32
  }
  return IdleEventPriority; // 536870912
}
