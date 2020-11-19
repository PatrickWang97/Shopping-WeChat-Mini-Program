var app = getApp();
var utils = require('../../../utils/util.js');
var WxParse = require('../../../components/wxParse/wxParse.js');
const customEvent = require('../../../utils/custom_event.js');
Page({
  data: {
    addToShoppingCartHidden: true,
    addToGroupBuyCart: true,
    displayComment: true,
    imageOrVideo: 'image',
    ifOpenNewGroup: true,
    showTips: true,
    team_token: '',
    discountInfo: [],
    discountInfoArr: [],
    storeStyle: "",
    formid: [],
    isShowTopBar: true,
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      virtualPrice: '',
      buyCount: 1,
      models_text: '',
      leader_price: 0,
      member_price: 0,
      num_of_people: 0,
      groupBuyCount: 1,
      groupNum: ''
    },
    progress: '',
    teamInfo: {
      team_list: [],
      is_more: 1,
      curpage: 1,
      loading: false
    },
    imageOrVideo: 'image',
    scrollType: 'goods',
    carouselCurrentIndex: 1,
    isParticipate: false,
    isGroupMask: false,
    defaultPhoto: '',
    rect: [],
    screenHeight: 667,
    groupOptions: {
      0: { label: '普通团' },
      1: { label: '新人团' },
      2: { label: '阶梯团' },
      3: { label: '帮帮团' },
      4: { label: '抽奖团' }
    },
    isShowGroupNav: false,
    isVipLimit: false, // 是否达商品会员限购
    isGoodsLimit: false, // 是否商品件数限购
    scene: null
  },
  seckillFunc: [],
  page: 1,
  isMore: 1,
  allStock: '',
  onLoad: function(options) {
    if (app.globalData.appScene === 1154) {
      this.setData({
        scene: app.globalData.appScene
      })
    } else {
      this.setData({
        options: options
      })
    }
    var goodsId = options.goods_id,
      franchiseeId = options.franchisee,
      activityId = options.activity_id,
      defaultPhoto = app.getDefaultPhoto();
    var height = app.getSystemInfoData().screenHeight || 667;
    this.setData({
      team_token: options.teamToken || '',
      goodsId: goodsId || '',
      franchiseeId: franchiseeId || '',
      defaultPhoto: defaultPhoto,
      activityId: activityId,
      screenHeight: height,
      sessionFrom: options.franchisee || app.getAppId() || '',
    })
    this.loadAll();
    if (app.globalData.appScene === 1154) {
      this.setData({
        scene: app.globalData.appScene
      })
    }
  },
  loadAll() {
    var _this = this;
    _this.getAppECStoreConfig();
    _this.getGoodsLimit();
    _this.loadGoods();
  },
  loadGoods() {
    var _this = this,
      goodsModel = [],
      selectModels = [],
      modelStrs = {},
      description = '',
      modifySelectModels = '',
      price = 0,
      allStock = 0,
      selectStock, selectPrice, selectModelId, matchResult, selectVirtualPrice, selectText = '',
      selectGroupNum,
      leaderPrice, memberPrice, numOfPeople, i, j,
      selectImgurl = '';
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/getGoods',
      data: {
        activity_id: _this.data.activityId,
        goods_id: _this.data.goodsId,
        sub_shop_app_id: _this.data.franchiseeId || '',
        team_token: _this.data.team_token
      },
      success: res => {
        var goods = res.data.goods_info,
          groupData = res.data.group_buy_goods_info,
          discountInfo = groupData.discount_info,
          discountInfoArr = [],
          progress = Number(res.data.current_user_count / res.data.max_user_num) * 100,
          team_token = res.data.team_token,
          compid = 'goodsData';
        goods.downCount = {
          hours: '00',
          minutes: '00',
          seconds: '00',
          days: '00',
        };
        description = goods.description;
        goods.server_time = res.current_time;
        goods.seckill_end_time = utils.formatTime(new Date(res.data.end_date * 1000));
        goods.seckill_start_time = utils.formatTime(new Date(res.data.start_date * 1000));
        goods.status = res.data.status;
        if (goods.status == 0 || goods.status == 1 || goods.status == 2) {
          _this.downcount = _this.beforeGroupDownCount(goods,res.data, _this, 'goodsInfo');
        } else if (goods.status == 3) {
          if (res.data.end_date != '-1') {
            _this.downcount = _this.duringGroupDownCount(goods, _this, 'goodsInfo');
          }
        }
        description = description ? description.replace(/\u00A0|\u2028|\u2029|\uFEFF/g, '') : description;
        goods.description = description;
        goods.virtual_price = goods.virtual_price == '0.00' && goods.virtual_price? '' : goods.virtual_price;
        WxParse.wxParse('wxParseDescription', 'html', description, _this, 10);
        for (var key in goods.model) {
          if (key) {
            var model = goods.model[key];
            goodsModel.push(model);
          }
        }
        if (goods.model && goods.model_items.length) {
          let items = goods.model_items;
          let defaultGoods = items.find(item => item.stock > 0);
          price = defaultGoods.price;
          goods.highPrice = goods.highPrice > price ? goods.highPrice : price;
          goods.lowPrice = goods.lowPrice < price ? goods.lowPrice : price;
          selectPrice = price;
          selectGroupNum = Number(defaultGoods.num_of_people);
          memberPrice = defaultGoods.member_price || 0;
          leaderPrice = defaultGoods.leader_price || 0;
          selectStock = defaultGoods.stock;
          selectModelId = defaultGoods.id;
          selectImgurl = defaultGoods.img_url;
          selectVirtualPrice = defaultGoods.virtual_price != '0.00' && defaultGoods.virtual_price ? defaultGoods.virtual_price : '';
          allStock = Number(defaultGoods.stock) / groupData.num_of_people.length;
          selectModels = defaultGoods.model.split(',');
          selectText = defaultGoods.model_name.split('|').map(item=> `“${item}” `).join('');
        } else {
          selectPrice = goods.price;
          selectStock = goods.stock;
          selectImgurl = goods.cover;
          selectGroupNum = Number(discountInfo[0].num_of_people || groupData.goods_num);
          memberPrice = discountInfo[0].member_price || 0;
          leaderPrice = discountInfo[0].leader_price || 0;
          selectVirtualPrice = goods.virtual_price != '0.00' && goods.virtual_price ? goods.virtual_price : '';
        }
        for (var i = 0; i < discountInfo.length; i++) {
          if (discountInfo[i].model_id == selectModelId) {
            discountInfoArr.push(discountInfo[i]);
          }
        }
        goods.model = goodsModel;
        let expressSort = goods.goods_express_data.express_fee_sort;
        if (expressSort.length == 1) {
          let express = expressSort[0];
          if (express == 0) {
            goods.express_fee = '包邮';
          } else {
            goods.express_fee = express + '元';
          }
        } else {
          goods.express_fee = expressSort[0] + '~' + expressSort[1] + '元';
        }
        _this.setData({
          'selectModelInfo.models': selectModels || '',
          'selectModelInfo.stock': selectStock || '',
          'selectModelInfo.price': selectPrice || '',
          'selectModelInfo.groupNum': selectGroupNum || '',
          'selectModelInfo.modelId': selectModelId || '',
          'selectModelInfo.models_text': selectText || '',
          'selectModelInfo.imgurl': selectImgurl || '',
          'selectModelInfo.virtualPrice': selectVirtualPrice || '',
          'selectModelInfo.leader_price': leaderPrice || 0,
          'selectModelInfo.member_price': memberPrice || 0,
          'selectModelInfo.num_of_people': selectGroupNum,
          goods: res.data,
          goodsInfo: goods,
          discountInfoArr: discountInfoArr,
          team_token: team_token || '',
          groupInfo: groupData,
          discountInfo: groupData.discount_info,
          progress: progress
        })
        _this.getAssessList(0, 1);
        if (res.data.type != '4' && res.data.type != '3') {
          _this.loadTeamList(goods.id, groupData.activity_id, this.pageSize)
        }
      }
    })
  },
  onShareTimeline: function (e) {
    return {
      imageUrl: this.data.goodsInfo.share_img || '',
      title: this.data.goodsInfo.share_title || this.data.goodsInfo.title,
      query: app.getShareQuery(this.data.options || Object.assign(this.data.franchiseeInfo || {}, {isSubShop: true}))
    }
  },
  getAppECStoreConfig: function() {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        hidestock: (res.detail_fields && res.detail_fields.stock == 0) ? true : false,
        isShowVirtualPrice: (res.detail_fields && res.detail_fields.virtual_price == 1) ? true : false
      })
    }, this.data.franchiseeId);
  },
  beforeGroupDownCount: function(formData, res,page, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_start_time,
      showDays: true,
      callback: function() {
        let newData = {};
        newData[path + '.status'] = 3;
        newData[path + '.current_status'] = 3;
        newData[path + '.server_time'] = formData.seckill_start_time;
        page.setData(newData);
        page.loadGoods();
        formData.server_time = formData.seckill_start_time;
        if (res.end_date != '-1') {
          _this.downcount = _this.duringGroupDownCount(formData, page, path);
        }
      }
    }, page, path + '.downCount');
    return downcount;
  },
  duringGroupDownCount: function(formData, page, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_end_time,
      showDays: true,
      callback: function() {
        let newData = {};
        newData[path + '.status'] = 4;
        newData[path + '.current_status'] = 4;
        page.setData(newData);
      }
    }, page, path + '.downCount');
    return downcount;
  },
  loadTeamList(goodsId, activityId) {
    var _this = this,
      teamInfo = this.data.teamInfo;
    if (teamInfo.is_more == 0 && teamInfo.loading) {
      return;
    }
    this.setData({
      'teamInfo.loading': true
    });
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/getTeamListByGoods',
      data: {
        activity_id: activityId,
        goods_id: goodsId,
        sub_shop_app_id: _this.data.franchiseeId || '',
        page: this.page,
        page_size: 2
      },
      success: res => {
        let rdata = res.data,
          newdata = {},
          teamList = teamInfo.team_list,
          length = teamList.length,
          downcountArr = _this.downcountArr || [];
        for (let i = 0; i < rdata.length; i++) {
          let f = rdata[i],
            dc,
            teamLen = i + length;
          f.description = '';
          f.downCount = {
            hours: '00',
            minutes: '00',
            seconds: '00'
          };
          f.server_time = res.current_time;
          f.seckill_end_time = utils.formatTime(new Date(f.expired_time * 1000));
          let path = 'teamInfo.team_list[' + teamLen + ']';
          dc = app.seckillDownCount({
            startTime: f.server_time,
            endTime: f.seckill_end_time,
            callback: function() {
              let data = {};
              data[path + '.current_status'] = 3;
              data['teamInfo.count'] = teamInfo.count - 1;
              _this.setData(data);
            }
          }, _this, path + '.downCount');
          dc && downcountArr.push(dc);
        }
        newdata['teamInfo.team_list'] = teamList.concat(res.data);
        newdata['teamInfo.count'] = res.count;
        newdata['teamInfo.is_more'] = res.is_more;
        newdata['teamInfo.curpage'] = 1;
        newdata['teamInfo.loading'] = false;
        _this.downcountArr = downcountArr;
        _this.setData(newdata);
        _this.page++;
        _this.getRect();
      }
    })
  },
  showMoreTeams() {
    var pageSize = 10 + this.pageSize;
    this.loadTeamList(this.data.goodsId, this.data.activityId, pageSize);
    this.pageSize = pageSize;
  },
  singleBuy() {
    this.showCartHidden();
    this.setData({
      isGroupMask: false,
      isShowTopBar: false
    })
  },
  showProductSpecify() {
    this.showCartHidden();
    this.setData({
      isGroupMask: true,
    })
  },
  groupBuy() {
    this.showCartHidden();
    this.setData({
      isGroupMask: true,
    })
  },
  showCartHidden() {
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: true,
      imageOrVideo: 'image'
    })
  },
  hiddeAddToShoppingCart: function() {
    this.setData({
      addToShoppingCartHidden: true,
      isShowTopBar: true
    })
  },
  participateGroup: function(e) {
    var dataset = e.currentTarget.dataset;
    if (dataset.joined == '1') {
      if (dataset.type == '1') {
        app.showModal({
          content: '您已参加过拼团活动，无法参加该新人团'
        })
        return;
      } else {
        app.showModal({
          content: '您已参加过该团，不能重新参团'
        })
        return;
      }
    }
    this.setData({
      addToGroupBuyCart: false,
      ifOpenNewGroup: false,
      isParticipate: true,
      isShowTopBar: false,
      'selectModelInfo.groupNum': e.currentTarget.dataset.num,
      team_token: e.currentTarget.dataset.token
    })
    this.resetSelectCountPrice();
  },
  hideGroupBuyCart: function() {
    this.setData({
      addToGroupBuyCart: true,
      isShowTopBar: true
    })
  },
  showMoreTips: function() {
    var showTips = !this.data.showTips;
    this.setData({
      showTips: showTips
    })
  },
  hideMask: function() {
    this.setData({
      showTips: true
    })
  },
  getRect() {
    this.selectQuery('goods');
    this.selectQuery('group');
    this.selectQuery('comment');
    this.selectQuery('detail');
  },
  selectQuery: function(id) {
    const query = wx.createSelectorQuery(),
      _this = this;
    const idIndex = {
      goods: 0,
      group: 1,
      comment: 2,
      detail: 3
    };
    query.select('#' + id).boundingClientRect(function(res) {
      let newdata = {};
      newdata['rect[' + idIndex[id] + '].top'] = res ? Math.max(res.top + 70, 0) : 0;
      newdata['rect[' + idIndex[id] + '].name'] = id;
      _this.setData(newdata);
    })
    query.selectViewport().scrollOffset(function(res) {
      res.scrollTop // 显示区域的竖直滚动位置
    })
    query.exec()
  },
  goToPlaylaws: function() {
    var path = '/group/pages/gpplaylaws/gpplaylaws?activityType=' + this.data.goods.type + '&autoRefund=' + this.data.goods.auto_refund + '&refundMode=' + this.data.goods.refund_mode + (this.data.franchiseeId ? ('&franchisee=' + this.data.franchiseeId) : '');
    this.saveUserFormId(function() {
      app.turnToPage(path);
    })
  },
  hiddeAddToShoppingCart: function() {
    this.setData({
      addToShoppingCartHidden: true,
      isShowTopBar: true
    })
  },
  carouselIndex: function(event) {
    this.setData({
      carouselCurrentIndex: event.detail.current + 1
    })
  },
  showQRCodeComponent: function() {
    let that = this;
    let goodsInfo = this.data.goodsInfo;
    let groupInfo = this.data.groupInfo;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/getShareQRCode',
      data: {
        goods_id: that.data.goodsId,
        activity_id: that.data.activityId,
        sub_shop_app_id: that.data.franchiseeId || '',
        virtual_price: goodsInfo.virtual_price = '0.00' && goodsInfo.virtual_price? goodsInfo.price : goodsInfo.virtual_price,
        type: 6,
        text: goodsInfo.title,
        price: groupInfo.group_buy_price,
        goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover,
        user_token: app.globalData.PromotionUserToken || ''
      },
      success: function(res) {
        const data = res.data;
        let groupType = '';
        let canvasStyle = goodsInfo.poster_css == 2 ? { width: 493, height: 745 } : { width: 616, height: 996 }
        if (that.data.goods.type == 0) {
          groupType = groupInfo.num_of_people.length > 1 ? '多人团' : groupInfo.num_of_people[0] + '人团';
        } else {
          groupType = that.data.groupOptions[that.data.goods.type].label
        }
        Object.assign(data, {
          isGroup: 1,
          groupType,
          originPrice: goodsInfo.price,
          stock: goodsInfo.stock
        })
        animation.bottom("0").step();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": data,
          "pageQRCodeData.animation": animation.export(),
          "pageQRCodeData.goodsType": 1,
          "pageQRCodeData.drawType": goodsInfo.poster_css || 1,
          "pageQRCodeData.canvasStyle": canvasStyle
        })
      }
    })
  },
  getAssessList: function(commnetType, page, append) {
    var that = this;
    app.getAssessList({
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: commnetType
        },
        page: page,
        page_size: 20,
        sub_shop_app_id: this.data.franchiseeId || ''
      },
      success: function(res) {
        var commentData = res.data;
        if (append) {
          commentData = that.data.commentArr.concat(commentData);
        }
        that.setData({
          commentArr: commentData,
          commentNums: res.num,
          commentPage: that.data.commentPage + 1,
          commentExample: res.data[0] || '',
          commentTotalPage: res.total_page,
          displayComment: +res.num[0] > 0 ? false : true,
          'rect[2].isShow': +res.num[0] > 0
        })
        that.getRect();
      }
    });
  },
  selectSubModel: function(e) {
    var dataset = e.target.dataset,
      modelIndex = dataset.modelIndex,
      submodelIndex = dataset.submodelIndex,
      data = {},
      selectModelsInfo = this.data.selectModelInfo,
      selectModels = this.data.selectModelInfo.models,
      model = this.data.goodsInfo.model,
      text = '';
    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if (selectModels[i] == selectSubModelId[j]) {
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
    data['selectModelInfo.models'] = selectModels;
    data['selectModelInfo.models_text'] = text;
    this.setData(data);
    this.resetSelectCountPrice();
  },
  resetSelectCountPrice: function() {
    var selectModelIds = this.data.selectModelInfo.models.join(','),
      modelItems = this.data.goodsInfo.model_items,
      discountInfo = this.data.discountInfo,
      groupType = this.data.goods.type,
      discountInfoArr = [],
      data = {};
    for (var i = modelItems.length - 1; i >= 0; i--) {
      if (modelItems[i].model) {
        if (modelItems[i].model == selectModelIds) {
          if (groupType == 4 || (groupType != 4 && modelItems[i].num_of_people == this.data.selectModelInfo.groupNum)) {   // 特殊处理：抽奖团没有成团人数
            data['selectModelInfo.stock'] = modelItems[i].stock;
            data['selectModelInfo.virtualPrice'] = modelItems[i].virtual_price != '0.00' && modelItems[i].virtual_price ? (modelItems[i].virtual_price || '') : '';
            data['selectModelInfo.price'] = modelItems[i].price;
            data['selectModelInfo.member_price'] = modelItems[i].member_price || 0;
            data['selectModelInfo.leader_price'] = modelItems[i].leader_price || 0;
            data['selectModelInfo.modelId'] = modelItems[i].id || '';
            data['selectModelInfo.imgurl'] = modelItems[i].img_url || '';
            break;
          }
        }
      } else {
        if (groupType == 4 || (groupType != 4 && modelItems[i].num_of_people == this.data.selectModelInfo.groupNum)) {
          data['selectModelInfo.stock'] = modelItems[i].stock;
          data['selectModelInfo.price'] = modelItems[i].price;
          data['selectModelInfo.virtualPrice'] = modelItems[i].virtual_price != '0.00' && modelItems[i].virtual_price ? modelItems[i].virtual_price : '';
          data['selectModelInfo.member_price'] = modelItems[i].member_price || 0;
          data['selectModelInfo.leader_price'] = modelItems[i].leader_price || 0;
          data['selectModelInfo.modelId'] = modelItems[i].id || '';
          data['selectModelInfo.imgurl'] = modelItems[i].img_url || '';
          break;
        }
      }
    }
    for (let i = 0; i < discountInfo.length; i++) {
      if (discountInfo[i].model_id == data['selectModelInfo.modelId'] || (discountInfo[i].model_id === undefined && !data['selectModelInfo.modelId'])) {
        discountInfoArr.push(discountInfo[i])
      }
    }
    data['discountInfoArr'] = discountInfoArr;
    this.setData(data);
  },
  clickMinusButton: function(e) {
    var count = this.data.selectModelInfo.buyCount;
    if (count <= 1) {
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count - 1,
      'selectModelInfo.groupBuyCount': count - 1
    });
  },
  sureJoinGroup: function(e) {
    let that = this;
    if(!app.isLogin()){
      app.goLogin({
        success: function () {
          that.sureJoinGroup(e);
        }
      });
      return;
    }
    let franchiseeId = this.data.franchiseeId,
      selectmodel = JSON.stringify(this.data.selectModelInfo),
      goodsId = this.data.goodsId,
      activityId = this.data.activityId,
      modelId = this.data.selectModelInfo.modelId || '',
      num = this.data.selectModelInfo.groupBuyCount,
      numOfPeople = this.data.selectModelInfo.groupNum || '',
      sub_shop_app_id = franchiseeId || '',
      is_group_buy = 1,
      limit_buy = +this.data.goods.user_goods_limit_buy || +this.data.goods.user_limit_buy,
      team_token = this.data.team_token || '';
    if (this.data.selectModelInfo.stock == 0) {
      app.showModal({
        content: '商品库存不足'
      })
      return;
    }
    if (that.data.goods.type == 3 && that.data.goods.is_leader == 0) {
      app.sendRequest({
        url: '/index.php?r=appGroupBuy/addOrder',
        method: 'post',
        data: {
          goods_id: goodsId,
          activity_id: activityId,
          sub_shop_app_id: that.data.franchiseeId || this.data.groupInfo.parent_app_id || '',
          model_id: modelId || '',
          num: num,
          num_of_people: numOfPeople,
          team_token: team_token,
          select_benefit: '',
          is_balance: 0,
          use_balance: 0,
          address_id: '',
        },
        success: function(res) {
          if (res.status == 0) {
            var data = res.data;
            app.requestSubscribeMessage([{
              type: 32, obj_id: res.data.order_id,
            }]).then(()=> {
              if (that.data.cashOnDelivery) {
                let pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + res.data.order_id + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group + '&orderid=' + res.data.order_id + '&teamToken=' + res.data.team_token
                that.saveUserFormId(function() {
                  app.turnToPage(pagePath, 1);
                })
              } else {
                that.payOrder(res.data.order_id, res.data.team_token);
              }
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
    } else {
      var pagePath = '/group/pages/previewGroupOrder/previewGroupOrder?goodsid=' + goodsId + '&activityid=' + that.data.activityId + '&num=' + num + '&modelId=' + modelId + '&numOfPeople=' + numOfPeople + '&is_group=true' + '&group_buy_people=' + that.data.selectModelInfo.groupNum + '&is_group_buy=' + is_group_buy + '&limit_buy=' + limit_buy + '&groupType=' + that.data.goods.type + '&team_token=' + team_token + '&isFrom=true' + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '') + '&parent_app_id=' + this.data.groupInfo.parent_app_id;
      that.saveUserFormId(function() {
        franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
        that.setData({
          addToGroupBuyCart: true,
          isShowTopBar: true
        })
        app.turnToPage(pagePath);
      })
    }
  },
  payOrder: function(orderId, teamToken) {
    var that = this;
    function paySuccess() {
      var pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '') + '&is_group=' + !!that.is_group + '&teamToken=' + teamToken;
      if (!that.franchisee_id) {
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId || ''
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
      that.saveUserFormId(function() {
        app.turnToPage('../pluginOrderDetail/pluginOrderDetail?order_id=' + orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : ''), 1);
      })
    }
    if (this.data.totalPayment == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          sub_shop_app_id: that.data.franchiseeId || '',
          total_price: 0
        },
        success: function(res) {
          paySuccess();
        },
        fail: function() {
          payFail();
        },
        successStatusAbnormal: function() {
          payFail();
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId,
        sub_shop_app_id: that.data.franchiseeId || '',
      },
      success: function(res) {
        var param = res.data;
        param.orderId = orderId;
        param.success = paySuccess;
        param.goodsType = 0;
        param.fail = payFail;
        app.wxPay(param);
      },
      fail: function() {
        payFail();
      },
      successStatusAbnormal: function() {
        payFail();
      }
    })
  },
  confirmPayment: function(e) {
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/addOrder',
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        activity_id: that.data.activityId,
        sub_shop_app_id: that.data.franchiseeId || this.data.groupInfo.parent_app_id || '',
        model_id: modelId = this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.groupBuyCount,
        num_of_people: this.data.selectModelInfo.groupNum || '',
        team_token: that.data.team_token || '',
        formId: e.detail.formId,
        select_benefit: that.data.selectDiscountInfo,
        is_balance: that.data.useBalance ? 1 : 0,
        is_self_delivery: that.data.is_self_delivery,
        self_delivery_app_store_id: that.data.is_self_delivery == 1 ? that.data.selectDelivery.id : '',
        remark: that.data.description,
        address_id: that.data.selectAddress.id || that.data.selectDelivery.id,
        is_pay_on_delivery: that.data.cashOnDelivery ? 1 : 0,
        additional_info: that.additional_info,
        express_fee: that.data.express_fee,
      },
      success: function(res) {
        var data = res.data;
        if (res.status == 0) {
          if (that.data.cashOnDelivery) {
            let pagePath = '/group/pages/gppaySuccess/gppaySuccess?detail=' + res.data.order_id + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '') + '&is_group=' + !!that.is_group + '&orderid=' + res.data.order_id + '&teamToken=' + res.data.team_token;
            that.saveUserFormId(function() {
              app.turnToPage(pagePath, 1);
            })
          } else {
            that.payOrder(res.data.order_id, res.data.team_token);
          }
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
  clickPlusButton: function(e) {
    var type = e.currentTarget.dataset.type,
      selectModelInfo = this.data.selectModelInfo,
      goodsInfo = this.data.goodsInfo,
      count = selectModelInfo.buyCount,
      limit_buy = +this.data.goods.user_goods_limit_buy || +this.data.goods.user_limit_buy,
      stock = selectModelInfo.stock;
    if (limit_buy != 0 && selectModelInfo.buyCount >= limit_buy && type == "group") {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + limit_buy + '件）',
      });
      this.setData({
        'selectModelInfo.buyCount': limit_buy,
        'selectModelInfo.groupBuyCount': limit_buy
      })
      return;
    }
    if (count >= stock && this.data.goods.type != 4) {
      app.showModal({
        content: '购买数量不能大于库存'
      });
      this.setData({
        'selectModelInfo.buyCount': stock,
        'selectModelInfo.groupBuyCount': stock
      })
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count + 1,
      'selectModelInfo.groupBuyCount': count + 1
    });
  },
  clickGroupMinusButton: function(e) {
    var count = this.data.selectModelInfo.groupBuyCount;
    if (count <= 1) {
      return;
    }
    this.setData({
      'selectModelInfo.groupBuyCount': count - 1
    });
  },
  clickGroupPlusButton: function(e) {
    var selectModelInfo = this.data.selectModelInfo,
      count = selectModelInfo.groupBuyCount,
      stock = selectModelInfo.stock,
      max = +this.data.goods.user_goods_limit_buy || +this.data.goods.user_limit_buy;
    if (count >= stock || count >= max) {
      return;
    }
    this.setData({
      'selectModelInfo.groupBuyCount': count + 1
    });
  },
  selectGroupNum: function(e) {
    this.setData({
      'selectModelInfo.groupNum': e.currentTarget.dataset.num
    });
    this.resetSelectCountPrice();
  },
  inputBuyCount: function(e) {
    var count = +e.detail.value,
      selectModelInfo = this.data.selectModelInfo,
      goodsInfo = this.data.goodsInfo,
      stock = +selectModelInfo.stock,
      limit_buy = +this.data.goods.user_goods_limit_buy || +this.data.goods.user_limit_buy;
    if (count > limit_buy && limit_buy != 0) {
      app.showModal({
        content: '已超过该商品的限购件数（每人限购' + limit_buy + '件）',
      });
      this.setData({
        'selectModelInfo.buyCount': +limit_buy,
        'selectModelInfo.groupBuyCount': +limit_buy
      })
      return;
    }
    if (count == 0) {
      this.setData({
        'selectModelInfo.buyCount': 1
      });
      return;
    }
    if (count >= stock) {
      app.showModal({
        content: '购买数量不能大于库存',
      });
      this.setData({
        'selectModelInfo.buyCount': +stock,
        'selectModelInfo.groupBuyCount': +stock
      });
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': +count,
      'selectModelInfo.groupBuyCount': +count
    });
  },
  clickPlusImages: function(e) {
    app.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  goToHomepage: function() {
    let that = this;
    let franchiseeId = that.data.franchiseeId;
    let chainId = app.getChainId();
    if (franchiseeId && franchiseeId != chainId) {
      let pages = getCurrentPages();
      let p = pages[pages.length - 2];
      if (p && p.route == 'franchisee/pages/goodsMore/goodsMore') {
        app.turnBack({
          delta: 2
        });
      } else {
        customEvent.clickEventHandler['to-franchisee']({'franchisee-id': franchiseeId});
      }
    } else {
      var router = app.getHomepageRouter();
      app.reLaunch({
        url: '/pages/' + router + '/' + router
      });
    }
  },
  changeImageOrVideo: function(event) {
    this.setData({
      videoPoster: false,
      imageOrVideo: event.currentTarget.dataset.type
    })
  },
  startPlayVideo: function() {
    let video = wx.createVideoContext('carousel-video');
    this.setData({
      videoPoster: true
    })
    video.play();
  },
  addFavoriteGoods: function(event) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/addFavoriteGoods',
      data: {
        form_id: event.detail.formId,
        goods_id: _this.data.goodsId,
        sub_shop_app_id: _this.data.franchiseeId || ''
      },
      success: function(res) {
        _this.setData({
          'goods.is_favorite': 1
        })
        app.sendUseBehavior([{goodsId: _this.data.goodsId}],3);
      },
      complete: function() {
        wx.showToast({
          title: '收藏成功!',
          image: '/images/favorites.png'
        })
      }
    })
  },
  deleteFavoriteGoods: function(e) {
    let formid = this.data.formid;
    formid.push(e.detail.formId);
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteFavoriteGoods',
      method: 'post',
      data: {
        goods_id_arr: [_this.data.goodsId],
        sub_shop_app_id: _this.data.franchiseeId || ''
      },
      success: function(res) {
        _this.setData({
          'goods.is_favorite': 0
        })
        app.sendUseBehavior([{goodsId: _this.data.goodsId}],3,2);
      },
      complete: function() {
        wx.showToast({
          title: '取消收藏!',
          image: '/images/cancel-favorites.png'
        })
      }
    })
  },
  sureAddToShoppingCart: function() {
    if (this.data.goods.type == 4) {
      app.showModal({
        content: '参与抽奖商品不能加入购物车'
      })
      return;
    }
    var that = this,
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: this.data.franchiseeId || '',
        is_seckill: this.data.isSeckill ? 1 : ''
      };
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function(res) {
        app.showToast({
          title: '添加成功',
          icon: 'success'
        });
        setTimeout(function() {
          that.hiddeAddToShoppingCart();
        }, 1000);
      }
    })
  },
  showGroupBuy: function() {
    let team_token = this.data.team_token,
      goodsInfo = this.data.goodsInfo;
    if (goodsInfo.status == 4) {
      app.showModal({
        content: '当前拼团已结束'
      });
      return;
    }
    if (goodsInfo.status == 0 || goodsInfo.status == 1 || goodsInfo.status == 2) {
      app.showModal({
        content: '当前拼团活动未开启'
      })
      return;
    }
    if (this.data.goods.type != 4) {
      team_token = '';
    }
    this.setData({
      team_token: team_token,
      addToGroupBuyCart: false,
      ifOpenNewGroup: false,
      isParticipate: false,
      isShowTopBar: false
    })
  },
  buyDirectlyNextStep: function(e) {
    var franchiseeId = this.data.franchiseeId,
      that = this,
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: franchiseeId || '',
        is_seckill: this.data.isSeckill ? 1 : ''
      };
    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function(res) {
        var cart_arr = [res.data],
          pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cart_arr);
        that.saveUserFormId(function() {
          franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
          that.hiddeAddToShoppingCart();
          app.turnToPage(pagePath);
        })
      }
    })
  },
  remainMe(e) {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/careActivity',
      data: {
        data_id: _this.data.goodsId,
        activity_id: _this.data.activityId,
        sub_shop_app_id: _this.data.franchiseeId || '',
        activity_type: 0
      },
      success: res => {
        var newdata = {};
        app.showToast({
          title: '提醒成功！',
          duration: 2000
        })
        newdata['goodsInfo.status'] = 2
        _this.setData(newdata);
      }
    })
    _this.saveUserFormId();
  },
  goToCommentPage: function() {
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/goodsComment/goodsComment?detail=' + this.data.goodsId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    this.saveUserFormId(function() {
      app.turnToPage(pagePath);
    })
  },
  clickCommentLabel: function(e) {
    var commentType = e.target.dataset.type,
      data = {};
    data.commentPage = 1;
    data.commnetType = commentType;
    this.setData(data);
    this.getAssessList(commentType, 1);
  },
  formSubmit_collect(e) {
    let formid = this.data.formid;
    formid.push(e.detail.formId);
  },
  saveUserFormId(callback) {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
      method: 'post',
      data: {
        sub_shop_app_id: _this.data.franchiseeId || '',
        form_id: _this.data.formid || []
      },
      complete: function() {
        callback && callback();
        _this.setData({
          formid: []
        })
      }
    })
  },
  soonOpen() {
    app.showModal({
      content: '当前拼团未开启'
    })
  },
  groupNavTo: function(e){
    const type = e.currentTarget.dataset.type;
    const rect = this.data.rect;
    const curr = rect.find((item) => item.name === type) || rect[0];
    const sh = app.getSystemInfoData().screenHeight || 667;
    if (!rect.length) { return; }
    wx.pageScrollTo({
      scrollTop: Math.max(curr.top - sh + 240, 0)
    })
  },
  onUnload: function() {
    if (this.downcount) {
      this.downcount.clear();
    };
    if (this.downcountArr && this.downcountArr.length) {
      this.downcountArr = this.downcountArr.concat().reverse();
      for (let i = 0; i < this.downcountArr.length; i++) {
        this.downcountArr[i] && this.downcountArr[i].clear();
      }
    }
  },
  onPageScroll: function(e) {
    const st = e.scrollTop;
    const sh = app.getSystemInfoData().screenHeight || 667;
    const rect = this.data.rect;
    const data = rect.filter((item) => st + sh - 140 >= item.top && item.isShow !== false);
    const scrollType = data.length ? data[data.length - 1].name : 'goods';
    this.setData({
      isShowGroupNav: st >= 74,
      scrollTop: st,
      scrollType
    })
  },
  onShareAppMessage: function() {
    var that = this,
      goodsId = this.data.goodsId,
      groupInfo = this.data.groupInfo,
      activityId = this.data.activityId,
      contact = this.data.contact,
      franchiseeId = this.data.franchiseeId,
      urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
      url = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + goodsId + '&activity_id=' + activityId + '&contact=' + contact + (franchiseeId ? '&franchisee=' + franchiseeId : '') + (app.globalData.pageShareKey ? ('&psid=' + app.globalData.pageShareKey) : '') + urlPromotion,
      share_cover = groupInfo.share_cover ? groupInfo.share_cover : 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
      nickname = app.getUserInfo('nickname'),
      title = groupInfo.share_title ? groupInfo.share_title : (nickname ? nickname + ' 喊你' : '') + '拼单啦~ ' + this.data.groupInfo.group_buy_price + '元拼' + this.data.goodsInfo.title + '，火爆抢购中......';
    app.sendUseBehavior([{goodsId: goodsId}],2);
    return app.shareAppMessage({
      title: title,
      path: url,
      imageUrl: share_cover,
      success: function(addTime) {
        app.showToast({
          title: '转发成功',
          duration: 500
        });
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=appShop/getIntegralLog',
          data: {
            sub_shop_app_id: _this.data.franchiseeId,
            add_time: addTime
          },
          success: function(res) {
            if (res.status == 0) {
              res.data && that.setData({
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
    });
  },
  getGoodsLimit: function () {
    let that = this;
    app.getGoodsLimit(this.data.goodsId, this.data.franchiseeId).then((data) => {
      if (data) {
        that.setData({
          isVipLimit: !data.vip_limit, // 会员限购
          isGoodsLimit: !data.goods_limit, // 商品限购
        });
      }
    });
  },
})