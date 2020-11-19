var app = getApp()
var util = require('../../../utils/util.js');
Page({
  data: {
    orderData: {},
    orderInfo: {},
    orderStatus: { '0':'待付款', '1':'待发货', '2':'待收货', '3':'待评价', '4':'退款审核中', '5':'退款中', '6':'已完成', '7':'已关闭', '8':'外卖未接单'},
    orderStatusText: [
      { name: '待付款剩余时间:', orderName: '请在提交订单20分钟内完成付款', },
      { name: '待商家安排配送', orderName: '预计送达时间：', },
      { name: '配送中', orderName: '预计送达时间：', },
      { name: '订单待评价', orderName: '感谢您的信任，期待下次光临', },
      { name: '退款审核中', orderName: '你已成功发起退款，请耐心等待商家处理', },
      { name: '退款中', orderName: '订单退款中', },
      { name: '订单已完成', orderName: '感谢您的信任，期待下次光临', },
      { name: '已关闭', orderName: '订单已取消', },
      { name: '等待商家接单', orderName: '20分钟商家未接单，订单将自动取消', }
    ],
    transportStatus: {
      0: '待创建',
      1: '待骑手接单',
      2: '骑手已接单', //蜂鸟已分配骑手
      3: '骑手配送中',
      4: '骑手配送已完成',
      5: '已取消',
      7: '已过期',
      8: '指派单',
      9: '妥投异常之物品返回中',
      10: '妥投异常之物品返回完成',
      11: '骑手已到店', 
      12: '申请取消配送',
      1000: '订单异常'
    },
    selectAddressId: '',
    goodsAdditionalInfo: {},
    hasAdditionalInfo: false,
    customFields: [],
    orderId: '',
    isFromTemplateMsg: false,
    originalPrice: '',
    useBalance: '',
    freightAdress:{},
    express_fee:'',
    discount_cut_price: '',
    isFromBack: false,
    marker: [{
      latitude: 0,
      longitude: 0,
      iconPath: '/images/transport.png',
      width: 75,
      height: 75
    }],
    ismore: false,
    isShowInstruction: false
  },
  onLoad: function (options) {
    this.setData({
      orderId: options.detail,
      isFromTemplateMsg: options.from === 'template_msg' ? true : false,
      franchiseeId: options.franchisee || ''
    })
    this.dataInitial();
  },
  onPullDownRefresh: function () {
    this.dataInitial();
  },
  onShow:function(){
    if (this.data.isFromBack){
      this.dataInitial();
    }else{
      this.setData({
        isFromBack: true
      });
    }
  },
  mapDetail:function(e){
    let dataset = e.currentTarget.dataset,
        marker = [{
          latitude: dataset.lat,
          longitude: dataset.lng,
          iconPath: '/images/transport.png',
          width: 75,
          height: 75
        }]
    app.turnToPage("/default/pages/mapDetail/mapDetail?eventParams=" + JSON.stringify(marker))
  },
  canvas: function(acceptTime, needTime){
    let nowTime = new Date().getTime(),
        winWidth = wx.getSystemInfoSync().windowWidth / 750,
        ctx = wx.createCanvasContext('canvasArcCir'),
        x = 80 * winWidth,
        y = 80 * winWidth,
        radius = 65 * winWidth,
        gradient = ctx.createLinearGradient(0, 0 * winWidth, 0, 160 * winWidth),
        angle = (((nowTime / 1000 - acceptTime) / 60 / needTime) * 2 - 0.5) * Math.PI;
    this.setData({
      isOverTime: ((nowTime / 1000 - acceptTime) / 60 / needTime) > 1 ? true : false ,
      deliveryTime: acceptTime ? this.returnDeliveryTime(acceptTime, needTime) : '',
    })
    gradient.addColorStop("0", "#FF5900");
    gradient.addColorStop("0.5", "#FFA156");
    gradient.addColorStop("1", "#FF8838");
    if (acceptTime) {
      ctx.draw();
      ctx.setTextAlign('center');
      ctx.setTextBaseline('bottom')
      ctx.setFontSize(36 * winWidth)
      ctx.fillText(this.returnDeliveryTime(acceptTime, needTime), x, (90 * winWidth) )
      ctx.setTextBaseline('top')
      ctx.setFontSize(21 * winWidth)
      ctx.setFillStyle('#a3a3a3')
      ctx.fillText('预计送达', x, (90 * winWidth))
    }else{
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, 55 * winWidth, 0, 2 * Math.PI);
      ctx.clip()
      ctx.drawImage('http://img.weiye.me/tmp_file/df5be6203a516ea94b792b357551fbe81.png', 15 * winWidth, 15 * winWidth, 130 * winWidth, 130 * winWidth)
      ctx.restore()
    }
    ctx.setLineWidth(12*winWidth);
    ctx.setStrokeStyle(gradient);
    ctx.setLineCap('round');
    ctx.beginPath();
    ctx.arc(x, y, radius, 1.5 * Math.PI, angle, true);
    ctx.stroke();
    ctx.draw();
  },
  getGoldenData: function (id) {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getTimeAfterConsume",
      method: "post",
      data: {
        order_id: id,
        sub_app_id: that.data.franchiseeId
      },
      success: function (data) {
        if (data.integral) {//支付获取积分
          that.setData({
            'rewardPointObj': {
              showModal: true,
              count: data.integral,
              callback: ''
            }
          })
        }
      }
    })
  },
  makePhoneCall:function(e){
    var phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  dataInitial: function () {
    this.getTakeOutInfo();
    this.getOrderDetail(this.data.orderId);
    this.initialAddressId();
  },
  turnToOrderTracking: function(){
    app.turnToPage('/orderMeal/pages/orderTracking/orderTracking?orderId=' + this.data.orderId)
  },
  getOrderStatus: function (orderId){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/queryTransporterInfo',
      data: {
        order_id: orderId,
      },
      success: function (res) {
        let newdata = {};
        newdata['marker[0].latitude'] = res.data.transporter_latitude;
        newdata['marker[0].longitude'] = res.data.transporter_longitude;
        newdata['transporterInfo'] = res.data;
        that.setData(newdata)
      }
    })
  },
  getOrderDetail: function (orderId) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getOrder',
      data: {
        order_id: orderId,
        sub_shop_app_id: this.data.franchiseeId,
        is_get_indemnity_order: 1,
        is_buyer: 1,
        not_get_takeout: 1
      },
      success: function (res) {
        var data = res.data[0],
            form_data = data.form_data,
            hasAdditionalInfo = false,
            additional_info_goods = [],
            additional_goodsid_arr = [],
            address_id = '';
          if (form_data.status!=0){
              that.getGoldenData(orderId);
              if (form_data.status == 2 && form_data.take_out_info.deliver_type != 0 && form_data.take_out_info.deliver_type != '' && (form_data.take_out_transport_order.status == 2 || form_data.take_out_transport_order.status == 3  || form_data.take_out_transport_order.status == 11)) {
                that.getOrderStatus(that.data.orderId);
              }
          } 
        for (var i = 0; i < form_data.goods_info.length; i++) {
          var deliveryId = form_data.goods_info[i].delivery_id,
              goodsId = form_data.goods_info[i].goods_id;
          if (deliveryId && deliveryId != '0' && additional_goodsid_arr.indexOf(goodsId) == -1) {
            additional_info_goods.push(form_data.goods_info[i]);
            additional_goodsid_arr.push(goodsId);
            if (form_data.additional_info && form_data.additional_info[goodsId]){
              for (let i = 0; i < form_data.additional_info[goodsId].length; i++){
                if (form_data.additional_info[goodsId][i].value){
                  hasAdditionalInfo = true;
                }
              }
            }
          }
        }
        let estimateTime;
        if (data.form_data.take_out_info.accept_time){
          estimateTime = that.returnDeliveryTime(+data.form_data.take_out_info.accept_time, +data.form_data.take_out_info.deliver_time);
        }
        var sytime;
        if (data.form_data.add_time){
          let nowTime = new Date().getTime();
          let addTime = data.form_data.add_time.replace(/\-/g, "/");
          let time = 20 * 60000 - ((nowTime - new Date(addTime + '').getTime()));
          if(time <= 0){
            sytime = "0:00";
          }else{
            sytime = that.returHM(time);
          }
        }
        that.setData({
          orderData: data,
          orderInfo: form_data,
          estimateTime: estimateTime || '',
          hasAdditionalInfo: hasAdditionalInfo,
          discount_cut_price: form_data.discount_cut_price,
          useBalance: form_data['use_balance'],
          express_fee: res.data[0]['express_fee'],
          sytime: sytime
        });
        app.setPreviewGoodsInfo(additional_info_goods);
        that.canvas(data.form_data.take_out_info.accept_time, +data.form_data.take_out_info.deliver_time)
        if(form_data.is_self_delivery == 1){
          that.getFreigtAdress();
        } else {
          address_id = form_data.address_info.address_id;
          that.setData({
            selectAddressId: address_id,
          })
        }
        app.setGoodsAdditionalInfo(form_data.additional_info || {});
      }
    })
  },
  returnDeliveryTime: function (accept_time, deliver_time){
    let time = accept_time * 1000 + deliver_time * 60000,
        HM = (new Date(time).toISOString().split('T')[0] + ' ' + new Date(time).toTimeString().split(' ')[0]).split(' ')[1];
    HM = HM.split(':')[0] + ':' +HM.split(':')[1]
    return HM
  },
  returHM: function(time) {
    let minutes = parseInt((time % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = parseInt((time % (1000 * 60)) / 1000);
    minutes < 10 ? minutes = "0" + minutes : minutes = minutes;
    seconds < 10 ? seconds = "0" + seconds : seconds = seconds;
    let HM = minutes + ':' + seconds;
    return HM
  },
  makeComment:function(e){
    var orderId = this.data.orderId,
        franchiseeId = this.data.franchiseeId,
        queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee=' + franchiseeId;
    app.turnToPage('/orderMeal/pages/takeoutMakeComment/takeoutMakeComment?detail=' + orderId + queryStr);
  },
  orderDelete: function (e) {
    var orderId = this.data.orderId,
    that = this,
      franchiseeId = this.data.franchiseeId;
    app.showModal({
      content: '订单删除后不可找回，确认删除？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/HideOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: franchiseeId
          },
          success: function (res) {
            app.turnBack()
          }
        })
      }
    })
  },
  cancelOrder: function (e) {
    var orderId = this.data.orderInfo.order_id,
        that = this;
    app.showModal({
      content: '你将要取消一笔付款订单，确认取消？',
      showCancel: true,
      confirmText: '是',
      cancelText: '否',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId
          },
          success: function (res) {
            var data = {};
            app.sendUseBehavior([{goodsId: orderId}],7); // 取消订单
            data['orderInfo.status'] = 7;
            that.setData(data);
          }
        })
      },
    })
  },
  payOrder: function (e) {
    var address_info = this.data.orderInfo.address_info,
        that = this,
        orderId;
    if (!address_info && this.data.orderInfo.goods_type != 3) {
      app.showModal({
        content: '请选择邮寄地址'
      })
      return;
    }
    orderId = this.data.orderInfo.order_id;
    if (this.data.orderInfo.total_price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function(res){
          setTimeout(function(){
            app.showToast({
              title: '支付成功',
              icon: 'success'
            });
          });
          setTimeout(function(){
            that.getOrderDetail(that.data.orderInfo.order_id);
          }, 1000);
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId,
        sub_shop_app_id: that.data.franchiseeId
      },
      success: function (res) {
        var param = res.data,
            orderId = that.data.orderInfo.order_id;
        param.orderId = orderId;
        param.goodsType = that.data.orderInfo.goods_type;
        param.success = function () {
          setTimeout(function(){
            that.getOrderDetail(orderId);
          }, 1500); 
        };
        app.wxPay(param);
      }
    })
  },
  applyDrawback: function () {
    var orderId = this.data.orderInfo.order_id,
        that = this;
    app.showModal({
      content: '确定申请退款？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/applyRefund',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId
          },
          success: function (res) {
            app.sendUseBehavior([{goodsId: orderId}],6); // 行为轨迹埋点 申请退款
            var data = {};
            data['orderInfo.status'] = 4;
            that.setData(data);
          },
          successShowModalConfirm: function() {
            that.dataInitial();
          }
        })
      }
    })
  },
  toCancelOrder: function(e){
    app.turnToPage('/orderMeal/pages/cancelOrder/cancelOrder?orderId=' + this.data.orderId + '&deliverType=' + this.data.orderInfo.take_out_info.deliver_type + '&franchisee=' + this.data.franchiseeId);
  },
  receiveDrawback: function () {
    var orderId = this.data.orderInfo.order_id,
        that = this;
    app.showModal({
      content: '确定已收到退款？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/comfirmRefund',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId
          },
          success: function (res) {
            var data = {};
            data['orderInfo.status'] = 7;
            that.setData(data);
          }
        })
      }
    })
  },
  checkLogistics: function () {
    var orderId = this.data.orderInfo.order_id;
    app.turnToPage('/eCommerce/pages/logisticsPage/logisticsPage?detail=' + orderId);
  },
  sureReceipt: function () {
    var orderId = this.data.orderInfo.order_id,
        that = this;
    app.showModal({
      content: '确定已收到货物？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/comfirmOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId
          },
          success: function (res) {
            var data = {};
            app.sendUseBehavior([{goodsId: orderId}],8); // 行为轨迹埋点 确认收货
            data['orderInfo.status'] = 3;
            that.setData(data);
          }
        })
      }
    })
  },
  showAddressList: function () {
    var addressId = this.data.selectAddressId,
        orderId = this.data.orderInfo.order_id,
        franchiseeId = this.data.franchiseeId;
    app.turnToPage('/eCommerce/pages/myAddress/myAddress?id=' + addressId + '&oid=' + orderId + '&sub_shop_id=' + franchiseeId,true);
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  verificationCode: function() {
    app.turnToPage('/eCommerce/pages/verificationCodePage/verificationCodePage?detail=' + this.data.orderInfo.order_id + '&sub_shop_app_id=' + this.data.franchiseeId);
  },
  getFreigtAdress:function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getAppShopLocationInfo',
      data: {
        app_id: app.getAppId()
      },
      success: function (res) {
        that.setData({
          freightAdress: res.data
        });
      }
    });
  },
  freightGoMap:function(){
    var _this = this,
      infor = _this.data.freightAdress.region_string + _this.data.freightAdress.shop_location;
    infor = infor.replace(/\s+/g,'');
    app.sendRequest({
      url: '/index.php?r=Map/GetLatAndLngByAreaInfo',
      data: {
        location_info: infor
      },
      success: function (res) {
        if (res.result){
          wx.openLocation({
            latitude: res.result.location.lat,
            longitude: res.result.location.lng
          })
        }
      }
    });
  },
  initialAddressId:function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/addressList',
      data: {
        app_id: app.getAppId()
      },
      success: function (res) {
        if(res.data.length){
          that.setData({
            selectAddressId: res.data[0].id
          });
        }
      }
    });
  },
  freightPlayPhone:function(){
    var that = this;
    app.makePhoneCall(that.data.freightAdress.shop_contact)
  },
  seeAdditionalInfo: function(){
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo?from=goodsOrderDetail');
  },
  callTakeout: function (event) {
    let phone = event.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  copyOrder: function(e) {
    let that = this;
    let dataset = e.currentTarget.dataset;
    wx.setClipboardData({
      data: dataset.order,
      success: function(){
        app.showToast({
          title: '复制成功',
          icon: 'success'
        });
      }
    })
  },
  selectMore: function(e){
    let that = this;
    let dataset = e.currentTarget.dataset;
    this.setData({ ismore:!dataset.ismore});
  },
  hideMore: function(e){
    this.setData({ ismore: false });
  },
  toFeedback: function(e) {
    app.turnToPage('/orderMeal/pages/takeoutFeedback/takeoutFeedback?orderId=' + this.data.orderId + '&deliverType=' + this.data.orderInfo.take_out_info.deliver_type);
  },
  toFeedbackDetail: function(e) {
    app.turnToPage('/orderMeal/pages/indemnityOrder/indemnityOrder?orderId=' + this.data.orderId + '&deliverType=' + this.data.orderInfo.take_out_info.deliver_type)
  },  
  cancelRefund: function(e) {
    var that = this;
    app.showModal({
      content: '是否撤销取消订单申请？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelRefund',
          data: {
            app_id: app.getAppId(),
            order_id: that.data.orderInfo.order_id
          },
          success: function (res) {
            that.getOrderDetail(that.data.orderId);
          }
        })
      }
    })
  },
  getTakeOutInfo: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getTakeOutInfo',
      success: function (res) {
        that.setData({
          takeoutInfo: res.data || ''
        })
      }
    })
  },
  cancelReason: function() {
    this.setData({
      isShowInstruction: true
    })
  },
  hideInstruction: function() {
    this.setData({
      isShowInstruction: false
    })
  }
})
