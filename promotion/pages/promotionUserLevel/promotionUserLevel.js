var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    userName: '',
    currentIndex: 0,
    userLevels: []
  },
  levelId: '',
  onLoad: function (options) {
    this.levelId = options.levelId
    this.dataInitial()
  },
  dataInitial: function () {
    this.getPromotionLevelInfo()
  },
  getPromotionLevelInfo:function(){
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributionLevelInfo',
      data: {
        page: -1
      },
      success: function (res) {
        let currentIndex = 0;
        if(res.data){
          for (let i = 0; i < res.data.length;i++){
            if (res.data[i].id == _this.levelId){
              currentIndex = i;
            }
          }
        }
        _this.setData({
          userLevels: res.data,
          currentIndex: currentIndex
        })
      }
    })
  }
})
