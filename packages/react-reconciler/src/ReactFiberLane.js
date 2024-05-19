// Lane values below should be kept in sync with getLabelForLane(), used by react-devtools-timeline.
// If those values are changed that package should be rebuilt and redeployed.
import { allowConcurrentByDefault } from "shared/ReactFeatureFlags";

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

// 没有时间戳
export const NoTimestamp = -1;

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

/**
 * 清除已经计算过的过期车道的过期时间
 *
 * @export
 * @param {*} root
 * @param {*} remainingLanes
 */
export function markRootFinished(root, remainingLanes) {
  // pendingLanes 根上所有将要被渲染的车道
  // noLongerPendingLanes - 已经更新过的lane
  const noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  root.pendingLanes = remainingLanes;
  const expirationTimes = root.expirationTimes;
  let lanes = noLongerPendingLanes;
  while (lanes > NoLanes) {
    // 获取最左侧1的索引
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    expirationTimes[index] = NoTimestamp;
    lanes &= ~lane;
  }
}

/**
 *
 *
 * @export
 * @param {*} root
 * @param {*} wipLanes 当前正在渲染车道
 * @return {*}
 */
export function getNextLanes(root, wipLanes) {
  // 获取根上所有有更新的车道
  const pendingLanes = root.pendingLanes;
  if (pendingLanes === NoLanes) {
    return NoLanes;
  }
  // 获取root.pendingLanes 所有车道中最高优先级的车道
  const nextLanes = getHighestPriorityLanes(pendingLanes);
  if (wipLanes !== NoLane && wipLanes !== nextLanes) {
    // 判断新的车道优先级低于渲染中的车道，返回更高优先级的车道
    if (nextLanes >= wipLanes) {
      return wipLanes;
    }
  }
  return nextLanes;
}

function getHighestPriorityLanes(lanes) {
  return getHighestPriorityLane(lanes);
}

/**
 * 32 位二进制找到最右侧的 1 - 只能返回一个车道
 * 负数以一种 '二补数' 的二进制编码存储，通过一下步骤获取一个数值的二补数
 * 1. 确定绝对值的二进制表示
 * 2. 找到数值的 '一补数'，即每个0都变成1，每个1都变成0
 * 3. 给结果加1
 *
 * @export
 * @param {*} lanes
 * @return {*}
 */
export function getHighestPriorityLane(lanes) {
  // 拿到二补数进行按位与运算
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

export function isSubsetOfLanes(set, subset) {
  return (set & subset) === subset;
}

export function mergeLanes(a, b) {
  return a | b;
}

export function includesSyncLane(lanes) {
  return (lanes & (SyncLane | SyncHydrationLane)) !== NoLanes;
}

// 判断是否包含阻塞的车道
export function includesBlockingLane(root, lanes) {
  if (allowConcurrentByDefault) {
    // 如果允许默认赛道并发渲染
    return false;
  }
  const SyncDefaultLanes =
    InputContinuousHydrationLane |
    InputContinuousLane |
    DefaultHydrationLane |
    DefaultLane;
  return (lanes & SyncDefaultLanes) !== NoLanes;
}

export function includesExpiredLane(root, lanes) {
  return (lanes & root.expiredLanes) !== NoLanes;
}

/**
 * 把饿死的赛道标记为过期
 *
 * @export
 * @param {*} root
 * @param {*} currentTime
 */
export function markStarvedLanesAsExpired(root, currentTime) {
  // 获取当前有更新赛道
  const pendingLanes = root.pendingLanes;
  const expirationTimes = root.expirationTimes;
  let lanes = pendingLanes;
  while (lanes > NoLanes) {
    // 获取最左侧1的索引
    const index = pickArbitraryLaneIndex(lanes);
    const lane = 1 << index;
    const expirationTime = expirationTimes[index];
    // 如果此赛道上没有过期时间说明没有为此车道设置过期时间
    if (expirationTime === NoTimestamp) {
      expirationTimes[index] = computeExpirationTime(lane, currentTime);
    } else if (expirationTime <= currentTime) {
      // 把过期车道放到根节点过期车道属性里
      root.expiredLanes |= lane;
    }
    lanes &= ~lane;
  }
}

/**
 * 取最左侧1的索引
 *
 * @param {*} lanes
 * @return {*}
 */
function pickArbitraryLaneIndex(lanes) {
  // clz32 返回最左侧的1的左边0的个数
  return 31 - Math.clz32(lanes);
}

function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case SyncLane:
    case InputContinuousLane:
      return currentTime + 250;
    case DefaultLane:
      return currentTime + 5000;
    case IdleLane:
    default:
      return NoTimestamp;
  }
}

export function createLaneMap(initial) {
  const laneMap = [];
  for (let i = 0; i < TotalLanes; i++) {
    laneMap.push(initial);
  }
  return laneMap;
}
