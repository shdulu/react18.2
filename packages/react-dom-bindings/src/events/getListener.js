import { getFiberCurrentPropsFromNode } from "../client/ReactDOMComponentTree";

/**
 * 获取此fiber上对应的回调函数
 *
 * @export
 * @param {*} inst fiber 节点
 * @param {*} registrationName 注册的事件名 onClick
 */
export default function getListener(inst, registrationName) {
  const { stateNode } = inst;
  if (stateNode === null) return null;
  const props = getFiberCurrentPropsFromNode(stateNode);
  if (props === null) return null;
  const listener = props[registrationName]; // props.onClick
  return listener;
}
