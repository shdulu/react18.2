// 1. 把虚拟dom构建成fiber树
let A1 = { type: "div", props: { id: "A1" } };
let B1 = { type: "div", props: { id: "B1" }, return: A1 };
let B2 = { type: "div", props: { id: "B2" }, return: A1 };
let C1 = { type: "div", props: { id: "C1" }, return: B1 };
let C2 = { type: "div", props: { id: "C2" }, return: B1 };
A1.child = B1;
B1.sibling = B2;
B1.child = C1;
C1.sibling = C2;

const hasRemainingTime = () => true;

//下一个工作单元
let nextUnitOfWork = null;
//render工作循环
function workLoop() {
  while (nextUnitOfWork && hasRemainingTime()) {
    //执行一个任务并返回下一个任务
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  console.log("render阶段结束");
  //render阶段结束
}
function performUnitOfWork(fiber) {
  let child = beginWork(fiber);
  if (child) {
    return child;
  }
  while (fiber) {
    //如果没有子节点说明当前节点已经完成了渲染工作
    completeUnitOfWork(fiber); //可以结束此fiber的渲染了
    if (fiber.sibling) {
      //如果它有弟弟就返回弟弟
      return fiber.sibling;
    }
    fiber = fiber.return; //如果没有弟弟让爸爸完成，然后找叔叔
  }
}
function beginWork(fiber) {
  console.log("beginWork", fiber.props.id);
  return fiber.child;
}
function completeUnitOfWork(fiber) {
  console.log("completeUnitOfWork", fiber.props.id);
}
nextUnitOfWork = A1;
workLoop();
