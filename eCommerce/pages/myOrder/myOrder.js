var app = getApp()
const util = require('../../../utils/util.js');
Page({
  data: {
    showGoodsTypeBox: false,
    goodsTypeIcon: {
      0: 'icon-order-ecommerce',
      40: 'icon-order-dine',
      1: 'icon-order-appointment',
      2: 'icon-order-takeaway',
      3: 'icon-order-tostore',
      4: 'icon-order-storedvalue',
      5: 'icon-order-transfer',
      6: 'icon-order-rownumber',
      8: 'icon-order-vipcard',
      9: 'icon-order-exchange',
      10: 'icon-order-appointment',
      12: 'icon-order-giftcard',
      13: 'icon-order-shoppingcard',
      14: 'icon-order-secondarycard',
      15: 'icon-order-rechargecard',
      21: 'icon-order-communitygroup'
    },
    submenuTab: {
      '-2': ['全部', '待付款', '待完成', '待评价', '已完成'], //全部
      0: ['全部', '待付款', '待接单', '待发货', '待收货', '待评价', '已完成'],  //电商非堂食
      40: ['全部', '待商家接单', '已下单', '待付款', '待评价', '已完成'], //电商堂食
      1: ['全部', '待付款', '待确认', '待消费', '待评价'], //预约
      2: ['全部', '待付款', '已完成'], //外卖 
      3: ['全部', '待付款', '待确认', '商家已确认', '待评价', '退款'], //到店
      4: ['全部', '待付款', '待确认', '商家已确认', '待评价', '退款'], //储值
      5: ['全部', '待支付', '已完成'], //当面付
      6: ['全部', '待使用', '已使用', '已失效'], //排号
      8: ['全部', '待付款', '已付款'], //会员卡
      9: ['全部', '待付款', '已付款'], //兑换券
      10: ['全部', '待付款', '待确认', '待消费', '待评价'], //行业预约
      12: ['全部', '待付款', '已完成'], //礼品卡
      13: ['全部', '待付款', '已完成'], //购物卡
      14: ['全部', '待付款', '已付款', '退款中'], //次卡
      15: ['全部', '待付款', '已付款'], //充值卡
      21: ['全部', '待付款', '待发货', '配送中', '待提货', '待评价'], //社区团购
      'evoucher': ['全部', '待付款', '待使用', '已使用', '已关闭']    // 电子卡券
    },
    orderStatusName: {
      '-2': ['待付款', '待发货', '待收货', '待评价', '退款审核中', '正在退款中', '已完成', '已关闭', '待接单', '', '', '', '', '', '', '退款失败'],  //全部
      0: ['待付款', '待发货', '待收货', '待评价', '退款审核中', '正在退款中', '已完成', '已关闭', '待接单', '', '', '', '', '', '', '退款失败'],  //电商
      40: ['待付款', '待发货', '待收货', '待评价', '退款审核中', '正在退款中', '已完成', '已关闭', '待接单', '', '', '', '', '', '', '退款失败', '待接单', '已下单'],  //电商堂食
      1: ['待付款', '等待商家确认', '待消费', '待评价', '退款审核中', '正在退款中', '已消费', '已关闭'], //预约
      2: ['待付款', '待配送', '配送中', '待评价', '退款审核中', '正在退款中', '已消费', '已关闭', '待接单'], //外卖
      20: ['待创建', '待骑手接单', '骑手已接单', '骑手配送中', '骑手配送已完成', '已取消', '已过期', '指派单', '妥投异常之物品返回中', '妥投异常之物品返回完成', '骑手已到店', '申请取消配送', '订单异常'], //外卖 蜂鸟已分配骑手
      3: ['待付款', '等待商家确认', '商家已确认', '待评价', '退款审核中', '正在退款中', '已完成', '已关闭'], //到店
      5: ['待付款', '', '', '', '', '', '已完成', '已关闭'], //当面付
      6: ['待付款', '', '待使用', '', '退款申请中', '退款中', '已使用', '已失效'], //排号
      8: ['待付款', '已付款', '', '', '', '', '', '已关闭'], //购卡
      9: ['待付款', '已付款', '', '', '', '', '', '已关闭'], //兑换券
      10: ['待付款', '等待商家确认', '待消费', '待评价', '退款审核中', '正在退款中', '已完成', '已关闭'], //行业预约
      12: ['待付款', '待消费', '', '退款审核中', '正在退款中', '', '已完成', '已关闭'], //礼品卡
      13: ['待付款', '待消费', '', '退款审核中', '正在退款中', '', '已完成', '已关闭'], //购物卡
      14: ['待付款', '', '已付款', '', '退款审核中', '正在退款中', '', '已关闭'], //次卡
      15: ['待付款', '', '已付款', '', '', '', '', '已关闭'], //充值卡
      21: ['待付款', '待发货', '配送中', '待评价', '审核中', '正在退款中', '已完成', '已关闭', '', '', '待提货'], //社区团购
      'evoucher': ['待付款', '待使用', '已使用','', '退款中', '', '', '已关闭'] // 电子卡券
    },
    existGoodsType: {},   //订单存在类型
    currentGoodsType: '-2',
    orderLists: [],
    hiddenmodalput: true,
    untimes: '', // 次数券的次数
    numberOfStampsUrl: '',
    addLabelText: '',
    noMore: false,
    currentTabIndex: 0,
    goodsTypeList: [],
    isFromBack: false,
    showWriteOffCodeBox: false,
    showGoodsPickBox: false,
    selectGoodsPickIndex: '', 
    selectGoodsPickIndex: 0,
    isShowQRCode: false,
  },
  pages: 1,
  goodsTypeArr: {
    0: '电商',
    40: '餐饮',
    1: '预约',
    2: '外卖',
    3: '到店',
    4: '储值',
    5: '当面付',
    6: '排号',
    8: '会员卡',
    9: '兑换券',
    10: '行业预约',
    12: '礼品卡',
    13: '购物卡',
    14: '次卡',
    15: '充值卡',
    21: '社区团购',
    'evoucher': '电子卡券',
  },
  types: {
    '-2': [0, 1, 2, 3, 4],  // 全部时
    0: [undefined, 0, [8, 16], 1, 2, 3, 6],     // 电商非堂食
    40: [undefined, [8, 16], 17, 0, 3, 6],     // 电商堂食
    1: [undefined, 0, 1, 2, 3],     // 预约
    2: [undefined, 0, 6],        // 外卖
    3: [undefined, 0, 1, 2, 3, 'refund_status'],     // 到店
    4: [undefined, 0, 1, 2, 3],     // 储值
    5: [undefined, 0, 6],      // 当面付
    6: [undefined, 2, 6, 7],     //排号
    8: [undefined, 0, 1],         // 其他（购卡）
    9: [undefined, 0, 1],         // 其他（兑换券）
    10: [undefined, 0, 1, 2, 3],
    12: [undefined, 0, 6],
    13: [undefined, 0, 6],
    14: [undefined, 0, 2, 4],
    15: [undefined, 0, 2, 4],
    21: [undefined, 0, 1, 2, 10, 3], //社区团购
    'evoucher': [undefined, 0, 1, 2,7]  // 电子卡券
  },
  verifiTimeInterval: '',
  onLoad: function(options){
    let currentIndex = options.currentIndex;
    let goodsType = options.goodsType;
    if (goodsType && currentIndex){
      if (goodsType == 0 && currentIndex > 1 && !options.isEletronicCard){
        currentIndex++;
      }
      if (options.isEletronicCard) {
        goodsType = 'evoucher';
      }
      this.setData({
        currentGoodsType: goodsType,
        currentTabIndex: currentIndex,
      })
    }
    this.setData({
      franchiseeIdInfo: {
        id: options.franchisee || ''
      },
      topNavPaddingTop: app.globalData.topNavBarPaddingTop, // 根据不同机型设置顶部导航高度
      topNavHeight: app.globalData.topNavBarHeight - app.globalData.topNavBarPaddingTop
    })
    if(app.isLogin()){
      this.dataInitial();
      this.setData({
        hasLogin: true
      })
    }else{
      this.setData({
        hasLogin: false
      })
    }
  },
  onShow: function(){
    if (this.data.isFromBack) {
      this.pages = 1;
      this.setData({
        currentTabIndex: this.data.currentTabIndex
      });
      this.getOrderList();
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  dataInitial: function(){
    this.getAppECStoreConfig();
    this.getOrderList();
  },
  onReachBottom:function(){
    this.scrollToListBottom();
  },
  selectGoodsType: function(){
    this.setData({
      showGoodsTypeBox: !this.data.showGoodsTypeBox
    })
  },
  clickMeanTab: function (e) {
    let index = e.currentTarget.dataset.index;
    let data = {};
    data.currentTabIndex = 0;
    data.currentGoodsType = index;
    this.pages = 1;
    this.setData(data);
    this.hideGoodsPick();
    this.getOrderList();
    this.selectGoodsType();
    app.pageScrollTo(0);
  },
  clickSubmenuTab: function (e) {
    let index = e.target.dataset.index;
    let data = {};
    data.currentTabIndex = index;
    this.pages = 1;
    this.setData(data);
    this.getOrderList();
  },
  getOrderList: function(){
    let _this = this,
        param = {
          page: this.pages,
          page_size: 25
        },
        searchOrderId = this.data.searchOrderId,
        goodsType = this.data.currentGoodsType,
        currentTabIndex = this.data.currentTabIndex,
        type,
        goodsPickType = this.data.selectGoodsPickIndex;    //电商取货方式
      param.screening_cond = {};
      type = this.types[goodsType][currentTabIndex];
      if(type != undefined){
        if (goodsType == -2){
          param.screening_cond.general_order_status = type;
        }else {
          param.screening_cond.status = type;
        }
      }
      if (goodsType == 0) {
        param.screening_cond.is_distribution_order = [0,1]; //过滤社区团购订单
        param.screening_cond.pick_up_type = goodsPickType == 0 ? [1, 2, 3] : goodsPickType;
      }
      if (goodsType == 40) {
        goodsType = 0;
        param.screening_cond.is_distribution_order = [0, 1]; //过滤社区团购订单
        param.screening_cond.pick_up_type = [4];
      }
      if (goodsType == 21) {
        goodsType = 0;
        param.screening_cond.is_distribution_order = 2;
      }
      if (goodsType === 'evoucher') {
        goodsType = 0;
        param.screening_cond.is_distribution_order = [0, 1]; //过滤社区团购订单
        param.screening_cond.pick_up_type = [6];
      }
      if (searchOrderId){
        param.screening_cond.xcx_common_search = searchOrderId;
      }
      param.goods_type = goodsType;
      if (goodsType == 10 && type == null) {
        param.idx_arr = {
          idx_value:''
        };
      }
    param.parent_shop_app_id = app.getAppId(); // 获取订单列表时 传parent_shop_app_id获取本店以及所有子店的订单
    param.sub_shop_app_id = this.data.franchiseeIdInfo.id || '';
    app.sendRequest({
      url: '/index.php?r=AppShop/orderList',
      method: 'post',
      data: param,
      success: function(res){
        let newData = {},
            orderLists = _this.data.orderLists,
            data = res.data;
        if(_this.pages == 1){
          orderLists = [];
        }
        for(let i = 0; i < data.length; i++){
          data[i] = data[i].form_data;
          let currentGoodsType = data[i].goods_type
          if (currentGoodsType == 0 && data[i].dis_group_info && data[i].dis_group_info.leader_token) {
            data[i].goods_type = '21';
          } else if (currentGoodsType == 0 && data[i].pick_up_type == 4) {
            data[i].goods_type = '40';
          }
          if (currentGoodsType == 5) {
            data[i].goods_info = [{
              cover: app.globalData.appLogo,
              'goods_name': '当面付订单',
              price: data[i].total_price
            }]
          }
          if (currentGoodsType == 8 || currentGoodsType == 9) {
            data[i].goods_info = [data[i].goods_info];
          }
          if(currentGoodsType == 10) {
            let tpl_style = data[i].service.new_appointment.tpl_style || -1;
            if(tpl_style == 5){
              data[i].total_price = '0.00';
              data[i].goods_info[0].price = '0.00';
            }
          }
          data[i].goods_info.map((item) => {
            switch(currentGoodsType){
              case '9': 
                item.cover = item.logo;
                break;
              case '12':
                item.cover = item.card_face;
                break;
              case '13':
                item.cover = item.covers[0];
                break;
              case '6':
              case '14':
              case '15':
                item.cover = app.globalData.appLogo;
                break;
            }
          })
          if (currentGoodsType == 0 && data[i].pick_up_type == 6) {
            data[i].goods_info[0]['valid_date_str'] = _this.returnValidDate(data[i].goods_info[0]);
          }
        }
        newData.orderLists = [...orderLists,...data];
        newData.existGoodsType = {};
        for (let i in _this.goodsTypeArr){
          res.goods_type_list.map((item) => {
            if (item == i) {
              newData.existGoodsType[i] = _this.goodsTypeArr[i];
            }
          })
        }
        if (res.has_dining_order) {
          newData.existGoodsType['40'] = '餐饮';
        }
        if (res.has_electronic_card_order) {
          newData.existGoodsType['evoucher'] = '电子卡券';
        }
        _this._isAddCommunityOrder().then((solve) => {
          if (solve.data != 0) {
            newData.existGoodsType[21] = '社区团购';
          }
          newData.noMore = !res.is_more;
          _this.setData(newData);
        })
      }
    })
  },
  goToOrderDetail: function (e) {
    let index = e.currentTarget.dataset.index,
      currentOrder = this.data.orderLists[index],
      orderId = currentOrder.order_id,
      type = currentOrder.goods_type,
      franchiseeId = currentOrder.app_id,
      queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee=' + franchiseeId,
      router,
      formId = [];
    if(type == 8 || type == 13 || type == 14 || type == 15){return}
    if (e.detail.formId) {
      formId.push(e.detail.formId);
      app.saveUserFormId({ form_id: formId });
    };
    if (type === '5') {
      router = '/eCommerce/pages/transferOrderDetail/transferOrderDetail?detail=';
    } else if (type === '3') {
      router = '/orderMeal/pages/tostoreOrderDetail/tostoreOrderDetail?detail=';
    } else if (type === '0') {
      let pickUpType = currentOrder.pick_up_type;
      if (pickUpType == 1) {
        router = '/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=';
      } else if (pickUpType == 6) {
        router = '/evoucher/pages/evoucherOrderDetail/evoucherOrderDetail?detail=';
      } else {
        router = '/eCommerce/pages/intraCityOrderDetail/intraCityOrderDetail?detail=';
      }
    } else if (type === '40') {
      router = '/eCommerce/pages/diningOrderDetail/diningOrderDetail?detail=';
    } else if (type === '2') {
      router = '/orderMeal/pages/takeoutOrderDetail/takeoutOrderDetailrequestSubscribeMessage?detail=';
    } else if (type === '6') {
      router = '/orderMeal/pages/rowNumberOrderDetail/rowNumberOrderDetail?detail=';
    } else if (type === '9') {
      router = '/exchangeCoupon/pages/numberOfStampsOrderDetail/numberOfStampsOrderDetail?detail=';
    } else if (type === '21') {
      router = '/promotion/pages/communityGroupOrderDetail/communityGroupOrderDetail?detail=';
    } else if (type === '10') {
      let tplId = currentOrder.service.new_appointment.tpl_id || '';
      router = '/tradeApt/pages/orderDetail/orderDetail?tpl_id=' + tplId + '&detail=';
    } else if (type === '12') {
      router = '/giftCard/pages/giftCardsOrderDetail/giftCardsOrderDetail?order_id=';
    } else {
      router = '/eCommerce/pages/appointmentOrderDetail/appointmentOrderDetail?detail=';
    }
    app.turnToPage(router + orderId + queryStr);
  },
  addLabelInput: function (e) {
    this.setData({ 'addLabelText':e.detail.value})
  },
  goToUseStamps: function(event){
    let index = e.target.dataset.index,
      orderLists = this.data.orderLists,
      orderId = orderLists[index].order_id,
      untimes = orderLists[index].un_verify_times,
      couponId = orderLists[index].user_coupon_id,
      franchisee = orderLists[index].app_id,
      subShopId = franchisee == app.getAppId() ? '' : franchisee;
    let url = '/exchangeCoupon/pages/numberOfStampsUsed/numberOfStampsUsed?detail=' + couponId + '&franchisee=' + subShopId;
    this.setData({numberOfStampsUrl: url, hiddenmodalput: false, untimes: untimes})
  },
  confirm: function() {
    if (+this.data.untimes < +this.data.addLabelText) {
      app.showModal({content: '核销次数超过剩余次数'});
      this.setData({hiddenmodalput: true, addLabelText: ''})
      return
    }
    let url = this.data.numberOfStampsUrl + '&Number=' +  this.data.addLabelText
    this.setData({hiddenmodalput: true, addLabelText: ''})
    app.turnToPage(url, false);
  },
  cancel: function () {
    this.setData({hiddenmodalput: true, addLabelText: ''})
  },
  cancelOrder: function(e){
    let index = e.target.dataset.index,
        orderLists = this.data.orderLists,
        orderId = orderLists[index].order_id,
        franchisee = orderLists[index].app_id,
        appId = app.getAppId(),
        subShopId = franchisee == appId ? '' : franchisee,
        _this = this;
    app.showModal({
      content: '你将要取消一笔付款订单，确认取消？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId,
            app_id: appId,
            sub_shop_app_id: subShopId
          },
          success: function(res){
            app.sendUseBehavior([{goodsId: orderId}],7); // 取消订单
            _this.pages = 1;
            _this.getOrderList();
          }
        })
      },
      cancel: function() {
      }
    })
  },
  orderDelete: function (e) {
    let index = e.target.dataset.index,
        orderLists = this.data.orderLists,
        orderId = orderLists[index].order_id,
        franchisee = orderLists[index].app_id,
        appId = app.getAppId(),
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        _this = this;
    app.showModal({
      content: '确定删除此订单吗？删除后不可再恢复哦',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirmColor: '#FF7100',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/HideOrder',
          data: {
            order_id: orderId,
            app_id: appId,
            sub_shop_app_id: subShopId
          },
          success: function (res) {
            _this.pages = 1;
            _this.getOrderList();
          }
        })
      }
    })
  },
  applyDrawback: function(e){
    let index = e.target.dataset.index,
        orderLists = this.data.orderLists,
        orderId = orderLists[index].order_id,
        franchisee = orderLists[index].app_id,
        delivery = orderLists[index].is_pay_on_delivery,
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        _this = this;
    app.showModal({
      content: delivery == 1 ? '确定要取消订单？' : '确定要申请退款？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.requestSubscribeMessage({ 
          type: 4,order_id: orderId
        }).then(() => {
          app.sendRequest({
            url: '/index.php?r=AppShop/applyRefund',
            data: {
              order_id: orderId,
              sub_shop_app_id: subShopId
            },
            success: function (res) {
              app.sendUseBehavior([{goodsId: orderId}],6); // 行为轨迹埋点 申请退款
              _this.pages = 1;
              _this.getOrderList();
            }
          })
        })
      }
    })
  },
  cancelRefund: function(e) {
    let index = e.target.dataset.index,
      orderLists = this.data.orderLists,
      orderId = orderLists[index].order_id,
      franchisee = orderLists[index].app_id,
      appId = app.getAppId(),
      subShopId = franchisee == app.getAppId() ? '' : franchisee,
      _this = this;
      app.showModal({
        content: '是否撤销取消订单申请？',
        showCancel: true,
        cancelText: '取消',
        confirmText: '确定',
        confirm: function () {
          app.sendRequest({
            url: '/index.php?r=AppShop/cancelRefund',
            data: {
              app_id: appId,
              order_id: orderId
            },
            success: function (res) {
              _this.pages = 1;
              _this.getOrderList();
            }
          })
        }
      })
  },
  toCancelOrder: function(e){
    let index = e.target.dataset.index,
      orderLists = this.data.orderLists,
      orderId = orderLists[index].order_id,
      franchisee = orderLists[index].app_id,
      deliverType = orderLists[index].take_out_info.deliver_type;
    app.turnToPage('/orderMeal/pages/cancelOrder/cancelOrder?orderId=' + orderId + '&deliverType=' + deliverType + '&franchisee=' + franchisee);
  },
  checkLogistics: function(e){
    let orderLists = this.data.orderLists;
    let index = e.target.dataset.index;
    let orderId = orderLists[index].order_id;
    let usePickType = orderLists[index].ecommerce_info.dispatch_use_pick_up_type;
    let franchiseeId = orderLists[index].app_id;
    let dispatch_status = orderLists[index].dispatch_status;
    if (dispatch_status != 1){
      if (usePickType == 2) {
        let intraCityData = orderLists[index].ecommerce_info.intra_city_data;
        let type = intraCityData && intraCityData.deliver_type || '';
        let arriveTime = intraCityData && intraCityData.intra_city_appointment_arrive_time || '';
        let sameCity = orderLists[index].wx_local_express_order ? 1 : 0
        app.turnToPage('/eCommerce/pages/sameJourneyLogistic/sameJourneyLogistic?orderId=' + orderId + '&type=' + type + '&arriveTime=' + arriveTime + '&franchiseeId=' + franchiseeId + '&sameCity=' + sameCity);
      } else {
        app.turnToPage('/eCommerce/pages/logisticsPage/logisticsPage?detail=' + orderId + '&franchiseeId=' + franchiseeId);
      }
    }else{
      app.turnToPage('/eCommerce/pages/logisticsGoodsList/logisticsGoodsList?orderId=' + orderId + '&franchiseeId=' + this.franchiseeId);
    }
  },
  sureReceipt: function(e){
    let orderLists = this.data.orderLists;
    let index = e.target.dataset.index;
    let orderId = orderLists[index].order_id,
        franchisee = orderLists[index].app_id,
        subShopId = franchisee == app.getAppId() ? '' : franchisee,
        _this = this,
        content = this.data.currentGoodsType == '1'? '确认已消费?':'确认收货代表您已经拿到货物，确认后将无法撤销！建议与商家联系后再操作';
    app.showModal({
      content: content,
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=AppShop/comfirmOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: subShopId
          },
          success: function(res){
            let addTime = Date.now();
            _this.pages = 1;
            app.sendUseBehavior([{goodsId: orderId}],8); // 行为轨迹埋点 确认收货
            if (_this.data.currentGoodsType == 0){
              app.turnToPage('/eCommerce/pages/transactionSuccess/transactionSuccess?pageFrom=transation&orderId=' + orderId + '&franchiseeId=' + subShopId);
            }else{
              _this.getOrderList({tabIndex : index});
            }
            app.sendRequest({
              hideLoading: true,
              url: '/index.php?r=appShop/getIntegralLog',
              data: { add_time: addTime },
              success: function (res) {
                if (res.status == 0) {
                  res.data && _this.setData({
                    'rewardPointObj': {
                      showModal: true,
                      count: res.data,
                      callback: ''
                    }
                  });
                }
              }
            })
          }
        })
      }
    })
  },
  makeComment: function(e){
    let orderLists = this.data.orderLists,
        index = e.target.dataset.index,
        orderId = orderLists[index].order_id,
        franchiseeId = orderLists[index].app_id,
        queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee='+franchiseeId,
        router;
    if (orderLists[index].goods_type == 2){
      router = '/orderMeal/pages/takeoutMakeComment/takeoutMakeComment?detail=' + orderId + queryStr;
    }else{
      router = '/eCommerce/pages/makeComment/makeComment?detail=' + orderId + queryStr;
    }
    app.turnToPage(router);
  },
  scrollToListBottom: function(){
    if(this.data.noMore){
      return;
    }
    this.pages++;
    this.getOrderList();
  },
  getWriteOffCodeBox: function (event) {
    let _this = this,
        orderLists = this.data.orderLists,
        index = event.target.dataset.index,
        isEvoucher = event.target.dataset.isEvoucher,
        orderId = orderLists[index].order_id,
        franchiseeId = orderLists[index].app_id;
    let params = {
      'sub_shop_app_id': franchiseeId,
      'order_id': orderId,
    }
    if (isEvoucher) {
      params['cursor'] = '-1';
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetOrderVerifyCode',
      data: params,
      success: function (res) {
        let dataSet = {
          'codeImgUrl': util.showFullUrl(res.data.qrcode_url),
          'codeNum': res.data.code,
          'codeStatus': res.data.status,
        };
        if (isEvoucher) {
          dataSet['isShowQRCode'] = true;
        } else {
          dataSet['showWriteOffCodeBox'] = true;
        }
        _this.setData(dataSet);
        _this.connectSocket();
      },
    })
  },
  connectSocket: function () {
    var _this = this;
    wx.connectSocket({
      url: 'wss://ceshi.zhichiwangluo.com',
      header: {
        'content-type': 'application/json'
      },
      method: 'GET'
    });
    wx.onSocketOpen(function (res) {
      let data = {
        'action': 'mark_client',
        'user_token': app.globalData.userInfo.user_token,
        'scenario_name': 'app_order_verify',
        'session_key': app.globalData.sessionKey
      };
      wx.sendSocketMessage({
        data: JSON.stringify(data)
      });
      _this.verifiTimeInterval = setInterval(function () {
        let data = {
          'action': 'heartbeat',
          'user_token': app.globalData.userInfo.user_token,
          'scenario_name': 'app_order_verify',
          'session_key': app.globalData.sessionKey
        };
        wx.sendSocketMessage({
          data: JSON.stringify(data)
        })
      }, 30000);
    });
    wx.onSocketMessage(function (res) {
      let data = JSON.parse(res.data);
      if (data.action == 'push_to_client') {
        let msg = JSON.parse(data.msg);
        if ((msg.type == 'app_order_verify') && (msg.status == 0)) {
          _this.setData({
            'codeStatus': 1
          });
          clearInterval(_this.verifiTimeInterval);
          wx.closeSocket();
        }
      }
    });
  },
  payOrder: function (event) {
    let _this = this,
        orderLists = this.data.orderLists,
        index = event.target.dataset.index,
        orderId = orderLists[index].order_id,
        franchiseeId = orderLists[index].app_id,
        price = orderLists[index].total_price;
    if (price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function (res) {
          setTimeout(function () {
            app.showToast({
              title: '支付成功',
              icon: 'success'
            });
          });
          setTimeout(function () {
            _this.pages = 1;
            _this.getOrderList();
          }, 1000);
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId,
        sub_shop_app_id: franchiseeId == app.getAppId() ? '' : franchiseeId,
      },
      success: function (res) {
        var param = res.data;
        param.orderId = orderId;
        param.goodsType = _this.data.currentGoodsType;
        param.success = function () {
          setTimeout(function () {
            _this.pages = 1;
            _this.getOrderList();
          }, 1500);
        };
        app.wxPay(param);
      }
    })
  },
  receiveDrawback: function (e) {
    let _this = this;
      orderLists = this.data.orderLists,
      index = e.target.dataset.index,
      orderId = orderLists[index].order_id,
      franchisee = orderLists[index].app_id,
      appId = app.getAppId(),
      subShopId = franchisee == app.getAppId() ? '' : franchisee,
      _this = this;
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
            sub_shop_app_id: subShopId
          },
          success: function (res) {
            _this.pages = 1;
            _this.getOrderList();
          }
        })
      }
    })
  },
  toSeeQrcode(event) {
    let orderLists = this.data.orderLists,
      index = event.target.dataset.index,
      orderId = orderLists[index].order_id,
      franchisee = orderLists[index].app_id,
      pagePath = '/tradeApt/pages/qrcode/qrcode?orderId=' + orderId + '&franchiseeId=' + franchisee;
    app.turnToPage(pagePath);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      let newData = {};
      newData['storeStyle'] = res.color_config;
      newData['hasRecommendConfig'] = res.recommend_config ? true : false;
      if (res.express == 1) {
        newData['express'] = 1;
      }
      if (res.is_self_delivery == 1) {
        newData['is_self_delivery'] = 1;
      }
      if (res.intra_city == 1){
        newData['intra_city'] = 1;
      }
      if (res.dining == 1){
        newData['dining'] = 1;
      }
      this.setData(newData);
    });
  },
  _isAddCommunityOrder: function () {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppDistributionExt/CountDistributionOrderByBuyerId',
        hideLoading: true,
        success: function (res) {
          resolve(res);
        }
      })
    })  
  },
  showGoodsPick: function() {
    let _this = this;
    this.setData({
      showGoodsPickBox: !_this.data.showGoodsPickBox
    })
  },
  selectGoodsPick: function(e){
    this.setData({
      selectGoodsPickIndex: e.currentTarget.dataset.type,
      showGoodsPickBox: false
    })
    this.pages = 1;
    this.getOrderList();
  },
  inputOrderId: function(e){
    this.setData({
      searchOrderId: e.detail.value,
    })
  },
  searchOrderId: function () {
    this.pages = 1;
    this.getOrderList();
  },
  deleteInputOrderId: function(){
    this.setData({
      searchOrderId: ''
    })
  },
  stopPropagation: function(){
  },
  hideGoodsPick: function(){
    this.setData({
      showGoodsPickBox: false
    })
  },
  inputOrderId: function(e){
    this.setData({
      searchOrderId: e.detail.value
    })
  },
  shoppingCartGoLogin: function () {
    let _this = this;
    app.goLogin({
      success: function () {
        _this.dataInitial();
        _this.setData({
          hasLogin: true
        })
      }
    });
  },
  turnToBack: function(){
    app.turnBack();
  },
  returnValidDate: function(goodsInfo) {
    let tempStr = '';
    let tempObj = {
      1: `永久有效`,
      2: `${util.formatTimeYMD(goodsInfo.start_date_time, 'YYYY-MM-DD')}至${util.formatTimeYMD(goodsInfo.end_date_time, 'YYYY-MM-DD')}`,
      3: goodsInfo['after_buy_x_days'] > 0 ? `购买后${goodsInfo['after_buy_x_days']}天后生效，有效期${goodsInfo['after_buy_continued_x_days']}天` : `购买后当天生效，有效期${goodsInfo['after_buy_continued_x_days']}天`
    };
    if (!goodsInfo['valid_start_date'] || !goodsInfo['valid_end_date']) {
      tempStr = tempObj[goodsInfo.valid_date_type];
    } else {  // 接口有有效期返回
      if (goodsInfo.valid_date_type == 1) { // 永久有效
        tempStr = tempObj[1];
      } else 
      tempStr = `${goodsInfo.valid_start_date}至${goodsInfo.valid_end_date}`
    }
    return tempStr;
  },
  hideQRCode: function () {
    this.setData({
      isShowQRCode: false
    });
  },
  copyCodeNum: function (e) {
    let code = e.currentTarget.dataset.code;
    app.setClipboardData({
      data: code,
      success: () => {
        app.showToast({ title: '复制成功', duration: 500 });
      }
    });
  },
})
