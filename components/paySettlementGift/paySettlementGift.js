var app = getApp();
Component({
  properties: {
    franchisee: {
      type: String,
      value: ''
    },
    usageScene: {                             // 使用场景 0->基础 5->当面付
      type: String,
      value: '0'
    },
    orderPrice: {
      type: String,
      value: '0',
      observer: function (val) {
        const firstData = this.data.marketingData[0];
        const timer = setInterval(() => {    // 加定时器时，为了防止请求未完成，就调用该方法
          if (this.data.requestStatus) {
            clearInterval(timer);
            if (firstData && +firstData.stored_type === 1) {   // stored_type: 1 免单储值
              this.setData({
                'marketingData[0].price': val
              });
            }
            if (firstData && this.data.selectedIndex !== '') {
              const index = this.data.selectedIndex;
              const options = {
                id: this.data.activityId,
                item_id: this.data.marketingData[index]['item_id'],
                price: this.data.marketingData[this.data.selectedIndex]['price']
              }
              this.triggerEvent('selected', { options });
            }
          }
        }, 500);
      }
    }
  },
  data: {
    marketingType: 1,                        // 1->储值 2->付费卡
    style: 1,                                // 1->卡片样式 2->列表样式
    marketingData: [],
    selectedIndex: '',                       // 当前选中的索引
    activityId: '',
    isShowCardBenefit: false,                // 会员权益弹窗
    benefitIndex: 0,                         // 当前查看会员权益的索引
    requestStatus: 0,
  },
  ready: function (options) {
    this.getEffectActivity();
  },
  methods: {
    getEffectActivity: function () {        // 获取支付结算页活动详情
      app.sendRequest({
        url: '/index.php?r=PaySettlement/GetEffectActivity',
        method: 'post',
        hideLoading: true,
        data: {
          sub_app_id: this.data.franchisee
        },
        success: (res) => {
          const { data, status } = res;
          let options;
          if (status === 0) {
            const { marketing_type, selected, marketing_items, usage_scene, style, id } = data;
            const idx = !!+selected ? 0 : '';
            if (!id) { return; }
            if (!usage_scene.includes(this.data.usageScene)) { return; }
            if (!marketing_items.length) { return; }
            this.setData({
              activityId: id,
              marketingType: +marketing_type,
              style: +style,
              selectedIndex: idx
            })
            this.setMarketingItem(marketing_items || []);
          }
        },
        complete: () => {
          this.setData({
            requestStatus: 1
          })
        }
      })
    },
    setMarketingItem: function (data) {
      let newData = [];
      data.forEach((item) => {
        const { stored_type, discount_price, extra_data } = item;
        const { enable, month } = extra_data;
        const { benefits, benefitText } = this.setBenefitText(extra_data);
        if (+stored_type === 1 && +enable === 1) {
          item.condition = item.price;
          item.price = '0.00';
          item.discountText = '本单免单';
          item.benefitText = benefitText;
          item.benefits = benefits;
          newData.push(item);
        }
        if (+stored_type === 0) {
          item.price = (+item.price).toFixed(2);
          item.discountText = '立减' + discount_price + '元';
          item.benefitText = benefitText;
          item.benefits = benefits;
          if (this.data.marketingType === 2) {
            item.month = month;
          }
          newData.push(item);
        }
      });
      this.setData({
        marketingData: newData
      })
      this.sendInfo();
    },
    setBenefitText: function (data) {
      let benefits = [];
      let benefitText = [];
      const { discount, g_coupon_list, g_integral, g_price, g_vip_card, is_free_postage } = data;
      if (discount && +discount !== 0) {
        benefits.push({ type: '折扣', text: `所有商品一律${discount}折` });
        benefitText.push(`商品${discount}折`);
      }
      if (g_integral && +g_integral > 0) {
        benefits.push({ type: '积分', text: `赠送${g_integral}积分` });
        benefitText.push(`${g_integral}积分`);
      }
      if (g_price && +g_price > 0) {
        benefits.push({ type: '储值', text: `赠送储值${g_price}元` });
        benefitText.push(`${g_price}元储值`);
      }
      if (g_vip_card) {
        benefits.push({ type: '会员卡', text: `赠送一张${g_vip_card.title}` });
        benefitText.push(`一张${g_vip_card.title}`);
      }
      if (g_coupon_list && g_coupon_list.length > 0) {
        g_coupon_list.forEach((v, i) => {
          benefits.push({
            type: i === 0 ? '优惠券' : '',
            text: `赠送${v.num}张${v.title}`
          });
          benefitText.push(`${v.num}张${v.title}`);
        });
      }
      if (+is_free_postage) {
        benefits.push({ type: '包邮', text: '所有商品包邮' });
        benefitText.push(`商品包邮`);
      }
      if (benefitText.length) {
        benefitText[0] = '赠送' + benefitText[0];
      }
      benefitText = benefitText.join('、');
      return {
        benefits,
        benefitText
      };
    },
    selectItem: function (e) {
      let { index } = e.currentTarget.dataset;
      let options = {}
      if (index === this.data.selectedIndex) {
        index = '';
      } else {
        options = {
          id: this.data.activityId,
          item_id: this.data.marketingData[index]['item_id'],
          price: this.data.marketingData[index]['price']
        }
      }
      this.setData({
        selectedIndex: index,
      })
      this.triggerEvent('selected', { options });
    },
    showCardBenefit: function (e) {
      let index = e.currentTarget.dataset.index;
      index = index === undefined ? this.data.benefitIndex : index;
      if (!this.data.marketingData[index].benefitText) { return; }
      this.setData({
        isShowCardBenefit: !this.data.isShowCardBenefit,
        benefitIndex: index
      })
    },
    stopPropagation() {
    },
    sendInfo: function () {
      let paySettingInfo = {
        isOpen: this.data.marketingData.length,
        type: this.data.marketingType,
      };
      this.triggerEvent('paySetting', paySettingInfo);
    }
  }
})
