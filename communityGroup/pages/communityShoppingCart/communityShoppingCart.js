var app = getApp()
Page({
  data: {
    hasData:true,   
    leaderInfo: {},       //团长信息
    goodsList: [],        //商品列表
    unableGoodsList: [],  //失效商品列表
    selectAll: true,      //商品默认选中
    goodsCount: 0,        //商品总数
    goodsCountToPay: 0,   //需要结算的商品总数
    priceToPay: 0.00,     //合计价格
    group_id:'',
  },
  onLoad: function(options) {
    this.setData({
      leaderInfo: app.leaderInfo || 0
    })
    this.getCartList();
  },
  onShow: function () {
    this.onLoad();
    this.setData({
      selectAll: true
    })
  },
  getCartList() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 1000,
        dis_group_id: -1
      },
      success: function(res) {
        let goodsList = res.data;
        if (!goodsList){
          _this.setData({
            hasData :false,
            goodsList: goodsList //商品列表
          })
          return
        }
          goodsList.forEach(val => {
            val.selected = true
          })
        _this.setData({
          goodsList: goodsList, //商品列表
          unableGoodsList: res.unable_data //失效商品列表
        })
        _this.calCountPrice();
      }
    })
  },
  addGoodsNum(e) {
    this.addGoods(e,'add')
  },
  subGoodsNum(e) {
    this.addGoods(e,'sub')
  },
  deleteGoods: function(deleteArr, callBack) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: deleteArr
      },
      success: function(res) {
        callBack && callBack();
      }
    });
  },
  inputGoodsCount: function (e) {
    let count = e.detail.value;
    console.log(count)
    if (count == '') {
      return;
    }
    if (count == 0) {
      app.showModal({
        content: '请输入大于0的数字',
      })
      return;
    }
    this.addGoods(e, 'number', count);
  },
  addGoods: function (e,type, numberCount) {
    let index = e.currentTarget.dataset.index;
    let goodsList = JSON.parse(JSON.stringify(this.data.goodsList));
    let currentGoods = goodsList[index];
    if (type == 'add') {
      if (currentGoods.limit_num != 0 && +currentGoods.num >= currentGoods.limit_num) {
        app.showModal({
          content: '超过限购个数'
        })
        return;
      }
      +currentGoods.num++
    } else if (type == 'sub') {
      +currentGoods.num--
        if (currentGoods.num == 0) {
          this.deleteGoods([currentGoods.id], () => {
            goodsList.splice(index, 1);
            this.setData({
              goodsList: goodsList,
              hasData:false
            })
          });
          app.sendUseBehavior([{goodsId: currentGoods.goods_id}], 4, 2);
          return;
        }
    } else {
      currentGoods.num = numberCount;
    }
    let _this = this;
    let data = {
      goods_id: e.currentTarget.dataset.goodsId,
      model_id: e.currentTarget.dataset.modelId,
      num: currentGoods.num,
      leader_token: e.currentTarget.dataset.leaderToken,
      dis_group_id: e.currentTarget.dataset.groupId
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      method: 'post',
      hideLoading: true,
      data: data,
      success: function(res) {
        _this.setData({
          goodsList: goodsList
        })
        _this.calCountPrice();
      }
    })
  },
  goToHomepage() {
    wx.navigateBack({
      changed: true
    });
  },
  selectAll() {
    let {
      selectAll,
      goodsList
    } = this.data
    let setDataObj = {
      'selectAll': !selectAll,
    }
    goodsList.forEach((item) => {
      item.selected = !selectAll;
    });
    setDataObj['goodsList'] = goodsList;
    this.setData(setDataObj);
    this.calCountPrice();
  },
  selected(e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      goodsList
    } = this.data;
    let selectAll = true;
    let setDataObj = {};
    goodsList[index].selected = !goodsList[index].selected;
    selectAll = goodsList.every((goods) => goods.selected == true);
    setDataObj['goodsList'] = goodsList;
    setDataObj['selectAll'] = selectAll;
    this.setData(setDataObj);
    this.calCountPrice();
  },
  calCountPrice: function() {
    let {
      goodsList
    } = this.data;
    let totalCount = 0,
      price = 0;
    goodsList.map((item) => {
      if (item.selected) {
        totalCount += +item.num;
        price += +item.price * +item.num;
      }
    })
    this.setData({
      goodsCountToPay: totalCount,
      priceToPay: price.toFixed(2)
    })
  },
  goToPay(){
    let _this = this;
    let { goodsList } = this.data;
    let cartIdArray = [];
    let leader_token = ''
    goodsList.map((item) => {
      if (item.selected) {
        cartIdArray.push(item);
      }
    })
    if (!cartIdArray.length) {
      app.showModal({
        content: '请选择结算的商品'
      });
      return;
    }
    if (_this.data.leaderInfo == 0) {
      app.showModal({
        content: '暂无团长，无法购买商品',
        showCancel: true,
        cancelText: '取消',
        confirmText: '申请团长',
        confirm: function (res) {
          app.turnToPage('/communityGroup/pages/communityGroupApply/communityGroupApply');
        }
      })
      return;
    }
    leader_token = _this.data.leaderInfo.user_token
    let loginStatus = app.getIsLogin();
    if (loginStatus) {
      _this._previewPay(leader_token);
    } else {
      app.goLogin({
        success: function () {
          _this._previewPay(leader_token);
        }
      });
    }
  },
  _previewPay: function (leader_token) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/CheckIsDistributorGroupLeader',
      method: 'post',
      hideLoading: true,
      data: {
        leader_token: leader_token,
      },
      success: function (res) {
        console.log(res)
        if (res.data == 1) {
          _this._settlement();
        } else {
          app.showModal({
            content: '团长审核中或被停用，请切换团长购买',
            confirmText: '去切换',
            confirm: function (res) {
              app.turnToPage('/promotion/pages/communityGroupSearchVillage/communityGroupSearchVillage');
            }
          })
        }
      }
    })
  },
  _settlement: function () {
    let _this = this;
    let leaderInfo = encodeURIComponent(JSON.stringify(_this.data.leaderInfo));
    let group_id = _this.data.group_id;
    let cart_arr = [];
    let cartList = [];
    _this.data.goodsList.map((item) => {
      if (item.selected) {
        cartList.push(item);
      }
    })
    if (!cartList.length) {
      app.showModal({
        content: '购物车暂无商品，请添加商品后再结算~'
      })
      return;
    }
    wx.showToast({
      title: '提交中...',
      icon: 'loading',
      mask: true
    });
    cartList.map((item) => {
      cart_arr.push({
        buyCount: item.num,
        cart_id: item.id,
        goods_type: item.goods_type,
        id: item.goods_id,
        imgurl: item.cover,
        modelId: item.model_id || '',
        models: item.model_value,
        models_text: item.models_text,
        price: item.price,
        stock: item.stock,
        title: item.title
      })
    })
    cart_arr = encodeURIComponent(JSON.stringify(cart_arr));
    let pagePath = `/promotion/pages/communityGroupOrderSubmit/communityGroupOrderSubmit?cart_arr=${cart_arr}&leaderInfo=${leaderInfo}&group_id=${group_id}`;
    wx.navigateTo({
      url: pagePath
    });
  }
})