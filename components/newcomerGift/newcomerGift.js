var app = getApp();
Component({
  properties: {},
  data: {
    showNewcomerModal: false, // 展示弹窗
    imgs: {
      '1': 'coupon',
      '2': 'integral',
      '3': 'storeValue',
      '4': 'vip',
      '5': 'vip',
      '6': 'collect',
      '7': 'circle',
      '8': 'scratch',
      '9': 'egg'
    },
    has_chose: false, // 已经领取过奖励标记
    inviterIndex: 0, // 计数--当前奖励序号
    ladderIndex: 1, // 当前阶梯等级
    preLadderIndex: 1, // 之前选择阶梯等级
    rewardType: {}, // 有无点击过此种类型
    receive: [], // 领取奖励
    showInviterModal: false, // 是否展示拉新有礼弹窗
  },
  methods: {
    newcomerInit: function(newVal) {
      if (newVal && newVal.rewards) {
        let new_data = newVal;
        let that = this;
        let promiseAll = new_data.rewards.map(item => {
          return new Promise((resolve, reject) => {
            switch (item.type.toString()) {
              case '1': // 优惠券
                item = this.setCouponData(item);
                resolve(item);
                break;
              case '2': // 积分
                item = this.setIntegralData(item);
                resolve(item);
                break;
              case '3': // 储值 
                item = this.setStoreValueData(item);
                resolve(item);
                break;
              case '4': // 会员卡
              case '5': // 付费会员卡
                item = this.setVipCardData(item, resolve);
                break;
              case '6': // 集集乐
                item.data = this.setCollectData(item.data);
                resolve(item.data);
                break;
              case '7': // 大转盘
                item = this.setCircleData(item);
                resolve(item);
                break;
              case '8': // 刮刮乐
                item = this.setScratchData(item);
                resolve(item);
                break;
              case '9': // 砸金蛋
                item = this.setEggData(item);
                resolve(item);
                break;
            }
          })
        });
        Promise.all(promiseAll).then(res => {
          that.setData({
            newcomer: new_data,
            showNewcomerModal: new_data.is_pop == 1 ? true : false
          })
        })
      }
    },
    inviterInit: function(newVal) {
      if (newVal) {
        let that = this;
        newVal.rewardsList = []; // 初始化奖励数组
        if (newVal.new_chance_num > 0 && newVal['new'].rewards.length) { // 新人奖励
          newVal['new'] = that.settleData(newVal['new']);
          newVal.rewardsList.push({
            key: 'new',
            value: newVal['new']
          });
        }
        if (newVal.second_chance_num > 0 && newVal.second.rewards.length) { // 二级拉新奖励
          newVal.second = that.settleData(newVal.second);
          newVal.rewardsList.push({
            key: 'second',
            value: newVal.second
          });
        }
        if (newVal.consume_chance_num > 0 && newVal.consume.rewards.length) { // 消费奖励
          newVal.consume = that.settleData(newVal.consume);
          newVal.rewardsList.push({
            key: 'consume',
            value: newVal.consume
          });
        }
        if (newVal.add_up_chance_num > 0) { // 累积拉新奖励
          if (newVal.add_up.prize.length) {
            newVal.add_up.prize.map(prize => {
              if (prize.rewards.length) { 
                return prize = that.settleData(prize);
              }
            })
            this.setData({
              ladderIndex: newVal.add_up.prize[0].ladder
            })
            newVal.rewardsList.push({
              key: 'add_up',
              add_type: newVal.add_up.type,
              value: newVal.add_up.prize
            });
          }
        }
        that.setData({
          inviter: newVal,
          rewardsClassName: 'rewardsWrap' + newVal.rewardsList.length,
          showInviterModal: newVal.is_pop == 1 && newVal.rewardsList.length ? true : false
        })
        that.initInviter();
      }
    },
    stopPropagation: function() {},
    initInviter: function() { // 初始化组件参数
      let animation = wx.createAnimation({
        duration: 0,
        timingFunction: 'linear',
        delay: 0,
        transformOrigin: '50% 50% 0',
      })
      let inviter = this.data.inviter;
      animation.translate(0).step();
      this.setData({
        inviterIndex: 0,
        animation: animation.export()
      })
    },
    onShareAppMessage: function() {
      let router = app.globalData.homepageRouter;
      return app.shareAppMessage({
        path: router
      })
    },
    closeNewcomerModal: function() {
      this.setData({
        showNewcomerModal: false
      })
    },
    settleData: function(data) {
      data.rewards.map(item => {
        switch (item.type.toString()) {
          case '1': // 优惠券
            return item = this.setCouponData(item);
            break;
          case '2': // 积分
            return item = this.setIntegralData(item);
            break;
          case '3': // 储值 
            return item = this.setStoreValueData(item);
            break;
          case '4': // 会员卡
          case '5': // 付费会员卡
            return item = this.setVipCardDataOfInviter(item);
            break;
          case '6': // 集集乐
            let data = this.setCollectData(item)
            return data;
            break;
          case '7': // 大转盘
            return item = this.setCircleData(item);
            break;
          case '8': // 刮刮乐
            return item = this.setScratchData(item);
            break;
          case '9': // 砸金蛋
            return item = this.setEggData(item);
            break;
        }
      });
      return data;
    },
    toCheckRewards: function(e) {
      let {
        index,
        findex,
        rewardType,
        ladderIndex,
      } = e.currentTarget.dataset;
      let type = '';   
      let value = '';
      if  (rewardType  ==  'newcomer')  {        
        type  =  this.data.newcomer.rewards[index].type.toString();    
      } else {
        if  (this.data.inviter.rewardsList[findex].key  ==  'add_up')  {          
          if (this.data.inviter.rewardsList[findex].add_type  ==  2)  {            
            type = this.data.inviter.rewardsList[findex].value[ladderIndex - 1].rewards[index].type;            
            value = this.data.inviter.rewardsList[findex].value[ladderIndex - 1].rewards[index].value;          
          } else {            
            type = this.data.inviter.rewardsList[findex].value[0].rewards[index].type;            
            value = this.data.inviter.rewardsList[findex].value[0].rewards[index].value;          
          }      
        } else {          
          type = this.data.inviter.rewardsList[findex].value.rewards[index].type.toString();          
          value = this.data.inviter.rewardsList[findex].value.rewards[index].value.toString();      
        }
      }
      let path = '';
      switch (type) {
        case '1':
          path = '/eCommerce/pages/couponList/couponList';
          break;
        case '2':
          path = '/userCenter/pages/myIntegral/myIntegral';
          break;
        case '3':
          path = '/eCommerce/pages/balance/balance';
          break;
        case '4':
          path = '/userCenter/pages/vipCardList/vipCardList';
          break;
        case '5':
          path = '/eCommerce/pages/vipBenefits/vipBenefits?id=' + rewardType  ==  'newcomer' ? this.data.newcomer.rewards[index].value : value;
          break;
        case '6':
          path = '/awardManagement/pages/collectStars/collectStars';
          break;
        case '7':
          path = '/awardManagement/pages/luckyWheelDetail/luckyWheelDetail';
          break;
        case '8':
          path = '/awardManagement/pages/scratch/scratch';
          break;
        case '9':
          path = '/awardManagement/pages/goldenEggs/goldenEggs';
          break;
      }
      app.turnToPage(path);
      this.setData({
        showNewcomerModal: false
      })
    },
    toGetRewards: function (e) {
      let index = e.currentTarget.dataset.index;
      this.getRewards(index);
    },
    getRewards: function(index) {
      let that = this;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=newUserGift/GetReward',
        data: {
          index: index
        },
        success: function(res) {
          if (res.status == 0) {
            let newData = {};
            newData[`newcomer.rewards[${index}].chose`] = true;
            newData[`has_chose`] = true;
            that.setData(newData);
          }
        }
      })
    },
    setCouponData: function(item) {
      let data = item.data;
      if (data.type == 0) {
        data.useCondition = '满' + data.condition + '，减' + data.value + '元';
      } else if (data.type == 1) {
        data.useCondition = '打' + data.value + '折';
      } else if (data.type == 2) {
        data.useCondition = '可抵扣' + data.value + '元';
      } else if (data.type == 3) {
        if (data.extra_condition == '') {
          data.useCondition = '直接兑换' + data.coupon_goods_info.title;
        } else if (data.extra_condition.price) {
          data.useCondition = '消费满' + data.extra_condition.price + '元可兑换' + data.coupon_goods_info.title;
        } else if (data.extra_condition.goods_id) {
          data.useCondition = '购买' + data.condition_goods_info.title + '可兑换' + data.coupon_goods_info.title;
        }
      } else if (data.type == 4) {
        data.useCondition = '储值金可充值' + data.value + '元';
      } else if (data.type == 5) {
        data.useCondition = data.extra_condition;
      } else if (data.type == 6) {
        data.useCondition = '可使用' + parseInt(data.value) + '次';
      }
      return item;
    },
    setStoreValueData: function(item) {
      item.title = `${(+item.value).toFixed(2)}储值`;
      item.useCondition = '全场通用';
      return item;
    },
    setIntegralData: function(item) {
      item.title = `${item.value}积分`;
      item.useCondition = '全场通用';
      return item;
    },
    setCollectData: function(item) {
      item.title = '集集乐' + (item.num || 1) + '颗星';
      item.useCondition = '全场通用';
      return item;
    },
    setCircleData: function(item) {
      item.title = `${item.num}次大转盘`;
      item.useCondition = '全场通用';
      return item;
    },
    setEggData: function(item) {
      item.title = `${item.num}次砸金蛋`;
      item.useCondition = '全场通用';
      return item;
    },
    setScratchData: function(item) {
      item.title = `${item.num}次刮刮乐`;
      item.useCondition = '全场通用';
      return item;
    },
    setVipCardData: function(item, resolve) {
      let data = item.data;
      data.useCondition = '';
      if (data.is_free_postage == 1) {
        data.useCondition += '包邮,';
      }
      if (data.integral != 0) {
        data.useCondition += `赠送${data.integral}积分,`;
      }
      if (data.balance && data.balance != 0) {
        data.useCondition += `赠送${data.balance}储值,`;
      }
      if (data.discount != 0) {
        data.useCondition += `所有商品一律${data.discount}折,`;
      }
      if (data.birthday_coupon_list || data.coupon_list) {
        this.getHeadquartersVipInfo(item, resolve);
      } else {
        resolve(item);
      }
    },
    setVipCardDataOfInviter: function(item) {
      let data = item.data;
      data.useCondition = '';
      if (data.is_free_postage == 1) {
        data.useCondition += '包邮,';
      }
      if (data.integral != 0) {
        data.useCondition += `赠送${data.integral}积分,`;
      }
      if (data.balance && data.balance != 0) {
        data.useCondition += `赠送${data.balance}储值,`;
      }
      if (data.discount != 0) {
        data.useCondition += `所有商品一律${data.discount}折,`;
      }
      if (data.birthday_coupon_list || data.coupon_list) {
        data = this.getHeadquartersVipInfo(item);
      }
      return data;
    },
    getHeadquartersVipInfo: function(item, resolve) {
      let that = this;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppShop/GetVIPInfo',
        data: {
          'is_all': 1
        },
        success: function(res) {
          let data = item.data;
          let giveCouponStr = '';
          let giveBirCouponStr = '';
          if (res.data.is_vip != 0) {
            for (let i = 0; i < res.data.coupon_list.length; i++) {
              giveCouponStr = giveCouponStr + '免费赠送' + res.data.coupon_list[i].num + '张' + res.data.coupon_list[i].name + '的优惠券,';
            }
            if (res.data.birthday_coupon_list && res.data.birthday_coupon_list.length) {
              for (let i = 0; i < res.data.birthday_coupon_list.length; i++) {
                giveBirCouponStr = giveBirCouponStr + '免费赠送' + res.data.birthday_coupon_list[i].num + '张' + res.data.birthday_coupon_list[i].name + '的优惠券,';
              }
            }
            data.giveCouponStr = giveCouponStr;
            data.giveBirCouponStr = giveBirCouponStr;
          }
          resolve && resolve(item);
        }
      });
    },
    closeInviterModal: function(callback) {
      this.setData({
        showInviterModal: false
      })
      typeof callback == 'function' && callback(); // 设置 跳转页面
    },
    arrowAdd: function() {
      let animation = wx.createAnimation({
        duration: 400,
        timingFunction: 'linear',
        delay: 0,
        transformOrigin: '50% 50% 0',
      })
      let total = this.data.inviter.rewardsList.length;
      let inviterIndex = this.data.inviterIndex + 1;
      animation.translate(-100/total * inviterIndex + '%', 0).step();
      this.setData({
        animation: animation.export(),
        inviterIndex: inviterIndex
      })
    },
    arrowSub: function() {
      let animation = wx.createAnimation({
        duration: 400,
        timingFunction: 'linear',
        delay: 0,
        transformOrigin: '50% 50% 0',
      })
      let total = this.data.inviter.rewardsList.length;
      let inviterIndex = this.data.inviterIndex - 1;
      animation.translate(-100/total * inviterIndex + '%', 0).step();
      this.setData({
        animation: animation.export(),
        inviterIndex: inviterIndex
      })
    },
    checkMoreInfo: function(that) {
      if (app.getAppCurrentPage().route == 'userCenter/pages/inviteRewards/inviteRewards') {
        that.triggerGetActivity();
        return;
      }
      let id = app.globalData.inviterId;
      app.turnToPage("/userCenter/pages/inviteRewards/inviteRewards?id=" + id);
    },
    changeLadderIndex: function(e) {
      let index = e.currentTarget.dataset.index;
      let ladderIndex = this.data.ladderIndex;
      this.setData({
        ladderIndex: index,
        preLadderIndex: ladderIndex // 保存之前的阶梯序号
      })
    },
    toGetPullUserGift: function(e) {
      let {
        index,
        findex,
        ladderIndex
      } = e.currentTarget.dataset;
      let reward = '';
      let item = this.data.inviter.rewardsList[findex];
      if (item.key != 'add_up') {
        reward = item.value.rewards[index];
      } else {
        if (item.add_type != '2') {
          reward = item.value[ladderIndex - 1].rewards[index];
        } else {
          reward = item.value[0].rewards[index];
        }
      }
      let param = {
        type: this.checkTypeFn(item.key),
        receive_num: reward.num,
        index: index,
        level: ladderIndex
      }
      this.getPullUserGift([param]);
    },
    getPullUserGift: function(receive) {
      let that = this;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=PullUserGift/Receive',
        data: {
          id: app.globalData.inviterId,
          receive: receive
        },
        method: 'post',
        success: function(res) {
          if (res.data == true) {
            app.showModal({
              content: '领取成功',
              confirm: function() {
                that.closeInviterModal(that.checkMoreInfo(that));
              }
            })
          }
        }
      })
    },
    inviterGetRewards: function() {
      let {
        receive
      } = this.data;
      receive.forEach(item=> {
        for (let i in item) {
          if (i == 'rewardType' || i == 'value') {
            delete item[i];
          }
        }
      })
      let rewardsList = [].concat(receive); // 拷贝数组处理 传参
      for (let i = rewardsList.length - 1; i >= 0; i--) {
        if (rewardsList[i].receive_num == 0) {
          rewardsList.splice(i, 1);
        }
      }
      rewardsList.length ? this.getPullUserGift(rewardsList) : '';
    },
    addRewardsNum: function(e) {
      let {
        findex,
        index,
        ladderIndex
      } = e.currentTarget.dataset;
      let inviter = this.data.inviter;
      let receive = this.data.receive;
      let rewardType = this.data.rewardType;
      let preLadderIndex = this.data.preLadderIndex;
      let rewardsList = inviter.rewardsList;
      let inviterIndex = this.data.inviterIndex;
      let count = 0; // 剩余机会总数
      let cur_type = ''; // 奖励类型
      let item = {}; // 奖励
      if (rewardsList[findex].key != 'add_up') {
        item = rewardsList[findex].value.rewards[index];
        cur_type = item.type;
        item.add_num = item.add_num ? item.add_num + 1 : 1;
        rewardsList[findex].value.rewards.forEach(reward => {
          count += reward.add_num || 0;
        })
      } else {
        if (rewardsList[findex].add_type == 1) { // 1 ：循环  2： 阶梯
          item = rewardsList[findex].value[0].rewards[index];
          cur_type = item.type
          item.add_num = item.add_num ? item.add_num + 1 : 1;
          rewardsList[findex].value[0].rewards.forEach(reward => {
            count += reward.add_num || 0;
          })
        } else {
          item = rewardsList[findex].value.prize[ladderIndex - 1].rewards[index];
          cur_type = item.type;
          item.add_num = item.add_num ? item.add_num + 1 : 1;
          rewardsList[findex].value.prize.forEach(subItem => {
            subItem.rewards.forEach(reward => {
              count += reward.add_num || 0;
            })
          })
        }
      }
      let type = this.checkTypeFn(rewardsList[inviterIndex].key); 
      let goods = receive.find( // 找到当前点击的奖励
        list => list.value === item.value && list.type === type
      )
      if (goods) {
        goods.receive_num ++;
      }else {
        let temp_num = 0; // 数量
        if (rewardsList[findex].key != 'add_up') {
          temp_num = rewardsList[findex].value.rewards[index].add_num;
        } else {
          if (rewardsList[findex].add_type == 1) {
            temp_num = rewardsList[findex].value[0].rewards[index].add_num;
          } else {
            temp_num = rewardsList[findex].value.prize[ladderIndex - 1].rewards[index].add_num;
          }
        }
        receive.push({
          value: item.value,
          rewardType: cur_type,
          type: type, // 领取奖励类型
          receive_num: temp_num, // 领取奖励数量
          index: index, // 领取奖励序号
          level: ladderIndex // 阶梯序号
        })
      }
      if (count == inviter[rewardsList[findex].key + '_chance_num']) {
        rewardsList[findex].add_limit = true; // 置灰加号
      }
      rewardType[cur_type] = true;
      this.setData({
        rewardType: rewardType,
        inviter: inviter,
        rewardsList: rewardsList,
        receive: receive,
      })
    },
    subRewardsNum: function(e) {
      let {
        findex,
        index,
        ladderIndex
      } = e.currentTarget.dataset;
      let inviter = this.data.inviter;
      let receive = this.data.receive;
      let inviterIndex = this.data.inviterIndex;
      let rewardsList = inviter.rewardsList;
      let cur_type = '';
      let item = {};
      if (rewardsList[findex].key != 'add_up') {
        item = rewardsList[findex].value.rewards[index];
        item.add_num = item.add_num ? item.add_num - 1 : 0;
        cur_type = item.type;
      } else {
        if (rewardsList[findex].add_type == 1) { // 1 ：循环  2： 阶梯
          item = rewardsList[findex].value[0].rewards[index];
          item.add_num = item.add_num ? item.add_num - 1 : 0;
          cur_type = item.type;
        } else {
          item = rewardsList[findex].value.prize[ladderIndex - 1].rewards[index];
          item.add_num = item.add_num ? item.add_num - 1 : 0;
          cur_type = item.type;
        }
      }
      let type = this.checkTypeFn(rewardsList[inviterIndex].key); 
      let goods = receive.find( // 找到当前点击的奖励
        list => list.value === item.value && list.type === type
      )
      goods.receive_num --;
      rewardsList[findex].add_limit = false; // 恢复加号
      this.setData({
        inviter: inviter,
        rewardsList: rewardsList,
        receive: receive,
      })
    },
    checkTypeFn: function(param) {
      let type = '';
      switch (param) {
        case 'new':
          type = 1;
          break;
        case 'second':
          type = 2;
          break;
        case 'add_up':
          type = 3;
          break;
        case 'consume':
          type = 4;
          break
      }
      return type;
    },
    triggerGetActivity: function() {
      let detail= {
        id: app.globalData.inviterId
      };
      let option = {};
      this.triggerEvent('myevent',detail,option);
    }
  },
})