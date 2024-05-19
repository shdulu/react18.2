import { createRoot } from "react-dom/client";
import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useReducer,
} from "react";

// let counter = 0;
// let timer;
// let bCounter = 0;
// let cCounter = 0;
// function FunctionComponent() {
//   const [numbers, setNumbers] = useState(new Array(100).fill("A"));
//   const divRef = useRef();
//   const updateB = (numbers) => new Array(100).fill(numbers[0] + "B");
//   updateB.id = "updateB" + bCounter++;
//   const updateC = (numbers) => new Array(100).fill(numbers[0] + "C");
//   updateC.id = "updateC" + cCounter++;
//   useLayoutEffect(() => {
//     console.log("useLayoutEffect..............");
//   }, []);
//   useEffect(() => {
//     console.log("useEffect.............");
//     timer = setInterval(() => {
//       console.log(divRef);
//       divRef.current.click(); // 同步任务1
//       if (counter++ === 0) {
//         setNumbers(updateB); // 同步任务2
//       }
//       divRef.current.click(); // 同步任务3 => 这三个同步任务同步调度，
//       if (counter++ > 10) {
//         clearInterval(timer);
//       }
//     });
//   }, []);
//   return (
//     <div
//       ref={divRef}
//       onClick={() => {
//         setNumbers(updateC);
//       }}
//     >
//       {numbers.map((number, index) => (
//         <span key={index}>{number}</span>
//       ))}
//     </div>
//   );
// }
// let element = <FunctionComponent title="函数组件"></FunctionComponent>;

// function FunctionComponent1() {
//   console.log("FunctionComponent1");
//   const [numbers, setNumbers] = useState(new Array(10).fill("A"));
//   useEffect(() => {
//     setTimeout(() => {}, 10);
//     setNumbers((numbers) => numbers.map((number) => number + "B"));
//     setNumbers((numbers) => numbers.map((number) => number + "B"));
//   }, []);
//   return (
//     <button
//       onClick={() =>
//         setNumbers((numbers) => numbers.map((number) => number + "C"))
//       }
//     >
//       {numbers.map((number, index) => (
//         <span key={index}>{number}</span>
//       ))}
//     </button>
//   );
// }
// let element1 = <FunctionComponent1></FunctionComponent1>;

// let element2 = (
//   <div
//     onClick={() => console.log("父冒泡")}
//     onClickCapture={() => console.log("父捕获")}
//     style={{ border: "3px solid red" }}
//   >
//     <h1
//       id="title"
//       onClick={() => console.log("子冒泡")}
//       onClickCapture={() => console.log("子捕获")}
//     >
//       hello{" "}
//       <span
//         onClick={() => console.log("孙冒泡")}
//         onClickCapture={() => console.log("孙捕获")}
//         style={{ color: "red" }}
//       >
//         world !
//       </span>
//     </h1>
//   </div>
// );

function numberAcc(state, action) {
  switch (action.type) {
    case "ADD":
      return state + action.payload;
    case "DEC":
      return state - action.payload;
    default:
      return state;
  }
}

function FunctionComponent2() {
  const [count, setCount] = useState(10);
  const [number, dispatchNumber] = useReducer(numberAcc, 0);

  return (
    <h1 id="title">
      hello <span style={{ color: "red" }}>world!</span>
      <button onClick={() => setCount(100)}>{count}</button>
      <div style={{ display: "flex", border: "1px solid red" }}>
        <button
          onClick={() => {
            debugger;
            // 根据车道优先级同步任务注册回调批量更新
            dispatchNumber({ type: "ADD", payload: 1 });
            dispatchNumber({ type: "ADD", payload: 2 });
            dispatchNumber({ type: "ADD", payload: 3 });
          }}
        >
          + 1
        </button>
        <p>这里是文案 {number} </p>
        <button
          onClick={() => {
            dispatchNumber({ type: "DEC", payload: 1 });
          }}
        >
          - 1
        </button>
      </div>
    </h1>
  );
}

const root = createRoot(document.getElementById("root"));

// root -> FiberRootNode {current: HostRootFiber, containerInfo: #root}

root.render(<FunctionComponent2></FunctionComponent2>);
