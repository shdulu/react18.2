let effects = [
  {
    type: "useEffect",
    create: "useEffect1Create",
    destroy: "useEffect1Destory",
  },
  {
    type: "useLayoutEffect",
    create: "useLayoutEffect2Create",
    destroy: "useLayoutEffect2Destory",
  },
  {
    type: "useEffect",
    create: "useEffect3Create",
    destroy: "useEffect3Destory",
  },
  {
    type: "useLayoutEffect",
    create: "useLayoutEffect4Create",
    destroy: "useLayoutEffect4Destory",
  },
];

// 1. 在渲染阶段 effect链表已经构建好了
// 2. 在渲染之后进入commit提交阶段
//  commit阶段分成三步
// commitBeforeMutationEffects DOM 变更前
// commitMutationEffects DOM 变更
// commitHookLayoutEffects DOM 变更后
// 3. commit 完成

// 初次挂载的时候 -> useLayoutEffect 在初次挂在的时候同步执行
// commitHookLayoutEffects useLayoutEffect2Create -> useLayoutEffect4Create
// 在下一个宏任务中异步执行 useEffect1Create -> useEffect3Create

// 更新的时候
// 先在 commitMutationEffects 中同步执行 useLayoutEffect2Destory -> useLayoutEffect4Destory
// 紧接着会在 commitHookLayoutEffects 同步执行 useLayoutEffect2Create -> useLayoutEffect4Create
// 在下一个宏任务中异步执行 useEffect1Destory -> useEffect3Destory & useEffect1Create -> useEffect3Create


// useEffect 里面调用setState 的闭包问题
// 1. 变量的更新时候
// 2. 如何获取更新后的变量