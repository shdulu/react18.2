// React 共享的内部变量
import ReactCurrentDispatcher from "./ReactCurrentDispatcher";
import ReactCurrentOwner from "./ReactCurrentOwner";

const ReactSharedInternals = {
  ReactCurrentDispatcher,
  ReactCurrentOwner,
};
export default ReactSharedInternals;
