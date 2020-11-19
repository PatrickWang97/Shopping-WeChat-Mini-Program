const app = getApp();
Page({
  data: {
    showStar: false,
    commentNums: [],//用户评论数
    commentArr: [],//用户评论列表
    commentType: 0,
    listInfo:{
      is_more: 1,
      page: 1,
      loading: false
    }
  },
  onLoad: function (options) {
    let commentType = options.commentType || 0;
    this.setData({
      showStar: !!Number(options.showStar),
      franchiseeId: options.franchisee || '',
      commentType: commentType,
    })
    this.getAssessList(commentType, 1);
  },
  clickCommentLabel: function (e) {
    let _val = e.currentTarget.dataset.type;
    this.setData({
      commentType: _val
    })
    this.getAssessList(_val, 1);
  },
  clickPlusImages: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  getAssessList: function (type, page, append) {
    let that = this;
    let _listInfo = this.data.listInfo;
    this.setData({"listInfo.loading": true});
    app.sendRequest({
      loading: true,
      url: '/index.php?r=AppShop/GetAssessList',
      data: {
        obj_name: 'app_id',
        page_size: 10,
        page: page,
        sub_shop_app_id: this.data.franchiseeId,
        'idx_arr[0][idx]': 'level',
        'idx_arr[0][idx_value]': type,
        'screening_arr[0][field]': 'goods_type',
        'screening_arr[0][value]': [0, 1, 3],
        'screening_arr[0][symbol]': 'in',
      },
      method: "post",
      success: res => {
        let _commentArr = res.data;
        let arr = [];
        let total_num = (572 / 26 * 2) * 3;
        _commentArr.map((item) => {
          let info = item.assess_info;
          let strLen = app.stringLengthComment(info.content);
          arr.push(true);
          item.assess_info.score = info.score || info.tostore_score || info.appointment_score;
          if(total_num + 1 < strLen){
            item.assess_info.short_content = app.subStringComment(info.content , total_num -16) ;
            item.isShowShort = true;
          }
        })
        if(append){
          _commentArr = that.data.commentArr.concat(_commentArr);
        }
        that.setData({
          commentArr: _commentArr,
          commentNums: res.num,
          'listInfo.is_more': res.is_more,
          'listInfo.page': _listInfo.page + 1,
          'listInfo.loading': false
        })
      }
    })
  },
  onReachBottom: function () {
    let data = this.data;
    if(data.listInfo.loading){
      return;
    }
    this.getAssessList(data.commentType, data.listInfo.page, true);
  },
  toShowAll: function (e) {
    let ind = e.currentTarget.dataset.index;
    let commentArr = 'commentArr[' + ind + '].isShowShort'
    this.setData({
      [commentArr]: false
    })
  },
  onReady: function () {
  },
  onShow: function () {
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  onPullDownRefresh: function () {
  },
  onShareAppMessage: function () {
  }
})