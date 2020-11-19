const app = getApp();
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '联盟会员权益',
    },
    isCircular: true,
    current: 1,
    vipCardsList: [],     // 多店会员卡列表
    isCollectUserInfo: 0, // 是否需要收集用户信息
    packageIndex: 0,      // 付费会员卡，套餐下标索引
    packagePrice: 0,      // 付费会员卡，套餐价格
  },
  onLoad: function (options) {
    let cardId = options.id || '';
    let onlyPaidCard = options.is_paid_card || false;
    let cardType = options.cardtype || '';
    let franchiseeId = options.franchisee || '';
    this.onlyPaidCard = onlyPaidCard;
    let { systemInfo, topNavBarHeight } = app.globalData;
    let containerHeight = systemInfo.screenHeight - topNavBarHeight;
    let swiperHeight = containerHeight - 142;
    this.setData({
      cardId: cardId,
      franchiseeId: franchiseeId,
      cardType: cardType,
      swiperHeight: swiperHeight
    });
    this.getCollectUserinfoConfig();
    this.getAllVipCardList();
  },
  getCollectUserinfoConfig: function () {
    let _this = this;
    let { franchiseeId } = _this.data;
    app.sendRequest({
      url: '/index.php?r=appVipCard/getCollectUserinfoConfig',
      hideLoading: true,
      data: {
        sub_shop_app_id: franchiseeId,
      },
      success: function(res) {
        let returnData = res.data;
        _this.setData({
          isCollectUserInfo: returnData.need_collect_info || 0,
        });
      }
    });
  },
  getAllVipCardList: function () {
    let _this = this;
    let { franchiseeId, cardType } = _this.data;
    app.sendRequest({
      url: '/index.php?r=appVipCard/getUserAccountSurvey',
      method: 'POST',
      data: {
        sub_shop_app_id: franchiseeId,
        card_type: cardType,
      },
      success: (res) => {
        let returnData = res.data;
        let { cardId, current } = _this.data;
        let setDataObj = {};
        let vipCardsList = [];
        let returnVipList = returnData.all_app_shop_vip_card || [];
        let userPaidVipCard = returnData.user_app_shop_paid_vip_card || {};
        let uesrCommonVipCard = returnData.user_app_shop_vip_card || {};
        if (_this.onlyPaidCard) {
          returnVipList = returnVipList.filter((card) => card.condition_type == 2);
        }
        if (returnVipList && returnVipList.length) {
          returnVipList.forEach((card, index) => {
            vipCardsList.push(_this.vipCardDataProcess(card));
            if (cardId && cardId == card.id) {
              current = index;
            }
          });
          if (vipCardsList.length < 3 && !cardId) {
            current = 0;
          }
        }
        if (vipCardsList[current] && vipCardsList[current].condition_type == 2) {
          setDataObj['packagePrice'] = vipCardsList[current].price || 0;
          setDataObj['packageIndex'] = 0;
        }
        setDataObj['current'] = current;
        setDataObj['currentVipCard'] = vipCardsList[current];
        setDataObj['userPaidVipCard'] = userPaidVipCard;
        setDataObj['uesrCommonVipCard'] = uesrCommonVipCard;
        setDataObj['vipCardsList'] = vipCardsList;
        _this.setData(setDataObj);
      }
    });
  },
  vipCardDataProcess: function (cardData) {
    if (cardData.condition_type == 0) {
      cardData.condition_text = '无门槛';
    } else if (cardData.condition_type == 1) {
      if (cardData.trade_count != '-1') { // 交易数量
        cardData.condition_text = `累计交易成功${cardData.trade_count}笔`;
      }
      if (cardData.consume_count != '-1') { // 消费金额
        cardData.condition_text = cardData.condition_text ? `${cardData.condition_text}; 或累计消费金额${cardData.consume_count}元` : `累计消费金额${cardData.consume_count}元`;
      }
      if (cardData.integral_count != '-1') {  // 积分达标
        cardData.condition_text = cardData.condition_text ? `${cardData.condition_text}; 或累计积分达到${cardData.integral_count}分` : `累计积分达到${cardData.integral_count}分`;
      }
    } else if (cardData.condition_type == 2) {
      cardData.condition_text = '付费购买';
      let specialTipArr = [];
      if (cardData.coupon_list && cardData.coupon_list.length) {
        specialTipArr.push('优惠券');
      }
      if (cardData.balance && cardData.balance != 0) {
        specialTipArr.push('储值');
      }
      if (cardData.integral && cardData.integral != 0) {
        specialTipArr.push('积分');
      }
      cardData.special_tip = `${specialTipArr.join('、')}在付费会员卡有效期限内每月赠送一次`;
    }
    if (cardData.coupon_list && cardData.coupon_list.length) {
      cardData.coupon_list.map((coupon) => {
        coupon.type_txt = this.getCouponTypeStr(coupon.type);
      });
    }
    if (cardData.birthday_coupon_list && cardData.birthday_coupon_list.length) {
      cardData.birthday_coupon_list.map((coupon) => {
        coupon.type_txt = this.getCouponTypeStr(coupon.type);
      });
    }
    return cardData;
  },
  addPaidCardOrder: function () {
    let _this = this;
    let { currentVipCard, packagePrice, franchiseeId, isRequesting } = _this.data;
    if (isRequesting) return;
    this.setData({
      isRequesting: true,
    });
    app.sendRequest({
      url: '/index.php?r=appVipCard/addPaidVipCardOrder',
      method: 'POST',
      data: {
        data_id: currentVipCard.id,
        price: packagePrice,
        sub_shop_app_id: '',
        is_app_shop: 1, // 是否是联盟付费会员卡
      },
      success: function (res) {
        let orderId = res.data;
        _this.payOrder(orderId)
      }
    });
  },
  payOrder: function (orderId) {
    let _this = this;
    let { isCollectUserInfo, currentVipCard, packagePrice, userPaidVipCard, franchiseeId } = _this.data;
    function paySuccess() {
      if (isCollectUserInfo) { // 收集用户信息
        app.turnToPage('/userCenter/pages/userCenter/userCenter?id=' + currentVipCard.id);
      } else {
        if (userPaidVipCard.vip_id != currentVipCard.id) {
          app.sendRequest({
            hideLoading: true,
            url: '/index.php?r=appVipCard/sendRecvVipCardMsg',
            data: {
              formId: _this.formId,
              vip_id: currentVipCard.id,
              sub_shop_app_id: franchiseeId
            }
          });
        }
        app.turnToPage('/pages/userCenterComponentPage/userCenterComponentPage');
      }
    }
    function payFail() {
      app.turnToPage('/pages/userCenterComponentPage/userCenterComponentPage');
    }
    if (packagePrice == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function (res) {
          paySuccess();
        },
        fail: function () {
          payFail();
        },
        complete: function () {
          _this.setData({
            isRequesting: false
          });
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: function (res) {
        let param = res.data;
        param.orderId = orderId;
        param.goodsType = 8;
        param.success = paySuccess;
        param.fail = payFail;
        _this.formId = param.package.substr(10);
        app.wxPay(param);
      },
      complete: function () {
        _this.setData({
          isRequesting: false
        });
      }
    });
  },
  getCouponTypeStr: function(couponType) {
    switch (couponType) {
      case '0':
        return '满减券';
        break;
      case '1': 
        return '打折券';
        break;
      case '2':
        return '代金券';
        break;
      case '3':
        return '兑换券';
        break;
      case '4':
        return '储值券';
        break;
      case '5':
        return '通用券';
        break;
      case '6':
        return '次数券';
        break;
      default:
        return '';
        break;
    }
  },
  swiperChange: function (e) {
    let { vipCardsList } = this.data;
    let { source, current } = e.detail;
    let setDataObj = {};
    if (source == 'touch') {
      setDataObj['current'] = current;
      setDataObj['currentVipCard'] = vipCardsList[current];
      if (vipCardsList[current].condition_type == 2) {
        setDataObj['packagePrice'] = vipCardsList[current].price;
        setDataObj['packageIndex'] = 0;
      }
    }
    this.setData(setDataObj);
  },
  selectVipCardPackage: function(e) {
    let { index, price } = e.currentTarget.dataset;
    this.setData({
      packageIndex: index,
      packagePrice: price,
    });
  },
  gotoHomePage: function () {
    let { homepageRouter } = app.globalData;
    app.turnToPage(`/pages/${homepageRouter}/${homepageRouter}`, true);
  },
  gotoMemberDay: function () {
    app.turnToPage('/eCommerce/pages/memberDay/memberDay?franchisee=' +this.data.franchiseeId);
  },
})