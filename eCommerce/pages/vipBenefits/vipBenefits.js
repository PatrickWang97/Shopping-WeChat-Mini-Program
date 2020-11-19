let app = getApp()
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '会员权益',
    },
    slideData: [],                   // 存的是会员卡的logo
    currentIndex: 0,
    startX: 0,
    moveX: 0,
    cardListData: [],                // 会员卡列表信息
    currentCard: {},                 // 当前会员卡信息
    requesting: false,
    currentComboIndex: 0,            // 当前选中的优惠套餐的下标
    price: 0,                        // 价格
    cardId: '',                      // 会员卡id
    isPaidCard: '',                  // 是否为付费会员卡
    isRenew: '',                     // 是否为续费会员
    isNeedCollect: 0,                // 是否需要收集会员信息
    userPaidVipCard: {},             // 用户付费卡
    userVipCard: {},                 // 用户的规则卡
    specialNote: '',                 // 特别说明
    isVipBenefitDay: 0,              // 是否存在会员日
    isUserDiyLogo: false,            // 是否为用户自定义logo      
    loading: true,                   // 首屏是否在加载  
    franchiseeId: '',                // 子店id
    fix_time_benefit: {
      sendBalanceRule: '',
      sendIntegralRule: '',
      sendCouponRule: '',
      showBenefit: false
    },
    showRenew: false,              // 永久会员续费提醒
    packageId: '',                 // 选中套餐id
  },
  swiperTime: null,                // 获取高级权益
  onLoad: function (options) {
    let id = options.id || '';
    let isPaidCard = options.is_paid_card || '';
    let isRenew = options.is_renew || '';
    let franchiseeId = options.franchisee || '';
    let cardtype = options.cardtype || '';
    this.setData({
      cardId: id,
      isPaidCard: isPaidCard,
      isRenew: isRenew,
      franchiseeId: franchiseeId,
      cardtype: cardtype
    })
    this.getAllVipCardInfo();
    this.getCollectUserinfoConfig();
  },
  swiperBindChange: function(event) {
    const { current } = event.detail;
    this.setData({ currentIndex: current });
    this.setCurrentCard();
    this.getVipSenior();
  },
  getAllVipCardInfo: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appVipCard/getUserAccountSurvey',
      method: 'post',
      data: {
        sub_shop_app_id: _this.data.franchiseeId,
        card_type: _this.data.cardtype
      },
      hideLoading: false,
      success: function (res) {
        let data = res.data.all_vip_card;
        let slideData = [];
        let isPaidCard = _this.data.isPaidCard;
        let cardId = _this.data.cardId;
        let cardListData = [];
        let userPaidVipCard = res.data.user_paid_vip_card ? res.data.user_paid_vip_card : {};
        let userVipCard = res.data.user_vip_card ? res.data.user_vip_card : {};
        let needCollectInfo = res.data.need_collect_info;
        let noLevel = false;
        data.map((item) => {
          if (item.condition_type == 0 && (!isPaidCard || cardId)) {
            if (item.id === userVipCard.vip_id || item.id === userPaidVipCard.vip_id) {
              slideData.push(item.logo);
            } else {
              slideData.push(item.pre_logo || item.logo);
            }
            cardListData.push(item);
          } else if (item.condition_type == 1 && (!isPaidCard || cardId)) {
            if (item.id === userVipCard.vip_id || item.id === userPaidVipCard.vip_id) {
              slideData.push(item.logo)
            } else {
              slideData.push(item.pre_logo || item.logo);
            }
            cardListData.push(item);
          } else if (item.condition_type == 2) {
            if (item.id === userVipCard.vip_id || item.id === userPaidVipCard.vip_id) {
              slideData.push(item.logo)
            } else {
              slideData.push(item.pre_logo || item.logo);
            }
            cardListData.push(item);
          }
          if(item.level == 0){
            noLevel = true
          }
        })
        slideData.forEach((item, index) => {
          if (item.indexOf('/vip-card/') !== -1) {             // 如果为自定义logo则不在logo上显示卡名称
            cardListData[index].is_show_title = 1;
          } else {
            cardListData[index].is_show_title = 0;
          }
        })
        _this.setData({
          cardListData: cardListData,
          slideData: slideData,
          userPaidVipCard: userPaidVipCard,
          userVipCard: userVipCard,
          isVipBenefitDay: res.data.is_vip_benefit_day,
          needCollectInfo: needCollectInfo,
          noLevel: noLevel
        })
        if (_this.data.cardId) {
          _this.setCurrentIndex(_this.data.cardId)
        }
        _this.setCurrentCard();
        _this.getVipSenior();
      },
      complete: function (res) {
        _this.setData({
          loading: false
        })
      }
    })
  },
  setCurrentIndex: function (id) {
    let allCardData = this.data.cardListData;
    let currentIndex = 0;
    allCardData.forEach((item, index) => {
      if (this.data.isPaidCard == 1 || this.data.isRenew == 1) {
        if (item.condition_type == 2 && item.id == id) {
          currentIndex = index
        }
      } else {
        if ((item.condition_type == 0 || item.condition_type == 1) && item.id == id) {
          currentIndex = index
        }
      }
    })
    this.setData({
      currentIndex: currentIndex
    })
  },
  setCurrentCard: function () {
    let info = JSON.parse(JSON.stringify(this.data.cardListData[this.data.currentIndex]));
    let price = 0;
    let specialNoteArr = [];
    let specialNote = '';
    let isUserDiyLogo = false;
    let currentCombo = {};
    if (!info) {
      return;
    }
    if (info.condition_type == 0) {                   // condition_text：获取条件的文字说明
      info.condition_text = ['无门槛'];
    } else if (info.condition_type == 1) {
      info.condition_text = [];
      if (info.trade_count !== '-1') {
        info.condition_text.push(`累计交易成功${info.trade_count}笔`);
      }
      if (info.consume_count !== '-1') {
        let text = '';
        if (info.condition_text.length) {
          text += '或'
        }
        text += `累计消费金额${info.consume_count}元`;
        info.condition_text.push(text);
      }
      if (info.integral_count !== '-1') {
        let text = '';
        if (info.condition_text.length) {
          text += '或'
        }
        text += `累计积分达到${info.integral_count}分`;
        info.condition_text.push(text);
      }
    } else if (info.condition_type == 2) {
      info.condition_text = ['付费购买']
    }
    if (info.combo && !Array.isArray(info.combo)) {   // combo：优惠套餐 
      info.combo = JSON.parse(info.combo);
    }
    if (info.combo) {
      info.combo = info.combo.map((item) => {
        item.coupon_list = item.coupon_list || [];
        item.integral = +item.integral || 0;
        item.balance = +item.balance || 0;
        if (item.unit_type == -1) {
          item.time = '永久';
        } else if (item.unit_type == 2) {
          item.time = `${item.num}年`;
        } else {
          item.time = `${item.num}个月`;
        }
        if (info.coupon_list && info.coupon_list.length) {
          item.coupon_list = item.coupon_list.concat(info.coupon_list);
        }
        if (info.integral && info.integral != 0) {
          item.integral = item.integral + (+info.integral);
        }
        if (info.balance && info.balance != 0) {
          item.balance = item.balance + (+info.balance);
        }
        item.coupon_list = this._mapCouponInfo(item.coupon_list);
        if (item.price) {
          item.price = Number(item.price).toFixed(2)
        }
        return item;
      })
    } else {
      info.combo = [{
        id: '',
        unit_type: 1,
        num: 1,
        time: '1个月',
        price: info.price,
        original_price: info.price,
        coupon_list: info.coupon_list,
        integral: info.integral,
        balance: info.balance
      }]
    }
    currentCombo = info.combo[0];
    if (info.combo.length) {
      price = info.combo[0].price || info.combo[0].original_price;
    }
    if (info.coupon_list && Array.isArray(info.coupon_list) && info.coupon_list.length) {
      info.coupon_list = this._mapCouponInfo(info.coupon_list)
    }
    if (info.birthday_coupon_list && Array.isArray(info.birthday_coupon_list) && info.birthday_coupon_list.length) {
      info.birthday_coupon_list = this._mapCouponInfo(info.birthday_coupon_list)
    }
    if (info.coupon_list && info.coupon_list.length) {
      specialNoteArr.push('优惠券');
    }
    if (info.balance && info.balance != 0) {
      specialNoteArr.push('储值');
    }
    if (info.integral && info.integral != 0) {
      specialNoteArr.push('积分');
    }
    if (info.logo.indexOf('/vip-card/') === -1) {
      isUserDiyLogo = true;
    }
    specialNote = specialNoteArr.join('、');
    if (currentCombo.unit_type == 1) {
      specialNote += '在付费会员卡有效期限内每月赠送一次';
    } else if (currentCombo.unit_type == 2) {
      specialNote += '在付费会员卡有效期限内每年赠送一次';
    } else {
      specialNote += '在永久期限内只赠送一次';
    }
    this.setData({
      currentCard: info,
      currentComboIndex: 0,
      price: price,
      specialNote,
      isUserDiyLogo: isUserDiyLogo,
      packageId: currentCombo.id
    })
  },
  _mapCouponInfo: function(couponList){
    return couponList.map((coupon) => {
      coupon.name = coupon.type === '0' ? '满减券' :
      coupon.type === '1' ? '打折券' :
      coupon.type === '2' ? '代金券' :
      coupon.type === '3' ? '兑换券' :
      coupon.type === '4' ? '储值券' :
      coupon.type === '5' ? '通用券' :
      coupon.type === '6' ? '次数券' : '';
      return coupon;
    })
  },
  addPaidCardOrder: function () {
    let _this = this;
    if (!this.data.showRenew && this.data.userPaidVipCard.vip_id != this.data.currentCard.id && this.data.userPaidVipCard.expired_time == -1) {
      this.setData({ showRenew: true });
      return;
    }
    this.setData({
      requesting: true
    })
    app.sendRequest({
      url: '/index.php?r=appVipCard/addPaidVipCardOrder',
      method: 'post',
      data: {
        data_id: _this.data.currentCard.id,
        sub_shop_app_id: _this.data.franchiseeId,
        price: _this.data.price,
        combo_id: _this.data.packageId
      },
      hideLoading: false,
      success: function (res) {
        let orderId = res.data;
        _this.payOrder(orderId)
      },
      complete: function (res) {
        if(res.status === 1) {
          _this.setData({
            requesting: false
          })
        }
      }
    })
  },
  getCollectUserinfoConfig: function () {
    let _this = this;
    let userInfo = app.getUserInfo();
    app.sendRequest({
      url: '/index.php?r=appVipCard/getCollectUserinfoConfig',
      method: 'post',
      hideLoading: true,
      data: {
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        _this.setData({
          isNeedCollect: res.data.need_collect_info ? res.data.need_collect_info : 0
        })
      }
    })
  },
  payOrder: function (orderId) {
    let _this = this;
    function paySuccess() {
      if (_this.data.isNeedCollect) {
        app.turnToPage('/userCenter/pages/userCenter/userCenter?id=' + _this.data.currentCard.id);
      } else {
        app.turnToPage('/pages/userCenterComponentPage/userCenterComponentPage');
      }
    }
    function payFail() {
      app.turnToPage('/pages/userCenterComponentPage/userCenterComponentPage');
    }
    if (this.data.price == 0) {
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
            requesting: false
          })
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
        _this.wxPay(param);
      },
      complete: function () {
        _this.setData({
          requesting: false
        })
      }
    })
  },
  wxPay: function (param) {
    let _this = this;
    wx.requestPayment({
      'timeStamp': param.timeStamp,
      'nonceStr': param.nonceStr,
      'package': param.package,
      'signType': param.signType,
      'paySign': param.paySign,
      success: function (res) {
        _this.wxPaySuccess(param);
        typeof param.success === 'function' && param.success();
      },
      fail: function (res) {
        if (res.errMsg === 'requestPayment:fail cancel') {
          app.showModal({
            content: '支付已取消',
            complete: function () {
              typeof param.fail === 'function' && param.fail();
            }
          });
          return;
        }
        if (res.errMsg === 'requestPayment:fail') {
          res.errMsg = '支付失败';
        }
        app.showModal({
          content: res.errMsg
        })
        app.wxPayFail(param, res.errMsg);
        typeof param.fail === 'function' && param.fail();
      }
    })
  },
  wxPaySuccess: function (param) {
    let orderId = param.orderId,
      formId = param.package.substr(10),
      _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/SendXcxOrderCompleteMsg',
      data: {
        formId: formId,
        order_id: orderId,
        t_num: 'AT0009'
      }
    })
    if (this.isNeedCollect == 0 && this.data.userPaidVipCard.vip_id != this.data.currentCard.id) {
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=appVipCard/sendRecvVipCardMsg',
        data: {
          formId: formId,
          vip_id: _this.data.currentCard.id,
          sub_shop_app_id: _this.data.franchiseeId
        }
      })
    }
  },
  selectCombo: function (e) {
    let index = e.currentTarget.dataset.index;
    let currentCard = this.data.currentCard;
    let { price, original_price } = this.data.currentCard.combo[index];
    let unit_type = currentCard.combo[index].unit_type || 1;   //  1月 2年 -1永久
    let packageId = currentCard.combo[index].id;
    let specialNoteArr = [];
    let specialNote = '';
    if (unit_type == 1) {
      if (currentCard.coupon_list && currentCard.coupon_list.length) {
        specialNoteArr.push('优惠券');
      }
      if (currentCard.balance && currentCard.balance != 0) {
        specialNoteArr.push('储值');
      }
      if (currentCard.integral && currentCard.integral != 0) {
        specialNoteArr.push('积分');
      }
      specialNote = specialNoteArr.join('、') + '在付费会员卡有效期限内每月赠送一次';
    } else {
      if (currentCard.combo[index].coupon_list && currentCard.combo[index].coupon_list.length) {
        specialNoteArr.push('优惠券');
      }
      if (currentCard.combo[index].balance && currentCard.combo[index].balance != 0) {
        specialNoteArr.push('储值');
      }
      if (currentCard.combo[index].integral && currentCard.combo[index].integral != 0) {
        specialNoteArr.push('积分');
      }
      specialNote = specialNoteArr.join('、') + (unit_type == 2 ? '在付费会员卡有效期限内每年赠送一次' : '在永久期限内只赠送一次');
    }
    this.setData({
      currentComboIndex: index,
      price: price || original_price,
      specialNote: specialNote,
      packageId: packageId
    })
  },
  gotoMemberDay: function () {
    app.turnToPage('/eCommerce/pages/memberDay/memberDay' + '?franchisee=' + this.data.franchiseeId);
  },
  getVipSenior() {
    let info = this.data.cardListData[this.data.currentIndex];
    if (!info) return;
    if (this.swiperTime) clearTimeout(this.swiperTime);
    this.swiperTime = setTimeout(() => {
      this.data.currentCard && app.sendRequest({
        url: '/index.php?r=AppShop/GetVIPCardInfo',
        method: 'post',
        hideLoading: true,
        data: {
          vip_id: this.data.currentCard.id,
          is_paid_vip: this.data.currentCard.price ? 1 : 0,
          sub_shop_app_id: this.data.franchiseeId,
          is_get_shopping_detail: 0,  //  是否查询升级条件
        },
        success: res => {
          let vip = res.data[0];
          if (vip.fix_time_benefit && vip.fix_time_benefit.length != 0) {
            if (vip.fix_time_benefit.balance_info) {
              let balance = vip.fix_time_benefit.balance_info;
              let sendBalance = balance.send_type == 1 ? `每天赠送${balance.obj_num}元` :
                                balance.send_type == 2 ? `每周赠送${balance.obj_num}元` :
                                balance.send_type == 4 ? `每月发放${balance.obj_num}元，每隔30天发放` : `每月发放${balance.obj_num}元,每月${balance.benefit_day}号发放`;
              vip.sendBalanceRule = sendBalance;
            }else {
              vip.sendBalanceRule = "";
            }
            if (vip.fix_time_benefit.integral_info) {
              let integral = vip.fix_time_benefit.integral_info;
              let sendIntegral = integral.send_type == 1 ? `每天赠送${parseInt(integral.obj_num)}分` :
                                 integral.send_type == 2 ? `每周赠送${parseInt(integral.obj_num)}分` :
                                 integral.send_type == 4 ? `每月发放${parseInt(integral.obj_num)}分，每隔30天发放` : `每月发放${parseInt(integral.obj_num)}分,每月${integral.benefit_day}号发放`;
              vip.sendIntegralRule = sendIntegral;
            }else {
              vip.sendIntegralRule = "";
            }
            if (vip.fix_time_benefit.coupon_info) {
              let couponInfo = vip.fix_time_benefit.coupon_info;
              let couponSendList = [];
              couponInfo.map(item => {
                            item.name = item.type === '0' ? '满减券' :
                            item.type === '1' ? '打折券' :
                            item.type === '2' ? '代金券' :
                            item.type === '3' ? '兑换券' :
                            item.type === '4' ? '储值券' :
                            item.type === '5' ? '通用券' :
                            item.type === '6' ? '次数券' : '';
                let sendCoupon = item.send_type == 1 ? `每天赠送${item.name}-${item.title}-${parseInt(item.obj_num)}张` :
                                 item.send_type == 2 ? `每周赠送${item.name}-${item.title}-${parseInt(item.obj_num)}张` :
                                 item.send_type == 4 ? `每月发放${item.name}-${item.title}-${parseInt(item.obj_num)}张，每隔30天发放` : `按月发放${item.name}-${item.title}-${parseInt(item.obj_num)}张,每月${item.benefit_day}号发放`;
                couponSendList.push(sendCoupon);
              })
              vip.sendCouponRule = couponSendList.join(',');
            }else {
              vip.sendCouponRule = ""
            }
            vip.showBenefit = true;
          }else {
            vip.showBenefit = false;
          }
          this.setData({
            'fix_time_benefit.sendBalanceRule': vip.sendBalanceRule || '',
            'fix_time_benefit.sendIntegralRule': vip.sendIntegralRule || '',
            'fix_time_benefit.sendCouponRule': vip.sendCouponRule || '',
            'fix_time_benefit.showBenefit': vip.showBenefit,
            'currentCard.free_postage_condition': vip.free_postage_condition || '0.00',
            'currentCard.is_free_postage': vip.is_free_postage,
            'currentCard.expired_time': vip.expired_time == -1 ? '永久有效' : (vip.expired_time || 0),
          })
        }
      })
    }, 500);
  },
  cancelDelete: function() {
    this.setData({
      showRenew: false
    })
  },
  sureDeleteGoods: function() {
    this.addPaidCardOrder();
    this.cancelDelete();
  },
  turnToUserInfo:function(){
    app.turnToPage('/userCenter/pages/userCenter/userCenter')
  }
})
