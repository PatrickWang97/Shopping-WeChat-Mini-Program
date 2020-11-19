var app = getApp();
Component({
  properties: {},
  data: {
    codeInputExist: false, // 兑换卡显隐
    exchangeCodeValue: '', // 兑换码
  },
  methods: {
    showCodeInput: function() {
      this.setData({
        codeInputExist: true
      })
    },
    closeCodeInput: function() {
      this.setData({
        codeInputExist: false,
        exchangeCodeValue: ''
      })
    },
    changeCodeInput: function(e) {
      this.setData({
        exchangeCodeValue: e.detail.value
      })
    },
    confirmExchange: function() {
      let that = this;
      if (that.data.exchangeCodeValue === '') {
        app.showModal({ content: '兑换码不能为空' });
        return;
      }
      app.sendRequest({
        url: '/index.php?r=appGiftCard/Exchange',
        data: {
          code: that.data.exchangeCodeValue,
          type: 0 // 校验数据
        },
        success: function(res) {
          console.log(res);
          if (res['status'] !== 0) {
            app.showModal({ content: res['data'] });
            return;
          }
          let url = `/giftCard/pages/giftCardDetail/giftCardDetail?id=${res['data']['card_id']}&limit_num=${res['data']['limit_num']}&code=${that.data.exchangeCodeValue}`;
          that.closeCodeInput();
          app.turnToPage(url);
        }
      })
    }
  },
})