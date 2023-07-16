import {
  setInitialProperties,
  diffProperties,
  updateProperties,
} from "./ReactDOMComponent";
import { precacheFiberNode, updateFiberProps } from "./ReactDOMComponentTree";
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
 * 原生组件初次挂载的时候，会通过此方法创建真实DOM
 *
 * @export
 * @param {*} type 标签名
 * @param {*} props 属性
 * @param {*} internalInstanceHandle 真实dom对应的fiber
 */
export function createInstance(type, props, internalInstanceHandle) {
  const domElement = document.createElement(type);
  // 预先缓存fiber节点到DOM元素上
  precacheFiberNode(internalInstanceHandle, domElement);
  // 把属性直接保存在domElement的属性
  updateFiberProps(domElement, props);
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

/**
 *
 *
 * @export
 * @param {*} domElement
 * @param {*} type
 * @param {*} props
 */
export function finalizeInitialChildren(domElement, type, props) {
  setInitialProperties(domElement, type, props);
}

export function appendChild(parentInstance, child) {
  parentInstance.appendChild(child);
}

export function insertBefore(parentInstance, child, beforeChild) {
  parentInstance.insertBefore(child, beforeChild);
}

/**
 *
 *
 * @export
 * @param {*} domElement
 * @param {*} type
 * @param {*} oldProps
 * @param {*} newProps
 * @return {*}
 */
export function prepareUpdate(domElement, type, oldProps, newProps) {
  return diffProperties(domElement, type, oldProps, newProps);
}

export function commitUpdate(
  domElement,
  updatePayload,
  type,
  oldProps,
  newProps
) {
  updateProperties(domElement, updatePayload, type, oldProps, newProps);
  updateFiberProps(domElement, newProps);
}

export function removeChild(parentInstance, child) {
  parentInstance.removeChild(child);
}
