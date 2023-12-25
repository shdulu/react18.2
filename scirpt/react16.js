{
  /* <div id="A1">
  <div id="B1">
    <div id="C1"></div>
    <div id="C2"></div>
  </div>
  <div id="B2"></div>
</div>; */
}

let element = {
  type: "div",
  key: "A1",
  props: {
    id: "A1",
    children: [
      {
        type: "div",
        key: "B1",
        props: {
          id: "B1",
          children: [
            {
              type: "div",
              key: "C1",
              props: { id: "C1" },
            },
            {
              type: "div",
              key: "C2",
              props: { id: "C2" },
            },
          ],
        },
      },
      {
        type: "div",
        key: "B2",
        props: { id: "B2" },
      },
    ],
  },
};

function render(vdom, container) {
  let dom = document.createElement(vdom.type);
  Object.keys(vdom.props)
    .filter((key) => key !== "children")
    .forEach((key) => {
      dom[key] = vdom.props[key];
    });
  if (Array.isArray(vdom.props.children)) {
    vdom.props.children.forEach((child) => render(child, dom));
  }
  container.appendChild(dom);
}
render(element, document.getElementById('root'));
