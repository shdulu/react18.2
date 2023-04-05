import { createRoot } from "react-dom/client";
let element = (
  <h1>
    hello <span style={{ color: "red" }}>world</span>
  </h1>
  // <div>
  //   <h2>
  //     hello2 <strong style={{ color: "green" }}>world2</strong>
  //   </h2>
  // </div>
);
debugger;
const root = createRoot(document.getElementById("root"));
console.log("ReactDOMRoot", root);
root.render(element);
