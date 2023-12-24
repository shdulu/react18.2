// 需要配置 jsconfig.json 告诉vscode 如何查找文件
import hasOwnProperty from "shared/hasOwnProperty";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import ReactSharedInternals from "shared/ReactSharedInternals";
const ReactCurrentOwner = ReactSharedInternals.ReactCurrentOwner;

const RESERVED_PROPS = {
  key: true,
  ref: true,
  __self: true,
  __source: true,
};

/**
 * Factory method to create a new React element
 * 返回 React element 也就是虚拟DOM
 *
 * @param {*} type
 * @param {*} key
 * @param {string|object} ref
 * @param {*} owner
 * @param {*} props
 */
function ReactElement(type, key, ref, owner, props) {
  const element = {
    // This tag allows us to uniquely identify this as a React Element
    $$typeof: REACT_ELEMENT_TYPE, // TODO: Symbol.for("react.element")
    // Built-in properties that belong on the element
    type,
    key,
    ref,
    props,
    // Record the component responsible for creating this element.
    _owner: owner,
  };
  // 开发环境还会有 _store _self _source 三个属性
  return element;
}

function hasValidKey(config) {
  return config.key !== undefined;
}
function hasValidRef(config) {
  return config.ref !== undefined;
}

export function jsxDEV(type, config, maybekey) {
  let propName; // 属性名
  // Reserved names are extracted
  const props = {};
  let key = null; // 每个虚拟dom可以有一个可选的key属性，用来区分同一个父节点下的不同子节点
  let ref = null; // 引入，后面可以通过这实现获取真实dom的需求
  if (typeof maybekey !== "undefined") {
    key = maybekey;
  }
  if (hasValidKey(config)) {
    key = config.key;
  }
  if (hasValidRef(config)) {
    ref = config.ref;
  }
  for (propName in config) {
    if (
      hasOwnProperty.call(config, propName) &&
      !RESERVED_PROPS.hasOwnProperty(propName)
    ) {
      props[propName] = config[propName];
    }
  }
  return ReactElement(type, key, ref, ReactCurrentOwner.current, props);
}
