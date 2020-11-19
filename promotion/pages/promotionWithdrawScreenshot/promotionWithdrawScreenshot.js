var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    screenShot: '',
    feedbackDialog: false,
    feedbackText: '',
  },
  feedbackId: '',
  onLoad: function (options) {
    this.feedbackId = options.feedbackId;
    this.setData({
      screenShot: options.images,
    })
  },
  previewImage: function (e) {
    let img = [];
    img.push(e.currentTarget.dataset.img)
    wx.previewImage({
      urls: img
    })
  },
  stopPropagation: function(){
  },
  hideFeedbackDialog: function(){
    this.setData({
      feedbackDialog: false
    })
  },
  showFeedbackDialog: function(){
    this.setData({
      feedbackDialog: true
    })
  },
  feedbackText: function (event) {
    this.setData({
      feedbackText: event.detail.value
    })
  },
  feedback: function () {
    let _this = this;
    if (!_this.data.feedbackText){
      app.showModal({
        content: '请输入需要反馈的内容'
      })
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppDistribution/updateWithdrawFeedback',
      data: {
        withdraw_history_id: _this.feedbackId,
        feedback: _this.data.feedbackText
      },
      success: function (res) {
        _this.setData({
          feedbackDialog: false
        })
      }
    })
  }
})
