import { createRoot } from "react-dom/client";
import { useState, useEffect } from "react";

function FunctionComponent() {
  console.log("FunctionComponent");
  const [number, setNumber] = useState(0);
  useEffect(() => {
    console.log("useEffect1");
    return () => {
      console.log("destroy useEffect1");
    };
  }, [1]);
  useEffect(() => {
    console.log("useEffect2");
    return () => {
      console.log("destroy useEffect2");
    };
  }, [2]);
  useEffect(() => {
    console.log("useEffect3");
    return () => {
      console.log("destroy useEffect3");
    };
  }, [3]);
  return <button onClick={() => setNumber(number + 1)}>{number}</button>;
}
let element = <FunctionComponent title="函数组件"></FunctionComponent>;
const root = createRoot(document.getElementById("root"));
root.render(element);
