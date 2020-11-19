var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    goodsId: '',
    commentType: 0,
    comments: [],
    commentNums: [],
    loadPage: 1,
    total_page: 1,
    is_more:0,
    topTab:[
      {
        title:'全部',
        check:1
      },
      {
        title:'好评',
        check:0
      },
      {
        title:'中评',
        check:0
      },
      {
        title:'差评',
        check:0
      },
      {
        title:'有图',
        check:0
      },
    ]
  },
  onLoad: function(options){
    var goodsId = options.detail || '',
        franchiseeId = options.franchisee || '';
    this.setData({
      goodsId: goodsId,
      franchiseeId: franchiseeId
    })
    this.getAssessList(0, 1);
    this.getAppECStoreConfig();
  },
  onReachBottom: function(){
    if (this.data.loadPage > this.data.total_page){return};
    this.getAssessList(this.data.commentType, this.data.loadPage, 1);
  },
  getAssessList: function(commentType, page, append){
    var that = this;
    app.getAssessList({
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: commentType
        },
        page: page,
        page_size: 20,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function(res){
        res.data.forEach(time =>{
          time.add_time = time.add_time.slice(5,16)
        })
        var commentArr = res.data;
        if(append){
          commentArr = that.data.comments.concat(commentArr);
        }
        that.setData({
          comments: commentArr,
          commentNums: res.num,
          loadPage: that.data.loadPage + 1,
          total_page: res.total_page,
          is_more:res.is_more
        })
      }
    });
  },
  clickCommentLabel: function(e){
    var commentType = e.currentTarget.dataset.type,
        data = {};
    data.loadPage = 1;
    data.commentType = commentType;
    this.data.topTab.forEach(tab => {
      tab.check = 0;
    })
    this.data.topTab[commentType].check = 1;
    this.setData({
      topTab: this.data.topTab
    })
    this.setData(data);
    this.getAssessList(commentType, 1);
  },
  clickPlusImages:function(e){
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.data.franchiseeId);
  }
})
