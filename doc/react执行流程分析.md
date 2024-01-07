### react 执行流程

#### jsx 阶段

- [JSX](https://zh-hans.reactjs.org/docs/introducing-jsx.html "jsx简介") 是一个 `JavaScript` 的语法扩展,JSX 可以很好地描述 UI 应该呈现出它应有交互的本质形式.** 在运行前会经过 babel 转译**
- [repl](https://babeljs.io/repl "在线转换代码") 可以在线转换代码

  ```js
  // react17以前旧的转换
  const babel = require("@babel/core");
  const sourceCode = `
  <h1>
      hello<span style={{ color: "red" }}>world</span>
  </h1>
  `;
  const result = babel.transform(sourceCode, {
    plugins: [["@babel/plugin-transform-react-jsx", { runtime: "classic" }]],
  });

  // 转译后的结果
  /*#__PURE__*/ React.createElement(
    "h1",
    null,
    "hello ",
    /*#__PURE__*/ React.createElement(
      "span",
      {
        style: {
          color: "red",
        },
      },
      "world"
    )
  );
  ```

  ```js
  // 新的转换
  const babel = require("@babel/core");
  const sourceCode = `
  <h1>
      hello<span style={{ color: "red" }}>world</span>
  </h1>
  `;
  const result = babel.transform(sourceCode, {
    plugins: [["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]],
  });
  // 转译后的结果 由内而外执行 深度优先
  import { jsxDEV } from "react/jsx-dev-runtime";
  jsxDEV("h1", {
    children: [
      "hello",
      jsxDEV("span", {
        style: {
          color: "red",
        },
        children: "world",
      }),
    ],
  });
  ```

- [astexplorer](https://astexplorer.net "astexplorer") 可以把代码转换成 AST 树
- `react/jsx-runtime` 和 `react/jsx-dev-runtime` 中的函数只能由编译器转换使用。如果你需要在代码中手动创建元素，你可以继续使用 `React.createElement`
- jsx 执行最终返回虚拟 DOM 树

  ```js
  {
    "type": "h1",
    "key": null,
    "ref": null,
    "props": {
        "children": [
            "hello",
            {
                "type": "span",
                "key": null,
                "ref": null,
                "props": {
                    "style": {
                        "color": "red"
                    },
                    "children": "world"
                },
                "_owner": null,
                "_store": {}
            }
        ]
    },
    "_owner": null,
    "_store": {}
  }
  ```

#### 初始化实例

初始化阶段，首先执行 react-dom 的 `createRoot` 方法

```ts
import { createRoot } from "react-dom/client";
const element = (
  <h1>
    hello<span style={{ color: "red" }}>world</span>
  </h1>
);
const root = createRoot(document.getElementById("root"));
// 根据虚拟dom-tree 渲染真实dom节点
root.render(element);

// createRoot 函数接受root根节点入参，返回 FiberRootNode 实例
// createRoot -> [createContainer -> new FiberRootNode -> root] -> new ReactDOMRoot -> root

function createRoot(container) {
  // 其实这里返回的是 new ReactDOMRoot()
  return new FiberRootNode(container);
}
function FiberRootNode(root) {
  this.containerInfo = root;  // div#root
  this.current = null; // current指针指向当前页面渲染的fiber树，双缓存树就是通过该指针切换
  this.pendingLanes = NoLanes;
  ...props
}

FiberRootNode.prototype.render = function() { updateContainer(vdom, root) }
```

![renderFiber](./images/renderFiber.jpg "renderFiber")

- 根 DOM 节点对应的 fiber `HostRootFiber`，此时的 fiber 树仅次一个 fiber 节点。

  > 接下来开始执行 `render` 阶段，深度优先遍历虚拟 `DOM` 树，在内存中构建出来一个 `fiber` 树，这个过程伴随着任务的**调度、协调**，`react` 实现了自己的调度器和协调器

- `Scheduler` 调度器-任务调度、任务优先级、任务中断和拆分、时间切片
- `Reconciler` 协调器-处理组件更新、调度更新、dom-diff 构建虚拟 DOM 树、处理副作用

#### render 执行渲染阶段

- render 执行渲染分为 `render`渲染 和 `commit`提交 两个阶段
- `render` 渲染阶段根据虚拟 DOM 创建新的 fiber 链表。基于旧的 fiber 和新的虚拟 dom 做 dom-diff、打标副作用节点
- `commit` 提交阶段基于新的 fiber 树，执行副作用更新真实 DOM, 改变 current 指针，把内存中的图像显示到显示屏
- 新旧 fiber 树通过 alternate 指针相互引用

- 深度优先从根节点开始构建 fiber 树 `createWorkInProgress`， 会基于老的 fiber 和新的属性 `pendingProps` 创建出新的 fiber
<!-- 此处补一下fiber的节点属性/ -->

- `beginWork` 从根节点出发，根据虚拟 dom 构建新的 fiber 链表，第一个构建的根 fiber 为 HostRootFiber 这个过程会复用老的 fiber 节点，第一次没有老的 fiber 树，同步渲染的方式去渲染，尽可能快的完成渲染，展现出页面给用户。beginwork 从根节点开始依次构建出 fiber 树，先找子节点没有子节点 `completeWork` 完成阶段，子节点处理完找 sibing 节点

```js
// 同步执行的工作循环，从根节点
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    // 执行工作单元
    performUnitOfWork(workInProgress);
  }
}
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate;
  // 从根节点出发构建一个新的fiber链表
  const next = beginWork(current, unitOfWork, workInProgressRootRenderLanes);
  if (next === null) {
    // 如果此fiber没有子节点，完成此fiber节点
    completeUnitOfWork(unitOfWork);
  } else {
    // 如果有子节点，就让子节点成为下一个工作单元，继续执行
    workInProgress = next;
  }
}
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  do {
    const current = completedWork.alternate; // 对应的老fiber
    const returnFiber = completedWork.return; // 父fiber
    // 执行此fiber的完成工作，如果是原生组件的话就是创建真实的dom节点
    completeWork(current, completedWork);
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber; // 有sibling接着去beginWork 兄弟节点
      return;
    }
    // 没有弟弟说明当前fiber是父fiber的最后一个节点，父fiber所有子fiber全部完成
    completedWork = returnFiber; // 接着去完成父节点
    workInProgress = completedWork;
  } while (completedWork !== null);
  // 如果走到这里说明fiber树全部构建完毕,把构建状态设置为完成
  if (workInProgressRootExitStatus === RootInProgress) {
    workInProgressRootExitStatus = RootCompleted;
  }
}
```

- HostRoot - 每一个 fiber 的更新队列存放的更新都不一样，根节点的 fiber 的更新队列里存放的是虚拟 dom 树
- 函数组件的 fiber 更新队列是 hook 队列
