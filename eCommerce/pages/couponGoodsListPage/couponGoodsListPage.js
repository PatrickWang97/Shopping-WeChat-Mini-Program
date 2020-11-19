var app = getApp();
Page({
  data: {
    param: {
      coupon_id: '',
      page: -1
    },
    noMore: false,
    goodsList: [],
    goodsType: 1,  //1为电商  2为社区团购
    pickUpArr: [],
    goodsTypeOptions: {
      goods: 1,
      community: 2,
      tradeApt: 10
    }
  },
  isLoading: false,
  onLoad: function (options) {
    let that = this;
    if (options.franchisee) {
      that.setData({
        'param.coupon_id': options.detail,
        'param.sub_app_id': options.franchisee
      });
    } else {
      that.setData({ 'param.coupon_id': options.detail });
    }
    that.getGoodsList();
  },
  getGoodsList: function () {
    var that = this;
    if (that.data.noMore || that.isLoading) {
      return;
    }
    this.isLoading = true;
    app.sendRequest({
      url: '/index.php?r=appShop/getCouponConditionGoods',
      method: 'post',
      data: that.data.param,
      success: function (res) {
        if (res.status != 0) {return}
        let newData = {},
          goodsList = res.data,
          param = that.data.param;
        that.originGoodsList = goodsList
        let pickUpArr = [];
        for(let item of goodsList){
          let formData = JSON.parse(item.form_data);
          if (formData.pick_up_type.includes('5') && !pickUpArr.includes('community')){
            pickUpArr.push('community');
          }
          if ((formData.pick_up_type.includes('1') || formData.pick_up_type.includes('2') || formData.pick_up_type.includes('3') || formData.pick_up_type.includes('4') || formData.pick_up_type.includes('6')) && !pickUpArr.includes('goods')){
            pickUpArr.push('goods');
          }
          if (formData.pick_up_type.includes('10') && !pickUpArr.includes('tradeApt')) {
            pickUpArr.push('tradeApt');
          }
        }
        let goodsType = pickUpArr.length ? that.data.goodsTypeOptions[pickUpArr[0]] : 1;
        goodsList = goodsList.filter((item) => {
          let formData = JSON.parse(item.form_data);
          if(goodsType == 2 && formData.pick_up_type.includes('5')){
            return item
          } else if (goodsType == 10 && formData.pick_up_type.includes('10')) {
            return item
          } else if (goodsType == 1 && (formData.pick_up_type.length > 1 || !formData.pick_up_type.includes('5') || !formData.pick_up_type.includes('10'))) {
            return item
          }
        })
        newData.goodsList = goodsList;
        newData.param = param;
        newData.pickUpArr = pickUpArr;
        newData.noMore = res.is_more == 0 ? true : false;
        newData.goodsType = goodsType;
        that.setData(newData);
      },
      complete: function(){
        that.isLoading = false;
      }
    })
  },
  turnToGoodsDetail: function (event) {
    let appId = app.globalData.appId,
      dataset = event.currentTarget.dataset,
      idx = dataset.idx,
      goodsItem = this.data.goodsList[idx],
      {
        id, // 商品id
        tpl_style: tplStype, // 行业预约 模板样式
        form_data: formData, // 详细数据
        goods_type: goodsType,// 商品类型
        is_group_buy: group, // 是否拼团
        group_buy_activity_id: activeId, // 拼团活动id
        app_id: subAppId, // 商品带的小程序id
        is_seckill: isSeckill // 是否秒杀
      } = goodsItem,
      tplId = JSON.parse(formData).type, // 行业预约 模板id
      isSelf = appId === subAppId; // 全局小程序id与商品带的小程序id对比 不相同则为子店
    if (group && group == 1) {
      let pagePath = +goodsType === 10 ? `/tradeApt/pages/TYDetail/TYDetail?activeType=group&tplId=${tplId}&activeId=${activeId}&` : `/pages/groupGoodsDetail/groupGoodsDetail?`;
      let params = `detail=${id}`;
      if (!isSelf) {
        params += "&franchisee=" + subAppId;
      }
      app.turnToPage(pagePath + params);
      return;
    }
    switch (+goodsType) {
      case 0:
        let router;
        let communityType;
        if(this.data.goodsType == 2){
          router = app.returnSubPackageRouter("commuGroupGoods") + `?goodsId=${id}`;
          communityType = 1;
        }else{
          router = '/detailPage/pages/goodsDetail/goodsDetail?detail=' + id;
        }
        if (isSeckill == 1) {
          let seckillType = goodsItem.is_seckill_activity || '';
          let seckill_activity_id = goodsItem.seckill_activity_id || '';
          let seckill_activity_time_id = goodsItem.seckill_activity_time_id || '';
          router = `/seckill/pages/seckillDetail/seckillDetail?id=${id}&sec_act_id=${seckill_activity_id}&sec_t_id=${seckill_activity_time_id}&secType=${seckillType}&communityType=${communityType}`;
        };
        if (!isSelf) {
          router += '&franchisee=' + subAppId;
        }
        app.turnToPage(router);
        break;
      case 1:
        let url = '/detailPage/pages/goodsDetail/goodsDetail?detail=' + id;
        if (isSeckill) {
          url += '&goodsType=seckill';
        };
        if (!isSelf) {
          url += '&franchisee=' + subAppId;
        }
        app.turnToPage(url);
        break;
      case 3:
        if (isSelf) {
          app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id);
        } else {
          app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + "&franchisee=" + subAppId);
        }
        break;
      case 10:
        let mode = this.tplStyleToMode(tplStype);
        let path ;
        if(mode === 2){
          path = 'TYDetail';
        }else if(mode === 3 || mode === 4){
          path = 'hDetail';
        }else if(mode === 5){
          return app.showModal({
            content:'餐饮订座不支持使用优惠券，具体线下联系店家'
          })
        }
        app.turnToPage(`/tradeApt/pages/${path}/${path}?detail=${id}&tplId=${tplId}&franchisee=${subAppId}`)
        break;
    }
  },
  tplStyleToMode(tplStyle) {
    let mode;
    switch (+tplStyle) {
      case 1:
      case 2:
      case 8: mode = 2; break;
      case 6:
      case 3: mode = 3; break;
      case 7:
      case 4: mode = 4; break;
      case 5: mode = 5; break;
      default: mode = 2;
    }
    return mode
  },
  selectGoodsType: function(e){
    let originGoodsList = this.originGoodsList;
    let goodsType = e.currentTarget.dataset.type;
    let goodsList = originGoodsList.filter((item) => {
      let formData = JSON.parse(item.form_data);
      if (goodsType == 2 && formData.pick_up_type.includes('5')) {
        return item
      } else if (goodsType == 10 && formData.pick_up_type.includes('10')) {
        return item
      } else if (goodsType == 1 && (formData.pick_up_type.length > 1 || !formData.pick_up_type.includes('5') || !formData.pick_up_type.includes('10'))){
        return item
      }
    })
    this.setData({
      goodsList,
      goodsType
    })
  }
})
