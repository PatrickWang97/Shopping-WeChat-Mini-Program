var app = getApp();
var util = require('../../../utils/util.js');
Page({
  data: {
    videoId : '',
    getAssessData: {
      page: 1,
      nomore: false,
      loading: false
    },
    assessList: [],
    franchiseeId: ''
  },
  onLoad: function(options) {
    let videoId = options.detail;
    this.setData({
      videoId: videoId,
      franchiseeId: options.franchisee || ''
    });
    this.getAssessList();
  },
  getAssessList : function() {
    var that = this;
    var ajaxdata = that.data.getAssessData;
    if(ajaxdata.loading || ajaxdata.nomore){
      return ;
    }
    that.setData({
      'getAssessData.loading' : true
    });
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetAssessList',
      data: {
        video_id : that.data.videoId,
        page: ajaxdata.page,
        page_size: 10,
        sub_app_id: that.data.franchiseeId
      },
      method: 'get',
      success: function (res) {
        let info = res.data,
            oldData = that.data.assessList,
            newData = [];
        for (var i = 0; i < info.length; i++) {
          info[i].assess_info.assess.content = info[i].assess_info.assess.content.replace(/\n|\\n/g , '\n');
          if(info[i].assess_info.reply){
            info[i].assess_info.reply.content = info[i].assess_info.reply.content.replace(/\n|\\n/g , '\n');
          }
        }
        newData = oldData.concat(info);
        that.setData({
          assessList: newData ,
          'getAssessData.page' : ajaxdata.page + 1 ,
          'getAssessData.nomore' : res.is_more == 0 ? true : false
        });
      },
      complete : function() {
        that.setData({
          'getAssessData.loading' : false
        });
      }
    });
  },
  scrolltolower : function(event) {
    this.getAssessList();
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
        newdata['assessList['+index+'].like_status'] = like_status == 1 ? 0 : 1;
        that.setData(newdata);
        app.globalData.videoDetailRefresh = false;
      },
      complete : function() {
        that.assessLikedLoading = false;
      }
    });
  },
  imageError : function(event) {
    let index = event.currentTarget.dataset.index;
    let newdata = {};
    newdata['assessList['+index+'].assess_info.assess.cover_thumb'] = app.globalData.defaultPhoto;
    this.setData(newdata);
  },
})
