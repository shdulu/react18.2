export function shouldSetTextContent(type, props) {
  return (
    typeof props.children === "string" || typeof props.children === "number"
  );
}

/**
 * 创建文本节点实例
 *
 * @export
 * @param {*} content
 */
export function createTextInstance(content) {
  return document.createTextNode(content);
}

/**
 * 创建真实DOM
 *
 * @export
 * @param {*} type 标签名
 * @param {*} props 属性
 * @param {*} workInProgress
 */
export function createInstance(type, props, workInProgress) {
  const domElement = document.createElement(type);
  // 属性的添加暂不处理
  // updateFiberProps()
  return domElement;
}

/**
 *
 *
 * @export
 * @param {*} parent
 * @param {*} child
 */
export function appendInitialChild(parent, child) {
  parent.appendChild(child);
}
