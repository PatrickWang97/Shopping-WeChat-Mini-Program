var app = getApp();
var util = require('../../../utils/util.js');
function getRandomColor () {
  let rgb = []
  for (let i = 0 ; i < 3; ++i){
    let color = Math.floor(Math.random() * 256).toString(16)
    color = color.length == 1 ? '0' + color : color
    rgb.push(color)
  }
  return '#' + rgb.join('')
}
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '视频详情',
    },
    videoId: '',
    videoInfo: {},
    tabType: 'detail',
    commentHidden: true,
    commentLevel : '极佳',
    commentScore : 10,
    assessList: [],
    videoPosterHidden : false,
    videoBuyHidden: true,
    videoTime : {},
    videoPilot : true,
    commentFocus : false,
    danmuInputText: '',
    danmuList : [],
    videoGetStatus: 0,
    videoNeed: false,
    franchiseeId: ''
  },
  onLoad: function(options){
    let videoId = options.detail;
    let that = this;
    this.setData({
      videoId: videoId,
      franchiseeId: options.franchisee || ''
    });
    app.globalData.videoDetailRefresh = false;
    that.getVideoInfo();
    that.getAssessList();
    this.videoContext = wx.createVideoContext('videoDetail-video');
    this.route = this.__route__;
  },
  onShow : function(){
    if(app.globalData.videoDetailRefresh){
      this.getAssessList();
      app.globalData.videoDetailRefresh = false;
    }
  },
  onHide : function() {
    this.savingProgress();
  },
  onUnload : function(){
    this.savingProgress();
  },
  savingProgress : function() {
    let that = this;
    let time = this.data.videoTime;
    that.videoContext.pause();
    if(!time.currentTime){
      return ;
    }
    let progress = time.currentTime / time.duration * 100;
    app.sendRequest({
      url: '/index.php?r=AppVideo/SavingProgress',
      data: {
        video_id : that.data.videoId,
        progress : progress,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
      },
      hideLoading: true
    });
  },
  getVideoInfo : function() {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetVideoInfo',
      data: {
        video_id : that.data.videoId,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
        let info = res.data;
        let newdata = {};
        if(info.description){
          info.description = app.getWxParseResult(info.description);
        }
        info.video_view = app.handlingNumber(info.video_view);
        info.assess_count = app.handlingNumber(info.assess_count);
        if (info.is_free == '0' && info.is_buyed == 0 && info.limit_minutes == '0.0'){
          newdata['videoNeed'] = true;
        }
        if(info.type == 3 && /[\u4e00-\u9fa5]/.test(info.video_url)){
          info.video_url =  encodeURI(info.video_url);
        }
        newdata['videoInfo'] = info;
        newdata['videoGetStatus'] = 0;
        that.setData(newdata);
        if(info.enable_danmu == '1'){
          that.getDanmu();
          that.videoContext = wx.createVideoContext('videoDetail-video-danmu');
        }else{
          that.videoContext = wx.createVideoContext('videoDetail-video');
        }
      },
      successStatusAbnormal : function() {
        that.setData({
          videoGetStatus : 1
        });
      },
      successShowModalConfirm : function(argument) {
        app.turnBack();
      }
    });
  },
  firstPlay : true,
  videoPlay : function(event) {
    var that = this;
    this.setData({
      videoPosterHidden : true
    });
    if(this.firstPlay){
      this.firstPlay = false;
      app.sendRequest({
        url: '/index.php?r=AppVideo/AddVideoView',
        data: {
          video_id : that.data.videoId,
          sub_app_id: that.data.franchiseeId
        },
        method: 'post',
        success: function (res) {
        },
        hideLoading : true
      });
    }
  },
  videoPause : function(event) {
    console.log(event);
  },
  oldVideoTime: 0,
  pauseUpDateTimes: 0,
  videoTimeupdate : function(event) {
    let that = this;
    let time = event.detail;
    let info = that.data.videoInfo;
    that.setData({videoTime :time});
    that.oldVideoTime = time.currentTime;
    if(info.is_free == '0' && info.is_buyed != '1'){
      var limit_minutes = info.limit_minutes * 60;
      if(time.currentTime > limit_minutes){
        that.setData({
          videoPilot : false
        });
        if (that.pauseUpDateTimes > 5){
          that.videoContext.stop();
        }else{
          that.videoContext.pause();
        }
        that.pauseUpDateTimes++;
      }
    }
  },
  startPlayVideo : function(event) {
    this.videoContext.play();
    this.setData({
      videoPosterHidden : true
    });
  },
  exitFullScreen: function(){
    this.videoContext.exitFullScreen();
  },
  fullScreenChange (e) {
    let isFullScreen =  e.detail.fullScreen;
    let newData = {};
    newData['topNavBarData.isDefault'] = isFullScreen ? 1 : 0;
    this.setData(newData);
  },
  videoError: function (e) {
    app.showModal({
      content: e.detail.errMsg
    });
  },
  changeTab: function(event) {
    let type = event.currentTarget.dataset.type;
    this.setData({
      tabType : type
    });
  },
  showCommentPopup: function(event) {
    this.setData({
      commentHidden : false,
      commentFocus : true
    });
  },
  hiddenCommentPopup: function(event) {
    this.setData({
      commentHidden : true,
      commentFocus: false
    });
  },
  commentScoreChange : function(event) {
    let index = event.currentTarget.dataset.index;
    let score = event.currentTarget.dataset.score;
    let textarr = ['较差', '一般', '良好', '推荐', '极佳'];
    this.setData({
      commentScore : score,
      commentLevel: textarr[index]
    });
  },
  commentInput : function(event) {
    let text = event.detail.value;
    this.data.commentText = text;
  },
  publishCommentLoading : false,
  publishComment : function(event) {
    var that = this;
    if(!that.data.commentText){
      app.showModal({
          content: '请输入评论内容'
        });
      return ;
    }
    if(that.publishCommentLoading){
      return ;
    }
    that.publishCommentLoading = true;
    app.sendRequest({
      url: '/index.php?r=AppVideo/PublishAssess',
      data: {
        video_id : that.data.videoId,
        score: that.data.commentScore,
        content: that.data.commentText,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
        app.showModal({
          content: '评论成功'
        });
        let assess_count = that.data.videoInfo.assess_count + 1;
        that.setData({
          commentText : '',
          commentHidden : true ,
          commentFocus : false,
          'videoInfo.assess_count': assess_count
        });
        that.getAssessList();
      },
      complete : function() {
        that.publishCommentLoading = false;
      }
    });
  },
  getAssessList : function() {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetAssessList',
      data: {
        video_id : that.data.videoId,
        page: 1,
        page_size: 5,
        sub_app_id: that.data.franchiseeId
      },
      method: 'get',
      success: function (res) {
        var rdata = res.data;
        for (var i = 0; i < rdata.length; i++) {
          rdata[i].assess_info.assess.content = rdata[i].assess_info.assess.content.replace(/\n|\\n/g , '\n');
          if(rdata[i].assess_info.reply){
            rdata[i].assess_info.reply.content = rdata[i].assess_info.reply.content.replace(/\n|\\n/g , '\n');
          }
        }
        that.setData({
          assessList : rdata
        });
      }
    });
  },
  turnToVideoAssess : function(event) {
    let franchiseeParam = this.data.franchiseeId ? ('&franchisee=' + this.data.franchiseeId) : '';
    app.turnToPage('/video/pages/videoAssess/videoAssess?detail=' + this.data.videoId + franchiseeParam);
  },
  videoCollectLoading: false,
  videoCollect : function(event) {
    var that = this;
    if(that.videoCollectLoading){
      return ;
    }
    that.videoCollectLoading = true;
    let url = '';
    let is_favorited = that.data.videoInfo.is_favorited;
    if(is_favorited == 1){
      url = '/index.php?r=AppVideo/CancelFavorited';
    }else{
      url = '/index.php?r=AppVideo/FavoriteVideo';
    }
    app.sendRequest({
      url: url ,
      data: {
        video_id : that.data.videoId,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
        if(is_favorited == 1){
          app.showModal({
            content: '取消收藏'
          });
        }else{
          app.showModal({
            content: '收藏成功'
          });
        }
        that.setData({
          'videoInfo.is_favorited' : is_favorited == 1 ? 0 : 1
        });
      },
      complete : function() {
        that.videoCollectLoading = false;
      }
    });
  },
  assessLikedLoading: false,
  assessLiked : function(event) {
    var that = this;
    if(that.assessLikedLoading){
      return ;
    }
    that.assessLikedLoading = true;
    let index = event.currentTarget.dataset.index;
    let url = '';
    let assess_info = that.data.assessList[index];
    let like_status = assess_info.like_status;
    if(like_status == '1'){
      url = '/index.php?r=AppVideo/CancelAssessLiked'
    }else{
      url = '/index.php?r=AppVideo/AddAssessLiked'
    }
    app.sendRequest({
      url: url ,
      data: {
        video_id : that.data.videoId,
        assess_id : assess_info.id,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
        let newdata = {};
        let link_num = +assess_info.like_num;
        if(like_status == 1){
          newdata['assessList['+index+'].like_num'] = link_num - 1;
          app.showModal({
            content: '取消点赞'
          });
        }else{
          newdata['assessList['+index+'].like_num'] = link_num + 1;
          app.showModal({
            content: '点赞成功'
          });
        }
        newdata['assessList['+index+'].like_status'] = like_status == 1 ? 0 : 1
        that.setData(newdata);
      },
      complete : function() {
        that.assessLikedLoading = false;
      }
    });
  },
  showVideoBuy: function(event) {
    let buyed = event.currentTarget.dataset.buyed;
    if(buyed == '1'){
      app.showModal({
        content: '该视频您已经购买'
      });
    }else{
      this.setData({
        videoBuyHidden : false
      });
    }
  },
  hiddenVideoBuy: function(event) {
    this.setData({
      videoBuyHidden : true
    });
  },
  videoPay : function(event) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppVideo/AddVideoOrder' ,
      data: {
        video_id : that.data.videoId,
        formId : event.detail.formId,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
        that.payOrder(res.data);
      },
      complete : function() {
      }
    });
  },
  payOrder: function(orderId){
    let that = this;
    let paySuccess = function() {
      that.hiddenVideoBuy();
      that.setData({
        'videoInfo.is_buyed' : 1,
        videoPilot : true,
        videoNeed : false
      })
    };
    let payFail = function() {
      app.showModal({
        content: '支付失败'
      });
    };
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: function (res) {
        var param = res.data;
        param.orderId = orderId;
        param.success = paySuccess;
        app.wxPay(param);
      },
      fail: function(){
        payFail();
      },
      successStatusAbnormal: function () {
        payFail();
      }
    })
  },
  turnToVideoDetail : function(event) {
    let id = event.currentTarget.dataset.id;
    let franchiseeParam = this.data.franchiseeId ? ('&franchisee=' + this.data.franchiseeId) : '';
    app.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + id + franchiseeParam);
  },
  danmuId : [],
  getDanmu : function() {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetVideoDanmu' ,
      data: {
        video_id : that.data.videoId,
        page_size : 1000,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
        let list = res.data;
        for (var i = 0; i < list.length; i++) {
          list[i].time = +list[i].time;
          that.danmuId.push(list[i].id);
        }
        that.setData({
          danmuList : list
        });
      },
      complete : function() {
      }
    });
  },
  appendDanmu : function() {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetVideoDanmu' ,
      data: {
        video_id : that.data.videoId,
        page_size : 100,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      hideLoading: true,
      success: function (res) {
        let list = res.data;
        let oldlist = that.data.danmuList;
        let newlist = [];
        let idArr = that.danmuId;
        for (var i = 0; i < list.length; i++) {
          list[i].time = +list[i].time;
          if(idArr.indexOf(list[i].id) < 0){
            that.danmuId.push(list[i].id);
            newlist.push(list[i]);
          }
        }
        if(newlist.length > 0){
          that.setData({
            danmuList : oldlist.concat(newlist)
          });
        }
      },
      complete : function() {
      }
    });
  },
  danmuInput : function(event) {
    this.data.danmuInputText = event.detail.value;
  },
  sendDanmu : function(event) {
    let that = this;
    let time = that.data.videoTime;
    let currentTime = time.currentTime || 1;
    let color = getRandomColor();
    let text = that.data.danmuInputText;
    if(!text){
      app.showModal({
        content: '请输入文字'
      });
      return ;
    }
    app.sendRequest({
      url: '/index.php?r=AppVideo/SendDanmu' ,
      data: {
        video_id : that.data.videoId,
        text : text,
        time : currentTime,
        color : color,
        sub_app_id: that.data.franchiseeId
      },
      method: 'post',
      success: function (res) {
        let newdata = {};
        that.videoContext.sendDanmu({
          text: text,
          color: color
        });
        that.setData({
          danmuInputText : ''
        });
        that.danmuId.push(res.data);
      },
      complete : function() {
      }
    });
  },
  imageError : function(event) {
    let index = event.currentTarget.dataset.index;
    let newdata = {};
    newdata['assessList['+index+'].assess_info.assess.cover_thumb'] = app.globalData.defaultPhoto;
    this.setData(newdata);
  },
  previewImage : function(event){
    let that = this,
        curImg = event.currentTarget.dataset.src;
    app.previewImage({
      current: curImg,
      urls: that.data.articleInfo.content.imgs
    });
  },
  onShareAppMessage : function() {
    let title = this.data.videoInfo.title;
    let id = this.data.videoId;
    let franchiseeId = this.data.franchiseeId;
    return app.shareAppMessage({
      title: '您的好友向你推荐《' + title + '》',
      path: '/video/pages/videoDetail/videoDetail?detail=' + id + (franchiseeId ? '&franchisee=' + franchiseeId : ''),
      success: function(res) {
      },
      fail: function(res) {
      }
    })
  }
})
