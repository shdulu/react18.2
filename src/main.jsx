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
  if (action.type === "add") return state + action.payload;
  return state;
}

function FunctionComponent() {
  // debugger;
  const [count, setCount] = React.useReducer(reducer, 0);
  const [count2, setCount2] = React.useReducer(reducer, 100);
  let attrs = {
    id: "btn1",
  };
  if (count === 6) {
    delete attrs.id;
    attrs.style = { color: "red" };
  }
  return (
    <button
      {...attrs}
      onClick={() => {
        debugger;
        setCount({ type: "add", payload: 1 }); // update1.next => update2.next => update3.next => update1
        setCount({ type: "add", payload: 2 }); // update2
        setCount({ type: "add", payload: 3 }); // update3
      }}
    >
      {count}
    </button>
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
