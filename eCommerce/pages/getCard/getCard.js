var app = getApp();
Page({
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    content: "",
    cardInfo: {},
    card_goods: [],
    toDeatil: false,
    card_type: "",
    description: "",
    getCardUser: "",
    is_more: 0, // 是否还有更多商品
    lastGoods: [] // 剩余商品
  },
  order_id: "",
  id: "",
  card_num: "",
  selfId: "",
  user_token: "",
  ids: [],
  send_time:'',
  onLoad: function (options) {
    let _this = this;
    wx.getSetting({
      success: function (res) {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: function (res) {
            }
          })
        }
      }
    })
    let userInfo = wx.getStorageSync("userInfo");
    this.user_token = options.user_token || "";
    this.setData({
      content: options.content,
      card_type: options.card_type,
      getCardUser: userInfo.user_token
    });
    this.order_id = options.order_id;
    this.id = options.id;
    this.card_num = options.card_num;
    this.send_time = options.send_time;
    if (options.card_type == 1) {
      this.getCardInfo(this.order_id, this.id, this.card_num);
    } else {
      this.getMyCardInfo(this.order_id, this.id, this.card_num);
    }
  },
  getCardInfo(order_id, id, card_num) {
    let _this = this;
    let param = {};
    card_num == 1 ? (id == 'undefined' ? param.order_id = order_id : param.id = id) : (param.order_id = order_id);
    app.sendRequest({
      url: "/index.php?r=appGiftCard/GetShareGiftCard",
      data: param,
      success: function (res) {
        if (res.data.can_receive_num == 0) {
          app.showModal({
            content: '来晚了，卡片已经被领完了'
          })
        }
        let goods_before;
        if (res.data.card_goods.length > 4) {
          goods_before = res.data.card_goods.slice(0, 4);
          _this.setData({
            lastGoods: res.data.card_goods.slice(4),
            is_more: 1
          });
        } else {
          goods_before = res.data.card_goods;
        }
        _this.setData({
          cardInfo: res.data,
          card_goods: goods_before
        });
        if (res.data.self_card_id != 0) {
          _this.selfId = res.data.self_card_id;
          _this.setData({
            toDeatil: true
          })
        }
      }
    });
  },
  getMoreGoods: function () {
    this.setData({
      is_more: 0,
      card_goods: this.data.card_goods.concat(this.data.lastGoods)
    });
  },
  getMyCardInfo: function (order_id, id, card_num) {
    let _this = this;
    let param = {};
    card_num == 1 ? (id == 'undefined' ? param.order_id = order_id : param.id = id) : (param.order_id = order_id);
    app.sendRequest({
      url: '/index.php?r=ShoppingCard/GetSendingCardInfo',
      data: param,
      success: function (res) {
        if (res.data.can_receive_num == 0) {
          app.showModal({
            content: '来晚了，卡片已经被领完了'
          })
        }
        let description; // 礼品卡说明 
        let str = res.data.description;
        description = str.indexOf('\\n') > 0 ? str.split('\\n') : str.split();
        _this.ids = res.data.send_record_ids;
        _this.setData({
          cardInfo: res.data,
          description: description,
        })
        if (res.data.self_card_id != 0) {
          _this.selfId = res.data.self_card_id;
          _this.setData({
            toDeatil: true
          })
        }
      }
    })
  },
  bindGetUserInfo: function (e) {
    if (this.data.card_type == 1 && this.data.cardInfo.can_receive_num == 0) {
      app.showModal({
        content: '来晚了，卡片已经被领完了'
      })
      return
    }
    if (e.detail.userInfo) {
      let _this = this;
      let url = this.data.card_type == 1 ? '/index.php?r=appGiftCard/ReceiveGiftCard' : '/index.php?r=ShoppingCard/ReceivingCard'
      let param = {};
      this.data.card_type == 1 ? (this.id == 'undefined' ? param.order_id = this.order_id : param.id = this.id) : (param.order_id = this.order_id);
      if (this.data.card_type != 1) {
        param.send_time = this.send_time,
        param.message = this.data.content
      }
      app.sendRequest({
        url: url,
        data: param,
        method: 'post',
        success: function (res) {
          if (res.data == '每个用户只能领取一次') {
            _this.setData({
              toDeatil: true
            })
          }else {
            app.showModal({
              content: '领取成功'
            })
            _this.selfId = res.data;
            _this.setData({
              toDeatil: true
            }) 
          }
        }
      })
    } else {
    }
  },
  turnToCardDetail: function () {
    let url;
    if (this.data.card_type == 1) {
      url = `/giftCard/pages/myGiftCardDetail/myGiftCardDetail?card_num=${1}&id=${this.selfId}`;
    } else {
      url = `/shoppingCard/pages/myShoppingCardDetail/myShoppingCardDetail?card_num=${1}&id=${this.selfId}`;
    }
    app.turnToPage(url);
  },
  goToHomepage: function () {
    let router = app.getHomepageRouter();
    app.turnToPage("/pages/" + router + "/" + router, true);
  }
})