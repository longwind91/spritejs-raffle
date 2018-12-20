const INNER_RADIUS = 0.2; // 内圈半径比例
const OUTER_RADIUS = 0.8; // 外圈半径比例
const LIGHT_RADIUS = 0.9; // 跑马灯位置比例
const ROTATE_SPEED = 5; // 旋转圈数，决定旋转速度
const LIGHT_NUMBER = 20; // 跑马灯灯数量
const EASE_DURATION = 5000; // 抽奖动画时长为5000*2
const EASE_DURATION_LIGHT = 640; // 跑马灯闪烁时长，最长640，最短40

const draw = Symbol("draw"); // 绘制组件
const listener = Symbol("listener"); //设置鼠标事件监听等
const animate = Symbol("animate"); //转盘动画
const lightAnimate = Symbol("lightAnimate"); //跑马灯动画
const setCanvasCursor = Symbol("setCanvasCursor"); //设置鼠标样式
const getDgreeArr = Symbol("getDgreeArr"); // 计算扇形角度

const _id = Symbol("id");
const _radius = Symbol("radius"); // 半径
const _data = Symbol("data"); // 数据
const _style = Symbol("style"); // 自定义样式
const _DIVIDE_NUMBER = Symbol("DIVIDE_NUMBER"); // 扇形份数
const _diffDegree = Symbol("diffDegree"); // 初始角度
const _spritejs = Symbol("spritejs"); // spritejs引用
const _degreeArray = Symbol("degreeArray"); //获得每个扇形角度
const _handlers = Symbol("handlers"); // 事件
const _lastDegree = Symbol("lastDegree"); //抽奖后旋转角度记录，下次使用
const _rotating = Symbol("rotating"); // 是否正在旋转转盘
const _stopLightAnimation = Symbol("stopLightAnimation"); //是否要停止跑马灯
const _result = Symbol("result"); // 抽奖结果
const _choujiang = Symbol("choujiang"); // 抽奖文字label

export default class Raffle {
  constructor(spritejs, { data, radius, id, style }) {
    this[_id] = id;
    this[_radius] = radius;
    this[_data] = data;
    this[_style] = style || {};
    this[_DIVIDE_NUMBER] = data.length;
    this[_diffDegree] = 270 - 180 / this[_DIVIDE_NUMBER];
    this[_spritejs] = spritejs;
    this[_degreeArray] = Raffle[getDgreeArr](this[_DIVIDE_NUMBER]);
    this[_handlers] = {};
    this[_lastDegree] = 0;
    this[_rotating] = false;
    this[_stopLightAnimation] = false;
    this[_result] = -1;
    this[_choujiang] = null;
    this[draw]();
  }

  // 绘制内容
  async [draw]() {
    const { Scene, Group, Label, Sprite, Triangle, Ring } = this[_spritejs];
    const that = this;
    const scene = new Scene("#" + this[_id], {
      viewport: [this[_radius] * 2, this[_radius] * 2],
      displayRatio: "auto",
      minDsiplayRatio: 1
    });
    const layer = scene.layer();

    // 预加载图片
    for (let i = 0, len = this[_data].length; i < len; i++) {
      await scene.preload({ id: `image${i}`, src: this[_data][i].image });
    }

    const circle1 = new Sprite(this[_style].circleImage1);
    circle1.attr({
      borderRadius: [this[_radius], this[_radius]],
      size: [this[_radius] * 2, this[_radius] * 2],
      pos: [this[_radius], this[_radius]],
      bgcolor: this[_style].colors[0] || "#FCC101",
      zIndex: 0,
      anchor: 0.5
    });
    const circle2 = new Sprite(this[_style].circleImage2);
    circle2.attr({
      borderRadius: [
        this[_radius] * OUTER_RADIUS,
        this[_radius] * OUTER_RADIUS
      ],
      size: [
        this[_radius] * OUTER_RADIUS * 2,
        this[_radius] * OUTER_RADIUS * 2
      ],
      pos: [this[_radius], this[_radius]],
      bgcolor: this[_style].colors[1] || "#F7A172",
      zIndex: 2,
      anchor: 0.5
    });
    const circle3 = new Sprite(this[_style].circleImage3);
    circle3.attr({
      borderRadius: [
        this[_radius] * INNER_RADIUS,
        this[_radius] * INNER_RADIUS
      ],
      size: [
        this[_radius] * INNER_RADIUS * 2,
        this[_radius] * INNER_RADIUS * 2
      ],
      pos: [this[_radius], this[_radius]],
      bgcolor: this[_style].colors[2] || "#FCC101",
      zIndex: 5,
      anchor: 0.5
    });

    this[_choujiang] = new Label("抽奖");
    this[_choujiang].attr({
      pos: [this[_radius], this[_radius]],
      fillColor: "#FFF",
      font: " small-caps 20px Arial",
      anchor: 0.5,
      zIndex: 6
    });

    let triangle = null;
    // 有图加图，无图则绘
    if (this[_style].triangleImage) {
      triangle = new Sprite(this[_style].triangleImage);
      triangle.attr({
        pos: [this[_radius], this[_radius] * 0.8],
        size: [this[_radius] * 0.2, this[_radius] * 0.2],
        // bgcolor: this[_style].triangleColor || "#A40101",
        anchor: [0.5, 0.5],
        zIndex: 4
      });
    } else {
      triangle = new Triangle();
      triangle.attr({
        pos: [this[_radius], this[_radius] - this[_radius] * 0.35],
        sides: [this[_radius] * 0.2, this[_radius] * 0.2],
        angle: "60",
        fillColor: this[_style].colors[3] || "#A40101",
        rotate: 60,
        zIndex: 4
      });
    }
    const gp = new Group();
    gp.attr({
      pos: [this[_radius], this[_radius]],
      rotate: this[_diffDegree],
      zIndex: 3
    });
    const radian = (Math.PI * 2) / this[_DIVIDE_NUMBER];
    const degree = 360 / this[_DIVIDE_NUMBER];
    for (let i = 0; i < this[_DIVIDE_NUMBER]; i++) {
      const img = new Sprite(`image${i}`);
      img.attr({
        // textures: igmsArr[i][0].img,
        anchor: 0.5,
        pos: [
          this[_radius] * 0.4 * Math.cos(radian * (i + 0.5)),
          this[_radius] * 0.4 * Math.sin(radian * (i + 0.5))
        ],
        size: [this[_radius] * 0.1, this[_radius] * 0.1],
        rotate: 90 + degree * (i + 0.5)
      });

      const ring = new Ring();
      ring.attr({
        innerRadius: this[_radius] * INNER_RADIUS + 20,
        outerRadius: this[_radius] * OUTER_RADIUS - 20,
        lineWidth: 2,
        color: this[_style].colors[4] || "#ff0",
        startAngle: radian * i,
        endAngle: radian * i + radian,
        fillColor: this[_data][i].color,
        anchor: 0.5,
        pos: [0, 0]
      });
      const label = new Label(this[_data][i].text);
      label.attr({
        pos: [
          this[_radius] * 0.6 * Math.cos(radian * (i + 0.5)),
          this[_radius] * 0.6 * Math.sin(radian * (i + 0.5))
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
    layer.append(triangle, circle3, this[_choujiang]);
    let snapshot = new Sprite();
    snapshot.attr({
      textures: image,
      anchor: 0.5,
      pos: [this[_radius], this[_radius]],
      zIndex: 3
    });
    scene.layer().append(snapshot);

    const lightGroup = new Group();
    const lightArray = [];
    lightGroup.attr({ pos: [this[_radius], this[_radius]], zIndex: 4 });
    const ligthRadian = (Math.PI * 2) / LIGHT_NUMBER;

    for (let i = 0; i < LIGHT_NUMBER; i++) {
      const light = new Sprite({
        anchor: 0.5,
        size: [16, 16],
        pos: [
          this[_radius] * LIGHT_RADIUS * Math.cos(ligthRadian * i),
          this[_radius] * LIGHT_RADIUS * Math.sin(ligthRadian * i)
        ],
        bgcolor: "#fff",
        border: [2, "#EEE685"],
        borderRadius: 8
      });
      lightGroup.append(light);
      lightArray.push(light);
    }
    layer.append(lightGroup);

    this[listener]({
      that: this,
      circle3: circle3,
      lightArray: lightArray,
      snapshot: snapshot
    });
    this.dispatchEvent("ready");
  }

  // 监听注册
  [listener]({ that, circle3, lightArray, snapshot }) {
    circle3.on("mouseenter", (evt) => {
      if (!this[_rotating]) {
        this[_choujiang].attr({ font: " small-caps bold 22px Arial" });
        this[setCanvasCursor](evt, "pointer");
      }
    });

    circle3.on("mouseleave", (evt) => {
      this[setCanvasCursor](evt);
      if (!this[_rotating]) {
        this[_choujiang].attr({ font: " small-caps 20px Arial" });
      }
    });

    circle3.on("click", (evt) => {
      this.dispatchEvent("startButtonClick");
    });

    this.on("start", function() {
      const evt = {
        target: null
      };
      that[_stopLightAnimation] = false;
      that[lightAnimate]({ that: that, lightArray: lightArray });
      that[animate]({ snapshot: snapshot, that: that, evt: evt });
    });
  }

  // 转盘动画
  [animate]({ snapshot, that, evt }) {
    if (!that[_rotating]) {
      that[_choujiang].attr({ font: " small-caps bold 22px Arial" });
      that[_result] = -1;
      // that.dispatchEvent("start");
      that[_rotating] = true;
      snapshot
        .animate(
          [
            { rotate: that[_lastDegree] },
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
          // console.log(that);
          if (that[_result] < 0) {
            that[_rotating] = false;
            that[_stopLightAnimation] = true;
            that.dispatchEvent("error");
            return;
          }
          snapshot
            .animate(
              [
                { rotate: 0 },
                {
                  rotate: 360 * ROTATE_SPEED + that[_degreeArray][that[_result]]
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
              that[_stopLightAnimation] = true;
              that[_lastDegree] = that[_degreeArray][that[_result]];
              that[_rotating] = false;
              that[_result] = -1;
              that.dispatchEvent("completed");
              that[_choujiang].attr({ font: " small-caps 20px Arial" });
              that[setCanvasCursor](evt);
            });
        });
    }
  }

  // 跑马灯动画
  [lightAnimate]({ that, lightArray }) {
    if (that[_rotating]) {
      return;
    }
    let dura = EASE_DURATION_LIGHT;
    let i = 0;
    let firstDate = new Date().getTime();
    let param = Math.pow(EASE_DURATION, 4);
    let onceAnimate = (light) => {
      if (that[_stopLightAnimation] || dura > EASE_DURATION_LIGHT + 100) {
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
  static [getDgreeArr](divideNumber) {
    let arr = new Array(divideNumber);
    for (let i = 0; i < divideNumber; i++) {
      arr[i] = (-(i * 360) / divideNumber) % 360;
    }
    return arr;
  }

  // 开始动画
  start() {
    this.dispatchEvent("start");
  }

  // 设置抽奖结果
  setResult(index) {
    this[_result] = index;
  }

  // 注册监听
  on(type, handler) {
    if (typeof this[_handlers][type] == "undefined") this[_handlers][type] = [];
    this[_handlers][type].push(handler);
  }

  // 分发监听
  dispatchEvent(type) {
    if (this[_handlers][type] instanceof Array) {
      var handlers = this[_handlers][type];
      for (var i = 0; i < handlers.length; i++) {
        handlers[i]();
      }
    }
  }

  // 解除监听
  off(type, handler) {
    if (!this[_handlers][type]) return;
    var handlers = this[_handlers][type];
    if (handler == undefined) {
      handlers.length = 0; //不传某个具体函数时，解绑所有
    } else if (handlers.length) {
      for (var i = 0; i < handlers.length; i++) {
        if (handlers[i] == handler) {
          //解绑单个
          this[_handlers][type].splice(i, 1);
        }
      }
    }
  }

  // 设置鼠标样式
  [setCanvasCursor](evt, cursor = "default") {
    const { target } = evt;
    if (target && target.context) {
      target.context.canvas.style.cursor = cursor;
    }
  }
}
