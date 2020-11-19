const util = require('../../../utils/util.js');
const app = getApp();
Page({
  data: {
    selectedCollectType: '电商',
    isHideTypeNav: true,
    recordTabType: 0,
    collectStarsData: {
      collectedNum: 0,
      collectNum: 8,
      starStyleArr: ['dark', 'dark', 'dark', 'dark', 'dark', 'dark', 'dark', 'dark'],
      dark_img:'http://img.zhichiwangluo.com/zcimgdir/album/file_5afac25ca94fb.png',
    },
    starRecordList: {
      list: [],
      isNull: false,
      loadingData: {
        isLoading: false,
      },
    },
    awardRecordList: {
      list: [],
      isNull: false,
      loadingData: {
        isLoading: false,
      },
    }
  },
  onLoad: function(options) {
    this.setData({
      'franchiseeId': options.franchisee || '',
    });
    this.getCollectStarsData();
    this.getStarsRecordData();
  },
  onShow: function() {
  },
  onReachBottom: function() {
  },
  initialLoadingData: function() {
    this.setData({
      starRecordList: {
        list: [],
        isNull: false,
        loadingData: {
          isLoading: false,
        },
      },
      awardRecordList: {
        list: [],
        isNull: false,
        loadingData: {
          isLoading: false,
        },
      }
    });
  },
  getCollectStarsData: function() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appMarketing/GetUserCollectNum',
      data: {
        sub_app_id: that.data.franchiseeId
      },
      success: function (res) {
        let returnData = res.data;
        let tempArr = [];
        let tempNum = 0;
        if (returnData.togetherNum != undefined) {  // 合计计算
          tempNum = returnData.togetherNum;
          for (let i = 0; i < returnData.collectNum; i++) {
            if (i < returnData.togetherNum) {
              tempArr.push('light');
            } else {
              tempArr.push('dark');
            }
          }
        } else {  // 单独计算
          tempNum = returnData.ecommerceNum;
          for (let i = 0; i < returnData.collectNum; i++) {
            if (i < returnData.ecommerceNum) {
              tempArr.push('light');
            } else {
              tempArr.push('dark');
            }
          }
        }
        if (returnData.status == 0) {
          app.showModal({
            content: '没有进行中的活动',
          });
        }
        if (returnData.status == 0 && returnData.isReset == 1) {
          tempNum = 0;
          tempArr = ['dark', 'dark', 'dark', 'dark', 'dark', 'dark', 'dark', 'dark'];
        }
        returnData.collectedNum = tempNum;
        returnData.starStyleArr = tempArr;
        that.setData({
          'collectStarsData': returnData,
        });
    }
  });
},
getStarsRecordData: function() {
  let that = this;
  let { starRecordList } = this.data;
  let { list, loadingData, isNull } = starRecordList;
  if (loadingData.isLoading) {
    return;
  }
  that.setData({
    'starRecordList.loadingData.isLoading': true,
  });
  app.sendRequest({
    url: '/index.php?r=appMarketing/GetUserCollectRecord',
    data: {
      sub_app_id: that.data.franchiseeId
    },
    hideLoading: true,
    success: function(res) {
      let returnList = res.data;
      if (returnList && returnList.length !== 0) {
        loadingData = {
          isLoading: false,
        }
        that.setData({
          'starRecordList.list': list.concat(returnList),
          'starRecordList.loadingData': loadingData,
        });
      } else {
        that.setData({
          'starRecordList.isNull': true,
        });
      }
    },
    complete: function() {
      that.setData({
        'starRecordList.loadingData.isLoading': false,
      });
    }
  });
  },
  getAwardRecordData: function () {
    let that = this;
    let { awardRecordList } = this.data;
    let { list, loadingData, isNull } = awardRecordList;
    if (loadingData.isLoading) {
      return;
    }
    that.setData({
      'awardRecordList.loadingData.isLoading': true,
    });
    app.sendRequest({
      url: '/index.php?r=appMarketing/GetUserRewardsRecord',
      data: {
        sub_app_id: that.data.franchiseeId
      },
      hideLoading: true,
      success: function (res) {
        let returnList = res.data;
        if (returnList && returnList.length !== 0) {
          loadingData = {
            isLoading: false,
          }
          that.setData({
            'awardRecordList.list': list.concat(returnList),
            'awardRecordList.loadingData': loadingData,
          });
        } else {
          that.setData({
            'awardRecordList.isNull': true,
          });
        }
      },
      complete: function () {
        that.setData({
          'awardRecordList.loadingData.isLoading': false,
        });
      }
    });
  },
  toggleMoreType: function() {
    let { isHideTypeNav } = this.data;
    this.setData({
      isHideTypeNav: isHideTypeNav ? false : true,
    });
  },
  selectCollectType: function(e) {
    let collectTypeArr = ['电商', '到店', '当面付','分享赠送','拉新赠送', '收藏赠送', '支付有礼','新人有礼','拉新有礼'];
    let { type } = e.target.dataset;
    let { collectStarsData } = this.data;
    let tempArr = [],
      tempNum = 0;
    if (type == 0) {
      tempNum = collectStarsData.ecommerceNum || 0;
    } else if (type == 1) {
      tempNum = collectStarsData.toStoreNum || 0;
    } else if (type == 2) {
      tempNum = collectStarsData.facePayNum || 0;
    } else if (type == 3) {
      tempNum = collectStarsData.shareBaseNum || 0;
    } else if (type == 4) {
      tempNum = collectStarsData.shareExtraNum || 0;
    } else if (type == 5) {
      tempNum = collectStarsData.collectActivityNum || 0;
    } else if (type == 6) {
      tempNum = collectStarsData.paidSuccessNum || 0;
    } else if (type == 7) {
      tempNum = collectStarsData.new_user_gift_num || 0;
    } else if (type == 8) {
      tempNum = collectStarsData.pull_user_gift_num || 0;
    }
    for (let i = 0; i < collectStarsData.collectNum; i++) {
      if (i < tempNum) {
        tempArr.push('light');
      } else {
        tempArr.push('dark')
      }
    }
    this.setData({
      selectedCollectType: collectTypeArr[type] || '',
      'collectStarsData.collectedNum': tempNum,
      'collectStarsData.starStyleArr': tempArr,
    });
    this.toggleMoreType();
  },
  recordTabSwitch: function(e) {
    let { recordType } = e.currentTarget.dataset;
    if (this.data.recordTabType == recordType) { return; }
    this.setData({
      recordTabType: recordType,
    });
    this.initialLoadingData();
    if(recordType == 1) {
      this.getAwardRecordData();
    } else {
      this.getStarsRecordData();
    }
  },
})