const INNER_RADIUS = 0.2; // 内圈半径比例
const OUTER_RADIUS = 0.8; // 外圈半径比例
const ROTATE_SPEED = 5; // 旋转圈数
const LIGHT_NUMBER = 20; // 跑马灯灯数量
const EASE_DURATION = 5000; // 抽奖动画时长为5000*2
const EASE_DURATION_LIGHT = 640; // 跑马灯闪烁时长，最长640，最短40
export default class Raffle {
  constructor(spritejs, { data, radius, id, style }) {
    this.radius = radius; // 半径
    this.data = data; // 数据
    this.style = style || {}; // 自定义样式
    this.DIVIDE_NUMBER = data.length; // 扇形份数
    this.diffDegree = 270 - 180 / this.DIVIDE_NUMBER; // 初始角度
    this.spritejs = spritejs; // spritejs引用
    this.degreeArray = this.getDgreeArr(this.DIVIDE_NUMBER); //获得每个扇形角度
    this.handlers = {}; // 事件
    this.lastDegree = 0; //抽奖后旋转角度记录，下次使用
    this.rotating = false; // 是否正在旋转转盘
    this.stopLightAnimation = false; //是否要停止跑马灯
    this.result = -1; // 抽奖结果
    this.choujiang = null; // 抽奖文字label
    this.draw(id);
  }

  // 绘制内容
  async draw(id) {
    const { Scene, Group, Label, Sprite, Triangle, Ring } = this.spritejs;
    this.id = id;
    const that = this;
    const scene = new Scene("#" + id, {
      viewport: [this.radius * 2, this.radius * 2],
      displayRatio: "auto",
      minDsiplayRatio: 1
    });
    const layer = scene.layer();

    // 预加载图片
    for (let i = 0, len = this.data.length; i < len; i++) {
      await scene.preload({ id: `image${i}`, src: this.data[i].image });
    }

    const circle1 = new Sprite(this.style.circleImage1);
    circle1.attr({
      borderRadius: [this.radius, this.radius],
      size: [this.radius * 2, this.radius * 2],
      pos: [this.radius, this.radius],
      bgcolor: this.style.colors[0] || "#FCC101",
      zIndex: 0,
      anchor: 0.5
    });
    const circle2 = new Sprite(this.style.circleImage2);
    circle2.attr({
      borderRadius: [this.radius * OUTER_RADIUS, this.radius * OUTER_RADIUS],
      size: [this.radius * OUTER_RADIUS * 2, this.radius * OUTER_RADIUS * 2],
      pos: [this.radius, this.radius],
      bgcolor: this.style.colors[1] || "#F7A172",
      zIndex: 2,
      anchor: 0.5
    });
    const circle3 = new Sprite(this.style.circleImage3);
    circle3.attr({
      borderRadius: [this.radius * INNER_RADIUS, this.radius * INNER_RADIUS],
      size: [this.radius * INNER_RADIUS * 2, this.radius * INNER_RADIUS * 2],
      pos: [this.radius, this.radius],
      bgcolor: this.style.colors[2] || "#FCC101",
      zIndex: 5,
      anchor: 0.5
    });

    this.choujiang = new Label("抽奖");
    this.choujiang.attr({
      pos: [this.radius, this.radius],
      fillColor: "#FFF",
      font: " small-caps 20px Arial",
      anchor: 0.5,
      zIndex: 6
    });

    let triangle = null;
    // 有图加图，无图则绘
    if (this.style.triangleImage) {
      triangle = new Sprite(this.style.triangleImage);
      triangle.attr({
        pos: [this.radius, this.radius * 0.8],
        size: [this.radius * 0.2, this.radius * 0.2],
        // bgcolor: this.style.triangleColor || "#A40101",
        anchor: [0.5, 0.5],
        zIndex: 4
      });
    } else {
      triangle = new Triangle();
      triangle.attr({
        pos: [this.radius, this.radius - this.radius * 0.35],
        sides: [this.radius * 0.2, this.radius * 0.2],
        angle: "60",
        fillColor: this.style.colors[3] || "#A40101",
        rotate: 60,
        zIndex: 4
      });
    }
    const gp = new Group();
    gp.attr({
      pos: [this.radius, this.radius],
      rotate: this.diffDegree,
      zIndex: 3
    });
    const radian = (Math.PI * 2) / this.DIVIDE_NUMBER;
    const degree = 360 / this.DIVIDE_NUMBER;
    for (let i = 0; i < this.DIVIDE_NUMBER; i++) {
      const img = new Sprite(`image${i}`);
      img.attr({
        // textures: igmsArr[i][0].img,
        anchor: 0.5,
        pos: [
          this.radius * 0.4 * Math.cos(radian * (i + 0.5)),
          this.radius * 0.4 * Math.sin(radian * (i + 0.5))
        ],
        size: [this.radius * 0.1, this.radius * 0.1],
        rotate: 90 + degree * (i + 0.5)
      });

      const ring = new Ring();
      ring.attr({
        innerRadius: this.radius * INNER_RADIUS + 20,
        outerRadius: this.radius * OUTER_RADIUS - 20,
        lineWidth: 2,
        color: this.style.colors[4] || "#ff0",
        startAngle: radian * i,
        endAngle: radian * i + radian,
        fillColor: this.data[i].color,
        anchor: 0.5,
        pos: [0, 0]
      });
      const label = new Label(this.data[i].text);
      label.attr({
        pos: [
          this.radius * 0.6 * Math.cos(radian * (i + 0.5)),
          this.radius * 0.6 * Math.sin(radian * (i + 0.5))
        ],
        fillColor: "#707",
        anchor: 0.5,
        rotate: 90 + degree * (i + 0.5)
      });

      gp.append(ring);
      gp.append(label);
      gp.append(img);
    }
    layer.append(gp);

    // 获取快照
    const canvas = await scene.snapshot();
    const image = await canvas.toDataURL();

    gp.remove();
    layer.append(circle1, circle2);
    layer.append(triangle, circle3, this.choujiang);
    let snapshot = new Sprite();
    snapshot.attr({
      textures: image,
      anchor: 0.5,
      pos: [this.radius, this.radius],
      zIndex: 3
    });
    scene.layer().append(snapshot);

    const lightGroup = new Group();
    const lightArray = [];
    lightGroup.attr({ pos: [this.radius, this.radius], zIndex: 4 });
    const ligthRadian = (Math.PI * 2) / LIGHT_NUMBER;

    for (let i = 0; i < LIGHT_NUMBER; i++) {
      const light = new Sprite({
        anchor: 0.5,
        size: [16, 16],
        pos: [
          this.radius * 0.9 * Math.cos(ligthRadian * i),
          this.radius * 0.9 * Math.sin(ligthRadian * i)
        ],
        bgcolor: "#fff",
        border: [2, "#EEE685"],
        borderRadius: 8
      });
      lightGroup.append(light);
      lightArray.push(light);
    }
    layer.append(lightGroup);

    this.listener({
      that: this,
      circle3: circle3,
      lightArray: lightArray,
      snapshot: snapshot
    });
    this.dispatchEvent("ready");
  }

  // 监听注册
  listener({ that, circle3, lightArray, snapshot }) {
    circle3.on("mouseenter", (evt) => {
      if (!this.rotating) {
        this.choujiang.attr({ font: " small-caps bold 22px Arial" });
        this.setCanvasCursor(evt, "pointer");
      }
    });

    circle3.on("mouseleave", (evt) => {
      this.setCanvasCursor(evt);
      if (!this.rotating) {
        this.choujiang.attr({ font: " small-caps 20px Arial" });
      }
    });

    circle3.on("click", (evt) => {
      this.stopLightAnimation = false;
      this.ligthAnimate({ that: this, lightArray: lightArray });
      that.animate({ snapshot: snapshot, that: that, evt: evt });
    });

    this.on("click", function() {
      const evt = {
        target: null
      };
      that.stopLightAnimation = false;
      that.ligthAnimate({ that: that, lightArray: lightArray });
      that.animate({ snapshot: snapshot, that: that, evt: evt });
    });
  }

  // 转盘动画
  animate({ snapshot, that, evt }) {
    if (!that.rotating) {
      that.choujiang.attr({ font: " small-caps bold 22px Arial" });
      that.result = -1;
      that.dispatchEvent("start");
      that.rotating = true;
      snapshot
        .animate(
          [
            { rotate: that.lastDegree },
            {
              rotate: 360 * ROTATE_SPEED
            }
          ],
          {
            duration: EASE_DURATION,
            fill: "both",
            iterations: 1,
            easing: "cubic-bezier(0.895, 0.03, 0.685, 0.22)"
          }
        )
        .finished.then(() => {
          console.log(that);
          if (that.result < 0) {
            that.rotating = false;
            that.stopLightAnimation = true;
            that.dispatchEvent("error");
            return;
          }
          snapshot
            .animate(
              [
                { rotate: 0 },
                {
                  rotate: 360 * ROTATE_SPEED + that.degreeArray[that.result]
                }
              ],
              {
                duration: EASE_DURATION,
                fill: "both",
                iterations: 1,
                easing: "cubic-bezier(0.165, 0.84, 0.44, 1)"
              }
            )
            .finished.then(() => {
              that.stopLightAnimation = true;
              that.lastDegree = that.degreeArray[that.result];
              that.rotating = false;
              that.result = -1;
              that.dispatchEvent("completed");
              that.choujiang.attr({ font: " small-caps 20px Arial" });
              that.setCanvasCursor(evt);
            });
        });
    }
  }

  // 跑马灯动画
  ligthAnimate({ that, lightArray }) {
    console.log("lightAnimate");
    console.log(that);
    if (that.rotating) {
      return;
    }
    let dura = EASE_DURATION_LIGHT;
    let i = 0;
    let firstDate = new Date().getTime();
    let param = Math.pow(EASE_DURATION, 4);
    let onceAnimate = (light) => {
      if (that.stopLightAnimation || dura > EASE_DURATION_LIGHT + 100) {
        return;
      }
      light
        .animate([{ opacity: 0 }], {
          duration: dura
        })
        .finished.then(() => {
          let nowDate = new Date().getTime();
          dura =
            40 +
            ((EASE_DURATION_LIGHT - 40) *
              Math.pow(nowDate - firstDate - EASE_DURATION, 4)) /
              param;
          i = (i + 1) % LIGHT_NUMBER;
          return onceAnimate(lightArray[i]);
        });
    };
    onceAnimate(lightArray[i]);
  }

  // 计算扇形角度
  getDgreeArr(divideNumber) {
    let arr = new Array(divideNumber);
    for (let i = 0; i < divideNumber; i++) {
      arr[i] = (-(i * 360) / divideNumber) % 360;
    }
    return arr;
  }

  start() {
    this.dispatchEvent("click");
  }
  // 设置抽奖结果
  setResult(index) {
    this.result = index;
  }

  // 注册监听
  on(type, handler) {
    if (typeof this.handlers[type] == "undefined") this.handlers[type] = [];
    this.handlers[type].push(handler);
  }

  // 分发监听
  dispatchEvent(type) {
    if (this.handlers[type] instanceof Array) {
      var handlers = this.handlers[type];
      for (var i = 0; i < handlers.length; i++) {
        handlers[i]();
      }
    }
  }

  // 解除监听
  off(type, handler) {
    if (!this.handlers[type]) return;
    var handlers = this.handlers[type];
    if (handler == undefined) {
      handlers.length = 0; //不传某个具体函数时，解绑所有
    } else if (handlers.length) {
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i] == handler) {
          //解绑单个
          this.handlers[type].splice(i, 1);
        }
      }
    }
  }

  // 设置鼠标样式
  setCanvasCursor(evt, cursor = "default") {
    const { target } = evt;
    if (target && target.context) {
      target.context.canvas.style.cursor = cursor;
    }
  }
}
