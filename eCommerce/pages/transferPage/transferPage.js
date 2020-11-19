var app = getApp()
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '当面付',
    },
    isShowNoJoinPrice: false,
    appTitle: '',
    franchisee: '',                                // 子店id
    balanceState: false,                           // 储值的状态
    storeState: true,                              // 店铺优惠的状态
    totalDiscountPrice: '',
    totalPayment: '',
    inputPrice: '',                                // 输入的金额
    oldInputPrice: '',                             // 上一次输入的金额
    noJoinPrice: '',                               // 不参与优惠金额
    oldNoJoinPrice: '',                            // 上一次不参与优惠金额
    requesting: false,
    transferConfig: {},                            // 当面付配置信息
    userInfo: {},                                  // 会员信息
    vipCardInfo: {                                 // 会员卡信息
      isShow: false,
      logo: 'cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/transfer/default-vip-card-logo.png'
    },
    memberDiscount: [],                            // 会员优惠
    aloneBenefitState: 0,                          // 唯一的会员优惠的状态 0->不使用 | 1->使用
    selectedBenefit: {},                           // 选中的会员优惠
    storeBenefitInfo: { discount_price: '0.00' },  // 店铺优惠
    useBalancePrice: '0.00',                       // 储值使用金额
    currentStoreBenefitInfo: {},                   // 当前店铺满减活动
    storeBenefitActivityList: [],                  // 店铺优惠列表
    isShowPriceLimitTip: false,                    // 是否显示价格限制提示
    combineBenefit: {},                            // 自定义优惠
    combineState: {                                // 自定义优惠的使用状态 0->不使用 | 1->使用
      vip: 0,
      coupon: 0,
      integral: 0
    },
    combineEnable: {                               // 自定义优惠的可用状态 0->不可用 | 1->可用
      vip: 0,
      coupon: 0,
      integral: 0
    },
    balancePayLoading: false,                      // 储值充值loading
    remark: '',                                    // 备注
    inputState: 0,                                 // 输入的状态 0->用户手动输入 1->扫码输入（关联金额） 2->扫码输入（关联订单，用户不可选择优惠）3->扫码输入（关联订单，用户可选择优惠）
    relatedOrderInfo: '',                          // 关联订单的数据 id、优惠信息
    benefitType: {
      vip: '会员卡',
      paid_vip: '会员卡',
      vip_benefit_day: '会员卡',
      coupon: '优惠券',
      integral: '积分',
    },
    relatedData: {},                               // 关联订单的相关数据
    payGiftOptions: {},
    settlementActivityFreePrice: 0,                // 支付结算活动免单金额
    balanceData: {},                               // 储值通相关数据
    payGiftStatus: false,                          // 支付有礼开启情况
    payGiftType: '',                               // 支付有礼类型
    payGiftPrice: '',                              // 支付有礼价格
    hiddenInvoice: false,                          // 隐藏申请发票
    furtherInfo: [],                               // 其他信息
    otherBenefit: [],                              // 其他优惠 如堂食的折扣、直接改金额、会员价
  },
  calculateReqNum: 0,                              // 计算金额请求的次数
  onLoad: function (options) {
    let franchisee = options.franchisee || '';
    let scene = options.scene;
    let appTitle = franchisee ? '' : app.getAppTitle();
    this.setData({
      appTitle: appTitle,
      franchisee: franchisee || '',
      userInfo: app.getUserInfo(),
      franchiseeIdInfo: {
        id: franchisee
      }
    });
    if (franchisee) {
      this.getAppShopByPage();
      this.checkIsOpenStored();
    }
    this.getBalanceData();
    this.getTransferOrderConfig(() => {
      if (scene) {
        this.getSceneData(scene);
      }
    });
    this.getCurrentStoreBenefitInfo();
    this.getStoreBenefitActivityList();
    this.getAppInvoiceStatus();
  },
  resetData: function (isInit) {
    this.setData({
      userInfo: app.getUserInfo(),
      selectedBenefit: {},
      storeBenefitInfo: { discount_price: '0.00' },
      totalPayment: '',
      balanceState: false,
      aloneBenefitState: 0,
      remark: '',
      useBalancePrice: '0.00',
      combineState: {
        vip: 0,
        coupon: 0,
        integral: 0
      },
      storeState: true,
      combineBenefit: {},
      inputState: 0,
      relatedOrderInfo: '',
      relatedData: {},
      oldInputPrice: '',
      oldNoJoinPrice: '',
      settlementActivityFreePrice: 0,
      requesting: false,
      furtherInfo: [],
      otherBenefit: []
    });
    if (isInit) {
      this.setData({
        inputPrice: '',
        noJoinPrice: '',
      })
    }
  },
  getTransferOrderConfig: function (callback) {
    app.sendRequest({
      url: '/index.php?r=AppTransferOrder/GetTransferOrderConfig',
      method: 'post',
      data: {
        sub_shop_app_id: this.data.franchisee
      },
      hideLoading: true,
      success: ({ data, status }) => {
        if (status === 0) {
          let { get_vipcard_directly, vipcard_id, background_color, scan_mode, input_mode, further_info_config } = data;
          data.background_color = background_color || '#FF7100';
          further_info_config = further_info_config || [];
          if (scan_mode === '1' && input_mode === '0') {
            this.scanPaymentCode();
          }
          if (get_vipcard_directly == 1 && vipcard_id && vipcard_id != 0) {
            this.vipCardInit(vipcard_id);
          }
          data.further_info_config = further_info_config.map((item) => {
            item.value = '';
            return item;
          })
          if (callback) { callback(); }
          this.setData({
            transferConfig: data
          })
          this.resetCombineEnable();
        }
      }
    })
  },
  resetCombineEnable: function () {
    const { combine_benefit_enable, vip_card_benefit_enable, coupon_benefit_enable, integral_benefit_enable } = this.data.transferConfig;
    this.setData({
      combineEnable: {
        vip: combine_benefit_enable == 1 && vip_card_benefit_enable == 1 ? 1 : 0,
        coupon: combine_benefit_enable == 1 && coupon_benefit_enable == 1 ? 1 : 0,
        integral: combine_benefit_enable == 1 && integral_benefit_enable == 1 ? 1 : 0
      }
    })
  },
  vipCardInit: function (id) {
    this.getEnableVipCardList(id, () => {
      app.sendRequest({
        url: '/index.php?r=AppShop/GetVIPCardInfo',
        data: {
          vip_id: id,
          sub_shop_app_id: this.data.franchisee
        },
        hideLoading: true,
        success: (res) => {
          const { status, data } = res;
          if (status === 0) {
            this.getUserVipLevel(data[0]);
          }
        }
      })
    })
  },
  getUserVipLevel: function (cardInfo) {
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPInfo',
      data: {
        sub_shop_app_id: this.data.franchisee
      },
      hideLoading: true,
      success: (res) => {
        const { data, status } = res;
        if (status === 0) {
          const level = data.level || 0;
          const id = data.vip_id || 0;
          if (level <= +cardInfo.level && id !== cardInfo.id) {
            cardInfo.isShow = true;
            cardInfo.logo = cardInfo.logo || this.data.vipCardInfo.logo;
            this.setData({
              vipCardInfo: cardInfo
            })
          }
        }
      }
    })
  },
  getEnableVipCardList: function (id, callback) {
    app.sendRequest({
      url: '/index.php?r=AppVipCard/GetEnableVipCardList',
      data: {
        sub_shop_app_id: this.data.franchisee
      },
      hideLoading: true,
      success: ({ data }) => {
        data = data || [];
        data.forEach((val) => {
          if (val.id === id) {
            callback();
          }
        })
      }
    })
  },
  getCurrentStoreBenefitInfo: function () {
    app.sendRequest({
      url: '/index.php?r=AppStoreBenefit/GetCurrentStoreBenefitInfo',
      method: 'post',
      data: {
        sub_shop_app_id: this.data.franchisee
      },
      hideLoading: true,
      success: (res) => {
        let { data, status } = res;
        if (status === 0) {
          if (data) {
            data.rule_titles = data.rule_titles.map((rule) => {
              rule = rule.replace('分阶段满减<br>', '');
              rule = rule.replace('阶段满减<br>', '');
              return rule;
            })
          }
          this.setData({
            currentStoreBenefitInfo: data || {}
          })
        }
      }
    })
  },
  goToCouponDesc: function () {
    let pagePath = '/eCommerce/pages/couponDescription/couponDescription?franchisee=' + this.data.franchisee;
    app.turnToPage(pagePath, false);
  },
  handleVipCard: function () {
    this.getCollectUserinfoConfig(() => {
      app.turnToPage('/userCenter/pages/userCenter/userCenter?r=' + '/eCommerce/pages/transferPage/transferPage'
        + '&id=' + this.data.transferConfig.vipcard_id
        + '&is_no_condition_recv=' + 1
        + '&franchisee=' + this.data.franchisee);
    })
  },
  recvVipCard: function () {
    app.sendRequest({
      data: {
        vipcard_id: this.data.transferConfig.vipcard_id,
        sub_shop_app_id: this.data.franchisee
      },
      url: '/index.php?r=AppVipCard/RecvVipCard',
      hideLoading: true,
      success: (res) => {
        app.showToast({
          title: '开卡成功',
          icon: 'success'
        });
        this.getCalculationInfo();
        this.setData({
          'vipCardInfo.isShow': false
        })
      }
    })
  },
  getCollectUserinfoConfig: function (callback) {
    app.sendRequest({
      data: {},
      url: '/index.php?r=AppVipCard/GetCollectUserinfoConfig',
      hideLoading: true,
      success: (res) => {
        if (res.data.need_collect_info) {
          callback();
        } else {
          this.recvVipCard();
        }
      }
    })
  },
  showMemberDiscount: function (e) {
    let memberDiscount = [];
    let selectedBenefit = {};
    let combineBenefit = this.data.combineBenefit;
    let type = e.currentTarget.dataset.type
    if (type === 'vip') {
      memberDiscount.push({
        label: 'vip',
        value: combineBenefit.all_vip_benefit
      })
      selectedBenefit = {
        type: 'combine',
        discount_type: combineBenefit.selected_user_vip.type || 'vip',
        vip_id: combineBenefit.selected_user_vip.id || 0,
        no_use_benefit: combineBenefit.vip_benefit_discount_price === '0.00' ? 1 : 0
      };
    } else if (type === 'coupon') {
      if (!combineBenefit.coupon_benefit) { combineBenefit.coupon_benefit = [] };
      memberDiscount.push({
        label: 'coupon',
        value: combineBenefit.coupon_benefit.concat(combineBenefit.cant_use_coupon_benefit || [])
      })
      selectedBenefit = {
        type: 'combine',
        discount_type: 'coupon',
        coupon_id: combineBenefit.selected_user_coupon_id,
        no_use_benefit: combineBenefit.coupon_benefit_discount_price === '0.00' ? 1 : 0
      }
    } else if (type === 'integral') {
      memberDiscount.push({
        label: 'integral',
        value: combineBenefit.integral_benefit instanceof Array ? combineBenefit.integral_benefit : [combineBenefit.integral_benefit]
      })
      selectedBenefit = {
        type: 'combine',
        discount_type: 'integral',
        no_use_benefit: combineBenefit.integral_benefit.discount_price === '0.00' ? 1 : 0
      }
    } else {
      memberDiscount = this.data.memberDiscount;
      selectedBenefit = this.data.selectedBenefit;
    }
    this.setData({
      memberDiscount: memberDiscount,
      selectedBenefit: selectedBenefit
    })
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectedBenefit, this.data.franchisee);
  },
  inputPrice: function (e) {
    let re = /^\d{1,5}(\.\d{0,2})?$/,
      isShowPriceLimitTip = false,
      price = e.detail.value.split('¥').length === 2 ? e.detail.value.split('¥')[1] : e.detail.value;
    price = price.replace(/\s+/g, "");
    if (!re.test(price) && price !== '') {
      wx.showToast({
        title: '价格区间仅支持0.01~99999.99元',
        icon: 'none',
        duration: 1000
      })
      price = this.data.oldInputPrice;
      isShowPriceLimitTip = true;
    }
    this.setData({
      inputState: 0,
      storeState: true,
      selectedBenefit: {},
      combineBenefit: {},
      oldInputPrice: price,
      inputPrice: price,
      isShowPriceLimitTip: isShowPriceLimitTip,
      noJoinPrice: +price < +this.data.noJoinPrice ? '' : this.data.noJoinPrice,
      oldNoJoinPrice: +price < +this.data.oldNoJoinPrice ? '' : this.data.oldNoJoinPrice,
    })
    if (price == 0) {
      let timer = setInterval(() => {
        if (!this.data.requesting && this.data.inputPrice == 0) {
          this.resetData();
          clearInterval(timer);
        } else if (!this.data.requesting && this.data.inputPrice != 0) {
          clearInterval(timer);
        }
      }, 10);
      return;
    }
    if (this.data.transferConfig.combine_benefit_enable == 1) {
      this.resetCombineEnable();
      this.calulateTransferOrderPrice();
    } else {
      this.calculateTotalPrice({});
    }
  },
  noJoinPriceInput: function (e) {
    let re = /^\d{1,5}(\.\d{0,2})?$/,
      price = e.detail.value.split('¥').length === 2 ? e.detail.value.split('¥')[1] : e.detail.value;
    price = price.replace(/\s+/g, "");
    if (!re.test(price)) {
      price = '';
    }
    if (!+this.data.inputPrice) {
      price = this.data.oldNoJoinPrice;
      wx.showToast({
        title: '请先输入消费金额',
        icon: 'none',
        duration: 1000
      })
    } else if (+price >= +this.data.inputPrice) {
      price = this.data.oldNoJoinPrice;
      wx.showToast({
        title: '需小于消费金额',
        icon: 'none',
        duration: 1000
      })
    }
    this.setData({
      storeState: true,
      selectedBenefit: {},
      combineBenefit: {},
      noJoinPrice: price,
      oldNoJoinPrice: price
    })
    this.data.transferConfig.combine_benefit_enable == 1 ? this.calulateTransferOrderPrice() : this.calculateTotalPrice({});
  },
  priceBlur: function (e) {
    let price = e.detail.value.split('¥').length === 2 ? e.detail.value.split('¥')[1] : e.detail.value;
    let type = e.currentTarget.dataset.type;
    let dataSet = {}
    if (typeof (+(price)) === 'number') {
      price = (+price).toFixed(2);
    }
    if (type === 'price') {
      dataSet = { inputPrice: price }
    } else if (type === 'no-join-price') {
      dataSet = { noJoinPrice: price }
    }
    this.setData(dataSet)
  },
  confirmPay: function () {
    let inputPrice = this.data.inputPrice,
      totalPayment = this.data.totalPayment,
      selected_store_benefit = {},
      selected_combination_benefit = {},
      benefits = this.data.selectedBenefit,
      relatedOrderInfo = this.data.relatedOrderInfo;
    let { combine_benefit_enable, further_info_config } = this.data.transferConfig;
    if (this.data.requesting) {
      return;
    }
    this.setData({ requesting: true });
    if (this._validate()) {              // 验证
      app.showModal({ content: this._validate() });
      this.setData({ requesting: false });
      return;
    }
    if (this.data.storeState && this.data.storeBenefitInfo.discount_price) {
      selected_store_benefit = this.data.storeBenefitInfo;
    }
    if (this.data.inputState !== 2 && this.data.inputState !== 3) {
      selected_combination_benefit = this.filterCombinationBenefit();
    }
    let params = {
      price: inputPrice,
      least_cost: this.data.noJoinPrice,
      check_price: totalPayment,
      message: this.data.remark,
      goods_type: 5,
      sub_shop_app_id: this.data.franchisee,
      settlement_activity_info: this.data.payGiftOptions,
      invoice_info: this.data.hiddenInvoice ? '' : (this.data.invoiceInfo || '') //发票
    }
    if (this.data.inputState === 2) {
      Object.assign(params, {
        selected_benefit: relatedOrderInfo.selected_benefit_info,
        is_balance: +relatedOrderInfo.use_balance ? 1 : 0
      })
    } else {
      Object.assign(params, {
        selected_benefit: combine_benefit_enable == 1 ? '' : benefits,
        selected_store_benefit: combine_benefit_enable == 1 ? '' : selected_store_benefit,
        is_balance: this.data.balanceState ? 1 : 0,
        selected_combination_benefit: combine_benefit_enable == 1 ? selected_combination_benefit : '',
      })
    }
    if (this.data.relatedData.order_id) {
      params.scan_code_order_id = this.data.relatedData.order_id
    }
    if (further_info_config.length) {
      params.further_info = further_info_config.reduce((result, item) => {
        if (item.value) {
          result.push({
            category_id: item.id,
            category_name: item.category_name,
            further_info: item.value
          })
        }
        return result;
      }, []);
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/createTransferOrder',
      method: 'post',
      data: params,
      success: (res) => {
        this.payOrder(res.data);
      },
      fail: () => {
        this.setData({ requesting: false });
      }
    })
  },
  _validate: function () {
    const inputPrice = this.data.inputPrice,
      totalPayment = this.data.totalPayment;
    const { further_info_config } = this.data.transferConfig;
    if (isNaN(inputPrice) || (+inputPrice).toFixed(2) <= 0) {
      return '请输入正确的金额';
    }
    if (isNaN(totalPayment) || totalPayment < 0) {
      return 'error payment amount';
    }
    if (further_info_config.length && this.data.inputState === 0) {
      for (let item of further_info_config) {
        if (+item.is_must === 1 && !item.value) {
          return `请${+item.type === 1 ? '输入' : '选择'}${item.category_name}`;
        }
      }
    }
    return '';
  },
  filterCombinationBenefit: function () {
    let benefit = this.data.combineBenefit,
      combineEnable = this.data.combineEnable;
    benefit.use_balance = (+this.data.useBalancePrice);
    benefit.total_price = (+this.data.totalPayment);
    benefit.total_discount_price = (+this.data.totalDiscountPrice);
    if (combineEnable.vip === 0) {
      delete benefit.vip_benefit;
    }
    if (combineEnable.coupon === 0) {
      delete benefit.coupon_benefit;
      delete benefit.selected_user_coupon_id;
    } else if (combineEnable.coupon === 1) {
      let selectedCouponBenefit = {};
      benefit.coupon_benefit.map((val) => {
        if (val.user_coupon_id == benefit.selected_user_coupon_id) {
          selectedCouponBenefit = val;
        }
      })
      if (selectedCouponBenefit.user_coupon_id) {
        benefit.coupon_benefit = selectedCouponBenefit;
      }
    }
    if (combineEnable.integral === 0) {
      delete benefit.integral_benefit;
    }
    if (!this.data.storeState) {
      delete benefit.store_benefit;
    }
    return benefit;
  },
  payOrder: function (orderId) {
    let _this = this;
    function paySuccess() {
      _this.checkAppCollectmeStatus(orderId).then((valid) => {
        let pagePath = '/eCommerce/pages/transferPaySuccess/transferPaySuccess?detail=' + orderId + '&franchisee=' + _this.data.franchisee;
        if(valid == 0) {
          pagePath += '&collectBenefit=1';
        }
        _this.setData({ requesting: false })
        app.turnToPage(pagePath, 1);
      })
    }
    function payFail() {
      _this.setData({ requesting: false })
      app.turnToPage('/eCommerce/pages/transferOrderDetail/transferOrderDetail?detail=' + orderId, 1);
    }
    if (this.data.totalPayment == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: (res) => {
          paySuccess();
        },
        fail: () => {
          payFail();
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: (res) => {
        var param = res.data;
        param.orderId = orderId;
        param.goodsType = 5;
        param.success = paySuccess;
        param.fail = payFail;
        app.wxPay(param);
      },
      fail: function () {
        this.setData({ requesting: false })
      }
    })
  },
  checkAppCollectmeStatus: function (orderId){
    return new Promise((resolve) => {
      app.sendRequest({
        url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
        data: {
          order_id: orderId,
          sub_app_id: this.data.franchisee
        },
        success: function(res) {
          resolve(res.valid);
        }
      });
    });
  },
  getCalculationInfo: function () {
    this.data.transferConfig.combine_benefit_enable == 1 ? this.calulateTransferOrderPrice() : this.calculateTotalPrice();
  },
  calculateTotalPrice: function (selectedBenefit = this.data.selectedBenefit) {  // 计算唯一优惠
    if (+this.data.inputPrice === 0) {
      return;
    }
    this.calculateReqNum++;
    let price = +this.data.inputPrice,
      calculateReqNum = this.calculateReqNum,
      vipCutPrice = this.data.relatedData.vip_cut_price;
    this.setData({
      requesting: true
    });
    if (vipCutPrice && +vipCutPrice > 0) {
      price -= +vipCutPrice;
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/calculationPrice',
      method: 'post',
      data: {
        price: price,
        selected_benefit: selectedBenefit,
        is_balance: this.data.balanceState ? 1 : 0,
        not_use_store_benefit: this.data.storeState ? 0 : 1,
        sub_shop_app_id: this.data.franchisee,
        least_cost: +this.data.noJoinPrice,
        settlement_activity_info: this.data.payGiftOptions
      },
      success: (res) => {
        let data = res.data,
          benefits = data.can_use_benefit,
          aloneBenefitState = 0,
          selectedBenefit = {},
          transferConfig = this.data.transferConfig,
          memberDiscount = [],
          { coupon_benefit, cant_use_coupon_benefit, all_vip_benefit, integral_benefit } = benefits;
        if (this.calculateReqNum !== calculateReqNum) {
          return;
        }
        this.calculateReqNum = 0;
        if (+price === 0) {
          this.setData({
            selectedBenefit: {},
            useBalancePrice: '0.00',
            totalPayment: '',
            balanceState: false,
            aloneBenefitState: 0,
            'storeBenefitInfo.discount_price': '0.00'
          })
          return;
        }
        if (transferConfig.coupon_benefit_enable == 1) {
          if (cant_use_coupon_benefit && cant_use_coupon_benefit.length) {
            benefits.cant_use_coupon_benefit = cant_use_coupon_benefit.map((val) => {
              val.disabled = true;
              return val;
            })
          }
          memberDiscount.push({
            label: 'coupon',
            value: coupon_benefit.concat(benefits.cant_use_coupon_benefit || [])
          })
        }
        if (transferConfig.vip_card_benefit_enable == 1) {
          memberDiscount.push({
            label: 'vip',
            value: all_vip_benefit
          })
        }
        if (transferConfig.integral_benefit_enable == 1) {
          memberDiscount.push({
            label: 'integral',
            value: integral_benefit instanceof Array ? integral_benefit : [integral_benefit]
          })
        }
        if (benefits.data.length) {
          memberDiscount.map((val) => {
            if (val.value.length > 0) {
              aloneBenefitState = 1;
            }
          })
        }
        if (aloneBenefitState) {
          selectedBenefit = data.selected_benefit_info || {};
          selectedBenefit.discount_cut_price = (+data.selected_benefit_info.discount_cut_price || 0).toFixed(2);
        }
        if (!data.store_benefit_info) {
          data.store_benefit_info = { discount_price: '0.00' };
        }
        data.store_benefit_info.discount_price = (+data.store_benefit_info.discount_price).toFixed(2);
        data.store_benefit_info.discount_price = (+data.store_benefit_info.discount_price).toFixed(2);
        if (+data.settlement_activity_item_price) {
          data.price = ((+data.price) + (+data.settlement_activity_item_price)).toFixed(2);
        }
        if (data.price == this.data.payGiftPrice) {
          this.setData({
            hiddenInvoice: true
          });
        } else {
          this.setData({
            hiddenInvoice: false
          });
        }
        this.setData({
          totalPayment: data.price,
          memberDiscount,
          selectedBenefit,
          aloneBenefitState,
          storeBenefitInfo: data.store_benefit_info,
          useBalancePrice: (+data.use_balance).toFixed(2),
          settlementActivityFreePrice: data.settlement_activity_free_bills_item_price,
          requesting: false
        });
      },
      fail: () => {
        if (this.calculateReqNum !== calculateReqNum) {
          return;
        }
        this.calculateReqNum = 0;
        this.setData({ requesting: false })
      }
    })
  },
  calulateTransferOrderPrice: function () {                                      // 计算多种优惠叠加
    if (+this.data.inputPrice === 0) {
      return;
    }
    this.calculateReqNum++;
    let price = +this.data.inputPrice,
      combineEnable = this.data.combineEnable,
      calculateReqNum = this.calculateReqNum;
    this.setData({
      requesting: true
    });
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppTransferOrder/CalulateTransferOrderPrice',
      method: 'post',
      data: {
        price: price,
        no_use_vip_benefit: combineEnable.vip ? 0 : 1,
        no_use_coupon_benefit: combineEnable.coupon ? 0 : 1,
        no_use_integral_benefit: combineEnable.integral ? 0 : 1,
        selected_user_coupon_id: this.data.combineBenefit.selected_user_coupon_id || 0,
        selected_user_vip: this.data.combineBenefit.selected_user_vip || {},
        no_use_balance: this.data.balanceState ? 0 : 1,
        no_use_store_benefit: this.data.storeState ? 0 : 1,
        sub_shop_app_id: this.data.franchisee,
        least_cost: +this.data.noJoinPrice,
        settlement_activity_info: this.data.payGiftOptions
      },
      success: (res) => {
        let data = res.data,
          combine_benefit = data.combine_benefit,
          combineState = {
            vip: 0,
            coupon: 0,
            integral: 0
          },
          { all_vip_benefit, vip_benefit, coupon_benefit, integral_benefit, cant_use_coupon_benefit } = combine_benefit;
        if (this.calculateReqNum !== calculateReqNum) {
          return;
        }
        this.calculateReqNum = 0;
        if (all_vip_benefit.length && vip_benefit.discount_price) {
          combineState.vip = 1;
          combine_benefit.vip_benefit_discount_price = '0.00';
          all_vip_benefit.forEach((val) => {
            if (val.vip_id == combine_benefit.selected_user_vip.id && val.discount_type == combine_benefit.selected_user_vip.type) {
              combine_benefit.vip_benefit_discount_price = combineEnable.vip ? (+val.discount_price).toFixed(2) : '0.00';
            }
          })
        }
        if (coupon_benefit.length) {
          combineState.coupon = 1;
          combine_benefit.coupon_benefit_discount_price = '0.00';
          coupon_benefit.forEach((val) => {
            if (val.user_coupon_id == combine_benefit.selected_user_coupon_id) {
              combine_benefit.coupon_benefit_discount_price = combineEnable.coupon ? (+val.discount_price).toFixed(2) : '0.00';
            }
          })
        } else {
          combine_benefit.coupon_benefit_discount_price = '0.00'
        }
        if (cant_use_coupon_benefit.length) {
          combine_benefit.cant_use_coupon_benefit = cant_use_coupon_benefit.map((val) => {
            val.disabled = true;
            return val;
          })
        }
        if (integral_benefit.max_can_use_integral) {
          combineState.integral = 1;
          combine_benefit.integral_benefit.discount_price = combineEnable.integral ? (+integral_benefit.discount_price).toFixed(2) : '0.00';
        }
        if (!combine_benefit.store_benefit) {
          combine_benefit.store_benefit = { discount_price: '0.00' };
        }
        combine_benefit.store_benefit.discount_price = (+combine_benefit.store_benefit.discount_price).toFixed(2);
        if (+data.settlement_activity_item_price) {
          data.total_price = ((+data.total_price) + (+data.settlement_activity_item_price)).toFixed(2);
        }
        this.setData({
          totalPayment: data.total_price,
          totalDiscountPrice: data.total_discount_price,
          combineBenefit: combine_benefit,
          storeBenefitInfo: combine_benefit.store_benefit,
          useBalancePrice: (+data.use_balance).toFixed(2),
          combineState,
          settlementActivityFreePrice: data.settlement_activity_free_bills_item_price,
          requesting: false
        })
      },
      fail: () => {
        if (this.calculateReqNum !== calculateReqNum) {
          return;
        }
        this.calculateReqNum = 0;
        this.setData({ requesting: false });
      }
    })
  },
  inputRemark: function (e) {
    this.data.remark = e.detail.value;
  },
  updateBalanceState: function (e) {
    this.setData({
      balanceState: e.detail.value
    })
    this.getCalculationInfo();
  },
  updateStoreState: function (e) {
    this.setData({
      storeState: e.detail.value,
      selectedBenefit: {}
    })
    this.getCalculationInfo();
  },
  getAppShopByPage: function () {
    let franchiseeId = this.data.franchisee;
    let param = {};
    param.sub_shop_app_id = franchiseeId;
    if (app.globalData.hasFranchiseeTrade) {
      param.is_biz_shop = 1;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: param,
      hideLoading: true,
      success: (res) => {
        let newdata = {},
          data = res.data[0];
        newdata['franchiseeInfo'] = data;
        newdata['appTitle'] = data.name;
        this.setData(newdata);
      }
    })
  },
  afterSelectedBenefit: function (e) {
    let selectedDiscount = e.detail.selectedDiscount,
      combineEnable = this.data.combineEnable,
      combineBenefit = this.data.combineBenefit;
    if (selectedDiscount.type === 'combine') {                  // 自定义优惠
      if (selectedDiscount.discount_type === 'coupon') {
        if (selectedDiscount.no_use_benefit) {
          combineBenefit.selected_user_coupon_id = 0;
          combineEnable.coupon = 0;
        } else {
          combineBenefit.selected_user_coupon_id = selectedDiscount.coupon_id;
          combineEnable.coupon = 1;
        }
      } else if (selectedDiscount.discount_type === 'vip' || selectedDiscount.discount_type === 'paid_vip' || selectedDiscount.discount_type === 'vip_benefit_day') {
        if (selectedDiscount.no_use_benefit) {
          combineBenefit.selected_user_vip = {};
          combineEnable.vip = 0;
        } else {
          combineBenefit.selected_user_vip = {
            id: selectedDiscount.vip_id,
            type: selectedDiscount.discount_type
          }
          combineEnable.vip = 1;
        }
      } else if (selectedDiscount.discount_type === 'integral') {
        combineEnable.integral = (selectedDiscount.no_use_benefit ? 0 : 1);
      }
      this.setData({
        combineEnable: combineEnable,
        combineBenefit: combineBenefit
      })
    } else {                                                  // 唯一会员优惠
      this.setData({
        selectedBenefit: selectedDiscount,
      });
    }
    this.getCalculationInfo();
  },
  getStoreBenefitActivityList: function () {
    app.sendRequest({
      url: '/index.php?r=AppStoreBenefit/GetStoreBenefitActivityList',
      method: 'post',
      data: {
        sub_shop_app_id: this.data.franchisee
      },
      hideLoading: true,
      success: (res) => {
        let data = [];
        res.data.map((val) => {
          val.activity_start_date = val.activity_start_date.substr(0, 16);
          val.activity_end_date = val.activity_end_date.substr(0, 16);
          if (val.expired !== 1) {
            data.push(val);
          }
        })
        this.setData({
          storeBenefitActivityList: data
        })
      }
    })
  },
  getBalanceData: function () {
    app.sendRequest({
      url: '/index.php?r=AppShop/getAppUserBalance',
      hideLoading: true,
      success: (res) => {
        this.setData({
          'userInfo.balance': (+res.data.balance).toFixed(2)
        });
      }
    });
  },
  scanPaymentCode: function () {
    wx.scanCode({
      onlyFromCamera: false,
      success: (res) => {
        const { path } = res;
        const sceneValue = this.getQueryString(path, 'scene');
        this.getSceneData(sceneValue);
      }
    });
  },
  getSceneData: function (scene) {
    const options = { scene, sub_shop_app_id: this.data.franchisee };
    app.sendRequest({
      url: '/index.php?r=AppTransferOrder/GetSceneData',
      data: options,
      hideLoading: true,
      success: (res) => {
        const { status, data } = res;
        if (status === 0 && data.order_id) {
          let { total_price, not_discount_price, further_info, use_balance,
            coupon_fee, pick_up_type, offline_payment_id, original_price,
            server_fee, tissue_fee, box_fee, admin_selected_benefit, vip_cut_price,
            remark, parent_shop_app_id, app_id } = data;
          let inputState = 1;
          let needPayPrice = 0;        // 应付金额
          let otherBenefit = [];       // 其他优惠
          let noJoinPrice = 0;
          total_price = +(total_price || 0);
          use_balance = +(use_balance || 0);
          coupon_fee = +(coupon_fee || 0);
          original_price = +(original_price || 0);
          server_fee = +(server_fee || 0);
          tissue_fee = +(tissue_fee || 0);
          box_fee = +(box_fee || 0);
          vip_cut_price = +(vip_cut_price || 0);
          not_discount_price = +(not_discount_price || 0);
          data.selected_benefit_info = data.selected_benefit_info || {};
          data.selected_benefit_info.discount_price = (+data.selected_benefit_info.discount_price || 0).toFixed(2);
          data.use_balance = use_balance.toFixed(2);
          data.coupon_fee = coupon_fee.toFixed(2);
          needPayPrice = original_price + server_fee + tissue_fee + box_fee;
          if (further_info && further_info.length) {  // 其他信息
            further_info.forEach((item) => {
              const index = this.data.transferConfig.further_info_config.findIndex((furtherItem) => item.category_id == furtherItem.id);
              if (index !== -1) {
                this.setData({
                  [`transferConfig.further_info_config[${index}].value`]: item.further_info
                })
              }
            })
          }
          if (+pick_up_type === 3) {                   // 关联自提订单
            inputState = 2;
          } else if (+pick_up_type === 4 && offline_payment_id) {  // 关联堂食订单并已结算优惠
            inputState = 2;
            if (admin_selected_benefit) {
              if (+admin_selected_benefit.discount_type === 3) {   // 堂食直接折扣
                otherBenefit.push({
                  label: '折扣优惠',
                  discount: (+admin_selected_benefit.discount_cut_price).toFixed(2)
                })
              }
            }
          } else if (+pick_up_type === 4) {          // 关联堂食订单未结算优惠
            inputState = 3;
          }
          if (vip_cut_price !== 0) {
            needPayPrice = needPayPrice + vip_cut_price;
            otherBenefit.push({
              label: '会员价优惠',
              discount: vip_cut_price.toFixed(2)
            })
          }
          if(+pick_up_type === 4){
            noJoinPrice = (server_fee + tissue_fee + box_fee).toFixed(2);
          }else {
            noJoinPrice = not_discount_price.toFixed(2);
          }
          if (admin_selected_benefit && +admin_selected_benefit.discount_type === 2) {   // 堂食收银台直接修改金额
            needPayPrice = total_price;
            noJoinPrice = 0;
            otherBenefit = [];
          }
          this.setData({
            relatedData: data,
            inputPrice: (+needPayPrice).toFixed(2),
            noJoinPrice,
            relatedOrderInfo: data,
            otherBenefit,
            inputState,
            remark,
            franchisee: parent_shop_app_id ? app_id : '', // 有parent_shop_app_id表示是子店的收款码，需要把收款码的app_id存到franchisee
          })
          if (parent_shop_app_id) {
            this.getAppShopByPage();
            this.checkIsOpenStored();
          }
          if (inputState === 1) {
            this.getCalculationInfo();
          } else if (inputState === 3) {
            let transferConfig = this.data.transferConfig;
            Object.assign(transferConfig, {
              combine_benefit_enable: 0,
              store_benefit_enable: 0
            })
            this.setData({
              combineState: {
                vip: 0,
                coupon: 0,
                integral: 0
              },
              transferConfig,
              storeState: false
            })
            this.getCalculationInfo();
          } else {
            this.setData({
              totalPayment: total_price.toFixed(2)
            })
          }
        }
      }
    })
  },
  getQueryString: function (path, name) {
    if (!path) { return ''; }
    const paramsStr = path.split('?')[1] || '';
    const reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    const r = paramsStr.match(reg);
    if (r != null) return unescape(r[2]); return '';
  },
  selectedPayGift: function (e) {
    const { detail } = e;
    let pagGiftData = {};
    if (detail.options) {
      pagGiftData = {
        id: detail.options.id,
        item_id: detail.options.item_id
      }
    }
    this.setData({
      payGiftOptions: pagGiftData,
      payGiftPrice: detail.options.price
    })
    this.getCalculationInfo();
  },
  checkIsOpenStored: function () {
    let { franchisee } = this.data;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/CheckIsOpenAppShopStored',
      data: {
        sub_shop_app_id: franchisee
      },
      success: (res) => {
        if (res.data) {
          this.setData({
            balanceData: res.data
          });
        }
      }
    });
  },
  getAppInvoiceStatus: function () {
    let _this = this;
    let { franchisee } = this.data;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAppInvoiceStatus',
      data: {
        sub_shop_app_id: franchisee
      },
      success: function (res) {
        _this.setData({
          isOpenInvoice: res.data.is_invoice == 1 ? true : false
        })
      }
    })
  },
  goInvoicePage: function () {
    let { franchisee } = this.data;
    let pagePath = '/eCommerce/pages/invoice/invoice?franchiseeId=' + franchisee;
    app.turnToPage(pagePath);
  },
  getPaySettingInfo: function (e) {
    this.setData({
      payGiftStatus: e.detail.isOpen == 0 ? false : true,
      payGiftType: e.detail.type,
    })
  },
  changeFurtherInfo: function (e) {
    const infoIdx = e.currentTarget.dataset.index;
    const changeInfo = this.data.transferConfig.further_info_config[infoIdx];
    const value = changeInfo.type == 1 ? e.detail.value : changeInfo.further_info[e.detail.value];
    this.setData({
      [`transferConfig.further_info_config[${infoIdx}].value`]: value
    })
  }
})
