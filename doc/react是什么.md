#### 1.1 React 是什么?

- `React` 是一个用于构建用户界面的 JavaScript 库
- 可以通过组件化的方式构建 构建快速响应的大型 `Web` 应用程序

#### 1.2 JSX 是什么

- [JSX](https://zh-hans.reactjs.org/docs/introducing-jsx.html "jsx简介") 是一个 `JavaScript` 的语法扩展,JSX 可以很好地描述 UI 应该呈现出它应有交互的本质形式. 在运行前会经过 babel 转译，
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
  console.log(result.code);

  // 转译后的结果
  /*#__PURE__*/ React.createElement(
    "h1",
    null,
    "hello ",
    /*#__PURE__*/ React.createElement(
      "soan",
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
  console.log(result.code);
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

#### 1.3 Virtual DOM

- `React.createElement` 函数所返回的就是一个虚拟 DOM
- 虚拟 DOM 就是一个描述真实 DOM 的纯 JS 对象

![jsx转换流程图](./images/virutaldom.jpg "jsx转换流程图")
