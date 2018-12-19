# spritejs-raffle

自定义样式的抽奖组件，canvas 抽奖圆盘，转成图片让动画流畅运行

### 安装

```javascript
npm install

npm start
```

访问 http://localhost:9092 查看具体 demo

<image src="example/images/demo.png" style="width:100%">

### 使用

```javascript
import { Raffle } from "../src/index";

const radius = 300;
let raffleIndex = 0;
spritejs.use(spriteShapes.install);

//测试数据
const testData = [
  {
    text: "未中奖",
    color: "#fff",
    image: "images/面无表情.png"
  },
  {
    text: "免单4999元",
    color: "#FE7676",
    image: "images/酷.png"
  },
  {
    text: "免单50元",
    color: "#F69562",
    image: "images/爱心.png"
  },
  {
    text: "免单10元",
    color: "#FE7676",
    image: "images/大笑.png"
  },
  {
    text: "免单5元",
    color: "#F69562",
    image: "images/开心.png"
  },
  {
    text: "免分期服务费",
    color: "#FE7676",
    image: "images/坏笑.png"
  },
  {
    text: "提高白条额度",
    color: "#F69562",
    image: "images/笑脸.png"
  }
];

// 可选参数，有image绘图，无image用colors填充颜色
const style = {
  //依次为外环，中环，内环，三角形，扇形边框颜色
  colors: ["#F74A44", "#F7A172", "#FCC101", "#A40101", "#FFFF00"],
  //图片设置依次为外环，中环，内环，三角形
  // circleImage1: "circle.png",
  // circleImage2: "circle.png",
  circleImage3: "images/circle.png"
  // triangleImage: "triangle.png",
};

// style参数可选
let raffle = new Raffle(spritejs, {
  id: "canvas-wrap",
  data: testData,
  radius: radius,
  style: style
});

// 点击抽检按钮，可运行动画开始抽奖，也可以提示无权限、用户抽奖次数完等等
raffle.on("startButtonClick", function() {
  // 开始转盘动画，分发start事件
  raffle.start();
});

//开始抽奖动画，通知外部，在点击转盘内圆后通知
raffle.on("start", function() {
  // 模拟从服务器得到抽奖结果
  setTimeout(function() {
    raffleIndex = Math.round(Math.random() * (testData.length - 1));
    console.log(
      `中奖类型: ${raffleIndex}  中奖结果： ${testData[raffleIndex].text}`
    );
    // 设置抽奖结果
    raffle.setResult(raffleIndex);
  }, 2000);
});

raffle.on("ready", function() {
  console.log("资源加载完毕");
  // 开始转盘动画，并分发start事件
  raffle.start();
});

// 超过5秒未得到抽奖数据，抛出错误
raffle.on("error", function() {
  alert("未得到抽奖结果");
});

//抽奖结束，通知外部
raffle.on("completed", function() {
  console.log("completed! " + testData[raffleIndex].text);
});
```
