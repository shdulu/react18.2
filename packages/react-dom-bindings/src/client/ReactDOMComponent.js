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
