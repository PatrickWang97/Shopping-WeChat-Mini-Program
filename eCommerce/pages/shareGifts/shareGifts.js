var app = getApp();
var util = require('../../../utils/util.js')
Page({
  data: {
    is_select: false,
    is_over: false,
    isMultiple: false,
    rebateNum: 0,
    activity_rewards: {},
    extra_times_limit: {},
    times_limit: {},
    recv_limit: 0,
    type: '',
    surplus_times: 0
  },
  onLoad: function(options) {
    this.setData({
      ids: options.ids || '',
      extraIds: options.extraIds || ''
    });
    this.getEffectActivity();
    this.getRewards(true);
  },
  getEffectActivity: function() {
    var that = this,
      type = '';
    app.sendRequest({
      url: '/index.php?r=ShareGiftActivity/GetEffectActivity',
      success: function(res) {
        let data = res.data;
        let start_time = util.formatTimeYMD(data.start_time,'YYYY.MM.DD');
        let end_time = util.formatTimeYMD(data.end_time, 'YYYY.MM.DD');
        that.setData({
          rebateNum: 0,
          description:1,
          activity_rewards: data.extra_rewards,
          times_limit: data.times_limit,
          extra_times_limit: data.extra_times_limit,
          recv_limit: data.recv_limit,
          type: data.immediately,
          surplus_times: data.surplus_times,
          immediately: data.immediately, 
          start_time: start_time,
          end_time: end_time,
          long_term: data.long_term,
          extra_reward_type_value: data.extra_reward_type_value,
          extra_reward_type: data.extra_reward_type
        })
      }
    })
  },
  getRewards: function(isInit) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=ShareGiftActivity/CanRecvRewards',
      data: {
        appoint_ids: that.data.ids,
        extra_appoint_ids: that.data.extraIds
      },
      success: function(res) {
        if (res.data) {
          let data = res.data;
          let extra = data.extra_rewards[0] || '';
          if (extra) {
            extra = that.typeClassify(extra.type, extra);
          }
          for (var index in data.rewards) {
            let g = data.rewards[index];
            g = that.typeClassify(g.type, g);
          }
          that.setData({
            extra_rewards: extra 
          });
          that.loadRewards(isInit , data);
        }
      }
    })
  },
  loadRewards: function(isInit, data) {
    let that = this,
      gifts = data.rewards || [],
      giftsLen = gifts.length,
      recv_chance = data.recv_chance,
      recv_limit = data.recv_limit,
      share_persons = data.share_persons,
      isMultiple = that.data.isMultiple,
      giftsModal;
    if (isInit) {
      if (recv_chance > 1 && recv_limit == 1 && giftsLen > 1) {
        isMultiple = true;
      }
    }
    for (var index in gifts) {
      let f = gifts[index];
      f.times = 0;
      f.is_select = false;
      if (isInit) {
        gifts[index].giftsModal = (recv_limit == 0 || gifts.length == 1 ? '0' : (recv_chance > 1 ? '2' : '1'));
        gifts[index].is_select = false;
        if (gifts[index].type == 1) {
          if (gifts[index].stock == 0) {
            gifts[index].is_hide = true;
          } else {
            gifts[index].is_hide = false;
          }
        }
      } else {
        gifts[index].giftsModal = that.data.gifts[index].giftsModal;
        gifts[index].is_select = that.data.gifts[index].is_select;
        if (gifts[index].type == 1) {
          if (that.data.gifts[index].is_hide == true) {
            gifts[index].is_hide = true;
          } else {
            gifts[index].is_hide = false;
          }
        }
      }
      that.typeClassify(f.type, f)
    }
    that.setData({
      gifts: gifts,
      giftslen: giftsLen,
      share_persons: share_persons,
      isMultiple: isMultiple,
      rebateNum: 0,
      showModal: true,
      recv_chance: recv_chance,
      recv_limit: recv_limit,
      callback: ''
    })
  },
  typeClassify: function(type, f) {
    switch (type) {
      case "1":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/coupon.png';
        f.path = '/eCommerce/pages/couponList/couponList';
        break;
      case "2":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/integral.png';
        f.path = '/userCenter/pages/myIntegral/myIntegral';
        break;
      case "3":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/balance.png';
        f.path = '/eCommerce/pages/balance/balance';
        break;
      case "4":
      case "5":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/vip-card.png';
        f.path = '/eCommerce/pages/vipBenefits/vipBenefits';
        break;
      case "6":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/collect.png';
        f.path = '/awardManagement/pages/collectStars/collectStars';
        break;
      case "7":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/lucky-wheel.png';
        f.path = '/awardManagement/pages/luckyWheelDetail/luckyWheelDetail';
        break;
      case "8":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/scratch.png'
        f.path = '/awardManagement/pages/scratch/scratch';
        break;
      case "9":
        f.image = 'http://cdn.jisuapp.cn/static/webapp/images/share-gifts/golden.png';
        f.path = '/awardManagement/pages/goldenEggs/goldenEggs';
        break;
    }
    return f;
  },
  showGifts: function(e) {
    let type = e.currentTarget.dataset.type;
    let index = e.currentTarget.dataset.index;
    let f = this.typeClassify(type, {})
    let path = f.path;
    if(type == 4 || type == 5){
      path = path + '?id=' + this.data.gifts[index].value;
    }
    app.turnToPage(path)
  },
  showShareGifts:function(e){
    let type = e.currentTarget.dataset.type;
    let f = this.typeClassify(type, {})
    let path = f.path;
    app.turnToPage(path)
  },
  recvReward: function(e) {
    var that = this,
      dataset = e.currentTarget.dataset,
      index = dataset.index,
      type = dataset.type,
      rebateNum = that.data.rebateNum,
      paramGifts = that.data.gifts[index] || 'all',
      gifts = that.data.gifts,
      giftsArr = [];
    if (type != 'all') {
      paramGifts.times = 1;
      giftsArr.push(paramGifts);
    } else {
      giftsArr = gifts;
      if (rebateNum == 0) {
        return;
      }
    }
    for (var i in gifts) {
      if (gifts[i].times >= 1 || gifts[i].is_select) {
        gifts[i].is_select = true;
        gifts[i].giftsModal = 0;
      } else {
        gifts[i].is_select = false;
        gifts[i].giftsModal = 1;
      }
    };
    that.setData({
      gifts: gifts
    });
    that.getRecv(giftsArr);
  },
  getRecv: function(giftsArr) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=ShareGiftActivity/RecvRewards',
      method: 'POST',
      data: {
        rewards: giftsArr
      },
      success: res => {
        that.getRewards(false);
        let data = res.data;
        let isAllRecv = true;
        if (data && data.length) {
          for(let i = 0; i < data.length; i++){
            if (!data[i].recv_result){
              app.showModal({
                content: data[i].reason
              })
              isAllRecv = false;
            }
          }
        }
        if (isAllRecv){
          app.showToast({
            title: '领取成功',
            icon: 'none',
            duration: 3000
          })
        }
      }
    })
  },
  clickMinusButton: function(e) {
    this.changeGiftsNums('minus', e);
  },
  clickPlusButton: function(e) {
    this.changeGiftsNums('plus', e);
  },
  inputBuyCount: function(e) {
    this.changeGiftsNums('input', e);
  },
  changeGiftsNums: function(type, e) {
    var that = this,
      data = e.currentTarget.dataset,
      index = data.index,
      value = +e.detail.value,
      currentGifts = that.data.gifts,
      rebateNum = that.data.rebateNum,
      total = 0,
      inputIndex = 0,
      targetGiftsCount = type == 'plus' ? currentGifts[index].times + 1 : (type == 'minus' ? currentGifts[index].times - 1 : value),
      newdata = {};
    this.setData({
      is_select: false
    })
    if (type == 'input') {
      var re = /^[0-9]+$/;
      if (!re.test(value)) {
        newdata['gifts[' + index + '].times'] = currentGifts[index].times;
        that.setData(newdata);
        return;
      }
      rebateNum = 0;
      for (let i in currentGifts) {
        if (index != i) {
          rebateNum += currentGifts[i].times
        }
      }
      total = rebateNum + value;
      if (total > that.data.recv_chance) {
        app.showToast({
          title: '已超过最大可领取奖励量',
          icon: 'none',
          duration: 1000
        })
        newdata['gifts[' + index + '].times'] = 1;
        newdata['is_select'] = true;
        newdata['rebateNum'] = rebateNum + 1;
        this.setData(newdata)
        return;
      }
      if (currentGifts[index].times >= currentGifts[index].stock) {
        app.showToast({
          title: '已超过最大库存量',
          icon: 'none',
          duration: 1000
        })
        newdata['gifts[' + index + '].times'] = currentGifts[index].times;
        newdata['is_select'] = true;
        newdata['rebateNum'] = rebateNum + 1;
        this.setData(newdata)
        return;
      }
      newdata['gifts[' + index + '].times'] = value;
    }
    if (type == 'plus') {
      total = rebateNum + 1;
      if (total > that.data.recv_chance) {
        app.showToast({
          title: '已超过最大可领取奖励量',
          icon: 'none',
          duration: 1000
        })
        this.setData({
          is_select: true,
          rebateNum: rebateNum
        })
        return;
      }
      if (currentGifts[index].type == 1 && !currentGifts[index].stock) {
        app.showToast({
          title: '优惠券已领完',
          icon: 'none',
          duration: 1000
        })
        this.setData({
          is_select: true,
          rebateNum: rebateNum
        })
        return;
      }
      if ((currentGifts[index].type == 4 || currentGifts[index].type == 5) && targetGiftsCount > 1) {
        app.showToast({
          title: '会员卡最多领取一次',
          icon: 'none',
          duration: 1000
        })
        this.setData({
          is_select: true,
          rebateNum: rebateNum
        })
        return;
      }
      if (currentGifts[index].times >= currentGifts[index].stock) {
        app.showToast({
          title: '已超过最大库存量',
          icon: 'none',
          duration: 1000
        })
        this.setData({
          is_select: true,
          rebateNum: rebateNum
        })
        return;
      }
      newdata['gifts[' + index + '].times'] = targetGiftsCount;
    } else if (type == 'minus') {
      total = rebateNum - 1;
      if (targetGiftsCount < 0) {
        return;
      }
      rebateNum = rebateNum;
      if (targetGiftsCount == 0) {
        newdata['gifts[' + index + '].times'] = 0;
      } else {
        newdata['gifts[' + index + '].times'] = targetGiftsCount;
      }
    }
    newdata['rebateNum'] = total;
    that.setData(newdata);
  }
})