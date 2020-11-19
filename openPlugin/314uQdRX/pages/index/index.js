Page({
  data: {
    score: 0,
    best: 0,
    row: [],
    ttt:1
  },
  endgame: function (cells) {
    var kong = true;
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        if (cells[x][y] == "") {
          kong = false;
        }
      }
    }
    if (kong) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if ((j + 1) < 4 && cells[i][j] == cells[i][j + 1]) {
            return false;
          }
          if ((j + 1) < 4 && cells[j][i] == cells[j + 1][i]) {
            return false;
          }
        }
      }
      return true;
    }
    return false;
  },
  newgame: function () {
    this.mystoragesync();
    this.init();
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      mask: true,
      duration: 300
    })
  },
  touchStartX: 0,
  touchStartY: 0,
  touchEndX: 0,
  touchEndY: 0,
  driection: 0,
  touchstart: function (e) {
    var t = e.touches[0];
    this.touchStartX = t.clientX;
    this.touchStartY = t.clientY;
  },
  touchmove: function (e) {
    var t = e.touches[0];
    this.touchEndX = t.clientX;
    this.touchEndY = t.clientY;
  },
  touchend: function (e) {
    var x = this.touchEndX - this.touchStartX;
    var movex = Math.abs(x);
    var y = this.touchEndY - this.touchStartY;
    var movey = Math.abs(y);
    var arr = this.data.row;
    if (movex > movey && this.touchEndX != 0) {
      if (x > 0) {
        this.driection = 3;
        arr = this.opserSet(arr);
      } else if (x < 0) {
        this.driection = 4;
        arr = this.opserSet(arr);
      }
    } else if (movex < movey && this.touchEndY != 0) {
      if (y > 0) {
        this.driection = 2;
        arr = this.opserSet(arr);
      } else if (y < 0) {
        this.driection = 1;
        arr = this.opserSet(arr);
      }
    }
    this.setData({
      row: arr
    });
  },
  opserSet: function (arr) {
    if (this.data.ttt ==1){
      this.setData({
        ttt: 2
      })
    }else{
      this.setData({
        ttt: 1
      })
    }
    arr = this.changeDirection(arr);
    this.merge(arr);
    this.moveUnit(arr);
    arr = this.reChangeDirection(arr);
    this.randomunt(arr);
    if (this.endgame(arr)) {
      this.gameover(arr)
    }
    return arr
  },
  init: function () {
    var result = [];
    var k = 0;
    var heightScore = wx.getStorageSync("best");
    for (let i = 0; i < 4; i++) {
      result[i] = [];
      for (let j = 0; j < 4; j++) {
        result[i][j] = "";
      }
    }
    this.randomunt(result);
    this.setData({
      score: 0,
      best: heightScore,
      row: result
    });
  },
  randomunt: function (cells) {
    var value = Math.random() < 0.9 ? 2 : 4;
    var re = [];
    var count = 0;
    for (let k = 0; k < 4; k++) {
      for (let kk = 0; kk < 4; kk++) {
        if (cells[k][kk] == "") {
          re[count++] = {
            k,
            kk
          };
        }
      }
    }
    if (count > 0) {
      var location = parseInt(Math.random() * (re.length - 1));
      cells[re[location].k][re[location].kk] = value;
    }
  },
  changeDirection: function (cells) {
    var result = [
      [],
      [],
      [],
      []
    ]
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.driection == 1) {
          result[i][j] = cells[j][3 - i]
        } else if (this.driection == 2) {
          result[i][j] = cells[3 - j][i]
        } else if (this.driection == 3) {
          result[i][j] = cells[i][3 - j]
        } else if (this.driection == 4) {
          result[i][j] = cells[i][j]
        }
      }
    }
    return result;
  },
  reChangeDirection: function (result) {
    var cells = [
      [],
      [],
      [],
      []
    ]
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this.driection == 1) {
          cells[i][j] = result[3 - j][i];
        } else if (this.driection == 2) {
          cells[i][j] = result[j][3 - i];
        } else if (this.driection == 3) {
          cells[i][j] = result[i][3 - j];
        } else if (this.driection == 4) {
          cells[i][j] = result[i][j];
        }
      }
    }
    return cells;
  },
  merge: function (cells) {
    var sscore = this.data.score;
    var heightScore = this.data.best;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (cells[i][j] != "") {
          if ((j + 1) < 4 && cells[i][j] == cells[i][j + 1] && cells[i][j] != 2048) {
            cells[i][j] += cells[i][j + 1];
            sscore += cells[i][j + 1];
            cells[i][j + 1] = "";
            j++;
          } else {
            for (let k = j + 1; k < 4; k++) {
              if (cells[i][k] != "") {
                if (cells[i][j] == cells[i][k] && cells[i][j] != 2048) {
                  cells[i][j] += cells[i][k];
                  sscore += cells[i][k];
                  cells[i][k] = "";
                  j = k;
                } else {
                  j = k - 1;
                }
                break;
              }
            }
          }
        }
      }
    }
    this.setData({
      score: sscore
    });
    if (sscore > heightScore) {
      this.setData({
        best: sscore
      })
    }
  },
  moveUnit: function (cells) {
    for (let i = 0; i < 4; i++) {
      var count = 0;
      for (let j = 0; j < 4; j++) {
        if (cells[i][j] != "") {
          cells[i][count++] = cells[i][j];
          if ((count - 1) != j) {
            cells[i][j] = "";
          }
        }
      }
    }
  },
  gameover: function () {
    var that = this;
    that.mystoragesync();
    wx.showModal({
      title: '游戏结束',
      content: '你的得分是' + that.data.score,
      showCancel: false,
      confirmText: "重新开始",
      success: function (res) {
        if (res.confirm) {
          that.init();
        }
      }
    });
  },
  onLoad: function (options) { },
  onReady: function () {
    this.init();
  },
  onShow: function () { },
  onHide: function () {
    this.mystoragesync();
  },
  mystoragesync: function () {
    var that = this;
    var heightscore = that.data.best;
    try {
      wx.setStorageSync('best', heightscore);
    } catch (e) { }
  },
  onUnload: function () { },
  onPullDownRefresh: function () { },
  onReachBottom: function () { },
  onShareAppMessage: function () { }
})