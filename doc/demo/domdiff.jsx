import { createRoot } from "react-dom/client";
import { useReducer, useState } from "react";

function reducer(state, action) {
  if (action.type === "add") return state + 1;
  return state;
}

function FunctionComponent() {
  const [number, setNumber] = useState(0);
  const [count, setCount] = useReducer(reducer, 0);
  return number === 0 ? (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A</li>
      <li key="B" id="B">
        B
      </li>
      <li key="C">C</li>
      <li key="D">D</li>
      <li key="E">E</li>
      <li key="F" id="F">
        F
      </li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A">A2</li>
      <li key="C">C2</li>
      <li key="E">E2</li>
      <li key="B" id="B2">
        B2
      </li>
      <li key="G">G</li>
      <li key="D">D2</li>
    </ul>
  );
  // const [count2, setCount2] = React.useReducer(reducer, 100);
  // return number === 0 ? (
  //   <button
  //     key="title"
  //     id="title1"
  //     onClick={() => {
  //       // setCount({ type: "add" }); // update1.next => update2.next => update3.next => update1
  //       setNumber(number + 1);
  //       // setCount({ type: "add", payload: 2 }); // update2
  //       // setCount({ type: "add", payload: 3 }); // update3
  //     }}
  //   >
  //     title1
  //   </button>
  // ) : (
  //   <div
  //     key="title"
  //     id="title1"
  //     onClick={() => {
  //       setNumber(number + 1);
  //     }}
  //   >
  //     title2
  //   </div>
  // );
}
let element = <FunctionComponent title="函数组件"></FunctionComponent>;
const root = createRoot(document.getElementById("root"));
root.render(element);
