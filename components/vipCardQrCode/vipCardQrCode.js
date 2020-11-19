var app = getApp();
Component({
  properties: {
  },
  data: {
    qrData:{},
    refreshData:{},
    vipCardId:'',
    is_paid_vip:0,
    vipCardQrCodeShow:false,
    qrCodeTimer:'',
    vipCardQrCode:{},
  },
  pageLifetimes: {
    show: function () {
    }
  },
  methods: {
    showDialog: function (vipCardQrCode) {
      let that = this;
      that.data.vipCardQrCode = vipCardQrCode;
      if (!app.isLogin() && vipCardQrCode.componentType == 'general') {
        app.goLogin({
          success: function (){
            that.getVipCardData();
          }
        })
      }else{
        if(vipCardQrCode.componentType == 'userCenter'){
          that.data.vipCardId = vipCardQrCode.vipCardId;
          that.data.is_paid_vip = vipCardQrCode.is_paid_vip
          that.showQRRemark();
        }else{
          that.getVipCardData();
        }
      }
    },
    getVipCardData:function(){
      let that = this;
      app.sendRequest({
        url: '/index.php?r=appVipCard/getUserAccountSurvey',
        success: function (res) {
          if(res.status == 0){
            let vipCardData = res.data;
            if (!vipCardData.user_vip_card && !vipCardData.user_paid_vip_card){
              setTimeout(()=>{
                app.showModal({
                  content:'您暂无会员卡！'
                })
              },200)
              return
            } else {
              if (that.data.vipCardQrCode.firstShow == 'general') {
                if (vipCardData.user_vip_card){
                  that.data.vipCardId = vipCardData.user_vip_card.id;
                  that.data.is_paid_vip = 0;
                }else{
                  that.data.vipCardId = vipCardData.user_paid_vip_card.id;
                  that.data.is_paid_vip = 1
                }
              }else{
                if (vipCardData.user_paid_vip_card) {
                  that.data.vipCardId = vipCardData.user_paid_vip_card.id;
                  that.data.is_paid_vip = 1
                } else {
                  that.data.vipCardId = vipCardData.user_vip_card.id;
                  that.data.is_paid_vip = 0;
                }
              }
            } 
            that.showQRRemark();
          };
        }
      })
    },
    showQRRemark: function () {
      let that = this;
      let url2 = '/index.php?r=appVipCard/getVipQRCode';
      that.setData({
        vipCardQrCodeShow: true,
      })
      app.sendRequest({
        url: url2,
        data: {
          id: that.data.vipCardId,
          is_paid_vip: that.data.is_paid_vip
        },
        chain: true,
        hideLoading: true,
        success: function (res) {
          const data = res.data;
          const codeConfig = data.qr_code_config;
          let qrData = {};
          if (codeConfig && codeConfig.auto_refresh == 1 && codeConfig.auto_refresh_time) {
            let refreshTime = codeConfig.auto_refresh_time;
            let refreshText = '';
            if (that.data.qrCodeTimer) {
              clearInterval(that.data.qrCodeTimer);
            }
            that.data.qrCodeTimer = setInterval(() => {
              refreshTime--;
              if (refreshTime === 1) {
                clearInterval(that.data.qrCodeTimer);
                that.showQRRemark();
              }
            }, 1000);
          } else {
            data.qr_code_config = {};
          }
          qrData.data = data;
          qrData.isValid = 1
          that.setData({
            qrData: qrData,
            'refreshData.isValid':1,
          });
        }
      })
    },
    closeWindow:function(){
      clearInterval(this.data.qrCodeTimer);
      this.setData({
        vipCardQrCodeShow: false,
        qrData:{}
      })
    }
  }
})
