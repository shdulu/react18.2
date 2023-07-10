import { createRoot } from "react-dom/client";
import { useReducer, useState } from "react";

function reducer(state, action) {
  if (action.type === "add") return state + 1;
  return state;
}

function FunctionComponent() {
  const [count, setCount] = useReducer(reducer, 0);
  const [number, setNumber] = useState(0);
  // const [count2, setCount2] = React.useReducer(reducer, 100);
  return (
    <button
      onClick={() => {
        debugger;
        // setCount({ type: "add" }); // update1.next => update2.next => update3.next => update1
        setNumber(number);
        setNumber(number + 1);
        setNumber(number + 2);
        // setCount({ type: "add", payload: 2 }); // update2
        // setCount({ type: "add", payload: 3 }); // update3
      }}
    >
      {/* {count} */}
      {number}
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
