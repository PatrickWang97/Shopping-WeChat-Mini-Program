var app = getApp()
Page({
  data: {
    orderInfoStatus: '',
    is_vip_goods: '',
    goodsList: [],
    refundTypeData: [{ 'title': '未收到货物/拒收货物（申请全额退款）'},
      { 'title': '已收到货物，不退货，仅退款（申请部分退款）'},
      { 'title': '已收到货物，可部分退款（申请部分退款）'}],
    refundReasonData: [{ 'title': '多拍/拍错/不想要'},
      { 'title': '快递延期'},
      { 'title': '未按约定时间发货'},
      { 'title': '快递记录出错'},
      { 'title': '内容与描述不符'},
      { 'title': '其它'}],
    refundWayData: [{ 'title': '原付款方式退回'},
      { 'title': '退还为储值金'}],
    refundJourneyReasonData: [{ 'title': '未保持餐品完整' },
      { 'title': '骑手服务态度恶劣' },
      { 'title': '骑手额外索取费用' },
      { 'title': '骑手诱导退单' },
      { 'title': '骑手提前点击送达' },
      { 'title': '骑手虚假标记异常' },
      { 'title': '少餐错餐' }],
    showRefundType: true,
    showRefundReason: true,
    showRefundWay: true,
    typeIndex: '',
    reasonIndex: '',
    wayIndex: '',
    imagesArr: [],
    express: '',
    maxRefundPrice: '',
    refundPrice: '',
    refundDes: '',
    isShowPayInstruct: true,
    is_group_buy_order: 0,
    sameCity: 0,
  },
  isLoading: false, //防止重复提交
  orderId: '',
  franchiseeId: '',
  origin: '',
  applyRefundId: '',
  refundGoods: [],
  onLoad: function (options) {
    this.orderId = options.orderId;
    this.franchiseeId = options.franchisee || '';
    this.origin = options.type;
    this.dataInitial();
  },
  onShow: function () {
  },
  dataInitial: function () {
    this.getAppECStoreConfig();
    if (this.origin == 'apply'){
      let data = getCurrentPages()[getCurrentPages().length - 2].data.goodsList;
      let goodsList = [];
      let refundGoods = [];
      for (let i = 0; i < data.length;i++){
        if (data[i].selected){
          goodsList.push(data[i]);
          refundGoods.push({
            goods_id: data[i].goods_id,
            model_id: data[i].model_id,
            num: data[i].preview_refund_num,
            cursor: data[i].cursor || '',
            attributes_id: data[i].attributes_id
          })
        }
      }
      this.setData({
        goodsList: goodsList
      })
      this.refundGoods = refundGoods;
      this.calculateRefundPrice();
    }
    this.getOrderDetail();
  },
  getOrderDetail: function () {
    var _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let formData = res.data[0].form_data;
        let is_vip_goods = res.data[0].vip_cut_price == 0 ? 0 : 1;
        let deliverType = formData.ecommerce_info.intra_city_data && formData.ecommerce_info.intra_city_data.deliver_type || 0;
        let pickUpType = formData.pick_up_type;
        let sameCity = 0;
        if (formData.wx_local_express_order) {
          sameCity = 1;
        }
        if (_this.origin == 'editor'){
          let refundGoods = formData.refund_apply.refund_goods;
          for (let j = 0; j < refundGoods.length; j++) {
            if (refundGoods[j].is_package_goods == 1) {
              refundGoods[j].showPackageInfo = false;
            }
            if (!Array.isArray(refundGoods[j].package_goods)) {
              refundGoods[j].package_goods = [];
            }
            if (refundGoods[j].attributes) {
              for (let attr in refundGoods[j].attributes) {
                for (let _goods in refundGoods[j].attributes[attr].goods_list) {
                  refundGoods[j].package_goods.push(refundGoods[j].attributes[attr].goods_list[_goods])
                }
              }
            }
            refundGoods[j].goods_name = refundGoods[j].title;
            refundGoods[j].preview_refund_num = refundGoods[j].num;
            refundGoods[j].model_value = refundGoods[j].model_name;
          }
          _this.setData({
            goodsList: refundGoods,
            typeIndex: formData.refund_apply.refund_type,
            reasonIndex: formData.refund_apply.refund_reason,
            wayIndex: formData.refund_apply.refund_mode,
            imagesArr: formData.refund_apply.img_url || [],
            refundDes: formData.refund_apply.description,
            refundPrice: formData.refund_apply.refund_price
          })
          _this.applyRefundId = formData.refund_apply.id;
          _this.refundGoods = refundGoods;
          _this.calculateRefundPrice();
        }
        _this.setData({
          orignalStatus: formData.refund_info && formData.refund_info.orignal_status || '',
          orderInfoStatus: formData.status,
          is_group_buy_order: formData.is_group_buy_order || 0,
          is_vip_goods: is_vip_goods,
          pickUpType: pickUpType,
          deliveryStatus: formData.ecommerce_info.ecommerce_transport_order && formData.ecommerce_info.ecommerce_transport_order.status || '',
          sameCity: sameCity
        })
        _this.getRefundConfigByPickUpType(formData.pick_up_type);
        if (pickUpType == 2){
          _this.getBuyerCancelReason(deliverType);
        }
      }
    })
  },
  calculateRefundPrice: function(type){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/calculateRefundPrice',
      method: 'post',
      data: {
        order_id: _this.orderId,
        refund_goods: _this.refundGoods,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let newData = {
          express: res.data.has_express,
          maxRefundPrice: res.data.refund_goods_price
        };
        _this.origin == 'editor' ? '' : newData['refundPrice'] = res.data.refund_goods_price;
        _this.setData(newData);
      }
    })
  },
  closeRefundBox: function () {
    this.setData({
      showRefundType: true,
      showRefundReason: true,
      showRefundWay: true
    })
  },
  showRefundBox: function (event) {
    let _this = this;
    let type = event.currentTarget.dataset.type;
    let newData = {};
    switch(type){
      case 'type': 
        newData.showRefundType = false;
        break;
      case 'reason':
        if (_this.data.typeIndex !== ''){
          newData.showRefundReason = false;
        }
        break;
      case 'way':
        if (_this.data.typeIndex !== '' && _this.data.reasonIndex !== '') {
          newData.showRefundWay = false;
        }
        break;
    }
    this.setData(newData)
  },
  selectReason: function (event) {
    let type = event.currentTarget.dataset.type;
    let index = event.currentTarget.dataset.index;
    let newData = {};
    let _this = this;
    switch (type){
      case 'type':
        newData.typeIndex = index;
        if (index == 0){
          newData.refundPrice = _this.data.maxRefundPrice;
        }
        newData.showRefundType = true;
        newData.showRefundReason = false;
        break;
      case 'reason':
        newData.reasonIndex = index;
        newData.showRefundReason = true;
        newData.showRefundWay = false;
        break;
      case 'way':
        newData.wayIndex = index;
        newData.showRefundWay = true
        break;  
    }
    this.setData(newData);
  },
  chooseImage: function () {
    let _this = this;
    let img_arr = _this.data.imagesArr || [];
    app.chooseImage(function (images) {
      let data = {};
      data.imagesArr = img_arr.concat(images);
      _this.setData(data);
    }, 8 - img_arr.length);
  },
  deleteImage: function (event) {
    let picIndex = event.currentTarget.dataset.index;
    let img_arr = this.data.imagesArr;
    let data = {};
    img_arr.splice(picIndex, 1);
    data.imagesArr = img_arr;
    this.setData(data);
  },
  previewImage: function (event){
    let _this = this;
    let index = event.currentTarget.dataset.index;
    app.previewImage({
      current: _this.data.imagesArr[index],
      urls: _this.data.imagesArr
    })
  },
  prevRefundBox: function (event) {
    let type = event.currentTarget.dataset.type;
    let newData = {};
    switch(type){
      case 'reason':
        newData.showRefundType = false;
        newData.showRefundReason = true;
        break;
      case 'way':
        newData.showRefundReason = false;
        newData.showRefundWay = true;
        break;
    }
    this.setData(newData);
  },
  cancelRefund: function () {
    app.turnBack();
  },
  stopPropagation: function (event) {
  },
  changeRefundPrice: function (event) {
    this.setData({
      refundPrice: event.detail.value
    })
  },
  inputRefundDes: function (event){
    this.setData({
      refundDes: event.detail.value
    })
  },
  sureRefund: function(){
    let _this = this;
    if (_this.data.typeIndex === ''){
      app.showModal({
        content: '请填写退款类型'
      })
      return;
    }
    if (_this.data.reasonIndex === '') {
      app.showModal({
        content: '请填写退款原因'
      })
      return;
    }
    if (_this.data.wayIndex === '') {
      app.showModal({
        content: '请填写退款方式'
      })
      return;
    }
    if (_this.data.refund_price <= 0) {
      app.showModal({
        content: '退款金额有误'
      })
      return;
    }
    if(_this.isLoading){return}
    _this.isLoading = false;
    app.sendRequest({
      url: '/index.php?r=appShop/applyRefund',
      method: 'post',
      data: {
        sub_shop_app_id: _this.franchiseeId,
        apply_id: _this.applyRefundId,
        order_id: _this.orderId,
        refund_price: _this.data.refundPrice,
        refund_goods: _this.refundGoods,
        refund_type: _this.data.typeIndex,
        refund_reason: _this.data.reasonIndex,
        refund_mode: _this.data.wayIndex,
        description: _this.data.refundDes.replace(/\n|\r\n/g, '<br />'),
        img_url: _this.data.imagesArr
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: _this.orderId,}],6); // 申请退款
        app.requestSubscribeMessage([
          {type: 2,obj_id: _this.orderId}, 
          {type: 4,obj_id: _this.orderId}
        ]).then(() => {
          if (_this.origin == 'apply') {
            app.turnBack({
              delta: 2
            });
          } else {
            app.turnBack();
          }
        })
      },
      complete: function () {
        _this.isLoading = false;
      }
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  },
  closeMask: function(){
    this.setData({
      isShowInstructionMask: false
    })
  },
  checkInstruction: function(){
    this.setData({
      isShowInstructionMask: true
    })
  },
  hidePaymentInstruct: function(){
    this.setData({
      isShowPayInstruct: false
    })
  },
  getRefundConfigByPickUpType: function (type) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getRefundConfigByPickUpType',
      data: {
        sub_shop_app_id: _this.franchiseeId,
        pick_up_type: type
      },
      success: function (res) {
        let data = res.data.config_data;
        _this.setData({
          refundWithGoods: data.refund_with_goods,
          isFullRefund: data.is_full_refund,
          refundTobalance: data.refund_to_balance,
          contactPhone: data.address ? data.address.phone : ''
        })
      }
    })
  },
  getBuyerCancelReason: function(type){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getBuyerCancelReason',
      data: {
        deliver_type: type
      },
      success: function (res) {
        let data = res.data;
        let refundJourneyReasonData = [];
        for(let i in data){
          refundJourneyReasonData.push({
            title: data[i]
          })
        }
        _this.setData({
          refundJourneyReasonData: refundJourneyReasonData
        })
      }
    })
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