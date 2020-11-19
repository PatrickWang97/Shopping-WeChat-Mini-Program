var Element = require('../../utils/element.js');
var util = require('../../utils/util.js');
var app = getApp();
var listVessel = new Element({
  events: {
    listVesselScrollFunc: function(e){
      this.listVesselScrollFunc(e);
    },
    showGoodsShoppingcart: function(e) {
      app.showGoodsShoppingcart(e)
    }
  },
  methods: {
    init: function(compid, pageInstance, isPullRefresh){
      let that = this;
      let compData = pageInstance.data[compid];
      let customFeature = compData.customFeature;
      let param = typeof compData.param == "string" ? JSON.parse(compData.param || '') : compData.param;
      let url = '/index.php?r=AppData/getFormDataList';
      param.form = customFeature.form;
      param.is_count = param.is_count || 0;
      if (!param.form){
        console.log(compid + '没有绑定数据对象');
        pageInstance.setData({
          [compid + '.is_more']: 0
        });
        return;
      }
      if(!app.globalData.isLogin){
        delete param.is_count;
      }
      param.page = 1;
      if (customFeature.form =='goods') {
        param.param_data = {
          is_stock_gte_zero : customFeature.showSoldOut ? 1 : 0
        }
      }
      if(customFeature.form=='group_buy'){
        url="/index.php?r=AppGroupBuy/GetGroupBuyGoodsList";
        param.current_status = 0;
        param.is_stock_gt_zero = customFeature.showSoldOut ? 0 : 1; 
      }
      if(customFeature.source && customFeature.source !== 'none'){
        param.idx_arr = {
          idx: 'category',
          idx_value: customFeature.source
        }
      }
      if (customFeature.form === 'goods' && customFeature.pickUpArr && compData.type == "list-vessel") {
        param.pick_up_type = [];
        if (customFeature.pickUpArr.express) {
          param.pick_up_type.push(1);
        }
        if (customFeature.pickUpArr.sameJourney) {
          param.pick_up_type.push(2);
        }
        if (customFeature.pickUpArr.selfLifting) {
          param.pick_up_type.push(3);
        }
        if (customFeature.pickUpArr.dining) {
          param.pick_up_type.push(4);
        }
      }
      if (param.form == 'app_shop') {
        param.sort_key = 'weight';   // 多商家列表默认按权重展示
        param.sort_direction = 0;
        if (param.extra_cond_arr && !param.extra_cond_arr.viewed_count) {
          param.extra_cond_arr.viewed_count = 1;
          param.extra_cond_arr.assess_score = 1;
          param.extra_cond_arr.deliver_fee = 1; //配送费
          param.extra_cond_arr.min_deliver_price = 1; //起送价
          param.extra_cond_arr.carousel_imgs = 1; //店铺环境图
        } else if (!param.extra_cond_arr) {
          param.extra_cond_arr = {
            viewed_count: 1,
            assess_score: 1,
            deliver_fee: 1,
            min_deliver_price: 1,
            carousel_imgs: 1,
            is_biz_shop: 0
          }
        }
        if (app.globalData.commonEcLocationId) {
          param['extra_cond_arr'] = {
            location_id: app.globalData.commonEcLocationId
          };
        }
      }
      if (app.globalData.hasFranchiseeTrade) {
        let tradeInfo = wx.getStorageSync('tradeInfo') || {};
        if (param.extra_cond_arr) {
          param.extra_cond_arr.biz_cate = tradeInfo.id || "";
        } else {
          param.extra_cond_arr = {
            biz_cate: tradeInfo.id || ""
          }
        }
      }
      if (param.form == 'app_shop' && param.extra_cond_arr && param.extra_cond_arr.is_biz_shop !== 0) {
        param.extra_cond_arr.is_biz_shop = 0;
      }
      if (app.getChainId()  || pageInstance.franchiseeId) {
        param['param_data'] = {
          parent_app_id: app.getAppId(),
          outer_cond: {
            is_parent_shop_goods: 1,
            is_app_goods_shop: 1
          }
        };
      }
      param.page_size = customFeature.loadingNum || 10;
      let field = app.getListVessel(compData);
      let fieldData = {};
      param.need_column_arr = field.concat('app_id', 'id', 'is_seckill', 'mode_id', 'goods_id', 'is_group_buy','seckill_activity_id','seckill_activity_time_id','is_seckill_activity','sub_app_bar','stock');
      fieldData[compid + '.listField'] = field;
      fieldData[compid + '.need_column_arr'] = param.need_column_arr;
      fieldData[compid + '.loading'] = true;
      fieldData[compid + '.loadingFail'] = false;
      fieldData[compid + '.list_data'] = [];
      fieldData[compid + '.param'] = param;
      fieldData[compid + '.is_more'] = 1;
      fieldData[compid + '.curpage'] = 0;
      if (pageInstance.data.page_hasNavBar){
        fieldData[compid + '.topNavBarHeight'] = app.globalData.topNavBarHeight;
        fieldData[compid + '.page_hasNavBar'] = true;
      }else{
        fieldData[compid + '.topNavBarHeight'] = 0;
        fieldData[compid + '.page_hasNavBar'] = false;
      }
      pageInstance.setData(fieldData);
      let re_compid = app.getInvolvedFromRefreshObject(customFeature.id, "new-classify");
      let re_compData = pageInstance.data[re_compid];
      let re_newdata = {};
      if (re_compData && re_compData.customFeature.topHover){
        re_compData.classify_observer && re_compData.classify_observer.disconnect();
        this.topHover(pageInstance, compid, re_compid);
      }
      if (re_compData && re_compData.customFeature.topHover) {
        re_compData.list_observer && re_compData.list_observer.disconnect();
        this.bottomHover(pageInstance, compid, re_compid);
      }
      if (re_compid && re_compData.customFeature.topHover) {
        let style_arr = re_compData.style.split(';');
        for (let i=0; i<style_arr.length; i++) {
          if (style_arr[i].split(':')[0] == 'height') {
            let height = style_arr[i].split(':')[1].match(/(\S*)rpx/)[1] / 2.34375;
            re_newdata[compid + '.topNavBarHeight'] = app.globalData.topNavBarHeight + height;
            re_newdata[compid + '.re_height'] = height;
          }
        }
        pageInstance.setData(re_newdata);
      }
      if (re_compid && re_compData) return
      if (customFeature.form == 'app_shop' && field.indexOf('distance') > -1 && !isPullRefresh) {
        let locationInfo = app.globalData.locationInfo;
        if (locationInfo.latitude) {
          param.extra_cond_arr.latitude = locationInfo.latitude;
          param.extra_cond_arr.longitude = locationInfo.longitude;
        } else {
          app.getLatLng({
            success: function (latlng) {
              let extra_cond_arr = param.extra_cond_arr;
              extra_cond_arr.latitude = latlng.latitude;
              extra_cond_arr.longitude = latlng.longitude;
              pageInstance.setData({
                [compid + '.param.extra_cond_arr']: extra_cond_arr
              });
              that.init(compid, pageInstance, true);
            },
            fail: function () {
              app.showToast({
                title: '您已经拒绝定位，店铺距离将获取不到',
                icon: 'none'
              });
              that.init(compid, pageInstance, true);
            }
          });
          return;
        }
      }
      if(customFeature.showSingleData && compData.type == "list-vessel") {
        app.requestSingleData(pageInstance, customFeature, compid, field, param);
      }else {
        if (customFeature.form === 'community_group') {
          let leaderToken = app.globalData.leaderInfo && app.globalData.leaderInfo.user_token || '';
          if (leaderToken) {
            that.getCommunityGoodsList(compid, param, leaderToken);
          } else {
            if (app.isLogin()) {
              that.getGroupLeaderLocking(compid, param)
            }else {
              app.goLogin({
                success: () => {
                  that.getGroupLeaderLocking(compid, param);
                }
              })
            }
          }
          return;
        }
        app.getReviewConfig(reviewList => {
          app.sendRequest({
            hideLoading: true,
            url: url,
            data: param,
            method: 'post',
            chain: (app.globalData.hasFranchiseeTrade && ["app_shop"].indexOf(customFeature.form) > -1) ? false : true,
            subshop: pageInstance.franchiseeId || '',
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
                      if(/region/.test(k)){
                        continue;
                      }
                      if(k == 'goods_model') {
                        res.data[j].form_data.virtual_price = app.formVirtualPrice(res.data[j].form_data);
                      }
                      if (k == 'distance') {
                        res.data[j].form_data[k] = util.formatDistance(res.data[j].form_data[k]);
                      }
                      let description = res.data[j].form_data[k];
                      if (field.indexOf(k) < 0 && /<("[^"]*"|'[^']*'|[^'">])*>/.test(description)) { //没有绑定的字段的富文本置为空
                        res.data[j].form_data[k] = '';
                      } else if (app.needParseRichText(description)) {
                        res.data[j].form_data[k] = app.getWxParseResult(description);
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
            fail: function(res){
              let newdata = {};
              newdata[compid + '.loadingFail'] = true;
              newdata[compid + '.loading'] = false;
              pageInstance.setData(newdata);
            }
          });
        })
      }
    },
    onPageShow: function(compid, pageInstance){
      let needRefreshPages = app.globalData.needRefreshPages;
      let pageRouter = app.getPageRouter();
      let pageIndex = needRefreshPages.indexOf(pageRouter);
      if (app.globalData.listVesselRefresh && pageIndex > -1) {
        this.init(compid, pageInstance);
        needRefreshPages.splice(pageIndex, 1);
        if (!needRefreshPages.length) {
          app.globalData.listVesselRefresh = false;
        }
        return;
      }
      if (pageInstance.data[compid].customFeature && pageInstance.data[compid].customFeature.form === 'community_group') {
        let leaderToken = pageInstance.data[compid].leaderToken;
        let globalLeaderInfo = app.globalData.leaderInfo || {};
        if (leaderToken != globalLeaderInfo.user_token){
          this.init(compid, pageInstance);
        }
      }
    },
    listVesselScrollFunc: function(event){
      let pageInstance = app.getAppCurrentPage();
      let compid = typeof event == 'object' ? event.currentTarget.dataset.compid : event;
      let compData = pageInstance.data[compid];
      if (!compData) {
        console.log('listVesselScrollFunc is not find compData');
        return;
      }
      if (!compData.is_more && typeof event == 'object' && event.type == 'tap') {
        app.showModal({
          content: '已经加载到最后了'
        });
      }
      if (compData.loading || !compData.is_more) {
        return;
      }
      let curpage = (compData.curpage || 0) + 1;
      let newdata = {};
      let param = compData.param;
      let customFeature = compData.customFeature;
      let url = '/index.php?r=AppData/getFormDataList';
      newdata[compid + '.loading'] = true;
      newdata[compid + '.loadingFail'] = false;
      pageInstance.setData(newdata);
      if (customFeature.form == 'group_buy') {
        url = "/index.php?r=AppGroupBuy/GetGroupBuyGoodsList";
        param.current_status = 0;
      }
      param.page = curpage;
      if (param.form == 'community_group') {
        let leaderToken = app.globalData.leaderInfo && app.globalData.leaderInfo.user_token;
        this.communityGoodsScrollFunc(compid, param, leaderToken)
        return;
      }
      app.getReviewConfig(reviewList => {
        app.sendRequest({
          url: url,
          data: param,
          method: 'post',
          hideLoading: true,
          chain: (app.globalData.hasFranchiseeTrade && ["app_shop"].indexOf(customFeature.form) > -1) ? false : true,
          subshop: pageInstance.franchiseeId || '',
          success: function (res) {
            newdata = {};
            let len = compData.list_data ? compData.list_data.length : 0;
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
                  res.data[j].form_data.virtual_price = app.formVirtualPrice(res.data[j].form_data);
                }
                if (k == 'distance') {
                  res.data[j].form_data[k] = util.formatDistance(res.data[j].form_data[k]);
                }
                let description = res.data[j].form_data[k];
                if (compData.listField && compData.listField.indexOf(k) < 0 && /<("[^"]*"|'[^']*'|[^'">])*>/.test(description)) { //没有绑定的字段的富文本置为空
                  res.data[j].form_data[k] = '';
                } else if (app.needParseRichText(description)) {
                  res.data[j].form_data[k] = app.getWxParseResult(description);
                }
              }
              newdata[compid + '.list_data[' + (+j + len) + ']'] = res.data[j];
            }
            newdata[compid + '.is_more'] = res.is_more;
            newdata[compid + '.curpage'] = res.current_page;
            newdata[compid + '.loading'] = false;
            newdata[compid + '.loadingFail'] = false;
            pageInstance.setData(newdata);
          },
          fail: function () {
            let newdata = {};
            newdata[compid + '.loadingFail'] = true;
            newdata[compid + '.loading'] = false;
            pageInstance.setData(newdata);
          },
          complete: function () {
          }
        })
      })
    },
    topHover: function (pageInstance, compid, re_compid) {
      let compData = pageInstance.data[compid];
      compData.classify_observer = wx.createIntersectionObserver();
      let top = 0;
      if (pageInstance.data.page_hasNavBar) {
        top = 0 - app.globalData.topNavBarHeight;
      }
      compData.classify_observer.relativeToViewport({top: top}).observe('.topHover', (res) => {
        if (res.boundingClientRect.top < Math.abs(top) && res.intersectionRect.top == 0){
          pageInstance.setData({
            [re_compid + '.topHover']: res.intersectionRatio == 1 ? false : true
          })
        }else {
          pageInstance.setData({
            [re_compid + '.topHover']: false 
          })
        }
      })
    },
    bottomHover: function (pageInstance, compid, re_compid) {
      let compData = pageInstance.data[compid];
      compData.list_observer = wx.createIntersectionObserver();
      compData.list_observer.relativeToViewport().observe('.bottomHover', (res) => {
        if (!(res.intersectionRatio > 0) && res.boundingClientRect.top < 0) {
          pageInstance.setData({
            [re_compid + '.topHover']: false
          })
        }
      })
    },
    getGroupLeaderLocking: function(compid, param) {
      let _this = this;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppDistributionExt/getDistributorGroupLeaderByUserToken',
        success: function (res) {
          if(res.data){
            app.globalData.leaderInfo = res.data.leader_info;   //把团长信息存在全局，方便拿取
            _this.getCommunityGoodsList(compid, param, app.globalData.leaderInfo.user_token);
          }else{
            _this.communityGroupInit(compid, param);
          }
        }
      })
    },
    communityGroupInit: function (compid, param) {
      let _this = this;
      let locationInfo = app.globalData.locationInfo;
      if (locationInfo.latitude) {
        let { latitude, longitude } = locationInfo;
        _this.getGroupList(compid, param, latitude, longitude);
      } else {
        app.getLocation({
          type: 'gcj02',
          success: function (res) {
            let { latitude, longitude } = res;
            app.sendRequest({
              hideLoading: true,
              url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
              data: {
                latitude,
                longitude
              },
              success: function (res) {
                app.setLocationInfo({
                  latitude: latitude,
                  longitude: longitude,
                  address: res.data.formatted_addresses.recommend,
                  info: res.data
                });
              }
            });
            _this.getGroupList(compid, param, latitude, longitude);
          },
          fail: function (res) {
            let newdata = {};
            if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === "getLocation:fail:auth denied") {
              newdata[compid + '.location_address'] = '已拒绝定位';
            } else {
              newdata[compid + '.location_address'] = '定位失败';
            }
            pageInstance.setData(newdata);
          }
        });
      }
    },
    getGroupList: function (compid, param, latitude, longitude) {
      let _this = this;
      let pageInstance = app.getAppCurrentPage();
      app.sendRequest({
        url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
        method: 'post',
        data: {
          latitude: latitude,
          longitude: longitude,
          is_audit: 1,
          filter_deleted: 1
        },
        success: function (res) {
          if (res.data.length) {
            let leaderInfo = res.data[0];
            _this.distributorGroupLeaderLocking(compid, param, leaderInfo.user_token);
          } else {
            app.showToast({
              title: '未找到社区团长，无法获取分类商品',
              icon: 'none'
            });
            let newdata = {};
            newdata[compid + '.list_data'] = [];
            newdata[compid + '.loading'] = false;
            newdata[compid + '.is_more'] = 0;
            pageInstance.setData(newdata);
          }
        }
      })
    },
    distributorGroupLeaderLocking(compid, param, user_token) {
      let _this = this;
      app.sendRequest({
        url: '/index.php?r=AppDistributionExt/distributorGroupLeaderLocking',
        data: {
          leader_token: user_token
        }
      })
      _this.getCommunityGoodsList(compid, param, user_token);
    },
    getCommunityGoodsList(compid, params, token) {
      let pageInstance = app.getAppCurrentPage();
      let compData = pageInstance.data[compid];
      let field = app.getListVessel(compData);
      let { idx_arr, page, page_size, category_group_id } = params;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppDistributionExt/GetAppDistributionGroupGoodsList',
        method: 'post',
        data: {
          idx_arr: idx_arr,
          page_size: page_size || 10,
          page: page || 1,
          pick_up_type: [5],
          status: 6,
          leader_token: token,
          is_stock_gte_zero: compData.customFeature.showSoldOut ? 1 : 0,
          category_group_id: category_group_id,
          filter_passive: 1
        },
        success: function (res) {
          let newdata = {};
          let formList = [];
          res.data.forEach(item => {
            let { virtual_max_price, virtual_min_price, virtual_price_duration, min_price, max_price } = item.form_data;
            item.virtual_max_price = virtual_max_price || item.virtual_price;
            item.virtual_min_price = virtual_min_price || item.virtual_price;
            item.virtual_price_duration = virtual_price_duration.length === 3 ? '¥0.00~¥0.00' : virtual_price_duration;
            item.min_price = min_price || item.min_price || '¥0.00';
            item.max_price = max_price || item.max_price || '¥0.00';
            item.leader_token = token;
            if (!!item.form_data.goods_model) {
              item.price = item.min_price;  //多规格有最小值
            }
            formList.push({ 'form_data': item });
          })
          res.data = formList;
          for (let j in res.data) {
            for (let k in res.data[j].form_data) {
              if (k == 'category') {
                continue;
              }
              if (/region/.test(k)) {
                continue;
              }
              if (k == 'goods_model') {
                res.data[j].form_data.virtual_price = app.formVirtualPrice(res.data[j].form_data);
              }
              if (k == 'distance') {
                res.data[j].form_data[k] = util.formatDistance(res.data[j].form_data[k]);
              }
              let description = res.data[j].form_data[k];
              if (field.indexOf(k) < 0 && /<("[^"]*"|'[^']*'|[^'">])*>/.test(description)) { //没有绑定的字段的富文本置为空
                res.data[j].form_data[k] = '';
              } else if (app.needParseRichText(description)) {
                res.data[j].form_data[k] = app.getWxParseResult(description);
              }
            }
          }
          newdata[compid + '.list_data'] = res.data;
          newdata[compid + '.is_more'] = res.is_more || '';
          newdata[compid + '.curpage'] = 1;
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = false;
          newdata[compid + '.leaderToken'] = token;
          pageInstance.setData(newdata);
        },
        fail: function () {
          let newdata = {};
          newdata[compid + '.loadingFail'] = true;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        }
      })
    },
    communityGoodsScrollFunc(compid, params, token) {
      let pageInstance = app.getAppCurrentPage();
      let compData = pageInstance.data[compid];
      let goodsList = compData['list_data'];
      let field = app.getListVessel(compData);
      let { idx_arr, page, page_size, search_value} = params;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppDistributionExt/GetAppDistributionGroupGoodsList',
        method: 'post',
        data: {
          idx_arr: idx_arr,
          page_size: page_size || 10,
          page: page || 1,
          pick_up_type: [5],
          status: 6,
          leader_token: token,
          search_value: search_value,
          is_stock_gte_zero: compData.customFeature.showSoldOut ? 1 : 0,
          filter_passive: 1
        },
        success: function (res) {
          let newdata = {};
          let formList = [];
          res.data.forEach(item => {
            let { virtual_max_price, virtual_min_price, virtual_price_duration, min_price, max_price } = item.form_data;
            item.virtual_max_price = virtual_max_price || item.virtual_price;
            item.virtual_min_price = virtual_min_price || item.virtual_price;
            item.virtual_price_duration = virtual_price_duration.length === 3 ? '¥0.00~¥0.00' : virtual_price_duration;
            item.min_price = min_price || item.min_price || '¥0.00';
            item.max_price = max_price || item.max_price || '¥0.00';
            item.leader_token = token || (app.globalData.leaderInfo && app.globalData.leaderInfo.user_token);
            if (!!item.form_data.goods_model) {
              item.price = item.min_price;  //多规格有最小值
            }
            formList.push({ 'form_data': item });
          })
          res.data = formList;
          for (let j in res.data) {
            for (let k in res.data[j].form_data) {
              if (k == 'category') {
                continue;
              }
              if (/region/.test(k)) {
                continue;
              }
              if (k == 'goods_model') {
                res.data[j].form_data.virtual_price = app.formVirtualPrice(res.data[j].form_data);
              }
              if (k == 'distance') {
                res.data[j].form_data[k] = util.formatDistance(res.data[j].form_data[k]);
              }
              let description = res.data[j].form_data[k];
              if (field.indexOf(k) < 0 && /<("[^"]*"|'[^']*'|[^'">])*>/.test(description)) { //没有绑定的字段的富文本置为空
                res.data[j].form_data[k] = '';
              } else if (app.needParseRichText(description)) {
                res.data[j].form_data[k] = app.getWxParseResult(description);
              }
            }
          }
          newdata[compid + '.list_data'] = [...goodsList, ...res.data];
          newdata[compid + '.is_more'] = res.is_more || '';
          newdata[compid + '.curpage'] = res.current_page;
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = false;
          pageInstance.setData(newdata);
        },
        fail: function () {
          let newdata = {};
          newdata[compid + '.loadingFail'] = true;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        }
      })
    }
  }
})
module.exports = listVessel;