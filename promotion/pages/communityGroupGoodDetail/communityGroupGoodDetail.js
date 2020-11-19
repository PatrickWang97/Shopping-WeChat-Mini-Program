var app = getApp();
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '社区团购详情',
    },
    showMore: false,            //  标题介绍显示更多内容
    showBtn: true,              //  显示详细按钮
    showCark: true,             //  显示购物车
    showGood: true,             //  显示商品详情
    showModel: true,            //  商品多规格选择
    communityInfo: {},          //  社区团购信息
    communityGoodsList: [],     //  社区团购商品列表
    leaderInfo: {},             //  团长信息
    goodsInfo: {},              //  社区团购单个商品信息
    selectGoodsModelInfo: {},   //  当前选中的多规格商品信息
    cartList: [],           //  购物车
    orderRecords: [],           //  订单接龙
    previewGoodIndex: '',       //  当前选中的商品索引值
    sold_count: 0,              // 接龙
    shopCarkNumber: 0,
    listCategory:'',            // 分类列表
    dialog: false,              // 分类窗口
    index: -1,                  // 分类下标
    ckeckIndex: -1,             // 子分类下标
    showCategory:false,          // 分类
    isMore: false,               // 有无更多数据
    communityCartList: [],       // 活动社区团购不走加入购物车流程，保存在全局，页面卸载的时候存起来
  },
  leader_token: '',
  group_id: '',
  page: 1,
  onLoad: function (options) {
    if(options.leader_token){
      this.leader_token = options.leader_token || '';
    }else{
      this.leader_token = app.globalData.leaderInfo.user_token;
    }
    this.group_id = options.id;
    this.setData({
      showCategory: options.showcategory,
    })
    this.initData();
    this.initRecords();
    this.getListCategory();
  },
  onShow: function() {
    if (this.group_id && this.leader_token) {
      this.checkLeaderAgent();
    }
    if(this.fromSubmit){
      this.clearCart();
      this.fromSubmit = false;
    }
    this.getInitCar();
  },
  onHide: function() {
    app.globalData.communityCartList = this.data.communityCartList;   //页面从前台变为后台时储存到globalData里面
  },
  onShareAppMessage: function (res) {
    let _this = this;
    let path = `/promotion/pages/communityGroupGoodDetail/communityGroupGoodDetail?id=${_this.group_id}&leader_token=${_this.leader_token}`;
    _this.addBrowseCount(_this.group_id, 2, 1, function () {
      let count = _this.data.communityInfo.share_count || 0;
      _this.setData({
        "communityInfo.share_count": ++count
      })
    });
    return {
      title: _this.data.communityInfo.card_info.title || _this.data.communityInfo.title,
      path: path,
      imageUrl: _this.data.communityInfo.card_info.pic || '',
    }
  },
  initData: function () {
    let _this = this,
        group_id = this.group_id,
        leader_token = this.leader_token,
        idx_arr;
    if (_this.data.index > -1) {
      idx_arr = {
        idx: 'category',
        idx_value: _this.data.listCategory[_this.data.index].id
      }
      if (_this.data.ckeckIndex != -1 && _this.data.ckeckIndex != '') {
        idx_arr.idx_arr =  _this.data.subclass[_this.data.ckeckIndex].id;
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetGroupsByDistance',
      method: 'post',
      data: {
        idx_arr,
        leader_token,
        group_id,
        shop_type: 1,
        is_stock_gte_zero: 1,  //显示售罄商品
        g_page: this.page,  // 当前页数
        g_page_size:10,    // 页容量 
      },
      success: function (res) {
        if(!res.data.length) {
          app.showModal({
            content: '该活动已结束，请选择其他团活动！',
            confirm: function() {
              let homepageRouter = app.getHomepageRouter();
              app.reLaunch({
                url: '/pages/' + homepageRouter + '/' + homepageRouter
              })
            }
          })
          return;
        }
        if(_this.page <= 1){_this.data.communityGoodsList = []};
        let goodsInfor = [..._this.data.communityGoodsList,...res.data[0].goods_info];
        if (goodsInfor && goodsInfor.length) {
          goodsInfor.map((ele) => {
            if (!!ele.form_data.goods_model) {
              ele.price = ele.form_data.min_price;  //多规格有最小值
            }
            return ele;
          })
        } 
        let communityInfo = res.data[0].group_info;
        let showMore = false;
        communityInfo.illustration = communityInfo.illustration.replace(/[\\n|\<br\/\>]/ig,""); 
        if (_this._filterString(communityInfo.illustration) > 171) {
          showMore = true;
        }
        let leaderInfo = res.data[0].leader_info;
        _this.setData({
          communityInfo: communityInfo,
          showMore: showMore,
          communityGoodsList: goodsInfor,
          isMore: res.data[0].goods_info_pages.is_more,  // 有无更多数据
          leaderInfo
        });
        _this.addBrowseCount(group_id, 1, 1, function () {
          let count = communityInfo.view_count;
          _this.setData({
            "communityInfo.view_count": ++count
          })
        });
        _this.getInitCar();  //获取购物车数据
      },
      successShowModalConfirm: function(){
        let router = app.getHomepageRouter();
        let path = '/pages/' + router + '/' + router;
        app.turnToPage(path, 1);
      }
    })
  },
  getMore:function (){
    this.page++;
    this.initData();
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
  initRecords: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributionGroupOrderIdxList',
      hideLoading: true,
      data: {
        leader_token: this.leader_token,
        group_id: this.group_id,
        page: -1
      },
      success: function (res) {
        if(res.data.length == 0) return;
        let data = res.data;
        data.map((item) => {
          let soldNumer = 0;
          item.form_data.goods_info.map((a) => {
            soldNumer += a.num;
          })
          item.total_sold_number = soldNumer;
        })
        _this.setData({
          orderRecords: data,
          sold_count: res.count
        })
      }
    })
  },
  addBrowseCount: function (group_id, count_type, count_num, callBack) {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/IncreaseCountByType',
      method: 'post',
      hideLoading: true,
      data: {
        group_id,
        count_type,
        count_num
      },
      success: function(res) {
        callBack && callBack();
      }
    })
  },
  clickGoodsMinusButton: function (event) {
    let count = +this.data.selectGoodsModelInfo.buyCount;
    if (count <= 1) {
      return;
    }
    this.setData({
      'selectGoodsModelInfo.buyCount': count - 1
    });
  },
  clickGoodsPlusButton: function (event) {
    let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
    let count = +selectGoodsModelInfo.buyCount;
    let stock = +selectGoodsModelInfo.stock;
    let goodsInfo = this.data.goodsInfo;
    if (goodsInfo.limit_num != 0 && count >= goodsInfo.limit_num) {
      app.showModal({
        content: '超过限购个数'
      })
      return;
    }
    if (count >= stock) {
      app.showModal({
        content: '库存不足'
      })
      return;
    }
    this.setData({
      'selectGoodsModelInfo.buyCount': count + 1
    });
  },
  clearCommunityCartList: function () {
    let _this = this;
    let communityCartList = [];
    app.showModal({
      content: '确定清空购物袋？',
      showCancel: true,
      confirm: function () {
        _this.setData({
          communityCartList
        })
      }
    })
  },
  inputNumber: function (e) {
    let value = e.detail.value;
    let index = e.currentTarget.dataset.index;
    if (value.trim() != '') {
      this.changeGoodsNum(index, value);
    } else {
      this.changeGoodsNum(index, 1);
    }
  },
  stopInputNumber: function (e) {
    let index = e.currentTarget.dataset.index;
    let goods = this.data.communityGoodsList;
    if (!!goods[index].form_data.goods_model) {
      app.showModal({
        content: '多规格商品请在购物袋中操作'
      })
      return;
    }
  },
  initSelectGoodsModelInfo: function (goods) {
    goods.form_data.cover = goods.cover;
    goods.form_data.title = goods.title;
    goods.form_data.id = goods.id;
    goods.form_data.goods_type = goods.goods_type;
    goods.form_data.limit_num = goods.limit_num;
    goods = goods.form_data;
    let items = goods.goods_model;
    let goodsModel = [];
    let selectModels = [];
    let modifySelectModels = '';
    let selectStock, selectImgurl, selectPrice, selectModelId, selectVirtualPrice, min_sales_nums, selectText = '',
      buyCount = 1;
    for (let key in goods.model) {
      let model = goods.model[key];
      goodsModel.push(model);
      if (model && model.subModelName) {
        selectModels.push(model.subModelId[0]);
        modifySelectModels = selectModels.toString();
        selectText += '“' + model.subModelName[0] + '” ';
      }
    }
    goods.model = goodsModel;
    for (let i = 0; i < items.length; i++) {
      let modifyGoodsmodel = items[i].model;
      if (modifyGoodsmodel == modifySelectModels) {
        selectPrice = items[i].price;
        selectStock = items[i].stock;
        selectModelId = items[i].id;
        selectImgurl = items[i].img_url == "" ? goods.cover : items[i].img_url;
        selectVirtualPrice = items[i].virtual_price;
        min_sales_nums = items[i].min_sales_nums;
      }
    }
    this.data.communityCartList.map((item) => {
      if(item.modelId == selectModelId)
      buyCount = item.num;
    })
    this.setData({
      goodsInfo: goods,
      'selectGoodsModelInfo.models': selectModels || '',
      'selectGoodsModelInfo.stock': selectStock || '',
      'selectGoodsModelInfo.price': selectPrice || '',
      'selectGoodsModelInfo.modelId': selectModelId || '',
      'selectGoodsModelInfo.models_text': selectText || '',
      'selectGoodsModelInfo.imgurl': selectImgurl,
      'selectGoodsModelInfo.virtualPrice': selectVirtualPrice || '',
      'selectGoodsModelInfo.buyCount': buyCount < min_sales_nums ? min_sales_nums : buyCount,
      'selectGoodsModelInfo.title': goods.title,
      'selectGoodsModelInfo.id': goods.id,
      'selectGoodsModelInfo.goods_type': goods.goods_type,
      'selectGoodsModelInfo.min_sales_nums': min_sales_nums,
      showModel: false,
      showGood: true
    })
  },
  selectGoodsSubModel: function (e) {
    let dataset = e.target.dataset;
    let modelIndex = dataset.modelIndex;
    let submodelIndex = dataset.submodelIndex;
    let data = {};
    let selectModels = this.data.selectGoodsModelInfo.models;
    let model = this.data.goodsInfo.model;
    let text = '';
    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if (selectModels[i] == selectSubModelId[j]) {
          text += '“' + model[i].subModelName[j] + '”';
        }
      }
    }
    data['selectGoodsModelInfo.models'] = selectModels;
    data['selectGoodsModelInfo.models_text'] = text;
    this.resetSelectCountPrice(data);
  },
  resetSelectCountPrice: function (data) {
    let selectModelIds = this.data.selectGoodsModelInfo.models.join(',');
    let modelItems = this.data.goodsInfo.goods_model;
    let cover = this.data.goodsInfo.cover;
    let buyCount = 1;
    for (let item of modelItems) {
      if (item.model == selectModelIds) {
        data['selectGoodsModelInfo.stock'] = item.stock;
        data['selectGoodsModelInfo.price'] = item.price;
        data['selectGoodsModelInfo.modelId'] = item.id || '';
        data['selectGoodsModelInfo.imgurl'] = item.img_url == "" ? cover : item.img_url;;
        data['selectGoodsModelInfo.virtualPrice'] = item.virtual_price;
        data['selectGoodsModelInfo.min_sales_nums'] = item.min_sales_nums;
        break;
      }
    }
    this.data.communityCartList.map((item) => {
      if(item.modelId == data['selectGoodsModelInfo.modelId'])
      buyCount = item.num;
    })
    data['selectGoodsModelInfo.buyCount'] = buyCount < data['selectGoodsModelInfo.min_sales_nums'] ? data['selectGoodsModelInfo.min_sales_nums'] : buyCount;
    this.setData(data);
  },
  isShowMore: function () {
    let showBtn = this.data.showBtn;
    this.setData({
      showBtn: !showBtn
    })
  },
  callPhone: function (e) {
    let phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  changeGoodsNum: function (index, type) {
    let _this = this;
    let communityGoodsList = this.data.communityGoodsList;
    let currentGoods = communityGoodsList[index];
    let formData = currentGoods.form_data;
    let currentNum = currentGoods.form_data.number;
    let communityCartList = this.data.communityCartList;
    let targetNum;
    if (type == 'plus'){
      targetNum = currentNum + 1
    } else if (type == 'minus'){
      targetNum = currentNum - 1
    } else {
      targetNum = Number(type)
    }
    if (!!formData.goods_model && type == 'plus') {
      _this.initSelectGoodsModelInfo(currentGoods);
      return;
    }
    if (!formData.goods_model && targetNum == 0 ) {
      communityCartList = communityCartList.filter((item) => {
        return item.id != currentGoods.id;
      })
    }
    if (!!formData.goods_model) {
      app.showModal({
        content: '多规格商品请在购物袋中删除'
      })
      return;
    }
    if (!formData.goods_model && targetNum > 0) {
      targetNum = targetNum > currentGoods.form_data.min_sales_nums ? targetNum: currentGoods.form_data.min_sales_nums;
      if (currentGoods.limit_num != 0 && targetNum > currentGoods.limit_num) {
        app.showModal({
          content: '超过限购个数'
        })
        return;
      }
      let currentIndex = -1;
      communityCartList.map((item, index) => {
        if(item.id == currentGoods.id){
          currentIndex = index;
          return;
        }
      })
      if (currentIndex != -1){
        communityCartList[currentIndex].num = targetNum;
      } else {
        communityCartList.push({
          id: currentGoods.id,
          imgurl: currentGoods.cover,
          title: currentGoods.title,
          price: currentGoods.price,
          num: targetNum,
          stock: currentGoods.stock
        })
      }
    }
    this.setData({
      communityCartList
    })
    this.getInitCar();
  },
  addCark: function () {
    let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
    let communityCartList = this.data.communityCartList;
    let currentIndex = -1;
    communityCartList.map((item, index) => {
      if (item.id == selectGoodsModelInfo.id && item.modelId == selectGoodsModelInfo.modelId) {
        currentIndex = index;
        return;
      }
    })
    if (currentIndex != -1) {
      communityCartList[currentIndex].num = selectGoodsModelInfo.buyCount;
    } else {
      communityCartList.push({
        id: selectGoodsModelInfo.id,
        imgurl: selectGoodsModelInfo.imgurl,
        modelId: selectGoodsModelInfo.modelId,
        title: selectGoodsModelInfo.title,
        models_text: selectGoodsModelInfo.models_text,
        price: selectGoodsModelInfo.price,
        num: selectGoodsModelInfo.buyCount,
        stock: selectGoodsModelInfo.stock
      })
    }
    this.setData({
      communityCartList
    })
    this.getInitCar();
    this.closeGoodModel();
  },
  isLogin: function () {
    let _this = this;
    if (app.getIsLogin()) {
      _this._previewPay();
    } else {
      app.goLogin({
        success: function () {
          _this._previewPay();
        }
      });
    }
  },
  _previewPay: function() {
    let _this = this;
    if(!_this.leader_token) {
      app.showModal({
        content: '暂无团长，无法购买商品',
        showCancel: true,
        cancelText: '取消',
        confirmText: '申请团长',
        confirm: function(res) {
          app.turnToPage('/communityGroup/pages/communityGroupApply/communityGroupApply');
        }
      })
      return;
    }
    _this._settlement();
  },
  _settlement: function () {
    let _this = this;
    let communityCartList = this.data.communityCartList;
    if (!communityCartList.length) {
      app.showModal({
        content: '购物袋暂无商品，请添加商品后再结算~'
      })
      return;
    }
    let a = communityCartList.map((item, index) => {
      return new Promise((resolve, reject) => {
        app.sendRequest({
          url: '/index.php?r=AppShop/addCart',
          method: 'post',
          hideLoading: true,
          data: {
            goods_id: item.id,
            model_id: item.modelId || '',
            num: item.num,
            dis_group_id: _this.group_id,
            leader_token: _this.leader_token
          },
          success: function (res) {
            item.buyCount = item.num;
            app.sendUseBehavior([{ goodsId: item.id }], 4);
            resolve(res);
          },
          successShowModalConfirm: function(){
            _this.deleteAllCart();
          }
        })
      })
    })
    Promise.all(a).then((res) => {
      this.setData({
        communityCartList: []
      })
      for(let i in communityCartList){
        communityCartList[i].id = res[i].data;
      }
      this.fromSubmit = true;
      let urlOptions = {
        cart_arr: communityCartList,
        group_id: _this.group_id
      }
      let pagePath = `/promotion/pages/communityGroupOrderSubmit/communityGroupOrderSubmit?group_id=${_this.group_id}`;
      app.turnToPage(pagePath, '', urlOptions);
    })
  },
  deleteAllCart: function () {
    app.sendRequest({
      url: '/index.php?r=AppShop/DeleteAllCart',
      data: {
        is_dis_group: 1
      }
    })
  },
  stopPropagation: function () { },
  stopMove: function () { return; },
  closeGoodModel: function () {
    this.setData({
      showModel: true
    })
  },
  isShowCark: function () {
    let showCark = !this.data.showCark
    this.setData({
      showCark: showCark
    })
    this.getInitCar();
  },
  goToHomepage: function (data) {
    let router = app.getHomepageRouter();
    app.reLaunch({
      url: '/pages/' + router + '/' + router
    });
  },
  plus: function (e) {
    if(!this.data.leaderInfo){
      app.showModal({
        content: '暂无团长，无法加入购物袋'
      })
      return;
    }
    let index = e.currentTarget.dataset.index;
    this.changeGoodsNum(index, 'plus');
  },
  reduce: function (e) {
    let index = e.currentTarget.dataset.index;
    this.changeGoodsNum(index, 'minus');
  },
  openLocation: function() {
    let latitude = +this.data.leaderInfo.latitude;
    let longitude = +this.data.leaderInfo.longitude;
    let name = this.data.leaderInfo.address_detail;
    app.openLocation({
      latitude,
      longitude,
      name,
      scale: 18
    })
  },
  getInitCar() {
    let shopCarNum = 0;
    let communityGoodsList = this.data.communityGoodsList;
    let communityCartList = this.data.communityCartList;
    communityCartList.map((item) => {
      shopCarNum += (+item.num);
    })
    for (let goods of communityGoodsList) {
      goods.form_data.number = 0;
      for (let item of communityCartList) {
        if (goods.id == item.id) {
          goods.form_data.number += +item.num;
        }
      }
    }
    this.setData({
      shopCarkNumber: shopCarNum,
      communityGoodsList: communityGoodsList,
    })
  },
  inputBuyCount: function (e) {
    this.setData({
      'selectGoodsModelInfo.buyCount': e.detail.value
    });
  },
  addGoods: function (e, number) {
    let index = e.currentTarget.dataset.index;
    let communityCartList = this.data.communityCartList;
    let currentGoods = communityCartList[index];
    let count = +currentGoods.num;
    let type = e.currentTarget.dataset.type;
    if (type == 'plus') {
      if (currentGoods.limit_num != 0 && count >= currentGoods.limit_num){
        app.showModal({
          content: '超过限购个数'
        })
        return;
      }
      count++
    } else if (type == 'minus') {
      count--
    } else {
      count = number
    }
    communityCartList[index].num = count;
    if (currentGoods.num == 0) {
      communityCartList.splice(index, 1);
    }
    this.setData({
      communityCartList
    })
    this.getInitCar();
  },
  getListCategory() {
    let _this = this
    app.sendRequest({
      url: '/index.php?r=AppData/ListCategory',
      hideLoading: true,
      data: {
        form: 'goods'
      },
      success: function (res) {
        if (res.data) {
          res.data.forEach(val => {
            val.choose = false; 
            val.choosed = false;
            val.subclass_choose = true;
          })
          _this.setData({
            listCategory: res.data
          })
        }
      }
    })
  },
  getALlGoods(e) {
    let _this = this
    _this.data.listCategory.forEach(val => {
      val.choose = false;
      val.choosed = false;
      val.subclass_choose = true;
      val.subclass.forEach(res => {
        res.choose = false
      })
    })
    _this.setData({
      listCategory: _this.data.listCategory,
      dialog: false,
      index: -1,
      ckeckIndex: -1,
    })
    this.initData();
  },
  getThisCategory(e) {
    let _this = this;
    let index = e.currentTarget.dataset.index;
    let subclass;
    this.page = 1;
    if (_this.data.listCategory[index].subclass.length > 0) {
      subclass = _this.data.listCategory[index].subclass
      let dialog, choosed
      if (_this.data.listCategory[index].choose == true) {
        dialog = !_this.data.dialog;
        choosed = !_this.data.listCategory[index].choosed
        _this.setData({
          dialog: dialog,
          ['listCategory[' + index + '].choosed']: choosed
        })
        return
      }
      if (_this.data.listCategory[index].choose == false && _this.data.dialog == false) {
        dialog = !_this.data.dialog;
        _this.setData({
          dialog: dialog
        })
      }
    }
    if (_this.data.listCategory[index].choose == true) {
      _this.setData({
        dialog: false
      })
      return
    }
    if (_this.data.listCategory[index].subclass.length == 0 && _this.data.listCategory[index].choose == false) {
      _this.setData({
        dialog: false
      })
      _this.data.listCategory.forEach(val => {
        val.choose = false;
        val.choosed = false;
      })
      _this.setData({
        listCategory: _this.data.listCategory,
        ['.listCategory[' + index + '].choose']: true,
        index: index,
        ckeckIndex : '',
      })
      this.initData();
      return
    }
    _this.data.listCategory.forEach(val => {
      val.choose = false;
      val.choosed = false;
    })
    _this.setData({
      listCategory: _this.data.listCategory,
      ['.listCategory[' + index + '].choose']: true,
      ['.listCategory[' + index + '].subclass_choose']: true,
      subclass: subclass,
      index: index,
      checkIndex: -1,
    })
    _this.data.subclass.forEach(val => {
      val.choose = false;
    })
    _this.setData({
      subclass: _this.data.subclass
    })
    this.initData()
  },
  getAllSubclass(e) {
    let _this = this
    let index = e.currentTarget.dataset.index;
    let subclass = this.data.subclass;
    let listCategory = this.data.listCategory;
    subclass.forEach(val => {
      val.choose = false;
    })
    if (!listCategory[index].subclass_choose){
      this.initData();
    }
    _this.setData({
      subclass,
      dialog: false,
      ['listCategory[' + index + '].choosed']: true,
      ['listCategory[' + index + '].subclass_choose']: true,
      ckeckIndex: -1,
    })
  },
  getThisCategorySubclass(e) {
    let index = e.currentTarget.dataset.index
    let ckeckIndex = e.currentTarget.dataset.ckeckIndex;
    let subclass = this.data.subclass;
    subclass.forEach(val => {
      val.choose = false;
    })
    this.setData({
      ['listCategory[' + index + '].subclass_choose']: false,
      ['listCategory[' + index + '].choosed']: true,
      [ 'subclass[' + ckeckIndex + '].choose']: true,
      subclass: subclass,
      ckeckIndex: ckeckIndex,
      dialog: false,
    })
    this.initData();
  },
  checkLeaderAgent() {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/CheckLeaderAgent',
      data: {
        leader_token: this.leader_token,
        group_id: this.group_id,
      },
      method: 'post',
      success: (res)=> {
        if (res.data != 0) {
          app.showModal({
            content: '团长已关闭该活动，如需购买，请联系团长开启',
            confirmText: '返回首页',
            confirm: function(res) {
              app.globalData.leaderInfo = ''; //活动已关闭，清空团长信息
              let homepageRouter = app.getHomepageRouter();
              app.turnToPage('/pages/' + homepageRouter + '/' + homepageRouter, true);
            },
          })
        }
      }
    })
  },
  clearCart: function(){
    app.sendRequest({
      url: '/index.php?r=AppShop/DeleteAllCart',
      data: {
        is_dis_group: 1
      }
    })
  },
})