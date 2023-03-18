#### 1.1 React 是什么?

- React 是一个用于构建用户界面的 JavaScript 库
- 可以通过组件化的方式构建 构建快速响应的大型 Web 应用程序

#### 1.2 JSX 是什么

- JSX 是一个 JavaScript 的语法扩展,JSX 可以很好地描述 UI 应该呈现出它应有交互的本质形式
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
  // 转译后的结果
  import { jsx as _jsx } from "react/jsx-runtime";
  import { jsxs as _jsxs } from "react/jsx-runtime";
  /*#__PURE__*/ _jsxs("h1", {
    children: [
      "hello ",
      /*#__PURE__*/ _jsx("soan", {
        style: {
          color: "red",
        },
        children: "world",
      }),
    ],
  });
  ```

- astexplorer 可以把代码转换成 AST 树
- react/jsx-runtime 和 react/jsx-dev-runtime 中的函数只能由编译器转换使用。如果你需要在代码中手动创建元素，你可以继续使用 React.createElement
