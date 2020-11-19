var app = getApp();
Page({
  data: {
    haveData: true,
    goodsList: [],
    isLeader: true,
    sub_shop_app_id:'',
    type: 0,
    formid: [],
    shareInfo: {
      group_price: '',
      share_cover: '',
      share_title: ''
    },
    groupOptions: {
      0: { label: '普通团' },
      1: { label: '新人团' },
      2: { label: '阶梯团' },
      3: { label: '帮帮团' },
      4: { label: '抽奖团' }
    },
    pickParam:{
      label: [], /**根据订单类型 填充对应的name */
      value: [], /**根据订单类型 填充对应的type*/
      index: 0,
      orderType: 0, /**订单类型   基础0 行业预约14 */ 
    }
  },
  orderTypes:[{ //订单类型汇总
    type:0,
    name:'基础'
  },{
    type:14,
    name:'行业预约'
  }], 
  page: 1,
  isMore: 1,
  onLoad: function(options) {
    let param = {
      franchiseeId : options.franchisee || '',
    };
    if(options.index){
      param['pickParam.index'] = options.index;
      param['pickParam.orderType'] = this.orderTypes[options.index].type
    }
    this.setData(param)
    this.pageInit();
  },
  pageInit() {
    var _this = this;
    if (app.isLogin()) {
      _this.loadAll();
    } else {
      app.goLogin({
        success: function() {
          _this.loadAll();
        }
      });
    }
  },
  loadAll() {
    var _this = this;
    _this.loadMyTeams()
    this.setPickParam()
  },
  loadMyTeams() {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/myTeams',
      data: {
        page: _this.page,
        status: _this.data.type,
        activity_goods_type:this.data.pickParam.orderType, //订单类型筛选条件
        is_leader: _this.data.isLeader ? '1' : '0',
        page_size: 10,
        sub_shop_app_id: _this.data.franchiseeId || ''
      },
      success: res => {
        if (_this.isMore === 0) {
          return;
        };
        var expired = '',
          nowdate = '',
          goodsList = _this.data.goodsList.concat(res.data);
        for (var index in goodsList) {
            goodsList[index].index = index,
              nowdate = res.current_time * 1000;
            expired = _this.countTime(goodsList[index].expired_time * 1000 - nowdate); 
            goodsList[index].expired = '(距结束约' + (expired[0] != '00' ? expired[0] + '天' : (expired[1] != '00' ? expired[1] + '小时' : (expired[2] != '00' ? expired[2] + '分' : (expired[3] != '00' ? '1分' : '')))) + ')';
          }
        if (goodsList.length && _this.data.pickParam.orderType == 14) { //预约规格
            let elem_info = goodsList[index].goods_info[0].new_appointment.elem_info;
            goodsList[index].aptStd = _this.join(elem_info);
          }
        _this.setData({
          goodsList: goodsList,
          haveData: goodsList.length > 0 ? true : false
        })
        _this.page++;
        _this.isMore = res.is_more;
      }
    })
  },
  goToGroupDetail(e) {
    let franchisee = e.currentTarget.dataset.subid;
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    var data = e.currentTarget.dataset,
      pageUrl = '/group/pages/gporderDetail/gporderDetail?from=myOrder' + '&teamtoken=' + data.teamtoken + chainParam;
    this.saveUserFormId(function() {
      app.turnToPage(pageUrl);
    })
  },
  inviteFriends(e) {
    let that = this;
    var data = e.currentTarget.dataset;
    var franchisee = data.subid;
    let indexTeams = e.currentTarget.dataset.index;
    let myTeams = this.data.goodsList[indexTeams];
    let goodsInfo = myTeams.goods_info[0];
    let goods_id = myTeams.goods_id;
    let activity_id = myTeams.activity_id;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/GetGoodsShareInfo',
      data: {
        goods_id: goods_id,
        activity_id: activity_id,
        sub_shop_app_id: franchisee || ''
      },
      success: function(res) {
        var data = {};
        data['shareInfo.group_price'] = res.data.price;
        data['shareInfo.share_cover'] = res.data.share_cover;
        data['shareInfo.share_title'] = res.data.share_title;
        that.setData(data)
        app.sendRequest({
          url: '/index.php?r=appGroupBuy/getShareQRCode',
          data: {
            goods_id: goods_id,
            activity_id: activity_id,
            sub_shop_app_id: franchisee || '',
            type: 6,
            text: goodsInfo.goods_name,
            price: goodsInfo.price,
            virtual_price: goodsInfo.virtual_price == '0.00' ? goodsInfo.original_price : goodsInfo.virtual_price,
            goods_img: goodsInfo.cover,
            user_token: app.globalData.PromotionUserToken || '',
            team_token: myTeams.team_token,
            order_id: myTeams.order_id
          },
          success: function(res) {
            const data = res.data;
            const type = myTeams.activity_type;
            data.isGroup = 1;
            if (type == 0) {
              data.groupType = myTeams.max_user_num + '人团';
            } else {
              data.groupType = that.data.groupOptions[type].label;
            }
            data.originPrice = myTeams.goods_info[0].original_price;
            animation.bottom("0").step();
            that.setData({
              "pageQRCodeData.shareDialogShow": 0,
              "pageQRCodeData.shareMenuShow": true,
              "pageQRCodeData.goodsInfo": res.data,
              "pageQRCodeData.animation": animation.export(),
              goodsShareData: myTeams
            })
          }
        })
      }
    })
  },
  changeIdentity(e) {
    var data = e.currentTarget.dataset;
    this.setData({
      isLeader: data.isleader == 'true' ? true : false,
      type: 0,
      goodsList: []
    })
    this.page = 1;
    this.isMore = 1;
    this.loadMyTeams();
  },
  changeType(e) {
    var data = e.currentTarget.dataset;
    this.setData({
      type: data.type,
      goodsList: []
    })
    this.page = 1;
    this.isMore = 1;
    this.loadMyTeams();
  },
  openNewGroup(e) {
    var data = e.currentTarget.dataset;
    var franchisee = data.subid === app.getAppId() ? '' : data.subid;
    var chainParam = franchisee ? '&franchisee=' + franchisee : '';
    var pathUrl = '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid + chainParam;
    if (data.goodsType == 10) { //预约拼团 使用特定的商品详情
      pathUrl = `/tradeApt/pages/TYDetail/TYDetail?detail=${data.goodsid}&activeId=${data.activityid}&activeType=group${chainParam}`;
    }
    if (data.status == 3 && data.type == 4 || data.groupbuy == 0) {
      if (myTeams.order_info.goods_type == 10) {
        app.turnToPage(`/tradeApt/pages/TYDetail/TYDetail?detail=${data.goodsid}${chainParam}`);
      }else{
        app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + data.goodsid + chainParam);
      }
      return;
    }
    if (data.status == '5') {
      app.showModal({
        content: '该拼团活动已结束'
      })
      return;
    }
    this.saveUserFormId(function() {
      app.turnToPage(pathUrl)
    })
  },
  gotoGoodsOrder(e) {
    let franchisee = e.currentTarget.dataset.subid;
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    var pathUrl = '/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=' + e.currentTarget.dataset.orderid + chainParam;
    this.saveUserFormId(function() {
      app.turnToPage(pathUrl)
    })
  },
  formSubmit_collect(e) {
    let formid = this.data.formid;
    formid.push(e.detail.formId);
  },
  saveUserFormId(callback) {
    app.showLoading({
      title: '加载中'
    });
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
      method: 'post',
      data: {
        form_id: _this.data.formid || [],
        sub_shop_app_id: _this.data.franchiseeId || ''
      },
      complete: function() {
        app.hideLoading();
        callback && callback();
        _this.setData({
          formid: []
        })
      }
    })
  },
  countTime: function(difference) {
    if (difference < 0) {
      return ['00', '00', '00'];
    }
    let _second = 1000,
      _minute = _second * 60,
      _hour = _minute * 60,
      _date = _hour * 24,
      time = [];
    let dates = Math.floor(difference / _date),
      hours = Math.floor((difference % _date) / _hour),
      minutes = Math.floor((difference % _hour) / _minute),
      seconds = Math.floor((difference % _minute) / _second);
    dates = (String(dates).length >= 2) ? dates :  + dates;
    hours = (String(hours).length >= 2) ? hours : '0' + hours;
    minutes = (String(minutes).length >= 2) ? minutes : '0' + minutes;
    seconds = (String(seconds).length >= 2) ? seconds : '0' + seconds;
    time[0] = dates;
    time[1] = hours;
    time[2] = minutes;
    time[3] = seconds;
    return time;
  },
  onReady: function() {
  },
  onShow: function() {
  },
  onHide: function() {
  },
  onUnload: function() {
  },
  onPullDownRefresh: function() {
  },
  onReachBottom: function() {
    if (this.isMore) {
      this.loadAll();
    }
  },
  onShareAppMessage: function(e) {
    let that = this;
    if(e.from == 'button'){
      let myTeams = this.data.goodsShareData,
        goodsInfo = myTeams.goods_info[0],
        shareInfo = this.data.shareInfo,
        team_token = myTeams.team_token,
        urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
        url = '/group/pages/gpgroupDetail/gpgroupDetail?teamtoken=' + team_token,
        nickname = app.getUserInfo('nickname'),
        share_cover = shareInfo.share_cover ? shareInfo.share_cover : 'https://www.zhichiwangluo.com/zhichi_frontend/static/webapp/images/group_goods_share.jpeg',
        title = shareInfo.share_title ? shareInfo.share_title : (nickname ? nickname + ' 喊你' : '') + '拼单啦~ ' + shareInfo.group_price + '元拼' + goodsInfo.goods_name + '，火爆抢购中......';
      return app.shareAppMessage({
        title: title,
        path: url,
        imageUrl: share_cover,
        success: function(addTime) {
          app.showToast({
            title: '转发成功',
            duration: 500
          });
        }
      });
    }else{
      return app.shareAppMessage({
        title: '我的拼团',
        path: '/group/pages/gpmyOrder/gpmyOrder',
        success: function(addTime) {
          app.showToast({
            title: '转发成功',
            duration: 500
          });
        }
      });
    }
  },
   setPickParam(){
    let _this = this;
    if (this.data.pickParam.label.length)return; //不需要多次请求
    app.sendRequest({
      url:'/index.php?r=appGroupBuy/TeamsType',
      method:'POST',
      success(res){
        if(res.status == 0){
          let data = res.data,
          orderTypes = _this.orderTypes,
          labelArr = [],
          valueArr = [];
          orderTypes.forEach((v,k)=>{
            if(data.indexOf(v.type)){
              labelArr.push(v.name)
              valueArr.push(v.type)
            }
          })          
          _this.setData({
            'pickParam.label': labelArr,
            'pickParam.value': valueArr
          })
        }
      }
    })
  },
  groupTypeChange(e){
    let index = e.detail.value;
    this.setData({
      'pickParam.index': index,
      'pickParam.orderType': this.data.pickParam.value[index],
      goodsList: []
    })
    this.page = 1;
    this.isMore = 1;
    this.loadMyTeams();
  },
  join(arr = [], con = '/') {
    if (arr.length == 1) return arr[0].name;
    arr.sort((a, b) => { return a.id - b.id });
    return arr.reduce((prev, cur) => {
      if (prev instanceof Object) prev = prev.name;
      return prev + con + cur.name
    })
  }
})