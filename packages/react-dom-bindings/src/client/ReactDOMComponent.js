import { setValueForStyles } from "./CSSPropertyOperations";
import setTextContent from "./setTextContent";
import { setValueForProperty } from "./DOMPropertyOperations";

const STYLE = "style";
const CHILDREN = "children";

function setInitialDOMProperties(tag, domElement, nextProps) {
  for (const propKey in nextProps) {
    if (Object.hasOwnProperty.call(nextProps, propKey)) {
      const nextProp = nextProps[propKey];
      if (propKey === STYLE) {
        setValueForStyles(domElement, nextProp);
      } else if (propKey === CHILDREN) {
        if (typeof nextProp === "string") {
          setTextContent(domElement, nextProp);
        } else if (typeof nextProp === "number") {
          setTextContent(domElement, `${nextProp}`);
        }
      } else if (nextProp !== null) {
        setValueForProperty(domElement, propKey, nextProp);
      }
    }
  }
}
/**
 *
 *
 * @export
 * @param {*} domElement
 * @param {*} tag
 * @param {*} props
 */
export function setInitialProperties(domElement, tag, props) {
  setInitialDOMProperties(tag, domElement, props);
}

/**
 *
 *
 * @export
 * @param {*} domElement
 * @param {*} tag
 * @param {*} lastProps
 * @param {*} nextProps
 */
export function diffProperties(domElement, tag, lastProps, nextProps) {
  let updatePayload = null;
  let propKey;
  let styleName;
  let styleUpdates = null;

  // 处理属性的删除 如果说一个属性在老对象里有，新对象里没有的话，就意味着删除该属性
  for (propKey in lastProps) {
    if (
      nextProps.hasOwnProperty(propKey) ||
      !lastProps.hasOwnProperty(propKey) ||
      lastProps[propKey] === null
    ) {
      // 新属性对象里有此属性，或者老的没有此属性，或者老的是个null
      continue;
    }
    if (propKey === STYLE) {
      const lastStyle = lastProps[propKey];
      for (styleName in lastStyle) {
        if (lastStyle.hasOwnProperty(styleName)) {
          if (!styleUpdates) {
            styleUpdates = {};
          }
          styleUpdates[styleName] = "";
        }
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, null);
    }
  }

  // 遍历新的属性对象
  for (propKey in nextProps) {
    const nextProp = nextProps[propKey]; // 新属性中的值
    const lastProp = lastProps !== null ? lastProps[propKey] : undefined; // 老属性中的值
    if (
      !nextProps.hasOwnProperty(propKey) ||
      nextProp === lastProp ||
      (nextProp === null && lastProp === null)
    ) {
      continue;
    }
    if (propKey === STYLE) {
      if (lastProp) {
        // 计算要删除的行内样式
        for (styleName in lastProp) {
          // 如果此样式对象里的某个属性老的style里有，新的style里没有删除
          if (
            lastProp.hasOwnProperty(styleName) &&
            (!nextProp || !nextProp.hasOwnProperty(styleName))
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
              styleUpdates[styleName] = "";
            }
          }
        }
        for (styleName in nextProp) {
          // 如果新的属性有，并且新的属性值和老的属性值不一样
          if (
            nextProp.hasOwnProperty(styleName) &&
            lastProp[styleName] !== nextProp[styleName]
          ) {
            if (!styleUpdates) {
              styleUpdates = {};
              styleUpdates[styleName] = nextProp[styleName];
            }
          }
        }
      } else {
        styleUpdates = nextProp;
      }
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === "string" || typeof nextProp === "number") {
        (updatePayload = updatePayload || []).push(propKey, nextProp);
      }
    } else {
      (updatePayload = updatePayload || []).push(propKey, nextProp);
    }
  }

  if (styleUpdates) {
    (updatePayload = updatePayload || []).push(STYLE, styleUpdates);
  }
  // 新老属性对比，返回差异的数组 [key1, value1, key2, value2]
  return updatePayload;
}

export function updateProperties(domElement, updatePayload) {
  updateDOMProperties(domElement, updatePayload);
}

function updateDOMProperties(domElement, updatePayload) {
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propKey = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propKey === STYLE) {
      setValueForStyles(domElement, propValue)
    } else if (propKey === CHILDREN) {
      // TODO - 
      setTextContent(domElement, propValue);
    } else {
      setValueForProperty(domElement, propKey, propValue);
    }
  }
}
