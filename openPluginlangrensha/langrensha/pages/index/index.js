let n = require('../../utils/networkManager.js')
var flag=true
Page({
  data: {
    cardList: ['平民', '狼人', '女巫', '预言家', '猎人', '丘比特', '守卫', '白痴', '盗贼', '长老', '野孩子', '野熊'],
    countList: [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    x: 0,
    num: 0,
    count: 4,
    login:false,
    imgBaseUrl: 'http://cdn.jisuapp.cn/static/plugin/images/langrensha/'
  },
  onLoad() {
    wx.showShareMenu({
    })
    wx.setNavigationBarTitle({
      title: '即速狼人杀',
    })
    var self = this;
  },
  openSet(){
    var self=this
    n.openSet(function(){
        self.setData({
          login:false
        })
    })
  },
  onGotUserInfo: function (e) {
    console.log(e.detail.errMsg)
    console.log(e.detail.userInfo)
    console.log(e.detail.rawData)
  },
  toRoomPage() {
    if(flag){
      flag=false
      wx.showLoading({
        title: '加载中',
      })
      n.insertRoom(this.data.count, this.data.countList, function (e) {
        console.log('转跳去下一页', e.id);
        wx.navigateTo({
          url: '../idCard/idCard?roomId=' + e.id,
        })
      });
      setTimeout(function () {
        wx.hideLoading()
        flag=true
      }, 3000)
    }
  },
  scroll: function (e) {
    let self = this;
    wx.createSelectorQuery().selectAll('#the-id').boundingClientRect(function (rects) {
      rects.forEach(function (rect) {
        let position = (rect.left + rect.right) / wx.getSystemInfoSync().screenWidth
        let count = (position - 0.3) * 14 / (1.6 - 0.3);
        count += 4;
        count = parseInt(count);
        if (count > 18) {
          count = 18;
        }
        if (count < 4) {
          count = 4
        }
        let numberOfHuman = parseInt((count - 3) / 2);
        self.setData({
          count: count,
          countList: [numberOfHuman, count - 3 - numberOfHuman, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0]
        })
      })
    }).exec()
  },
  onTapCard(e) {
    let index = e.currentTarget.id;
    let newCountList = this.data.countList;
    if (index == 0) {
      console.log("newCountList",newCountList)
      if (newCountList[1] == 1) {
        var tempNum;
        for (tempNum = 11; tempNum > 1; tempNum--) {
          console.log("tempNum:", tempNum)
          if (newCountList[tempNum] == 1) {
            newCountList[tempNum] = 0
            newCountList[0]++
            break;
          }
        }
        if(tempNum==1){
          wx.showModal({
            title: '下限提醒',
            content: '狼人数只能大于等于1',
            showCancel:false
          })
        return;
        }
      } else {
        newCountList[0] = newCountList[0] + 1
        newCountList[1] = newCountList[1] - 1
      }
    }
    else if (index == 1) {
      if (newCountList[0] == 0) {
        wx.showModal({
          title: '下限提醒',
          content: '平民数只能大于等于0',
          showCancel: false
        })
      } else {
        newCountList[1] = newCountList[1] + 1
        newCountList[0] = newCountList[0] - 1
      }
    }
    else {
      console.log("index", index)
      if (newCountList[index] == 1) {
        newCountList[index] = 0
        newCountList[0]++
      } else {
        if (newCountList[0] == 0) {
          wx.showModal({
            title: '下限提醒',
            content: '平民数只能大于等于0',
            showCancel: false
          })
          return;
        } else {
          newCountList[index] = 1
          newCountList[0]--
        }
      }
    }
    this.setData({
      countList: newCountList
    })
    console.log('身份:' + this.data.cardList[index] + "  数量:" + this.data.countList[index]);
  },
    version: function () {
    wx.showToast({
      title: 'version 1.5',
    })
  }
})