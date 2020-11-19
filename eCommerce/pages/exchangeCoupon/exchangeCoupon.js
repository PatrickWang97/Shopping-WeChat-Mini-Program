const app = getApp();
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '积分兑换优惠券列表',
    },
    couponList: [], // 积分优惠券
    couponStatus: {
      page: 1,
      isLoading: false, // 是否在加载
      noMore: false, // 没有积分兑换券
      loadingFail: false, // 获取积分优惠券失败
    },
  },
  onLoad: function (options) {
    this.getIntegralExchangeCoupons();
  },
  onReachBottom: function (e) {
    this.getIntegralExchangeCoupons();
  },
  getIntegralExchangeCoupons: function () {
    let that = this;
    let {
      couponStatus: {
        page,
        isLoading,
        noMore,
        loadingFail
      },
      couponList
    } = this.data;
    let params = {
      in_show_list: 1,
      enable_status: 1,
      stock: 1,
      exchangeable: 1,
      page: page,
      page_size: 10,
      category: [0, 1]
    };
    let url = '/index.php?r=AppCoupon/GetExchangeCouponList';
    if (isLoading || noMore) {
      return;
    }
    this.setData({
      'couponStatus.isLoading': true
    })
    if (loadingFail) {
      this.setData({
        'couponStatus.loadingFail': false
      });
    }
    this.getCurrentLatLng().then((location) => {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      app.sendRequest({
        hideLoading: true,
        url: url,
        data: params,
        method: 'post',
        success: function (res) {
          if (res.status == 0 && Array.isArray(res.data) && res.data[0]) {
            let data = [];
            res.data.forEach((item) => {
              let coupons = item.coupon_info;
              let isCompose = coupons.length > 1;
              let distance = that.transferDistance(item.distance);
              coupons.forEach((coupon) => {
                coupon.distance = distance;
                coupon.is_compose = isCompose;
                coupon.compose_id = item.id;
                return coupon;
              });
              data = data.concat(coupons);
            });
            if (page > 1) {
              couponList = couponList.concat(data);
            }else {
              couponList = data;
            }
            that.setData({
              couponList: couponList
            });
          }
          that.setData({
            'couponStatus.noMore': !!(res.is_more - 1),
            'couponStatus.isLoading': false,
            'couponStatus.page': page + 1
          });
        },
        fail: function () {
          that.setData({
            'couponStatus.loadingFail': true,
            'couponStatus.isLoading': false, 
            'couponStatus.noMore': true
          });
        }
      });
    })
  },
  getCurrentLatLng: function () {
    return new Promise((resolve, reject) => {
      if (app.globalData.locationInfo.latitude) {
        resolve(app.globalData.locationInfo);
      } else {
        app.getLocation({
          success: resolve,
          fail: reject
        })
      }
    });
  },
  getExchangeCoupon: function (event) {
    let dataset = event.currentTarget.dataset;
    let composeId = dataset.composeId;
    let url = '/exchangeCoupon/pages/exchangeCouponDetail/exchangeCouponDetail?id=' + composeId;
    app.turnToPage(url, false);
  },
  transferDistance: function (dis) {
    if (!dis) {
      return '';
    }
    return Math.round(dis / 10) / 100 + '千米';
  },
  gotoCouponDetail: function (event) {
    let dataset = event.currentTarget.dataset;
    let composeId = dataset.composeId;
    let url = '/exchangeCoupon/pages/exchangeCouponDetail/exchangeCouponDetail?id=' + composeId;
    app.turnToPage(url, false);
  },
})