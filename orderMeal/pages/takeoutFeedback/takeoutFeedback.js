var app = getApp();
Page({
  data: {
    complaintReason: [],
    orderId: '',
    deliverType: 0,
    submitData: {
      order_id: '',
      complaint_pics: [],
      complaint_reason_id: '',
      complaint_reason: '',
      complaint_additional_reason: ''
    },
    reasonIndex: '',
    isShowInstruction: false,
    isFromBack: false,
    indemnityExplain: {},
    isTurn: false,
    isShowText:true
  },
  onLoad: function (options) {
    this.data.orderId = options.orderId;
    this.data.deliverType = options.deliverType;
    this.dataInitial();
  },
  onReady: function () {
  },
  onShow: function () {
    if (this.data.isFromBack) {
      this.dataInitial();
    } else {
      this.setData({
        isFromBack: true
      });
    }
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  onPullDownRefresh: function () {
  },
  onReachBottom: function () {
  },
  onShareAppMessage: function () {
  },
  dataInitial: function() {
    this.getBuyerComplaintReason();
  },
  getBuyerComplaintReason: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getBuyerComplaintReason',
      data:{
        deliver_type: this.data.deliverType
      },
      success: function (res) {
        if (res.status === 0) {
          that.setData({
            complaintReason: res.data
          });
        }
      }
    });
  },
  chooseImage: function (e) {
    var that = this,
      complaint_pics = that.data.submitData.complaint_pics;
    if (complaint_pics.length >= 3) {
      app.showModal({
        content: '每个商品最多上传3张图片'
      });
      return;
    }
    app.chooseImage(function (images) {
      var data = {};
      data['submitData.complaint_pics'] = complaint_pics.concat(images);
      that.setData(data);
    }, 3 - complaint_pics.length);
  },
  removePic: function (e) {
    var picIndex = e.currentTarget.dataset.picIndex,
        complaint_pics = this.data.submitData.complaint_pics,
        data = {};
    complaint_pics.splice(picIndex, 1);
    data['submitData.complaint_pics'] = complaint_pics;
    this.setData(data);
  },
  chooseReason: function(e){
    var chooseIndex = e.currentTarget.dataset.reasonIndex,
        data = {};
    data['submitData.complaint_reason_id'] = chooseIndex;
    data['submitData.complaint_reason'] = e.currentTarget.dataset.reasonStr;
    data.reasonIndex = chooseIndex;
    this.setData(data);
  },
  makeComment: function(e) {
    var that = this,
        submitData = that.data.submitData;
        submitData.order_id = this.data.orderId;
    submitData.deliver_type = this.data.deliverType;
    if (!submitData.complaint_reason_id){
      app.showModal({
        content: '选择一个反馈项'
      })
      return;
    }
    if (submitData.complaint_pics.length > 3){
      app.showModal({
        content: '最多上传3张图片'
      })
      return;
    }
    that.showInstruction();
    this.data.isTurn = true;
  },
  showInstruction: function() {
    this.setData({isShowInstruction: true});
    this.setData({
      isShowText: false
    })
    if (!this.data.indemnityExplain.account_type){
      this.getIndemnityExplainParam();
    }
  },
  hideInstruction: function() {
    let that = this;
    this.setData({
      isShowText: true
    })
    if(this.data.isTurn){
      this.data.isTurn = false;
      var submitData = that.data.submitData;
          submitData.order_id = this.data.orderId;
          submitData.deliver_type = this.data.deliverType;
      app.sendRequest({
        url: '/index.php?r=AppTransport/buyerComplaint',
        method: 'post',
        data: submitData,
        success: function (res) {
          if (res.status === 0) {
            app.turnToPage('/orderMeal/pages/indemnityOrder/indemnityOrder?orderId=' + that.data.orderId + '&deliverType=' + that.data.deliverType, 1);
          }
          that.setData({ isShowInstruction: false });
        },
        complete: function () {
          that.setData({ isShowInstruction: false });
        }
      })
    }else {
      this.setData({ isShowInstruction: false });
    }
  },
  commentInput: function(e) {
    this.data.submitData.complaint_additional_reason = e.detail.value;
  },
  getIndemnityExplainParam: function() {
    let submitData = {
      order_id: this.data.orderId
    }
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getIndemnityExplainParam',
      method: 'post',
      data: submitData,
      success: function (res) {
        that.setData({
          indemnityExplain: res.data
        })
      }
    })
  }
})