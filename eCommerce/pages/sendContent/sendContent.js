var app = getApp();
Page({
  data: {
    usrName: '',
    value: '',
    cardTitle: '',
    img: '',
  },
  order_id: '',
  id: '',
  card_num: '',
  card_type: '',
  p_id:'',
  shoppingCard_id:'',
  onLoad: function(options) {
    if (options.is_present === '2') {
      app.showModal({
        title:'提示',
        content:'该礼品卡不可赠送',
        showCancel:true,
        confirm:function(){
          app.turnBack();
        }
      })
      return;
    }
    if (options.card_type == 1) {
      let param = {
        status: options.status
      }
      options.card_num == 1 ? (options.id == undefined? param.order_id = options.order_id : param.id = options.id) : param.order_id = options.order_id;
      this.getGiftCardInfo(param);
    } else {
      let param = {} 
      options.card_num == 1 ? (options.id == undefined ? param.order_id = options.order_id : param.id = options.id) : param.order_id = options.order_id;
      this.getMyCardInfo(param);
    }
    this.card_num = options.card_num;
    this.id = options.id;
    this.order_id = options.order_id;
    this.card_type = options.card_type;
    this.p_id = options.p_id || app.globalData.p_id;    // 带上分销参数
  },
  onShareAppMessage: function(res) {
    let url, card;
    let send_time = Date.parse(new Date());
    send_time = send_time / 1000;
    if (this.card_type == 1) {
      url = `eCommerce/pages/getCard/getCard?&p_id=${this.p_id}&content=${this.data.value}&order_id=${this.order_id}&id=${this.id}&card_num=${this.card_num}&card_type=${1}`;
      card = '礼品卡'
    } else {
      url = `eCommerce/pages/getCard/getCard?&p_id=${this.p_id}&content=${this.data.value}&order_id=${this.order_id}&id=${this.shoppingCard_id}&card_num=${this.card_num}&card_type=${2}&send_time=${send_time}`;
      card = '购物卡'
    }
    if (res.from === 'button') {};
    return {
      title: `${this.data.usrName}送你了${card}，快来领取吧~`,
      path: url,
      imageUrl: this.data.img,
    };
  },
 getGiftCardInfo: function (param) {
  let _this = this;
  app.sendRequest({
    url: '/index.php?r=appGiftCard/GetUserGiftCard',
    data: param,
    success: function (res) {
      _this.setData({
        cardTitle: res.data.name,
        img: res.data.card_face,
        usrName: res.data.buyer_user_name
      })
    }
  })
},
getMyCardInfo: function (param) {
  let userInfo = wx.getStorageSync("userInfo");
  let _this = this;
  app.sendRequest({
    url: '/index.php?r=ShoppingCard/GetMyCardInfo',
    data: param,
    success: function (res) {
      _this.setData({
        cardTitle: res.data.title,
        img: res.data.covers[0],
        usrName: userInfo.nickname
      })
      _this.shoppingCard_id = res.data.id;  //获取购物卡卡id
    }
  })
},
  changeContent: function(e) {
    this.setData({
      value: e.detail.value
    })
  },
  sendCard: function() {
    let param = {};
    let url;
    let ids = [];
    this.card_num == 1 ? (this.id == undefined ? param.order_id = this.order_id : param.id = this.id) : param.order_id = this.order_id;
    this.card_type == 1 ? url = '/index.php?r=appGiftCard/PresentGiftCard' : url = '/index.php?r=ShoppingCard/SendCard'
    app.sendRequest({
      url: url,
      data: param,
      method: 'post',
      success: function (res) {
      }
    });
  }
})