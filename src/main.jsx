import { createRoot } from "react-dom/client";
import * as React from "react";

// import { jsxDEV } from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=ca46bb27";
// let element1 = /*#__PURE__*/ jsxDEV("h1", {
//   id: "container",
//   children: [
//     "hello ",
//     /*#__PURE__*/ jsxDEV("span", {
//       style: {
//         color: "red"
//       },
//       children: "world"
//     })
//   ]
// });
// console.log(element1)

function reducer(state, action) {
  if (action.type === "add") return state + 1;
  return state;
}

function FunctionComponent() {
  const [count, setCount] = React.useReducer(reducer, 0);
  return (
    <h1
      id="container"
      // onClick={(event) => console.log("父冒泡", event.currentTarget)}
      onClickCapture={(event) => {
        // console.log(`父捕获`, event.currentTarget);
        event.stopPropagation();
      }}
    >
      hello
      <span
        onClick={(event) => {
          // console.log("子冒泡", event.currentTarget);
          event.stopPropagation();
        }}
        // onClickCapture={(event) => console.log("子捕获", event.currentTarget)}
        style={{ color: "red" }}
      >
        world
      </span>
      <button onClick={() => setCount({ type: "add", payload: 1 })}>{count}</button>
    </h1>
  );
}
let element = <FunctionComponent title="函数组件"></FunctionComponent>;
// let element = (
//   <h1 id="container">
//     hello <span style={{ color: "red" }}>world</span>
//   </h1>
// );
// console.log(element);

const root = createRoot(document.getElementById("root"));
root.render(element);
