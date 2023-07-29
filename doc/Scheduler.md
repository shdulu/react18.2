### Scheduler 调取器

> Scheduler 调度任务优先级。高优任务先进入 Reconciler(协调器).
> Scheduler 的主要功能是时间分片，每隔一段时间就把主线程还给浏览器，避免 JS 执行长时间占用主线程造成页面卡顿。

#### 二叉树

- 每个节点最多有两个子节点

![二叉树](./images/er_cha_shu.jpg "二叉树")

#### 满二叉树

- 除最后一层无任何子节点外，每一层上的所有结点都有两个子结点的二叉树

![满二叉树](./images/man_er_cha_shu.jpg "满二叉树")

#### 完全二叉树

- 叶子结点只能出现在最下层和次下层
- 且最下层的叶子结点集中在树的左部

![完全二叉树](./images/wan_quan_er_cha_shu.jpg "完全二叉树")

#### 最小堆

- 最小堆是一种**经过排序**的完全二叉树
- 其中任一非终端节点的数据值均不大于其左子节点和右子节点的值
- 根节点值是所有堆结点值中最小者
- 编号关系
  - 左子节点编号=父节点编号\*2
  - 右子节点编号=左子节点编号+1
  - 父节点编号=子节点编号除以 2 取整
- 索引关系
  - 左子节点索引=(父节点索引+1)\*2-1
  - 右子节点索引=左子节点索引+1
  - 父节点索引=(子节点索引-1)/2

![最小堆](./images/zui_xiao_dui.jpg "最小堆")

#### MessageChannel

- 目前 `requestIdleCallback` 浏览器的兼容性不好
- 所以 React 利用 [MessageChannel](https://developer.mozilla.org/zh-CN/docs/Web/API/MessageChannel "MessageChannel") 模拟了 requestIdleCallback，将回调延迟到绘制操作之后执行
- MessageChannel API 允许我们创建一个新的消息通道，并通过它的两个 MessagePort 属性发送数据
- MessageChannel 创建了一个通信的管道，这个管道有两个端口，每个端口都可以通过 postMessage 发送数据，而一个端口只要绑定了 onmessage 回调方法，就可以接收从另一个端口传过来的数据
- MessageChannel 是一个宏任务

![完全二叉树](./images/liu_lan_qi_zhen_1643277067067.jpg "完全二叉树")

```js
// 开启一个新的宏任务
let messageChannel = new MessageChannel();
var port1 = messageChannel.port1;
var port2 = messageChannel.port2;
port1.onmessage = (event) => {
  console.log("port1 接收到了来自port2的数据" + event.data);
};
port2.postMessage("发送给port1的数据");
```

####

1. react 为啥不用 `requestIdleCallback` 判断浏览器是否有剩余时间作为中断任务的标准，而是实现了 `Scheduler` 调度器 - 为啥要有一个 Scheduler

- 浏览器兼容性
- 触发频率不稳定，受很多因素影响。比如当我们的浏览器切换 tab 后，之前 tab 注册的 `requestIdleCallback` 触发的频率会变得很低

2. react 的时间分片为啥选择使用 MessageChannel

3. Scheduler 和 MessageChannel 的关系

关键点在于 React 执行下一个工作单元之前会调用 `Scheduler.shouldYield()` 询问浏览器是否有剩余时间，如果 `shouldYield` 返回 `true`

- 需要暂停 js 执行，把主线程控制权交还给浏览器，让浏览器有机会更新页面。
- 在下一帧会在申请 5ms 的时间片继续调度任务，执行上次没有执行完的任务。

要满足上面两点需要调度一个宏任务，因为宏任务会在下次 `EventLoop` 事件循环中执行，不会阻塞本次页面更新。而微任务是在本次页面更新前执行。所以使用 `MessageChannel` 的目的是为了产生一个宏任务，为啥不使用 `setTimeout`、 为啥不使用 `requestAnimationFrame(fn)`
