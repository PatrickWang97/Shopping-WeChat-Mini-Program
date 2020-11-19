var app = getApp();
Component({
  properties: {
    shopVipModal: {
      type: Object,
      value: {
        showModal: false,
        isUp: true
      }
    }
  },
  data: {
    shopVipModal: {
      showModal: false,
      isUp: false
    },
    cdnUrl: app.getCdnUrl()
  },
  methods: {
    stopPropagation: function () {},
    closeModal: function () {
      this.setData({
        'shopVipModal.showModal': false
      });
    },
    turnToVipCard: function () {
      app.turnToPage('/userCenter/pages/vipCardList/vipCardList');
      this.closeModal();
    }
  }
})
