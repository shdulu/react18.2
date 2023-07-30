import {
  DefaultLane,
  InputContinuousLane,
  NoLane,
  SyncLane,
  IdleLane,
} from "./ReactFiberLane";

export const DiscreteEventPriority = SyncLane; // 1
// 连续事件的优先级 mousemove
export const ContinuousEventPriority = InputContinuousLane; // 8
// 默认事件车道
export const DefaultEventPriority = DefaultLane; // 16
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
