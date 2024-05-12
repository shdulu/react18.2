import ReactSharedInternals from "shared/ReactSharedInternals";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import {
  requestEventTime,
  requestUpdateLane,
  scheduleUpdateOnFiber,
} from "./ReactFiberWorkLoop";
import {
  Passive as PassiveEffect,
  Update as UpdateEffect,
} from "./ReactFiberFlags";
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
  Layout as HookLayout,
} from "./ReactHookEffectTags";
import { NoLanes, NoLane, mergeLanes, isSubsetOfLanes } from "./ReactFiberLane";

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null; // 当前正在渲染中的fiber
let workInProgressHook = null; //
let currentHook = null;
let renderLanes = NoLanes;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
  useLayoutEffect: mountLayoutEffect,
  useRef: mountRef,
};
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
  useLayoutEffect: updateLayoutEffect,
  useRef: updateRef,
};

function mountRef(initialValue) {
  const hook = mountWorkInProgressHook();
  const ref = {
    current: initialValue,
  };
  hook.memoizedState = ref;
  return ref;
}
function updateRef() {
  const hook = updateWorkInProgressHook();
  return hook.memoizedState;
}

function mountLayoutEffect(create, deps) {
  return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
}
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(UpdateEffect, HookLayout, create, deps);
}

/**
 * 构建新的hooks
 *
 */
function updateWorkInProgressHook() {
  // 获取将要构建的新的hook的老hook
  if (currentHook === null) {
    const current = currentlyRenderingFiber.alternate;
    currentHook = current.memoizedState;
  } else {
    currentHook = currentHook.next;
  }
  // 根据老hook创建新hook
  const newHook = {
    memoizedState: currentHook.memoizedState,
    queue: currentHook.queue,
    next: null,
  };
  if (workInProgressHook === null) {
    currentlyRenderingFiber.memoizedState = workInProgressHook = newHook;
  } else {
    workInProgressHook = workInProgressHook.next = newHook;
  }
  return workInProgressHook;
}

/**
 *
 *
 * @param {*} create
 * @param {*} deps
 */
function mountEffect(create, deps) {
  return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}
/**
 *
 *
 * @param {*} fiberFlags fiber标识 useEffect-2048、useLayoutEffect-4
 * @param {*} hookFlags hook标识 useEffect-8、useLayoutEffect-4
 * @param {*} create
 * @param {*} deps
 */
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = mountWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  // 给当前的函数组件fiber添加 1024-flags
  currentlyRenderingFiber.flags |= fiberFlags;
  // memoizedState 指向hook单向链表的头部
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    undefined,
    nextDeps
  );
}

function updateEffect(create, deps) {
  return updateEffectImpl(PassiveEffect, HookPassive, create, deps);
}
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  const hook = updateWorkInProgressHook();
  const nextDeps = deps === undefined ? null : deps;
  let destory;
  if (currentHook !== null) {
    const prevEffect = currentHook.memoizedState;
    destory = prevEffect.destory;
    if (nextDeps !== null) {
      const prevDeps = prevEffect.deps;
      // 对比新老依赖项 deps
      if (areHookInputEqual(nextDeps, prevDeps)) {
        // 不管要不要执行，都需要把新的effect组成完整的循环链表放到fiber.updateQueue
        hook.memoizedState = pushEffect(hookFlags, create, destory, nextDeps);
        return;
      }
    }
  }
  // 如果要执行要修改fiber的flags
  currentlyRenderingFiber.flags |= fiberFlags;
  // 如果要执行的话添加 HookHasEffect flags
  hook.memoizedState = pushEffect(
    HookHasEffect | hookFlags,
    create,
    destory,
    nextDeps
  );
}

/**
 * 对比新老数组是否一致
 *
 * @param {*} nextDeps
 * @param {*} prevDeps
 */
function areHookInputEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    return null;
  }
  for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    if (Object.is(nextDeps[i], prevDeps[i])) {
      continue;
    }
    return false;
  }
  return true;
}

/**
 * 构建 effect 循环链表
 *
 * @param {*} tag effect 的标签
 * @param {*} create 创建方法
 * @param {*} destory 销毁方法
 * @param {*} deps 依赖数组
 */
function pushEffect(tag, create, destory, deps) {
  const effect = {
    tag,
    create,
    destory,
    deps,
    next: null,
  };
  let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
  if (componentUpdateQueue === null) {
    // 更新队列为空 - 创建新的更新队列
    componentUpdateQueue = createFunctionComponentUpdateQueue();
    currentlyRenderingFiber.updateQueue = componentUpdateQueue;
    // 把effect对象 构成单向循环链表
    componentUpdateQueue.lastEffect = effect.next = effect;
  } else {
    const lastEffect = componentUpdateQueue.lastEffect;
    if (lastEffect === null) {
      componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
      // 已存在effect循环链表 - 把effect放到链表的尾
      const firstEffect = lastEffect.next;
      lastEffect.next = effect;
      effect.next = firstEffect;
      componentUpdateQueue.lastEffect = effect;
    }
  }
  return effect;
}
function createFunctionComponentUpdateQueue() {
  return {
    lastEffect: null,
  };
}

/**
 * mountState 针对state做了优化，如果新老state一样不需要更新
 *
 * @param {*} initialState
 * @return {*}
 */
function mountState(initialState) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = hook.baseState = initialState;
  const queue = {
    pending: null,
    dispatch: null,
    lastRenderedReducer: baseStateReducer, // 上一个reducer
    lastRenderedState: initialState, // 上一个state
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchSetstate.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

// useState 其实就是一个内置了reducer的useReducer
function baseStateReducer(state, action) {
  return typeof action === "function" ? action(state) : action;
}
function updateState(initialState) {
  return updateReducer(baseStateReducer, initialState);
}

function dispatchSetstate(fiber, queue, action) {
  // 获取当前的更新赛道 - 2
  const lane = requestUpdateLane();
  const update = {
    lane, // 本次更新优先级
    action,
    hasEagerState: false, // 是否有急切的更新
    eagerState: null, // 急切的更新状态
    next: null,
  };
  // 派发动作后，立刻用上一次的状态和上一次的reducer计算状态
  const alternate = fiber.alternate;
  if (
    fiber.lanes === NoLanes &&
    (alternate === null || alternate.lanes === NoLanes)
  ) {
    const { lastRenderedReducer, lastRenderedState } = queue;
    const eagerState = lastRenderedReducer(lastRenderedState, action);
    update.hasEagerState = true;
    update.eagerState = eagerState;
    if (Object.is(eagerState, lastRenderedState)) {
      return;
    }
  }
  // 正常情况下会先调度更新，然后才会计算新的状态
  // mountState -> 优化了这里先立刻计算了一次状态做一次对比,如果一样就不再调度更新
  // 入队更新，并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
  const eventTime = requestEventTime();
  scheduleUpdateOnFiber(root, fiber, lane, eventTime);
}

function updateReducer(reducer) {
  const hook = updateWorkInProgressHook();
  const queue = hook.queue;
  queue.lastRenderedReducer = reducer;
  const current = currentHook;
  let baseQueue = current.baseQueue;
  const pendingQueue = queue.pending;
  if (pendingQueue !== null) {
    if (baseQueue !== null) {
      const baseFirst = baseQueue.next;
      const pendingFirst = pendingQueue.next;
      baseQueue.next = pendingFirst;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }
  if (baseQueue !== null) {
    const first = baseQueue.next;
    let newState = current.baseState;
    let newBaseState = null;
    let newBaseQueueFirst = null;
    let newBaseQueueLast = null;
    let update = first;
    do {
      const updateLane = update.lane;
      const shouldSkipUpdate = !isSubsetOfLanes(renderLanes, updateLane);
      if (shouldSkipUpdate) {
        const clone = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null,
        };
        if (newBaseQueueLast === null) {
          newBaseQueueFirst = newBaseQueueLast = clone;
          newBaseState = newState;
        } else {
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        currentlyRenderingFiber.lanes = mergeLanes(
          currentlyRenderingFiber.lanes,
          updateLane
        );
      } else {
        if (newBaseQueueLast !== null) {
          const clone = {
            lane: NoLane,
            action: update.action,
            hasEagerState: update.hasEagerState,
            eagerState: update.eagerState,
            next: null,
          };
          newBaseQueueLast = newBaseQueueLast.next = clone;
        }
        if (update.hasEagerState) {
          newState = update.eagerState;
        } else {
          const action = update.action;
          newState = reducer(newState, action);
        }
      }
      update = update.next;
    } while (update !== null && update !== first);
    if (newBaseQueueLast === null) {
      newBaseState = newState;
    } else {
      newBaseQueueLast.next = newBaseQueueFirst;
    }
    hook.memoizedState = newState;
    hook.baseState = newBaseState;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = newState;
  }
  if (baseQueue === null) {
    queue.lanes = NoLanes;
  }
  const dispatch = queue.dispatch;
  return [hook.memoizedState, dispatch];
}

/**
 * useReducer hooks 执行实际执行此函数
 *
 * @param {*} reducer reducer -> useReducer 执行的action函数
 * @param {*} initialArg 初始默认值
 * @return {*}
 */
function mountReducer(reducer, initialArg) {
  debugger
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    // 当前hooks的更新队列
    pending: null,
    dispatch: null,
    lastRenderedReducer: reducer,
    lastRenderedState: initialArg,
  };
  hook.queue = queue;
  const dispatch = (queue.dispatch = dispatchReducerAction.bind(
    null,
    currentlyRenderingFiber,
    queue
  ));
  return [hook.memoizedState, dispatch];
}

/**
 * 执行派发动作的方法，它要更新状态，并且让界面重新更新
 *
 * @param {*} fiber Function 组件本身对应的fiber
 * @param {*} queue hooks 对应的更新队列
 * @param {*} action 派发的动作 {type: "ADD", payload: 0}
 */
function dispatchReducerAction(fiber, queue, action) {
  // TODO: 这里的lane
  // 更新会在每个hook里存放一个更新队列，更新队列是一个更新对象的循环链表
  // const lane = requestUpdateLane();
  const update = {
    action, // 更新动作 {type: 'add', payload: 1}
    next: null,
  };
  // 1. 把当前最新的更新对象添加到更新队列中，并且返回当前的根fiber节点,
  // 2.入队并发的hook更新

  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  const eventTime = requestEventTime();
  // 从根节点重新调度更新 - 初始挂载也是根节点开始调度更新
  scheduleUpdateOnFiber(root, fiber, lane, eventTime);
}

/**
 * 挂载构建中的hook
 *
 */
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null, // hook的状态 - 指向链表头
    queue: null, // 存放本hook的更新队列 构成一个双向循环链表 queue.pending=update
    next: null, // 指向下一个hook，一个函数里面可能会有多个hook，它们会组成一个单向链表
    baseState: null, // 第一个跳过的更新前的状态
    baseQueue: null, // 跳过的更新的链表
  };
  // 构建一个单向链表
  if (workInProgressHook === null) {
    // 当前函数对应的fiber的状态memoizedState 指向hooks链表中的第一个
    // 函数组件的memoizedState属性存的是hook的单链表
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}

/**
 * 渲染函数组件同时处理函数组件的hooks
 * beginWork 阶段从HostRootNode开始递归遍历构建新的fiber树
 * 遇到函数类型的组件需要处理函数组件的 hooks
 * 函数组件的本质是一个函数返回 React 元素节点
 * 在函数执行之前需要处理 函数组件的hooks
 * 通过一个全局共享的变量 ReactCurrentDispatcher.current -> 记录当前hooks类型
 *
 * 函数组件会通过链表存储当前函数组件的hooks
 *
 *
 * @export
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  nextRenderLanes
) {
  // 当前正在渲染的车道
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress; // 当前正在执行的fiber
  workInProgress.updateQueue = null;
  workInProgress.memoizedState = null;
  debugger;
  if (current !== null && current.memoizedState !== null) {
    // 如果有老的fiber，并且有老的hook链表 - 更新
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // 初次挂载阶段的hooks
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }
  // 需要在函数组件执行前给 ReactCurrentDispatcher.current 赋值
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  renderLanes = NoLanes;
  return children;
}
