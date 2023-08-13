import { createRoot } from "react-dom/client";
import { useState, useEffect, useLayoutEffect, useRef } from "react";

let counter = 0;
let timer;
let bCounter = 0;
let cCounter = 0;
function FunctionComponent() {
  const [numbers, setNumbers] = useState(new Array(100).fill("A"));
  const divRef = useRef();
  const updateB = (numbers) => new Array(100).fill(numbers[0] + "B");
  updateB.id = "updateB" + bCounter++;
  const updateC = (numbers) => new Array(100).fill(numbers[0] + "C");
  updateC.id = "updateC" + cCounter++;
  useEffect(() => {
    timer = setInterval(() => {
      console.log(divRef);
      divRef.current.click(); // 同步任务1
      if (counter++ === 0) {
        debugger
        setNumbers(updateB); // 同步任务2
      }
      divRef.current.click(); // 同步任务3 => 这三个同步任务同步调度，
      if (counter++ > 10) {
        clearInterval(timer);
      }
    });
  }, []);
  return (
    <div
      ref={divRef}
      onClick={() => {
        debugger;
        setNumbers(updateC);
      }}
    >
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </div>
  );
}
let element = <FunctionComponent title="函数组件"></FunctionComponent>;

function FunctionComponent1() {
  console.log("FunctionComponent1");
  const [numbers, setNumbers] = useState(new Array(10).fill("A"));
  useEffect(() => {
    setTimeout(() => {}, 10);
    setNumbers((numbers) => numbers.map((number) => number + "B"));
    setNumbers((numbers) => numbers.map((number) => number + "B"));
  }, []);
  return (
    <button
      onClick={() =>
        setNumbers((numbers) => numbers.map((number) => number + "C"))
      }
    >
      {numbers.map((number, index) => (
        <span key={index}>{number}</span>
      ))}
    </button>
  );
}
let element1 = <FunctionComponent1></FunctionComponent1>;

const root = createRoot(document.getElementById("root"));
root.render(element);
