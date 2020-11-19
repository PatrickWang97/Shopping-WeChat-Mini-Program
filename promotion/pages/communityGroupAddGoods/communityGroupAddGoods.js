var app = getApp();
Page({
  data: {
    group_id: '',
    goodsArr: [],
    showMore: false,
    showBtn: true, //  显示详细按钮
    agent_goods_ids: [], //  选择商品集合
    title: '',
    card_info: {},
    illustration: '',
    start_date: '',
    end_date: '',
    notice: true,
    is_audit: 0, //判断团长是否被停用4是停用
    goods_num: 0 // 
  },
  isMore: 0,
  page: 1,
  onLoad: function (options) {
    let param = JSON.parse(decodeURIComponent(options.param));
    let leaderInfo = app.globalData.getDistributorInfo;
    param.illustration = param.illustration.replace(/[\\n|\<br\/\>]/ig,""); 
    if (this._filterString(param.illustration) > 171) {
      param.showMore = true;
    }
    if(options.is_audit) { //判断团长是否被停用
      this.setData({
        is_audit: +options.is_audit
      })
    }
    this.setData(param);
    this.setData({
      disable: options.disable,
      leaderInfo,
      latitude: leaderInfo.latitude,
      longitude: leaderInfo.longitude,
    })
    this.goodsList();
  },
  onReachBottom() {
    if (!this.isMore) return;
    this.page++;
    this.goodsList();
  },
  goodsList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetGoodsListByGroupId',
      method: "post",
      data: {
        group_id: _this.data.group_id,
        page: this.page,
        is_stock_gte_zero: 1,             // 不过滤库存为0的商品
        page_size: 20
      },
      success: function (res) {
        let agent_goods_ids = _this.data.agent_goods_ids;
        let goodsIdArr = [];
        for (let item of res.data) {
          if (_this.findIndexOfTag(agent_goods_ids, item.id) >= 0) {
            item.check = true;
            goodsIdArr.push(item.id);
          } else {
            item.check = false;
          }
          if (item.form_data.goods_model) {
            for (let valueModel of item.form_data.goods_model) {
              for (let value of item.dis_goods_price) {
                if (value.model_id == valueModel.id) {
                  let price = valueModel.origin_price;
                  valueModel.virtual_price = (valueModel.virtual_price == '0.00' && price > valueModel.price ) ? price : valueModel.virtual_price;
                }
              }
            }
            let minPrice = item.form_data.goods_model[0].price;
            let virtualMinPrice;
            if (item.commission_type == 2) {
              item.commissionPrice = item.commission;
            }else if (item.form_data.min_price == item.form_data.max_price) {
              item.commissionPrice = (+item.commission * +item.price / 100).toFixed(3);
            }else {
              item.commissionPrice = (+item.commission * +item.form_data.min_price / 100).toFixed(3) + '~' + (+item.commission * +item.form_data.max_price / 100).toFixed(3)
            }
            item.form_data.goods_model.map((goods) => {
              if (+minPrice >= +goods.price) {
                minPrice = goods.price;
                virtualMinPrice = goods.virtual_price;
              }
            })
            item.virtual_price = virtualMinPrice;
            item.price = minPrice;
          }else {
            let price = item.origin_price;
            item.virtual_price = (item.virtual_price == '0.00' && price > item.price ) ? price : item.virtual_price;
            if (item.commission_type == 2) {
              item.commissionPrice = item.commission;
            } else {
              item.commissionPrice = (+item.commission * +item.price / 100).toFixed(3);
            }
          }
        }
        _this.isMore = res.is_more;
        _this.setData({
          goodsArr: [..._this.data.goodsArr, ...res.data]
        })
      }
    })
  },
  findIndexOfTag: function (arr, id) {
    let index = arr.findIndex((value, index) => {
      return value == id;
    })
    return index;
  },
  checkGood: function (e) {
    let index = e.currentTarget.dataset.index;
    let id = e.currentTarget.dataset.id;
    let list = this.data.goodsArr;
    let agent_goods_ids = this.data.agent_goods_ids;
    list[index].check = !list[index].check;
    if (this.findIndexOfTag(agent_goods_ids, id) >= 0) {
      agent_goods_ids.splice(this.findIndexOfTag(agent_goods_ids, id), 1);
    } else {
      agent_goods_ids.push(id);
    }
    this.setData({
      goodsArr: list,
      agent_goods_ids: agent_goods_ids
    })
  },
  isShowMore: function () {
    let showBtn = !this.data.showBtn
    this.setData({
      showBtn: showBtn
    })
  },
  saveGoods: function (turnBack) {
    let _this = this;
    if (!_this.data.agent_goods_ids.length) {
      app.showToast({
        title: '请勾选需要出售的商品',
        icon: 'none'
      })
      return;
    }
    let upGoodsArr = [], downGoodsArr = [];
    this.data.goodsArr.map((item) => {
      if(item.check){
        upGoodsArr.push(item.id);
      }else{
        downGoodsArr.push(item.id);
      }
    })
    let pages = getCurrentPages();
    let prevPage  = pages[pages.length - 2]; //上一个页面
    let communityArr = prevPage.data.communityArr;
    communityArr[prevPage.currentIndex].agent_goods_num = _this.data.agent_goods_ids.length;
    communityArr[prevPage.currentIndex].agent_goods_ids = _this.data.agent_goods_ids;
    prevPage.setData({
      communityArr: communityArr
    })
    if(upGoodsArr.length){
      this.sendLeaderGoodsIdx(upGoodsArr, 1);
    }
    if(downGoodsArr.length){
      this.sendLeaderGoodsIdx(downGoodsArr, 0);
    }
    if(turnBack != 'back') {
      app.showToast({
        title: '商品已加入社区团购活动~',
        icon: 'success'
      })
      app.turnBack();
    }
  },
  sendLeaderGoodsIdx: function(goodsIdArr, status){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/AddDistributionLeaderGoodsIdx',
      method: 'post',
      hideLoading: true,
      data: {
        group_id: _this.data.group_id,
        goods_ids: goodsIdArr,
        status: status
      },
      success: function (res) {
      }
    })
  },
  addBrowseCount: function (group_id, count_type, count_num) {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/IncreaseCountByType',
      method: 'post',
      hideLoading: true,
      data: {
        group_id,
        count_type,
        count_num
      }
    })
  },
  _filterString: function (str) {
    let len = 0;
    for (var i = 0; i < str.length; i++) {
      if (str[i].match(/[^\x00-\xff]/ig) != null) {
        len += 1.75;
      } else { 
        if (str[i].match(/[a-zA-Z]/) != null) {
          len += 0.95;
        }else {
          len += 1;
        }
      };
    }
    return len;
  },
  onShareAppMessage: function (res) {
    let _this = this;
    _this.saveGoods('back');
    _this.addBrowseCount(_this.data.group_id, 2, 1);
    let path = `/promotion/pages/communityGroupGoodDetail/communityGroupGoodDetail?id=${_this.data.group_id}&leader_token=${_this.data.leaderInfo.user_token}`;
    return {
      title: _this.data.card_info.title || _this.data.title,
      path: path,
      imageUrl: _this.data.card_info.pic || '',
    }
  },
  closeNotice: function () {
    this.setData({
      notice: false
    })
  }
})