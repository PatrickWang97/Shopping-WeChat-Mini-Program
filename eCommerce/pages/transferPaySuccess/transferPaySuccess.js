import Scratch from "../../../utils/scratch.js"
let app = getApp()
Page({
  data: {
    totalPayment: '',
    orderInfo: {},
    combinationBenefit: {},
    hideScratchCanvas: true,
    isShowScratchBtn: '',
    scratchIsFail: true,                // 显示未中奖
    scratchIsPrize: true,               // 显示中奖
    scratchIsDurMax: false,
    scratchIsLimit: false,
    scratchIsComfort: true,             // 显示安慰奖
    scratchIsDegree: false,
    scratchInfo: {},                    // 获取活动信息
    scratchTimes: 0,                    // 剩余次数
    scratchId: '',                      // 活动号
    scratchIsScroll: true,              //刮刮乐当在 canvas 中移动时且有绑定手势事件时禁止屏幕滚动以及下拉刷新
    time_limit: '',
    scratchPrizeTitle: '',              // 中奖名称
    vipCardInfo: { isShow: false },     // 会员卡信息
    couponList: [                       // 优惠券列表
      {
        active_title: "领取后立即生效，",
        condition: "10.00",
        discount: "10.00",
        discount_type: "coupon",
        end_use_date: "9999-12-31",
        end_use_time: "23:59:00",
        expire_day_count: 0,
        name: "满10减9.9",
        start_use_date: "1000-01-01",
        start_use_time: "00:00:00",
        title: "满10减9.9（满10.00减9.90）",
        type: "0",
        value: "9.90",
      }
    ],
    benefitConfig: {},
    collectBenefitData: {},              // 集集乐数据
    starData: [],                        // 集集乐的星 light:已集样式 dark:未集样式
    payActivity: '',                     // 支付营销活动类型
    isShowVipCardDialog: false,          // 是否显示会员卡弹窗
    ifUserInfo: false,                   // 是否存在相应的用户信息
    userCityArr: ['', '', ''],           // 用户城市信息的集合   [country, pri, city]
    userInfo: {},                        // 会员信息
    isRecvVipCard: false,                // 是否已会员卡领取
    transferConfig: {},                  // 当面付配置
    appTitle: '',
    isGetPhoneNumber: false,             // 是否获得手机授权
    ifWxCoupon: false,
    timestamp: '',
    signature: '',
    ifGetComfort: false,
    orderId: '',
    userInfo: {}
  },
  onLoad: function (options) {
    console.log(options);
    let franchisee = options.franchisee || '';
    let appTitle = franchisee ? '' : app.getAppTitle();
    this.setData({
      appTitle: appTitle,
      franchisee: franchisee,
      orderId: options.detail || '',
      userInfo: app.getUserInfo()
    });
    if (franchisee) {
      this.getAppShopByPage();
    }
    if(options.collectBenefit == 1){
      this.getCollectBenefitData(options.detail);
    }
    this.getTransferOrderConfig();
    this.getOrderDetail();
    this.getPayWindow();
  },
  getTransferOrderConfig: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppTransferOrder/GetTransferOrderConfig',
      method: 'post',
      data: {
        sub_shop_app_id: _this.data.franchisee
      },
      success: function (res) {
        _this.setData({
          transferConfig: res.data
        })
      }
    })
  },
  setPaySuccessBenefitConfig: function (config) {
    let that = this;
    let payActivity = '';
    if ((Number(that.data.orderInfo.total_price) + Number(that.data.orderInfo.use_balance)) < config.condition_price) {
      return;
    }
    if (config.type === 'scratch_card') {
      that.activityInit();
    } else if (config.type === 'vipcard_permission') {
      that.judgmentVipCard(config.vipcard_id);
    } else if (config.type === 'coupon') {
      that.setCouponInfo(config.coupon_id);
      payActivity = config.type;
    } else if (config.type === 'collectme') {
      that.checkAppCollectmeStatus();
    } else if (config.type === 'balance') {
      if (config.balance_type == 1) {
        config.balance = (config.balance_value * this.data.totalPayment) % 1 === 0 ? config.balance_value * this.data.totalPayment : Math.floor(config.balance_value * this.data.totalPayment * 100) / 100;
      } else {
        config.balance = config.balance_value
      }
      payActivity = config.type;
    } else {
      payActivity = config.type;
    }
    that.setData({
      benefitConfig: config,
      payActivity: payActivity
    })
  },
  activityInit: function () {
    let that = this;
    if (app.isLogin()) {
      that.getScratchData();
    } else {
      app.goLogin({
        success: function () {
          that.getScratchData();
        }
      });
    }
  },
  getScratchData: function () {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getActivity",
      method: "post",
      data: { category: 3 },
      success: function (res) {
        let mes = res.data;
        that.scratchInit();
        that.setData({
          scratchInfo: mes,
          scratchId: mes.id,
          scratchTimes: mes.times,
          time_limit: mes.time_limit
        })
      }
    })
  },
  scratchInit: function () {
    let that = this;
    let systemInfo = app.globalData.systemInfo;
    let width = 722 * systemInfo.windowWidth / 750;
    let height = 290 * systemInfo.windowWidth / 750;
    that.scratch = new Scratch(that, {
      canvasWidth: width,
      canvasHeight: height,
      imageResource: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=https://chn.jisuapp.cn/static/webapp/images/scratchMovie.png',
      maskColor: "red",
      r: 18,
      callback: () => {
        that.setData({
          hideScratchCanvas: true
        });
        if (that.data.ifWxCoupon) {
          setTimeout(function () {
            that.toAddCard()
          }, 500)
        }
      },
      imgLoadCallback: () => {
        setTimeout(function () {
          that.setData({
            hideScratchCanvas: false,
            isShowScratchBtn: true,
            payActivity: that.data.benefitConfig.type
          });
        }, 10);
      }
    })
  },
  startScratch: function () {
    let that = this;
    if (!that.data.scratchId) {
      return;
    }
    if (that.data.time_limit == 0) {
      that.setData({
        scratchIsLimit: true,
        hideScratchCanvas: true,
        isShowScratchBtn: false
      })
    } else {
      console.log(that.data.scratchTimes);
      if (that.data.scratchTimes <= 0) {
        if (that.data.scratchInfo.time_share == 0) {
          that.setData({
            scratchIsDegree: true,
            hideScratchCanvas: true,
            isShowScratchBtn: false
          })
        } else {
          that.setData({
            scratchIsDurMax: true,
            hideScratchCanvas: true,
            isShowScratchBtn: false
          })
        }
      } else {
        if (that.scratchLoading) {
          return false;
        }
        that.setData({
          isShowScratchBtn: false
        })
        that.scratchLoading = true;
        that.getLottery();
      }
    }
  },
  getLottery: function () {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/lottery",
      method: "post",
      hideLoading: true,
      data: {
        activity_id: that.data.scratchId,
        app_id: app.globalData.appId
      },
      success: function (res) {
        let data = res.data,
          newData = {};
        that.scratch.start();
        if (data.title == "谢谢参与") {
          newData = {};
          newData['scratchIsFail'] = false;
          newData['scratchTimes'] = data.time;
          newData['time_limit'] = data.time_limit;
          that.setData(newData);
        } else {
          newData = {};
          if (data.is_comfort == 1) {
            newData['scratchIsComfort'] = false;
          } else {
            newData['scratchIsPrize'] = false;
            newData['scratchPrizeTitle'] = data.title;
          }
          let ifWxCoupon = data.card_id || false;
          newData['ifWxCoupon'] = ifWxCoupon;
          newData['timestamp'] = data.timestamp || '';
          newData['signature'] = data.signature || '';
          newData['scratchTimes'] = data.time;
          newData['time_limit'] = data.time_limit;
          that.setData(newData);
        }
        that.scratchLoading = false;
      },
      successStatusAbnormal: function (res) {
        that.scratchLoading = false;
        if (res.status == 1) {
          that.setData({
            isShowScratchBtn: true
          })
        }
      }
    })
  },
  failBtnClick: function () {
    let that = this;
    that.scratch.reset();
    that.setData({
      hideScratchCanvas: false,
      scratchIsFail: true
    });
    setTimeout(function () {
      that.setData({
        isShowScratchBtn: true
      });
    }, 100);
  },
  winningBtnClick: function () {
    let that = this;
    that.scratch.reset();
    that.setData({
      hideScratchCanvas: false,
      scratchIsPrize: true
    });
    setTimeout(function () {
      that.setData({
        isShowScratchBtn: true
      });
    }, 100);
  },
  comfortBtnClick: function () {
    let that = this;
    that.scratch.reset();
    that.setData({
      hideScratchCanvas: false,
      scratchIsComfort: true
    });
    setTimeout(function () {
      that.setData({
        isShowScratchBtn: true
      });
    }, 100);
  },
  getGoldenData: function (id) {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getTimeAfterConsume",
      method: "post",
      data: {
        order_id: that.data.orderId,
        sub_app_id: that.data.franchisee
      },
      success: function (data) {
        if (data.integral) {                  //支付获取积分
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
  getOrderDetail: function () {
    app.getOrderDetail({
      data: {
        order_id: this.data.orderId,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: (res) => {
        let orderInfo = res.data[0].form_data;
        let combinationBenefit = {};
        const { selected_combination_benefit, store_benefit_info, selected_benefit_info, use_balance, coupon_fee, settlement_activity } = orderInfo;
        if (selected_combination_benefit) {
          const { store_benefit, vip_benefit_discount_price, coupon_benefit_discount_price, integral_benefit } = selected_combination_benefit
          combinationBenefit = selected_combination_benefit;
          if (store_benefit && store_benefit.discount_price) {
            combinationBenefit.store_benefit.discount_price = (+store_benefit.discount_price).toFixed(2);
          }
          if (vip_benefit_discount_price) {
            combinationBenefit.vip_benefit_discount_price = (+vip_benefit_discount_price).toFixed(2);
          }
          if (coupon_benefit_discount_price) {
            combinationBenefit.coupon_benefit_discount_price = (+coupon_benefit_discount_price).toFixed(2);
          }
          if (integral_benefit && integral_benefit.discount_price) {
            combinationBenefit.integral_benefit.discount_price = (+integral_benefit.discount_price).toFixed(2);
          }
        }
        if (store_benefit_info && store_benefit_info.discount_price) {
          orderInfo.store_benefit_info.discount_price = (+store_benefit_info.discount_price).toFixed(2);
        }
        if (selected_benefit_info) {
          selected_benefit_info.discount_price = selected_benefit_info.discount_price || selected_benefit_info.discount_cut_price;
          if (selected_benefit_info.discount_price) {
            orderInfo.selected_benefit_info.discount_price = (+selected_benefit_info.discount_price).toFixed(2);
          }
        }
        if (use_balance) {
          orderInfo.use_balance = (+use_balance).toFixed(2);
        }
        if (coupon_fee) {
          orderInfo.coupon_fee = (+coupon_fee).toFixed(2);
        }
        if(settlement_activity && settlement_activity.item_price){
          const { marketing_type, item_price, id } = settlement_activity;
          settlement_activity.path = +marketing_type === 1 ? '/eCommerce/pages/balance/balance' : '/eCommerce/pages/vipBenefits/vipBenefits?is_paid_card=1&id=' + id;
          settlement_activity.item_price = (+item_price).toFixed(2);
        }
        delete orderInfo.can_use_benefit.coupon_benefit;
        this.setData({
          totalPayment: orderInfo.total_price,
          orderInfo: orderInfo,
          combinationBenefit: combinationBenefit,
          settlement_activity
        });
        this.getGoldenData();
        if (orderInfo.pay_success_benefit_info && orderInfo.pay_success_benefit_info[0] && orderInfo.pay_success_benefit_info[0].status === 0) {
          this.setPaySuccessBenefitConfig(orderInfo.pay_success_benefit_info[0].benefit_info);
        }
      }
    })
  },
  transferSuccessCallback: function () {
    let router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  goToOrderDetail: function () {
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/eCommerce/pages/transferOrderDetail/transferOrderDetail?detail=' + this.data.orderId + franchiseeParam, 1);
  },
  setCouponInfo: function (id) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponInfo',
      data: {
        'coupon_id': id
      },
      hideLoading: true,
      success: function (res) {
        let couponList = [];
        couponList.push(res.data);
        _this.setData({
          couponList: couponList
        })
      }
    });
  },
  recvCoupon: function (e) {
    let _this = this,
      couponId = e.currentTarget.dataset.couponid;
    app.sendRequest({
      url: '/index.php?r=AppShop/recvCoupon',
      data: {
        coupon_id: couponId,
      },
      hideLoading: true,
      success: function (res) {
        app.sendUseBehavior([{'goodsId': couponId}],18); // 行为记录
      }
    })
  },
  checkAppCollectmeStatus: function () {
    app.sendRequest({
      url: "/index.php?r=AppMarketing/CheckAppCollectmeStatus",
      data: {
        order_id: this.data.orderId
      },
      success: (res) => {
        if (res.valid === 1) {
          return;
        }
        that.getCollectBenefitData(this.data.orderId)
      }
    })
  },
  getCollectBenefitData: function (id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppMarketing/CollectmeSendCoupon',
      data: {
        'order_id': id,
      },
      hideLoading: true,
      success: function (res) {
        let starData = [];
        for (let i = 0; i < res.data.star_num; i++) {
          starData.push('light');
        }
        for (let i = 0; i < res.data.collect_num - res.data.star_num; i++) {
          starData.push('dark');
        }
        that.setData({
          'collectBenefitData': res.data,
          'starData': starData,
          payActivity: 'collectme'
        });
      }
    });
  },
  goToWheelDetail: function () {
    let franchiseeParam = this.data.franchisee ? ('?franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/awardManagement/pages/luckyWheelDetail/luckyWheelDetail' + franchiseeParam, 1);
  },
  goToGoldenEggs: function () {
    let franchiseeParam = this.data.franchisee ? ('?franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/awardManagement/pages/goldenEggs/goldenEggs' + franchiseeParam, 1);
  },
  touchStart: function (e) {
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true)
  },
  touchMove: function (e) {
    console.log(e);
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true)
  },
  touchEnd: function (e) {
    console.log(e);
    if (!this.isStart) return
    let { canvasWidth, canvasHeight, minX, minY, maxX, maxY } = this
    if (maxX - minX > .5 * canvasWidth && maxY - minY > .5 * canvasHeight) {
      this.ctx.draw()
      this.endCallBack && this.endCallBack()
      this.isStart = false
      this.page.setData({
        "scratchIsScroll": true
      })
    }
  },
  goToUserCenter: function () {
    let router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  judgmentVipCard: function (id) {
    let _this = this;
    this.getEnableVipCardList(id, function () {
      app.sendRequest({
        url: '/index.php?r=AppShop/GetVIPCardInfo',
        data: { vip_id: id },
        success: (res) => {
          let cardInfo = res.data[0];
          _this.getUserVipLevel(cardInfo);
        }
      })
    })
  },
  getUserVipLevel: function (cardInfo) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPInfo',
      data: {},
      success: (res) => {
        let user_vip_level = res.data.level ? res.data.level : 0;
        let user_vip_id = res.data.vip_id ? res.data.vip_id : 0;
        if (user_vip_level <= +cardInfo.level && user_vip_id !== cardInfo.id) {
          cardInfo.isShow = true;
          _this.setData({
            vipCardInfo: cardInfo,
            payActivity: _this.data.benefitConfig.type
          })
        }
      }
    })
  },
  getEnableVipCardList: function (id, callback) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppVipCard/GetEnableVipCardList',
      data: {
        sub_shop_app_id: _this.data.franchisee
      },
      success: (res) => {
        res.data.map((val) => {
          if (val.id === id) {
            callback();
          }
        })
      }
    })
  },
  handleVipCard: function () {
    this.getCollectUserinfoConfig(() => {
      app.turnToPage('/userCenter/pages/userCenter/userCenter?card_id=' + this.data.vipCardInfo.id
        + '&is_no_condition_recv=' + 1
        + '&franchisee=' + this.data.franchisee);
    })
  },
  recvVipCard: function () {
    let _this = this;
    app.sendRequest({
      data: {
        vipcard_id: _this.data.vipCardInfo.id,
        sub_shop_app_id: _this.data.franchisee
      },
      url: '/index.php?r=AppVipCard/RecvVipCard',
      hideLoading: true,
      success: (res) => {
        app.showToast({
          title: '开卡成功',
          icon: 'success'
        });
      }
    })
  },
  saveUserInfo: function () {
    let data = this.data.userInfo;
    let _this = this;
    let config = this.data.userInfoCollectConfig;
    let newData = {};
    if (data.country === 'China') {
      data.country = '中国'
    }
    data.province = this.data.userCityArr[0];
    data.city = this.data.userCityArr[1];
    if ((config.collect_username == 1 && data.nickname === '') ||
      (config.collect_phone == 1 && !data.phone) ||
      (config.collect_birthday == 1 && data.birthday === '') ||
      (config.collect_region == 1 && (data.province === '' || data.city === ''))) {
      app.showModal({
        content: '请填写完整的会员信息'
      });
      return;
    }
    newData.nickname = data.nickname;
    newData.phone = data.phone;
    newData.birthday = data.birthday;
    newData.country = data.country;
    newData.province = data.province;
    newData.city = data.city;
    app.sendRequest({
      url: '/index.php?r=AppData/saveUserInfo',
      method: 'post',
      data: newData,
      success: function (res) {
        if (res.status === 0) {
          app.setUserInfoStorage(data);
          _this.recvVipCard();
        }
      }
    });
  },
  getCollectUserinfoConfig: function (callback) {
    let _this = this;
    let userInfo = JSON.parse(JSON.stringify(app.getUserInfo()));
    app.sendRequest({
      data: {},
      url: '/index.php?r=AppVipCard/GetCollectUserinfoConfig',
      hideLoading: true,
      success: (res) => {
        if (res.data.need_collect_info) {
          callback();
        } else {
          _this.recvVipCard();
        }
      }
    })
  },
  closeVipCardDialog: function (e) {
    if (e.target.dataset.type === 'shadow') {
      this.setData({
        isShowVipCardDialog: false
      })
    }
  },
  getAppShopByPage: function () {
    let that = this;
    let franchiseeId = this.data.franchisee;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: {
        sub_shop_app_id: franchiseeId
      },
      success: function (res) {
        let newdata = {},
          data = res.data[0];
        newdata['appTitle'] = data.name;
        that.setData(newdata);
      }
    })
  },
  getPhoneNumber: function (e) {
    if (this.data.isGetPhoneNumber && userInfo.phone.length === 11) {
      return;
    }
    let _this = this;
    app.checkSession(function () {
      if (!e.detail.encryptedData) {
        return;
      }
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppUser/GetPhoneNumber',
        data: {
          encryptedData: e.detail.encryptedData || '',
          iv: e.detail.iv || ''
        },
        success: function (res) {
          app.setUserInfoStorage({
            phone: res.data
          })
          _this.setData({
            'userInfo.phone': res.data,
            isGetPhoneNumber: true
          })
        },
        successStatus5: function () {
          app.goLogin({
            success: function () {
              app.showModal({
                content: '获取手机号失败，请再次点击授权获取'
              });
            },
            fail: function () {
              app.showModal({
                content: '获取手机号失败，请再次点击授权获取'
              });
            }
          });
        }
      })
    });
  },
  inputUserInfo: function (e) {
    let setData = {}
    if (e.currentTarget.dataset.type === 'name') {
      setData = { 'userInfo.name': e.detail.value }
    } else if (e.currentTarget.dataset.type === 'phone') {
      setData = { 'userInfo.phone': e.detail.value }
    }
    this.setData(setData);
  },
  bindBirthdayChange: function (e) {
    this.setData({
      'userInfo.birthday': e.detail.value
    })
  },
  bindCityChange: function (e) {
    this.setData({
      'userCityArr': e.detail.value
    })
  },
  toAddCard: function () {
    let _data = this.data, wxcouponId = _data.ifWxCoupon, _this = this;
    wx.addCard({
      cardList: [
        {
          cardId: wxcouponId,
          cardExt: '{"nonce_str":"' + _data.timestamp + '","timestamp":"' + _data.timestamp + '", "signature":"' + _data.signature + '"}'
        }
      ],
      success: function (res) {
        _this.setData({
          ifWxCoupon: false,
          ifGetComfort: true
        });
        app.sendRequest({
          url: '/index.php?r=appLotteryActivity/recvWeChatCoupon',
          data: {
            card_id: res.cardList[0].cardId,
            sub_app_id: _data.franchisee,
            activity_id: _data.scratchId,
          },
          success: function (res) {
            app.showModal({
              title: '提示',
              content: '领取卡券成功',
              showCancel: false
            });
          }
        });
      }
    })
  },
  shadeClose: function (el) {
    let _this = this,
      type = el.currentTarget.dataset.type;
    app.showModal({
      title: '提示',
      content: '微信优惠券不领取到卡包，下次就不能再领取了哦，确定放弃优惠么？',
      showCancel: true,
      confirm: function (res) {
        _this.setData({
          ifWxCoupon: false,
          ifGetComfort: false
        });
        if (type == 1) {
          _this.winningBtnClick();
        } else if (type == 2) {
          _this.comfortBtnClick()
        }
      }
    })
  },
  getPayGiftReward: function () {        // 获取支付有礼奖励
    app.sendRequest({
      url: '/index.php?r=paidGift/WillReceiveOrReceivedRewards',
      method: 'post',
      hideLoading: true,
      data: {
        order_id: this.data.orderId,
        sub_shop_app_id: this.data.franchisee
      },
      success: (res) => {
        const { data, status } = res;
        if (status === 0) {
          const { rewards, activity } = data;
          data.rewards = rewards.map((item) => {
            item.rewardType = this.data.rewardTypeOptions.find((reward) => reward.type == item.type).key;
            return item;
          })
          data.activity = activity || {};
          if (activity.rewards_config && activity.rewards_config[0].threshold.greater_equal) {   // 是否有阶梯门槛
            data.activity.condition = 1;
          } else {
            data.activity.condition = 0;
          }
          data.activity.rewards_config = this.handleRewardConfig(activity.rewards_config || []);
          this.setData({
            payGiftInfo: data
          })
        }
      }
    })
  },
  checkActivity: function () {
    let franchiseeId = this.data.franchiseeId;
    app.turnToPage('/userCenter/pages/inviteRewards/inviteRewards' + '?franchiseeId=' + franchiseeId);
  },
  onShareAppMessage: function () {
    let router = app.getHomepageRouter();
    let path = '/pages/' + router + '/' + router;
    return app.shareAppMessage({
      path,
    });
  },
  getPayWindow: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=PullUserGift/GetPayWindow',
      data: {
        id: app.globalData.inviterId
      },
      success: function (res) {
        console.log(res);
        if (res.data && res.data.pay_switch == 1 && res.data.pop_time_num <= res.data.pop_time_value) {
          that.setData({
            showInviteModal: true
          })
        }
      }
    })
  },
  closeInviteModal: function() {
    this.setData({
      showInviteModal: false
    })
  }
})
