const app = getApp();
var util = require('../../../utils/util.js')
var WxParse = require('../../../components/wxParse/wxParse.js');
Page({
  data: {
    showAll: false,
    isHidden: true,
    hasVideo: false,
    commentList: [], //网友评论
    scrollLeft: 0,
    commentTotal: 0,
    loadInfo:{
      is_more: 1,
      page: 1,
      loading: false
    }
  },
  onLoad: function (options) {
    let franchiseeId = options.franchiseeId || '';
    let foodId = options.id;
    let itemIndex = Number(options.itemIndex) || 0;
    this.setData({
      franchiseeId: franchiseeId,
      foodId: foodId,
      itemIndex: itemIndex
    })
    this.getPageConfig();
    this.getRecommendFoods();
  },
  getPageConfig: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopConfig/GetAppShopConfig',
      data: {
        'sub_app_id': that.data.franchiseeId,
        mode_id: 0
      },
      success: function (res) {
        let data = res.data[0] || {};
        let newdata = {};
        if(data.fields_data){
          newdata.recommendInfo = data.fields_data;
          let pageName = "特色推荐";
          if(data.fields_data.title.isOpen){
            pageName = data.fields_data.title.name;
          }else if(data.fields_data.sec_title.isOpen){
            pageName = data.fields_data.sec_title.name;            
          }
          app.setPageTitle(pageName);
        }
        that.setData(newdata);
        setTimeout(function(){
          that.setData({
            scrollLeft: that.data.itemIndex * 220
          })
        },400)
      },
      complete: function () {
      }
    });
  },
  getRecommendFoods: function () {
    let that = this;
    app.sendRequest({
      url:'/index.php?r=AppShop/getGoods',
      data:{
        sub_shop_app_id: that.data.franchiseeId,
        data_id: that.data.foodId,
        sort_key: 'approval',
        'screening_arr[goods_type]': [0,3],
        'screening_arr[select_type]': 1,
      },
      method:"post",
      success: function (res){
        let goods = res.data[0].form_data;
        let description = goods.description;
        let total_approval = Number(goods.approval.total_approval);
        let hasVideo = false,//有视频或轮播只显示视频或轮播，再显示查看更多
            isHidden = true;
        if(goods.video_url || goods.img_urls) {
          hasVideo = true;
          isHidden = false;
        }
        if(total_approval > 999){
          goods.approval.total_approval = parseInt(goods.approval.total_approval/1000) + 'k';
        }
        that.setData({
          foodsInfo: goods,
          hasVideo: hasVideo
        })
        that.getCommentList(1);
        description = description ? description.replace(/\u00A0|\u2028|\u2029|\uFEFF/g, '') : description;
        goods.description = description
        WxParse.wxParse('wxParseDescription', 'html', description, that, 10);
        setTimeout(function(){
          wx.createSelectorQuery().selectAll('#foodDetail').boundingClientRect(function (rect) {
            let ContentHeight = rect[0].height;
            let flag = ContentHeight > 218 ? false : true;
            that.setData({
              showAll: hasVideo ? false : flag,
              isHidden: !isHidden ? false : flag
            })
          }).exec()
        },1000)
      }
    })
  },
  changeFood: function (e) {
    let id = e.currentTarget.dataset.id;
    this.setData({
      foodId: id,
      isHidden: true
    })
    this.getRecommendFoods();
  },
  changeDetailHeight: function () {
    let _hasVideo = this.data.hasVideo;
    let goods = this.data.foodsInfo;
    if(goods.video_url || goods.img_urls){
      _hasVideo = !_hasVideo;
    }
    this.setData({
      showAll: !this.data.showAll,
      hasVideo: _hasVideo
    })
  },
  getCommentList: function (page, getMore) {
    let that = this;
    let loadInfo = this.data.loadInfo;
    if(loadInfo.loading){
      return;
    }
    this.setData({
      "loadInfo.loading": true
    })
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAssessList',
      data: {
        obj_name: 'app_id',
        page_size: 10,
        page: page,
        sub_shop_app_id: that.data.franchiseeId,
        'idx_arr[0][idx]': 'level',
        'idx_arr[0][idx_value]': 0,
        'screening_arr[0][field]': 'goods_type',
        'screening_arr[0][value][0]': 0,
        'screening_arr[0][value][1]': 1,
        'screening_arr[0][value][2]': 3,
        'screening_arr[0][symbol]': 'in',
      },
      success: function (res) {
        let _commentArr = res.data;
        let total_num = (572 / 26 * 2) * 3;
        _commentArr.map((item) => {
          let info = item.assess_info;
          let strLen = app.stringLengthComment(info.content);
          item.assess_info.score = info.score || info.tostore_score || info.appointment_score;
          if(total_num + 1 < strLen){
            item.assess_info.short_content = app.subStringComment(info.content , total_num -16) ;
            item.isShowShort = true;
          }
        })
        if(getMore) {
          _commentArr = that.data.commentList.concat(_commentArr);
        }
        that.setData({
          commentList: _commentArr,
          commentTotal: res.count,
          'loadInfo.loading': false,
          'loadInfo.is_more': res.is_more,
          'loadInfo.page': res.current_page + 1 
        })
      }
    })
  },
    bindscrolltolower: function (e) {
    let loadInfo = this.data.loadInfo;
    if(loadInfo.is_more === 0){
      return;
    }
    this.getCommentList(loadInfo.page, true)
  },
  toShowAll: function (e) {
    let ind = e.currentTarget.dataset.index;
    let commentStr = 'commentList[' + ind + '].isShowShort'
    this.setData({
      [commentStr]: false
    })
  },
  clickThumb: function (e) {
    let that = this;
    let dataset = e.currentTarget.dataset; 
    let _id = dataset.id;
    let goods_type = dataset.goodstype
    let foodStr = 'foodsInfo.approval.status';
    let foodNum = 'foodsInfo.approval.total_approval';
    app.sendRequest({
      url:'/index.php?r=AppShopManage/GoodsApproval',
      data:{
        app_id: that.data.franchiseeId,
        parent_app_id: app.getAppId(),
        goods_id: _id,
        goods_type: goods_type,
      },
      method:"post",
      success: function (res){
        that.setData({
          [foodStr]: Number(res.data.status),
          [foodNum]: res.data.total_approval > 999 ? parseInt(goods.approval.total_approval/1000) + 'k' : res.data.total_approval
        })
      }
    })
  },
  clickPlusImages: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  onShareAppMessage: function (res) {
    let url = `/franchisee/pages/franchiseeRecomDetail/franchiseeRecomDetail?itemIndex=${this.data.itemIndex}&franchiseeId=${this.data.franchiseeId}&id=${this.data.foodId}`;
    return {
      path: url
    }
  }
})