// Lane values below should be kept in sync with getLabelForLane(), used by react-devtools-timeline.
// If those values are changed that package should be rebuilt and redeployed.

export const TotalLanes = 31;

export const NoLanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane = /*                          */ 0b0000000000000000000000000000000;
export const SyncHydrationLane = /*               */ 0b0000000000000000000000000000001;
export const SyncLane = /*                        */ 0b0000000000000000000000000000010;
export const InputContinuousHydrationLane = /*    */ 0b0000000000000000000000000000100;
export const InputContinuousLane = /*             */ 0b0000000000000000000000000001000;
export const DefaultHydrationLane = /*            */ 0b0000000000000000000000000010000;
export const DefaultLane = /*                     */ 0b0000000000000000000000000100000;
export const SyncUpdateLanes = /*                */ 0b0000000000000000000000000101010;
const RetryLane1 = /*                             */ 0b0000000100000000000000000000000;
export const SomeRetryLane = RetryLane1;
export const SelectiveHydrationLane = /*          */ 0b0001000000000000000000000000000;
export const IdleHydrationLane = /*               */ 0b0010000000000000000000000000000;
export const IdleLane = /*                        */ 0b0100000000000000000000000000000;
export const OffscreenLane = /*                   */ 0b1000000000000000000000000000000;

const NonIdleLanes = /*                          */ 0b0001111111111111111111111111111;

/**
 *
 *
 * @export
 * @param {*} root
 * @param {*} updateLane
 */
export function markRootUpdated(root, updateLane) {
  // pendingLanes 指此根上等待生效的lane
  root.pendingLanes |= updateLane;
}

export function getNextLanes(root) {
  // 获取根上所有有更新的车道
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }
  const nextLanes = getHighestPriorityLanes(pendingLanes);
  return nextLanes;
}

function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes);
}

// 32 位二进制找到最右侧的 1 - 只能返回一个车道
export function getHighestPriorityLane(lanes) {
  return lanes & -lanes;
}

/**
 * 非空闲工作
 *
 * @export
 * @param {*} lane
 * @return {*} 
 */
export function includesNonIdleWork(lane) {
  return (lane & NonIdleLanes) !== NoLanes;
}
