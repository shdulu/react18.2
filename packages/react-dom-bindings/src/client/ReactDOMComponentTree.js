const randomKey = Math.random().toString(36).slice(2);
const internalInstanceKey = "__reactFiber$" + randomKey;
const internalPropsKey = "__reactProps$" + randomKey;

/**
 * 提前缓存fiber节点的实例到DOM节点上
 *
 * @export
 * @param {*} hostInst fiber
 * @param {*} node
 */
export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}
/**
 * 从真实的DOM节点上获取它对应得fiber节点
 *
 * @export
 * @param {*} targetNode
 */
export function getClosestInstanceFromNode(targetNode) {
  const targetInst = targetNode[internalInstanceKey];
  if (targetInst) {
    return targetInst;
  }
  return null;
}

export function updateFiberProps(node, props) {
  node[internalPropsKey] = props;
}
export function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
