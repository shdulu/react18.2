/**
 *
 *
 * @export
 * @param {*} node
 * @param {*} name
 * @param {*} value
 */
export function setValueForProperty(node, name, value) {
  if (value === null) {
    node.removeAttribute(name);
  } else {
    node.setAttribute(name, value);
  }
}
