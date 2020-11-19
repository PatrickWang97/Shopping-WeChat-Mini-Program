var app = getApp();
var utils = require('../../../utils/util.js');
Page({
  data: {
    page: 1,
    myTeams: {},
    formid: [],
    hasAdditionalInfo: false,
    coverList: [],
    goodsData: {
      goods_list: [],
      is_more: 1,
      curpage: 1,
      loading: false,
      loadingFail: false
    },
    orderId: '',
    status: 4,
    teamToken: '',
    needNum: 0,
    progress: 0,
    modelId: 0,
    memberList:[],
    showAll:false,
  },
  seckillFunc: [],
  isMore: 1,
  page: 1,
  onLoad: function(options) {
    this.setData({
      team_token: options.teamtoken,
      franchiseeId: options.franchisee || ''
    })
    this.pageInit();
  },
  onUnload() {
    let { status, transaction_id, new_appointment } = this.data.orderInfo;
    if (new_appointment && status != 4 && status != 5 && status != 7 && status != 0 && transaction_id != "seller_order" && this.data.myTeams.current_status >= 3) {
      this.hideWriteOffCodeBox();
    }
  },
  pageInit() {
    var _this = this;
    if (app.isLogin()) {
      _this.loadAll();
    } else {
      app.goLogin({
        success: function() {
          _this.loadAll();
        }
      });
    }
  },
  loadAll() {
    var _this = this;
    _this.loadMyTeams();
    this.setData({
      appName: app.globalData.appTitle,
      appLogo: app.globalData.appLogo
    })
  },
  loadMyTeams() {
    var _this = this;
    let memberList;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/teamInfo',
      data: {
        team_token: _this.data.team_token
      },
      success: res => {
        var coverList = [],
          myTeams = res.data,
          modelId = myTeams.model_id || '',
          coverObj = {},
          orderInfo = myTeams.order_info || '',
          goodsDetail = orderInfo.goods_info[0],
          orderId = orderInfo.order_id,
          progress = parseInt(Number(res.data.current_user_count / res.data.max_user_num) * 100),
          maxNum = Number(myTeams.max_user_num) || 0,
          needNum = (maxNum - myTeams.current_user_count) || '',
          hasAdditionalInfo = false,
          additional_info_goods = [],
          additional_goodsid_arr = [],
          originPrice = myTeams.virtual_price == '0.00' ? myTeams.goods_price : myTeams.virtual_price;
        myTeams.downCount = {
          hours: '00',
          minutes: '00',
          seconds: '00',
          days: '00'
        };
        if (orderInfo.additional_info) {
          for (var i = 0; i < orderInfo.goods_info.length; i++) {
            var deliveryId = orderInfo.goods_info[i].delivery_id,
              goodsId = orderInfo.goods_info[i].goods_id;
            if (deliveryId && deliveryId != '0' && additional_goodsid_arr.indexOf(goodsId) == -1) {
              additional_info_goods.push(orderInfo.goods_info[i]);
              additional_goodsid_arr.push(goodsId);
              hasAdditionalInfo = true;
            }
          }
        }
        if (myTeams.member) {
          memberList = myTeams.member.length > 5 ? myTeams.member.slice(0, 5) : myTeams.member;
          var coverTotalArr = myTeams.member || '',
            coverArr = [],
            numLack = myTeams.activity_type == 3 ? ((maxNum - coverTotalArr.length) + 1) : (maxNum - coverTotalArr.length),
            numLen = 0,
            coverLoading = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/loading-portrait.png'
            },
            coverUser = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/missing-head.png'
            },
            coverSuccess = {
              isNum: 0,
              image: 'http://cdn.jisuapp.cn//zhichi_frontend/static/webapp/images/group/success-loading.png'
            };
          for (let arrIndex in coverTotalArr) {
            coverObj = {
              isNum: 1,
              image: coverTotalArr[arrIndex]
            }
            coverArr.push(coverObj)
          }
          if (maxNum > 5) {
            switch (coverArr.length) {
              case 1:
                numLen = 2;
                break;
              case 2:
                numLen = 1;
                break;
              case 3:
                numLen = 0;
                break;
            }
            if (coverArr.length < 3) { //显示3个用户+1个等待+1个用户
              coverList = coverArr;
              for (var i = 0; i < numLen; i++) {
                coverList.push(coverUser);
              }
              coverList.push(coverLoading);
              coverList.push(coverUser);
            } else if (coverArr.length >= 3 && coverArr.length < 5) {
              for (var index in coverArr) {
                if (index < 3) {
                  coverList.push(coverArr[index]);
                }
              }
              coverList.push(coverLoading);
              coverList.push(coverUser);
            } else if (coverArr.length >= 5) {
              if (coverArr.length < maxNum) {
                for (var index in coverArr) {
                  if (index < 3) {
                    coverList.push(coverArr[index]);
                  }
                }
                coverList.push(coverLoading);
                coverList.push(coverUser);
              } else {
                for (var index in coverArr) {
                  if (index < 4) {
                    coverList.push(coverArr[index])
                  }
                }
                coverList.push(coverSuccess);
              }
            }
          } else {
            coverList = coverArr;
            for (let i = 0; i < numLack; i++) {
              coverList.push(coverUser);
            }
          }
        }
        myTeams.server_time = res.current_time;
        myTeams.seckill_end_time = utils.formatTime(new Date(myTeams.expired_time * 1000));
        if (myTeams.current_status == 0 || myTeams.current_status == 1) {
          _this.downcount = _this.beforeGroupDownCount(myTeams, _this, 'myTeams');
        } else if (myTeams.current_status == 2) {
          _this.downcount = _this.duringGroupDownCount(myTeams, _this, 'myTeams');
        }
        if (myTeams.parent_shop_app_id) {
          _this.setData({
            appId: myTeams.parent_shop_app_id,
            franchiseeId: myTeams.app_id
          })
        }
        app.setPreviewGoodsInfo(additional_info_goods);
        app.setGoodsAdditionalInfo(orderInfo.additional_info || {});
        _this.setData({
          memberList: memberList,
          isLeader: myTeams.is_leader,
          progress: progress,
          myTeams: myTeams,
          modelId: modelId,
          hasAdditionalInfo: hasAdditionalInfo,
          orderId: orderId,
          originPrice: originPrice,
          goodsId: myTeams.goods_id,
          activityId: myTeams.activity_id,
          team_token: orderInfo.team_token,
          member: coverList,
          goodsDetail: orderInfo.goods_info[0],
          needNum: needNum
        },()=>{ 
          if (goodsDetail.goods_type == 10) { //预约商品拼团 
            _this.formatAptData(orderInfo) 
          }
        })
        _this.loadList();
      }
    })
  },
  seeAdditionalInfo: function() {
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo');
  },
  beforeGroupDownCount: function(formData, page, path) {
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
        formData.server_time = formData.seckill_start_time;
        _this.downcount = _this.duringGroupDownCount(formData, page, path);
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
        if (path == "myTeams") {
          page.loadMyTeams();
        }
      }
    }, page, path + '.downCount');
    return downcount;
  },
  loadList() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/goodsList',
      data: {
        page: _this.page,
        page_size: 4,
        status: 1,
        app_id: _this.data.appId || '',
        sub_shop_app_id: _this.data.franchiseeId || ''
      },
      success: res => {
        let rdata = res.data,
          newdata = {},
          compid = 'goodsData',
          goodsList = this.data.goodsData.goods_list,
          length = goodsList.length,
          downcountArr = _this.downcountArr || [];
        for (let i = 0; i < rdata.length; i++) {
          let f = rdata[i];
          f.description = '';
          f.original_price = f.virtual_price == '0.00' ? f.original_price : f.virtual_price;
        }
        var dataArr = res.data;
        newdata[compid + '.goods_list'] = goodsList.concat(dataArr);
        newdata[compid + '.is_more'] = res.is_more;
        newdata[compid + '.curpage'] = 1;
        newdata[compid + '.loading'] = false;
        newdata[compid + '.loadingFail'] = false;
        _this.downcountArr = downcountArr;
        _this.setData(newdata);
        _this.page++;
        _this.isMore = res.is_more;
      }
    })
  },
  gotoDetail(e) {
    var _this = this,
      data = e.currentTarget.dataset,
      pageUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid + (this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : '');
    if (data.goodsType == 10) { //预约拼团 使用特定的商品详情
      pageUrl = '/tradeApt/pages/TYDetail/TYDetail?detail=' + data.goodsid + '&activeId=' + data.activityid + '&activeType=group' + (this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : '');
    }
    this.saveUserFormId(function() {
      app.turnToPage(pageUrl)
    })
  },
  copyOrderId() {
    let _this = this;
    wx.setClipboardData({
      data: _this.data.team_token,
      success: function(res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  openNewGroup: function() {
    let myTeams = this.data.myTeams;
    if (myTeams.enable_status == '0') {
      if(myTeams.order_info.goods_type == 14){
        app.turnToPage(`/tradeApt/pages/TYDetail/TYDetail?detail=${myTeams.goods_id}${(this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : '')}`);
      }else{
        app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + myTeams.goods_id + (this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : ''));
      }
      return;
    }
    var pathUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + this.data.myTeams.goods_id + '&activity_id=' + this.data.myTeams.activity_id + (this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : '');
    if (myTeams.order_info.goods_type == 14) { //预约拼团 使用特定的商品详情
      pathUrl = `/tradeApt/pages/TYDetail/TYDetail?detail=${myTeams.goods_id}&activeId=${myTeams.activity_id}&activeType=group${(this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : '')}`;
    }
    this.saveUserFormId(function() {
      app.turnToPage(pathUrl)
    })
  },
  showMyTeamList() {
    this.saveUserFormId(function() {
      app.turnToPage(`/group/pages/gpmyOrder/gpmyOrder?${this.data.goodsInfo.goods_type == 10?'&index=1':''}${this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : ''}`);
    })
  },
  inviteFriends: function() {
    let that = this;
    let myTeams = this.data.myTeams;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/getShareQRCode',
      data: {
        goods_id: myTeams.goods_id,
        activity_id: myTeams.activity_id,
        type: 6,
        text: myTeams.goods_title,
        price: myTeams.group_buy_price,
        virtual_price: that.data.originPrice,
        goods_img: myTeams.img_urls ? myTeams.img_urls[0] : myTeams.goods_cover,
        app_id: that.data.appId || '',
        sub_shop_app_id: that.data.franchiseeId || '',
        user_token: app.globalData.PromotionUserToken || '',
        team_token: myTeams.order_info.team_token,
        order_id: myTeams.order_info.order_id
      },
      success: function(res) {
        animation.bottom("0").step();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
  },
  saveUserFormId(callback) {
    app.showLoading({
      title: '加载中'
    });
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
      method: 'post',
      data: {
        form_id: _this.data.formid || [],
        app_id: _this.data.appId || '',
        sub_shop_app_id: _this.data.franchiseeId || ''
      },
      complete: function() {
        app.hideLoading();
        callback && callback();
        _this.setData({
          formid: []
        })
      }
    })
  },
  gotoOrderDetail() {
    var pageUrl = '/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=' + this.data.orderId + (this.data.franchiseeId ? '&franchisee=' + this.data.franchiseeId : '');
    app.turnToPage(pageUrl)
  },
  goDeliveryNavigation: function() {
    wx.openLocation({
      latitude: Number(this.data.myTeams.order_info.self_delivery_info.latitude),
      longitude: Number(this.data.myTeams.order_info.self_delivery_info.longitude),
      name: this.data.myTeams.order_info.self_delivery_info.address
    });
  },
  onReady: function() {
  },
  onShow: function() {
  },
  onHide: function() {
  },
  onUnload: function() {
    if (this.downcount) {
      this.downcount.clear();
    }
  },
  onPullDownRefresh: function() {
  },
  onReachBottom: function() {
    if (this.isMore) {
      this.loadList();
    }
  },
  onShareAppMessage: function() {
    var that = this,
      team_token = this.data.team_token,
      myTeams = this.data.myTeams,
      type = myTeams.activity_type,
      modelId = this.data.modelId,
      urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
      franchiseeParam = this.data.franchiseeId ? ('&franchisee=' + this.data.franchiseeId) : '',
      url = '/group/pages/gpgroupDetail/gpgroupDetail?teamtoken=' + team_token + '&orderId=' + that.data.orderId + franchiseeParam,
      nickname = app.getUserInfo('nickname'),
      share_cover = myTeams.share_cover ? myTeams.share_cover : 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
      title = myTeams.share_title ? myTeams.share_title : (nickname ? nickname + ' 喊你' : '') + '拼单啦~ ' + that.data.myTeams.group_buy_price + '元拼' + that.data.myTeams.goods_title + '，火爆抢购中......';
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
            add_time: addTime,
            app_id: that.data.appId || '',
            sub_shop_app_id: that.data.franchiseeId || ''
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
  formatAptData(orderInfo){ 
    let { status, transaction_id } = orderInfo, 
      goods_info = orderInfo.goods_info[0]; 
    let aptData = { 
      serveInfo: [], 
    }; 
    let new_appointment = goods_info.new_appointment, 
      doc_info = new_appointment.doc_info, 
      elem_info = new_appointment.elem_info.sort((a, b) => { return a.id - b.id });
    for (let i = 0; i < doc_info.length; i++) { 
      aptData.serveInfo.push({ 
        label: doc_info[i].name, 
        value: elem_info[i].name 
      }) 
    }; 
    aptData.title /**商品名 */ = goods_info.goods_name;
    aptData.cover /**封面 */ = goods_info.cover;
    if (orderInfo.new_appointment_info){ //预约 帮帮团  成员无该部分信息
      aptData.phone = orderInfo.new_appointment_info.phone || '';
      aptData.nickname = orderInfo.new_appointment_info.nickname || '';
      aptData.home_address = orderInfo.new_appointment_info.home_address || '';
      aptData.remark = orderInfo.new_appointment_info.remark || '';
    }
    this.setData({ 
      orderInfo: orderInfo, 
      aptData: aptData 
    }) 
    if (orderInfo.new_appointment_info && status != 4 && status != 5 && status != 7 && status != 0 && transaction_id != "seller_order" && this.data.myTeams.current_status >= 3) { 
      this.getWriteOffCodeBox() 
    } 
  }, 
  getWriteOffCodeBox: function () { 
    let _this = this; 
    let orderId = this.data.orderId; 
    let franchiseeId = this.data.franchiseeId; 
    app.sendRequest({ 
      url: '/index.php?r=AppShop/GetOrderVerifyCode', 
      data: { 
        'sub_shop_app_id': franchiseeId, 
        'order_id': orderId 
      }, 
      success: _this.setVerificationCodeData 
    }) 
  }, 
  setVerificationCodeData: function (res) { 
    let _this = this; 
    _this.setData({ 
      'codeImgUrl': util.showFullUrl(res.data.qrcode_url), 
      'codeNum': res.data.code, 
      'codeStatus': res.data.status 
    }); 
    _this.connectSocket(); 
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
  hideWriteOffCodeBox: function () { 
    var _this = this; 
    clearInterval(_this.verifiTimeInterval); 
    wx.closeSocket(); 
  }, 
  toSeeQrcode() { 
    let orderId = this.data.orderId, 
      franchiseeId = this.data.franchiseeId, 
      codeEndDate = this.data.aptData.endDate, 
      pagePath = '/tradeApt/pages/qrcode/qrcode?orderId=' + orderId + '&franchiseeId=' + franchiseeId + '&codeEndDate=' + 0; 
    app.turnToPage(pagePath); 
  }, 
  allMember() {
    let showAll = this.data.showAll;
    this.setData({
      showAll: !showAll
    })
  }
})