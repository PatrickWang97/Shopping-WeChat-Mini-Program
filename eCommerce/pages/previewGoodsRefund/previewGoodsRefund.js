var app = getApp()
Page({
  data: {
    goodsList: [],
    selectAll: true,
    is_vip_goods: '',
    dining_partner_source: 0  //餐饮三方订单标识 (1==客如云订单)
  },
  orderId: '',
  franchiseeId: '',
  onLoad: function(options){
    this.orderId = options.orderId;
    this.franchiseeId = options.franchisee;
    this.getOrderDetail();
  },
  onShow: function(){
    this.getAppECStoreConfig();
  },
  getOrderDetail: function () {
    var _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let goodsData = res.data[0].form_data.goods_info;
        let is_vip_goods = res.data[0].vip_cut_price == 0 ? 0 : 1;
        for (let i = 0; i < goodsData.length;i++){
          if (goodsData[i].is_package_goods == 1) {
            goodsData[i].showPackageInfo = false;
          }
          if (!Array.isArray(goodsData[i].package_goods)) {
            goodsData[i].package_goods = [];
          }
          if (goodsData[i].attributes) {
            for (let attr in goodsData[i].attributes) {
              for (let _goods in goodsData[i].attributes[attr].goods_list) {
                goodsData[i].package_goods.push(goodsData[i].attributes[attr].goods_list[_goods])
              }
            }
          }
          goodsData[i].preview_refund_num = goodsData[i].num - (goodsData[i].refunded_num || '0');
          goodsData[i].preview_refund_num > 0 && goodsData[i].is_benefit_goods != 1 ? goodsData[i].selected = true : '';
          goodsData[i].model_value_str = goodsData[i].model_value ? goodsData[i].model_value.join('； ') : '';
        }
        _this.setData({
          is_vip_goods: is_vip_goods,
          goodsList: goodsData,
          is_group_buy_order: res.data[0].form_data.is_group_buy_order || 0,
          dining_partner_source: res.data[0].form_data.dining_partner_source || 0
        })
      }
    })
  },
  clickSelectAll: function(){
    if (this.data.dining_partner_source){
      return;
    }
    var alreadySelect = this.data.selectAll,
        list = this.data.goodsList;
    if(alreadySelect){
      for (var i = list.length - 1; i >= 0; i--) {
        list[i].selected = false;
      }
    } else {
      for (var i = list.length - 1; i >= 0; i--) {
        if (list[i].preview_refund_num > 0 && list[i].is_benefit_goods != 1){
          list[i].selected = true;
        } 
      }
    }
    this.setData({
      selectAll: !alreadySelect,
      goodsList: list
    })
  },
  clickSelectGoods: function(e){
    if (this.data.dining_partner_source){
      return;
    }
    var index = e.currentTarget.dataset.index,
        list = this.data.goodsList,
        selectAll = true;
    list[index].selected = !list[index].selected;
    for (var i = list.length - 1; i >= 0; i--) {
      if(!list[i].selected){
        selectAll = false;
        break;
      }
    }
    this.setData({
      goodsList: list,
      selectAll: selectAll
    })
  },
  sureRefund: function() {
    let orderId = this.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsRefundPage/goodsRefundPage?type=apply&orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    let goodsList = this.data.goodsList;
    let flag = true;
    for (let i = 0; i < goodsList.length;i++){
      if (goodsList[i].selected){
        flag = false;
      }
    }
    if(flag){
      app.showModal({
        content: '请选择需要退款的商品'
      })  
      return
    }
    app.turnToPage(pagePath);
  },
  clickMinusButton: function(e){
    let index = e.currentTarget.dataset.index;
    let previewRefundNum = this.data.goodsList[index].preview_refund_num;
    if (previewRefundNum - 1 < this.data.goodsList[index].min_sales_nums || previewRefundNum - 1 <= 0){return};
    if (this.data.dining_partner_source) {
      return;
    }
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function(e){
    let index = e.currentTarget.dataset.index;
    let previewRefundNum = this.data.goodsList[index].preview_refund_num;
    let maxRefundNum = this.data.goodsList[index].num - (this.data.goodsList[index].refunded_num || '0');
    if (previewRefundNum + 1 > maxRefundNum){return};
    if (this.data.dining_partner_source) {
      return;
    }
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type){
    let currentGoods = this.data.goodsList[index];
    let canRefundNum = Number(currentGoods.preview_refund_num);
    let value = Number(currentGoods.min_sales_nums == 0 ? 1 : currentGoods.min_sales_nums);
    let targetNum = canRefundNum;
    if (type == 'plus') {
      if (canRefundNum == (currentGoods.num - value)) {
        targetNum = canRefundNum + value;
      }else {
        targetNum ++;
      }
    }else {
      if (currentGoods.min_sales_nums == 0) {
        targetNum--;
      }else { // 有起卖数
        if (currentGoods.num == canRefundNum) {
          targetNum = canRefundNum - value;
        }else {
          targetNum --;
        }
      }
    }
    let data = {};
    data['goodsList[' + index + '].preview_refund_num'] = targetNum;
    this.setData(data);
  },
  inputGoodsCount: function(e){
    let index = e.target.dataset.index;
    let previewRefundNum = e.detail.value;
    let data = {};
    let maxRefundNum = this.data.goodsList[index].num - (this.data.goodsList[index].refunded_num || '0');
    if (previewRefundNum == '') {return;}
    if (previewRefundNum == 0) {
      app.showModal({
        content: '请输入大于0的数字',
      })
      return;
    }
    if (previewRefundNum > maxRefundNum){
      app.showModal({
        content: '当前输入数量大于可退款数量',
      })
      return;
    }
    data['goodsList[' + index + '].preview_refund_num'] = previewRefundNum;
    this.setData(data);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  },
  showPackageInfoFn: function (e) { // 展示商品套餐详情
    let status = e.currentTarget.dataset.status;
    let index = e.currentTarget.dataset.index;
    let goodsList = this.data.goodsList;
    goodsList[index].showPackageInfo = status == 1 ? true : false;
    this.setData({
      goodsList: goodsList
    })
  },
})
