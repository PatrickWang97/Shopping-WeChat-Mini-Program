var app = getApp()
Page({
  data: {
    artivityList: [],
    franchisee: '',
    statusOptions: {
      '-1': { label: '未开始' },
      '0': { label: '进行中', className: 'active' },
      '1': { label: '已结束' },
      '2': { label: '即将开始', className: 'begin' }
    }
  },
  onLoad: function (options) {
    let franchisee = options.franchisee || '';
    this.setData({
      franchisee: franchisee
    });
    this.getStoreBenefitActivityList();
  },
  getStoreBenefitActivityList: function () {
    app.sendRequest({
      url: '/index.php?r=AppStoreBenefit/GetStoreBenefitActivityList',
      method: 'post',
      data: {
        sub_shop_app_id: this.data.franchisee
      },
      success: (res) => {
        const { status, data } = res;
        if (status === 0) {
          let activitys = [];
          data.forEach((val) => {
            const { activity_start_date, activity_end_date, expired, rule_titles, periods } = val;
            val.activity_start_date = activity_start_date.substr(0, 10);
            val.activity_end_date = activity_end_date.substr(0, 10);
            if (val.activity_rules && val.activity_rules.length > 0) {
              const { discount_price, discount_limit } = val.activity_rules[val.activity_rules.length - 1];
              if (discount_limit == -1) {
                val.max_discount_price = discount_price;
              } else {
                val.max_discount_price = (discount_price * discount_limit) % 1 === 0 ? discount_price * discount_limit : (discount_price * discount_limit).toFixed(2);
              }
            }
            if (activity_end_date.indexOf('9999') !== -1) { val.activity_end_date = '长期'; }
            if (!Object.keys(this.data.statusOptions).includes('' + expired)) {         // 订单不在statusOptions中，默认为已结束
              val.expired = 1;
            }
            if (rule_titles.length) {
              val.rule_titles = rule_titles.map((ruleItem) => {
                ruleItem = ruleItem.replace(/<br>/g, '\n');
                return ruleItem;
              })
            }
            if(periods.length){
              val.periodsText = periods.join(';');
            }
            if (expired != 1) { activitys.push(val); }
          })
          const activity0 = activitys.filter((v) => v.expired == 0);
          const activity2 = activitys.filter((v) => v.expired == 2);
          const activity1 = activitys.filter((v) => v.expired == -1);
          const newActivitys = activity0.concat(activity2, activity1);
          this.setData({
            artivityList: newActivitys
          })
        }
      }
    })
  }
})
