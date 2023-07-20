import ReactSharedInternals from "shared/ReactSharedInternals";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { Passive as PassiveEffect } from "./ReactFiberFlags";
import {
  HasEffect as HookHasEffect,
  Passive as HookPassive,
} from "./ReactHookEffectTags";

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null; // 当前正在渲染中的fiber
let workInProgressHook = null; //

let currentHook = null;

const HooksDispatcherOnMount = {
  useReducer: mountReducer,
  useState: mountState,
  useEffect: mountEffect,
};
const HooksDispatcherOnUpdate = {
  useReducer: updateReducer,
  useState: updateState,
  useEffect: updateEffect,
};

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
 * @param {*} fiberFlags
 * @param {*} hookFlags
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

//
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
  hook.memoizedState = initialState;
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
function updateState() {
  return updateReducer(baseStateReducer);
}

function dispatchSetstate(fiber, queue, action) {
  const update = {
    action,
    hasEagerState: false, // 是否有急切的更新
    eagerState: null, // 急切的更新状态
    next: null,
  };
  // 派发动作后，立刻用上一次的状态和上一次的reducer计算状态
  const { lastRenderedReducer, lastRenderedState } = queue;
  const eagerState = lastRenderedReducer(lastRenderedState, action);
  update.hasEagerState = true;
  update.eagerState = eagerState;
  if (Object.is(eagerState, lastRenderedState)) {
    return;
  }
  // 正常情况下会先调度更新，然后才会计算新的状态
  // mountState -> 优化了这里先立刻计算了一次状态做一次对比,如果一样就不再调度更新

  // 入队更新，并调度更新逻辑
  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  scheduleUpdateOnFiber(root);
}

function updateReducer(reducer, initialArg) {
  // 根据老的hook获取新的hook
  const hook = updateWorkInProgressHook();
  // 获取新的hook的更新队列
  const queue = hook.queue;
  // 获取老的hook
  const current = currentHook;
  // 获取将要生效的更新队列
  const pendingQueue = queue.pending;
  // 初始化一个新的状态，取值为当前的状态
  let newState = current.memoizedState;
  if (pendingQueue !== null) {
    queue.pending = null;
    const firstUpdate = pendingQueue.next;
    let update = firstUpdate;
    do {
      if (update.hasEagerState) {
        newState = update.eagerState;
      } else {
        const action = update.action;
        newState = reducer(newState, action);
      }
      update = update.next;
    } while (update !== null && update !== firstUpdate);
  }
  hook.memoizedState = newState;
  return [hook.memoizedState, queue.dispatch];
}

/**
 * useReducer hooks 执行实际执行此函数
 *
 * @param {*} reducer reducer -> useReducer 执行的action函数
 * @param {*} initialArg 初始默认值
 * @return {*}
 */
function mountReducer(reducer, initialArg) {
  const hook = mountWorkInProgressHook();
  hook.memoizedState = initialArg;
  const queue = {
    // 当前hooks的更新队列
    pending: null,
    dispatch: null,
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
 * @param {*} fiber Function 对用的fiber
 * @param {*} queue hook 对应的更新队列
 * @param {*} action 派发的动作
 */
function dispatchReducerAction(fiber, queue, action) {
  // 更新会在每个hook里存放一个更新队列，更新队列是一个更新对象的循环链表
  const update = {
    action, // 更新动作 {type: 'add', payload: 1}
    next: null,
  };
  // 1. 把当前最新的更新对象添加到更新队列中，并且返回当前的根fiber节点,
  // 2.入队并发的hook更新

  const root = enqueueConcurrentHookUpdate(fiber, queue, update);
  // 从根节点重新调度更新 - 初始挂载也是根节点开始调度更新
  scheduleUpdateOnFiber(root);
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
  };
  // 构建一个单向循环链表
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
 * 渲染函数组件
 *
 * @export
 * @param {*} current 老fiber
 * @param {*} workInProgress 新fiber
 * @param {*} Component 组件定义
 * @param {*} props 组件属性
 * @returns 虚拟DOM或者说React元素
 */
export function renderWithHooks(current, workInProgress, Component, props) {
  currentlyRenderingFiber = workInProgress; // 当前正在执行的fiber
  workInProgress.updateQueue = null;
  // React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
  if (current !== null && current.memoizedState !== null) {
    // 如果有老的fiber，并且有老的hook链表 - 更新
    ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // - 初次挂载
    ReactCurrentDispatcher.current = HooksDispatcherOnMount;
  }

  // 需要在函数组件执行前给 ReactCurrentDispatcher.current 赋值
  const children = Component(props);
  currentlyRenderingFiber = null;
  workInProgressHook = null;
  currentHook = null;
  return children;
}
