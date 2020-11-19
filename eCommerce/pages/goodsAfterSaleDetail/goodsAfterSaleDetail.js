var app = getApp()
Page({
  data: {
    orderReason: ['商家待审核', '商家拒绝退款', '买家撤销退款', '待买家退货', '待商家确认收货', '卖家超时未退货', '已退款', '商家超时未处理退款'],
    refundReason: ['多拍/拍错/不想要','快递延期','未按约定时间发货','快递记录出错','内容与描述不符','其它'],
    refundJourneyReason: ['未保持餐品完整','骑手服务态度恶劣','骑手额外索取费用' ,'骑手诱导退单' ,'骑手提前点击送达' ,'骑手虚假标记异常' ,'少餐错餐' ],
    orderIcon: [ 'goods-undone-payment', 'goods-refund-doing', 'goods-refund-doing' , 'goods-refund', 'goods-undone-receipt', 'goods-refund-doing', 'goods-already-refund', 'goods-refund-doing' ],
    orderId: '',
    showEventDialog: false,
    eventType: '',
  },
  isFromBack: false,
  applyId: '',
  onLoad: function (options) {
    this.applyId =  options.applyId;
    this.franchiseeId = options.franchisee || '';
    this.setData({
      orderId: options.detail
    })
    this.dataInitial();
  },
  onShow: function () {
    if (this.isFromBack) {
      this.getAfterSaleOrder();
    } else {
        this.isFromBack = true;
    }
  },
  dataInitial: function () {
    this.getAfterSaleOrder();
    this.getAppECStoreConfig();
  },
  getAfterSaleOrder: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getAfterSaleOrder',
      data: {
        apply_id: _this.applyId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let refund_goods = res.data.refund_goods;
        if (Array.isArray(refund_goods) && refund_goods.length > 0) {
          refund_goods.forEach(item=> {
            if (item.is_package_goods == 1) {
              item.showPackageInfo = false;
            }
            if (!Array.isArray(item.package_goods)) {
              item.package_goods = [];
            }
            if (item.attributes) {
              for (let attr in item.attributes) {
                for (let _goods in item.attributes[attr].goods_list) {
                  item.package_goods.push(item.attributes[attr].goods_list[_goods]);
                }
              }
            }
          })
        }
        _this.setData({
          afterSaleData: res.data
        });
        _this.getRefundConfigByPickUpType();
        if (res.data.pick_up_type == 2){
          _this.getBuyerCancelReason();
        }
      }
    })
  },
  orderDelete: function (e) {
    let orderId = this.data.orderId;
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteAfterSaleOrderLog',
      method: 'post',
      data: {
        order_id: orderId,
        apply_id: _this.applyId
      },
      success: function (res) {
        app.turnBack()
      },
      complete: function () {
        _this.setData({
          showEventDialog: false
        });
      }
    })
  },
  editorRefund: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsRefundPage/goodsRefundPage?type=editor&orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  checkLogistics: function () {
    let applyId = this.applyId;
    let franchiseeId = this.franchiseeId;
    app.turnToPage('/eCommerce/pages/logisticsPage/logisticsPage?applyId=' + applyId + '&form=afterSale' + (franchiseeId ? '&franchiseeId=' + franchiseeId : ''));
  },
  copyOrderId: function(){
    let _this = this;
    wx.setClipboardData({
      data: _this.data.orderId,
      success: function (res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  hideEventDialog: function () {
    this.setData({
      showEventDialog: false
    })
  },
  showEventDialog: function (event){
    this.setData({
      eventType: event.currentTarget.dataset.type,
      showEventDialog: true
    })
  },
  goOrderProgress: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsOrderProgress/goodsOrderProgress?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  returnInfor: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsReturnInfor/goodsReturnInfor?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  },
  cancelRefund: function () {
    let _this = this;
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=appShop/cancelRefund',
      data: {
        'order_id': orderId,
        'sub_shop_app_id': franchiseeId
      },
      success: function () {
        _this.getAfterSaleOrder();
      },
      complete: function () {
        _this.setData({
          showEventDialog: false
        });
      }
    })
  },
  getRefundConfigByPickUpType: function () {
    let _this = this;
    let type = this.data.afterSaleData.pick_up_type;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getRefundConfigByPickUpType',
      data: {
        pick_up_type: type,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let data = res.data.config_data;
        _this.setData({
          refundAdress: data.address || ''
        })
      }
    })
  },
  getBuyerCancelReason: function () {
    let type = this.data.afterSaleData.deliver_type || 0;
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getBuyerCancelReason',
      data: {
        deliver_type: type
      },
      success: function (res) {
        let data = res.data;
        let refundJourneyReason = [];
        for (let i in data) {
          refundJourneyReason.push(data[i]);
        }
        _this.setData({
          refundJourneyReason: refundJourneyReason
        })
      }
    })
  },
  showPackageInfoFn: function (e) { // 展示商品套餐详情
    let status = e.currentTarget.dataset.status;
    let index = e.currentTarget.dataset.index;
    let goodsList = this.data.afterSaleData.refund_goods;
    goodsList[index].showPackageInfo = status == 1 ? true : false;
    this.setData({
      'afterSaleData.refund_goods': goodsList
    })
  }
})
