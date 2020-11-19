var WxParse = require('components/wxParse/wxParse.js');
var util = require('utils/util.js');
var customEvent = require('utils/custom_event.js');
var qiniuUploader = require('./utils/qiniuUploader.js');
App({
  onLaunch: function (options) {
    let _this = this;
    this._getSystemInfo({
      success: function (res) {
        _this.setSystemInfoData(res);
        let barHeight = res.statusBarHeight;
        let tapNavHeight = 64;
        if (res.model.indexOf('iPhone X') != -1 || res.model.indexOf('MI 8') != -1 || res.model.indexOf('SKW-A0') != -1 || res.model.indexOf('JKM-AL00b') != -1 || res.statusBarHeight > 40) { // 判断是iphone X 设置顶部导航高度
          tapNavHeight = 88;
        } else if (res.model.indexOf('iPhone') != -1) {
          tapNavHeight = 64;
        } else {
          tapNavHeight = 68; // 安卓机
        }
        _this.globalData.topNavBarHeight = tapNavHeight;
        _this.globalData.topNavBarPaddingTop = barHeight;
      }
    });
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppData/GetEnvStatus',
      success: res => {
        if(res.data.use_backup == 1 && res.data.backup_time > this.globalData.packTime){
          this.globalData.tgroup = 'backup';
        }
        wx.checkSession({
          success: function() { 
            let userInfo = wx.getStorageSync('userInfo');
            let sessionKey = wx.getStorageSync('session_key');
            if (userInfo && sessionKey) {
              _this.globalData.userInfo = userInfo;
              _this.globalData.sessionKey = sessionKey;
              _this.setIsLogin(true);
              _this.launchHasLogin(options);
              if (_this.globalData.appOptions.query.account && _this.globalData.appOptions.query.from_account) {
                _this.bindWxAccound();
                _this._requestUserWxInfo();
              }
            }
          },
          fail: function() {
            let appid = _this.getAppId();
            if (_this.globalData.appOptions.query.account && appid == 'pja9mENKU1') {
              _this.goLogin({
                success: function(){
                  _this._requestUserWxInfo();
                }
              });
            }
          }
        })
        this.appInitial();
        this.produceBehaviorId();
      }
    });
    this.checkIsSubOrParentShop();
  },
  appInitial: function () {
    wx.request({
      url: this.globalData.siteBaseUrl + '/index.php?r=AppUser/MarkWxXcxStatus',
      data: {
        app_id: this.getAppId(),
        his_id: this.globalData.historyDataId
      },
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'tgroup': this.globalData.tgroup
      }
    });
    this.getAppECStoreConfig(()=>{},'first');
    setTimeout(() => {
      this.getShareAppSetting();
      this.getLockInfo();
    },1000)
  },
  launchHasLogin: function(options){
    this.getShareKey();
    this.getEffectActivity(options.query.psid || '');
    this.getNewcomerActivity();
    this._isPromotionPerson();
    this.getGroupLeaderLocking();
    this.getInviteNewActivity(options.query.psid || '');
    if (options && options.scene && options.scene == 1089) {
      this.recvCollectRewards();
    }
    if (options && options.scene && options.query.psid && this.isLogin()) {
      this.postShareSuccess(options.query.psid);
    }
  },
  onShow: function (options) {
    this.loadIcon();
    this.globalData.appScene = options.scene;
    this._logining = false;
    if ((options && [1007, 1008, 1011, 1012, 1013, 1014, 1019, 1020, 1024, 1029, 1035, 1036, 1038, 1043, 1044, 1058, 1067, 1073, 1074,1089, 1091, 1096].indexOf(+options.scene) > -1) || !this.globalData.appOptions) {
      this.globalData.appOptions = options;
    }
    let that = this;
        if (options && options.scene && ([1011, 1012, 1013, 1007, 1008, 1035, 1036, 1047, 1048, 1049, 1155].indexOf(options.scene) > -1)) {
      if (options.query.location_id) {
        this.globalData.urlLocationId = options.query.location_id;
        if (options.query.detail && options.query.parent_app_id) {
          this.globalData.chainAppId = options.query.detail;  //扫描连锁子店位置码进入 显示连锁子店
        }
      }
      if (options.query.p_id) {
        this.bindUserTokenByPid(options.query.p_id);
      }
      if (options.query.user_token || (options.query.scene && options.query.scene.indexOf('is_share') > -1)) {
        if (options.query.user_token && !options.query.p_id) {
          this._getPromotionUserToken({
            user_token: options.query.user_token
          });
        } else {
          let scene = decodeURIComponent(options.query.scene);
          let obj = {};
          let reg = /([^?&=]+)=([^?&=]*)/g;
          scene.replace(reg, function (rs, $1, $2) {
            var name = decodeURIComponent($1);
            var val = decodeURIComponent($2);
            val = String(val);
            obj[name] = val;
          });
          that.sendRequest({
            url: '/x70bSwxB/card/userTokenToUserId',
            hideLoading: true,
            data: {
              user_id: obj.is_share,
              app_id: that.globalData.appId
            },
            success: res => {
              if (res.data && res.data.user_token) {
                this._getPromotionUserToken({
                  user_token: res.data.user_token
                });
              }
            }
          })
        }
      }
      if (options.query.leader_user_token) {
        that.showModal({
          content: '是否要成为推广人员的团员',
          showCancel: true,
          confirm: function () {
            that._getPromotionUserToken({
              leader_user_token: options.query.leader_user_token
            });
          }
        })
      }
      let s_t = options.query.s_t || options.query.statisticsType;
      if (s_t) {
        let detail = options.query.detail;
        let param = "";
        let params = {};
        let objId = (s_t != 9 && s_t != 10) ? (s_t == 11 ? options.path.split('/')[2] : detail) : s_t;
        params = {
          obj_id: objId,
          type: s_t
        };
        if (s_t == 9 || s_t == 10) {
          params = {
            obj_id: s_t,
            type: s_t
          };
        } else if (s_t == 11) {
          let newOption = Object.assign({}, options.query)
          delete newOption.needStatistics;
          delete newOption.statisticsType;
          delete newOption.s_t;
          for (let i in newOption) {
            param += '&' + i + '=' + newOption[i]
          }
          params = {
            obj_id: objId,
            type: 11,
            params: param
          }
        }
        that.sendRequest({
          hideLoading: true,
          url: '/index.php?r=AppShop/AddQRCodeStat',
          method: 'POST',
          data: params
        })
      }
      if (options.query.p_u) {
        that.globalData.p_u = options.query.p_u;
      }
    }
    if (options && options.scene && options.query.psid && that.isLogin()) {
      that.postShareSuccess(options.query.psid);
    }
    if (options && options.scene && ([1011, 1047, 1089, 1038].indexOf(options.scene) == -1)) {
      that.globalData.canIUseOfficialAccount = true;//不提示不兼容
    }
    let tabBarPagePathArr = this.getTabPagePathArr();
    if (tabBarPagePathArr.indexOf('/pages/tabbarPluginx70bSwxB/tabbarPluginx70bSwxB') > -1) {
      that.globalData.isVcardInTabbar = true;
      if (options.query.vcard_user_id) {
        that.globalData.vcardShareUser = options.query.vcard_user_id;
      }
    }
    if (options && options.query && (options.query.chainLock || options.query.shareLock)) {
      this.globalData.scanLock = options.query.chainLock;
      this.globalData.shareLock = options.query.shareLock;
    }
    if (this.globalData.hasFranchiseeChain) {
      that.globalData.chainNotLoading = true;
      if (that.isLogin()) {
        that.goToGetChainStoreInfo(options);
      } else {
        that.goLogin({
          success: function() {
            that.goToGetChainStoreInfo(options);         
          },
          fail: function() {
            that.changeChainStore(options);
          },
          refuseBack: function() {
            that.changeChainStore(options);
          }
        })
      }
    }
    if(options && options.query && options.query.c_id && this.globalData.hasFranchiseeTrade){
      this.globalData.chainAppId = '';
      this.getTradeStoreInfo(options.query.c_id);
    }
    if (that.isLogin()) {
      that.getEffectActivity(options.query.psid || '');
      that.getInviteNewActivity(options.query.psid || '');
      that.getNewcomerActivity();
      if (options.query.account && options.query.from_account) {
        that.bindWxAccound();
      }
    }
    if (options && options.scene && options.scene == 1089 && that.isLogin()) {
      that.recvCollectRewards();
    }
    if (options && options.query && options.query.ec_location_id){
      this.setEcLocationId(options.query.ec_location_id);
    }
    if(options && options.query.uuid){
      this.sendUseBehavior([{goodsId: options.path}],10);
    }   
    this.getPriceBreakDiscountActivity();
  },
  goToGetChainStoreInfo: function(options) {
    let that = this;
    that.sendRequest({
      url: '/index.php?r=AppShopManage/GetUserLockAppId',
      hideLoading: true,
      success: res => {
        if (res.data) {
          that.changeChainStore(options, res);
        } else {
          that.changeChainStore(options);
        }
      },
      fail: res => {
        that.changeChainStore(options);
      }
    })
  },
  changeChainStore: function (options, res) {
    let that = this;
    let pageInstance = this.getAppCurrentPage();
    if (pageInstance === undefined) {
      setTimeout(function() {
        that.changeChainStore(options, res);
      }, 200);
      return;
    }
    let hearderAppId = this.globalData.appId;
    let chainData = res && res.data || {};
    let chain = chainData.app_id ? {app_id: chainData.app_id, his_id: chainData.his_id} : wx.getStorageSync('chainStore');
    let lockInfo = chainData.config_data && chainData.config_data.clockList || {};
    let isLock = chainData.is_clock == 1 || false;  // 接口返回是否锁定
    that.globalData.shareNeedLock = JSON.parse(lockInfo.share || 'false');
    that.globalData.scanNeedLock = JSON.parse(lockInfo.scan || 'false');
    if (chain && chain.app_id === hearderAppId) {
      chain = undefined;
      if (options && options.query && !options.query.c_id && !isLock) {
        that.globalData.scanLock = false;
        that.globalData.shareLock = false;
      }
    }
    let _isLock = isLock;
    if (that.globalData.scanLock && !_isLock) {          // 扫码进入
      _isLock = that.globalData.scanNeedLock;
    } else if (that.globalData.shareLock && !_isLock) {      // 分享进入
      _isLock = that.globalData.shareNeedLock;
    }
    that.globalData.chainHasLock = _isLock;   // 店铺是否应该锁定
    if (isLock) {
      if (chain) {
        this.globalData.chainAppId = chain.app_id;
        this.globalData.chainNotLoading = true;
        this.getChainStoreInfo();
        this.setStorage({
          key: 'chainStore',
          data: chain
        });
      } else {
        that.globalData.chainAppId = '';
        that.globalData.chainHistoryDataId = '';
        that.removeStorage({
          key: 'chainStore'
        });
        that.setLockChainShop();
        if (pageInstance && pageInstance.page_router && that.globalData.chainNotLoading && pageInstance.dataInitial) {
          pageInstance.dataInitial();
        }
        that.globalData.chainNotLoading = false;
      }
    }else if(options && options.query && options.query.c_id && this.globalData.hasFranchiseeChain){
      this.globalData.chainAppId = options.query.c_id;
      this.getChainStoreInfo('fromWxCode', true);
    }else if (chain && this.globalData.hasFranchiseeChain) {
      this.globalData.chainAppId = chain.app_id;
      this.getChainStoreInfo();
    } else if (this.globalData.hasFranchiseeChain && !this.globalData.isPosFranchiseeChain) {
      that.globalData.isPosFranchiseeChain = true;
      this.getLocation({
        success({ latitude, longitude }) {
          wx.showLoading({
            title: '请求中...',
            mask: true
          });
          customComponent['franchisee-chain'].getNearbyChainInfo({ latitude, longitude });
          that.getAddressByLatLng({ lat: latitude, lng: longitude }, ({ data }) => {
            that.setLocationInfo({
              latitude: latitude,
              longitude: longitude,
              address: data.formatted_addresses && data.formatted_addresses.recommend,
              info: data
            });
          })
        },
        fail: function(){
          let pageInstance  = that.getAppCurrentPage();
          that.globalData.chainAppId = '';
          that.globalData.chainHistoryDataId = '';
          if (pageInstance && pageInstance.page_router && that.globalData.chainNotLoading && pageInstance.dataInitial) {
            pageInstance.dataInitial();
          }
          that.globalData.chainNotLoading = false;
          that.globalData.isPosFranchiseeChain = false;
        }
      })
    } else {
      that.globalData.chainAppId = '';
      that.globalData.chainHistoryDataId = '';
      that.removeStorage({
        key: 'chainStore'
      });
      that.setLockChainShop();
      if (pageInstance && pageInstance.page_router && that.globalData.chainNotLoading && pageInstance.dataInitial) {
        pageInstance.dataInitial();
      }
      that.globalData.chainNotLoading = false;
    }
  },
  setLockChainShop: function (shopInfo) {
    let headerAppId = this.globalData.appId;
    let _his_id = (shopInfo && shopInfo.s_his_data && shopInfo.s_his_data.his_id) || (shopInfo && shopInfo.his_id) || '';
    let chain = wx.getStorageSync('chainStore');
    if (shopInfo) {
      this.setStorage({
        key: 'chainStore',
        data: {
          app_id: shopInfo.app_id,
          his_id: _his_id
        }
      });
    }
    if(!this.isLogin()) {
      return;
    }
    this.sendRequest({
      url: '/index.php?r=AppShopManage/AddUserLockAppId ',
      hideLoading: true,
      data: {
        app_id: shopInfo && shopInfo.app_id || headerAppId,
        his_id: _his_id,
        parent_app_id: headerAppId,
        is_clock: this.globalData.chainHasLock ? 1 : 0,
      },
      success: res => { }
    })
  },
  onPageNotFound: function (res) {
    console.log('onPageNotFound路径不存在',JSON.stringify(res));
    let that = this;
    let router = that.getHomepageRouter();
    that.turnToPage('/pages/' + router + '/' + router, true, function () {
      that.showModal({
        content: '您跳转的页面不存在，已经返回首页',
        success: function () {
        }
      });
    });
  },
  onError: function (error) {
    this.addError(error)
  },
  onHide: function () {
    this.sendLog();
  },
  postShareSuccess: function(psid){
    this.sendRequest({
      url: '/index.php?r=AppShare/ShareSuccess',
      data: {
        share_key: psid
      },
      success: res => { }
    })
  },
  bindUserTokenByPid: function(p_id){
    let that = this;
    that.sendRequest({
      url: '/index.php?r=AppDistribution/GetUserTokenByPId',
      hideLoading: true,
      data: {
        p_id: p_id
      },
      success: res => {
        if (res.data && res.data.user_token) {
          that._getPromotionUserToken({
            user_token: res.data.user_token
          });
        }
      }
    })
  },
  _getPromotionUserToken: function (param) {
    let that = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/userBind',
      method: 'post',
      data: param,
      success: function (res) {
        that.globalData.PromotionUserToken = that.globalData.userInfo.user_token;
      },
      successStatusAbnormal: function (res) {
        if (res.status == 99) {
          let homepageRouter = that.getHomepageRouter();
          that.turnToPage('/pages/' + homepageRouter + '/' + homepageRouter, true);
        }
        if (res.status == 100) {
          that.turnToPage('/promotion/pages/promotionApply/promotionApply', true);
        }
      }
    });
  },
  loadIconTimes: 0,
  loadIcon: function(){
    let that = this;
    wx.loadFontFace({
      family: 'icomoon',
      source: 'url("https://cdn.jisuapp.cn/zhichi_frontend/static/webapp/css/fonts/icomoon.ttf")',
      global: true,
      desc: {
        style: 'normal',
        weight: 'normal'
      },
      success: function(res){
        console.log('loadFontFace success' , res);
      },
      fail: function(res){
        console.log(res);
        that.addLog('loadFontFace fail:', res);
        if(that.loadIconTimes < 5){
          setTimeout(() => {
            that.loadIcon();
          }, 10000);
        }
      }
    })
    if(!wx.canIUse('loadFontFace.object.global')){
      this.showModal({content: '检测到你的微信小程序的版本库低于2.10.0，为了有一个完整的体验，请更新一下微信'});
    }
  },
  returnSubPackageRouter: function (router) {
    switch (router) {
      case 'goldenEggs':
      case 'luckyWheelDetail':
      case 'scratch':
      case 'collectStars':
        return '/awardManagement/pages/' + router + '/' + router;
        break;
      case 'advanceSearch':
      case 'bindCellphone':
      case 'extensionPage':
      case 'mapDetail':
        return '/default/pages/' + router + '/' + router;
        break;
      case 'addAddress':
      case 'appointmentOrderDetail':
      case 'balance':
      case 'couponList':
      case 'couponListPage':
      case 'couponReceiveListPage':
      case 'goodsAdditionalInfo':
      case 'goodsComment':
      case 'goodsOrderDetail':
      case 'goodsOrderPaySuccess':
      case 'groupCenter':
      case 'groupOrderDetail':
      case 'groupRules':
      case 'logisticsPage':
      case 'makeAppointment':
      case 'makeComment':
      case 'myAddress':
      case 'myOrder':
      case 'previewAppointmentOrder':
      case 'previewGoodsOrder':
      case 'recharge':
      case 'searchAddress':
      case 'transferOrderDetail':
      case 'transferPage':
      case 'transferPaySuccess':
      case 'verificationCodePage':
      case 'vipCard':
      case 'goodsCustomerService':
      case 'goodsFootPrint':
      case 'goodsFavorites':
      case 'shoppingCart':
      case 'invoiceDetails':
      case 'priceBreakDiscount':
      case 'invoiceList':
        return '/eCommerce/pages/' + router + '/' + router;
        break;
      case 'franchiseeCooperation':
      case 'franchiseeDetail':
      case 'franchiseeDetail4':
      case 'franchiseeFacility':
      case 'franchiseeEnter':
      case 'franchiseeEnterStatus':
      case 'franchiseeList':
      case 'franchiseePerfect':
      case 'franchiseeTostore':
      case 'franchiseeWaimai':
      case 'goodsMore':
        return '/franchisee/pages/' + router + '/' + router;
        break;
      case 'communityDetail':
      case 'communityFailpass':
      case 'communityNotify':
      case 'communityPage':
      case 'communityPublish':
      case 'communityReply':
      case 'communityReport':
      case 'communityUsercenter':
      case 'newsDetail':
      case 'newsReply':
        return '/informationManagement/pages/' + router + '/' + router;
        break;
      case 'makeTostoreComment':
      case 'paySuccess':
      case 'previewOrderDetail':
      case 'previewTakeoutOrder':
      case 'takeoutMakeComment':
      case 'takeoutOrderDetail':
      case 'tostoreComment':
      case 'tostoreOrderDetail':
        return '/orderMeal/pages/' + router + '/' + router;
        break;
      case 'promotionApply':
      case 'promotionCommission':
      case 'promotionGoods':
      case 'promotionLeaderPromotion':
      case 'promotionMyIdentity':
      case 'promotionMyPromotion':
      case 'promotionShopSetting':
      case 'promotionTeam':
      case 'promotionUserCenter':
      case 'promotionUserLevel':
      case 'promotionWithdraw':
      case 'promotionWithdrawOffline':
      case 'promotionWithdrawRecord':
      case 'communityGroupGoodDetail':
      case 'communityGroupSearchVillage':
        return '/promotion/pages/' + router + '/' + router;
        break;
      case 'communityCommission':
      case 'communityGoods':
      case 'communityGroupApply':
      case 'communityGroupApplyStatus':
      case 'communityGroupDoor':
      case 'communityGroupInfo':
      case 'commuGroupGoods':
      case 'communityGroupUserCenter':
      case 'communityPromotion':
      case 'communityRecruit':
      case 'communityGroupOrder':
          return '/communityGroup/pages/' + router + '/' + router;
          break;
      case 'myIntegral':
      case 'myMessage':
      case 'vipCardList':
      case 'winningRecord':
      case 'myFormMessage':
      case 'myAttention':
      case 'userCenter':
        return '/userCenter/pages/' + router + '/' + router;
        break;
      case 'videoAssess':
      case 'videoDetail':
      case 'videoUsercenter':
        return '/video/pages/' + router + '/' + router;
        break;
      case 'myGroup':
        return '/group/pages/gpmyOrder/gpmyOrder';
        break
      case 'myTimeCard':
        return '/tradeApt/pages/' + router + '/' + router;
        break
      case 'myGiftCardsList':
        return '/giftCard/pages/' + router + '/' + router;
        break
      case 'myShoppingCardsList':
        return '/shoppingCard/pages/' + router + '/' + router;
        break
    }
  },
  _getSystemInfo: function (options) {
    wx.getSystemInfo({
      success: function (res) {
        typeof options.success === 'function' && options.success(res);
      },
      fail: function (res) {
        typeof options.fail === 'function' && options.fail(res);
      },
      complete: function (res) {
        typeof options.complete === 'function' && options.complete(res);
      }
    });
  },
  sendRequest: function (param, customSiteUrl) {
    let that = this;
    let data = param.data || {};
    let header = param.header;
    let requestUrl;
    if (param.subshop) {
      data._app_id = data.app_id = param.subshop;
      param.chain = false;
    }
    if (param.chain && this.globalData.chainAppId) {
      data._app_id = data.app_id = this.getChainAppId();
    }
    if (data.app_id) {
      data._app_id = data.app_id;
    } else {
      data._app_id = data.app_id = this.getAppId();
    }
    if (!this.globalData.notBindXcxAppId && this.globalData.isLogin) {
      data.session_key = this.getSessionKey();
    }
    if (customSiteUrl) {
      requestUrl = customSiteUrl + param.url;
    } else {
      requestUrl = this.globalData.siteBaseUrl + param.url;
    }
    if (param.method) {
      if (param.method.toLowerCase() == 'post') {
        data = this._modifyPostParam(data);
        header = header || {
          'content-type': 'application/x-www-form-urlencoded;',
          'tgroup': this.globalData.tgroup
        }
      }
      param.method = param.method.toUpperCase();
    }
    if (!param.hideLoading) {
      this.showLoading({
        title: '请求中...'
      });
    }
    wx.request({
      url: requestUrl,
      data: data,
      method: param.method || 'GET',
      header: header || {
        'content-type': 'application/json',
        'tgroup': this.globalData.tgroup
      },
      success: function (res) {
        if (res.statusCode && res.statusCode != 200) {
          that.hideToast();
          that.showToast({
            title: '' + res.errMsg,
            icon: 'none'
          });
          typeof param.successStatusAbnormal == 'function' && param.successStatusAbnormal(res.data);
          return;
        }
        if (res.data.status) {
          if (res.data.status == 2 || res.data.status == 401) {
            that.goLogin({
              success: function () {
                that.sendRequest(param, customSiteUrl);
              },
              fail: function () {
                typeof param.successStatusAbnormal == 'function' && param.successStatusAbnormal(res.data);
              }
            });
            return;
          }
          if (res.data.status == 5) {
            typeof param.successStatus5 == 'function' && param.successStatus5(res.data);
            return;
          }
          if (res.data.status != 0) {
            if (typeof param.successStatusAbnormal == 'function' && (param.successStatusAbnormal(res.data) === false)) {
              return;
            }
            that.hideToast();
            that.showModal({
              content: '' + res.data.data,
              confirm: function () {
                typeof param.successShowModalConfirm == 'function' && param.successShowModalConfirm(res.data);
              }
            });
            return;
          }
        }
        typeof param.success == 'function' && param.success(res.data);
      },
      fail: function (res) {
        console.log('request fail:', requestUrl, res.errMsg);
        that.addLog('request fail:', requestUrl, res.errMsg);
        that.hideToast();
        if (res.errMsg == 'request:fail url not in domain list') {
          that.showToast({
            title: '请配置正确的请求域名',
            icon: 'none',
            duration: 2000
          });
        }
        typeof param.fail == 'function' && param.fail(res.data);
      },
      complete: function (res) {
        param.hideLoading || that.hideLoading();
        typeof param.complete == 'function' && param.complete(res.data);
      }
    });
  },
  _modifyPostParam: function (obj) {
    let query = '';
    let name, value, fullSubName, subName, subValue, innerObj, i;
    for (name in obj) {
      value = obj[name];
      if (value instanceof Array) {
        for (i = 0; i < value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += this._modifyPostParam(innerObj) + '&';
        }
      } else if (value instanceof Object) {
        for (subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += this._modifyPostParam(innerObj) + '&';
        }
      } else if (value !== undefined && value !== null) {
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
      }
    }
    return query.length ? query.substr(0, query.length - 1) : query;
  },
  turnToPage: function (url, isRedirect, urlOptions) {
    let tabBarPagePathArr = this.getTabPagePathArr();
    if (this.globalData.turnToPageFlag)return;
    this.globalData.turnToPageFlag = true;
    setTimeout(() => {
      this.globalData.turnToPageFlag = false;
    }, 1000);
    let curl = url.replace(/\?(.)+/, '');
    if (tabBarPagePathArr.indexOf(curl) != -1) {
      this.switchToTab(url);
      return;
    }
    let router = url.split('/');
    router = router[router.length - 2];
    if (/page/.test(router)) {
      let subPack = this.subPackagePages || {};
      for (let i in subPack) {
        if (subPack[i].indexOf(router) > -1) {
          url = '/' + i + url;
          break;
        }
      }
    }
    if (this.globalData.chainAppId) {
      url = this.chainTurnToPage(url);
    }
    if(/^\/pages\/goodsDetail\/goodsDetail/.test(url)){ //这个判断先加上，年后来了在删除掉
      url = '/detail' + url;
    }
    if (!isRedirect) {
      wx.navigateTo({
        url: url,
        complete: (res) => {
          if (res.errMsg && /fail/i.test(res.errMsg) && this.globalData.appScene !== 1154) {
            let errMsg = '跳转的页面不存在';
            if (/webview\scount\slimit\sexceed/i.test(res.errMsg)) {
              errMsg = '页面栈达到最大10层限制，跳转失败';
            }
            this.showModal({
              content: errMsg
            });
          }
        }
      });
    } else {
      wx.redirectTo({
        url: url,
        complete: (res) => {
          if (res.errMsg && /fail/i.test(res.errMsg) && this.globalData.appScene !== 1154) {
            this.showModal({
              content: '跳转的页面不存在'
            });
          }
        }
      });
    }
    this.globalData.urlOptions = urlOptions;  //存储页面路径
    this.setPageRouter(url);
  },
  getUrlOptions: function(){
    return this.globalData.urlOptions;
  },
  chainTurnToPage: function (url) {
    let that = this;
    let router = url.split('/');
    router = router[router.length - 2];
    let pages = ['shoppingCart', 'tabbarShoppingCart', 'groupCenter', 'tabbarGroupCenter', 'tabbarTransferPage', 'winningRecord', 'goodsShoppingCart', 'tabbarGoodsShoppingCart'];
    if (pages.indexOf(router) > -1) {
      let m = url.match(/(^|&|\?)franchisee=([^&]*)(&|$)/);
      if (!(m && m[2])) {
        if (/\?/.test(url)) {
          url += '&franchisee=' + that.globalData.chainAppId;
        } else {
          url += '?franchisee=' + that.globalData.chainAppId;
        }
      }
    }
    return url;
  },
  reLaunch: function (options) {
    this.setPageRouter(options.url);
    wx.reLaunch({
      url: options.url,
      success: options.success,
      fail: options.fail,
      complete: options.complete
    })
  },
  switchToTab: function (url) {
    wx.switchTab({
      url: url
    });
  },
  turnBack: function (options) {
    options = options || {};
    wx.navigateBack({
      delta: options.delta || 1
    });
  },
  navigateToXcx: function (param = {}) {
    let that = this;
    if (wx.navigateToMiniProgram) {
      wx.navigateToMiniProgram({
        appId: param.appId,
        path: param.path,
        fail: function (res) {
          if (res.errMsg != "navigateToMiniProgram:fail cancel") {
            that.showModal({
              content: '' + res.errMsg
            })
          }
        }
      });
    } else {
      this.showUpdateTip();
    }
  },
  setPageTitle: function (title) {
    wx.setNavigationBarTitle({
      title: this.promotionName || title
    });
  },
  setPageNavigationBgColor: function (options) {
    let frontColor = options.frontColor;
    switch (frontColor) {
      case 'black': 
        frontColor = '#000000';
        break;
      case 'white':
        frontColor = '#ffffff';
        break;
      default:
        break;
    }
    wx.setNavigationBarColor({
      frontColor: frontColor,
      backgroundColor: options.backgroundColor
    })
  },
  showToast: function (param) {
    wx.showToast({
      title: param.title,
      icon: param.icon,
      duration: param.duration || 1500,
      success: function (res) {
        typeof param.success == 'function' && param.success(res);
      },
      fail: function (res) {
        typeof param.fail == 'function' && param.fail(res);
      },
      complete: function (res) {
        typeof param.complete == 'function' && param.complete(res);
      }
    })
  },
  hideToast: function () {
    wx.hideToast();
  },
  showLoading: function (param) {
    wx.showLoading({
      title: param.title,
      success: function (res) {
        typeof param.success == 'function' && param.success(res);
      },
      fail: function (res) {
        typeof param.fail == 'function' && param.fail(res);
      },
      complete: function (res) {
        typeof param.complete == 'function' && param.complete(res);
      }
    })
  },
  hideLoading: function () {
    wx.hideLoading();
  },
  showModal: function (param) {
    wx.showModal({
      title: param.title || '提示',
      content: param.content,
      showCancel: param.showCancel || false,
      cancelText: param.cancelText || '取消',
      cancelColor: param.cancelColor || '#000000',
      confirmText: param.confirmText || '确定',
      confirmColor: param.confirmColor || '#3CC51F',
      success: function (res) {
        if (res.confirm) {
          typeof param.confirm == 'function' && param.confirm(res);
        } else {
          typeof param.cancel == 'function' && param.cancel(res);
        }
      },
      fail: function (res) {
        typeof param.fail == 'function' && param.fail(res);
      },
      complete: function (res) {
        typeof param.complete == 'function' && param.complete(res);
      }
    })
  },
  chooseVideo: function (param, maxDuration, source) {
    let that = this;
    let result = { progress: 0, video: {} };
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: maxDuration || 60,
      success: function(res) {
        let filePath = res.tempFilePath,
          fileSize = res.size,
          fileName = filePath.split('.').slice(-2).join('.'),
          fileKey = '',
          fileToken = '';
        if (fileSize/1024/1024 >= 20) {
          wx.showModal({
            content: '当前上传视频大于20M，请重新上传~'
          })
          return;
        }
        that.getVideoUpToken({
          file_name: fileName,
          size: fileSize,
          tag_name: source || '应用数据'
        }, data => {
          fileKey = data.key;
          fileToken = data.token;
          qiniuUploader.upload(filePath, res => {
            that.uploadSuccessCallback({
              key: fileKey,
              fsize: fileSize,
              preview_img: res.imageURL
            }, finaldata => {
              result.video.image_url = finaldata.img_url;
              result.video.video_id = finaldata.id;
              result.video.file_size = finaldata.file_size;
              that.getVideoUrlById(finaldata.id, function(videodata) {
                result.video.video_url = videodata;
                typeof param.complete === 'function' && param.complete(result);
              });
            })
          }, err => {
            console.log(err);
            typeof param.fail === 'function' && param.fail(result);
          }, {
            region: 'SCN',
            key: fileKey, // [非必须]自定义文件 key。如果不设置，默认为使用微信小程序 API 的临时文件名
            uptoken: fileToken, // 由其他程序生成七牛 uptoken
          }, (bar) => {
            result.progress = bar.progress;
            typeof param.success === 'function' && param.success(result);
          })
        })
      },
      fail: function (err) {
        typeof param.fail === 'function' && param.fail(err, result);
      }
    })
  },
  getVideoUpToken: function (file, callback) {
    if (!file.file_name) {
      return;
    }
    if (/[!*();:@&=+$/?#\[\]]/.test(file.file_name)) { // 过滤无效字符
      file.file_name = file.file_name.replace(/[!*();:@&=+$/?#\[\]]/g, '_');
    }
    let param = {
      file_name: file.file_name,
      size: file.size,
      tag_id: 0,
      tag_name: file.tag_name
    };
    this.sendRequest({
      url: '/index.php?r=AppVideo/GenerateToken',
      data: param,
      success: function (res) {
        typeof callback === 'function' && callback(res.data);
      },
      fail: function (err) {
        console.log(err);
      }
    });
  },
  uploadSuccessCallback: function (file, callback) {
    if (!file.key) {
      return;
    }
    let param = {
      key: file.key, // 获取token中有个key值
      fsize: file.fsize, // 文件大小
      tag_id: 0, // 分组id
      title: '', // 标题
      preview_img: '', // 预览图
      is_new_manager: 0, //是否为新管理后台
      type: 1
    }
    this.sendRequest({
      url: '/index.php?r=/AppVideo/UploadSuccessCallback',
      data: param,
      success: function (res) {
        typeof callback === 'function' && callback(res.data);
      },
      fail: function (err) {
        console.log(err);
      }
    });
  },
  getVideoUrlById: function (video_id, callback) {
    if (!video_id) {
      return;
    }
    let that = this;
    this.sendRequest({
      url: '/index.php?r=AppVideo/GetVideoLibURL',
      data: {
        id: video_id
      },
      success: function (res) {
        typeof callback === 'function' && callback(res.data);
      },
      error: function (err) {
        console.log(err);
      }
    });
  },
  chooseImage: function (callback, count) {
    let that = this;
    wx.chooseImage({
      count: count || 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        let tempFilePaths = res.tempFilePaths,
          imageUrls = [],
          imglength = 0;
        that.showToast({
          title: '提交中...',
          icon: 'loading',
          duration: 10000
        });
        for (let i = 0; i < tempFilePaths.length; i++) {
          wx.uploadFile({
            url: that.globalData.siteBaseUrl + '/index.php?r=AppData/uploadImg',
            filePath: tempFilePaths[i],
            name: 'img_data',
            success: function (res) {
              let data = JSON.parse(res.data);
              if (data.status == 0) {
                imageUrls[i] = data.data;
                imglength++;
                if (imglength == tempFilePaths.length) {
                  that.hideToast();
                  typeof callback == 'function' && callback(imageUrls);
                }
              } else {
                that.hideToast();
                that.showModal({
                  content: data.data
                })
              }
            },
            fail: function (res) {
              that.hideToast();
              if (res.errMsg == "uploadFile:fail socket timeout error") {
                that.showModal({
                  content: '文件上传超时，请重试！'
                });
              }else {
                that.showModal({
                  content: '' + res.errMsg
                });
              }
            }
          })
        }
      },
      fail: function (res) {
        if (res.errMsg != 'chooseImage:fail cancel') {
          that.showModal({
            content: '' + res.errMsg
          })
        }
      }
    })
  },
  previewImage: function (options) {
    wx.previewImage({
      current: options.current || '',
      urls: options.urls || [options.current]
    })
  },
  playVoice: function (filePath) {
    wx.playVoice({
      filePath: filePath
    });
  },
  pauseVoice: function () {
    wx.pauseVoice();
  },
  countUserShareApp: function (callback) {
    let addTime = Date.now(); //获取最新积分时间戳参数
    this.sendRequest({
      url: '/index.php?r=AppShop/UserShareApp',
      hideLoading: true,
      complete: function (res) {
        if (res.status == 0) {
          typeof callback === 'function' && callback(addTime);
        }
      }
    });
  },
  getShareKey: function () {
    let that = this;
    that.sendRequest({
      url: "/index.php?r=AppShare/GetAppShareKey",
      hideLoading: true,
      success: res => {
        if (res.status == 0) {
          that.globalData.pageShareKey = res.data;
        }
      }
    })
  },
  getShareAppSetting: function () {
    let that = this;
    this.sendRequest({
      url: '/index.php?r=AppConfig/GetAppPageShareConfig',
      hideLoading: true,
      data: {},
      success: function (res) {
        that.globalData.share_img = res.data.share_img;
        that.globalData.share_title = res.data.share_title;
        res.data.app_name && (that.globalData.appTitle = res.data.app_name);
        res.data.logo && (that.globalData.appLogo = res.data.logo);
      }
    })
  },
  shareAppMessage: function (options) {
    let that = this,
      image = '',
      title = '',
      pageInstance = this.getAppCurrentPage(),
      pageShareKey = that.globalData.pageShareKey,
      pageShareType = that.globalData.pageShareType,
      path = options.path;
    if (pageShareKey) {
      if (path.indexOf('?') < 0) {
        path = path + '?psid=' + pageShareKey
      } else {
        path = path + '&psid=' + pageShareKey
      }
    } else {
      path = path
    }
    if (pageShareType == 1) {
      that.getRecvChance(1);
    }
    if(options.title){
      title = options.title;
    } else if (pageInstance.data.page_config && pageInstance.data.page_config.share) {
      title = pageInstance.data.page_config.share_title;
    } else {
      title = this.globalData.share_title || this.getAppTitle() || '即速应用';
    }
    if (options.imageUrl) {
      image = options.imageUrl;
    } else if (pageInstance.data.page_config && pageInstance.data.page_config.share) {
      image = pageInstance.data.page_config.share_img || '';
    } else {
      image = this.globalData.share_img || '';
    }
    if (that.globalData.p_id !== undefined) { // 分销分享添加p_id
      path += (~path.indexOf('?') ? '&' : '?');
      path += 'p_id=' + that.globalData.p_id;
    }
    let chainId = this.globalData.chainAppId;
    if (that.globalData.hasFranchiseeTrade && !chainId) {
      chainId = that.globalData.appId;   // 分享商圈总店页面
    }
    if (chainId && /\?/.test(path) && !/c_id/.test(path)) {
      path = path + '&c_id=' + chainId;
    } else if (chainId && !/c_id/.test(path)) {
      path = path + '?c_id=' + chainId;
    }
    if (this.globalData.shareNeedLock) {
      if (/\?/.test(path) && !/shareLock/.test(path)) {
        path = path + '&shareLock=1';
      } else if (!/shareLock/.test(path)) {        
        path = path + '?shareLock=1';
      }
    } 
    return {
      title: title,
      path: path,
      imageUrl: image,
      success: function () {
      },
      complete: function (res) {
      }
    }
  },
  wxPay: function (param) {
    let _this = this;
    wx.requestPayment({
      'timeStamp': param.timeStamp,
      'nonceStr': param.nonceStr,
      'package': param.package,
      'signType': param.signType,
      'paySign': param.paySign,
      success: function (res) {
        _this.wxPaySuccess(param);
        typeof param.success === 'function' && param.success();
      },
      fail: function (res) {
        if (res.errMsg === 'requestPayment:fail cancel') {
          _this.showModal({
            content: '支付已取消',
            complete: function () {
              typeof param.fail === 'function' && param.fail();
            }
          });
          return;
        }
        if (res.errMsg === 'requestPayment:fail') {
          res.errMsg = '支付失败';
        }
        if (res.errMsg.indexOf('ETIMEDOUT')){
          res.errMsg = '支付超时！';
        }
        _this.showModal({
          content: res.errMsg
        })
        _this.wxPayFail(param, res.errMsg);
        typeof param.fail === 'function' && param.fail(res);
      }
    })
  },
  wxPaySuccess: function (param) {
    let orderId = param.orderId,
      goodsType = param.goodsType,
      formId = param.package.substr(10),
      t_num = goodsType == 1 ? 'AT0104' : 'AT0009';
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/SendXcxOrderCompleteMsg',
      data: {
        formId: formId,
        t_num: t_num,
        order_id: orderId
      }
    })
  },
  wxPayFail: function (param, errMsg) {
    let orderId = param.orderId,
    formId = param.package.substr(10);
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/SendXcxOrderCompleteMsg',
      data: {
        formId: formId,
        t_num: 'AT0010',
        order_id: orderId,
        fail_reason: errMsg
      }
    })
  },
  makePhoneCall: function (number, callback) {
    wx.makePhoneCall({
      phoneNumber: number,
      success: callback
    })
  },
  getLocation: function (options) {
    let that = this;
    wx.getLocation({
      type: options.type || 'wgs84',
      altitude: options.altitude || false,
      success: function (res) {
        typeof options.success === 'function' && options.success(res);
      },
      fail: function (res) {
        console.log('getLocation fail', res);
        that.addError('getLocation fail', res);
        typeof options.fail === 'function' && options.fail(res);
      }
    })
  },
  chooseLocation: function (options) {
    let that = this;
    wx.chooseLocation({
      success: function (res) {
        typeof options.success === 'function' && options.success(res);
      },
      cancel: options.cancel,
      fail: function(res){
        if (res.errMsg === 'chooseLocation:fail auth deny'){
          that.showModal({
            content: '您之前拒绝授权我们使用您的定位，致使我们无法定位，是否重新授权定位？',
            showCancel: true,
            cancelText: "否",
            confirmText: "是",
            confirm: function () {
              wx.openSetting({
                success: function (res) {
                  if (res.authSetting['scope.userLocation'] === true) {
                    that.chooseLocation(options);
                  }
                }
              })
            },
            cancel: function () {
              typeof options.fail === 'function' && options.fail();
            }
          })
        } else {
          typeof options.fail === 'function' && options.fail();
        }
      }
    });
  },
  openLocation: function (options) {
    wx.openLocation(options);
  },
  getLatLng: function (options){
    let that = this;
    let locationInfo = that.globalData.locationInfo;
    if (locationInfo.latitude) {
      let latlng = {
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude
      };
      typeof options.success === 'function' && options.success(latlng);
    } else {
      this.getLocation({
        type: 'gcj02',
        success: function (res) {
          let latitude = res.latitude,
            longitude = res.longitude;
          if (latitude) {
            that.sendRequest({
              hideLoading: true,
              url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
              data: {
                latitude: latitude,
                longitude: longitude
              },
              success: function (res) {
                that.setLocationInfo({
                  latitude: latitude,
                  longitude: longitude,
                  address: res.data.formatted_addresses && res.data.formatted_addresses.recommend,
                  info: res.data
                });
              }
            });
            let latlng = {
              latitude: latitude,
              longitude: longitude
            };
            typeof options.success === 'function' && options.success(latlng);
          } else {
            typeof options.fail === 'function' && options.fail();
          }
        },
        fail: function () {
          typeof options.fail === 'function' && options.fail();
        }
      });
    }
  },
  setClipboardData: function (options) {
    wx.setClipboardData({
      data: options.data || '',
      success: options.success,
      fail: options.fail,
      complete: options.complete
    })
  },
  getClipboardData: function (options) {
    wx.getClipboardData({
      success: options.success,
      fail: options.fail,
      complete: options.complete
    })
  },
  showShareMenu: function (options) {
    options = options || {};
    wx.showShareMenu({
      withShareTicket: options.withShareTicket || false,
      success: options.success,
      fail: options.fail,
      complete: options.complete
    });
  },
  scanCode: function (options) {
    options = options || {};
    wx.scanCode({
      onlyFromCamera: options.onlyFromCamera || false,
      success: options.success,
      fail: options.fail,
      complete: options.complete
    })
  },
  pageScrollTo: function (scrollTop) {
    if (wx.pageScrollTo) {
      wx.pageScrollTo({
        scrollTop: scrollTop
      });
    } else {
      this.showUpdateTip();
    }
  },
  getAuthSetting: function () {
    wx.getSetting({
      success: function (res) {
        return res.authSetting;
      },
      fail: function () {
        return {};
      }
    })
  },
  getStorage: function (options) {
    options = options || {};
    wx.getStorage({
      key: options.key || '',
      success: function (res) {
        typeof options.success === 'function' && options.success(res);
      },
      fail: function () {
        typeof options.fail === 'function' && options.fail();
      },
      complete: function (res) {
        typeof options.complete === 'function' && options.complete(res);
      }
    })
  },
  setStorage: function (options) {
    options = options || {};
    wx.setStorage({
      key: options.key || '',
      data: options.data || '',
      success: function () {
        typeof options.success === 'function' && options.success();
      },
      fail: function () {
        typeof options.fail === 'function' && options.fail();
      },
      complete: function () {
        typeof options.complete === 'function' && options.complete();
      }
    })
  },
  removeStorage: function (options) {
    options = options || {};
    wx.removeStorage({
      key: options.key || '',
      success: function () {
        typeof options.success === 'function' && options.success();
      },
      fail: function () {
        typeof options.fail === 'function' && options.fail();
      },
      complete: function () {
        typeof options.complete === 'function' && options.complete();
      }
    })
  },
  createAnimation: function (options) {
    options = options || {};
    return wx.createAnimation({
      duration: options.duration,
      timingFunction: options.timingFunction,
      transformOrigin: options.transformOrigin,
      delay: options.delay
    });
  },
  chooseAddress: function (options) {
    let that = this;
    options = options || {};
    wx.chooseAddress({
      success: function (res) {     // 选择地址完成
        typeof options.success === 'function' && options.success(res);
      },
      fail: function (res) {
        if (res && (res.errMsg === "chooseAddress:fail auth deny" || res.errMsg === "chooseAddress:fail:auth denied" || res.errMsg === "chooseAddress:fail authorize no response")) {
          wx.showModal({
            title: '提示',
            content: '导入失败，您未授权通讯地址，这将影响您使用小程序。请先开启授权后再试。',
            showCancel: false,
            confirmText: "去授权",
            success: function (res) {
              wx.openSetting({
                complete(res) {
                  typeof options.fail === 'function' && options.fail(res);
                }
              })
            }
          })
        } else {
          typeof options.fail === 'function' && options.fail(res);
        }
      },
      complete: function (res) {
        typeof options.complete === 'function' && options.complete(res);
      }
    })
  },
  downloadFile: function (url, successfn) {
    wx.downloadFile({
      url: url,
      success: function (res) {
        successfn && successfn(res);
      }
    })
  },
  connectWifi: function (option) {
    wx.connectWifi({
      SSID: option.SSID || '',
      BSSID: option.BSSID || '',
      password: option.password || '',
      success: function (res) {
        option.success && option.success(res)
      },
      fail: function (res) {
        option.fail && option.fail(res)
      },
      complete: function (res) {
        option.complete && option.complete(res);
      }
    })
  },
  startWifi: function (option) {
    wx.startWifi({
      success: function (res) {
        option.success && option.success(res);
      },
      fail: function (res) {
        option.fail && option.fail(res);
      },
      complete: function (res) {
        option.complete && option.complete(res);
      }
    })
  },
  wifiErrCode: function (code) {
    switch (code) {
      case 12000:
        return '未初始化Wi-Fi模块';
        break;
      case 12001:
        return '系统暂不支持连接 Wi-Fi';
        break;
      case 12002:
        return 'Wi-Fi 密码错误';
        break;
      case 12003:
        return '连接超时';
        break;
      case 12004:
        return '重复连接 Wi-Fi';
        break;
      case 12005:
        return '未打开 Wi-Fi 开关';
        break;
      case 12006:
        return '未打开 GPS 定位开关';
        break;
      case 12007:
        return '已拒绝授权链接 Wi-Fi';
        break;
      case 12008:
        return 'Wi-Fi名称无效';
        break;
      case 12009:
        return '运营商配置拒绝连接 Wi-Fi';
        break;
      case 12010:
        return '系统错误';
        break;
      case 12011:
        return '无法配置 Wi-Fi';
        break;
      default:
        return '连接失败';
        break;
    }
  },
  checkSession: function (callback) {
    let that = this;
    wx.checkSession({
      success: function () {
        typeof callback == 'function' && callback();
        console.log('session valid');
        that.addLog('session valid');
      },
      fail: function () {
        console.log('session Invalid');
        that.addLog('session Invalid');
        that.setSessionKey('');
        that._login({
          success: function () {
            typeof callback == 'function' && callback();
          }
        });
      }
    })
  },
  goLogin: function (options) {
    this._sendSessionKey(options);
  },
  isLogin: function () {
    return this.getIsLogin();
  },
  _sendSessionKey: function (options) {
    let that = this, key;
    try {
      key = wx.getStorageSync('session_key');
    } catch (e) {
      console.log('wx.getStorageSync session_key error');
      console.log(e);
      that.addLog('wx.getStorageSync session_key error');
    }
    console.log('_logining', that._logining);
    that.addLog('_logining', that._logining);
    if (that._logining) {
      that.globalData.showGetUserInfoOptions.push(options);
      return;
    }
    that._logining = true;
    that.globalData.showGetUserInfoOptions.push(options);
    if (!key) {
      console.log("check login key=====");
      that.addLog("check login key=====");
      this._login();
    } else {
      this.globalData.sessionKey = key;
      this.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppUser/onLogin',
        data: {
          session_key: key
        },
        success: function (res) {
          if (!res.is_login) {
            that._login();
            return;
          } else if (res.is_login == 2) {
            that.globalData.notBindXcxAppId = true;
          }
          that._requestUserInfo(res.is_login, res.need_unionid);
          if (!that.globalData.isGoBindPhone && res.is_login == 1) {
            const addTime = res.server_time - 2000;
            if (addTime) {
              that.loginForRewardPoint(res.server_time - 2000); //服务器时间减掉2S
            }
          }
        },
        fail: function (res) {
          console.log('_sendSessionKey fail');
          that.addLog('_sendSessionKey fail');
          let callback = that.globalData.showGetUserInfoOptions;
          for (let i = 0; i < callback.length; i++) {
            let options = callback[i];
            typeof options.fail == 'function' && options.fail(res);
          }
          that.globalData.showGetUserInfoOptions = [];
        },
        successStatusAbnormal: function () {
          that._logining = false;
        },
        complete: () => {
          that._logining = false;
        }
      });
    }
  },
  _logining: false,
  _login: function () {
    let that = this;
    wx.login({
      success: function (res) {
        if (res.code) {
          that._sendCode(res.code);
        } else {
          console.log('获取用户登录态失败！' + res.errMsg);
          that.addLog('获取用户登录态失败！' + res.errMsg);
        }
      },
      fail: function (res) {
        that._logining = false;
        console.log('login fail: ' + res.errMsg);
        that.addLog('login fail: ' + res.errMsg);
      },
      complete: () => {
        that._logining = false;
      }
    })
  },
  _sendCode: function (code) {
    let that = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppUser/onLogin',
      data: {
        code: code
      },
      success: function (res) {
        if (res.is_login == 2) {
          that.globalData.notBindXcxAppId = true;
        }
        that.setSessionKey(res.data || that.globalData.sessionKey);
        that._requestUserInfo(res.is_login, res.need_unionid);
        if (!that.globalData.isGoBindPhone && res.is_login == 1) {
          const addTime = res.server_time - 2000;
          if (addTime) {
            that.loginForRewardPoint(res.server_time - 2000); //服务器时间减掉2S
          }
        }
      },
      fail: function (res) {
        that._logining = false;
        console.log('_sendCode fail');
        that.addLog('_sendCode fail');
      },
      successStatusAbnormal: function () {
        that._logining = false;
      }
    })
  },
  _requestUserInfo: function (is_login, need_unionid) {
    if (is_login == 1 && need_unionid != 1) {
      this._requestUserXcxInfo();
    } else {
      this._requestUserWxInfo();
    }
  },
  _requestUserXcxInfo: function () {
    let that = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppData/getXcxUserInfo',
      data: {
        session_key: that.getSessionKey()
      },
      success: function (res) {
        if (res.data) {
          that.setUserInfoStorage(res.data);
          that.setPageUserInfo();
        }
        that.loginSuccessFunc(res);
      },
      fail: function (res) {
        console.log('_requestUserXcxInfo fail');
        that.addLog('_requestUserXcxInfo fail');
      },
      complete: function () {
        that._logining = false;
      }
    })
  },
  _requestUserWxInfo: function () {
    let that = this;
    wx.getSetting({
      success: function (res) {
        console.log('_requestUserWxInfo getSetting', res);
        that.addLog('_requestUserWxInfo getSetting', res);
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            withCredentials: true,
            lang: 'zh_CN',
            success: function (msg) {
              that._sendUserInfo(msg);
              that.bindUserCrmWxAccount(msg);
            },
            fail: function (msg) {
              console.log('getUserInfo fail');
              that.addLog('getUserInfo fail', msg);
            }
          })
        } else {
          let pageInstance = that.getAppCurrentPage();
          pageInstance.setData({
            showGetUserInfo: true
          });
        }
      },
      fail: function (res) {
        let pageInstance = that.getAppCurrentPage();
        pageInstance.setData({
          showGetUserInfo: true
        });
      }
    })
  },
  _sendUserInfo: function (msg) {
    let that = this;
    let pageInstance = that.getAppCurrentPage();
    let userInfo = msg.userInfo;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppUser/LoginUser',
      method: 'post',
      data: {
        session_key: that.getSessionKey(),
        nickname: userInfo['nickName'],
        gender: userInfo['gender'],
        city: userInfo['city'],
        province: userInfo['province'],
        country: userInfo['country'],
        avatarUrl: userInfo['avatarUrl']
      },
      success: function (res) {
        that.setUserInfoStorage(res.data.user_info);
        that.setPageUserInfo();
        if (!that.globalData.isGoBindPhone) {
          const addTime = res.server_time - 2000;
          if (addTime) {
            that.loginForRewardPoint(res.server_time - 2000); //服务器时间减掉2S
          }
        }
        that.bindXcxUserUnionId(msg);
        that.loginSuccessFunc(res);
      },
      fail: function (res) {
        console.log('_sendUserInfo fail');
        that.addLog('_sendUserInfo fail');
        let callback = that.globalData.showGetUserInfoOptions;
        for (let i = 0; i < callback.length; i++) {
          let options = callback[i];
          typeof options.fail == 'function' && options.fail(res);
        }
        that.globalData.showGetUserInfoOptions = [];
      },
      complete: function () {
        pageInstance.setData({
          showGetUserInfo: false
        });
        that._logining = false;
      }
    })
  },
  loginSuccessFunc: function(res){
    let that = this;
    that.setIsLogin(true);
    that.getShareKey();
    that._isPromotionPerson();
    that.getGroupLeaderLocking();  //获取社区团购锁定团长
    that._hasSelfCard();
    if (that.globalData.appOptions.query.account && that.globalData.appOptions.query.from_account) {
      that.bindWxAccound();
    }
    let appOptions = that.globalData.appOptions;
    if (appOptions && appOptions.query && appOptions.query.psid) {
      that.getRecvChance(2, appOptions.query.psid);
    }
    that.getEffectActivity();
    that.getNewcomerActivity();
    that.getInviteNewActivity(appOptions.query.psid);
    if (appOptions.scene && appOptions.scene != 1089) {
      that.getCollectActivity();
    }
    if(appOptions.scene && appOptions.scene == 1089){
      that.recvCollectRewards();
    }
    if (appOptions && appOptions.scene && appOptions.query.psid) {
      that.postShareSuccess(appOptions.query.psid);
    }
    if (appOptions.query.p_id) {
      that.bindUserTokenByPid(appOptions.query.p_id);
    } else if (appOptions.query.user_token) {
      that._getPromotionUserToken({
        user_token: appOptions.query.user_token
      });
    }
    let callback = that.globalData.showGetUserInfoOptions;
    for (let i = 0; i < callback.length; i++) {
      let options = callback[i];
      typeof options.success === 'function' && options.success();
    }
    that.globalData.showGetUserInfoOptions = [];
  },
  bindXcxUserUnionId: function(msg){
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppUser/BindXcxUserUnionId',
      method: 'post',
      data: {
        encrypted_data: msg.encryptedData,
        iv: msg.iv,
        app_type: 1,
        session_key: this.getSessionKey()
      }
    })
  },
  bindWxAccound: function () {
    let appid = this.getAppId();
    wx.request({
      url: this.globalData.siteBaseUrl + '/index.php?r=AppUser/BindWeixinAccount',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'tgroup': this.globalData.tgroup
      },
      data: {
        account: this.globalData.appOptions.query.account,
        from_account: this.globalData.appOptions.query.from_account,
        app_id: appid,
        _app_id: appid,
        session_key: this.getSessionKey()
      }
    })
  },
  bindUserCrmWxAccount: function(msg) {
    let appid = this.getAppId();
    if(!this.globalData.appOptions.query.account || appid !== 'pja9mENKU1'){
      return;
    }
    wx.request({
      url: this.globalData.siteBaseUrl + '/index.php?r=AppUser/UserCrmWxAccountBind',
      method: 'GET',
      header: {
        'content-type': 'application/json',
        'tgroup': this.globalData.tgroup
      },
      data: {
        account: this.globalData.appOptions.query.from_account,
        app_id: appid,
        _app_id: appid,
        session_key: this.getSessionKey(),
        encrypted_data: msg.encryptedData,
        iv: msg.iv
      }
    })
  },
  promotionName: '', // 外部传递进来的标题
  onPageLoad: function (event) {
    let pageInstance = this.getAppCurrentPage();
    let detail = event.detail || '';
    this.promotionName = event.promotionName;
    let that = this;
    pageInstance.sharePageParams = event;
    pageInstance.setData({
      dataId: detail,
      canIUseOfficialAccount: that.globalData.canIUseOfficialAccount
    });
    this.setPageUserInfo();
    this.checkTechSupport(pageInstance);
    if (detail) {
      pageInstance.dataId = detail;
    }
    if (!!pageInstance.carouselGroupidsParams) {
      for (let i in pageInstance.carouselGroupidsParams) {
        let compid = pageInstance.carouselGroupidsParams[i].compid;
        let carouselgroupId = pageInstance.carouselGroupidsParams[i].carouselgroupId;
        if (carouselgroupId) {
          let deletePic = {};
          deletePic[compid + '.content'] = [];
          pageInstance.setData(deletePic);
        }
      }
    }
    this.globalData.takeoutRefresh = false;
    this.globalData.tostoreRefresh = false;
    if (pageInstance.page_router) {
      this.globalData['franchiseeTplChange-' + pageInstance.page_router] = false;
    }
    if (!this.globalData.chainNotLoading) {
      pageInstance.dataInitial();
    }
    if (that.globalData.isGoBindPhone) {
      that.loginForRewardPoint(that.globalData.loginGetIntegralTime);
      that.globalData.loginGetIntegralTime = '';
      that.globalData.isGoBindPhone = false;
    }
    pageInstance.setData({
      sessionFrom: this.getPageFranchiseeId() || this.globalData.appId
    })
  },
  toCompareRole: function (callback) {
    let pageInstance = this.getAppCurrentPage();
    let appRole = Number(pageInstance.data.page_config.AppRole);        //  appRole 1 特定用户  2 特定会员
    let appRoleData = pageInstance.data.page_config.appRoleData;
    let appVipData = pageInstance.data.page_config.appVipData;
    let curVip = this.globalData.curVipCard;
    let _userInfo = this.getUserInfo();
    let hasRole = false;
    if (appRole == 1) {
      if (_userInfo.role_name && _userInfo.role_name.length) {
        _userInfo.role_name.some(value => {
          if (appRoleData.find(item => item.role_name == value)) {
            hasRole = true;
            return true;
          }
        })
      };
    } else if (appRole == 2) {
      this.getVipListData().then(res => {
        appVipData.some(value => {
          if(res.includes(value.id)){
            hasRole = true;
            return true;
          }
        });
        if (!hasRole) {
          typeof callback == 'function' && callback(true);
        } else {
          typeof callback == 'function' && callback(false);
        }
      })
      return;
    }
    if (!hasRole) {
      typeof callback == 'function' && callback(true);
    } else {
      typeof callback == 'function' && callback(false);
    }
  },
  updataUserInfo: function (callback) {
    let _this = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppData/getXcxUserInfo',
      data: {
        session_key: _this.getSessionKey()
      },
      success: function (res) {
        if (res.data) {
          _this.setUserInfoStorage(res.data);
          _this.setPageUserInfo();
        }
        typeof callback == 'function' && callback();
      }
    })
  },
  pullRefreshTime: '',
  onPagePullDownRefresh: function () {
    let pageInstance = this.getAppCurrentPage();
    let that = this;
    let downcountArr = pageInstance.downcountArr;
    if (downcountArr && downcountArr.length) {
      for (let i = 0; i < downcountArr.length; i++) {
        downcountArr[i] && downcountArr[i].clear();
      }
    }
    if (pageInstance.verticalListComps && pageInstance.verticalListComps.length) {
      for (let i in pageInstance.verticalListComps) {
        let compid = pageInstance.verticalListComps[i].compid;
        if (pageInstance.data[compid] && pageInstance.data[compid].timer) {
          clearInterval(pageInstance.data[compid].timer);
        }
      }
    }
    let downcountObject = pageInstance.downcountObject;
    for (let key in downcountObject) {
      if (downcountObject[key] && downcountObject[key].length) {
        let downcountObjectNew = downcountObject[key]
        for (let i = 0; i < downcountObjectNew.length; i++) {
          downcountObjectNew[i] && downcountObjectNew[i].clear();
        }
      }
    }
    this.setPageUserInfo();
    pageInstance.requestNum = 1;
    this.pageDataInitial(true);
    clearTimeout(this.pullRefreshTime);
    this.pullRefreshTime = setTimeout(function () {
      wx.stopPullDownRefresh();
    }, 3000);
    this.globalData.tabbarInfo = {};
  },
  setPageScroll: function (pageInstance) {
    let that = this;
    const reachBottomMethodName = {
      'bbs': 'bbsScrollFuc',
      'list-vessel': 'listVesselScrollFunc',
      'goods-list': 'goodsScrollFunc',
      'times-card': 'timesCardScrollFunc',
      'seckill': 'seckillScrollFunc',
      'video-list': 'videoScrollFunc',
      'news': 'getNewsList',
      'topic': 'getTopListData',
      'franchisee-list': 'franchiseeScrollFunc',
      'exchange-coupon': 'exchangeCouponScrollFunc',
      'dynamic-classify': 'dynamicClassifyScrollFunc',
      'community-group': 'communityGroupScrollFunc',
      'group-buy-list': 'catchMoreGroupList',
      'presell': 'catchMorePresellList',
      'community-goods-list': 'communityGoodsScrollFunc',
      'shopping-card-list': 'shoppingCardsScrollFunc',
      'gift-card-list': 'giftCardsScrollFunc',
      'live': 'liveScrollFunc'
    };
    let reachBottomCompid = '';
    let reachBottomType = '';
    for (let i in pageInstance.data) {
      let ele = pageInstance.data[i];
      if (ele && ele.hidden) { // 判断组件是否隐藏
        continue;
      }
      let eleType = ele.type;
      let customFeature = ele.customFeature;
      if (reachBottomMethodName[eleType] && ((eleType == 'news' && customFeature.vesselAutoheight === undefined) || (customFeature.vesselAutoheight == 1 && customFeature.loadingMethod == 0) || eleType == 'bbs')) {
        reachBottomCompid = i;
        reachBottomType = eleType;
      }
    }
    if(!reachBottomCompid){
      return;
    }
    let reachBottomObj = {
      param: {
        compId: reachBottomCompid
      }
    };
    if (!customComponent[reachBottomType]) {
      return;
    }
    reachBottomObj['triggerFuc'] = (param) => {
      customComponent[reachBottomType][reachBottomMethodName[reachBottomType]](param.compId);
    }
    pageInstance.reachBottomFuc = [reachBottomObj];
  },
  pageDataInitial: function (isPullRefresh, pageIn, isAllowLoad) {
    let _this = this;
    let pageInstance = pageIn || this.getAppCurrentPage();
    let pageRequestNum = pageInstance.requestNum;
    let topNav = pageInstance.data.top_nav;
    pageInstance.downcountObject = pageInstance.downcountObject || {};
    let appRole = Number(pageInstance.data.page_config.AppRole);
    if (appRole && !isAllowLoad) {
      if (!pageInstance.isCompareRole) {
        pageInstance.isCompareRole = true;
        if (this.isLogin() && (this.getUserInfo().role_name != undefined || appRole == 2)) {
          this.updataUserInfo(function () {
            _this.toCompareRole(function (value) {
              if (value) {
                _this.showModal({
                  content: "您暂时没有浏览该页面的权限，请联系小程序管理员开通。",
                  confirm: function (res) {
                    pageInstance.isCompareRole = false;
                    _this.turnBack();
                  }
                })
              } else {
                pageInstance.isCompareRole = false;
                _this.pageDataInitial(isPullRefresh, pageIn, true);
              }
            })
          })
        } else {
          this.goLogin({
            success: function () {
              _this.toCompareRole(function (value) {
                if (value) {
                  _this.showModal({
                    content: "您暂时没有浏览该页面的权限，请联系小程序管理员开通。",
                    confirm: function (res) {
                      pageInstance.isCompareRole = false;
                      _this.turnBack();
                    }
                  })
                } else {
                  pageInstance.isCompareRole = false;
                  _this.pageDataInitial(isPullRefresh, pageIn, true);
                }
              })
            }
          });
        }
      }
      return;
    }
    if (topNav && topNav.navigationBarTitleText) {
      _this.setPageTitle(topNav.navigationBarTitleText);
      _this.setPageNavigationBgColor({
        frontColor: topNav.navigationBarTextStyle,
        backgroundColor: topNav.navigationBarBackgroundColor,
      })
    }
    if (!pageInstance.pageLoaded) {
      this._getPageData(pageInstance.page_router);
      return;
    }
    if (!isPullRefresh) {
      _this.setPageScroll(pageInstance);
    }
    if(!!pageInstance.dataId === false) {
      pageInstance.dataId = pageInstance.sharePageParams.dataId
    }
    if (!!pageInstance.dataId && !!pageInstance.page_form) {
      let dataid = parseInt(pageInstance.dataId);
      let param = {};
      param.data_id = dataid;
      param.form = pageInstance.page_form;
      pageInstance.requestNum = pageRequestNum + 1;
      _this.sendRequest({
        hideLoading: pageRequestNum++ == 1 ? false : true,
        url: '/index.php?r=AppData/getFormData',
        data: param,
        method: 'post',
        chain: true,
        success: function (res) {
          let newdata = {};
          let formdata = res.data[0] && res.data[0].form_data || {};
          for (let i in formdata) {
            if (i == 'category') {
              continue;
            }
            if (/region/.test(i)) {
              continue;
            }
            let description = formdata[i];
            if (_this.needParseRichText(description)) {
              formdata[i] = _this.getWxParseResult(description, 'detail_data.' + i);
            }
          }
          newdata['detail_data'] = formdata;
          pageInstance.setData(newdata);
          let field = _this.getFormPageField(pageInstance.data);
          for (let i in formdata) {
            if (field.indexOf(i) > -1 && formdata[i] instanceof Object && formdata[i].type === 'video') {
              let video = formdata[i];
              pageInstance.requestNum = pageRequestNum + 1;
              _this.sendRequest({
                hideLoading: pageRequestNum++ == 1 ? false : true,   // 页面第一个请求才展示loading
                url: '/index.php?r=AppVideo/GetVideoLibUrl',
                data: {
                  id: video.id
                },
                chain: true,
                method: 'get',
                success: function (res) {
                  let videoUrl = res.data,
                    newdata = {};
                  newdata['detail_data.' + i + '.videoUrl'] = videoUrl;
                  pageInstance.setData(newdata);
                }
              });
            }
          }
          if (pageInstance.carouselGroupidsParams && !!pageInstance.carouselGroupidsParams.length) {
            for (let i in pageInstance.carouselGroupidsParams) {
              let compid = pageInstance.carouselGroupidsParams[i].compid;
              customComponent["carousel"].detailPageInit(compid, pageInstance);
            }
          }
          if (!!pageInstance.dynamicVesselComps.length) {
            for (let i in pageInstance.dynamicVesselComps) {
              let compid = pageInstance.dynamicVesselComps[i].compid;
              customComponent["dynamic-vessel"].detailPageInit(compid, pageInstance, formdata);
            }
          }
          if (pageInstance.albumComps && !!pageInstance.albumComps.length) {
            for (let i in pageInstance.albumComps) {
              let compid = pageInstance.albumComps[i].compid;
              customComponent["album"].detailPageInit(compid, pageInstance, formdata);
            }
          }
        },
        complete: function () {
          pageInstance.setData({
            page_hidden: false
          });
        }
      })
    } else {
      pageInstance.setData({
        page_hidden: false
      });
    }
    let pageData = pageInstance.data;
    let vesselComponentArr = ["dynamic-classify", "dynamic-vessel", "free-vessel", "layout-vessel", "list-vessel", "popup-window", "sidebar", "static-vessel", "dynamic-navigation"];
    for (let i in pageData) {
      let ele = pageData[i];
      if (ele.page > 1) {
        ele.page = 1
      }
      if (Object.prototype.toString.call(ele) === "[object Object]"){
          let type = ele.type;
        if (type && !ele.hidden){ //这个indexOf的判断先加上，后续写完了在去掉
          let compid = ele.compId;
          customComponent[type] && customComponent[type].init && customComponent[type].init(compid, pageInstance, isPullRefresh);
          if(vesselComponentArr.indexOf(type) > -1){
            this.subEleInit(ele, compid, pageInstance, isPullRefresh);
          }
        }
      }
    }
  },
  getUserAppPermission: function(){
    return new Promise((resolve) => {
      let _this = this;
      _this.sendRequest({
        url: '/index.php?r=AppData/GetUserAppClosePermission',
        hideLoading: true,
        data: {},
        method: 'get',
        success: function (res) {
          resolve(res.data.is_close);
        }
      });
    });
  },
  subEleInit: function(comp, compid, pageInstance, isPullRefresh){
    let that = this;
    if (Object.prototype.toString.call(comp.content) == "[object Array]"){
      for (let i = 0; i < comp.content.length; i++) {
        let cp = comp.content[i];
        let type = cp.type;
        let subCompid = compid + '.content[' + i + ']';
        if (type && !cp.hidden){
          customComponent[type] && customComponent[type].init && customComponent[type].init(subCompid, pageInstance, isPullRefresh);
        }
        if (typeof cp.content == 'object'){
          that.subEleInit(cp, subCompid, pageInstance, isPullRefresh);
        }
      }
    }else if(Object.prototype.toString.call(comp.content) == "[object Object]"){
      for(let i in comp.content){
        let cp = comp.content[i];
        for (let j = 0; j < cp.length; j++) {
          let cpj = cp[j];
          let type = cpj.type;
          let subCompid = compid + '.content.' + i + '[' + j + ']';
          if (type && !cpj.hidden){
            customComponent[type] && customComponent[type].init && customComponent[type].init(subCompid, pageInstance, isPullRefresh);
          }
          if (typeof cpj.content == 'object'){
            that.subEleInit(cpj, subCompid, pageInstance, isPullRefresh);
          }
        }
      }
    }
  },
  onPageScroll: function (e) {
    let pageInstance = this.getAppCurrentPage();
    let pageRouter = pageInstance.page_router;
    this.globalData.susTopicCompids = this.globalData.susTopicsMap[pageRouter];
    if (this.globalData.susTopicCompids && this.globalData.susTopicCompids.length) { // 有悬浮窗话题列表判断是否要显示向上按钮
      let topBtnShow = e.scrollTop > 0 && (this.globalData.pageScrollTop - e.scrollTop > 0);
      for (let i in (this.globalData.susTopicCompids)) {
        let compid = this.globalData.susTopicCompids[i];
        let topicSuspension = pageInstance.data[compid].topicSuspension;
        if (topicSuspension.isShow && ((topicSuspension.topBtnShow || false) !== topBtnShow)) {
          pageInstance.setData({[compid + '.topicSuspension.topBtnShow']: topBtnShow});
        }
      }
    }
    this.globalData.pageScrollTop = e.scrollTop;
  },
  turnToCommunityPublish: function (e) {
    let dataset = e.currentTarget.dataset,
      publishType = dataset.type === 'link' ? 2 : 0,
      pageInstance = this.getAppCurrentPage();
    pageInstance.setData({
      'communityPublishType.show': false,
      'communityPublish.show': true,
      'communityPublish.publishType': publishType,
      'communityPublish.detail': dataset.detail || '',
      'communityPublish.articleId': dataset.articleId || '',
      'communityPublish.reqAudit': dataset.reqAudit || '',
      'communityPublish.from': dataset.from || '',
      'communityPublish.franchisee': dataset.franchisee || this.getPageFranchiseeId() || ''
    });
  },
  getIntegralLog: function (addTime) {
    let pageInstance = this.getAppCurrentPage();
    this.showToast({ title: '转发成功', duration: 500 });
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=appShop/getIntegralLog',
      data: { add_time: addTime },
      success: function (res) {
        res.data && pageInstance.setData({
          'rewardPointObj': {
            showModal: true,
            count: res.data,
            callback: ''
          }
        });
      }
    });
  },
  CountSpreadCount: function (articleId) {
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/CountSpreadCount',
      data: { article_id: articleId },
      success: function (res) { }
    })
  },
  formVirtualPrice: function (formdata) {
    let modelVP = [];
    let price = '';
    for (let l in formdata.goods_model) {
      modelVP.push(formdata.goods_model[l].virtual_price == '' ? 0 : Number(formdata.goods_model[l].virtual_price))
    }
    if (Math.min(...modelVP) == Math.max(...modelVP)) {
      if (formdata.virtual_price instanceof Object) {
        price = formdata.virtual_price;
        price[0].text = Math.min(...modelVP).toFixed(2);
      } else {
        price = Math.min(...modelVP).toFixed(2);
      }
    } else {
      if (formdata.virtual_price instanceof Object) {
        price = formdata.virtual_price;
        price[0].text = Math.min(...modelVP).toFixed(2) + '~' + Math.max(...modelVP).toFixed(2);
      } else {
        price = Math.min(...modelVP).toFixed(2) + '~' + Math.max(...modelVP).toFixed(2);
      }
    }
    return price;
  },
  getListVessel: function (comp) {
    let that = this;
    let field = [];
    if (Object.prototype.toString.call(comp.content) == "[object Array]") {
      for (let i = 0; i < comp.content.length; i++) {
        let cp = comp.content[i];
        if (typeof cp.content == 'object') {
          let f = that.getListVessel(cp);
          field = field.concat(f);
        } else if (cp.customFeature && cp.customFeature.segment) {
          field.push(cp.customFeature.segment);
          if (cp.customFeature.segment == 'default_map') {
            field = field.concat(['region_lng', 'region_lat', 'region_string', 'region_detail']);
          }
        }
      }
    } else {
      for (let i in comp.content) {
        let cp = comp.content[i];
        for (let j = 0; j < cp.length; j++) {
          let cpj = cp[j];
          if (typeof cpj.content == 'object') {
            let f = that.getListVessel(cpj);
            field = field.concat(f);
          } else if (cpj.customFeature && cpj.customFeature.segment) {
            field.push(cpj.customFeature.segment);
            if (cpj.customFeature.segment == 'default_map') {
              field = field.concat(['region_lng', 'region_lat', 'region_string', 'region_detail']);
            }
          }
        }
      }
    }
    return field;
  },
  getFormPageField: function (data) {
    let that = this;
    let field = [];
    for (let i in data) {
      let cp = data[i];
      if (typeof cp.content == 'object') {
        let f = that.getListVessel(cp);
        field = field.concat(f);
      } else if (cp.customFeature && cp.customFeature.segment) {
        field.push(cp.customFeature.segment);
        if (cp.customFeature.segment == 'default_map') {
          field = field.concat(['region_lng', 'region_lat', 'region_string', 'region_detail']);
        }
      }
    }
    return field;
  },
  getElementById: function (id, pageInstance) {
    pageInstance = pageInstance || this.getAppCurrentPage();
    let pageData = pageInstance.data;
    let compid = '';
    for (let i in pageData) {
      let ele = pageData[i];
      if (Object.prototype.toString.call(ele) === "[object Object]"){
        if (ele.type && ((ele.customFeature && ele.customFeature.id == id) || ele.id == id) && !ele.hidden){
          compid = ele.compId;
          break;
        }
      }
    }
    return compid;
  },
  getInvolvedFromRefreshObject: function(id, type, field, pageInstance){
    pageInstance = pageInstance || this.getAppCurrentPage();
    let pageData = pageInstance.data;
    let compid = '';
    field = field || "refresh_object";
    for (let i in pageData) {
      let ele = pageData[i];
      if (Object.prototype.toString.call(ele) === "[object Object]"){
        if (ele.type && type == ele.type && ele.customFeature[field] == id && !ele.hidden){
          compid = ele.compId;
          break;
        }
      }
    }
    return compid;
  },
  getObjectByPath: function(path, obj){
    path = path.replace(/\[(\w+)\]/g, '.$1');
    let keyArr = path.split('.');
    for(let i = 0; i < keyArr.length; i++){
      let key = keyArr[i];
      if(!obj.hasOwnProperty(key)){
        break;
      }
      obj = obj[key];
    }
    return obj;
  },
  _getPageData: function (router) {
    let that = this;
    let currentpage = that.getAppCurrentPage();
    let url = '/index.php?r=AppData/GetAppLayoutConfig';
    let ajdata = {
      his_id: this.globalData.historyDataId,
      page: router
    };
    if (this.globalData.chainAppId && !currentpage.franchiseeId && !this.globalData.hasFranchiseeTrade) {
      url = '/index.php?r=AppShopData/GetAppLayoutConfig';
      ajdata = {
        his_id: this.globalData.chainHistoryDataId,
        page: router,
        app_id: this.getChainId(),
        parent_app_id: this.getAppId()
      };
    }
    if (currentpage.franchiseeId && router != "userCenterComponentPage") {
      url = '/index.php?r=AppShopData/GetAppLayoutConfig';
      ajdata = {
        app_id: currentpage.franchiseeId,
        parent_app_id: this.getAppId(),
        page: router,
        type: 1
      };
    }
    if (this.globalData.hasFranchiseeTrade && this.globalData.chainAppId) {
      url = '/index.php?r=AppShopData/GetAppLayoutConfig';
      ajdata = {
        his_id: this.globalData.newHistoryDataId,
        page: router,
        app_id: this.getChainId(),
        parent_app_id: this.getAppId(),
        is_biz_shop: 1
      };
    }
    this.sendRequest({
      hideLoading: true,
      url: url,
      data: ajdata,
      success: function(res){
        let data = res.data;
        if (data && data.dynamic_data_config && data.dynamic_data_config.dynamic_data_open_status != 0) {
          if (!data.dataId && !(data.page_form && data.page_form != 'none')) {
            data.page_hidden = false
          }
          currentpage.setData(data);
          currentpage.page_form = data.page_form;
          data.dataId && (currentpage.dataId = data.dataId);
        }
        currentpage.pageLoaded = true;
        that.pageDataInitial('', currentpage);
      },
      complete: function () {
        if (!currentpage.dataId && !(currentpage.page_form && currentpage.page_form != 'none')) {
          currentpage.setData({
            page_hidden: false
          });
        }
      }
    })
  },
  tapEventCommonHandler: function (e) {
    let form = e.currentTarget.dataset.eventParams;
    let action = form.action;
    let compid = e.currentTarget.dataset.compid;
    if (!form.compid && compid) {
      form.compid = compid;
    }
    if (compid && /^classify\d+$/.test(compid) && action == 'refresh-list') { // 处理旧分类组件选中问题
      let pageInstance = this.getAppCurrentPage();
      let index = e.currentTarget.dataset.index;
      pageInstance.setData({
        [compid + '.customFeature.selected']: index
      })
    }
    customEvent.clickEventHandler[action] && customEvent.clickEventHandler[action](form, '', e);
  },
  getAddressByLatLng: function (params, callback) {
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=Map/getAreaInfoByLatAndLng',
      data: {
        latitude: params.lat,
        longitude: params.lng
      },
      success: function (res) {
        callback(res)
      }
    })
  },
  onPageShareAppMessage: function (event, callback) {
    let pageInstance = this.getAppCurrentPage();
    let pagePath = '/' + pageInstance.route;
    let image = event.currentTarget ? event.currentTarget.dataset.image : '';
    let title = event.currentTarget ? event.currentTarget.dataset.desc : '';
    pageInstance.setData({
      pageQRCodeData: {
        shareDialogShow: "100%",
        shareMenuShow: false,
      }
    })
    let pageParam = {
      "detail": pageInstance.dataId,
      "p_id": this.globalData.p_id,
      "vcard_user_id": this.globalData.HasCardToShareUserId,
      "franchisee": pageInstance.franchiseeId,
      "uuid": ''
    };
    for (let i in pageParam) {
      if (pageParam[i]) {
        if (pagePath.indexOf('?') < 0) {
          pagePath += '?';
        } else {
          pagePath += '&';
        }
        pagePath += i + '=' + pageParam[i];
      }
    }
    return this.shareAppMessage({ path: pagePath, imageUrl: image, title: title, success: callback });
  },
  onPageShow: function () {
    let that = this;
    let pageInstance = this.getAppCurrentPage();
    that.setPageUserInfo();
    if (this.globalData.topicTurnToDetail) {
      this.globalData.topicTurnToDetail = false;
    }
    if (pageInstance.need_login && !pageInstance.bind_phone && !this.isLogin()) {
      this.goLogin({});
    } else if (pageInstance.need_login && pageInstance.bind_phone && !this.getUserInfo().phone && !that.globalData.isOpenSettingBack) {
      if (this.isLogin()) {
        setTimeout(function () {
          let url = 'pages/' + pageInstance.page_router + '/' + pageInstance.page_router + '?' + util.getCurrentPageArgs();
          that.turnToPage('/default/pages/bindCellphone/bindCellphone?p=' + encodeURIComponent(url), 1);
        }, 1000);
      } else {
        let addTime = Date.now();
        that.globalData.loginGetIntegralTime = addTime;
        that.globalData.isGoBindPhone = true;
        this.goLogin({
          success: function () {
            let userInfo = that.getUserInfo();
            if (!userInfo.phone) {
              let url = 'pages/' + pageInstance.page_router + '/' + pageInstance.page_router + '?' + util.getCurrentPageArgs();
              that.turnToPage('/default/pages/bindCellphone/bindCellphone?p=' + encodeURIComponent(url), 1);
            } else {
              that.loginForRewardPoint(addTime);
              that.globalData.isGoBindPhone = false;
            }
          }
        });
      }
      that.globalData.isOpenSettingBack = false;
    }
    if (pageInstance.pageLoaded) {
      let pageData = pageInstance.data;
      for (let i in pageData) {
        let ele = pageData[i];
        if (Object.prototype.toString.call(ele) === "[object Object]"){
            let type = ele.type;
          if (type && !ele.hidden){
            let compid = ele.compId;
            customComponent[type] && customComponent[type].onPageShow && customComponent[type].onPageShow(compid, pageInstance);
          }
        }
      }
    }
  },
  onPageHide: function () {
    let pageInstance = this.getAppCurrentPage(),
      newdata = {};
    if (pageInstance.popupWindowComps && pageInstance.popupWindowComps.length) { // 隐藏弹窗
      for (let i in pageInstance.popupWindowComps) {
        let compid = pageInstance.popupWindowComps[i].compid;
        if (pageInstance.data[compid] && pageInstance.data[compid].showPopupWindow) {
          newdata[compid + '.showPopupWindow'] = false;
        }
      }
      pageInstance.setData(newdata);
    }
    if (pageInstance.verticalListComps && pageInstance.verticalListComps.length) {
      for (let i in pageInstance.verticalListComps) {
        let compid = pageInstance.verticalListComps[i].compid;
        newdata[compid + '.timer'] = null;
        pageInstance.returnToVerticalFlag = 1;
        clearInterval(pageInstance.data[compid].timer);
      }
      pageInstance.setData(newdata);
    };
    if (pageInstance.data.collectGiftsObj) {
      pageInstance.setData({
        'collectGiftsObj': {
          showModal: false
        }
      });
    };
    if (pageInstance.data.collectGetObj) {
      pageInstance.setData({
        'collectGetObj': {
          showModal: false
        }
      });
    };
    if (pageInstance.searchComponentParam && pageInstance.searchComponentParam.length) { // 重置搜索状态
      let setObj = {};
      for (let i in pageInstance.searchComponentParam) {
        let compid = pageInstance.searchComponentParam[i].compid;
        if (!pageInstance.keywordList[compid]) {
          setObj[compid + '.inputFocus'] = false;
        }
      }
      pageInstance.setData(setObj);
    }
  },
  userCenterOrderCount: function (options, callback) {
    if(!this.isLogin()){ //未登录不做后面的请求
      return;
    }
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/countStatusOrder',
      data: {
        parent_shop_app_id: this.getAppId(),
        goods_type: options.goodsType,
        show_eletronic_card: options.showEletronicCard || 0 // 是否展示电子卡券的订单
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          callback(res.data);
        }
      }
    });
  },
  returnListHeight: function (isshow, takeout, mode) {
    return wx.getSystemInfoSync().windowHeight;
  },
  onPageReachBottom: function ( reachBottomFuc ) {
    for (let i = 0; i < reachBottomFuc.length; i++) {
      let e = reachBottomFuc[i];
      e.triggerFuc(e.param);
    }
  },
  onPageUnload: function (page) {
    let pageInstance = page || this.getAppCurrentPage();
    let pageRouter = page ? page.page_router : pageInstance.page_router;
    this._logining = false;
    let downcountArr = pageInstance.downcountArr;
    if (downcountArr && downcountArr.length) {
      for (let i = 0; i < downcountArr.length; i++) {
        downcountArr[i] && downcountArr[i].clear();
      }
    }
    if (this.globalData.newCountDataOnPage[pageRouter]) { // 清除绑定页面上的计数
      delete this.globalData.newCountDataOnPage[pageRouter];
    }
     let dco = pageInstance.downcountObject;
     for (let key in dco){
       let dcok = dco[key]
       if (dcok && dcok.length){
         for (let i = 0; i < dcok.length; i++) {
           dcok[i] && dcok[i].clear();
         }
       }
     }
     if (pageInstance.verticalListComps && pageInstance.verticalListComps.length) {
       for (let i in pageInstance.verticalListComps) {
         let compid = pageInstance.verticalListComps[i].compid;
         if (pageInstance.data[compid] && pageInstance.data[compid].timer) {
           clearInterval(pageInstance.data[compid].timer);
         }
       }
     }
     if (pageInstance.verticalListComps && pageInstance.verticalListComps.length) {
       for (let i in pageInstance.verticalListComps) {
         let compid = pageInstance.verticalListComps[i].compid;
         if (pageInstance.data[compid] && pageInstance.data[compid].timer) {
           clearInterval(pageInstance.data[compid].timer);
         }
       }
     }
    let downcountObject = pageInstance.downcountObject;
    for (let key in downcountObject) {
      if (downcountObject[key] && downcountObject[key].length) {
        let downcountObjectNew = downcountObject[key]
        for (let i = 0; i < downcountObjectNew.length; i++) {
          downcountObjectNew[i] && downcountObjectNew[i].clear();
        }
      }
    }
    if (pageInstance.dynamicClassifyGroupidsParams.length != 0) {
      for (let index in pageInstance.dynamicClassifyGroupidsParams) {
        let compid = pageInstance.dynamicClassifyGroupidsParams[index].compid;
        if (pageInstance.data[compid] && pageInstance.data[compid].classify_observer) {
          pageInstance.data[compid].classify_observer.disconnect();
        }
        if (pageInstance.data[compid] && pageInstance.data[compid].list_observer) {
          pageInstance.data[compid].list_observer.disconnect();
        }
      }
    }
  },
  tapPrevewPictureHandler: function (event) {
    this.previewImage({
      current: event.currentTarget.dataset.img || event.currentTarget.dataset.imgarr[0],
      urls: event.currentTarget.dataset.imgarr instanceof Array ? event.currentTarget.dataset.imgarr : [event.currentTarget.dataset.imgarr],
    })
  },
  changeCountRequert: {},
  changeCount: function (event) {
    let dataset = event.currentTarget.dataset;
    let that = this;
    let pageInstance = this.getAppCurrentPage();
    let newdata = {};
    let counted = dataset.counted;
    let compid = dataset.compid;
    let objrel = dataset.objrel;
    let form = dataset.form;
    let dataIndex = dataset.index;
    let parentcompid = dataset.parentcompid;
    let parentType = dataset.parenttype;
    let url;
    let objIndex = compid + '_' + objrel;
    if (counted == 1) {
      url = '/index.php?r=AppData/delCount';
    } else {
      url = '/index.php?r=AppData/addCount';
    }
    if (that.changeCountRequert[objIndex]) {
      return;
    }
    that.changeCountRequert[objIndex] = true;
    that.sendRequest({
      url: url,
      data: { obj_rel: objrel },
      chain: true,
      subshop: pageInstance.franchiseeId || '',
      success: function (res) {
        newdata = {};
        if (parentcompid) {
          if (parentcompid.indexOf('list_vessel') === 0) {
            newdata[parentcompid + '.list_data[' + dataIndex + '].count_num'] = counted == 1
              ? parseInt(pageInstance.data[parentcompid].list_data[dataIndex].count_num) - 1
              : parseInt(res.data.count_num);
            newdata[parentcompid + '.list_data[' + dataIndex + '].has_count'] = counted == 1
              ? 0 : parseInt(res.data.has_count);
          } else if (parentcompid.indexOf('bbs') === 0) {
            newdata[parentcompid + '.content.data[' + dataIndex + '].count_num'] = counted == 1
              ? parseInt(pageInstance.data[parentcompid].content.data[dataIndex].count_num) - 1
              : parseInt(res.data.count_num);
            newdata[parentcompid + '.content.data[' + dataIndex + '].has_count'] = counted == 1
              ? 0 : parseInt(res.data.has_count);
          } else if (parentcompid.indexOf('free_vessel') === 0 || parentcompid.indexOf('popup_window') === 0 || parentcompid.indexOf('dynamic_vessel') === 0) {
            let path = compid
            if (compid.search('data.') !== -1) {
              path = compid.substr(5);
            }
            path = parentcompid + '.' + path;
            newdata[path + '.count_data.count_num'] = parseInt(res.data.count_num);
            newdata[path + '.count_data.has_count'] = parseInt(res.data.has_count);
          } else if (parentType && parentType.indexOf('list_vessel') === 0) {
            newdata[parentType + '.list_data[' + dataIndex + '].count_num'] = parseInt(res.data.count_num);
            newdata[parentType + '.list_data[' + dataIndex + '].has_count'] = parseInt(res.data.has_count);
          }
        } else {
          if (parentcompid != '' && parentcompid != null) {
            if (compid.search('data.') !== -1) {
              compid = compid.substr(5);
            }
            compid = parentcompid + '.' + compid;
          }
          newdata[compid + '.count_data.count_num'] = parseInt(res.data.count_num);
          newdata[compid + '.count_data.has_count'] = parseInt(res.data.has_count);
          pageInstance.setData(newdata);
        }
        pageInstance.setData(newdata);
        that.changeCountRequert[objIndex] = false;
      },
      complete: function () {
        that.changeCountRequert[objIndex] = false;
      }
    });
  },
  listVesselTurnToPage: function (event) {
    let that = this;
    let dataset = event.currentTarget.dataset;
    let pageInstance = this.getAppCurrentPage();
    let data_id = dataset.dataid;
    let router = dataset.router;
    let isseckill = dataset.isseckill; // 是否是商品秒杀
    let compid = dataset.compid;
    let index = dataset.index;
    let compData = pageInstance.data[compid];
    let list = compData.list_data && compData.list_data[index] || {
      form_data: {}
    };
    let form_data = list.form_data || list;
    let groupId = dataset.groupId;
    let leaderToken = dataset.leaderToken;
    form_data['form'] = compData.customFeature.form;
    if ((form_data.form == 'community_group' || form_data.form == 'goods') && form_data.stock[0].text == 0
    || (form_data.form == 'group_buy' && form_data.goods_stock[0].text == 0)) return;
    if (this.isTurnToListVesselDetail) { // 防止重复点击
      this.showToast({
        title: '正在跳转，请勿重复点击',
        icon: 'none'
      })
      return;
    }
    this.isTurnToListVesselDetail = true;
    if (compData.haveViewCountEle) { // 动态列表有添加浏览计数
      let objId = compData.form;
      let contentPath = compid + '.list_data[' + index + '].count_info.view_info';
      let param = {
        count_type: 2,
        support_cancel: 0,
        effect: 2,
        total_times: 1,
        obj_id: objId,
        data_id: data_id
      }
      customComponent["new-count"].newCountAddCount(param, function (res) {
        customComponent["new-count"].newCountSetNewData(pageInstance, contentPath, res, function () {
          that.isTurnToListVesselDetail = false;
          that.globalData.listVesselHaveViewCountEle = true;
          that.listVesselTurnToPageAct(router, form_data, data_id, isseckill);
        });
      })
      return;
    }
    this.isTurnToListVesselDetail = false;
    this.listVesselTurnToPageAct(router, form_data, data_id, isseckill, groupId, leaderToken);
  },
  listVesselTurnToPageAct: function (router, form_data, data_id, isseckill, groupId, leaderToken) {
    if (router == '' || router == -1 || router == '-1') {
      return;
    }
    let franchisee = this.getPageFranchiseeId();
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    switch (router) {
      case 'franchiseeWaimai':
        this.goToFranchisee(1, { detail: data_id });
        return;
      case 'franchiseeTostore':
        this.goToFranchisee(3, { detail: data_id });
        return;
      case 'franchiseeDetail4':
        this.goToFranchisee(2, { detail: data_id });
        return;
      case 'franchiseeDetail':
        this.goToFranchisee(0, { detail: data_id });
        return;
      default:
        break;
    }
    if (form_data.form == 'app_shop') {
      this.addSubShopView(data_id);
    }
    if (router == 'tostoreDetail') {
      this.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + data_id + chainParam);
    } else if (router == 'goodsDetail') {
      if (isseckill == 1) {
        let seckillType = form_data.is_seckill_activity ? form_data.is_seckill_activity[0].text : '';
        let seckill_activity_id = form_data.seckill_activity_id ? form_data.seckill_activity_id[0].text : '';
        let seckill_activity_time_id = form_data.seckill_activity_time_id ? form_data.seckill_activity_time_id[0].text : '';
        this.turnToPage('/seckill/pages/seckillDetail/seckillDetail?id=' + data_id + '&sec_act_id=' + seckill_activity_id + '&sec_t_id=' + seckill_activity_time_id + '&secType=' + seckillType);
      } else if (form_data.is_group_buy && form_data.is_group_buy[0].text == 1) {
        data_id = form_data.goods_id[0].text; //模板上不存在goodsId，需要通过页面数据获取
        let group_activity_id = form_data.activity_id[0].text || '';
        this.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data_id + '&activity_id=' + group_activity_id + chainParam);
      } else {
        this.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + data_id + chainParam);
      }
    } else if (router == 'videoDetail') {
      this.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + data_id + chainParam);
    } else if (router == 'groupGoodsDetail') {
      data_id = form_data.goods_id[0].text;//模板上不存在goodsId，需要通过页面数据获取
      let group_activity_id = form_data.activity_id[0].text || '';
      this.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data_id + '&activity_id=' + group_activity_id + chainParam);
    } else if (router == 'presellDetail') {
      this.turnToPage('/presell/pages/' + router + '/' + router + '?detail=' + data_id)
    } else if (router == 'communityGroup') {
      let leader_token = leaderToken || (this.globalData.leaderInfo && this.globalData.leaderInfo.user_token);
      let router = this.returnSubPackageRouter("commuGroupGoods") + `?goodsId=${data_id}&group_id=${groupId}&leaderToken=${leader_token}`;
      this.turnToPage(router);
    } else{
      if(form_data.form == 'app_shop'){
        let url = '';
        if (this.pageRoot[router]) {
          url = this.pageRoot[router];
        } else {
          url = '/franchisee/pages/' + router + '/' + router;
        }
        this.turnToPage(url + '?franchisee=' + data_id);
      } else if (router == 'giftCardDetail') {
        this.turnToPage('/giftCard/pages/' + router + '/' + router + '?id=' + data_id);
      }else if (router == 'shoppingCardDetail') {
        this.turnToPage('/shoppingCard/pages/' + router + '/' + router + '?id=' + data_id);
      } else {
        this.turnToPage('/pages/' + router + '/' + router + '?detail=' + data_id);
      }
    }
  },
  dynamicVesselTurnToPage: function (event) {
    let dataset = event.currentTarget.dataset;
    let pageInstance = this.getAppCurrentPage();
    let data_id = dataset.dataid;
    let router = dataset.router;
    let page_form = pageInstance.page_form;
    let isGroup = dataset.isGroup;
    let isSeckill = dataset.isSeckill;
    let compid = dataset.compid;
    let index = dataset.index;
    let list = pageInstance.data[compid].list_data[index];
    let form_data = list.form_data || list;
    if (router == '' || router == -1 || router == '-1') {
      return;
    }
    let franchisee = this.getPageFranchiseeId();
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    if (isGroup && isGroup == 1) {
      let group_activity_id = form_data.activity_id[0].text || '';
      this.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data_id + '&activity_id=' + group_activity_id + chainParam);
      return;
    }
    if (isSeckill && isSeckill == 1) {
      this.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + data_id + '&goodsType=seckill' + chainParam);
      return;
    }
    if (page_form != '') {
      if (router == 'tostoreDetail') {
        this.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + data_id + chainParam);
      } else if (router == 'goodsDetail') {
        this.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + data_id + chainParam);
      } else if (router == 'videoDetail') {
        this.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + data_id + chainParam);
      } else if (router == 'franchiseeDetail') {
        let mode = form_data.mode_id[0].text;
        this.goToFranchisee(mode, {
          detail: data_id
        });
      } else if (router == 'presellDetail') {
        this.turnToPage('/presell/pages/' + router + '/' + router + '?detail=' + data_id)
      } else{
        this.turnToPage('/pages/' + router + '/' + router + '?detail=' + data_id);
      }
    }
  },
  userCenterTurnToPage: function (event) {
    let that = this;
    if (this.isLogin()) {
      this._userCenterToPage(event);
    } else {
      this.goLogin({
        success: function () {
          that._userCenterToPage(event);
        }
      });
    }
  },
  _userCenterToPage: function (event) {
    let dataset         = event.currentTarget.dataset;
    let router          = dataset.router;
    let openVerifyPhone = dataset.openVerifyPhone; // 是否开启短信验证
    let that            = this;
    let param           = dataset.eventParams;
    let goodsType       = dataset.goodsType;
    let currentIndex    = event.currentTarget.dataset.index;
    if (router == 'vipCardList' && dataset['needCollectInfo'] == 1){
      let chainParam = this.globalData.chainAppId ? '&franchisee=' + this.globalData.chainAppId : '';
      this.turnToPage('/userCenter/pages/userCenter/userCenter?is_member=1' + chainParam)
      return;
    }
    if (router == 'getGroupPickCode') {
      if (this.isLogin()) {
        that._getGroupPickCode();
      } else {
        this.goLogin({
          success: function () {
            that._getGroupPickCode();
          }
        });
      }
      return;
    }
    if (router == 'myPresale') {
      if (this.isLogin()) {
        that.turnToPage('/presell/pages/presellOrderList/presellOrderList');
      } else {
        this.goLogin({
          success: function () {
            that.turnToPage('/presell/pages/presellOrderList/presellOrderList');
          }
        });
      }
      return;
    }
    if (router === 'inviteRewards') {
      if (this.isLogin()) {
        that.turnToPage('/userCenter/pages/inviteRewards/inviteRewards');
      } else {
        this.goLogin({
          success: function () {
            that.turnToPage('/userCenter/pages/inviteRewards/inviteRewards');
          }
        });
      }
      return;
    }
    if (router === 'inviteRewards') {
      if (this.isLogin()) {
        that.turnToPage('/userCenter/pages/inviteRewards/inviteRewards');
      } else {
        this.goLogin({
          success: function () {
            that.turnToPage('/userCenter/pages/inviteRewards/inviteRewards');
          }
        });
      }
      return;
    }
    if (router === '/userCenter/pages/userCenter/userCenter' && this.isLogin() !== true) {
      this.goLogin({
        success: function () {
          that.turnToPage('/userCenter/pages/userCenter/userCenter?from=userCenterEle');
        }
      })
      return;
    }
    if (router === 'newsPocketsBalance') {
      if (this.isLogin()) {
        that.turnToPage('/userCenter/pages/newsPocketsBalance/newsPocketsBalance');
      } else {
        this.goLogin({
          success: function () {
            that.turnToPage('/userCenter/pages/newsPocketsBalance/newsPocketsBalance');
          }
        });
      }
      return;
    }
    if (router === 'myEvoucher') {
      if (this.isLogin()) {
        that.turnToPage('/userCenter/pages/myEvoucher/myEvoucher');
      } else {
        this.goLogin({
          success: function () {
            that.turnToPage('/userCenter/pages/myEvoucher/myEvoucher');
          }
        });
      }
      return;
    }
    if (openVerifyPhone) {
      if (!this.getUserInfo().phone) {
        this.turnToPage('/default/pages/bindCellphone/bindCellphone?r=' + this.getAppCurrentPage().page_router, 1);
      } else {
        if (router === '/promotion/pages/promotionMyPromotion/promotionMyPromotion' || router === 'myPromotion' || router === 'promotionMyPromotion') {
          that._isOpenPromotion();
          return;
        }
        if (router === 'toMyGroupCenter') {
          that._isOpenCommunityGroup();
          return;
        }
        if (router == 'communityUsercenter1') {
          this.turnToPage('/informationManagement/pages/communityUsercenter/communityUsercenter?tap=publish');
          return;
        }
        if (router == 'communityUsercenter2') {
          this.turnToPage('/informationManagement/pages/communityUsercenter/communityUsercenter?tap=reply');
          return;
        }
        if ((router === 'myOrder' || router === '/eCommerce/pages/myOrder/') && goodsType != undefined) {
          this.turnToPage('/eCommerce/pages/myOrder/?from=userCenterEle&goodsType=' + goodsType + '&currentIndex=' + currentIndex);
          return;
        } else if ((router === '/eCommerce/pages/vipCard/vipCard' || router === "vipCard" || router === 'leagueVipAdvertise') && (this.globalData.hasFranchiseeList || this.globalData.hasFranchiseeChain)) {
          if (dataset['needCollectInfo'] == 1) {
            let chainParam = this.globalData.chainAppId ? '&franchisee=' + this.globalData.chainAppId : '';
            this.turnToPage('/userCenter/pages/userCenter/userCenter?is_member=1' + chainParam)
            return;
          }
          let isLeague = '';
          if (router === 'leagueVipAdvertise') {
            isLeague = `&isLeague=1`;
          }
          router = this.returnSubPackageRouter('vipCardList') + '?from=userCenterEle' + isLeague;
        } else if (router.indexOf('/') !== 0) {
          router = this.returnSubPackageRouter(router) + '?from=userCenterEle' + (param ? ('&' + param) : '');
        }
        this.turnToPage(router);
      }
    } else {
      if (router === 'promotionMyPromotion' || router === 'myPromotion') {
        that._isOpenPromotion();
        return;
      }
      if (router === 'toMyGroupCenter') {
        that._isOpenCommunityGroup();
        return;
      }
      if (router == 'communityUsercenter1') {
        this.turnToPage('/informationManagement/pages/communityUsercenter/communityUsercenter?tap=publish');
        return;
      }
      if (router == 'communityUsercenter2') {
        this.turnToPage('/informationManagement/pages/communityUsercenter/communityUsercenter?tap=reply');
        return;
      }
      if ((router === 'myOrder' || router === '/eCommerce/pages/myOrder/') && goodsType != undefined) {
        this.turnToPage(this.returnSubPackageRouter('myOrder') + '?from=userCenterEle&goodsType=' + goodsType + '&currentIndex=' + currentIndex);
        return;
      } else if ((router === 'vipCardList' || router === '/userCenter/pages/vipCardList/vipCardList' || router === 'leagueVipAdvertise') && (this.globalData.hasFranchiseeList || this.globalData.hasFranchiseeChain)) {
        if (dataset['needCollectInfo'] == 1) {
          let chainParam = this.globalData.chainAppId ? '&franchisee=' + this.globalData.chainAppId : '';
          this.turnToPage('/userCenter/pages/userCenter/userCenter?is_member=1' + chainParam)
          return;
        }
        let isLeague = '';
        if (router === 'leagueVipAdvertise') {
          isLeague = `&isLeague=1`;
        }
        router = this.returnSubPackageRouter('vipCardList') + '?from=userCenterEle' + isLeague;
      } else if (router.indexOf('/') !== 0) {
        router = this.returnSubPackageRouter(router) + '?from=userCenterEle' + (param ? ('&' + param) : '');
      }
      this.turnToPage(router);
    }
  },
  _getGroupPickCode: function () {
    let that = this;
    that.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetAppDisGroupOrderVerifyQrEncode',
      data: {
        user_token: that.globalData.userInfo.user_token
      },
      hideLoading: true,
      method: 'post',
      success: (res)=> {
        if (res.data) {
          if (res.data.indexOf('http') < 0) {
            res.data = `http://${res.data}`;
          }
          that.previewImage({current: res.data, urls:[res.data]});
        }else {
          that.showToast({
            title: '当前无待核销订单',
            icon: 'none'
          })
        }
      }
    })
  },
  turnToGoodsDetail: function (event) {
    let { id, contact, goodsType, group, groupId, hidestock, isShowVirtualPrice, unit, tplId, appId, isSeckill, stock, disGroupId, leaderToken } = event.currentTarget.dataset;
    let franchisee = this.getPageFranchiseeId();
    let chainParam = '';
    if (appId && appId !== this.getAppId()) { // 跳转子店商品
      chainParam = '&franchisee=' + appId;
    }else if(franchisee){
      chainParam = '&franchisee=' + franchisee;
    }
    if (group && group == 1) {
      if (+goodsType == 10){ //预约拼团  跳到另外的页面
        this.turnToPage(`/tradeApt/pages/TYDetail/TYDetail?detail=${id}&activeId=${groupId}&activeType=group&contact=${contact}${chainParam}`);
        return
      }
      this.turnToPage(`/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=${id}&activity_id=${groupId}&contact=${contact}${chainParam}`);
      return;
    }
    if (stock <= 0) {
      return;
    }
    if(isSeckill == 1 && disGroupId){
      let path = `/seckill/pages/seckillDetail/seckillDetail?id=${id}&communityType=1`;
      this.turnToPage(path);
      return;
    }
    switch (+goodsType) {
      case 0:
        if (disGroupId) {
          let leader_token = leaderToken || (this.globalData.leaderInfo && this.globalData.leaderInfo.user_token);
          let router = this.returnSubPackageRouter("commuGroupGoods") + `?goodsId=${id}&group_id=${disGroupId}&leaderToken=${leader_token}`;
          this.turnToPage(router);
          return;
        }
        this.turnToPage(`/detailPage/pages/goodsDetail/goodsDetail?detail=${id}&contact=${contact}&hidestock=${hidestock}&isShowVirtualPrice=${isShowVirtualPrice}${chainParam}`);
        break;
      case 1:
        this.turnToPage(`/detailPage/pages/goodsDetail/goodsDetail?detail=${id}&contact=${contact}&hidestock=${hidestock}${chainParam}`);
        break;
      case 3:
        this.turnToPage(`/pages/toStoreDetail/toStoreDetail?detail=${id}${chainParam}`);
        break;
      case 10:
        if (unit) {
          this.turnToPage(`/tradeApt/pages/hotel/hotel?contact=${contact}&hidestock=${hidestock}&tpl_id=${tplId}${chainParam}`);
        } else {
          this.turnToPage(`/tradeApt/pages/TYDetail/TYDetail?detail=${id}&contact=${contact}&hidestock=${hidestock}&tpl_id=${tplId}${chainParam}`);
        }
        break;
    }
  },
  goToFranchisee: function (mode, param = {}, is_redirect = false) {
    let r = '';
    let rArr = [];
    for (let i in param) {
      if (param[i]) {
        rArr.push(i + '=' + param[i]);
      }
    }
    if (rArr.length > 0) {
      r = '?' + rArr.join('&');
    }
    this.addSubShopView(param['detail'] || '');  //增加浏览量
    if (mode == 1) {
      this.turnToPage('/franchisee/pages/franchiseeWaimai/franchiseeWaimai' + r, is_redirect);
    } else if (mode == 3) {
      this.turnToPage('/franchisee/pages/franchiseeTostore/franchiseeTostore' + r, is_redirect);
    } else if (mode == 2) {
      this.turnToPage('/franchisee/pages/franchiseeDetail4/franchiseeDetail4' + r, is_redirect);
    } else {
      this.turnToPage('/franchisee/pages/franchiseeDetail/franchiseeDetail' + r, is_redirect);
    }
  },
  turnToFranchiseePage: function (options, is_redirect = false) {
    let mode = options.mode;
    let pageLink = options.pageLink;
    let franchiseeId = options.franchiseeId;
    let param = options.param;
    switch (pageLink.trim()) {
      case 'franchiseeWaimai':
        this.goToFranchisee(1, param);
        return;
      case 'franchiseeTostore':
        this.goToFranchisee(3, param);
        return;
      case 'franchiseeDetail4':
        this.goToFranchisee(2, param);
        return;
      case 'franchiseeDetail':
        this.goToFranchisee(0, param);
        return;
      default:
        break;
    }
    let url = '';
    if (this.pageRoot[pageLink]) {
      url = this.pageRoot[pageLink];
    } else if (franchiseeId) {
      url = '/franchisee/pages/' + pageLink + '/' + pageLink;
    }
    let queryStr = franchiseeId ? '?franchisee=' + franchiseeId + '&fmode=' + mode : '';
    this.addSubShopView(franchiseeId);  //增加浏览量
    this.turnToPage(url + queryStr, is_redirect);
  },
  _sortListVessel: function (component_params) {
    let that = this;
    let pageInstance = this.getAppCurrentPage();
    let compid = component_params['compid'];
    let newdata = {};
    let compdata = pageInstance.data[compid];
    let listField = compdata.listField;
    let chainflag = true;
    let param = component_params.param;
    newdata[compid + '.loading'] = true;
    newdata[compid + '.loadingFail'] = false;
    newdata[compid + '.is_more'] = 1;
    newdata[compid + '.list_data'] = [];
    newdata[compid + '.param'] = param;
    pageInstance.setData(newdata);
    if (param.form == "app_shop" && (listField.indexOf('distance') > -1 || param.sort_key == "distance")){
      let locationInfo = that.globalData.locationInfo;
      if (locationInfo.latitude){
        param.extra_cond_arr = param.extra_cond_arr || {};
        param.extra_cond_arr.latitude = locationInfo.latitude;
        param.extra_cond_arr.longitude = locationInfo.longitude;
      } else if (param.sort_key == "distance"){
        that.getLatLng({
          success: function (latlng) {
            param.extra_cond_arr = param.extra_cond_arr || {};
            param.extra_cond_arr.latitude = latlng.latitude;
            param.extra_cond_arr.longitude = latlng.longitude;
            that._sortListVessel(component_params);
          },
          fail: function () {
            that.showToast({
              title: '您已经拒绝定位，店铺距离将获取不到',
              icon: 'none'
            });
            param.sort_key = "";
            that._sortListVessel(component_params);
          }
        })
        return;
      }
    }
    if(that.globalData.hasFranchiseeTrade && ["app_shop"].indexOf(param.form) > -1){
      chainflag = false;
    }
    this.sendRequest({
      url: '/index.php?r=AppData/getFormDataList',
      data: param,
      method: 'post',
      hideLoading: true,
      chain: chainflag,
      subshop: pageInstance.franchiseeId || '',
      success: function (res) {
        let newdata = {};
        for (let j in res.data) {
          for (let k in res.data[j].form_data) {
            if (k == 'category') continue;
            if (/region/.test(k)) {
              continue;
            }
            if (k == 'goods_model') {
              res.data[j].form_data.virtual_price = that.formVirtualPrice(res.data[j].form_data);
            }
            if (k == 'distance') {
              res.data[j].form_data[k] = util.formatDistance(res.data[j].form_data[k]);
            }
            let description = res.data[j].form_data[k];
            if (listField.indexOf(k) < 0 && /<("[^"]*"|'[^']*'|[^'">])*>/.test(description)) { //没有绑定的字段的富文本置为空
              res.data[j].form_data[k] = '';
            } else if (that.needParseRichText(description)) {
              res.data[j].form_data[k] = that.getWxParseResult(description);
            }
          }
        }
        newdata[compid + '.list_data'] = res.data;
        newdata[compid + '.is_more'] = res.is_more;
        newdata[compid + '.curpage'] = 1;
        newdata[compid + '.loading'] = false;
        newdata[compid + '.loadingFail'] = false;
        if (/^dynamic\_classify\d+$/.test(component_params.compid)) {
          newdata[compid + '.sort_key'] = component_params.param.sort_key || '';
          newdata[compid + '.sort_direction'] = component_params.param.sort_direction;
        }
        pageInstance.setData(newdata);
      },
      fail: function (res) {
        let newdata = {};
        newdata[compid + '.loadingFail'] = true;
        newdata[compid + '.loading'] = false;
        pageInstance.setData(newdata);
      }
    });
  },
  _sortGoodsList: function (component_params) {
    let that = this;
    let pageInstance = this.getAppCurrentPage();
    let compid = component_params['compid'];
    let newdata = {};
    let compData = pageInstance.data[compid];
    component_params.param.page_size = compData.customFeature.loadingNum || 10;
    newdata[compid + '.loading'] = true;
    newdata[compid + '.loadingFail'] = false;
    newdata[compid + '.is_more'] = 1;
    newdata[compid + '.goods_data'] = [];
    newdata[compid + '.param.sort_key'] = component_params.param.sort_key; //临时处理，后续做了联动之后删除
    newdata[compid + '.param.sort_direction'] = component_params.param.sort_direction; //临时处理，后续做了联动之后删除
    pageInstance.setData(newdata);
    if (compData.customFeature.form == 'new_appointment' && !compData.customFeature.tpl_id) {
      let noAppointTpl = {};
      noAppointTpl[compid + '.is_more'] = 0;
      noAppointTpl[compid + '.loadingFail'] = false;
      noAppointTpl[compid + '.loading'] = false;
      pageInstance.setData(noAppointTpl);
      return
    }
    this.sendRequest({
      url: '/index.php?r=AppShop/GetGoodsList',
      data: component_params.param,
      method: 'post',
      hideLoading: true,
      chain: true,
      subshop: pageInstance.franchiseeId || '',
      success: function (res) {
        if (res.status == 0) {
          let appId = that.getAppId();
          let goodslist = res.data;
          goodslist.map((item) => {
            item.form_data.goods_model && delete item.form_data.goods_model;
            if (+component_params.param.is_app_shop_cate_goods === 1 && item.form_data.app_id !== appId && !pageInstance.franchiseeId) {
              item.form_data.isSubShopGoods = true;
            } else {
              item.form_data.isSubShopGoods = false;
            }
            item.form_data.discount = (item.form_data.price * 10 / item.form_data.virtual_price).toFixed(2);
            let vip_discount = (item.form_data.vip_min_price * 10 / item.form_data.virtual_price).toFixed(2);
            item.form_data.vip_discount = vip_discount < 0.01 ? 0.01 : vip_discount;
            delete item.form_data.description;
            if (Number(item.form_data.max_can_use_integral) != 0) {
              let discountStr = Number(item.form_data.max_can_use_integral) + '积分抵扣' + (Number(item.form_data.max_can_use_integral) / 100) + '元';
              item.discountStr = discountStr;
            }
            item.form_data.min_price_arr = item.form_data.min_price.split('.');
            item.form_data.max_price_arr = item.form_data.max_price.split('.');
            if (item.form_data.vip_min_price) {
              item.form_data.vip_min_price_arr = item.form_data.vip_min_price.split('.');
              item.form_data.vip_max_price_arr = item.form_data.vip_max_price.split('.');
            }
          });
          newdata[compid + '.goods_data'] = goodslist;
          newdata[compid + '.is_more'] = res.is_more;
          newdata[compid + '.curpage'] = 1;
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = false;
          pageInstance.setData(newdata);
        }
      },
      fail: function (res) {
        let newdata = {};
        newdata[compid + '.loadingFail'] = true;
        newdata[compid + '.loading'] = false;
        pageInstance.setData(newdata);
      }
    });
  },
  _sortFranchiseeList: function (component_params) {
    let that = this;
    let pageInstance = this.getAppCurrentPage();
    let compid = component_params['compid'];
    let newdata = {};
    let compData = pageInstance.data[compid];
    newdata[compid + '.loading'] = true;
    newdata[compid + '.loadingFail'] = false;
    newdata[compid + '.is_more'] = 1;
    newdata[compid + '.curpage'] = 0;
    newdata[compid + '.franchisee_data'] = [];
    newdata[compid + '.param'] = component_params.param;
    pageInstance.setData(newdata);
    if (component_params.param.sort_key == 'distance' && !component_params.param.latitude) {
      that.showModal({
        content: "未获取到定位！"
      })
      return;
    }
    this.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      hideLoading: true,
      data: component_params.param,
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let newdata = {};
          for (let index in res.data) {
            let _data = res.data[index];
            let distance = _data.distance;
            let score = _data.assess_score || 5;
            _data.distance = util.formatDistance(distance);
            _data.new_assess_score = that.changeFranchiseScore(score.toString());
            _data.showDiscountList = _data.coupon_list && _data.coupon_list.length > 3 ? true : false;
            res.data[index] = _data;
          }
          if(that.globalData.isLogin){
            that._getMyAppShopList(compid, pageInstance);
          }
          newdata[compid + '.franchisee_data'] = res.data;
          newdata[compid + '.is_more'] = res.is_more || 0;
          newdata[compid + '.curpage'] = 1;
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = false;
          pageInstance.setData(newdata);
        }
      },
      fail: function (res) {
        let newdata = {};
        newdata[compid + '.loadingFail'] = true;
        newdata[compid + '.loading'] = false;
        pageInstance.setData(newdata);
      }
    });
  },
_getMyAppShopList: function (compid, pageInstance, reset) {
    let that = this;
    that.sendRequest({
      url: '/index.php?r=AppShop/GetMyAppShopList',
      hideLoading: true,
      data: {
        parent_app_id: that.getAppId()
      },
      hideLoading: true,
      success: function (res) {
        let newdata = {};
        let oldList = pageInstance.data[compid].franchisee_data || [];
        let list = res.data;
        let listId = [];
        if (reset) {
          let l = 0;
          for (let i = 0; i < oldList.length; i++) {
            if (oldList[i].is_audit == 2) {
              l++;
            } else {
              break;
            }
          }
          oldList.splice(0, l);
        }
        for (let i = 0; i < list.length; i++) {
          if (list[i].is_audit == 2) {
            oldList.unshift(list[i]);
            listId.push(list[i].id);
          }
        }
        if (reset) {
          for (let i = 0; i < oldList.length; i++) {
            if (oldList[i].is_audit == 1 && listId.indexOf(oldList[i].id) > -1) {
              oldList.splice(i, 1);
            }
          }
        }
        newdata[compid + '.franchisee_data'] = oldList;
        pageInstance.setData(newdata)
      }
    });
  },
  _sortVideoList : function(component_params) {
    let that = this;
    let pageInstance = this.getAppCurrentPage();
    let compid = component_params['compid'];
    let newdata = {};
    newdata[compid + '.loading'] = true;
    newdata[compid + '.loadingFail'] = false;
    newdata[compid + '.is_more'] = 1;
    newdata[compid + '.video_data'] = [];
    newdata[compid + '.param'] = component_params.param;
    pageInstance.setData(newdata);
    this.sendRequest({
      url: '/index.php?r=AppVideo/GetVideoList',
      data: component_params.param,
      method: 'post',
      hideLoading: true,
      chain: true,
      subshop: pageInstance.franchiseeId || '',
      success: function (res) {
        let rdata = res.data;
        let newdata = {};
        for (let i = 0; i < rdata.length; i++) {
          rdata[i].video_view = that.handlingNumber(rdata[i].video_view);
        }
        newdata[compid + '.video_data'] = rdata;
        newdata[compid + '.is_more'] = res.is_more;
        newdata[compid + '.curpage'] = res.current_page;
        newdata[compid + '.loading'] = false;
        newdata[compid + '.loadingFail'] = false;
        pageInstance.setData(newdata);
      },
      fail: function (res) {
        let newdata = {};
        newdata[compid + '.loadingFail'] = true;
        newdata[compid + '.loading'] = false;
        pageInstance.setData(newdata);
      }
    });
  },
  callPhone: function (event) {
    let phone = event.currentTarget.dataset.phone;
    this.makePhoneCall(phone);
  },
  getNationList: function (compid) {
    var _this = this;
    let pageInstance = this.getAppCurrentPage();
    let newdata = {};
    _this.sendRequest({
      url: '/index.php?r=Region/getNationList',
      hideLoading: true,
      data: {
        page: 1,
        page_size: 1000
      },
      success: function (res) {
        newdata[compid + '.nationList'] = res.data.reverse();
        pageInstance.setData(newdata);
      }
    })
  },
  tapRefreshListHandler: function (event, params) {
    let pageInstance = this.getAppCurrentPage();
    let eventParams = params || JSON.parse(event.currentTarget.dataset.eventParams);
    let refreshObject = eventParams.refresh_object;
    if (eventParams.parent_type == 'classify') { // 如果是分类组件的分类项 需要更改当前选中元素的索引
      var classify_selected_index = {};
      classify_selected_index[eventParams.parent_comp_id + '.customFeature.selected'] = eventParams.item_index;
      pageInstance.setData(classify_selected_index);
    }
    let compid = this.getElementById(refreshObject);
    this._refreshPageList(compid, eventParams, pageInstance);
  },
  _refreshPageList: function (compid, eventParams, pageInstance) {
    let index_value = eventParams.index_value == -1 ? '' : eventParams.index_value;
    let compdata = pageInstance.data[compid];
    let requestData = compdata.param || {};
    let eleType = compdata.type;
    if (typeof requestData === 'string') {
      requestData = JSON.parse(requestData);
    }
    if (eleType === 'goods-list') {
      requestData.is_count = 0;
      if (compdata.customFeature.form === 'goods' && compdata.customFeature.goodsType === 'electronicGoods') {
        requestData.show_virtual_goods = 1;
      }
    }
    if (compdata.customFeature && compdata.customFeature.loadingNum && !requestData.page_size) {
      requestData.page_size = compdata.customFeature.loadingNum;
    }
    if (index_value && Array.isArray(index_value)) {
      requestData.idx_arr = {
        idx: eventParams.index_segment,
        idx_value: index_value,
        search_type: 'intersect'
      };
    } else {
      requestData.idx_arr = {
        idx: eventParams.index_segment,
        idx_value: index_value
      };
      if (eventParams.category_group_id) {
        requestData.category_group_id = eventParams.category_group_id;
      } else {
        delete requestData.category_group_id;
      }
    }
    requestData.page = 1;
    switch (eleType) {
      case 'goods-list': this._refreshGoodsList(compid, requestData, pageInstance); break;
      case 'list-vessel': this._refreshListVessel(compid, requestData, pageInstance); break;
      case 'franchisee-list': this._refreshFranchiseeList(compid, requestData, pageInstance); break;
      case 'topic-list': this._refreshTopicList(compid, requestData, pageInstance); break;
      case 'news':
      case 'news-list': this._refreshNewsList(compid, requestData, pageInstance); break;
      case 'video-list': this._refreshVideoList(compid, requestData, pageInstance); break;
      case 'group-buy-list': this._refreshGroupBuyList(compid, requestData, pageInstance); break;
      case 'seckill': this._refreshSeckillBuyList(compid, requestData, pageInstance); break;
      case 'community-goods-list': customComponent['community-goods-list'].getThisCategory(compid, requestData);break;
    }
  },
  _refreshGoodsList: function (targetCompId, requestData, pageInstance) {
    let _this = this;
    let customFeature = pageInstance.data[targetCompId].customFeature;
    let newData = {};
    if (requestData.form == 'new_appointment' && !requestData.tpl_id) {
      let noAppointTpl = {};
      noAppointTpl[targetCompId + '.goods_data'] = [];
      noAppointTpl[targetCompId + '.is_more'] = 0;
      pageInstance.setData(noAppointTpl);
      return
    }
    requestData.show_package_goods = customFeature.isShowSetMeal ? 2 : 0;
    if (customFeature.controlCheck) {     // 商品列表绑定的是积分商品
      requestData.is_integral = 3;
    } else {                              // 商品列表绑定的是普通商品
      if (requestData.goods_type != 10) { // 非行业预约商品
        if (customFeature.isIntegral) {
          requestData.is_integral = 1;
        } else {
          requestData.is_integral = 5;
        }
      } else {                            // 行业预约商品
        if (customFeature.isIntegral) {
          requestData.is_integral = 5;
        } else {
          requestData.is_integral = 2;
        }
      }
    }
    if(customFeature.isShowGroupBuyGoods){
      requestData.is_group_buy = 1;
    }
    if (customFeature.isShowSellOut) {
      requestData.is_stock_gte_zero = 1;
    }
    if (requestData.form === 'goods' && customFeature.pickUpArr){ 
      requestData.pick_up_type = [];
      if (customFeature.pickUpArr.express){       // 快递商品
        requestData.pick_up_type.push(1);
      }
      if (customFeature.pickUpArr.sameJourney) {  // 同城商品
        requestData.pick_up_type.push(2);
      }
      if (customFeature.pickUpArr.selfLifting) {  // 自提商品
        requestData.pick_up_type.push(3);
      }
      if (customFeature.pickUpArr.dining) {       // 堂食商品
        requestData.pick_up_type.push(4);
      }
    }
    if (customFeature.form === 'goods' && customFeature.isShowFranchiseeGoods && !pageInstance.franchiseeId) { 
      requestData['is_app_shop_cate_goods'] = 1;
      requestData['is_app_shop'] = 1;
    }
    if (pageInstance.franchiseeId || this.getChainId()) {
      requestData['is_parent_shop_goods'] = 1;
      requestData['parent_app_id'] = this.getAppId();
    }
    newData[targetCompId + '.loading'] = true;
    newData[targetCompId + '.loadingFail'] = false;
    newData[targetCompId + '.is_more'] = 1;
    newData[targetCompId + '.goods_data'] = [];
    newData[targetCompId + '.param'] = requestData;
    pageInstance.setData(newData);
    this.sendRequest({
      url: '/index.php?r=AppShop/GetGoodsList',
      method: 'post',
      hideLoading: true,
      data: requestData,
      chain: true,
      subshop: pageInstance.franchiseeId || '',
      success: function (res) {
        let newData = {};
        let appId = _this.getAppId();
        let chainAppId = _this.getChainAppId();
        for (let i in res.data) {
          let formData = res.data[i].form_data;
          if (formData.goods_model) {
              let price, virtuaPrice;
              switch (customFeature.priceOption) {
                case '1':
                  price = formData.min_price;
                  break;
                case '2':
                  price = formData.max_price;
                  break;
                case '3':
                  price = formData.min_price + '~' + formData.max_price;
                  break;
                default:
                  price = formData.min_price;
                  break;
              }
              switch (customFeature.virtualPriceOption) {
                case '1':
                  virtuaPrice = formData.virtual_min_price;
                  break;
                case '2':
                  virtuaPrice = formData.virtual_max_price;
                  break;
                case '3':
                  virtuaPrice = formData.virtual_max_price == 0 ? 0 : formData.virtual_min_price + '~' + formData.virtual_max_price;
                  break;
                default:
                  virtuaPrice = formData.virtual_min_price;
                  break;
              }
              formData.price = price;
              formData.virtual_price = virtuaPrice;
          }
          formData.discount = (formData.price * 10 / formData.virtual_price).toFixed(2);
          let vip_discount = (formData.vip_min_price * 10 / formData.virtual_price).toFixed(2);
          formData.vip_discount = vip_discount < 0.01 ? 0.01 : vip_discount;
          formData.goods_model && delete formData.goods_model;
          if (+requestData['is_app_shop_cate_goods'] === 1 && formData.app_id !== appId && !pageInstance.franchiseeId && chainAppId !== formData.app_id) {
            formData.isSubShopGoods = true;
          }else {
            formData.isSubShopGoods = false;
          }
        }
        res.data.forEach(good => {
          if (Number(good.form_data.max_can_use_integral) != 0) {
            let discountStr = Number(good.form_data.max_can_use_integral) + '积分抵扣' + (Number(good.form_data.max_can_use_integral) / 100) + '元';
            good.discountStr = discountStr;
          }
          good.form_data.min_price_arr = good.form_data.min_price.split('.');
          good.form_data.max_price_arr = good.form_data.max_price.split('.');
          if (good.form_data.vip_min_price) {
            good.form_data.vip_min_price_arr = good.form_data.vip_min_price.split('.');
            good.form_data.vip_max_price_arr = good.form_data.vip_max_price.split('.');
          }
        })
        newData[targetCompId + '.goods_data'] = res.data;
        newData[targetCompId + '.is_more'] = res.is_more;
        newData[targetCompId + '.curpage'] = 1;
        newData[targetCompId + '.scrollTop'] = 0;
        newData[targetCompId + '.loading'] = false;
        newData[targetCompId + '.loadingFail'] = false;
        pageInstance.setData(newData);
      },
      fail: function (res) {
        let newData = {};
        newData[targetCompId + '.loadingFail'] = true;
        newData[targetCompId + '.loading'] = false;
        pageInstance.setData(newData);
      }
    })
  },
  _refreshListVessel: function (targetCompId, requestData, pageInstance, isGetLatLng) {
    let _this = this;
    let targetCompData = pageInstance.data[targetCompId];
    let customFeature = targetCompData.customFeature;
    let needColumnArr = targetCompData.need_column_arr || [];
    let newdata = {};
    let chainflag = true;
    newdata[targetCompId + '.loading'] = true;
    newdata[targetCompId + '.loadingFail'] = false;
    newdata[targetCompId + '.list_data'] = [];
    newdata[targetCompId + '.is_more'] = 1;
    newdata[targetCompId + '.param'] = requestData;
    pageInstance.setData(newdata);
    if (customFeature.form == 'app_shop' && needColumnArr.indexOf('distance') > -1 && !isGetLatLng) {
      _this.getLatLng({
        success: function(latlng){
          requestData.extra_cond_arr = requestData.extra_cond_arr || {};
          requestData.extra_cond_arr.latitude = latlng.latitude;
          requestData.extra_cond_arr.longitude = latlng.longitude;
          _this._refreshListVessel(targetCompId, requestData, pageInstance, true);
        },
        fail: function(){
          _this.showToast({
            title: '您已经拒绝定位，店铺距离将获取不到',
            icon: 'none'
          });
          _this._refreshListVessel(targetCompId, requestData, pageInstance, true);
        }
      })
      return;
    }
    if(_this.globalData.hasFranchiseeTrade && ["app_shop"].indexOf(customFeature.form) > -1){
      chainflag = false;
    }
    if (customFeature.showSingleData) {
      _this.requestSingleData(pageInstance, customFeature, targetCompId, needColumnArr, requestData);
    } else {
      if (customFeature.form === 'community_group') {
        let ListVesselComponent = _this.customComponent['list-vessel'];
        let leaderToken = _this.globalData.leaderInfo && _this.globalData.leaderInfo.user_token || '';
        if (leaderToken) {
          ListVesselComponent.getCommunityGoodsList(targetCompId, requestData, leaderToken);
        } else {
          if (_this.isLogin()) {
            ListVesselComponent.getGroupLeaderLocking(targetCompId, requestData);
          } else {
            _this.goLogin({
              success: () => {
                ListVesselComponent.getGroupLeaderLocking(targetCompId, requestData);
              }
            })
          }
        }
        return;
      }
      _this.getReviewConfig(reviewList => {
        this.sendRequest({
          url: '/index.php?r=AppData/getFormDataList',
          method: 'post',
          data: requestData,
          hideLoading: true,
          chain: chainflag,
          subshop: pageInstance.franchiseeId || '',
          success: function (res) {
            let newData = {};
            let listField = pageInstance.data[targetCompId].listField;
            for (let j in res.data) {
              for (let k in res.data[j].form_data) {
                if (k == 'review_status') {
                  res.data[j].form_data[k] = res.data[j].form_data[k] == 0 ? reviewList.applying_text || '待审核' : res.data[j].form_data[k] == 1 ? reviewList.apply_passed_text || '审核通过' : reviewList.apply_unpassed_text || '审核不通过'
                }
                if (k == 'review_result') {
                  res.data[j].form_data[k] = res.data[j].form_data[k].replace(/\\n/, '');
                }
                if (k == 'category') {
                  continue;
                }
                if (/region/.test(k)) {
                  continue;
                }
                if (k == 'goods_model') {
                  res.data[j].form_data.virtual_price = _this.formVirtualPrice(res.data[j].form_data);
                }
                if (k == 'distance') {
                  res.data[j].form_data[k] = util.formatDistance(res.data[j].form_data[k]);
                }
                let description = res.data[j].form_data[k];
                if (listField.indexOf(k) < 0 && /<("[^"]*"|'[^']*'|[^'">])*>/.test(description)) { //没有绑定的字段的富文本置为空
                  res.data[j].form_data[k] = '';
                } else if (_this.needParseRichText(description)) {
                  res.data[j].form_data[k] = _this.getWxParseResult(description);
                }
              }
            }
            newData[targetCompId + '.list_data'] = res.data;
            newData[targetCompId + '.is_more'] = res.is_more;
            newData[targetCompId + '.curpage'] = 1;
            newData[targetCompId + '.scrollTop'] = 0;
            newData[targetCompId + '.loading'] = false;
            newData[targetCompId + '.loadingFail'] = false;
            pageInstance.setData(newData);
          },
          fail: function (res) {
            let newdata = {};
            newdata[targetCompId + '.loadingFail'] = true;
            newdata[targetCompId + '.loading'] = false;
            pageInstance.setData(newdata);
          }
        })
      })
    }
  },
  _refreshFranchiseeList: function (targetCompId, requestData, pageInstance) {
    let _this = this;
    let newdata = {};
    if (requestData.sort_key === 'distance' && !requestData.latitude) {
      let locationInfo = this.globalData.locationInfo;
      if (locationInfo.latitude) {
        newdata[targetCompId + '.location_address'] = locationInfo.address;
        newdata[targetCompId + '.latitude'] = requestData.latitude = locationInfo.latitude;
        newdata[targetCompId + '.longitude'] = requestData.longitude = locationInfo.longitude;
        pageInstance.setData(newdata);
        _this._refreshFranchiseeList(targetCompId, requestData, pageInstance);
      } else {
        _this.getLocation({
          type: 'gcj02',
          success: function (res) {
            let latitude = res.latitude,
              longitude = res.longitude;
            if (res.latitude) {
              pageInstance.requestNum++;
              _this.sendRequest({
                hideLoading: true,
                url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
                data: {
                  latitude: latitude,
                  longitude: longitude
                },
                success: function (res) {
                  let recommendAddress = res.data.formatted_addresses && res.data.formatted_addresses.recommend;
                  pageInstance.setData({[targetCompId + '.location_address']: recommendAddress});
                  _this.setLocationInfo({
                    latitude: latitude,
                    longitude: longitude,
                    address: recommendAddress,
                    info: res.data
                  });
                }
              });
              newdata[targetCompId + '.latitude'] = requestData.latitude = locationInfo.latitude;
              newdata[targetCompId + '.longitude'] = requestData.longitude = locationInfo.longitude;
              pageInstance.setData(newdata);
              _this._refreshFranchiseeList(targetCompId, requestData, pageInstance);
            }
          },
          fail: function (res) {
            requestData.sort_key = 'weight';
            _this._refreshFranchiseeList(targetCompId, requestData, pageInstance);
          }
        });
      }
      return;
    }
    if (!requestData.viewed_count) {
      requestData.viewed_count = 1;
      requestData.assess_score = 1;
      requestData.highest_weight = 3;
      requestData.get_least_coup = 4;
      requestData.carousel_imgs = 1;
      requestData.extra_cond_arr = {score_sub_shop: 1};
    }
    newdata[targetCompId + '.loading'] = true;
    newdata[targetCompId + '.loadingFail'] = false;
    newdata[targetCompId + '.franchisee_data'] = [];
    newdata[targetCompId + '.is_more'] = 1;
    newdata[targetCompId + '.curpage'] = 0;
    newdata[targetCompId + '.param'] = requestData;
    pageInstance.setData(newdata);
    this.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      hideLoading: true,
      method: 'post',
      data: requestData,
      success: function (res) {
        let newData = {};
        for (let index in res.data) {
          let _data = res.data[index];
          let distance = _data.distance;
          let score = _data.assess_score || 5;
          _data.distance = util.formatDistance(distance);
          _data.new_assess_score = _this.changeFranchiseScore(score.toString());
          _data.showDiscountList = _data.coupon_list && _data.coupon_list.length > 3 ? true : false;
          res.data[index] = _data;
        }
        newData[targetCompId + '.franchisee_data'] = res.data;
        newData[targetCompId + '.is_more'] = res.is_more || 0;
        newData[targetCompId + '.curpage'] = 1;
        newData[targetCompId + '.scrollTop'] = 0;
        newData[targetCompId + '.loadingFail'] = false;
        newData[targetCompId + '.loading'] = false;
        pageInstance.setData(newData);
        if (_this.globalData.isLogin) {
          _this.sendRequest({
            url: '/index.php?r=AppShop/GetMyAppShopList',
            data: Object.assign({ parent_app_id: _this.getAppId() }, requestData),
            hideLoading: true,
            success: function (res) {
              let newdata = {};
              let oldList = pageInstance.data[targetCompId].franchisee_data || [];
              let list = res.data;
              let listId = [];
              for (let i = 0; i < list.length; i++) {
                if (list[i].is_audit == 2) {
                  oldList.unshift(list[i]);
                  listId.push(list[i].id);
                }
              }
              newdata[targetCompId + '.franchisee_data'] = oldList;
              pageInstance.setData(newdata);
            }
          });
        }
      },
      fail: function (res) {
        let newdata = {};
        newdata[targetCompId + '.loadingFail'] = true;
        newdata[targetCompId + '.loading'] = false;
        pageInstance.setData(newdata);
      }
    })
  },
  _refreshTopicList: function (targetCompId, requestData, pageInstance) {
    let categoryId = requestData.idx_arr.idx_value || '';
    pageInstance.setData({
      [targetCompId + '.listParam.page']: 1,
      [targetCompId + '.listParam.category_id'] : categoryId,
      [targetCompId + '.listStatus']: {
        loading: false,
        isMore: true
      }
    });
    customComponent['topic'].getTopListData(targetCompId, pageInstance);
  },
  _refreshNewsList: function (targetCompId, requestData, pageInstance) {
    pageInstance.setData({
      [targetCompId + '.pageObj']: {
        isLoading: false,
        noMore: false,
        page: 1
      },
      [targetCompId + '.selectedCateId']: requestData.idx_arr.idx_value
    });
    customComponent['news'].getNewsList({ page: 1, compid: targetCompId, category_id: requestData.idx_arr.idx_value });
  },
  _refreshVideoList: function (targetCompId, requestData, pageInstance) {
    let _this = this;
    requestData.page_size = requestData.page_size || pageInstance.data[targetCompId].customFeature.loadingNum || 10;
    if (requestData.idx_arr['idx'] === 'category') {
      requestData.cate_id = requestData.idx_arr['idx_value'];
      delete requestData.idx_arr;
    }
    let newdata = {};
    newdata[targetCompId + '.loading'] = true;
    newdata[targetCompId + '.loadingFail'] = false;
    newdata[targetCompId + '.video_data'] = [];
    newdata[targetCompId + '.is_more'] = 1;
    newdata[targetCompId + '.curpage'] = 0;
    newdata[targetCompId + '.param'] = requestData; 
    pageInstance.setData(newdata);
    _this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppVideo/GetVideoList',
      data: requestData,
      method: 'post',
      chain: true,
      subshop: pageInstance.franchiseeId || '',
      success: function (res) {
        if (res.status == 0) {
          let rdata = res.data,
            newdata = {};
          for (let i = 0; i < rdata.length; i++) {
            rdata[i].video_view = _this.handlingNumber(rdata[i].video_view);
          }
          newdata[targetCompId + '.video_data'] = rdata;
          newdata[targetCompId + '.is_more'] = res.is_more;
          newdata[targetCompId + '.curpage'] = 1;
          newdata[targetCompId + '.loading'] = false;
          newdata[targetCompId + '.loadingFail'] = false;
          pageInstance.setData(newdata);
        }
      },
      fail: function (res) {
        let newdata = {};
        newdata[targetCompId + '.loadingFail'] = true;
        newdata[targetCompId + '.loading'] = false;
        pageInstance.setData(newdata);
      }
    });
  },
  _refreshGroupBuyList: function (targetCompId, requestData, pageInstance) {
    let _this = this;
    let compdata = pageInstance.data[targetCompId];
    let newData = {};
    newData[targetCompId + '.loading'] = true;
    newData[targetCompId + '.loadingFail'] = false;
    newData[targetCompId + '.is_more'] = 1;
    newData[targetCompId + '.goods_data'] = [];
    newData[targetCompId + '.param'] = requestData;
    pageInstance.setData(newData);
    this.sendRequest({
      url: '/index.php?r=appGroupBuy/goodsList',
      method: 'post',
      hideLoading: true,
      data: requestData,
      chain: true,
      success: function (res) {
        let rdata = res.data,
          newdata = {},
          downcountArr = [];
        if (pageInstance.downcountObject && pageInstance.downcountObject[targetCompId]) {
          let downcountArr = pageInstance.downcountObject[targetCompId];
          if (downcountArr && downcountArr.length) {
            for (let i = 0; i < downcountArr.length; i++) {
              downcountArr[i] && downcountArr[i].clear();
            }
          }
        }
        for (let i = 0; i < rdata.length; i++) {
          let f = rdata[i],
            dc;
          f.description = '';
          f.downCount = {
            hours: '00',
            minutes: '00',
            seconds: '00',
            days: '00'
          };
          f.original_price = f.virtual_price == '0.00' ? f.original_price : f.virtual_price;
          f.server_time = res.current_time || (Date.parse(new Date()) / 1000);
          f.seckill_end_time = f.end_date;
          f.seckill_start_time = f.start_date;
          if (f.status == 0 || f.status == 1 || f.status == 2) {
            dc = _this.beforeGroupDownCount(f, pageInstance, targetCompId + '.goods_data[' + i + ']');
          } else if (f.status == 3) {
            if (f.end_date != '-1') {
              dc = _this.duringGroupDownCount(f, pageInstance, targetCompId + '.goods_data[' + i + ']');
            }
          }
          dc && downcountArr.push(dc);
        }
        newdata[targetCompId + '.goods_data'] = rdata;
        newdata[targetCompId + '.is_more'] = res.is_more;
        newdata[targetCompId + '.curpage'] = res.current_page;
        newdata[targetCompId + '.loading'] = false;
        newdata[targetCompId + '.loadingFail'] = false;
        pageInstance.downcountObject[targetCompId] = downcountArr;
        pageInstance.setData(newdata);
      },
      fail: function (res) {
        let newData = {};
        newData[targetCompId + '.loadingFail'] = true;
        newData[targetCompId + '.loading'] = false;
        pageInstance.setData(newData);
      }
    })
  },
  _refreshSeckillBuyList: function (targetCompId, param, pageInstance) {
    let _this = this;
    let compData = pageInstance.data[targetCompId];
    let customFeature = compData.customFeature;
    let newData = {};
    if(customFeature.communityType == 1){
      param.pick_up_type = [5];
      let leaderInfo = this.globalData.leaderInfo;
      param.leader_token = leaderInfo ? leaderInfo.user_token : '';
    }else{
      param.pick_up_type = [1, 2, 3, 4];
    }
    if (customFeature.seckillActive && !param.seckill_activity_arr) {
      param.seckill_activity_arr = {
        seckill_activity_id: customFeature.seckillActive,
        seckill_activity_time_type: 6
      };
    }
    param.is_seckill_activity = customFeature.seckillType == 'activeSeckill' ? 1 : 0 ;
    if (pageInstance.downcountObject && pageInstance.downcountObject[targetCompId]){
      let downcountArr = pageInstance.downcountObject[targetCompId];
      if (downcountArr && downcountArr.length) {
        for (let i = 0; i < downcountArr.length; i++) {
          downcountArr[i] && downcountArr[i].clear();
        }
      }
    }
    newData[targetCompId + '.loading'] = true;
    newData[targetCompId + '.loadingFail'] = false;
    newData[targetCompId + '.is_more'] = 1;
    newData[targetCompId + '.goods_data'] = [];
    newData[targetCompId + '.param'] = param;
    pageInstance.setData(newData);
    this.sendRequest({
      url: '/index.php?r=AppShop/GetGoodsList',
      method: 'post',
      hideLoading: true,
      data: param,
      chain: true,
      subshop: pageInstance.franchiseeId || '',
      success: function (res) {
        let rdata = res.data,
          appId = _this.getAppId(),
          newdata = {},
          downcountArr = pageInstance.downcountObject[targetCompId] || [];
        if (rdata) {
          for (let i = 0; i < rdata.length; i++) {
            let f = rdata[i].form_data,
              dc;
            f.description = '';
            f.downCount = {
              hours: '00',
              minutes: '00',
              seconds: '00'
            };
            if (f.seckill_start_state == 0) {
              dc = _this.beforeSeckillDownCount(f, pageInstance, targetCompId + '.goods_data[' + i + '].form_data');
            } else if (f.seckill_start_state == 1) {
              dc = _this.duringSeckillDownCount(f, pageInstance, targetCompId + '.goods_data[' + i + '].form_data');
            }
            dc && downcountArr.push(dc);
            if (customFeature.style == 2 && customFeature.mode == 0) {
              rdata[i].form_data = _this.seckillStartTimeView(f);
            }
            if (+param.is_app_shop_seckill === 1 && f.app_id !== appId && !pageInstance.franchiseeId) {
              f.isSubShopGoods = true;
            } else {
              f.isSubShopGoods = false;
            }
          }
        }
        newdata[targetCompId + '.goods_data'] = res.data;
        newdata[targetCompId + '.is_more'] = res.is_more ? res.is_more : 0;
        newdata[targetCompId + '.curpage'] = 1;
        newdata[targetCompId + '.loading'] = false;
        newdata[targetCompId + '.loadingFail'] = false;
        pageInstance.downcountObject[targetCompId] = downcountArr;
        pageInstance.setData(newdata);
      },
      fail: function (res) {
        let newdata = {};
        newdata[compid + '.loadingFail'] = true;
        newdata[compid + '.loading'] = false;
        pageInstance.setData(newdata);
      }
    })
  },
   seckillStartTimeView(goods){
    let loaclDayTime = new Date(new Date().toLocaleDateString()).getTime() / 1000;
    let tomorrowTime = loaclDayTime + 86400;
    let afterTomorrowTime = tomorrowTime + 86400;
    let date = new Date(goods.seckill_start_timestamp * 1000);
    let m = date.getMonth() + 1;
    let d = date.getDate();
    let h = date.getHours();
    let min = date.getMinutes();
    goods.seckill_startTime = '';
    if (goods.seckill_start_timestamp <= tomorrowTime) {
      goods.startDay = 1;
    } else if (goods.seckill_start_timestamp > tomorrowTime && goods.seckill_start_timestamp <= afterTomorrowTime) {
      goods.startDay = 2;
      if (min == '00') {
        goods.seckill_startTime = '明日' + h + '点整开抢';
      } else if (min != '00' && min<10){
        goods.seckill_startTime = '明日' + h + ':0' + min + '开抢'
      } else {
        goods.seckill_startTime = '明日' + h + ':' + min + '开抢'
      }
    } else if (goods.seckill_start_timestamp > afterTomorrowTime) {
      goods.startDay = 2;
      if (min == '00') {
        goods.seckill_startTime = m + '月' + d + '日' + h + '点整开抢';
      } else if(min != '00' && min < 10){
        goods.seckill_startTime = m + '月' + d + '日' + h + ':0' + min + '开抢';
      } else {
      goods.seckill_startTime = m + '月' + d + '日' + h + ':' + min + '开抢';
      }
    }
    return goods;
  },
  _isOpenCommunityGroup: function (callback) {
    let that = this;
    this.sendRequest({
      url: '/index.php?r=AppDistribution/CheckDistributionGroupOpenStatus',
      success: function (res) {
        if (Array.isArray(res.data) && res.data.length <= 0) {
          that.showModal({
            content: '商家未开启社区团购，无法申请成为团长'
          })
          return;
        } else {
          that._getCommunityGroup(callback);
        }
      }
    })
  },
  _getCommunityGroup: function (callback) {
    let that = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/getDistributionInfo',
      success: function (res) {
        if (res.data && res.data.app_id) {
          that.globalData.getDistributionInfo = res.data;
          if (typeof callback == "function") {
            callback(res.data);
            return;
          }
          that._isOpenCommunityGroupCenter(true);
        } else {
          that.showModal({
            content: '商家未开启社区团购，无法申请成为团长'
          })
        }
      }
    })
  },
  getGroupLeaderLocking() {
    let _this = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistributionExt/getDistributorGroupLeaderByUserToken',
      success: function (res) {
        if(res.data){
          let leaderInfo = res.data.leader_info;
          _this.globalData.leaderInfo = leaderInfo;   //把团长信息存在全局，方便拿取
        }
      }
    })
  },
  _isOpenCommunityGroupCenter: function (clickPage) {
    let that = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      data: {
        is_group_leader_info: 1
      },
      success: function (res) {
        if(!res.data || !res.data.dis_group_info){
          that.turnToPage('/communityGroup/pages/communityGroupApply/communityGroupApply'); //申请团长页面
          return
        }
        if (clickPage) {
          let is_deleted = +res.data.dis_group_info.is_deleted || ''; // 团长是否被删除
          let threshold_type = +that.globalData.getDistributionInfo.threshold_type; //团长门槛
          let is_block_up = res.data ? (res.data.dis_group_info ? +res.data.dis_group_info.is_block_up : '') : ''; //1停用团长
          let isAudit = res.data ? (res.data.dis_group_info ?  res.data.dis_group_info.is_audit : '') : ''; // 1：审核通过 2：待审核 3：审核拒绝
          that.globalData.getDistributorInfo = res.data;
          if (is_deleted === 1) {  //团长被删除
            that.turnToPage('/communityGroup/pages/communityGroupApply/communityGroupApply'); //申请团长页面
            return
          }
          if(+isAudit === 1 || +is_block_up === 1 ) { //当是团长或者团长被停用
            that.turnToPage('/communityGroup/pages/communityGroupUserCenter/communityGroupUserCenter'); //团长个人中心
          } else {
            if(+isAudit === 2 || +isAudit === 3) { //当申请中或者申请被拒绝
              that.turnToPage('/communityGroup/pages/communityGroupApplyStatus/communityGroupApplyStatus'); //申请状态显示
            } else { //当没有申请即不是团长
              if(threshold_type != 1 ) { //有门槛
                that.turnToPage('/communityGroup/pages/communityGroupDoor/communityGroupDoor'); //团长门槛页
              } else {
                if (+that.globalData.getDistributionInfo['role_setting'][6]['pop_up_type'] === 0 && that.globalData.getDistributionInfo.role_setting[6].illustration) { //页面招募
                  that.turnToPage('/communityGroup/pages/communityRecruit/communityRecruit'); //招募说明
                } else { //弹窗式
                  that.turnToPage('/communityGroup/pages/communityGroupApply/communityGroupApply'); //申请团长页面
                }
              }
            }
          }
        } else {
          if (res.data) {
            that.globalData.p_id = res.data.id;
            that.globalData.PromotionUserToken = res.data.user_token;
          }
        }
      }
    })
  },
  _isOpenPromotion: function (callback) {
    let that = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/CheckDistributionOpenStatus',
      success: function (res) {
        if(res.data && res.data.app_id){
          that.globalData.getDistributionInfo = res.data;
          if(typeof callback == "function"){
            callback(res.data);
            return;
          }
          that._isPromotionPerson(true);
        }else{
          that.showModal({
            content: '商家未开启分销推广，无法申请成为代言人'
          })
        }
      }
    })
  },
  _isPromotionPerson: function (clickPage) {
    let that = this;
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      success: function (res) {
        if (clickPage) {
          if (res.data && res.data.is_audit == 1) {
            that.turnToPage('/promotion/pages/promotionUserCenter/promotionUserCenter');
            that.globalData.getDistributorInfo = res.data;
          } else {
            that.turnToPage('/promotion/pages/promotionApply/promotionApply?isAudit=' + (res.data && res.data.is_audit) || '');
          }
        } else {
          if (res.data) {
            that.globalData.p_id = res.data.id;
            that.globalData.PromotionUserToken = res.data.user_token;
          }
        }
      }
    })
  },
  _hasSelfCard: function () {
    let that = this;
    if (!this.globalData.isVcardInTabbar) return
    this.sendRequest({
      hideLoading: true,
      url: '/x70bSwxB/UserCard/getMyCardBySessionKey',
      success: function (res) {
        if (res.data && res.data.user_id) {
          that.globalData.HasCardToShareUserId = res.data.user_id;
        }
      }
    })
  },
  showGoodsShoppingcart: function (event) {
    let pageInstance = this.getAppCurrentPage();
    let dataset = event.currentTarget.dataset;
    let goodsId = dataset.id;
    let isPackage = dataset.ispackage; // 是否是套餐商品
    let buynow = dataset.buynow;
    let groupId = dataset.groupId;
    let leaderToken = dataset.leaderToken || (this.globalData.leaderInfo && this.globalData.leaderInfo.user_token);
    let showVirtualPrice = dataset.isShowVirtualPrice || '';
    let newData = {
      goodsId: goodsId,
      showBuynow: buynow,
      showVirtualPrice: showVirtualPrice,
      franchisee: pageInstance.franchiseeId || this.getChainId()
    }
    if (isPackage == 1) {
      let status = 0;
      let param = 'goods_id=' + goodsId + '&status=' + status;
      let chainParam = dataset.appId ? '&franchisee=' + dataset.appId : '';
      this.turnToPage("/eCommerce/pages/setMeal/setMeal?" + param + chainParam);     
      return;
    }
    if (dataset.appId && dataset.appId !== this.getAppId()) {
      newData['franchisee'] = dataset.appId;
    }
    if (groupId) {
      Object.assign(newData, {
        dis_group_id: groupId,
        leader_token: leaderToken,
      })
    }
    pageInstance.selectComponent('#component-goodsShoppingCart').showDialog(newData);
  },
  showAddShoppingcart: function (event) {
    let pageInstance = this.getAppCurrentPage();
    let dataset      = event.currentTarget.dataset;
    let goods_id     = dataset.id;
    let newData = {
      goodsId: goods_id,
      franchisee: pageInstance.franchiseeId || this.getChainId()
    };
    if (dataset.appId && dataset.appId !== this.getAppId()) {
      newData['franchisee'] = dataset.appId;
    }
    pageInstance.selectComponent('#component-tostoreShoppingCart').showDialog(newData);
  },
  turnToSearchPage: function (event) {
    let industry = event.currentTarget.dataset.industry || {};
    let listid = event.currentTarget.dataset.listid;
    let searchConf = event.currentTarget.dataset.conf || {};
    let listtype = event.currentTarget.dataset.listtype || '';
    let param = '';
    let goodsListId = '';
    let integral = '';
    let pageInstance = this.getAppCurrentPage();
    if (listtype === 'franchisee-list') {
      this.turnToPage('/franchisee/pages/franchiseeSearch/franchiseeSearch');
      return;
    }
    if (listid) {
      let goodsCompids = pageInstance.goods_compids_params;
      for (let i in goodsCompids) {
        if (listid == goodsCompids[i].param.id) {
          goodsListId = goodsCompids[i].compid;
          break;
        }
      }
      let customFeature = goodsListId ? pageInstance.data[goodsListId].customFeature : {};
      if (customFeature.controlCheck && !event.currentTarget.dataset.bindtype) { // controlCheck-是否为积分商品列表
        integral = 3
      } else {
        if (customFeature.isIntegral) {
          integral = 1
        } else {
          integral = 5
        }
      }
      if (event.currentTarget.dataset.bindtype && event.currentTarget.dataset.bindtype!='undefined') { // 绑定全局列表，将integral设置为5
        integral = 5
      }
      param = '&isHideStock=' + customFeature.isHideStock 
            + '&isHideSales=' + customFeature.isHideSales 
            + '&isShowVirtualPrice=' + customFeature.isShowVirtualPrice 
            + '&isShoppingCart=' + customFeature.isShoppingCart 
            + '&isBuyNow=' + customFeature.isBuyNow
            + '&integral=' + integral;
      if (customFeature.source && customFeature.source !== 'none') {
        param += '&category=' + customFeature.source;
      }
      if (customFeature.form === 'goods' && customFeature.isShowFranchiseeGoods && !pageInstance.franchiseeId) { // 是否显示子店商品(排除子店功能页)
        param += '&isShowFG=' + 1;
      }
    }
    param = param + '&industry=' + JSON.stringify(industry)      // 行业预约模板信息
          +'&searchConf=' + JSON.stringify(searchConf)           // 搜索结果页设置
          + '&keyCodeMeta=' + event.currentTarget.dataset.keycodemeta   // 开启联想
          + '&hotSearch=' + event.currentTarget.dataset.hotsearch       // 显示热门搜索项
          + '&hasQuickTags=' + event.currentTarget.dataset.hasquicktags // 显示推荐搜索项
          + '&quickTags=' + event.currentTarget.dataset.quicktags       // 推荐词
          + '&bindType=' + event.currentTarget.dataset.bindtype         // 是否开启全局搜索
          + '&isShowFG=' + (event.currentTarget.dataset.conf.goods.searchSubShop ? 1 : '')         // 是否开启连锁多商家搜索子店商品
    if (event.currentTarget.dataset.param) {
      this.turnToPage('/default/pages/advanceSearch/advanceSearch?param=' + event.currentTarget.dataset.param + param);
    } else {
      this.turnToPage('/default/pages/advanceSearch/advanceSearch?form=' + event.currentTarget.dataset.form + param);
    }
  },
  getBoundingClientRect: function (selector, callback) {
    wx.createSelectorQuery().selectAll(selector).boundingClientRect(function (rects) {
      typeof callback === 'function' && callback(rects);
    }).exec()
  },
  beforeSeckillDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = _this.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_start_time,
      showDays: true,
      callback: function () {
        let newData = {};
        newData[path + '.seckill_start_state'] = 1;
        newData[path + '.server_time'] = formData.seckill_start_time;
        page.setData(newData);
        formData.server_time = formData.seckill_start_time;
        _this.duringSeckillDownCount(formData, page, path);
      }
    }, page, path + '.downCount');
    return downcount;
  },
  duringSeckillDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = _this.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_end_time,
      showDays: true,
      callback: function () {
        let newData = {};
        newData[path + '.seckill_start_state'] = 2;
        page.setData(newData);
      }
    }, page, path + '.downCount');
    return downcount;
  },
  beforeGroupDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = _this.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_start_time,
      showDays: true,
      callback: function () {
        let newData = {};
        newData[path + '.status'] = 3;
        newData[path + '.current_status'] = 3;
        newData[path + '.server_time'] = formData.seckill_start_time;
        page.setData(newData);
        formData.server_time = formData.seckill_start_time;
        if(formData.seckill_end_time === -1) { return; }
        _this.duringGroupDownCount(formData, page, path);
      }
    }, page, path + '.downCount');
    return downcount;
  },
  duringGroupDownCount: function (formData, page, path) {
    let _this = this,
      downcount;
    downcount = _this.seckillDownCount({
      startTime: formData.server_time,
      endTime: formData.seckill_end_time,
      showDays: true,
      callback: function () {
        let newData = {};
        newData[path + '.status'] = 4;
        newData[path + '.current_status'] = 4;
        page.setData(newData);
        if (path == "myTeams") {
          page.loadMyTeams();
        }
      }
    }, page, path + '.downCount');
    return downcount;
  },
  seckillFunc: {},
  seckillInterval: '',
  seckillDownCount: function (opts, page, path) {
    let that = this;
    let opt = {
      startTime: opts.startTime || null,
      endTime: opts.endTime || null,
      callback: opts.callback,
      showDays: opts.showDays || false
    };
    let systemInfo = this.getSystemInfoData().system;
    let isiphone = systemInfo.indexOf('iOS') != -1;
    if (isiphone && opt.endTime !== -1 && /\-/g.test(opt.endTime)) {
      opt.endTime = opt.endTime.replace(/\-/g, '/');
    }
    if (isiphone && opt.startTime !== -1 && /\-/g.test(opt.startTime)) {
      opt.startTime = opt.startTime.replace(/\-/g, '/');
    }
    if (/^\d+$/.test(opt.endTime)) {
      opt.endTime = opt.endTime * 1000;
    }
    if (/^\d+$/.test(opt.startTime)) {
      opt.startTime = opt.startTime * 1000;
    }
    let target_date = new Date(opt.endTime);
    let current_date = new Date(opt.startTime);
    let difference = target_date - current_date;
    let data = {};
    let len = 'sk' + parseInt(Math.random() * 100000000);
    data = {
      opts: opts,
      page: page,
      path: path,
      difference: difference,
      index: len
    }
    that.seckillFunc[len] = data;
    if (!that.seckillInterval) {
      that.seckillInterval = setInterval(function () {
        let newdata = {};
        let func = that.seckillFunc;
        for (let i in func) {
          let f = func[i];
          let difference = f.difference;
          let _path = f.path;
          let _page = f.page;
          let router = _page.__wxExparserNodeId__;
          if (!newdata[router]) {
            newdata[router] = {
              page: _page,
              data: {}
            }
          }
          if (difference < 0) {
            let callback = func[i].opts.callback;
            if (callback && typeof callback === 'function') { callback(); };
            delete that.seckillFunc[i];
            continue;
          }
          let time = that.seckillCountTime(difference, f.opts);
          newdata[router].data[_path + '.hours'] = time[0];
          newdata[router].data[_path + '.minutes'] = time[1];
          newdata[router].data[_path + '.seconds'] = time[2];
          if (f.opts.showDays) {
            newdata[router].data[_path + '.days'] = time[3];
          }
          that.seckillFunc[i].difference -= 1000;
        }
        for (let j in newdata) {
          newdata[j].page.setData(newdata[j].data);
        }
      }, 1000);
    }
    return {
      isClear: false,
      clear: function () {
        if (this.isClear) {
          return;
        }
        this.isClear = true;
        delete that.seckillFunc[len];
        if (util.isPlainObject(that.seckillFunc)) {
          clearInterval(that.seckillInterval);
          that.seckillInterval = '';
        }
      }
    };
  },
  seckillCountTime: function (difference, opts) {
    if (difference < 0) {
      return ['00', '00', '00'];
    }
    let _second = 1000,
      _minute = _second * 60,
      _hour = _minute * 60,
      _day = _hour * 24,
      time = [];
    let days = '';
    let hours = Math.floor(difference / _hour);
    let minutes = Math.floor((difference % _hour) / _minute);
    let seconds = Math.floor((difference % _minute) / _second);
    if (opts.showDays) {
      days = Math.floor(difference / _day);
      hours = Math.floor((difference % _day) / _hour);
    }
    hours = (String(hours).length >= 2) ? hours : '0' + hours;
    minutes = (String(minutes).length >= 2) ? minutes : '0' + minutes;
    seconds = (String(seconds).length >= 2) ? seconds : '0' + seconds;
    time[0] = hours;
    time[1] = minutes;
    time[2] = seconds;
    opts.showDays && (time[3] = days);
    return time;
  },
  getAssessList: function (param) {
    param.url = '/index.php?r=AppShop/GetAssessList';
    this.sendRequest(param);
  },
  getOrderDetail: function (param) {
    param.url = '/index.php?r=AppShop/getOrder';
    this.sendRequest(param);
  },
  showUpdateTip: function () {
    this.showModal({
      title: '提示',
      content: '您的微信版本不支持该功能，请升级更新后重试'
    });
  },
  textToMap: function (event) {
    let dataset = event.currentTarget.dataset;
    let latitude = +dataset.latitude;
    let longitude = +dataset.longitude;
    let address = dataset.address;
    if (!latitude || !longitude) {
      return;
    }
    this.openLocation({
      latitude: latitude,
      longitude: longitude,
      address: address
    });
  },
  turnToVideoDetail: function (event) {
    let id = event.currentTarget.dataset.id;
    let franchisee = this.getPageFranchiseeId();
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    this.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + id + chainParam);
  },
  handlingNumber: function (num) {
    num = +num;
    if (num > 1000000) { //大于百万直接用万表示
      return Math.floor(num / 10000) + '万';
    } else if (num > 10000) { //大于一万小于百万的保留一位小数
      return (num / 10000).toString().replace(/([0-9]+.[0-9]{1})[0-9]*/, "$1") + '万';
    } else {
      return num;
    }
  },
  needParseRichText: function (data) {
    if (typeof data == 'number') {
      return true;
    }
    if (typeof data == 'string') {
      if (!data) {
        return false;
      }
      if (/^https?:\/\/(.*)\.(jpg|jpeg|png|gif|bmp|svg|swf)/g.test(data) || /^https?:\/\/img/.test(data)) {
        return false;
      }
      return true;
    }
    return false;
  },
  calculationDistanceByLatLng: function(lat1, lng1, lat2, lng2){
    const EARTH_RADIUS = 6378137.0;    //单位M
    const PI = Math.PI;
    let a = (lat1 - lat2) * PI / 180.0;
    let b = (lng1 - lng2) * PI / 180.0;
    let s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(lat1 * PI / 180.0) * Math.cos(lat2 * PI / 180.0) * Math.pow(Math.sin(b / 2), 2)));
    s = s * EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000.0;
    return s;
  },
  loginForRewardPoint: function (addTime) {
    let that = this;
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=appShop/getIntegralLog',
      data: { 
        add_time: addTime, 
        login: 1,
        session_key: that.getSessionKey()
      },
      success: function (res) {
        if (res.status == 0) {
          let vipLevel = res.vip_level,
            rewardCount = res.data,
            pageInstance = that.getAppCurrentPage(),
            newData = {};
          if (!pageInstance) { // 确保能获取到当前页实例
            return;
          }
          if (rewardCount > 0 && vipLevel > 0) {
            newData.rewardPointObj = {
              showModal: true,
              count: rewardCount,
              callback: (vipLevel > 1 ? 'showVipUp' : 'showVip')
            }
            pageInstance.setData(newData);
          } else {
            if (rewardCount > 0) {
              newData.rewardPointObj = {
                showModal: true,
                count: rewardCount,
                callback: ''
              }
            }
            if (vipLevel > 0) {
              newData.shopVipModal = {
                showModal: true,
                isUp: vipLevel > 1
              }
            }
            pageInstance.setData(newData);
          }
        }
      }
    });
  },
  getEffectActivity: function (psid) {
    var that = this;
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=ShareGiftActivity/GetEffectActivity',
      hideLoading: psid ? true : false,
      success: function (res) {
        if (res.data) {
          let immediately = res.data.immediately;
          if (res.data.surplus_times != 0 || res.data.has_extra_rewards) {
            that.recvRewards(immediately);
          }
          that.globalData.pageShareType = immediately;
          if (psid && that.isLogin()) {
            that.getRecvChance(2, psid);
          }
        }
      }
    });
  },
  getNewcomerActivity: function () {
    let that = this;
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=newUserGift/GetActivity',
      success: function (res) {
        let pageInstance = that.getAppCurrentPage();
        if (pageInstance && res.data && res.data.is_pop == 1) {
          pageInstance.selectComponent('#newcomer-gift').newcomerInit(res.data);
        }
      }
    })
  },
  getInviteNewActivity: function (psid) {
    let that = this;
    let appScene = this.globalData.appScene;
    let is_qr_code = 0;
    if (appScene && ([1047, 1048, 1049].indexOf(appScene) > -1)){ 
      is_qr_code = 1;
    }
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=pullUserGift/GetActivity',
      data: {
        share_token: psid,
        is_qr_code: is_qr_code 
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0 && res.data) {
          that.globalData.inviterId = res.data.id;
          let pageInstance = that.getAppCurrentPage();
          if (pageInstance) {
            pageInstance.selectComponent('#newcomer-gift').inviterInit(res.data);
          }
        }
      }
    })
  },
  getRecvChance: function (type, s_token, isLogin) {
    let that = this;
    let token = s_token ? s_token : that.globalData.pageShareKey;
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=ShareGiftActivity/GetRecvChance',
      method: 'POST',
      data: {
        share_type: type,
        share_token: token
      },
      hideLoading: s_token ? true : false,
      success: res => {
        if (!res.data.get_chance) {
          if (type == 1) {
            that.getEffectActivity();
          } else {
            if (isLogin) {
              that.getEffectActivity();
            }
          }
        }
      }
    })
  },
  recvRewards: function (immediately) {
    var that = this,
      pageInstance = that.getAppCurrentPage();
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=ShareGiftActivity/CanRecvRewards',
      success: res => {
        var gifts = res.data && res.data.rewards;
        if (res.data && typeof (res.data) != 'string' && !(gifts.length == 1 && (gifts[0].type == 4 || gifts[0].type == 5) && gifts[0].already_recv)) {
          pageInstance.setData({
            'shareGiftsObj': {
              showRewardsModal: true,
              showExtraRewardModal: true,
              extra_rewards: res.data.extra_rewards,
              gifts: res.data,
              immediately: immediately,
              callback: ''
            }
          });
        }
      }
    })
  },
  getCollectActivity: function () {
    var that = this,
      pageInstance = that.getAppCurrentPage(),
      newData = {};
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=CollectGift/GetEffectActivity',
      success: function (res) {
        if (res.data && typeof (res.data) != 'string') {
          let data = res.data,
            manualClose = {},
            closeTimer;
          for (let index in res.data.close_setting) {
            var close = res.data.close_setting[index];
            if (close.type == 1) {
              closeTimer = close.value;
            } else if (close.type == 2) {
              manualClose = close
            }
          };
          pageInstance.setData({
            'collectGiftsObj': {
              topNavBarHeight: that.globalData.topNavBarHeight,
              showModal: data.status == 1 ? true : false,
              gifts: data.rewards,
              close_setting: data.close_setting,
              manualClose: manualClose,
              style: data.style,
              callback: ''
            }
          });
          if (closeTimer) {
            setTimeout(function () {
              pageInstance.setData({
                'collectGiftsObj': {
                  showModal: false
                }
              });
            }, closeTimer * 1000)
          }
        }
      }
    })
  },
  recvCollectRewards: function () {
    var that = this;
    var pageInstance = that.getAppCurrentPage();
    that.sendRequest({
      hideLoading: true,
      url: '/index.php?r=CollectGift/RecvRewards',
      success: function (res) {
        if (res.data.length >  0 && typeof (res.data) != 'string') {
          pageInstance.setData({
            'collectGetObj': {
              showModal: true,
              gifts: res.data
            }
          });
        }
      }
    })
  },
  animationEnd: function (e) {
    let pageInstance = this.getAppCurrentPage();
    if (/^disappear_/g.test(e.detail.animationName)) {
      let compid = e.target.dataset.compid;
      let data = {};
      data[compid + '.hidden'] = true;
      pageInstance.setData(data);
    }
  },
  checkCanUse: function (attr, dataName, compNameArr) {
    let pageInstance = this.getAppCurrentPage();
    let nowVersion = this.getSystemInfoData().SDKVersion || '2.0.7';
    let use = this.compareVersion(nowVersion, '2.0.7') > -1;
    let data = pageInstance.data;
    let canUseCompPath = [];
    let newdata = {};
    canUseCompPath = this.isCanUse(data, compNameArr, '');
    for (let i = 0; i < canUseCompPath.length; i++) {
      newdata[canUseCompPath[i] + '.' + dataName] = use;
    }
    pageInstance.setData(newdata);
  },
  isCanUse: function (comp, compNameArr, path) {
    let that = this;
    let canUseCompPath = [];
    for (let i in comp) {
      let cp = comp[i];
      let p = path == '' ? i : (path + '[' + i + ']');
      if (Object.prototype.toString.call(cp.content) == "[object Array]") {
        let r = that.isCanUse(cp.content, compNameArr, p + '.content');
        canUseCompPath = canUseCompPath.concat(r);
      } else if (Object.prototype.toString.call(cp.content) == "[object Object]") {
        for (let j in cp.content) {
          let cpj = cp.content[j];
          let r = that.isCanUse(cpj, compNameArr, p + '.content.' + j);
          canUseCompPath = canUseCompPath.concat(r);
        }
      }
      if (compNameArr.indexOf(cp.type) > -1) {
        canUseCompPath.push(p);
      }
    }
    return canUseCompPath;
  },
  compareVersion: function (v1, v2) {
    v1 = v1.split('.')
    v2 = v2.split('.')
    var len = Math.max(v1.length, v2.length)
    while (v1.length < len) {
      v1.push('0')
    }
    while (v2.length < len) {
      v2.push('0')
    }
    for (var i = 0; i < len; i++) {
      var num1 = parseInt(v1[i])
      var num2 = parseInt(v2[i])
      if (num1 > num2) {
        return 1
      } else if (num1 < num2) {
        return -1
      }
    }
    return 0
  },
  getAppECStoreConfig: function (callback, franchiseeId) {
    let _this = this;
    if (this.globalData.goodsStoreConfig && !franchiseeId) {
      callback(this.globalData.goodsStoreConfig);
      return;
    }
    if (franchiseeId && this.globalData.goodsfranchiseeStoreConfig[franchiseeId]) {
      callback(this.globalData.goodsfranchiseeStoreConfig[franchiseeId]);
      return;
    }
    franchiseeId = franchiseeId == 'first' ? '' : (franchiseeId || this.getPageFranchiseeId());
    this.sendRequest({
      url: '/index.php?r=AppEcommerce/getAppBECStoreConfig',
      hideLoading: true,
      data: {
        sub_shop_app_id: franchiseeId || ''
      },
      success: function (res) {
        if (franchiseeId) {
          _this.globalData.goodsfranchiseeStoreConfig[franchiseeId] = res.data;
        } else {
          _this.globalData.goodsStoreConfig = res.data;
        }
        callback && callback(res.data)
      }
    })
  },
  addLog: function () {
    this.saveLog('log', arguments);
  },
  addDebug: function () {
    this.saveLog('debug', arguments);
  },
  addInfo: function () {
    this.saveLog('info', arguments);
  },
  addWarn: function () {
    this.saveLog('warn', arguments);
  },
  addError: function () {
    this.saveLog('error', arguments);
  },
  saveLog: function (tp, argu) {
    let that = this;
    let time = util.formatTime();
    let manager = [];
    for (let i = 0; i < argu.length; i++) {
      manager.push(argu[i]);
    }
    let info = {
      "type": tp, //可能值：log,debug,info,warn,error,
      "time": time, //时间
      "manager": manager //日志信息， 数组的值是any类型
    }
    this.getStorage({
      key: 'logManager',
      success: function (res) {
        let lm = res.data.log_info;
        lm.push(info);
        that.setStorage({
          key: 'logManager',
          data: {
            log_info: lm
          }
        })
      },
      fail: function () {
        let lm = [];
        lm.push(info);
        that.setStorage({
          key: 'logManager',
          data: {
            log_info: lm
          }
        })
      }
    })
  },
  sendLog: function () {
    let that = this;
    let logManager = wx.getStorageSync('logManager');
    if (!logManager || logManager.length == 0) {
      return;
    }
    logManager = logManager.log_info;
    let phone = this.getUserInfo('phone');
    let token = this.getUserInfo('user_token');
    let sys = this.getSystemInfoData();
    this.sendRequest({
      url: '/index.php?r=AppData/AddErrorLog',
      hideLoading: true,
      data: {
        user_phone: phone,
        user_token: token,
        system_info: JSON.stringify(sys),
        log_info: JSON.stringify(logManager)
      },
      method: 'post',
      success: function () {
        that.removeStorage({
          key: 'logManager'
        });
      }
    });
  },
  getChainStoreInfo: function (_from, needStorage) {
    let that = this;
    that.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      hideLoading: true,
      data: {
        is_show_chain: 1,
        sub_shop_app_id: that.globalData.chainAppId,
        page: 1,
        page_size: 1
      },
      success: function (res) {
        customComponent['franchisee-chain'] && customComponent['franchisee-chain'].setChainInfo(res, _from, needStorage);
      },
      fail: function () {
        let pageInstance = that.getAppCurrentPage();
        that.globalData.chainAppId = '';
        that.globalData.chainHistoryDataId = '';
        if (pageInstance && pageInstance.page_router && that.globalData.chainNotLoading && pageInstance.dataInitial) {
          pageInstance.dataInitial();
        }
        that.globalData.chainNotLoading = false;
      },
      successStatusAbnormal: function(){
        this.fail();
      }
    });
  },
  getTradeStoreInfo: function (chainId) {
    let that = this;
    that.sendRequest({
      url: '/index.php?r=AppShopManage/GetBizShopLevelList',
      hideLoading: true,
      data: {
        biz_app_id: chainId,
      },
      success: function (res) {
        let pageInstance = that.getAppCurrentPage();      
        let info = res.data[0]
        if (info) {
          let tradeData = info['biz_shop_list'] && info['biz_shop_list'][0];
          let tradeInfo = {
            app_id: tradeData.app_id || '',
            level: tradeData.level || '',
            m_name: tradeData.m_name || '',
            id: tradeData.id || '',
            p_id: tradeData.p_id || '',
            his_id: tradeData.s_his_data && tradeData.s_his_data.his_id || '',
            online_his_id: tradeData.s_his_data && tradeData.s_his_data.online_his_id || '',
          }
          that.globalData.chainAppId = tradeInfo.app_id;
          that.globalData.newHistoryDataId = tradeInfo.his_id;
          that.setStorage({ key: 'tradeInfo', data: tradeInfo });
          if (pageInstance && pageInstance.dataInitial) {
            that.afterFirstGetConfig(pageInstance);
          }
        } else {
          that.setStorage({ key: 'tradeInfo', data: {} });   //显示总店数据
        }
      },
      fail: function () {
        let pageInstance = that.getAppCurrentPage();
        that.globalData.newHistoryDataId = '';
        if (pageInstance && pageInstance.dataInitial && !that.globalData.treadeLoading) {
          that.afterFirstGetConfig(pageInstance);
        }
        that.globalData.treadeLoading = true;
      }
    });
  },
  afterFirstGetConfig: function (pageInstance) {
    let that = this;
    if (pageInstance.pageLoaded) {
      pageInstance.pageLoaded = false;
      pageInstance.dataInitial();
    } else {
      setTimeout(() => {
        that.afterFirstGetConfig(pageInstance);
      }, 100)
    }
  },
  businessTimeCompare: function (time) {
    let now = new Date();
    let min = now.getMinutes().toString();
    if (min.length <= 1) {
      min = '0' + min;
    }
    let current = +(now.getHours().toString() + min);
    let business = false;
    for (let i = 0; i < time.length; i++) {
      if (current > +time[i].start_time_str && current < +time[i].end_time_str) {
        business = true;
      }
    }
    return business;
  },
  clearChainInfo: function () {
    this.globalData.chainAppId = '';
    this.globalData.chainHistoryDataId = '';
    this.globalData.indexPageRefresh = true;
    this.globalData.p_u = '';
    wx.removeStorageSync('chainStore');
  },
  getPageFranchiseeId: function () {
    let pageInstance = this.getAppCurrentPage();
    return pageInstance.franchiseeId || pageInstance.data.franchiseeId || this.getChainId() || '';
  },
  setNowGommunityToken(token) {
    this.setStorage({
      key: 'nowGommunityToken',
      data: token
    })
  },
  getNowGommunityToken() {
    return wx.getStorageSync('nowGommunityToken');
  },
  getCommunityActiveMessage() {
    let role_setting = this.globalData.getDistributionInfo.role_setting;
    let message = '';
    for (let key in role_setting) {
      if (key == '6') {
        if(role_setting[key].illustration && role_setting[key].illustration.trim()) {
          message = role_setting[key].illustration.split('\n');
        }
        break
      }
    }
    return message;
  },
  pageRoot: {
    'groupCenter': '/eCommerce/pages/groupCenter/groupCenter',
    'shoppingCart': '/eCommerce/pages/shoppingCart/shoppingCart',
    'myOrder': '/eCommerce/pages/myOrder/myOrder',
    'myMessage': '/userCenter/pages/myMessage/myMessage',
    'goodsShoppingCart': '/eCommerce/pages/shoppingCart/shoppingCart',
    'myFormMessage': '/userCenter/pages/myFormMessage/myFormMessage',
    'transferPage': '/eCommerce/pages/transferPage/transferPage',
    'myGiftCardsList': '/giftCard/pages/giftCardCenter/giftCardCenter',
    'myShoppingCardsList': '/shoppingCard/pages/shoppingCardCenter/shoppingCardCenter',
  },
  addSubShopView: function (sub_app_id) {
    this.sendRequest({
      url: '/index.php?r=AppShopManage/AddSubShopView',
      hideLoading: true,
      data: {
        sub_app_id: sub_app_id,
      },
      success: function (res) {},
      fail: function () {}
    });
  },
  getPromotionPersonId: function (callback) {
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      success: function (res) {
        if (res.status == 0 && res.data.is_audit == 1) {
          typeof callback == "function" && callback(res);
        }
      }
    })
  },
  checkTechSupport: function (pageInstance) {
    let that = this;
    pageInstance = pageInstance || this.getAppCurrentPage();
    if(that.globalData.techSupport){
      pageInstance.setData({
        techSupport: that.globalData.techSupport
      });
      return;
    }
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppData/CheckTechSupport',
      success: function (res) {
        that.globalData.techSupport = res.data;
        pageInstance.setData({
          techSupport: res.data
        });
      }
    })
  },
  checkIsSubOrParentShop: function() {
    let that = this;
    if (JSON.stringify(this.globalData.shopTypeData) != '{}') {
      return this.globalData.shopTypeData;
    }
    this.sendRequest({
      url: '/index.php?r=AppShopManage/CheckIsAppSubOrParentShop',
      hideLoading: true,
      success: function(res) {
        if (res.data) {
          that.setShopTypeData(res.data);
          return res.data
        }
      }
    });
  },
  produceBehaviorId: function(){
    let random = parseInt((Math.random() + 1) * Math.pow(10, 5)); //时间戳
    let time = (new Date()).valueOf().toString(); //随机数
    this.globalData.behaviorLogId = random + time;
  },
  sendUseBehavior: function (goodsArr,action,direction) {
    let uuid = this.globalData.appOptions.query.uuid; //有值说明是黑沙转发 antion值 行为：1->回访，2->已购
    let param = [];
    let collectType = 1; //   1->用户行为轨迹,  2->转发
    let type = 1;     // 访问对象 1->商品 2->页面 3-> 订单 4->优惠券
    if(!uuid && (action == 11 || action == 10)){return};
    if(uuid && action == 11){
      action = 2;  //有值说明是黑沙转发 antion值 行为：1->回访，2->已购
      collectType = 2;
    }else if(uuid && action == 10){
      action = 1;  //有值说明是黑沙转发 antion值 行为：1->回访，2->已购
      collectType = 2;
    }else{
      uuid = '';
    }
    if ([5,6,7,8,9,10,11,12,13,14,15,16,17,19,20].indexOf(action) != -1) {
      type = 3;
    }
    if ([18].indexOf(action) != -1) {
      type = 4;
    }
    for(let item of goodsArr){
      param.push({
        obj_id: item.goodsId,
        num: item.num || '',
        type: type,
        referer: this.globalData.appScene,  //场景值
        action: action,   //普通转发antion   行为：0->浏览，1->已购，2->已分享，3->已收藏，4->已加购
        log_id: this.globalData.behaviorLogId,
        uuid: uuid,
        action_direction:  direction || 1   //(必) 行为方向，1->正向，2->逆向，正向表示行为本身，逆向表示行为反向操作，比如对已收藏的商品取消收藏，上报action=3，action_direction=2即为取消收藏
      })
    }
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppUserBehavior/Collect',
      data: {
        app_type: 1,
        param: param,
        collect_type: collectType, 
      },
      method: 'post',
      success: function (res) {
      }
    });
  },
  getHomepageRouter: function () {
    return this.globalData.homepageRouter;
  },
  getAppId: function () {
    return this.globalData.appId;
  },
  getChainAppId: function () {
    return this.globalData.chainAppId || this.globalData.appId;
  },
  getChainId: function () {
    return this.globalData.chainAppId || '';
  },
  getPageRouter: function () {
    let pageInstance = this.getAppCurrentPage();
    if (pageInstance) {
      return pageInstance.page_router;
    }
    return this.globalData.pageRouter;
  },
  setPageRouter: function (url) { // 设置页面pageRouter
    let urlMatch = url.match(/.*\/(\w+)\??$/);
    if (urlMatch) {
      this.globalData.pageRouter = urlMatch[1];
    }
  },
  getLastPageRouter: function () {
    let lastPage = getCurrentPages().slice(-2).shift();
    return lastPage && lastPage.page_router;
  },
  getDefaultPhoto: function () {
    return this.globalData.defaultPhoto;
  },
  getSessionKey: function () {
    return this.globalData.sessionKey;
  },
  setSessionKey: function (session_key) {
    this.globalData.sessionKey = session_key;
    this.setStorage({
      key: 'session_key',
      data: session_key
    })
  },
  getUserInfo: function (key) {
    return key ? this.globalData.userInfo[key] : this.globalData.userInfo;
  },
  setUserInfoStorage: function (info) {
    for (let key in info) {
      this.globalData.userInfo[key] = info[key];
    }
    this.setStorage({
      key: 'userInfo',
      data: this.globalData.userInfo
    })
  },
  setPageUserInfo: function () {
    let currentPage = this.getAppCurrentPage();
    let newdata = {};
    newdata['userInfo'] = this.getUserInfo();
    currentPage.setData(newdata);
  },
  getAppCurrentPage: function () {
    let pages = getCurrentPages();
    return pages[pages.length - 1];
  },
  getTabPagePathArr: function () {
    return JSON.parse(this.globalData.tabBarPagePathArr);
  },
  getWxParseOldPattern: function () {
    return this.globalData.wxParseOldPattern;
  },
  getWxParseResult: function (data, setDataKey) {
    let page = this.getAppCurrentPage();
    data = typeof data == 'number' ? '' + data : data.replace(/\u00A0|\u2028|\u2029|\uFEFF/g, '');
    return WxParse.wxParse(setDataKey || this.getWxParseOldPattern(), 'html', data, page);
  },
  getAppTitle: function () {
    return this.globalData.appTitle;
  },
  getAppDescription: function () {
    return this.globalData.appDescription;
  },
  setLocationInfo: function (info) {
    this.globalData.locationInfo = info;
  },
  getLocationInfo: function () {
    return this.globalData.locationInfo;
  },
  getSiteBaseUrl: function () {
    return this.globalData.siteBaseUrl;
  },
  getCdnUrl: function () {
    return this.globalData.cdnUrl;
  },
  getUrlLocationId: function () {
    return this.globalData.urlLocationId;
  },
  getPreviewGoodsInfo: function () {
    return this.globalData.previewGoodsOrderGoodsInfo;
  },
  setPreviewGoodsInfo: function (goodsInfoArr) {
    this.globalData.previewGoodsOrderGoodsInfo = goodsInfoArr;
  },
  getGoodsAdditionalInfo: function () {
    return this.globalData.goodsAdditionalInfo;
  },
  setGoodsAdditionalInfo: function (additionalInfo) {
    this.globalData.goodsAdditionalInfo = additionalInfo;
  },
  vipCardTurnToPage: function (e) {
    let type = e.currentTarget.dataset.type;
    let id = e.currentTarget.dataset.id;
    let cardtype = e.currentTarget.dataset.cardtype;
    let isLeague = e.currentTarget.dataset.isLeague;
    let pageRouter = isLeague ? '/eCommerce/pages/leagueVipAdvertise/leagueVipAdvertise' : '/eCommerce/pages/vipBenefits/vipBenefits';
    let chainParam = this.globalData.chainAppId ? '&franchisee=' + this.globalData.chainAppId : '';
    if (type == 'get-vip') {
      this.turnToPage('/userCenter/pages/userCenter/userCenter?is_member=1' + chainParam);
    } else if (type == 'buy-vip') {
      this.turnToPage(pageRouter + '?is_paid_card=1');
    } else if (type == 'renewal-vip') {
      this.turnToPage(pageRouter + '?is_paid_card=1&id=' + id);
    } else if (type == 'ordinary-vip') {
      this.turnToPage(pageRouter + '?id=' + id + '&cardtype=' + cardtype);
    } else if (type == 'average-user') {
      if (e.currentTarget.dataset.isturnto == 'true') {
        if (e.currentTarget.dataset.needcollectinfo == 1) {
          this.turnToPage('/userCenter/pages/userCenter/userCenter?is_member=1' + chainParam)
        } else {
          this.turnToPage(pageRouter);
        }
      }
    } else if (type == 'differential-mall') {
      this.turnToPage('/differentialMall/pages/dMWebView/dMWebView');
    }
  },
  showQRRemark: function (e) {
    let compid = e.currentTarget.dataset.compid;
    let data = {}
    let isShow = e.currentTarget.dataset.isshow;
    let pageInstance = this.getAppCurrentPage();
    if (isShow == 'true') {
      data[compid + '.userData.qrRemarkShow'] = true;
      pageInstance.setData(data);
      let url2 = '/index.php?r=appVipCard/getVipQRCode';
      let id = e.currentTarget.dataset.id;
      let is_paid_vip = e.currentTarget.dataset.type;
      this.sendRequest({
        url: url2,
        data: {
          id: id,
          is_paid_vip: is_paid_vip
        },
        chain: true,
        subshop: pageInstance.franchiseeId || '',
        success: function (res) {
          let qrData = {};
          qrData[compid + '.qrData'] = res.data;
          pageInstance.setData(qrData);
        }
      })
    } else {
      data[compid + '.userData.qrRemarkShow'] = false;
      pageInstance.setData(data);
    }
  },
  showQRWindow: function (e) {
    let pageInstance = this.getAppCurrentPage();
    let id = e.currentTarget.dataset.id;
    let is_paid_vip = e.currentTarget.dataset.is_paid_vip
    let vipCardQrCode = {
      vipCardQrCodeShow: true,
      componentType: 'userCenter',
      vipCardId: id,
      is_paid_vip: is_paid_vip
    }
    pageInstance.selectComponent('#vip-card-qr-code').showDialog(vipCardQrCode);
  },
  getIsLogin: function () {
    return this.globalData.isLogin;
  },
  setIsLogin: function (isLogin) {
    this.globalData.isLogin = isLogin;
  },
  getSystemInfoData: function () {
    let res;
    if (this.globalData.systemInfo) {
      return this.globalData.systemInfo;
    }
    try {
      res = wx.getSystemInfoSync();
      res.rpxRatio = 750 / res.windowWidth;
      this.setSystemInfoData(res);
    } catch (e) {
      this.showModal({
        content: '获取系统信息失败 请稍后再试'
      })
    }
    return res || {};
  },
  setSystemInfoData: function (res) {
    res.rpxRatio = 750 / res.windowWidth;
    this.globalData.systemInfo = res;
  },
  setShopTypeData: function(shopData) {
    this.globalData.shopTypeData = shopData;
  },
  getShopTypeData: function() {
    if (JSON.stringify(this.globalData.shopTypeData) == '{}') {
      return this.checkIsSubOrParentShop();
    }
    return this.globalData.shopTypeData;
  },
  isTabBarPage: function (pageRoute) {
    pageRoute = pageRoute || this.getAppCurrentPage().route;
    if(!/^\//.test(pageRoute)){
      pageRoute = '/' + pageRoute;
    }
    if (this.globalData.tabBarPageRouterMap === undefined) {
      this.globalData.tabBarPageRouterMap = this.getTabPagePathArr();
    }
    return this.globalData.tabBarPageRouterMap.indexOf(pageRoute) > -1;
  },
  setEcLocationId: function (locationId) {
    let that = this;
    let rootAppId = this.getAppId();
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppEcommerce/GetEcLocationById',
      data: {
        data_id: locationId
      },
      success: function (res) {
        if (res.data && res.data.app_id !== rootAppId) {
          !that.globalData[res.data.app_id] && (that.globalData[res.data.app_id] = {});
          that.globalData[res.data.app_id].ec_location_id = locationId;
        }else {
          that.globalData.ec_location_id = locationId;
          let subAppData = res.data['sub_app_data'];
          if (subAppData) {
            let subShops = (subAppData && subAppData['extra']['location']) || [];
            if (subShops.length || subAppData['extra']['choose'] === 1) { // choose为1表示全部子店适用
              that.globalData.commonEcLocationId = locationId;
            }
          }
        }
      }
    })
  },
  stringLengthComment :function(str) {
    let realLength = 0, len = str.length, charCode = -1;
    for (let i = 0; i < len; i++) {
      charCode = str.charCodeAt(i);
      if(charCode > 128){
        realLength += 2;
      }else{
        realLength +=1;
      }
    }
    return realLength;
  },
  subStringComment : function(str, len) {
    let newLength = 0 ,
      newStr = "" ,
      chineseRegex = /[^\x00-\xff]/g ,
      singleChar = "",
      strLength = str.replace(chineseRegex,"**").length;
    for(let i = 0;i < strLength;i++) {
      singleChar = str.charAt(i).toString();
      if(singleChar.match(chineseRegex) != null) {
        newLength += 2;
      }else {
        newLength++;
      }
      if(newLength > len) {
        break;
      }
      newStr += singleChar;
    }
    if(strLength > len) {
      newStr += "...";
    }
    return newStr;
  },
  getParentAppId: function(subAppId) {
    return new Promise((resolve, reject) => {
      this.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppShopManage/GetParentAppId',
        data: {
          app_id: subAppId,
        },
        success: function (res) {
          let parentAppId = res.data && res.data.parent_app_id;
          resolve(parentAppId);
        },
        fail: reject
      });
    });
  },
  saveUserFormId(param) {
    if (param && param.form_id[0] != 'the formId is a mock one'){
      var _this = this;
      _this.sendRequest({
        hideLoading: true,
        url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
        method: 'post',
        data: param,
        complete: function () {
        }
      })
    }
  },
  changeFranchiseScore: function(str) {
    var arr = str.split(".");
    if (arr[1] && arr[1] <= 5){
      return Number(arr[0]) + 0.5;
    } else if (arr[1] && arr[1] > 5){
      return Number(arr[0]) + 1;
    } else {
      return Number(arr[0]);
    }
  },
  toTradeGoodsDetail: function (param) {
    let { goodsId, franchiseeId } = param;
    let pagePath = '/tradeApt/pages/TYDetail/TYDetail?detail=' + goodsId + '&franchisee=' + franchiseeId;
    this.turnToPage(pagePath)
  },
  requestSubscribeMessage:function(param){
    let that = this;
    return new Promise ((resolve, reject)=> {
      that.sendRequest({
        hideLoading: true,
        url: '/index.php?r=api/AppMsgTpl/GetSubMsg',
        data: {
          config: param
        },
        method: 'post',
        success: function (res) {
          if (res.data.length) {
            let template_ids = res.data.map(item=> {
              return item.template_id;
            })
            let form_data = res.data.map((item, index)=> {
              return {
                template_id: item.template_id,
                type: item.type,
                obj_id: param[index]['obj_id'] || '',
              }
            })
            wx.requestSubscribeMessage({
              tmplIds: template_ids,
              success(wxRes) {
                for (let i = form_data.length - 1; i >= 0; i--) {
                  let data = form_data[i];
                  if (wxRes[data.template_id] == 'accept') {
                    data.status = wxRes[data.template_id];
                  }else {
                    form_data.splice(i, 1);
                  }
                }
                that.submitMessage(form_data);
                resolve();
              },
              fail(wxRes){
                that.showModal({
                  content: wxRes.errMsg
                })
                reject();
              }
            })
          }else {
            resolve();
          }
        }
      })
    })
  },
  submitMessage: function (form_data){
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=api/AppMsgTpl/saveSubMsg',
      data: {
        form_data:form_data,
      },
      method: 'post',
      success: function (res) {
        if (res.data) {
          console.log(res);
        }
      }
    })
  },
  toTradeGoodsDetail: function (param) {
    let { goodsId, franchiseeId } = param;
    let pagePath = '/tradeApt/pages/TYDetail/TYDetail?detail=' + goodsId + '&franchisee=' + franchiseeId;
    this.turnToPage(pagePath)
  },
  addToWxCard: function(wxcouponId,userCouponId,param) {
    if (!wxcouponId || !userCouponId) return;
    let that = this;
    that.sendRequest({
      url: '/index.php?r=appWeChatCoupon/getSignature',
      data: {
        card_id: wxcouponId
      },
      success: function (res) {
        wx.addCard({
          cardList: [{
            cardId: wxcouponId,
            cardExt: '{"nonce_str":"' + res.data.timestamp + '","timestamp":"' + res.data.timestamp + '", "signature":"' + res.data.signature + '"}'
          }],
          success: function (res) {
            that.sendRequest({
              hideLoading: true,
              url: '/index.php?r=appWeChatCoupon/RecvAndBindZCCoupon',
              data: {
                code: res.cardList[0].code,
                card_id: res.cardList[0].cardId,
                zc_user_coupon_id: userCouponId
              },
              success: function (res) {
                typeof param.success === 'function' && param.success(res);
              },
              fail: res=> {
                typeof param.fail === 'function' && param.fail(res);
              }
            });
          }
        })
      }
    });
  },
  getLockInfo: function () {
    let that = this;
    that.sendRequest({
      url: '/index.php?r=AppShopManage/getParentConfigData',
      method: 'post',
      success: function (res) {
        if (res.status === 0 && res.data) {
          let lockInfo = res.data.config_data && res.data.config_data.clockList || {};
          that.globalData.shareNeedLock = JSON.parse(lockInfo.share || 'false');
          that.globalData.scanNeedLock = JSON.parse(lockInfo.scan || 'false');
        }
      }
    })
  },
  couponChangeStore: function (options) {
    let that = this;
    let headquartersId = this.globalData.appId;
    let home = this.getHomepageRouter();
    let s_his_data = options.s_his_data;
    let appId = options.appId;  // 子店或总店id
    let isLock = that.globalData.chainHasLock;   // 开启连锁扫码或分享锁定则不能切换门店（优惠券）
    if (appId != headquartersId && that.globalData.historyDataId === s_his_data.online_his_id && !isLock) {
      that.globalData.chainAppId = appId;
      that.globalData.chainHistoryDataId = s_his_data.his_id;
      that.globalData.indexPageRefresh = true;
      that.globalData.chainNotLoading = false;
      that.setStorage({
        key: 'chainStore',
        data: {
          app_id: appId,
          his_id: s_his_data.his_id
        }
      });
    } else if (!isLock) {  
      that.globalData.chainAppId = '';
      that.globalData.chainHistoryDataId = '';
      that.globalData.indexPageRefresh = true;
      that.globalData.chainNotLoading = false;
      that.removeStorage({
        key: 'chainStore',
        success: function(){
          if (s_his_data.online_his_id && that.globalData.historyDataId !== s_his_data.online_his_id) {
            that.showModal({
              title: '提示',
              content: '连锁子店版本与线上版本不一致，将回到总店',
              confirm: function () {
                that.reLaunch({
                  url: '/pages/' + home + '/' + home
                })
              }
            });
            return;
          }
          that.reLaunch({
            url: '/pages/' + home + '/' + home
          })
        }
      });
      return;
    }
    that.reLaunch({
      url: '/pages/' + home + '/' + home
    })
  },
  getGoodsLimit: function (goodsId, franchiseeId) {
    let _this = this;
    return new Promise((resolve, reject) => {
      _this.sendRequest({
        url: '/index.php?r=AppEcGoodsLimit/GetGoodsLimit',
        method: 'get',
        data: {
          goods_id: goodsId,
          sub_app_id: franchiseeId || ''
        },
        success: function (res) {
          resolve(res.data);
        },
        fail: function(res) {
          reject(res.data);
        }
      });
    });
  },
  requestSingleData: function (pageInstance, customFeature, compid, field, param) {
    let _this = this;
    _this.getReviewConfig(reviewList => {
      _this.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppData/GetDatasByUserToken',
        data: { 
          form: param.form,
          page: param.page,
          page_size: customFeature.loadingNum || 10
        },
        method: 'post',
        success: function (res) {
          if (res.status == 0) {
            let newdata = {};
            if (param.form !== 'form') {
              for (let j in res.data) {
                if (customFeature.form == 'group_buy') {
                  res.data[j] = {
                    form_data: Object.assign({}, res.data[j])
                  }
                }
                for (let k in res.data[j].form_data) {
                  if (k == 'review_status') {
                    res.data[j].form_data[k] = res.data[j].form_data[k] == 0 ? reviewList.applying_text || '待审核' : res.data[j].form_data[k] == 1 ? reviewList.apply_passed_text || '审核通过' : reviewList.apply_unpassed_text || '审核不通过'
                  }
                  if (k == 'review_result') {
                    res.data[j].form_data[k] = res.data[j].form_data[k].replace(/\\n/, '');
                  }
                  if (k == 'category') {
                    continue;
                  }
                  if (/region/.test(k)) {
                    continue;
                  }
                  if (k == 'goods_model') {
                    res.data[j].form_data.virtual_price = _this.formVirtualPrice(res.data[j].form_data);
                  }
                  if (k == 'distance') {
                    res.data[j].form_data[k] = util.formatDistance(res.data[j].form_data[k]);
                  }
                  let description = res.data[j].form_data[k];
                  if (field.indexOf(k) < 0 && /<("[^"]*"|'[^']*'|[^'">])*>/.test(description)) { //没有绑定的字段的富文本置为空
                    res.data[j].form_data[k] = '';
                  } else if (_this.needParseRichText(description)) {
                    res.data[j].form_data[k] = _this.getWxParseResult(description);
                  }
                }
              }
            }
            newdata[compid + '.list_data'] = res.data;
            newdata[compid + '.is_more'] = res.is_more || 0;
            newdata[compid + '.curpage'] = 1;
            newdata[compid + '.loading'] = false;
            newdata[compid + '.loadingFail'] = false;
            pageInstance.setData(newdata);
          }
        },
        fail: function (res) {
          let newdata = {};
          newdata[compid + '.loadingFail'] = true;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        }
      })
    })
  },
  getReviewConfig: function(callBack) {
    this.sendRequest({
      url: '/index.php?r=AppConfig/GetAppDataReviewTextConfig',
      hideLoading: true,
      method: 'post',
      hideLoading: true,
      success: res=> {
        callBack && callBack(res.data);
      }
    })
  },
  getShareQuery: function(query, dataId) {
    let arr = [];
    let pageInstance = this.getAppCurrentPage();
    let pageParam = {
      "detail": pageInstance.dataId,
      "p_id": this.globalData.p_id,
      "c_id": this.globalData.hasFranchiseeTrade && !this.globalData.chainAppId ? this.globalData.appId : this.globalData.chainAppId,
      "vcard_user_id": this.globalData.HasCardToShareUserId,
      "franchisee": pageInstance.franchiseeId,
      "fmode": pageInstance.options.fmode,
      "uuid": ''
    };
    for (let i in pageParam) {
      if (pageParam[i]) {
        arr.push(i + '=' + pageParam[i])
      }
    }
    for (let i in query) {
      if (query[i]) {
        arr.push(i + '=' + query[i])
      }
    }
    console.log(arr.join('&'))
    return arr.join('&');
  },
  getPriceBreakDiscountActivity: function() {
    this.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppMarketing/GetPriceBreakDiscountActivity',
      success: res => {
        if (res.status == 0) {
          this.globalData.priceBreakDiscountData = res.data || [];
        }
      },
      fail: err => {
        console.log(err);
      }
    })
  },
  getVipListData: function() {
    return new Promise((resolve, reject) => {
      if (this.globalData.curVipCardIdArr && this.globalData.curVipCardIdArr.length) {
        resolve(this.globalData.curVipCardIdArr);
        return;
      }
      this.sendRequest({
        hideLoading: true,
        url: '/index.php?r=appVipCard/getUserAccountSurvey',
        method: 'post',
        success: res => {
          if (res.status === 0) {
            this.globalData.vipList = res.data.all_vip_card;
            let curVipCardIdArr = [];
            if(res.data.user_paid_vip_card && res.data.user_paid_vip_card.vip_id){
              curVipCardIdArr.push(res.data.user_paid_vip_card.vip_id)
            }
            if(res.data.user_vip_card && res.data.user_vip_card.vip_id){
              curVipCardIdArr.push(res.data.user_vip_card.vip_id)
            }
            this.globalData.curVipCardIdArr = curVipCardIdArr;
            resolve(curVipCardIdArr);
          } else {
            reject(0);
          }
        }
      });
    })
  },
    subPackagePages: {"customPackage1":["page10042","page10056","page10060"],"customPackage2":["page10097","page10055","page10059","page10061"]},
    globalData:{
    appId: 'Bp0DwZJPVQ',
    historyDataId: '135450',
        tabBarPagePathArr: '["/pages/page10063/page10063","/pages/page10096/page10096","/pages/tabbarShoppingCart/tabbarShoppingCart","/pages/userCenterComponentPage/userCenterComponentPage"]',
        drinkVerticalList: '',
    homepageRouter: 'page10063',
    tgroup: 'master',
    packTime: '1605762972',   //Backup 环境相关功能 是否回滚
    formData: null,
    userInfo: {},
    systemInfo: null,
    sessionKey: '',
    notBindXcxAppId: false,
    waimaiTotalNum: 0,
    waimaiTotalPrice: 0,
    takeoutLocate:{},
    takeoutRefresh : false,
    isLogin: false,
    locationInfo: {
      latitude: '',
      longitude: '',
      address: '',
      info: {}
    },
    getDistributionInfo: '',
    getDistributorInfo: '',
    PromotionUserToken: '',
    previewGoodsOrderGoodsInfo: [],  // 有补充信息的商品：数组格式和后台接口（订单详情等接口）返回的goods_info字段一样
    goodsAdditionalInfo: {},   // 商品id为key : { title: 补充信息标题str, type: 字段类型 str(text/mul-text/picture), is_hidden: 字段是否展示（1 or 0） , value: 字段值（str or []）}
    urlLocationId:'',
    turnToPageFlag: false,
    wxParseOldPattern: '_listVesselRichText_',
    cdnUrl: 'http://cdn.jisuapp.cn',
    defaultPhoto: 'http://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/default_photo.png',
    siteBaseUrl: 'https://xcx.zhichiweiye.com', //这里不要写死
    userDomain: 'https://u2231385.jisuwebapp.com', // 用户子域名
    appTitle: '大小事服务',
    appDescription: '我的应用',
    appLogo: 'http://img.zhichiwangluo.com/zcimgdir/album/file_5a899897316fd.jpg',
    p_u: '', //扫描二维码进入小程序所带参数代理商的user-token
    hasFranchiseeList: '1' == '1' ? true : false, //是否有多商家列表
    hasFranchiseeChain: '0' == '1' ? true : false, // 是否有多商家连锁组件
    hasFranchiseeTrade: '0' == '1' ? true : false, // 是否有多商家商圈组件
    canIUseOfficialAccount: wx.canIUse('official-account'),//微信基础库是否能使用关注公众号组件
    hasTopicCom: false,
    pageScrollTop: 0,
    topicRefresh: false,
    kbHeight: '',
    goodsStoreConfig: '',
    goodsfranchiseeStoreConfig: {},
    susTopicsMap: {}, // 有悬浮窗话题列表地图
    needRefreshPages: [], // 需要刷新的页面
    newCountDataOnPage: {}, // 页面计数数据
    tabbarInfo:{},//子店底部导航信息
    appScene: '',  //小程序场景值
    urlOptions: '',  //页面跳转储存页面路径
    shopTypeData: {}, // 当前app_id角色
    showGetUserInfoOptions: []
  },
    })
var customComponent = {
  'carousel': require('/segments/carousel/carousel.js'),
'suspension': require('/segments/suspension/suspension.js'),
'popup-window': require('/segments/popup-window/popup-window.js'),
'list-vessel': require('/segments/list-vessel/list-vessel.js'),
'goods-list': require('/segments/goods-list/goods-list.js'),
'franchisee-list': require('/segments/franchisee-list/franchisee-list.js'),
'user-center': require('/segments/user-center/user-center.js'),
}
getApp().customComponent = customComponent;