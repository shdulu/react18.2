const MouseEventInterface = {
  clientX: 0,
  clientY: 0,
};
function createSyntheticEvent(interface) {
  /**
   * 合成事件的基类
   *
   * @param {*} reactName
   * @param {*} reactEventType
   * @param {*} targetInst
   * @param {*} nativeEvent
   * @param {*} nativeEventTarget
   */
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this._type = reactEventType;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;
  }
  return SyntheticBaseEvent;
}
export const SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface);
