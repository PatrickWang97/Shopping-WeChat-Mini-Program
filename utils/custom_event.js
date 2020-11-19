var app = '';
var tapPluginLinkLoading = false;
setTimeout(function(){
  app = getApp();
}, 100);
var clickEventHandler = {
  "goods-trade": function(param, franchisee) {
    let gtype = param['goods-type'] || param['goods_type'];
    let id = param['goods-id'] || param['goods_id'];
    if(!id){
      return;
    }
    franchisee = param['parent_app_id'] && param['parent_app_id'] !== param['app_id'] && param['app_id'] || franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    if (gtype == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + queryStr);
    } if (gtype == 10) {
      if (param.unit == 3) {
        app.turnToPage('/tradeApt/pages/hotel/hotel?contact=' + id + queryStr);
      } else {
        app.turnToPage('/tradeApt/pages/TYDetail/TYDetail?detail=' + id + queryStr);
      }
    } else {
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + queryStr);
    }
  },
  "to-seckill": function (param, franchisee) {
    let id = param['seckill-id'] || param['seckill_id'];
    let seckill_activity_id = param['seckill-activity-id'] ? param['seckill-activity-id']:0;
    let seckill_activity_time_id = param['seckill-activity-time-id'] ? param['seckill-activity-time-id']:0;
    let seckillType = seckill_activity_id !=0?1:0;
    if (!id) {
      return;
    }
    franchisee = param['parent_app_id'] && param['parent_app_id'] !== param['app_id'] && param['app_id'] || franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    app.turnToPage('/seckill/pages/seckillDetail/seckillDetail?id=' + id + queryStr + '&sec_act_id=' + seckill_activity_id + '&sec_t_id=' + seckill_activity_time_id + '&secType=' + seckillType);
  },
  "inner-link": function (param, franchisee) {
    let pageLink = param['inner-page-link'] || param['page-link'] || param['inner_page_link'];
    let url = '';
    let pageInstance = app.getAppCurrentPage();
    if (pageLink == undefined) {
      app.turnBack();
    } else if (app.pageRoot[pageLink]){
      url = app.pageRoot[pageLink];
      franchisee = pageLink == 'groupCenter' ? (franchisee || app.getPageFranchiseeId() || '') : '';
    } else if (pageLink === 'home') {
      const homeLink = app.getHomepageRouter()
      url = `/pages/${homeLink}/${homeLink}`;
    } else if (pageInstance.franchiseeId && !/userCenterComponentPage/.test(pageInstance.route)) {
      franchisee = pageInstance.franchiseeId;
      url = '/franchisee/pages/' + pageLink + '/' + pageLink;
    }else{
      url = '/pages/' + pageLink + '/' + pageLink;
    }
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    if (url.indexOf('/prePage/') >= 0) {
      app.turnBack();
    } else{
      let is_redirect = param.is_redirect == 1 ? true : false;
      let pageRouter = app.getAppCurrentPage().page_router;
      if (pageRouter == app.globalData.homepageRouter || app.getTabPagePathArr().indexOf(url) !== -1) {
        is_redirect = false;
      }
      app.turnToPage(url + queryStr, is_redirect);
    }
  },
  "group-buy": function(param,franchisee){
    let goods_id = param['goods-id'] || param['goods_id'];
    let activity_id = param['active-id'] || param['active_id'];
    franchisee = param['parent_app_id'] && param['parent_app_id'] !== param['app_id'] && param['app_id'] || franchisee || app.getPageFranchiseeId() || '';
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    let goodsType = param['goods_type']
    if(goods_id){
      if(goodsType == 10){
        app.turnToPage(`/tradeApt/pages/TYDetail/TYDetail?detail=${goods_id}&activeType=group&activeId=${activity_id}${chainParam}`);
        return
      }
      app.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + goods_id + '&activity_id=' + activity_id + chainParam);
    }
  },
  "presell": function (param, franchisee) {
    let goods_id = param['goods-id'] || param['goods_id'];
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    if (goods_id) {
      app.turnToPage('/presell/pages/presellDetail/presellDetail?detail=' + goods_id + chainParam);
    }
  },
  "call": function (param, franchisee, event) {
    if (param && param.phoneNumberSource === 'dynamic') {
      let dataset = event.currentTarget.dataset;
      let phone_num = dataset.realValue ? dataset.realValue[0].text : '';
      if (phone_num === '') {
        return;
      }
      app.makePhoneCall(phone_num);
      return;
    }
    let phone_num = param['phone-num'] || param['phone_num'];
    app.makePhoneCall(phone_num);
  },
  "get-coupon": function (param, franchisee) {
    let coupon_id = param['coupon-id'] || param['coupon_id'];
    let recv_type = param['recv_type'];
    if(!coupon_id){
      return;
    }
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    queryStr += recv_type ? '&recv_type=' + recv_type : '';
    app.turnToPage('/pages/couponDetail/couponDetail?detail=' + coupon_id + queryStr);
  },
  "community": function (param, franchisee) {
    let community_id = param['community-id'] || param['community_id'];
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    app.turnToPage('/informationManagement/pages/communityPage/communityPage?detail=' + community_id + queryStr)
  },
  "franchisee-enter": function(param, franchisee){
    app.turnToPage('/franchisee/pages/franchiseeEnter/franchiseeEnter');
  },
  "franchisee-cooperation" : function(param, franchisee) {
    app.turnToPage('/franchisee/pages/franchiseeCooperation/franchiseeCooperation');
  },
  "to-franchisee": function (param, franchisee) {
    let franchisee_id = param['franchisee-id'] || param['franchisee_id'];
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: {
        sub_shop_app_id: franchisee_id
      },
      success: function (res) {
        if (res.status === 0 && Array.isArray(res.data) && res.data[0]) {
          let shopInfo = res.data[0];
          let subAppBar = shopInfo.sub_app_bar;
          let appid = franchisee_id;
          let audit = shopInfo.is_audit;
          let mode = shopInfo.mode_id;
          let id = shopInfo.id;
          let newmode = subAppBar.mode_id || '';
          let pageLink = subAppBar['homepage-router'] || '';
          let param = {};
          param.detail = appid;
          if (audit == 2) {
            param.shop_id = id;
          }
          if (pageLink) {
            mode = newmode;
            switch (pageLink.trim()) {
              case 'franchiseeWaimai':
                app.goToFranchisee(1, param);
                return;
              case 'franchiseeTostore':
                app.goToFranchisee(3, param);
                return;
              case 'franchiseeDetail4':
                app.goToFranchisee(2, param);
                return;
              case 'franchiseeDetail':
                app.goToFranchisee(0, param);
                return;
              default:
                break;
            }
            let url = '';
            if (app.pageRoot[pageLink]) {
              url = app.pageRoot[pageLink];
            } else if (franchisee_id) {
              url = '/franchisee/pages/' + pageLink + '/' + pageLink;
            }
            let queryStr = franchisee_id ? '?franchisee=' + franchisee_id + '&fmode=' + mode : '';
            app.turnToPage(url + queryStr);
            return;
          }
          app.goToFranchisee(mode, param);
        }
        else {
          app.showModal({
            content: '获取子店信息失败'
          });
        }
      },
      fail: function () {
        app.showModal({
          content: '获取子店信息失败'
        });
      }
    });
  },
  "to-promotion": function (param, franchisee) {
    app._isOpenPromotion();
  },
  "to-group-center": function (param, franchisee) {
    app._isOpenCommunityGroupCenter(true);
  },
  "coupon-receive-list": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/couponReceiveListPage/couponReceiveListPage');
  },
  "recharge": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/recharge/recharge');
  },
  "lucky-wheel": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/awardManagement/pages/luckyWheelDetail/luckyWheelDetail' + queryStr);
  },
  "golden-eggs": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/awardManagement/pages/goldenEggs/goldenEggs' + queryStr );
  },
  "scratch-card": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/awardManagement/pages/scratch/scratch' + queryStr);
  },
  "collect-stars": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/awardManagement/pages/collectStars/collectStars' + queryStr);
  },
  "video": function (param, franchisee) {
    let video_id = param['video-id'];
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    app.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + video_id + queryStr);
  },
  "video-detail": function (param, franchisee) {
    let video_id = param['video_id'] || param['video-id'];
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    app.turnToPage('/video/pages/videoDetail/videoDetail?detail=' + video_id + queryStr);
  },
  "video-play": function (param, franchisee) {
    let pageInstance = app.getAppCurrentPage(),
        compid = param.compid,
        video_id = param['video-id'];
    app.sendRequest({
      url: '/index.php?r=AppVideo/GetVideoLibURL',
      method: 'get',
      data: { id: video_id },
      success: function (res) {
        let newdata = {}
        newdata[compid + '.videoUrl'] = res.data;
        newdata[compid + '.carouselVideoTop'] = pageInstance.data.page_hasNavBar ? app.globalData.topNavBarHeight : 0;
        pageInstance.setData(newdata);
      }
    })
  },
  "transfer": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/eCommerce/pages/transferPage/transferPage' + queryStr);
  },
  "turn-to-xcx": function (param, franchisee) {
    app.navigateToXcx({
      appId: param['xcx-appid'] || param['xcx_appid'],
      path: param['xcx-page-url'] || param['xcx_page_url'] || ''
    });
  },
  "wifi": function (param, franchisee) {
    let system = app.getSystemInfoData().system;
    app.startWifi({
      success: function (res) {
        if (/ios/i.test(system)) {
          wx.showLoading({
            title: '连接中'
          })
        }
        console.log('wifi connectWifi');
        app.addLog('wifi connectWifi');
        app.connectWifi({
          SSID: param.wifi['wifi-name'],
          BSSID: param.wifi['wifi-address'],
          password: param.wifi['wifi-password'],
          success: function (res) {
            app.addLog(res);
            setTimeout(function () {
              app.showToast({
                title: '连接成功',
                icon: 'success',
                duration: 3000
              });
            }, 1000)
          },
          fail: function (res) {
            console.log(res);
            app.addLog(res);
            if (res.errCode) {
              app.showModal({
                content: app.wifiErrCode(res.errCode)
              })
            } else if (res.errMsg == 'connectWifi:fail the api is only supported in iOS 11 or above') {
              app.showModal({
                content: '连接WiFi功能，仅Android 与 iOS 11 以上版本支持'
              })
            } else if (/connectWifi:fail/.test(res.errMsg)) {
              app.showModal({
                content: res.errMsg
              })
            }
          },
          complete: function (res) {
            wx.hideLoading();
          }
        })
      },
      fail: function (res) {
        app.showModal({
          content: res.errMsg
        })
      }
    })
  },
  "plugin-link": function (param, franchisee) {
    if (tapPluginLinkLoading) {
      return;
    }
    tapPluginLinkLoading = true;
    app.sendRequest({
      url: '/index.php?r=pc/OpenPlugin/GetPluginInfo',
      data: {
        'plugin_name': param['plugin-name']
      },
      success: function (res) {
        let page = res.data.plugin_home_page;
        let tabBarPagePathArr = app.getTabPagePathArr();
        let curl = `/pages/tabbarPlugin${res.data.plugin_name}/tabbarPlugin${res.data.plugin_name}`;
        if (tabBarPagePathArr.indexOf(curl) != -1) {
          app.switchToTab(curl);
          return;
        }
        app.turnToPage('/' + res.data.package_root + '/' + res.data.plugin_name + '/pages/' + page + '/' + page);
      },
      complete: function () {
        tapPluginLinkLoading = false;
      }
    });
  },
  "topic": function (param, franchisee) {
    let topic_id = param['topic-id'] || param['topic_id'];
    if (!topic_id) {
      return;
    }
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    app.turnToPage('/informationManagement/pages/communityDetail/communityDetail?detail=' + topic_id + queryStr);
  },
  "news": function (param, franchisee) {
    let news_id = param['news-id'] || param['news_id'];
    if (!news_id) {
      return;
    }
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '&franchisee=' + franchisee : '';
    app.turnToPage('/informationManagement/pages/newsDetail/newsDetail?detail=' + news_id + queryStr);
  },
  "page-share": function (param, franchisee) {
    let pageInstance = app.getAppCurrentPage();
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    let queryStr = '';
    for (let i in pageInstance.sharePageParams) {
      queryStr += '&' + i + '=' + pageInstance.sharePageParams[i]
    }
    let router = pageInstance.route.split('/')[2];
    let objId = router == 'newsDetail' ? pageInstance.options.detail : router;
    let shareType = router == 'newsDetail' ? 17 : 11;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/DistributionShareQRCode',
      data: {
        obj_id: objId,
        type: shareType,
        text: param.pageShareCustomText,
        goods_img: param.pageShareImgUrl,
        params: queryStr,
        p_id: app.globalData.p_id
      },
      success: function (res) {
        animation.bottom("0").step();
        pageInstance.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
  },
  "wx-coupon": function (param, franchisee) {
    let wxcouponId = param['wxcoupon-id'] || param['wxcoupon_id'];
    app.sendRequest({
      url: '/index.php?r=appWeChatCoupon/getSignature',
      data: {
        card_id: wxcouponId
      },
      success: function (res) {
        wx.addCard({
          cardList: [
            {
              cardId: wxcouponId,
              cardExt: '{"nonce_str":"' + res.data.timestamp + '","timestamp":"' + res.data.timestamp + '", "signature":"' + res.data.signature + '"}'
            }
          ],
          success: function (res) {
            app.sendRequest({
              url: '/index.php?r=appWeChatCoupon/recvCoupon',
              data: {
                code: res.cardList[0].code,
                card_id: res.cardList[0].cardId
              },
              success: function (res) {
                app.showModal({
                  content: '领取卡券成功'
                })
              }
            });
          }
        })
      }
    });
  },
  "vip-card-list": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/userCenter/pages/vipCardList/vipCardList' + queryStr);
  },
  "goods-foot-print": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/goodsFootPrint/goodsFootPrint');
  },
  "goods-favorites": function (param, franchisee) {
    app.turnToPage('/eCommerce/pages/goodsFavorites/goodsFavorites');
  },
  "vip-interests":  function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    if (param['vip-id']) {
      if (queryStr == '') {
        queryStr = '?id=' + param['vip-id'];
      } else {
        queryStr = queryStr + '&id=' + param['vip-id'];
      }
    }
    if (param['league-vip'] == 1) {
      app.turnToPage('/eCommerce/pages/leagueVipAdvertise/leagueVipAdvertise' + queryStr);
      return;
    }
    queryStr = queryStr + '&is_paid_card=' + param['vip-type'];
    app.turnToPage('/eCommerce/pages/vipBenefits/vipBenefits' + queryStr);
  },
  "goods-scan-code": function(){
    let path = '/eCommerce/pages/shoppingCart/shoppingCart?goodsScanCode=true';
    app.getAppECStoreConfig((res) => {
      if (res.cart_config.shopping_by_scanning_code == 1) {
        app.turnToPage(path);
      } else {
        app.showModal({
          content: '暂未开通扫码购'
        })
      }
    })
  },
  "preview-picture": function (param, franchisee, event){
    let dataset = event.currentTarget.dataset;
    let urls = dataset.imgarr instanceof Array ? dataset.imgarr : [dataset.imgarr];
    if (!dataset.imgarr && !dataset.img){
      return;
    }
    app.previewImage({
      current: dataset.img || urls[0],
      urls: urls,
    });
  },
  "popup-window-control": function (param){
    let pageInstance = app.getAppCurrentPage();
    let windowControl = param.windowControl;
    let newData = {};
    let windowCompId, windowCustomFeature;
    if (windowControl.popupWindowId == 'vip_card_qr_window'){
      let vipCardQrCode = {
        vipCardQrCodeShow:true,
        firstShow: windowControl.firstShow,
        componentType:'general'
      }
      pageInstance.selectComponent('#vip-card-qr-code').showDialog(vipCardQrCode);
      return
    }
    for (let windowConfig of pageInstance.popupWindowComps) {
      if (windowConfig.id === windowControl.popupWindowId) {
        windowCompId = windowConfig.compid;
        windowCustomFeature = pageInstance.data[windowCompId].customFeature;
      }
    }
    if (windowControl.action === 'show') {
      newData[windowCompId + '.showPopupWindow'] = true;
    } else if (windowControl.action === 'hide') {
      newData[windowCompId + '.showPopupWindow'] = false;
    }
    pageInstance.setData(newData);
    if (windowCustomFeature && windowCustomFeature.autoClose === true) {
      setTimeout(() => {
        newData[windowCompId + '.showPopupWindow'] = false;
        pageInstance.setData(newData);
      }, +windowCustomFeature.closeDelay * 1000);
    }
  },
  "sidebar-control": function (param){
    let pageInstance = app.getAppCurrentPage();
    let sidebarControl = param.sidebarControl;
    let newData = {};
    let sidebarCompId;
    for (let sidebarConfig of pageInstance.sidebarComps) {
      let sidebarCustomFeature = pageInstance.data[sidebarConfig.compid].customFeature
      if (sidebarCustomFeature.id === sidebarControl.sidebarId) {
        sidebarCompId = sidebarConfig.compid;
      }
    }
    if (sidebarControl.action === 'show') {
      newData[sidebarCompId + '.showSidebar'] = true;
    } else if (sidebarControl.action === 'hide') {
      newData[sidebarCompId + '.hideSidebar'] = true;
    }
    pageInstance.setData(newData);
  },
  "refresh-list": function (param, franchisee){
    app.tapRefreshListHandler(null, {
      refresh_object: param.refresh_object,
      index_segment: param.index_segment,
      index_value: param.index_value
    });
  },
  "search": function (param, franchisee, event) {
    let pageInstance = app.getAppCurrentPage();
    let listId = param.search.listId;
    let data = pageInstance.data;
    let searchCompid = '';
    let is_integral = 5; //所有积分商品和非抵扣商品
    for (let i in data) {
      if (data[i].customFeature && listId == data[i].customFeature.id) {
        searchCompid = data[i].compId;
        is_integral = data[i].param.is_integral;
        break;
      }
    }
    if (param.bindType) {
      let paramstr = '';
      if (param.controlCheck) {
        is_integral = 3
      } else {
        if (param.isIntegral) {
          is_integral = 1
        } else {
          is_integral = 5
        }
      }
      paramstr = '?integral=' + is_integral;
      paramstr = paramstr + '&isHideStock=' + param.isHideStock
        + '&quickTags=' + param.quickTags
        + '&isHideSales=' + param.isHideSales
        + '&isShowVirtualPrice=' + param.isShowVirtualPrice
        + '&isShoppingCart=' + param.isShoppingCart
        + '&isBuyNow=' + param.isBuyNow
        + '&bindType=' + param.bindType;
      if (param.industry) paramstr += '&industry=' + JSON.stringify(param.industry)  // 行业预约模板信息
      if (param.editObject) paramstr += '&searchConf=' + JSON.stringify(param.editObject) // 搜索结果页设置
      if (param.keycodemeta || param.keyCodeMeta) paramstr += '&keyCodeMeta=' + (param.keycodemeta || param.keyCodeMeta)  // 开启联想
      if (param.hotsearch || param.hotSearch) paramstr += '&hotSearch=' + (param.hotsearch || param.hotSearch)  // 显示热门搜索项
      if (param.quickTags) paramstr += '&quickTags=' + param.quickTags; // 推荐搜索
      if (param.hasQuickTags) paramstr += '&hasQuickTags=' + param.hasQuickTags; // 相关推荐
      app.turnToPage('/default/pages/advanceSearch/advanceSearch' + paramstr);
      return
    }
    if (searchCompid) {
      let searchCompData = pageInstance.data[searchCompid];
      if (searchCompData.type == 'goods-list') {
        var param = `form=${searchCompData.customFeature.form}&isHideStock=false&isHideSales=true&isShowVirtualPrice=true&isShoppingCart=false&isBuyNow=false&industry={}&searchConf={"comprehensive":false,"information":false,"community":false,"commodity":true,"goods":{"showTag":true,"showSales":true,"showVirtualPrice":true,"showCartIcon":true,"showSeniorSetting":true,"showBuyCount":true,"cartIcon":"addshoppingcart1","pickUpType":[{"label":"快递","value":"快递","checked":true},{"label":"自提","value":"自提","checked":true},{"label":"配送","value":"配送","checked":true},{"label":"堂食","value":"堂食","checked":true}],"goodsType":[{"id":0,"title":"电商","checked":true},{"id":1,"title":"到店","checked":false},{"id":2,"title":"预约","checked":false},{"id":3,"title":"拼团","checked":false},{"id":4,"title":"秒杀","checked":false},{"id":5,"title":"行业预约","checked":false},{"id":6,"title":"预售","checked":false},{"id":7,"title":"积分商城","checked":false}]}}`;
        app.turnToPage(`/default/pages/advanceSearch/advanceSearch?${param}&searchList=1&integral=${is_integral}&bindType=`);
      }else{
        app.showModal({
          content: '搜索的点击事件只能关联电商、到店、预约列表'
        })
        return;
      }
    } else {
      app.showModal({
        content: '找不到搜索关联的列表'
      })
    }
  },
  "top": function (param){
    app.pageScrollTo(0);
  },
  "click-event": function (param, franchisee) {
    let lookLink = param && param['look-link'];
    let queryStr = '';
    if (lookLink.indexOf("?") != -1) {
      queryStr = franchisee ? '&franchisee=' + franchisee : '';
    } else {
      queryStr = franchisee ? '?franchisee=' + franchisee : '';
    }
    app.turnToPage(lookLink + queryStr);
  },
  "wx-vip-card": function (param){
    let cardId = param['card-id'] ||  param['card_id'];
    let id = param['wx-vip-card-id'] || param['wx_vip_card_id'];
    if (cardId){
      app.sendRequest({
        url: '/index.php?r=appWeChatCoupon/getSignature',
        data: {
          card_id: cardId
        },
        success: function (res) {
          wx.addCard({
            cardList: [
              {
                cardId: cardId,
                cardExt: '{"nonce_str":"' + res.data.timestamp + '","timestamp":"' + res.data.timestamp + '", "signature":"' + res.data.signature + '"}'
              }
            ],
            success: function (res) {
              console.log(res);
              app.showModal({
                content: '领取成功'
              });
            }
          })
        }
      });
    }
  },
  "differential-mall": function (param, franchisee) {
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/differentialMall/pages/dMWebView/dMWebView' + queryStr);
  },
  "shopping-card": function (param) {
    let id = param['shopping-card-id'];
    app.turnToPage('/shoppingCard/pages/shoppingCardDetail/shoppingCardDetail?id=' + id);
  },
  "gift-card": function (param) {
    let id = param['gift-card-id'];
    app.turnToPage('/giftCard/pages/giftCardDetail/giftCardDetail?id=' + id);
  },
  'goods-classify': function (form, franchiseeId) {
    let type = 'goods';
    if (form.goods_type == 0) {
      type = 'goods';
    } else if (form.goods_type == 3) {
      type = 'tostore';
    } else if (form.goods_type == 1) {
      type = 'appointment';
    }
    franchiseeId = franchiseeId || app.getPageFranchiseeId();
    let isOpenSearch = form.isOpenSearch || false;
    let categroyName = form.categoryName || '分类';
    app.turnToPage('/franchisee/pages/goodsMore/goodsMore?detail=' + type + '&franchisee=' + franchiseeId + '&categroy=' + form.id + '&categroyName=' + categroyName + '&isOpenSearch=' + isOpenSearch);
  },
  'vcard': function(param){
    let pageLink = param['page-link'];
    let myAccount = app.getAppId() +'_'+ app.globalData.userInfo.user_token;
    if(param.vcardUrlType){
      app.sendRequest({
        hideLoading: true,
        url: app.globalData.siteBaseUrl.indexOf('develop')!=-1 ?'/im/getMasterAccount' : '/x70bSwxB/im/getMasterAccount',
        data: {
          card_id: param['vcard-id']
        },
        success: res => {
          if (res.data && res.data.master_account) {
            if(myAccount == res.data.master_account ){
              app.showToast({
                title: '暂不能与自己沟通哦',
                icon: 'none'
              });
              return
            }
            pageLink += `&account=${res.data.master_account}`;
            app.turnToPage(pageLink)
          }
        }
      },app.globalData.siteBaseUrl.indexOf('develop')!=-1 ? 'http://card.p-dev.zhichikeji.com' : '')
    }else{
      app.turnToPage(pageLink)
    }
  },
  'vcard-msg-list': function(param){
    let pageLink = param['inner-page-link'] || param['page-link'] || param['inner_page_link'];
    app.turnToPage(pageLink)
  },
  "flow-to-promote": function(){
    app.turnToPage('/flowPromote/pages/flowSignIn/flowSignIn');
  },
  "voucher": function (param){
    let id = param['exchange-coupon-id'] || param['voucher_id'];
    app.turnToPage('/exchangeCoupon/pages/exchangeCouponDetail/exchangeCouponDetail?id=' + id);
  },
  'share-polite':function(param){
    let pageInstance = app.getAppCurrentPage();
    let sharePolite = {
      sharePoliteShow:true
    };
    pageInstance.selectComponent('#share-polite').showDialog(sharePolite);
  },
  "league-vip-advertise": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/eCommerce/pages/leagueVipAdvertise/leagueVipAdvertise' + queryStr);
  },
  "customer-service": function (params) {
    let pageInstance = app.getAppCurrentPage();
    pageInstance.selectComponent('#customer-service-modal').showDialog(params);
  },
  "live": function(param){
    let liveId = param['liveRoomId'];
    let paramstr = '';
    if(app.globalData.PromotionUserToken){
      paramstr = '&custom_params=' + encodeURIComponent(JSON.stringify({
        user_token: app.globalData.PromotionUserToken
      }));
    }
    app.turnToPage('plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id=' + liveId + paramstr);
  },
  "service-cards": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/tradeApt/pages/myTimeCard/myTimeCard' + queryStr);
  },
  "community-group": function (param) {
    app.turnToPage('/communityGroup/pages/commuGroupGoods/commuGroupGoods?goodsId=' + param.id);
  },
  "jijile": function (param, franchisee) {
    franchisee = franchisee || app.getPageFranchiseeId() || '';
    let queryStr = franchisee ? '?franchisee=' + franchisee : '';
    app.turnToPage('/awardManagement/pages/collectStars/collectStars' + queryStr );
  },
}
module.exports = {
  clickEventHandler: clickEventHandler
}
