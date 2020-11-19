const app = getApp();
Page({
  data: {
    isCircular: true,
    current: 1,
    vipCardsList: [],     // 多店会员卡列表
    isCollectUserInfo: 0, // 是否需要收集用户信息
    subShopsList: [],     // 子店列表
    vipCardPackage: {            // 付费会员卡套餐
      index: 0,
      price: 0,
      originalPrice: 0,
      num: 1,
      validPeriod: '1个月',
    },
    requestIsFinish: false, // 请求是否完成
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
      success: function (res) {
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
        } else {
          wx.setNavigationBarColor({
            frontColor: '#000000',
            backgroundColor: '#f3f3f3',
          });
        }
        if (vipCardsList[current] && vipCardsList[current].condition_type == 2) {
          setDataObj['vipCardPackage'] = {
            price: vipCardsList[current].price || 0,
            index: 0,
            num: 1,
            originalPrice: vipCardsList[current].price,
            validPeriod: '1个月',
          }
        }
        if (vipCardsList[current] && vipCardsList[current].id) {
          _this.getSubshopsList(vipCardsList[current]);
        }
        setDataObj['current'] = current;
        setDataObj['currentVipCard'] = vipCardsList[current];
        setDataObj['userPaidVipCard'] = userPaidVipCard;
        setDataObj['uesrCommonVipCard'] = uesrCommonVipCard;
        setDataObj['vipCardsList'] = vipCardsList;
        _this.setData(setDataObj);
      },
      complete: () => {
        _this.setData({
          requestIsFinish: true
        });
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
    let { currentVipCard, vipCardPackage, franchiseeId, isRequesting } = _this.data;
    if (isRequesting) return;
    this.setData({
      isRequesting: true,
    });
    app.sendRequest({
      url: '/index.php?r=appVipCard/addPaidVipCardOrder',
      method: 'POST',
      data: {
        data_id: currentVipCard.id,
        price: vipCardPackage.price,
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
    let { isCollectUserInfo, currentVipCard, vipCardPackage, userPaidVipCard, franchiseeId } = _this.data;
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
    if (vipCardPackage.price == 0) {
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
  getSubshopsList: function (card) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/GetVipAppShopList',
      hideLoading: true,
      data: {
        card_id: card.id,
        parent_app_id: app.getAppId(),
        page: 1,
        page_size: 5,
        is_paid_vip: card.condition_type == 2 ? 1 : 0,
      },
      success: function (res) {
        let returnList = res.data;
        if (returnList && returnList.length) {
          _this.setData({
            subShopsList: returnList
          });
        } else {
          _this.setData({
            subShopsList: []
          });
        }
      }
    });
  },
  getCouponTypeStr: function (couponType) {
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
      setDataObj['isRequesting'] = false;
      if (vipCardsList[current].condition_type == 2) {
        setDataObj['vipCardPackage'] = {
          price: vipCardsList[current].price,
          index: 0,
          num: 1,
          originalPrice: vipCardsList[current].price,
          validPeriod: '1个月',
        }
      }
    }
    this.getSubshopsList(vipCardsList[current]);
    this.setData(setDataObj);
  },
  selectVipCardPackage: function (e) {
    let { index, price, originalPrice, num, unitType } = e.currentTarget.dataset;
    let validPeriod = unitType == 1 ? `${num}个月` : unitType == 2 ? `${num}年` : '永久有效';
    this.setData({
      vipCardPackage: {
        index: index,
        price: price,
        num: num || 1,
        originalPrice: originalPrice ? originalPrice : price,
        validPeriod: validPeriod,
      }
    });
  },
  gotoHomePage: function () {
    let { homepageRouter } = app.globalData;
    app.turnToPage(`/pages/${homepageRouter}/${homepageRouter}`, true);
  },
  gotoMemberDay: function () {
    app.turnToPage('/eCommerce/pages/memberDay/memberDay?franchisee=' + this.data.franchiseeId);
  },
  turnToShopsList: function () {
    app.turnToPage('/eCommerce/pages/balanceShopsList/balanceShopsList?isVip=1');
  },
  turnToFranchisee: function (event) {
    let dataset = event.currentTarget.dataset;
    let franchiseeId = dataset.appId;
    let mode = dataset.mode;
    let pageLink = dataset.newpage;
    let param = {};
    param.detail = franchiseeId;
    if (pageLink) {
      mode = dataset.newmode;
      let options = { mode, pageLink, franchiseeId, param };
      app.turnToFranchiseePage(options);
      return;
    }
    app.goToFranchisee(mode, param);
  },
})