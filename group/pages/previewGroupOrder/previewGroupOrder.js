var app = getApp();
var util = require('../../../utils/util.js')
Page({
  data: {
    id: 0,
    selectmodel: "",
    order: {},
    formid: [],
    isFrom: true,
    goodsInfo: {},
    groupPrice: '',
    goodsPrice: '',
    kanfriends: [],
    cart_id_arr: [],
    kanprice: 0,
    description: '',
    num_of_people: 0,
    num: 0,
    status: "P",
    storeConfig: '',
    express_fee: 0,
    box_fee: 0,
    selectAddress: '',
    shop: {
      id: "0"
    },
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    },
    useBalance: true,
    selectDiscountInfo: {},
    cashOnDelivery: false,
    is_self_delivery: 0,
    deliverytype: "express",
    noAdditionalInfo: true,
    additional_info_obj: {},
    goodsType: '',
    selectDelivery: '',
    pickUpType: '',
    pickUpTypeArr: [],
    expressAddressNull: false,
    additional_info: {},
    payGiftOptions: {},              // 支付有礼计算金额参数
    settlementActivityFreePrice: 0,
    pickUpTypeName: {                  // 取货方式名称
      '-1': '',
      1: '快递',
      2: '同城',
      3: '自提',
      4: '堂食'
    },
  },
  onLoad: function(options) {
    var that = this,
      goods_id = options.goodsid,
      activityid = options.activityid,
      addressId = options.addressId || '',
      pickUpType = options.type || '',
      team_token = options.team_token || '',
      groupType = options.groupType,
      limit_buy = options.limit_buy,
      isFrom = options.isFrom,
      session_key = wx.getStorageSync('session_key'),
      pages = getCurrentPages(),
      lastPage = pages[pages.length - 2],
      selectmodelObj = lastPage.data.selectModelInfo || {},
      model_id = selectmodelObj.modelId || '',
      selectmodel = selectmodelObj.models_text;
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.franchisee_id = options.franchisee || '';
    this.setData({
      franchisee_id: options.franchisee || '',
      selectmodel: selectmodel,
      team_token: team_token,
      model_id: model_id,
      goods_id: goods_id,
      activityid: activityid,
      num_of_people: options.group_buy_people,
      num: Number(options.num),
      limit_buy: limit_buy,
      isFrom: isFrom,
      groupType: groupType,
      pickUpType: pickUpType,
      sameJourneyTimeType: pickUpType == 2 ? 1 : '',
      selectSameJourneyId: pickUpType == 2 ? addressId : '',
      selectAddressId: pickUpType == 1 ? addressId : '',
      phone: app.getUserInfo().phone,
      parentAppId: options.parent_app_id || '',
    });
    setTimeout(function() {
      that.selectPickMethod('first');
    }, 500)
  },
  onShow: function() {
    if (this.isFromSelectAddress) {
      this.getCalculationInfo();
      this.isFromSelectAddress = false;
    }
    if (this.onlyImme) {
      this.showServiceTime('onlyImme');
      this.onlyImme = false;
    }
  },
  selectPickMethod: function(first) {
    let that = this;
    let cartIdArr = this.cart_id_arr;
    app.sendRequest({
      url: '/index.php?r=AppGroupBuy/getCanUsePickUpTypeAtAddOrder',
      method: 'post',
      data: {
        num: that.data.num,
        goods_id: that.data.goods_id,
        activity_id: that.data.activityid,
        model_id: that.data.model_id || '',
        num_of_people: that.data.num_of_people,
        team_token: that.data.team_token || '',
        latitude: that.data.latitude || '',
        longitude: that.data.longitude || '',
        region_id: that.data.currentRegionId || '',
        sub_shop_app_id: that.franchisee_id || ''
      },
      success: function(res) {
        let { goods_pick_up_type_arr, intra_city_data } = res.data;
        let pickUpType = that.data.pickUpType;
        if (goods_pick_up_type_arr.length > 0) {
          goods_pick_up_type_arr = goods_pick_up_type_arr.filter((item) => item !== '5');
        }
        if (!pickUpType || pickUpType === -1) {
          if (goods_pick_up_type_arr[0] == 2 && goods_pick_up_type_arr[1] && (intra_city_data.is_enough_price != 1 || intra_city_data.in_business_time != 1)) {
            pickUpType = goods_pick_up_type_arr[1];
          } else {
            pickUpType = goods_pick_up_type_arr[0];
          }
        }
        that.setData({
          pickUpType: pickUpType || -1,
          pickUpTypeArr: goods_pick_up_type_arr,
          intraCityData: intra_city_data,
          isShowPickMask: first == 'first' ? false : true
        })
        if (first == 'first') {
          switch (that.data.pickUpType) {
            case '3':
              that.getLocation().then(() => {
                return that.getInStore();
              }).then(() => {
                that.getSelfDeliveryList();
              });
              break;
            case '2':
              that.setData({
                sameJourneyTimeType: 1
              })
              break;
          }
          that.getCalculationInfo();
          if (that.data.pickUpType !== 3 && goods_pick_up_type_arr.indexOf('3') !== -1) {
            that.getLocation().then(() => {
              that.getInStore();
            })
          }
        }
      }
    });
  },
  getGoodsStoreSet: function(type) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getPickUpGoodsTypeSetting',
      data: {
        pick_up_type: type,
        sub_shop_app_id: this.franchisee_id
      },
      success: function(res) {
        let configData = res.data.config_data;
        if (type == 3 && configData) {
          that.setData({
            selfAppointmentSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status == 1) ? true : false,
            onlyImmediatlyPickSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status != 1 && configData.immediate_info.self_pcik_up_status == 1) ? true : false,
            selfDeliveryPhone: configData.is_phone,
            selfDeliveryScan: (configData.pick_up_time_status == 1 && configData.immediate_info.status == 1 && configData.immediate_info.scan_qrcode_status == 1) ? true : false
          })
          if (that.data.onlyImmediatlyPickSwitch && that.data.selectDelivery) {
            that.showServiceTime('onlyImme');
          }
        } else if (type == 2 && configData) {
          that.getsameJourneyTime(configData.business_rule);
        }
      }
    })
  },
  tostoreImmediately: function() {
    this.setData({
      tostoreOrderType: 1,
      tostoreHourTime: '',
      isShowServiceTime: false
    })
  },
  selectTostoreTime: function(e) {
    let dateArr = this.data.getEcTostoredate.date_arr;
    let index = e.currentTarget.dataset.index;
    let tostoreDateTime = dateArr[index].date;
    let tostoreWeekTime = dateArr[index].week;
    this.setData({
      tostoreOrderType: 2,
      dateIndex: index,
      tostoreDateTime: tostoreDateTime,
      tostoreWeekTime: tostoreWeekTime,
      isShowServiceTime: this.data.tostoreTimeType != 1 ? true : false
    })
    this.getTostoreTime();
  },
  getTostoreTime: function() {
    let currentMonth = new Date().getMonth() + 1;
    let currentMinute = new Date().getMinutes();
    let startHours = new Date().getHours();
    let currentDay = new Date().getDate();
    let currentDate = (currentMonth < 10 ? '0' + currentMonth : currentMonth) + '-' + (currentDay < 10 ? '0' + currentDay : currentDay);
    let tostoreHoursArr = [];
    let currentLimitFlag = true;
    let businessTimeRule = this.data.businessTimeRule;
    let tostoreWeekTime = Number(this.data.tostoreWeekTime);
    let businessTime;
    let showImmediatelyTime = this.businessTimeType == 1 ? true : false; //1为全年 2为自定义
    let advanceAppointmentInfo = this.data.advanceAppointmentInfo;
    let advanceTime = +advanceAppointmentInfo.num + startHours > 24 ? +advanceAppointmentInfo.num + startHours - 24 : +advanceAppointmentInfo.num + startHours;
    this.businessTimeType == 2 && businessTimeRule.map((item) => {
      if (tostoreWeekTime == 0) {
        tostoreWeekTime = 7;
      }
      if (item.business_week[tostoreWeekTime - 1] == 1) {
        businessTime = item.business_time_interval;
      }
    })
    if (currentDate === this.data.tostoreDateTime) {
      if (this.businessTimeType == 2) {
        businessTime && businessTime.map((item) => {
          let fSH = startHours; //是否要判断分钟，初始开始小时
          let fEH = Number(item.end_time.substring(0, 2)); //是否要判断分钟，初始结束小时
          let sH = Number(item.start_time.substring(0, 2));
          let eH = Number(item.end_time.substring(0, 2));
          let sT = Number(item.start_time.substring(3, 5));
          let eT = Number(item.end_time.substring(3, 5));
          if (startHours < advanceTime) {
            fSH = startHours = advanceTime
          };
          if (((startHours > sH && startHours < eH) || (startHours == sH && currentMinute >= sT)) && !advanceTime) {
            showImmediatelyTime = true
          }
          if (startHours < sH) {
            startHours = sH;
            currentMinute = 0;
          } else if (startHours > eH) {
            return;
          }
          for (; startHours <= eH; startHours++) {
            if (this.data.tostoreTimeType == 2) {
              if (startHours == fEH) {
                continue;
              }
              tostoreHoursArr.push(startHours + ':00-' + (startHours + 1) + ':00');
            } else {
              if (startHours == fSH && currentMinute <= 30 && currentMinute != 0) {
                tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
                continue;
              } else if (startHours == fSH && currentMinute > 30) {
                continue
              }; //开始分钟数大于三十分钟则跳过当前时间段
              if (startHours == fEH && eT >= 30) {
                tostoreHoursArr.push(startHours + ':00-' + startHours + ':30');
                continue;
              } else if (startHours == fEH && eT == 0) {
                continue
              }; //结束分钟数等于0则跳过当前时间段
              tostoreHoursArr.push(startHours + ':00-' + startHours + ':30');
              tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
            }
          }
        })
      } else {
        if (startHours < advanceTime) {
          startHours = advanceTime
        };
        for (; startHours < 24; startHours++) {
          if (this.data.tostoreTimeType == 2) {
            if (currentLimitFlag && currentMinute > 0) {
              currentLimitFlag = false;
              startHours++
            }
            if (startHours >= 24) {
              continue
            };
            tostoreHoursArr.push(startHours + ':00-' + (startHours + 1) + ':00');
          } else {
            if (currentLimitFlag && currentMinute > 0 && currentMinute <= 30) {
              currentLimitFlag = false;
              tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
              continue;
            }
            if (currentLimitFlag && currentMinute > 30) {
              currentLimitFlag = false;
              startHours++
            }
            if (startHours >= 24) {
              continue
            };
            tostoreHoursArr.push(startHours + ':00-' + startHours + ':30');
            tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
          }
        }
      }
    } else {
      if (this.businessTimeType == 2) {
        businessTime && businessTime.map((item) => {
          let fSH = Number(item.start_time.substring(0, 2)); //是否要判断分钟，初始开始小时
          let fEH = Number(item.end_time.substring(0, 2)); //是否要判断分钟，初始结束小时
          let sH = Number(item.start_time.substring(0, 2));
          if (this.data.getEcTostoredate.date_arr[1].date == this.data.tostoreDateTime && sH < advanceTime && +advanceAppointmentInfo.num + startHours > 24) {
            sH = advanceTime
          };
          let eH = Number(item.end_time.substring(0, 2));
          let sT = Number(item.start_time.substring(3, 5));
          let eT = Number(item.end_time.substring(3, 5));
          for (; sH <= eH; sH++) {
            if (this.data.tostoreTimeType == 2) {
              if (sH == fEH || (sH == fSH && sT > 0)) {
                continue
              }
              tostoreHoursArr.push(sH + ':00-' + (sH + 1) + ':00');
            } else {
              if (sH == fSH && sT <= 30 && sT != 0) {
                tostoreHoursArr.push(sH + ':30-' + (sH + 1) + ':00');
                continue;
              } else if (sH == fSH && sT > 30) {
                continue
              }; //开始分钟数大于三十分钟则跳过当前时间段
              if (sH == fEH && eT <= 30 && eT != 0) {
                tostoreHoursArr.push(sH + ':00-' + sH + ':30');
                continue;
              } else if (sH == fEH && eT == 0) {
                continue
              }; //结束分钟数等于0则跳过当前时间段
              tostoreHoursArr.push(sH + ':00-' + sH + ':30');
              tostoreHoursArr.push(sH + ':30-' + (sH + 1) + ':00');
            }
          }
        })
      } else {
        let i = 0;
        if (this.data.getEcTostoredate.date_arr[1].date == this.data.tostoreDateTime && i < advanceTime && +advanceAppointmentInfo.num + startHours > 24) {
          i = advanceTime
        };
        for (; i < 24; i++) {
          if (this.data.tostoreTimeType == 2) {
            tostoreHoursArr.push(i + ':00-' + (i + 1) + ':00');
          } else {
            tostoreHoursArr.push(i + ':00-' + i + ':30');
            tostoreHoursArr.push(i + ':30-' + (i + 1) + ':00');
          }
        }
      }
    }
    this.setData({
      tostoreHoursArr: tostoreHoursArr,
      showImmediatelyTime: showImmediatelyTime
    })
  },
  selectTostoreHourTime: function(e) {
    let tostoreHoursArr = this.data.tostoreHoursArr;
    let index = e.currentTarget.dataset.index;
    let tostoreHourTime = tostoreHoursArr[index];
    this.setData({
      tostoreOrderType: 2,
      tostoreHourTime: tostoreHourTime,
      isShowServiceTime: false
    })
    this.getCalculationInfo();
  },
  getsameJourneyTime: function(businessRule) {
    let sameJourneyHoursArr = [];
    let currentMinute = new Date().getMinutes() + Number(this.data.sameJourneyImmediatlyTime);
    let startHours = new Date().getHours();
    if (currentMinute >= 60) {
      startHours++
      currentMinute = currentMinute - 60;
    }
    if (businessRule.type == 1) {
      let currentLimitFlag = true;
      for (; startHours < 24; startHours++) {
        if (currentLimitFlag && currentMinute > 0 && currentMinute <= 30) {
          currentLimitFlag = false;
          sameJourneyHoursArr.push(startHours + ':30');
          continue;
        }
        if (currentLimitFlag && currentMinute > 30) {
          currentLimitFlag = false;
          startHours++
        }
        sameJourneyHoursArr.push(startHours + ':00');
        sameJourneyHoursArr.push(startHours + ':30');
      }
    } else {
      let currentWeek = new Date().getDay();
      let businessTime;
      businessRule.type == 2 && businessRule.custom.business_time.map((item) => {
        if (currentWeek == 0) {
          currentWeek = 7;
        }
        if (item.business_week[currentWeek - 1] == 1) {
          businessTime = item.business_time_interval;
        }
      })
      businessTime.map((item) => {
        let fSH = startHours; //是否要判断分钟，初始开始小时
        let fEH = Number(item.end_time.substring(0, 2)); //是否要判断分钟，初始结束小时
        let sH = Number(item.start_time.substring(0, 2));
        let eH = Number(item.end_time.substring(0, 2));
        let sT = Number(item.start_time.substring(3, 5));
        let eT = Number(item.end_time.substring(3, 5));
        if (startHours <= sH) {
          startHours = sH;
          currentMinute = 0;
        } else if (startHours > eH) {
          return;
        }
        for (; startHours <= eH; startHours++) {
          if (startHours == fSH && currentMinute <= 30 && currentMinute != 0) {
            sameJourneyHoursArr.push(startHours + ':30');
            continue;
          } else if (startHours == fSH && currentMinute > 30) {
            continue
          }; //开始分钟数大于三十分钟则跳过当前时间段
          if (startHours == fEH && eT < 30) {
            sameJourneyHoursArr.push(startHours + ':00');
            continue;
          } else if (startHours == fEH && eT == 0) {
            continue
          }; //结束分钟数等于0则跳过当前时间段
          sameJourneyHoursArr.push(startHours + ':00');
          sameJourneyHoursArr.push(startHours + ':30');
        }
      })
    }
    this.setData({
      sameJourneyHoursArr: sameJourneyHoursArr,
      isShowSameJourneyTime: true
    })
  },
  getAppECStoreConfig: function() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getAppECStoreConfig',
      data: {
        sub_shop_app_id: that.franchisee_id || ''
      },
      success: function(res) {
        if (res.data.express == 0) {
          that.getSelfDeliveryList();
        }
        that.setData({
          storeConfig: res.data,
          is_self_delivery: res.data.express == 0 && res.data.is_self_delivery == 1 ? 1 : 0,
          storeStyle: that.franchisee_id ? '' : res.data.color_config
        })
        that.getCalculationInfo();
      }
    })
  },
  selectSameJourneyTime: function (e) {
    let dateArr = this.data.sameJourneyConfig.date_arr;
    let index = e.currentTarget.dataset.index;
    let sameJourneyDateTime = dateArr[index].date;
    let sameJourneyHoursArr = dateArr[index].duration
    this.setData({
      dateIndex: index,
      sameJourneyDateTime,
      sameJourneyHoursArr,
      sameJourneyHourTime: ''
    })
  },
  deliveryWayChange: function(event) {
    let type = event.currentTarget.dataset.type;
    if (type == 3) {
      this.getSelfDeliveryList();
    }
    this.setData({
      pickUpType: type,
      sameJourneyTimeType: type == 2 ? 1 : '',
      isShowPickMask: false,
      cashOnDelivery: false
    })
    this.getCalculationInfo();
  },
  getLocation: function () {
    return new Promise((resolve, reject) => {
      let that = this;
      app.getLocation({
        type: 'gcj02',
        success: function (res) {
          that.setData({
            latitude: res.latitude,
            longitude: res.longitude
          });
          resolve();
        },
        fail: function () {
          that.setData({
            latitude: '',
            longitude: ''
          });
          resolve();
        }
      })
    })
  },
  getInStore: function () {
    return new Promise((resolve, reject) => {
      const that = this;
      if (app.app_store_id) {
        return resolve();
      }
      app.sendRequest({
        url: '/index.php?r=AppEcommerce/getUserPrioritySelfDeliveryStore',
        data: {
          name: 'priority_self_delivery_shop',
          latitude: that.data.latitude || '',
          longitude: that.data.longitude || ''
        },
        chain: true,
        success: function (res) {
          if (res && res.data && res.data.config_data && res.data.config_data.app_store_id != 0) {
            app.app_store_id = res.data.config_data.app_store_id;
          }
        },
        complete: function () {
          resolve();
        }
      })
    })
  },
  getSelfDeliveryList: function() {
    let that = this;
    let params = {};
    if (app.app_store_id != undefined && !this.isFranchisee && !this.franchisee_id) {
      params['self_delivery_app_store_id'] = app.app_store_id;
    } else if (this.isFranchisee) {
      let { shopsList } = this.data;
      let shopParams = [];
      shopParams = shopsList.map((shop) => {
        return {
          'app_id': shop.app_id,
          'self_delivery_app_store_id': ''
        }
      });
      params['delivery_arr'] = shopParams;
    } else {
      params['sub_shop_app_id'] = this.franchisee_id || app.getChainId();
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/getSelfDeliveryList',
      data: params,
      success: function(res) {
        let storeList = res.data.store_list_data
        if (!storeList.length) {
          app.showModal({
            content: '商家暂无自提门店',
            confirm: function() {
              app.turnBack();
            }
          })
          return;
        }
        that.setData({
          selectDelivery: storeList[0]
        })
        that.getGoodsStoreSet(3);
      }
    })
  },
  toDeliveryList: function() {
    let that = this;
    let url = '';
    if (that.franchisee_id) {
      url += '?franchiseeId=' + that.franchisee_id;
      url += that.data.selectDelivery.id ? '&deliveryId=' + that.data.selectDelivery.id : '';
    } else {
      url += that.data.selectDelivery.id ? '?deliveryId=' + that.data.selectDelivery.id : '';
    }
    if (this.data.onlyImmediatlyPickSwitch) {
      this.onlyImme = true;
    }
    that.saveUserFormId(function() {
      app.turnToPage('/eCommerce/pages/goodsDeliveryList/goodsDeliveryList' + url);
    })
  },
  goToAdditionalInfo: function() {
    app.setGoodsAdditionalInfo(this.data.additional_info);
    this.saveUserFormId(function() {
      app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo');
    })
  },
  goToMyAddress: function() {
    var addressId = this.data.selectAddress && this.data.selectAddress.id;
    this.isFromSelectAddress = true;
    this.saveUserFormId(function() {
      app.turnToPage('/eCommerce/pages/myAddress/myAddress?id=' + addressId);
    })
  },
  clickMinusButton: function(e) {
    var index = e.currentTarget.dataset.index,
      num = this.data.num;
    if (+num <= 0) return;
    this.changeGoodsNum(index, 'minus');
  },
  inputBuyCount: function(e) {
    var count = +e.detail.value,
      goodsInfo = this.data.goodsInfo,
      limit_buy = +this.data.limit_buy,
      stock = +goodsInfo.stock;
    if (this.data.groupType != '4' && count > limit_buy && limit_buy != 0) {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + this.data.limit_buy + '件）',
      });
      this.setData({
        num: limit_buy
      })
      return;
    }
    if (count == 0) {
      this.setData({
        num: 1
      });
      return;
    }
    if (count >= stock) {
      count = stock;
      app.showModal({
        content: '购买数量不能大于库存'
      });
    }
    this.setData({
      num: +count
    });
    this.getCalculationInfo();
  },
  clickPlusButton: function(e) {
    var index = e.currentTarget.dataset.index,
      stock = +this.data.goodsInfo.stock,
      limit_buy = +this.data.limit_buy,
      num = this.data.num;
    if (this.data.groupType != '4' && limit_buy !== '' && limit_buy != 0 && +num >= limit_buy) {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + limit_buy + '件）',
      })
      this.setData({
        num: limit_buy
      })
      return;
    };
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type) {
    var goods = this.data.goodsInfo,
      stock = +goods.stock,
      currentNum = this.data.num,
      targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type)),
      that = this,
      data = {},
      param;
    if (targetNum == 0 && type == 'minus') {
      this.setData({
        num: 1
      })
      return;
    }
    if (targetNum > stock) {
      app.showModal({
        content: '购买数量不能大于库存'
      })
      this.setData({
        num: stock
      })
      return;
    }
    this.setData({
      num: targetNum
    })
    this.getCalculationInfo();
  },
  getCalculationInfo: function() {
    var that = this,
      goods_id = that.data.goods_id,
      activity_id = that.data.activityid,
      model_id = that.data.model_id || '',
      tostoreOrderType = this.data.tostoreOrderType;
    let year = new Date().getFullYear();
    let tostoreDateTime = year + '-' + this.data.tostoreDateTime + ' ' + (this.data.tostoreHourTime || '');
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/calculatePrice',
      method: 'post',
      data: {
        goods_id: goods_id,
        activity_id: activity_id,
        pick_up_type: this.data.pickUpType,
        model_id: model_id || '',
        sub_shop_app_id: that.franchisee_id || '',
        address_id: this.data.pickUpType == 1 ? this.data.selectAddressId : this.data.selectSameJourneyId,
        cart_id_arr: this.cart_id_arr,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        select_benefit: this.data.selectDiscountInfo,
        num_of_people: this.data.num_of_people,
        num: this.data.num,
        team_token: this.data.team_token || '',
        ecommerce_info: {
          'ec_tostore_data': {
            'ec_tostore_order_type': tostoreOrderType || 1,
            'ec_tostore_appointment_time': tostoreOrderType == 1 || !this.data.selfAppointmentSwitch ? '' : tostoreDateTime,
            'ec_tostore_buyer_phone': this.data.phone || '',
            'ec_tostore_appointment_time_type': this.data.tostoreTimeType || '',
            'ec_tostore_location_id': this.data.locationId || ''
          },
          'intra_city_data': that._mapIntraCityOptions(),
        },
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        settlement_activity_info: this.data.payGiftOptions,
      },
      success: function(res) {
        if (typeof(res.data) == 'string') {
          if (!that.data.isFrom && res.data == '已达到抽奖机会购买上限') {
            app.showModal({
              content: res.data
            })
            that.setData({
              num: 1
            })
            return;
          } else {
            app.showModal({
              content: res.data,
              confirm: function() {
                app.turnBack();
              }
            })
            return;
          }
        }
        let info = res.data;
        let benefits = info.benefit;
        let goods_info = info.goods_info;
        let additional_info_goods = [];
        let selectDiscountInfo = info.select_benefit;
        let suppInfoArr = [];
        let additional_goodsid_arr = [];
        if (that.data.pickUpType == 2 && info.intra_city_status_data && info.intra_city_status_data.in_distance == 0) {
          app.showModal({
            content: '地址不在配送范围内',
            confirmText: '去更换',
            cancelText: '取消',
            showCancel: true,
            confirm: function() {
              that.goSameJourneyAddress();
            },
            cancel: function() {
              that.setData({
                selectSameJourney: ''
              })
            }
          });
        }
        let goodsBenefitsData = [],
          goodsPrice = goods_info.virtual_price == '0.00' ? goods_info.original_price : goods_info.virtual_price,
          groupPrice = info.original_price;
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({
          label: 'coupon',
          value: benefits.coupon_benefit
        }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({
          label: 'vip',
          value: benefits.all_vip_benefit
        }) : '';
        Array.isArray(benefits.integral_benefit) ? '' : benefits.integral_benefit && goodsBenefitsData.push({
          label: 'integral',
          value: [benefits.integral_benefit]
        });
        if (selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && that.data.exchangeCouponData.hasSelectGoods == false) {
          that.exchangeCouponInit(parseInt(selectDiscountInfo.value));
        }
        if (goods_info.delivery_id && goods_info.delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info.id) == -1) {
          suppInfoArr.push(goods_info.delivery_id);
          additional_goodsid_arr.push(goods_info.goods_id);
          additional_info_goods.push(goods_info);
        }
        let group_buy_price = String(info.original_price - info.group_buy_discount_price);
        if (group_buy_price.split('.')[1]) {
          group_buy_price = Number(group_buy_price).toFixed(2);
        }
        if (suppInfoArr.length && !that.data.deliverydWrite) {
          that.getSuppInfo(suppInfoArr);
        }
        if(+info.settlement_activity_item_price){
          info.final_price = ((+info.final_price) + (+info.settlement_activity_item_price)).toFixed(2);
        }
        that.setData({
          expressAddressNull: info.address ? false : that.data.expressAddressNull,
          goodsPrice: goodsPrice,
          groupPrice: groupPrice,
          goodsInfo: goods_info,
          isFrom: false,
          selectAddress: that.data.pickUpType == 1 && info.address,
          discountList: goodsBenefitsData,
          selectDiscountInfo: selectDiscountInfo,
          express_fee: (+info.express_fee).toFixed(2),
          box_fee: info.box_fee,
          discount_price: info.discount_price,
          balance: info.balance,
          deduction: (+info.use_balance).toFixed(2),
          original_price: info.original_price,
          group_buy_price: group_buy_price,
          totalPayment: info.final_price,
          canCashDelivery: info.is_pay_on_delivery || '',
          noAdditionalInfo: suppInfoArr.length ? false : true,
          cashOnDelivery: info.price > 0 ? (info.priority_pay_on_delivery == 1 ? true : false) : false,
          additional_goodsid_arr: additional_goodsid_arr,
          selectSameJourney: that.data.pickUpType == 2 && info.address,
          sameJourneyImmediatlyTime: (info.intra_city_status_data && info.intra_city_status_data.deliver_time) || '',
          settlementActivityFreePrice: info.settlement_activity_free_bills_item_price,
        })
        app.setPreviewGoodsInfo(additional_info_goods);
      },
      fail: function() {
        app.turnBack();
      }
    });
  },
  closeGoodsPick: function() {
    this.setData({
      isShowPickMask: false,
      isShowServiceTime: false,
      isShowSameJourneyTime: false
    })
  },
  showServiceTime: function(type) {
    let deliveryData = this.data.selectDelivery;
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetEcTostoreAppointmentDateList',
      data: {
        sub_shop_app_id: that.franchisee_id || '',
        self_delivery_app_store_id: deliveryData.id || '',
      },
      success: function(res) {
        let data = res.data;
        if (type == 'onlyImme') {
          that.setData({
            waitingQueueTime: data.duration_time,
            tostoreOrderType: 1
          })
          return;
        }
        let tostoreTimeType = data.setting_data.appointment.appointment_time_type; //1为天 2为时 3为半小时
        let tostoreDateTime = '';
        let tostoreWeekTime = '';
        let dateArr = data.date_arr;
        let advanceAppointmentInfo = data.setting_data.appointment.advance_appointment_info;
        let startHours = new Date().getHours();
        let businessTimeRule = data.business_time_rule; //上门自提营业时间
        let maxEndHour = 24;
        let currentMinute = new Date().getMinutes();
        let showImmediatelyTime = false;
        let noImmediaPick = (data.setting_data.immediate_info.status == 1 && advanceAppointmentInfo.type == 1) ? true : false; //判断上门自提立即取货开关开没开
        let noAppointmentShow = true; //是否显示暂无营业时间
        if (businessTimeRule.type == 2) { //获取自定义当天营业时间的终止小时
          let week = dateArr[0].week;
          let timeArr;
          businessTimeRule.custom.business_time.map((item) => {
            if (week == 0) {
              week = 7;
            }
            if (item.business_week[week - 1] == 1) {
              timeArr = item.business_time_interval;
              maxEndHour = +timeArr[timeArr.length - 1].end_time.substring(0, 2);
            }
          })
          timeArr && timeArr.map((item) => {
            let sH = Number(item.start_time.substring(0, 2));
            let eH = Number(item.end_time.substring(0, 2));
            let sT = Number(item.start_time.substring(3, 5));
            let eT = Number(item.end_time.substring(3, 5));
            if (((startHours > sH && startHours < eH) || (startHours == sH && currentMinute >= sT))) {
              showImmediatelyTime = true
            }
          })
        } else {
          showImmediatelyTime = true;
        }
        for (let i = 0; i < dateArr.length; i++) {
          if (i == 0 && ((advanceAppointmentInfo.type == 2 && +advanceAppointmentInfo.num + startHours >= maxEndHour) || (advanceAppointmentInfo.type == 1 && startHours >= maxEndHour))) {
            dateArr[i].is_vaild = 0
          };
          if (dateArr[i].is_vaild == 1 && tostoreTimeType != 1) {
            tostoreDateTime = dateArr[i].date;
            tostoreWeekTime = dateArr[i].week;
            break;
          }
        }
        dateArr.map((item) => {
          if (item.is_vaild == 1) {
            noAppointmentShow = false;
          }
        })
        that.businessTimeType = businessTimeRule.type;
        that.setData({
          getEcTostoredate: data,
          waitingQueueTime: data.duration_time,
          tostoreTimeType: tostoreTimeType,
          isShowServiceTime: true,
          noImmediaPick: noImmediaPick,
          tostoreDateTime: that.data.tostoreDateTime ? that.data.tostoreDateTime : tostoreDateTime,
          tostoreWeekTime: that.data.tostoreWeekTime ? that.data.tostoreWeekTime : tostoreWeekTime,
          businessTimeRule: businessTimeRule.type == 1 ? '' : businessTimeRule.custom.business_time,
          advanceAppointmentInfo: advanceAppointmentInfo,
          noAppointmentShow: noAppointmentShow,
          showImmediatelyTime: showImmediatelyTime
        })
        if (tostoreTimeType != 1) {
          that.getTostoreTime();
        }
        businessTimeRule.type == 2 && that.getNoAppointmentWord();
      }
    });
  },
  goSameJourneyAddress: function(e) {
    let selectSameJourney = this.data.selectSameJourney;
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/goodsSameJourney/goodsSameJourney?from=preview&sameJourneyId=' + (selectSameJourney ? selectSameJourney.id : '') + '&franchiseeId=' + this.franchisee_id);
  },
  commentChange: function(e) {
    var value = e.detail.value;
    if (value.length > 30) {
      app.showModal({
        content: '最多只能输入30个字'
      });
      value = value.slice(0, 30);
    }
    this.setData({
      description: value
    })
  },
  inputFormControl: function(e) {
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    a[b][0].value = e.detail.value
    this.setData({
      additional_info: a
    })
  },
  getSuppInfo: function(suppInfoArr) {
    var that = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=pc/AppShop/GetDelivery',
      method: 'post',
      data: {
        delivery_ids: suppInfoArr,
        sub_shop_app_id: that.franchisee_id || ''
      },
      success: function(res) {
        for (let i = 0; i < res.data.length; i++) {
          let suppInfo = res.data[i].delivery_info;
          for (let j = 0; j < suppInfo.length; j++) {
            if (suppInfo[j].is_required == 0 && suppInfo[j].is_hidden == 1) {
              that.setData({
                hasRequiredSuppInfo: true
              })
            }
          }
        } // 单商品单补充信息时直接展示
        if (res.data.length == 1 && that.data.additional_goodsid_arr.length == 1) {
          let deliveryIndex = 0;
          let showIndex = 0;
          res.data[0].delivery_info.map((item) => {
            showIndex++;
            if (item.is_hidden == 1) {
              deliveryIndex++;
            }
          })
          if (deliveryIndex == 1) {
            let data = {};
            data[that.data.additional_goodsid_arr[0]] = [];
            data[that.data.additional_goodsid_arr[0]].push({
              title: res.data[0].delivery_info[showIndex - 1].name,
              type: res.data[0].delivery_info[showIndex - 1].type,
              is_required: res.data[0].delivery_info[showIndex - 1].is_required,
              value: ''
            })
            that.setData({
              additional_info: data,
              aloneDeliveryShow: true
            })
          }
        }
      }
    })
  },
  confirmPayment: function(e) {
    let formid = this.data.formid,
      that = this,
      list = this.data.goodsList,
      tostoreOrderType = this.data.tostoreOrderType,
      select_benefit = this.data.selectDiscountInfo,
      hasWritedAdditionalInfo = false;
    formid.push(e.detail.formId);
    if (this.data.pickUpType === -1) {
      app.showModal({
        content: '商家未开启配送'
      });
      return;
    }
    if (this.data.pickUpType == 1 && !this.data.selectAddress) {
      this.setData({
        expressAddressNull: true
      })
      return;
    }
    if (this.data.pickUpType == 2 && !this.data.selectSameJourney) {
      app.showModal({
        content: '请完善地址信息',
        confirmText: '去填写',
        confirm: function() {
          that.goToMyAddress();
        }
      });
      return;
    }
    if (this.data.pickUpType == 2 && !this.data.selectSameJourney) {
      app.showModal({
        content: '请选择同城地址',
        confirmText: '去填写',
        confirm: function() {
          that.goSameJourneyAddress();
        }
      });
      return;
    }
    if (this.data.pickUpType == 2 && !this.data.sameJourneyDateTime && this.data.sameJourneyTimeType != 1) {
      app.showModal({
        content: '请选择取货时间'
      });
      return;
    }
    if (this.data.pickUpType == 3 && !this.data.selectDelivery) {
      app.showModal({
        content: '请选择上门自提地址',
        confirmText: '去填写',
        confirm: function() {
          that.toDeliveryList();
        }
      });
      return;
    }
    for (var key in this.data.additional_info) {
      if (key !== undefined) {
        hasWritedAdditionalInfo = true;
        break;
      }
    }
    if (this.data.pickUpType == 3 && this.data.selfAppointmentSwitch && !tostoreOrderType) {
      app.showModal({
        content: '请选择取货时间'
      });
      return;
    }
    let year = new Date().getFullYear();
    let tostoreDateTime = year + '-' + this.data.tostoreDateTime + ' ' + (this.data.tostoreHourTime || '');
    if (this.data.pickUpType == 3 && this.data.selfDeliveryPhone == 1 && !util.isPhoneNumber(this.data.phone)) {
      app.showModal({
        content: '请输入正确的手机号'
      });
      return;
    }
    if (this.data.hasRequiredSuppInfo && !this.data.deliverydWrite && !this.data.aloneDeliveryShow) {
      app.showModal({
        content: '商品补充信息未填写，无法进行支付',
        confirmText: '去填写',
        confirm: function() {
          that.goToAdditionalInfo();
        }
      });
      return;
    }
    if (this.data.aloneDeliveryShow) {
      let a = this.data.additional_info;
      let id = this.data.additional_goodsid_arr[0];
      if (a[id][0].is_required == 0 && a[id][0].value == '') {
        app.showModal({
          content: '请填写' + a[id][0].title,
          confirmText: '确认'
        });
        return;
      }
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/addOrder',
      method: 'post',
      data: {
        goods_id: that.data.goods_id,
        activity_id: that.data.activityid,
        sub_shop_app_id: that.franchisee_id || this.data.parentAppId || '',
        model_id: that.data.model_id || '',
        num: that.data.num,
        num_of_people: that.data.num_of_people,
        team_token: that.data.team_token || '',
        formId: e.detail.formId,
        select_benefit: that.data.selectDiscountInfo,
        is_balance: that.data.useBalance ? 1 : 0,
        is_self_delivery: that.data.is_self_delivery,
        self_delivery_app_store_id: that.data.is_self_delivery == 1 ? that.data.selectDelivery.id : '',
        remark: that.data.description,
        address_id: this.data.pickUpType == 1 ? this.data.selectAddress.id : this.data.selectSameJourney.id,
        is_pay_on_delivery: that.data.cashOnDelivery ? 1 : 0,
        additional_info: that.data.additional_info,
        express_fee: that.data.express_fee,
        box_fee: that.data.box_fee,
        ecommerce_info: {
          'ec_tostore_data': {
            'ec_tostore_order_type': tostoreOrderType  || 1,
            'ec_tostore_appointment_time': tostoreOrderType == 1 || !this.data.selfAppointmentSwitch ? '' : tostoreDateTime,
            'ec_tostore_buyer_phone': this.data.phone || '',
            'ec_tostore_appointment_time_type': this.data.tostoreTimeType || '',
            'ec_tostore_location_id': this.data.locationId || ''
          },
          'intra_city_data': that._mapIntraCityOptions(),
        },
        pick_up_type: this.data.pickUpType,
        self_delivery_app_store_id: this.data.pickUpType == 3 ? this.data.selectDelivery.id : '',
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        settlement_activity_info: this.data.payGiftOptions,
      },
      success: function(res) {
        var data = res.data;
        if (res.status == 0) {
          if (that.data.cashOnDelivery) {
            let pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + res.data.order_id + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group + '&orderid=' + res.data.order_id + '&teamToken=' + res.data.team_token;
            that.saveUserFormId(function() {
              app.turnToPage(pagePath);
            })
          } else {
            that.payOrder(res.data.order_id, res.data.team_token);
          }
          that.setData({
            team_token: res.data.team_token
          })
        } else {
          app.showModal({
            content: res.data
          });
          return
        }
      },
      fail: function() {
        that.requesting = false;
      },
      successStatusAbnormal: function() {
        that.requesting = false;
      }
    });
  },
  additionInfo: function(orderId) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/info',
      data: {
        additional_info: that.data.additional_info,
        sub_shop_app_id: that.franchisee_id || '',
        order_id: orderId
      },
      success: function(res) {
      }
    })
  },
  payOrder: function(orderId, teamToken) {
    var that = this;
    function paySuccess() {
      let goodsArr = [{
        goodsId: that.data.goods_id,
        num: that.data.num
      }];
      app.sendUseBehavior(goodsArr,1);
      app.sendUseBehavior(goodsArr,11); //黑沙转发 购物
      app.sendUseBehavior(goodsArr,4,2); //取消加购
      var pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + orderId + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group + '&teamToken=' + teamToken;
      if (!that.franchisee_id) {
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            sub_shop_app_id: that.franchisee_id || '',
            order_id: orderId
          },
          success: function(res) {
            if (res.valid == 0) {
              pagePath += '&collectBenefit=1';
            }
            that.saveUserFormId(function() {
              app.turnToPage(pagePath, 1);
            })
          }
        });
      } else {
        that.saveUserFormId(function() {
          app.turnToPage(pagePath, 1);
        })
      }
    }
    function payFail() {
      app.sendRequest({
        url: '/index.php?r=appShop/cancelOrder',
        data: {
          sub_shop_app_id: that.franchisee_id || '',
          order_id: orderId
        },
        success: () => {
          app.sendUseBehavior([{goodsId: orderId}],7); // 取消订单
          wx.navigateBack();
        }
      })
    }
    app.requestSubscribeMessage([{
      type: that.data.pickUpType == 3 ? 8 : 1,
      obj_id:orderId,
    },{
      type: 32,
      obj_id:orderId,
    }]).then(()=> {
      if (that.data.totalPayment == 0) {
        app.sendRequest({
          url: '/index.php?r=AppShop/paygoods',
          data: {
            sub_shop_app_id: that.franchisee_id || '',
            order_id: orderId,
            total_price: 0
          },
          success: function(res) {
            paySuccess();
          },
          fail: function() {
            payFail(orderId);
          },
          successStatusAbnormal: function() {
            payFail(orderId);
          },
          successShowModalConfirm: function(){
            app.turnBack();
          }
        });
        return;
      }
      app.sendRequest({
        url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
        data: {
          sub_shop_app_id: that.franchisee_id || '',
          order_id: orderId
        },
        success: function(res) {
          var param = res.data;
          param.orderId = orderId;
          param.success = function () {
            paySuccess();
          };
          param.goodsType = 0;
          param.fail = payFail;
          app.wxPay(param);
        },
        fail: function() {
          payFail();
        },
        successStatusAbnormal: function() {
          payFail();
        },
        successShowModalConfirm: function(){
          app.turnBack();
        }
      })
    })
  },
  showMemberDiscount: function() {
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectDiscountInfo);
  },
  afterSelectedBenefit: function(event) {
    this.setData({
      selectDiscountInfo: event.detail.selectedDiscount.name == '无' ? 'no_use_benefit' : event.detail.selectedDiscount,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  useBalanceChange: function(e) {
    this.setData({
      useBalance: e.detail.value
    });
    this.getCalculationInfo();
  },
  useCashDelivery: function(e) {
    if (this.data.selfPayOnDelivery == 0 && e.detail.value) {
      this.setData({
        is_self_delivery: false
      })
    }
    this.setData({
      cashOnDelivery: e.detail.value
    })
    this.getCalculationInfo();
  },
  formSubmit_collect(e) {
    let formid = this.data.formid;
    formid.push(e.detail.formId);
  },
  saveUserFormId(callback) {
    app.showLoading({
      title: '加载中'
    });
    var that = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
      method: 'post',
      data: {
        sub_shop_app_id: that.franchisee_id || '',
        form_id: that.data.formid || []
      },
      complete: function() {
        app.hideLoading();
        callback && callback();
        that.setData({
          formid: []
        })
      }
    })
  },
  addDeliveryImg: function() {
    let that = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let images = a[b][0].value || [];
    app.chooseImage((image) => {
      a[b][0].value = images.concat(image);
      that.setData({
        additional_info: a
      })
    }, 9 - a[b][0].value.length)
  },
  deleteImage: function(e) {
    let that = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let index = e.currentTarget.dataset.imageIndex;
    let images = a[b][0].value;
    images.splice(index, 1);
    a[b][0].value = images;
    that.setData({
      additional_info: a
    })
  },
  getNoAppointmentWord: function() {
    let a = '商家营业时间：';
    let b = '';
    let businessTimeRule = this.data.businessTimeRule;
    businessTimeRule.map((item) => {
      for (let i = 0; i < item.business_week.length; i++) {
        if (item.business_week[i] == 1) {
          switch (i) {
            case 0:
              a += '周一、';
              break;
            case 1:
              a += '周二、';
              break;
            case 2:
              a += '周三、';
              break;
            case 3:
              a += '周四、';
              break;
            case 4:
              a += '周五、';
              break;
            case 5:
              a += '周六、';
              break;
            case 6:
              a += '周日、';
              break;
          }
        }
      }
      item.business_time_interval.map((item) => {
        a += item.start_time + '-' + item.end_time + ' ';
      })
    })
    let appointment = this.data.getEcTostoredate.setting_data.appointment;
    let advanceInfo = appointment.advance_appointment_info;
    switch (advanceInfo.type) {
      case '1':
        b += '无需提前，';
        break;
      case '2':
        b += '需提前' + advanceInfo.num + '小时，';
        break;
      case '3':
        b += '需提前' + advanceInfo.num + '天，';
        break;
    }
    b += '最多可预约' + appointment.valid_days + '天内时间';
    this.setData({
      noAppointmentWorda: a,
      noAppointmentWordb: b
    })
  },
  getPhoneNumber: function(e) {
    let that = this;
    if (/getPhoneNumber:fail/.test(e.detail.errMsg)) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppUser/GetPhoneNumber',
      data: {
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      },
      success: function(res) {
        app.setUserInfoStorage({
          phone: res.data
        })
        that.setData({
          phone: res.data
        });
      },
      successStatus5: function() {
        app.goLogin({
          success: function() {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          },
          fail: function() {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          }
        });
      }
    });
  },
  inputPhone: function(e) {
    this.setData({
      phone: e.detail.value
    })
  },
  hidePerfectAddress: function() {
    this.setData({
      expressAddressNull: false
    })
  },
  getInStoreSeat: function() {
    var that = this;
    wx.scanCode({
      success: function(res) {
        let path = res.path;
        let locationId = path.split(/\?location_id=/)[1];
        app.sendRequest({
          url: '/index.php?r=AppEcommerce/getEcLocationData',
          data: {
            id: locationId,
            sub_shop_app_id: that.franchisee_id
          },
          success: function(res) {
            if (res.data.status == 0) {
              that.setData({
                locationId: locationId,
                inStoreSeatName: res.data.title
              })
            } else {
              app.showModal({
                content: '未检索到座位号'
              })
            }
          }
        })
      },
      fail: function(res) {
        app.showModal({
          content: '未检索到座位号'
        })
      }
    })
  },
  manuallyAddAddress: function() {
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/addAddress/addAddress');
  },
  importWeChatAddress: function() {
    let that = this;
    app.chooseAddress({
      success: function(res) {
        app.sendRequest({
          method: 'post',
          url: '/index.php?r=AppShop/AddWxAddress',
          data: {
            detailInfo: res.detailInfo || '',
            cityName: res.cityName || '',
            provinceName: res.provinceName || '',
            UserName: res.userName || '',
            telNumber: res.telNumber || '',
            district: res.district || '',
            countyName: res.countyName || ''
          },
          success: function() {
            that.getCalculationInfo();
          }
        })
      }
    })
  },
  selectedPayGift: function(e){
    const { detail } = e;
    let pagGiftData = {};
    if (detail.options) {
      pagGiftData = {
        id: detail.options.id,
        item_id: detail.options.item_id
      }
    }
    this.setData({
      payGiftOptions: pagGiftData
    })
    this.getCalculationInfo();
  },
  showSameJourneyTime: function (type) {
    let _this = this;
    let dataObj = {};
    dataObj = this.data;
    let sameJourneyData = this.data.selectSameJourney || {};
    if (dataObj.sameJourneyConfig && +dataObj.sameJourneyConfig.appointment_setting_data.status === 0) {  // 没有开启预约
      return;
    }
    if (!sameJourneyData.id && type != 'onlyImme') {
      app.showModal({
        content: '请先选择地址'
      })
      return
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getIntraCityAppointmentDateList',
      data: {
        sub_shop_app_id: _this.franchisee_id || '',
        longitude: sameJourneyData.latitude || 1,
        latitude: sameJourneyData.longitude || 10
      },
      success: function (res) {
        let data = res.data;
        let { appointment_setting_data } = data;
        let sameJourneyTimeType = 3;
        let sameJourneyDateTime = dataObj.sameJourneyDateTime;
        let sameJourneyHoursArr;
        let dateArr = data.date_arr;
        let advanceAppointmentInfo = appointment_setting_data.advance_appointment_info || { type: 3, num: 1 };
        let businessTimeRule = data.business_time_rule; // 门店的营业时间
        let sameJourneyImmediatelyState = 1;
        let noAppointmentShow = appointment_setting_data.status == 1;     // 是否显示暂无营业时间
        sameJourneyTimeType = appointment_setting_data.status == 1 ? appointment_setting_data.appointment_time_type : 3;       // 0为无预约 1为天 2为时 3为半小时
        if (_this.data.intraCityData.in_business_time  ==  0 || (appointment_setting_data.status == 1 && +advanceAppointmentInfo.num >= 1))  {
          sameJourneyImmediatelyState = 0;
        }
        for (let i = 0; i < dateArr.length; i++) {
          if (dateArr[i].is_vaild == 1) {
            noAppointmentShow = false;
          }
          if (!sameJourneyDateTime && dateArr[i].is_vaild == 1 && sameJourneyTimeType != 1) {
            sameJourneyDateTime = dateArr[i].date;
          }
          if (sameJourneyDateTime == dateArr[i].date) {
            sameJourneyHoursArr = dateArr[i].duration;
          }
        }
        _this.businessTimeType = businessTimeRule.type;
        _this.setData({
          sameJourneyConfig: data,
          sameJourneyTimeType,
          sameJourneyDateTime,
          sameJourneyHoursArr,
          businessTimeRule: businessTimeRule.type == 1 ? '' : businessTimeRule.custom.business_time,
          advanceAppointmentInfo: advanceAppointmentInfo,
          noAppointmentShow: noAppointmentShow,
          sameJourneyImmediatelyState: type == 'onlyImme' ? sameJourneyImmediatelyState : _this.data.sameJourneyImmediatelyState,
          isShowSameJourneyTime: type != 'onlyImme' && appointment_setting_data.status == 1,
        });
        noAppointmentShow && _this.getNoAppointmentWord();
      }
    });
  },
  selectSameJourneyTimeHour: function (e) {
    let { type, index } = e.currentTarget.dataset;
    let sameJourneyHoursArr = this.data.sameJourneyHoursArr;
    let sameJourneyHourTime = sameJourneyHoursArr[index];
    this.setData({
      sameJourneyImmediatelyState: type == 'immedia' ? 1 : 2,
      sameJourneyHourTime: type == 'immedia' ? '' : sameJourneyHourTime,
      isShowSameJourneyTime: false
    });
  },
  _mapIntraCityOptions() {
    let appointmentTime = '';
    let year = new Date().getFullYear();
    let dataObj = {}
    dataObj = this.data;
    if (dataObj.sameJourneyImmediatelyState == 1) {
      appointmentTime = ''
    } else {
      if (dataObj.sameJourneyTimeType === 1) {
        appointmentTime = dataObj.sameJourneyDateTime
      } else {
        appointmentTime = year + '-' + dataObj.sameJourneyDateTime + ' ' + dataObj.sameJourneyHourTime
      }
    }
    return {
      'intra_city_appointment_arrive_time': appointmentTime,
      'appointment_time_format': 1
    }
  },
})