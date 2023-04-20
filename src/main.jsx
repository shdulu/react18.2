import { createRoot } from "react-dom/client";
let element = (
  <h1 id="container">
    hello <span style={{ color: "red" }}>world</span>
  </h1>
);

function Counter() {
  return <div>this is Counter</div>;
}
// debugger
const root = createRoot(document.getElementById("root"));
console.log("ReactDOMRoot", root);
root.render(element);
