// 同步任务 > 微任务 > requestAnimationFrame > DOM渲染 > 宏任务
setTimeout(() => {
  console.log("setTimeout");
}, 0);

const { port1, port2 } = new MessageChannel();
port2.onmessage = (e) => {
  console.log(e.data);
};
port1.postMessage("MessageChannel");

console.log("start..........");

Promise.resolve().then(() => {
  console.log("Promise1");
});
