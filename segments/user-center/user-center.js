var Element = require('../../utils/element.js');
var app = getApp();
var userCenter = new Element({
  events: {
    usercentrGoLogin: function(e){
      this.usercentrGoLogin(e);
    },
    showQRWindow:function(e){
      app.showQRWindow(e)
    }
  },
  methods: {
    init: function(compid, pageInstance) {
      this._initUserCenterData(pageInstance, compid);
    },
    onPageShow: function(compid, pageInstance){
      this._initUserCenterData(pageInstance, compid);
    },
    _initUserCenterData: function (pageInstance, compid) {
      let content = pageInstance.data[compid].content;
      let data = {};
      let goodsTypeList = []
      for (let i = 0; i < 25; i++) {
        let sub = {
          requested: false,
          index: []
        }
        goodsTypeList.push(sub)
      };
      for (let i in content) {
        for (let j in content[i].blockArr) {
          let item = content[i].blockArr[j];
          if (item.actionType === 'custom') {
            let action = item.action;
            action.action = item.action.actionType;
            item.bindtap = "tapEventCommonHandler";
            item.param = action;
          } else {
            let goodsTypeReg = new RegExp('(^|&)goodsType=([^&]*)(&|$)');
            let orderIndex = new RegExp('(^|&)currentIndex=([^&]*)(&|$)');
            let evoucherRegExp = new RegExp('(^|&)isEletronicCard=([^&]*)(&|$)');
            let goodsType = item.param && item.param.match(goodsTypeReg) ? +item.param.match(goodsTypeReg)[2] : -2;
            let k = item.param && item.param.match(orderIndex) ? +item.param.match(orderIndex)[2] : -2;
            let isEvoucher = item.param && item.param.match(evoucherRegExp) ? +item.param.match(evoucherRegExp)[2] : -2;
            if (goodsType >= 0 && goodsType < 4) {
              if (isEvoucher == 1) {
                goodsType = 24;
              }
              goodsTypeList[goodsType].index.push([i, j, k])
            }
            if (item.router === 'myOrder' && goodsType != -2 && !goodsTypeList[goodsType].requested) {
              goodsTypeList[goodsType].requested = true;
              setTimeout(() => {
                app.userCenterOrderCount({
                  goodsType: isEvoucher == 1 ? 0 : goodsType,   // 电子卡券的goodsType也是0
                  showEletronicCard: isEvoucher == 1 ? 1 : 0,   // 是否展示电子卡券订单
                }, (data) => {
                  let newdata = {}
                  data = [0, ...data]
                  for (let i in goodsTypeList[goodsType].index) {
                    let index = goodsTypeList[goodsType].index[i]
                    if (i == index[2]) {
                    }
                    newdata[compid + '.content[' + index[0] + ']blockArr[' + index[1] + ']count'] = +data[index[2]]
                  }
                  pageInstance.setData(newdata)
                })
              }, 0);
            }
          }
        }
      }
      data[compid + '.content'] = content;
      pageInstance.setData(data);
      if(!app.isLogin()){  //未登录不做后面的请求
        return;
      }
      app.sendRequest({
        url: '/index.php?r=appVipCard/getUserAccountSurvey',
        hideLoading: true,
        success: function (res) {
          let userData = {};
          res.data.buyVip = false;
          for (let item of res.data.all_vip_card) {
            if (item.condition_type == 2) {
              res.data.buyVip = true;//是否显示购买会员按钮
            }
          }
          userData[compid + '.userData'] = res.data;
          pageInstance.setData(userData);
          app.sendRequest({  // 获取系统通知未读条数
            url: '/index.php?r=AppNotify/GetNotifyMsgUnreadCount',
            data: {
              'types': '3,5,6,16'
            },
            success: function (res) {
              let userData = {};
              let msgUnreadCount = {
                totalCount: 0,
                msgCount: res.data,
              };
              Object.keys(res.data).forEach(function (key) {
                if (key == 3) {
                  msgUnreadCount.totalCount += 0;
                } else {
                  msgUnreadCount.totalCount += +res.data[key].unread_count;
                }
              });
              if (msgUnreadCount.totalCount > 99) {
                msgUnreadCount.totalCount = '99+';
              }
              userData[compid + '.userData.msgUnreadCount'] = msgUnreadCount;
              pageInstance.setData(userData);
            }
          });
        }
      })
    },
    usercentrGoLogin: function(e){
      let that = this;
      let pageInstance = app.getAppCurrentPage();
      let compid = e.currentTarget.dataset.compid;
      app.goLogin({
        success: function () {
          that._initUserCenterData(pageInstance, compid);
        }
      });
    },
  }
})
module.exports = userCenter;