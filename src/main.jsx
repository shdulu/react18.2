import { createRoot } from "react-dom/client";
import { useState, useEffect, useLayoutEffect } from "react";

function FunctionComponent() {
  // console.log("FunctionComponent");
  const [number, setNumber] = useState(0);
  useEffect(() => {
    console.log("useEffect1");
    return () => {
      console.log("destroy useEffect1");
    };
  });
  useLayoutEffect(() => {
    console.log("useLayoutEffect2");
    return () => {
      console.log("destroy useLayoutEffect2");
    };
  });
  useEffect(() => {
    console.log("useEffect3");
    return () => {
      console.log("destroy useEffect3");
    };
  });
  useLayoutEffect(() => {
    console.log("useLayoutEffect4");
    return () => {
      console.log("destroy useLayoutEffect4");
    };
  });
  return <button onClick={() => setNumber(number + 1)}>{number}</button>;
}
let element = <FunctionComponent title="函数组件"></FunctionComponent>;

function FunctionComponent1() {
  console.log("FunctionComponent1");
  const [number, setNumber] = useState(0);
  // 默认渲染 lane - 32 点击事件-2 useEffect里 - 32
  useEffect(() => {
    // debugger;
    setNumber((number) => number + 1);
  }, []);
  return (
    <button onClick={() => setNumber((number) => number + 1)}>{number}</button>
  );
}
let element1 = <FunctionComponent1></FunctionComponent1>;

const root = createRoot(document.getElementById("root"));
root.render(element1);
