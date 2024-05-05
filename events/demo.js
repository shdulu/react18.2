const parnetBubble = () => {
  console.log("父react冒泡");
};
const parentCapture = () => {
  console.log("父react捕获");
};
const childBubble = () => {
  console.log("子react冒泡");
};
const childCapture = () => {
  console.log("子react捕获");
};
let root = document.getElementById("root");
let parent = document.getElementById("parent");
let child = document.getElementById("child");
parent.onClick = parnetBubble;
parent.onClickCapture = parentCapture;
child.onClick = childBubble;
child.onClickCapture = childCapture;

// 模拟React中的事件委托
// 捕获事件 - true
root.addEventListener("click", (event) => dispatchEvent(event, true), true);
// 冒泡阶段 - false
root.addEventListener("click", (event) => dispatchEvent(event, false), false);
function dispatchEvent(event, isCapture) {
  let paths = [];
  let currentTarget = event.target;
  while (currentTarget) {
    paths.push(currentTarget);
    currentTarget = currentTarget.parentNode;
  }
  if (isCapture) {
    for (let i = paths.length; i >= 0; i--) {
      let handler = paths[i]?.onClickCapture;
      handler && handler();
    }
  } else {
    for (let i = 0; i < paths.length; i++) {
      let handler = paths[i]?.onClick;
      handler && handler();
    }
  }
}
parent.addEventListener(
  "click",
  () => {
    console.log("父原生捕获");
  },
  true
);
parent.addEventListener(
  "click",
  () => {
    console.log("父原生冒泡");
  },
  false
);
child.addEventListener(
  "click",
  () => {
    console.log("子原生捕获");
  },
  true
);
child.addEventListener(
  "click",
  () => {
    console.log("子原生冒泡");
  },
  false
);
