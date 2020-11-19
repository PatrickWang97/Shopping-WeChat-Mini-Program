const app = getApp()
Page({
  data: {
    orderInfoStatus: '',  // 订单退款状态
    isVipGoods: '',       // 是否是会员商品
    goodsInfo: {},        // 退款商品
    imagesArr: [],        // 退款说明图
    maxRefundPrice: '',   // 最多可退金额
    refundPrice: '',      // 退款金额
    refundDes: '',        // 退款说明
  },
  isLoading: false, // 防止重复提交
  orderId: '',      // 订单ID
  franchiseeId: '', // 子店ID
  origin: '',       // 退款来源 申请还是编辑
  applyRefundId: '',// 退款ID
  refundGoods: [],  // 退款的商品
  onLoad: function (options) {
    this.orderId = options.orderId;
    this.franchiseeId = options.franchisee || '';
    this.origin = options.type;
    this.setData({
      origin: this.origin
    });
    this.dataInitial();
  },
  dataInitial: function () {
    this.getAppECStoreConfig();
    if (this.origin == 'apply'){
      let prePageData = getCurrentPages()[getCurrentPages().length - 2].data.orderInfo;
      let goodsInfo = prePageData.goods_info[0];
      goodsInfo['valid_date_str'] = this.returnValidDate(goodsInfo);
      let refundableNum = goodsInfo['num'] - (goodsInfo.refunded_num || 0) - (goodsInfo['_electronic']['buyer_accepted_num'] || 0) - (goodsInfo['_electronic']['buyer_verified_num'] || 0);
      let refundGoods = {
        goods_id: goodsInfo.goods_id,
        model_id: goodsInfo.model_id,
        num: refundableNum,
        cursor: goodsInfo.cursor || '',
        attributes_id: goodsInfo.attributes_id
      };
      this.setData({
        goodsInfo: goodsInfo,
        refundGoods: refundGoods,
        maxNum: refundableNum
      });
      this.calculateRefundPrice();
    }
    this.getOrderDetail();
  },
  getOrderDetail: function () {
    let _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let formData = res.data[0].form_data;
        let isVipGoods = res.data[0].vip_cut_price == 0 ? 0 : 1;
        if (_this.origin == 'editor'){
          let refundGoods = formData.refund_apply.refund_goods;
          for (let i = 0; i < refundGoods.length; i++) {
            if (refundGoods[i].is_package_goods == 1) {
              refundGoods[i].showPackageInfo = false;
            }
            if (!Array.isArray(refundGoods[i].package_goods)) {
              refundGoods[i].package_goods = [];
            }
            if (refundGoods[i].attributes) {
              for (let attr in refundGoods[i].attributes) {
                for (let _goods in refundGoods[i].attributes[attr].goods_list) {
                  refundGoods[i].package_goods.push(refundGoods[i].attributes[attr].goods_list[_goods])
                }
              }
            }
            refundGoods[i].goods_name = refundGoods[i].title;
            refundGoods[i].preview_refund_num = refundGoods[i].num;
            refundGoods[i].model_value = refundGoods[i].model_name;
          }
          let goodsInfo = formData.goods_info[0];
          formData.goods_info[0]['valid_date_str'] = _this.returnValidDate(goodsInfo);
          let refundableNum = goodsInfo['num'] - (goodsInfo.refunded_num || 0) - (goodsInfo['_electronic']['buyer_accepted_num'] || 0) - (goodsInfo['_electronic']['buyer_verified_num'] || 0);
          _this.setData({
            goodsInfo: formData.goods_info[0],
            refundGoods: {
              goods_id: refundGoods[0].goods_id,
              model_id: refundGoods[0].model_id,
              num: refundGoods[0].num,
              cursor: refundGoods[0].cursor || '',
              attributes_id: refundGoods[0].attributes_id
            },
            imagesArr: formData.refund_apply.img_url || [],
            refundDes: formData.refund_apply.description,
            refundPrice: formData.refund_apply.refund_price,
            maxNum: refundableNum
          })
          _this.applyRefundId = formData.refund_apply.id;
          _this.calculateRefundPrice();
        }
        _this.setData({
          orderInfoStatus: formData.status,
          isVipGoods: isVipGoods,
        });
      }
    })
  },
  clickMinusButton: function () {
    let { refundGoods } = this.data;
    let targetNum = +refundGoods.num - 1;
    if (targetNum < 1) return;
    this.setData({
      'refundGoods.num': targetNum
    });
    this.calculateRefundPrice();
  },
  clickPlusButton: function () {
    let that = this;
    let { maxNum, refundGoods } = this.data;
    let targetNum = +refundGoods.num + 1;
    if (targetNum > maxNum) {
      app.showModal({
        content: '不得大于可退最大数',
        confirm: function () {
          that.setData({
            'refundGoods.num': maxNum
          });
        }
      });
      return;
    }
    this.setData({
      'refundGoods.num': targetNum
    });
    this.calculateRefundPrice();
  },
  inputGoodsCount: function (e) {
    let that = this;
    let value = +e.detail.value;
    let { maxNum } = this.data;
    if (isNaN(value) || value <= 0) {
      return;
    }
    if (value > maxNum) {
      app.showModal({
        content: '不得大于可退最大数',
        confirm: function () {
          that.setData({
            'refundGoods.num': maxNum
          });
        }
      });
      return;
    }
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      that.setData({
        'refundGoods.num': value
      });
    }, 500);
    that.calculateRefundPrice();
  },
  calculateRefundPrice: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/calculateRefundPrice',
      method: 'post',
      data: {
        order_id: _this.orderId,
        refund_goods: [_this.data.refundGoods],
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let newData = {
          maxRefundPrice: res.data.refund_goods_price
        };
        newData['refundPrice'] = res.data.refund_goods_price;
        _this.setData(newData);
      }
    })
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
  stopPropagation: function (event) {
  },
  inputRefundDes: function (event){
    this.setData({
      refundDes: event.detail.value
    })
  },
  sureRefund: function(){
    let _this = this;
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
        refund_goods: [_this.data.refundGoods],
        description: _this.data.refundDes.replace(/\n|\r\n/g, '<br />'),
        img_url: _this.data.imagesArr
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: _this.orderId,}],6); // 申请退款
        app.requestSubscribeMessage([
          {type: 2,obj_id: _this.orderId}, 
          {type: 4,obj_id: _this.orderId}
        ]).then(() => {
          app.turnBack();
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
  returnValidDate: function(goodsInfo) {
    let tempStr = '';
    tempStr = goodsInfo.valid_date_type == 1 ? '永久有效' : `${goodsInfo.valid_start_date}至${goodsInfo.valid_end_date}`;
    return tempStr;
  },
})