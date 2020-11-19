var app = getApp();
Component({
  properties: {
  },
  data: {
    sharePoliteData:'',
    marginTop: 50,            // 距离顶部距离 单位rpx;
  },
  pageLifetimes: {
    show() {
     let pageInstance = app.getAppCurrentPage();
      if (pageInstance.data.page_hasNavBar) {
        this.setData({
          marginTop : app.globalData.topNavBarHeight * 2.34375 + 50
        })
      }
    }
  },
  methods: {
    showDialog: function (sharePolite){
      this.getShareData()
    },
    closeWindow:function(){
      this.setData({
        sharePoliteShow:false,
      })
    },
   getShareData:function(){
    let that = this;
    that.closeWindow();
    app.sendRequest({
      url: '/index.php?r=ShareGiftActivity/GetEffectActivity',
      data: {},
      success: (res) => {
        if (!res.status) {
          let data = res.data;
          if (data && data.rewards && data.rewards.length){
            for (let item of data.rewards) {
              item.icon = that.getIcon(item.type);
            };
            that.setData({
              sharePoliteData: data
            });
            if (this.data.sharePoliteData) {
              this.setData({
                sharePoliteShow: true,
              })
            } else {
              app.showModal({
                content: '当前无进行中的分享有礼活动',
                confirmText: '我知道了',
              })
            }
          }
        }
      }
    })
  },
    getIcon:function(type){
      let icon = '';
      switch(type){
        case '1':
          icon ='share-polite-coupon';
          break;
        case '2':
          icon = 'share-polite-integral';
          break;
        case '3':
          icon = 'share-polite-stored-value';
          break;
        case '4':
          icon = 'share-polite-vip-card';
          break;
        case '5':
          icon = 'share-polite-vip-card';
          break;
        case '6':
          icon = 'share-polite-collect';
          break;
        case '7':
          icon = 'share-polite-lucky-wheel';
          break;
        case '8':
          icon = 'share-polite-scratch-card';
          break;
        case '9':
          icon = 'share-polite-golden-eggs';
          break;
      };
      return icon
    }
  }
})
