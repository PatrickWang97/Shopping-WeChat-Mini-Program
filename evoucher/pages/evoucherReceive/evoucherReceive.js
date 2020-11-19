const app = getApp();
Page({
  data: {
    isShowReceiveFailModal: false,
    id: '',         // 领取id
    buyerInfo: {},  // 赠送者信息
    goodsInfo: {},  // 商品信息
    status: 0,      // 电子卡券领取状态 0：未领取 1：已领取
    tipStr: ''
  },
  onLoad: function (options) {
    let id = options.id;
    this.setData({
      id: id
    });
  },
  onShow: function () {
    if (app.isLogin()) {
      this.getEvoucherData();
    } else {
      app.goLogin({
        success: () => {
          this.getEvoucherData();
        }
      });
    }
  },
  getEvoucherData: function () {
    let { id } = this.data;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetReceiveDetail',
      data: {
        id: id
      },
      success: (res) => {
        let { buyer_info, goods_info  } = res.data.form_data;
        let goodsInfo = goods_info[0];
        let goodsModel = goodsInfo.model_value;
        goodsInfo['model_value_str'] = goodsModel && goodsModel.join ? goodsModel.join('； ') : '';
        let validDate = this.returnValidDate(goodsInfo);
        goodsInfo['valid_date_str'] = validDate;
        this.setData({
          buyerInfo: buyer_info,
          goodsInfo: goodsInfo,
          status: res.data.status
        });
      }
    });
  },
  returnValidDate: function(goodsInfo) {
    let tempStr = '';
    tempStr = goodsInfo.valid_date_type == 1 ? '永久有效' : `${goodsInfo.valid_start_date}至${goodsInfo.valid_end_date}`;
    return tempStr;
  },
  recevieEvoucher: function() {
    let { id, status } = this.data;
    if (status == 1) {  // 已领取过了
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/ReceiveElectronicCard',
      data: {
        id: id
      },
      success: (res) => {
        if (res.invalid_word) {
          this.setData({
            tipStr: res.invalid_word
          });
          this.showModal();
        } else {
          app.showModal({
            content: '领取成功！',
            confirm: () => {
              app.turnToPage('/userCenter/pages/myEvoucher/myEvoucher', true);
            }
          });
        }
      }
    });
  },
  showModal: function () {
    this.setData({
      isShowReceiveFailModal: true,
    });
  },
  hideModal: function () {
    this.setData({
      isShowReceiveFailModal: false,
    });
  },
  turnToHomePage: function () {
    let homePage = app.getHomepageRouter();
    app.turnToPage(`/pages/${homePage}/${homePage}`);
  }
})