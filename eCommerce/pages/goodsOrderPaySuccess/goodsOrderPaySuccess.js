import Scratch from "../../../utils/scratch.js"
var app = getApp();
var count_t;
var timer = null;
Page({
  data: {
    status: 0, // 0: 普通页面 1:有集集乐的情况
    orderId: '',
    franchiseeId: '',
    collectBenefitData: {}, // 集集乐数据
    starData: [], //集集乐的星 light:已集样式 dark:未集样式
    isFail:true,//刮刮乐未中奖
    isWinning:true,//刮刮乐中奖
    isComfort:true,//刮刮乐安慰奖
    isWhole:true,//刮奖区域是否显示
    scratchId: '',//活动号
    isShowteam: false,
    winingTitle:'',
    isScroll : true, //刮刮乐当在 canvas 中移动时且有绑定手势事件时禁止屏幕滚动以及下拉刷新
    ifWxCoupon:false,
    timestamp:'',
    signature:'',
    ifGetComfort:false,
    userInfo: {},
    total_price: '',    //购物卡礼品卡
    card_type: '',
    showInviteModal: false,  // 拉新有礼弹窗判断
  },
  card_num: '',
  order_id: '',
  id: '',
  onLoad: function (options) {
    if (options.card_type == 1 || options.card_type == 2) {
      this.setData({
        total_price: options.total_price,
        card_type: options.card_type,
      })
      this.order_id = options.order_id;
      this.card_num = options.num;
      this.id = options.id;
    }
    this.getPayWindow();
    let that = this;
    if(options.collectBenefit == 1){
      that.getCollectBenefitData(options.detail || options.order_id);
      that.setData({
        'status': 1
      });
    }
    that.setData({
      'orderId': options.detail || options.order_id,
      'franchiseeId': options.franchisee || '',
      'is_group': options.is_group || '',
      'code': options.code || '',
      'is_newAppointment': options.is_newAppointment || '',
      'isFranchisee':  options.isFranchisee == 1 ? true : false,  // 是否是多商家多店结算
      'trade_style': options.trade_style || '',
      'tpl_id':options.tpl_id || '',
      'userInfo': app.getUserInfo(),
      'is_present': options.is_present, // 是否可赠送
    });
    count_t = 0;
    if (options.card_type != 1 && options.card_type != 2) {
      that.getOrderDetail();
    }
    this.getAppECStoreConfig();
    let systemInfo = app.globalData.systemInfo;
    let width = 558 * systemInfo.windowWidth / 750;
    let height = 258 * systemInfo.windowWidth / 750;
    that.scratch = new Scratch(that, {
      canvasWidth: width,
      canvasHeight: height,
      imageResource: app.getSiteBaseUrl()+'/index.php?r=Download/DownloadResourceFromUrl&url=https://chn.jisuapp.cn/static/webapp/images/scratchMovie.png',
      maskColor: "red",
      r: 15,
      callback: () => {
        that.setData({
          hideCanvas: true
        })
        if (that.data.ifWxCoupon) {
          setTimeout(function(){
              that.toAddCard()
          },500)
        }
      },
      imgLoadCallback: () =>{
        setTimeout(function() {
          that.setData({
            isShowteam: true
          });
        }, 150);
      }
    });
  },
  touchStart: function(e){
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true)
  },
  touchMove:function(e){
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true) 
  },
  touchEnd:function(e){
    if (!this.isStart) return
    let { canvasWidth, canvasHeight, minX, minY, maxX, maxY } = this
    if (maxX - minX > .5 * canvasWidth && maxY - minY > .5 * canvasHeight) {
      this.ctx.draw()
      this.endCallBack && this.endCallBack()
      this.isStart = false
      this.page.setData({
        "isScroll": true
      })
    }
  },
  getGoldenData: function (id) {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getTimeAfterConsume",
      method: "post",
      data: {
        order_id: id,
        sub_app_id: that.data.franchiseeId
      },
      success: function (data) {
        if(data.data){
          if(that.data.code){
            that.setData({
              isWhole: true,
            })
          }else{
            that.setData({
              isWhole: false,
              scratchId: data.data
            })
          }
        }else{
          that.setData({
            isWhole: true,
          })
        }
        if (data.integral) {//支付获取积分
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
  showAreaClick:function(){
    let that=this;
    that.setData({
      isShowteam: false
    })
    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/lottery",
      hideLoading:true,
      data:{
        activity_id: that.data.scratchId,
        sub_app_id: that.data.franchiseeId
      },
      success:function(res){
        let data=res.data;
        that.scratch.start();
        if(data.title=='谢谢参与'){
          that.setData({
            isFail:false
          })
        }else{
            let params = {
                ifWxCoupon:data.card_id || false,
                timestamp:data.timestamp || '',
                signature: data.signature || ''
            };
            if (data.is_comfort) {
                params['isComfort'] = false;
            } else {
                params['isWinning'] = false;
                params['winingTitle'] = data.title;
            }
            that.setData(params)
        }
      }
    })
  },
  getCollectBenefitData: function(id){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppMarketing/CollectmeSendCoupon',
      data: {
        'order_id': id,
        sub_app_id: that.data.franchiseeId
      },
      hideLoading: true,
      success: function(res){     
        let starData = [];
        for(var i = 0; i < res.data.star_num; i++){
          starData.push('light');
        }
        for(var i = 0; i < res.data.collect_num - res.data.star_num; i++){
          starData.push('dark');
        }
        that.setData({
          'collectBenefitData': res.data,
          'starData': starData
        });
      }
    });
  },
  goToHomepage: function(){
    let router = app.getHomepageRouter();
    app.reLaunch({
      url:'/pages/' + router + '/' + router
    });
  },
  goToOrderDetail: function(e){
    let pickUpType = e.target.dataset.type ||'';
    let path = 'intraCityOrderDetail/intraCityOrderDetail?detail=';
    if (pickUpType == 4) {
      path = 'diningOrderDetail/diningOrderDetail?detail=';
    } else if (pickUpType == 1) {
      path = 'goodsOrderDetail/goodsOrderDetail?detail=';
    } else if (pickUpType == 6) {
      path = 'evoucherOrderDetail/evoucherOrderDetail?detail=';
    }
    let that = this;
    let pagePath = `${pickUpType != 6 ? '/eCommerce/pages/' : '/evoucher/pages/'}` + path + that.data.orderId  + ( that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '');
    let groupPath = '/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + that.data.orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '');
    let appointmentPath = '/eCommerce/pages/appointmentOrderDetail/appointmentOrderDetail?detail=' + that.data.orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '');
    let newAppointmentPath = '/newAppointment/pages/newAppointmentOrderDetail/newAppointmentOrderDetail?detail=' + that.data.orderId + (that.data.franchiseeId ? '&franchisee=' + that.data.franchiseeId : '') + '&aptType=' + this.data.is_newAppointment;
    let myOrderPage = `/eCommerce/pages/myOrder/myOrder?goodsType=0&currentIndex=0`;
    let tradeAptPath = `/tradeApt/pages/orderDetail/orderDetail?&f=${that.data.franchiseeId}&detail=${that.data.orderId}&tpl_id=${this.data.tpl_id}`
    if(this.data.is_group == 'true'){
      app.turnToPage(groupPath, true);
    }else if(this.data.code){
      app.turnToPage(appointmentPath, true);
    }else if(this.data.is_newAppointment){
      app.turnToPage(newAppointmentPath, true);
    }else if(this.data.isFranchisee) {
      app.turnToPage(myOrderPage, true);
    }else if(this.data.trade_style){
      app.turnToPage(tradeAptPath,true)
    }else{
      app.turnToPage(pagePath, true);
    }
  },
  getOrderDetail: function () {
    var _this = this;
    count_t++;
    app.getOrderDetail({
      data: {
        order_id: _this.data.orderId,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        const {status, data} = res;
        if(status === 0 && data.length){
          const { order_total_price, settlement_activity } = data[0].form_data
          if (settlement_activity && settlement_activity.item_price) {
            const { item_price, marketing_type, id } = settlement_activity;
            settlement_activity.path = +marketing_type === 1 ? '/eCommerce/pages/balance/balance' : '/eCommerce/pages/vipBenefits/vipBenefits?is_paid_card=1&id=' + id;
            settlement_activity.item_price = (+item_price).toFixed(2);
            _this.setData({
              settlement_activity
            })
          }
          _this.setData({
            orderInfo: res.data[0].form_data
          });
          _this.getGoldenData(_this.data.orderId);
        }
      },
      successStatusAbnormal: function (res) {
        if (count_t === 3){
          return true;
        }else {
          timer = setTimeout(function () {
            _this.getOrderDetail();
          }, 1000)
          return false;
        }
      }
    })
  },
  toAddCard: function () {
    let _data = this.data, wxcouponId = _data.ifWxCoupon, _this = this;
    wx.addCard({
      cardList: [{
        cardId: wxcouponId,
        cardExt: '{"nonce_str":"' + _data.timestamp + '","timestamp":"' + _data.timestamp + '", "signature":"' + _data.signature + '"}'
      }],
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
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        hasRecommendConfig: res.recommend_config ? true : false
      })
    }, this.data.franchiseeId);
  },
  trunToCardDetail: function () {
    let url;
    if (this.data.card_type == 1) {
      url = `/giftCard/pages/myGiftCardDetail/myGiftCardDetail?order_id=${this.order_id}&status=${1}&card_num=${this.card_num}`;
    } else {
      url = `/shoppingCard/pages/myShoppingCardDetail/myShoppingCardDetail?order_id=${this.order_id}&card_num=${this.card_num}`;
    }
    app.turnToPage(url);
  },
  sendCard: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appGiftCard/GetUserGiftCard',
      data: {
        stauts: 1,
        order_id: _this.order_id
      },
      success: function (res) {
        if (res.data.is_present !== '1') {
          app.showModal({
            content: '该购物卡不可赠送',
            confirm: function () {
              let url = `/giftCard/pages/myGiftCardsList/myGiftCardsList`;
              app.turnToPage(url);
              return;
            }
          })
        } else {
          let userInfo = wx.getStorageSync("userInfo");
          let user_token = userInfo.user_token;
          let url;
          if (_this.data.card_type == 1) {
            url = `/eCommerce/pages/sendContent/sendContent?order_id=${_this.order_id}&card_num=${_this.card_num}&card_type=${1}&status=${1}`;
          } else {
            url = `/eCommerce/pages/sendContent/sendContent?order_id=${_this.order_id}&card_num=${_this.card_num}&card_type=${2}&user_token=${user_token}`;
          }
          app.turnToPage(url);  
        }
      }
    })
  },
  checkActivity: function () {
    let franchiseeId = this.data.franchiseeId;
    app.turnToPage('/userCenter/pages/inviteRewards/inviteRewards'+'?franchiseeId='+franchiseeId);
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
