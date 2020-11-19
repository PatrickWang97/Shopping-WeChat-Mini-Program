var app = getApp()
const util = require('../../../utils/util.js');
Page({
  data: {
    topNavBarData:{
      isDefault: 0,
      title:'会员卡详情',
    },
    appId: '',
    receiveCard: -1, // 默认不知道是否有领取
    cardDetail: {
      appName: '',
      logoUrl: '',
      duration: '',
      level: '',
      number: ''
    },
    vipRights: {
      freePostage: 0,
      discount: 0,
      giveCouponStr: '',
      integral: 0
    },
    vipNotice: {
      description: ''
    },
    vipPoints: {
      canUseIntegral: 0,
      totalIntegral: 0,
      consumeNum: 0,
    },
    vipContact: {
      appName: '',
      phone: '无'
    },
    activeItem: 'rights',
    vipInfo: {},
    isPaidVip: '0',
    isLeagueVip: 0, // 是否是联盟会员卡
    fix_time_benefit: {
      sendBalanceRule: '',
      sendIntegralRule: '',
      sendCouponRule: '',
      showBenefit: false
    },
  },
  onLoad: function(options){
    let vipId = options.detail || '';
    let franchiseeId = options.franchisee || '';
    let isPaidVip = options.is_paid_vip || '';
    let isLeagueVip = options.is_league == 1 ? 1 : '';
    this.setData({
      vipId: vipId,
      franchiseeId: franchiseeId,
      isPaidVip: isPaidVip,
      isLeagueVip: isLeagueVip,
    });
    if(vipId){
      this.getVipInfo();
    }else{
      this.getHeadquartersVipInfo();
    }
  },
  getVipInfo: function(){
    let that = this;
    let { franchiseeId, vipId, isPaidVip, isLeagueVip } = that.data;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardInfo',
      data: {
        sub_shop_app_id: franchiseeId,
        vip_id: vipId,
        is_paid_vip: isPaidVip,
        is_app_shop: isLeagueVip, // 是否是联盟会员卡
        is_get_shopping_detail: 1,  //  是否查询升级条件
      },
      success: function(res){
        let cardBackground  = ''
        let vip = res.data[0];
        if (parseInt(vip.background_type) == 0) {
          cardBackground = 'url(' + vip.background + ') 0% 0% / 100% 100%';
        } else {
          cardBackground = vip.background;
        }
        let giveCouponStr = '';
        for (let i = 0; i < vip.coupon_list.length; i++) {
          vip.coupon_list[i].name = vip.coupon_list[i].type === '0' ? '满减券' :
                                    vip.coupon_list[i].type === '1' ? '打折券' :
                                    vip.coupon_list[i].type === '2' ? '代金券' :
                                    vip.coupon_list[i].type === '3' ? '兑换券' :
                                    vip.coupon_list[i].type === '4' ? '储值券' :
                                    vip.coupon_list[i].type === '5' ? '通用券' :
                                    vip.coupon_list[i].type === '6' ? '次数券' : '';
          giveCouponStr = giveCouponStr + '免费赠送' + vip.coupon_list[i].num + '张' + vip.coupon_list[i].title + vip.coupon_list[i].name + ',';
        }
        let giveBirCouponStr = '';
        if(vip.birthday_coupon_list && vip.birthday_coupon_list.length){
          let birthday_coupon_list = vip.birthday_coupon_list;
          for (let i = 0; i < birthday_coupon_list.length; i++) {
            birthday_coupon_list[i].name = birthday_coupon_list[i].type === '0' ? '满减券' :
                                           birthday_coupon_list[i].type === '1' ? '打折券' :
                                           birthday_coupon_list[i].type === '2' ? '代金券' :
                                           birthday_coupon_list[i].type === '3' ? '兑换券' :
                                           birthday_coupon_list[i].type === '4' ? '储值券' :
                                           birthday_coupon_list[i].type === '5' ? '通用券' :
                                           birthday_coupon_list[i].type === '6' ? '次数券' : '';
            giveBirCouponStr = giveBirCouponStr + '免费赠送' + birthday_coupon_list[i].num + '张' + birthday_coupon_list[i].title + birthday_coupon_list[i].name  +',';
          }
        }
        vip.description = vip.description ? vip.description.replace(/<br \/>/g, '\n') : vip.description;
        if (franchiseeId && isLeagueVip) {
          giveBirCouponStr = '';
          vip.integral = 0;
        }
        if (isLeagueVip) {
          that.getSubshopsList(vip);
        }
        if (vip.fix_time_benefit && vip.fix_time_benefit.length != 0) {
          if (vip.fix_time_benefit.balance_info) {
            let balance = vip.fix_time_benefit.balance_info;
            let sendBalance = balance.send_type == 1 ? `每天赠送${balance.obj_num}元`: 
                              balance.send_type == 2 ? `每周赠送${balance.obj_num}元` : 
                              balance.send_type == 4 ? `每月发放${balance.obj_num}元，每隔30天发放` : `每月发放${balance.obj_num}元,每月${balance.benefit_day}号发放`;
            vip.sendBalanceRule = sendBalance;
          }
          if (vip.fix_time_benefit.integral_info) {
            let integral = vip.fix_time_benefit.integral_info;
            let sendIntegral = integral.send_type == 1 ? `每天赠送${parseInt(integral.obj_num)}分` : 
                               integral.send_type == 2 ? `每周赠送${parseInt(integral.obj_num)}分` : 
                               integral.send_type == 4 ? `每月发放${parseInt(integral.obj_num)}分，每隔30天发放` : `每月发放${parseInt(integral.obj_num)}分,每月${integral.benefit_day}号发放`;
            vip.sendIntegralRule = sendIntegral;
          }
          if (vip.fix_time_benefit.coupon_info) {
            let couponInfo = vip.fix_time_benefit.coupon_info;
            let couponSendList = [];
            couponInfo.map(item => {
              item.name = item.type === '0' ? '满减券' :
                          item.type === '1' ? '打折券' :
                          item.type === '2' ? '代金券' :
                          item.type === '3' ? '兑换券' :
                          item.type === '4' ? '储值券' :
                          item.type === '5' ? '通用券' :
                          item.type === '6' ? '次数券' : '';
              let sendCoupon = item.send_type == 1 ? `每天赠送${item.name}-${item.title}-${parseInt(item.obj_num)}张` : 
                               item.send_type == 2 ? `每周赠送${item.name}-${item.title}-${parseInt(item.obj_num)}张` : 
                               item.send_type == 4 ? `每月发放${item.name}-${item.title}-${parseInt(item.obj_num)}张，每隔30天发放` : `按月发放${item.name}-${item.title}-${parseInt(item.obj_num)}张,每月${item.benefit_day}号发放`;
              couponSendList.push(sendCoupon);
            })
            vip.sendCouponRule = couponSendList.join(',');
          }
          vip.showBenefit = true;
        }else {
          vip.showBenefit = false;
        }
        let heightLevel = vip.higher_level_card_info || [];
        let maxRate = Math.max(+vip.integral_rate, +vip.trade_rate, +vip.consume_rate) + '%';
        let nextLevel = heightLevel.level ? `${heightLevel.level}级免费会员卡` : '已是最高级会员卡';
        vip.maxRate = maxRate || '100%';
        vip.nextLevel = nextLevel;
        that.setData({
          'vipInfo' : vip,
          'receiveCard': 1,
          'cardDetail.appName': vip.app_name,
          'cardDetail.logoUrl': vip.logo,
          'cardDetail.duration': vip.expired_time || '',
          'cardDetail.level': vip.title,
          'cardDetail.cardBackground': cardBackground,
          'cardDetail.number': vip.user_vip_id || '',
          'cardDetail.isShowVipid': vip.is_show_vipid || '',
          'vipRights.discount': vip.discount,
          'vipRights.giveCouponStr': giveCouponStr,
          'vipRights.giveBirCouponStr': giveBirCouponStr,
          'vipRights.integral': vip.integral,
          'vipRights.balance': vip.balance,
          'vipRights.freePostage': vip.is_free_postage,
          'vipRights.freePostageCondition': vip.free_postage_condition || '0.00',
          'vipNotice.description': vip.description,
          'vipPoints.canUseIntegral': vip.can_use_integral,
          'vipPoints.totalIntegral': vip.total_integral,
          'vipPoints.consumeNum': vip.consume_num,
          'vipContact.appName': vip.app_name,
          'vipContact.phone': vip.phone,
          'fix_time_benefit.sendBalanceRule': vip.sendBalanceRule || '',
          'fix_time_benefit.sendIntegralRule': vip.sendIntegralRule || '',
          'fix_time_benefit.sendCouponRule': vip.sendCouponRule || '',
          'fix_time_benefit.showBenefit': vip.showBenefit,
        });
      }
    });
  },
  getHeadquartersVipInfo: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPInfo',
      data: {
        'app_id': that.data.franchiseeId || '',
        'is_all': 1
      },
      success: function(res){
        let cardBackground  = ''
        if (parseInt(res.data.background_type) == 0) {
          cardBackground = 'url(' + res.data.background + ') 0% 0% / 100% 100%';
        } else {
          cardBackground = res.data.background;
        }
        let giveCouponStr = '';
        let giveBirCouponStr = '';
        if (res.data.is_vip != 0) {
          for (let i = 0; i < res.data.coupon_list.length; i++) {
            giveCouponStr = giveCouponStr + '免费赠送' + res.data.coupon_list[i].num + '张' + res.data.coupon_list[i].name + '的优惠券,';
          }
          if(res.data.birthday_coupon_list && res.data.birthday_coupon_list.length){
            for (let i = 0; i < res.data.birthday_coupon_list.length; i++) {
              giveBirCouponStr = giveBirCouponStr + '免费赠送' + res.data.birthday_coupon_list[i].num + '张' + res.data.birthday_coupon_list[i].name + '的优惠券,';
            }
          }
        }
        res.data.description = res.data.description ? res.data.description.replace(/<br \/>/g, '\n') : res.data.description;
        that.setData({
          'vipInfo' : res.data,
          'receiveCard': res.data.is_vip || 0,
          'cardDetail.appName': res.data.app_name,
          'cardDetail.logoUrl': res.data.logo,
          'cardDetail.duration': res.data.expire,
          'cardDetail.level': res.data.title,
          'cardDetail.cardBackground': cardBackground,
          'cardDetail.number': res.data.user_vip_id || '',
          'cardDetail.isShowVipid': res.data.is_show_vipid || '',
          'vipRights.discount': res.data.discount || '',
          'vipRights.giveCouponStr': giveCouponStr || '',
          'vipRights.giveBirCouponStr': giveBirCouponStr || '',
          'vipRights.integral': res.data.integral || '',
          'vipRights.balance': res.data.balance || '',
          'vipRights.freePostage': res.data.is_free_postage || '',
          'vipRights.freePostageCondition': res.data.free_postage_condition || '0.00',
          'vipNotice.description': (res.data.description ? res.data.description.replace(/<br \/>/g, '\n') : res.data.description) || '',
          'vipPoints.canUseIntegral': res.data.can_use_integral || '',
          'vipPoints.totalIntegral': res.data.total_integral || '',
          'vipPoints.consumeNum': res.data.consume_num || '',
          'vipContact.appName': res.data.app_name || '',
          'vipContact.phone': res.data.phone || ''
        });
      }
    });
  },
  showItemContent: function(event){
    let that = this;
    let _item = event.currentTarget.dataset.item;
    if (that.data.activeItem == _item) {
      _item = '';
    }
    that.setData({
      'activeItem': _item
    });
  },
  getVIPCardForUser: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardForUser',
      data: {
        'parent_app_id': app.getAppId(),
        'sub_app_id': that.data.franchiseeId
      },
      success: function (res) {
        app.showModal({
          content: '领取成功!'
        });
        that.setData({
          'vipInfo.is_owner': 1
        });
      },
      complete: function () {
      }
    });
  },
  getSubshopsList: function (card) {
    let _this = this;
    let { locationInfo } = app.globalData;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/GetVipAppShopList',
      hideLoading: true,
      data: {
        card_id: card.id,
        parent_app_id: app.getAppId(),
        page: 1,
        page_size: 2,
        is_paid_vip: card.condition_type == 2 ? 1 : 0,
        longitude: locationInfo.longitude,
        latitude: locationInfo.latitude,
      },
      success: function (res) {
        let returnList = res.data;
        if (returnList && returnList.length) {
          returnList.forEach((shop) => shop.distance = util.formatDistance(shop.distance));
          _this.setData({
            subShopsList: returnList,
            subShopsCount: res.count
          });
        } else {
          _this.setData({
            subShopsList: []
          });
        }
      }
    });
  },
  turnToShopsList: function() {
    app.turnToPage('/eCommerce/pages/balanceShopsList/balanceShopsList?isVip=1');
  },
})
