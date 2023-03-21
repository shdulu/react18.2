import { createContainer } from "react-reconciler/src/ReactFiberReconcile";
/**
 * 创建 ReactDOMRoot 项目的根
 *
 * @export
 * @param {*} container div#root
 * @param {*} options
 * @return {ReactDOMRoot}
 */
export function createRoot(container, options) {
  // createContainer 函数用来创建 FiberRootNode 然后传递给 ReactDOMRoot, 
  // 作为ReactDOMRoot的实例属性 _internalRoot
  const root = createContainer(container);
  return new ReactDOMRoot(root);
}

/**
 * 创建 FiberRootNode
 *
 * @param {FiberRoot} internalRoot
 */
function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
