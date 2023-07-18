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
      <li key="A" id="A">
        A
      </li>
      <li key="B" id="B">
        B
      </li>
      <li key="C" id="C">
        C
      </li>
    </ul>
  ) : (
    <ul key="container" onClick={() => setNumber(number + 1)}>
      <li key="A" id="A2">
        A2
      </li>
      <p key="B" id="B">
        B
      </p>
      {/* <li key="C" id="C2">
        C2
      </li> */}
      {/* <li key="D" id="D2">
        D2
      </li> */}
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
