import { createRoot } from "react-dom/client";
let element = (
  <h1>
    hello <soan style={{ color: "red" }}>world</soan>
  </h1>
);
debugger
const root = createRoot(document.getElementById("root"));
console.log('ReactDOMRoot', root)
root.render(element);
