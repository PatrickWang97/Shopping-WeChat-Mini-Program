var app = getApp()
Page({
  data: {
    topNavBarData: {
      title: '会员卡',
      isDefault: 0,
    },
    vipList: [],
    isLeague: false
  },
  onLoad: function(options){
    let { isLeague } = options;
    this.isLeague = isLeague;
    if (isLeague) {
      this.setData({
        'topNavBarData.title': '多店会员卡',
        isLeague: true
      });
    }
    this.getVIPCardList();
    this.getAllVipCardInfo()
  },
  getVIPCardList: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetUserVIPCardList',
      data: {
        'parent_app_id': app.getAppId(),
        'is_app_shop_vip': this.isLeague ? this.isLeague : 0,
      },
      success: function (res) {
        that.setData({
          vipList: res.data
        });
      },
      complete: function () {
      }
    });
  },
  getAllVipCardInfo: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appVipCard/getUserAccountSurvey',
      method: 'post',
      data: {
        sub_shop_app_id: _this.data.franchiseeId,
        card_type: _this.data.cardtype
      },
      hideLoading: false,
      success: function (res) {
        let data = res.data.all_vip_card;       
        _this.setData({
          allVipCard: data || [],
        })
      },
      complete: function (res) {
        _this.setData({
          loading: false
        })
      }
    })
  },
  turnToVipCard: function(e){
    let id = e.currentTarget.dataset.id;
    let appid = e.currentTarget.dataset.appid;
    let isPaidCard = e.currentTarget.dataset.ispaidcard;
    let isLeague = '';
    if (this.isLeague) {
      isLeague = '&is_league=1';
    }
    app.turnToPage('/eCommerce/pages/vipCard/vipCard?detail=' + id + '&franchisee=' + appid + '&is_paid_vip=' + isPaidCard + isLeague);
  },
  turnToLeagueVipAdvertise: function() {
    app.turnToPage('/eCommerce/pages/leagueVipAdvertise/leagueVipAdvertise');
  },
  turnToGetVip:function(){
    app.turnToPage('/eCommerce/pages/vipBenefits/vipBenefits');
  }
})
