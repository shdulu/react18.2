import { createRoot } from "react-dom/client";

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

function FunctionComponent() {
  return (
    <h1 id="container" onClick={() => console.log("点击 container")}>
      hello <span style={{ color: "red" }}>world</span>
    </h1>
  );
}
let element = <FunctionComponent></FunctionComponent>;

// let element = (
//   <h1 id="container">
//     hello <span style={{ color: "red" }}>world</span>
//   </h1>
// );
// console.log(element);

const root = createRoot(document.getElementById("root"));
root.render(element);
