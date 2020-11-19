var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    selectStatus: 0,// 控制✔， 0时不显示，1时在上架旁边显示，2时下架时显示
    goodsArr: [],
    sold_status: '', // 团长上下架商品状态筛选
    isHaveSecondCommission: false,
    currentType: 0,
    goodsName: '',
    communityArr: [],
    is_audit: 0,
    status: ['未开始','进行中','已结束'],
    groupBuyingGoodsList: [// 要显示团购商品列表
    ],
    showSelect: false, // 显示/隐藏筛选项
    showGroupBuyingGoods: false, // true显示团购商品页|false显示活动商品页，
    showButtons: false, // 显示/隐藏底部按钮
    selectedCount: 0, // 上架按钮上显示的数字
    isAllSelectd: false //是否是全选
  },
  page: 1,
  goodsPage: 1,
  isMore: 1,
  currentIndex: 0,
  leaderToken: '',
  onLoad: function (options) {
    this.leaderToken = app.globalData.getDistributorInfo.user_token;
    this.setData({
      is_audit: options.is_audit ? options.is_audit : 0
    })
    this.dataInitial();
  },
  onShow: function () {
  },
  onPullDownRefresh: function () {
    this.getGroupGoodsList()
  },
  dataInitial: function () {
    this.getCommunityList();
    this.getGroupGoodsList();
  },
  handleComputeSelectedCount: function () {// 根据筛选选择的变化修改上架按钮上的数字
    let list = this.data.groupBuyingGoodsList
    let selectedCount = 0
    list.map(item => {
      if (item.isSelected) {
        selectedCount ++
      }
    })
    this.setData({
      selectedCount: selectedCount
    })
  },
  handleSelectGoods: function (e) {// 处理点击筛选项/ query = on 选择上架商品 | off 选择下架商品
    let query = e.currentTarget.dataset['status']
    let selectStatus
    this.handleShowSelect()
    let sold_status
    if (query == 'on') {
      sold_status = 1
      selectStatus = 1
    } else {
      sold_status = 0
      selectStatus = 2
    }
    this.setData({
      sold_status: sold_status,
      showButtons: true,
      selectStatus: selectStatus,
      groupBuyingGoodsList: []
    })
    this.goodsPage = 1;
    this.getGroupGoodsList()
  },
  handleCancel: function () {// 点击取消按钮,重置上架按钮上的数字为0
    this.setData({
      showButtons: false,
      selectStatus: 0,
      sold_status: '',
      groupBuyingGoodsList: []
    })
    this.goodsPage = 1;
    this.getGroupGoodsList()
  },
  handleSearch: function (e) {
    this.setData({
      goodsName: e.detail.value,
      groupBuyingGoodsList: []
    })
    this.goodsPage = 1;
    this.getGroupGoodsList()
  },
  handlePutaway: function () {// 点击上架/下架按钮
    let sold_status = this.data.sold_status;
    let groupBuyingGoodsList = this.data.groupBuyingGoodsList;
    let goodsIds = [];
    let _this = this;
    groupBuyingGoodsList.map(item => {
      if (item.isSelected) {
        goodsIds.push(item.id);
        item.leader_goods_status = (sold_status == 1 ? 0 : 1);
      }
    })
    if (!goodsIds.length) {return}
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/AddDistributionLeaderGoodsIdx',
      method: 'post',
      data: {
        user_token: this.leaderToken,
        goods_ids: goodsIds,
        status: sold_status == 1 ? 0 : 1
      },
      success: function (res) {
        _this.setData({
          sold_status: '',
          selectedCount: 0,
          groupBuyingGoodsList
        })
        _this.handleCancel()// 隐藏下面的按钮
      }
    })
  },
  handleShowActivityBuyingGoods: function () {// 显示活动商品列表
    this.setData({
      showGroupBuyingGoods: false,
      showSelect: false
    })
  },
  handleShowGroupBuyingGoods: function () {// 显示秒杀商品列表
    if(this.data.showGroupBuyingGoods){return}
    this.setData({
      showGroupBuyingGoods: true,
      goodsName: '',
      groupBuyingGoodsList: []
    })
    this.goodsPage = 1;
    this.getGroupGoodsList();
  },
  handleShowSelect: function () {// 点击筛选按钮显示筛选项
    this.setData({
      showSelect: !this.data.showSelect
    })
  },
  handleSelectItem: function (e) {// 单选一个商品
    let goodsId = e.currentTarget.dataset.id;
    let goodsList = this.data.groupBuyingGoodsList;
    let isAllSelectd = true;
    goodsList.map((item) => {
      if(item.id == goodsId){
        item.isSelected = !item.isSelected;
      }
      if(!item.isSelected){
        isAllSelectd = false
      }
    })
    this.setData({
      groupBuyingGoodsList: goodsList,
      isAllSelectd: isAllSelectd
    })
    this.handleComputeSelectedCount()// 刷新上架按钮上的数
  },
  handleSelectAll: function () {// 处理点击全选按钮时的逻辑
    let goodsList = this.data.groupBuyingGoodsList
    let isAllSelectd = !this.data.isAllSelectd; // 判断是否全选状态
    goodsList.map((item) => {
      item.isSelected = isAllSelectd
    })
    this.setData({
      groupBuyingGoodsList: goodsList,
      isAllSelectd: isAllSelectd
    })
    this.handleComputeSelectedCount()// 刷新上架按钮上的数
  },
  onReachBottom: function () {
    if (this.isMore && !this.data.showGroupBuyingGoods) { 
      this.page++;
      this.getCommunityList();
     };
    if (this.data.goodsIsMore && this.data.showGroupBuyingGoods) {
      this.goodsPage++;
      this.getGroupGoodsList();
    } 
  },
  getGroupGoodsList: function () { //获取社区团购商品列表
    let _this = this
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetAppDistributionGroupGoodsList',
      method: "post",
      data: {
        page: _this.goodsPage,
        page_size: 20,
        status: -1,
        pick_up_type: [5],
        leader_token: this.leaderToken,
        is_admin: 1,
        sold_status: '',
        idx_arr: {
          'idx': 'title',
          'idx_value': _this.data.goodsName
        },
        sold_status: _this.data.sold_status,
        is_stock_gte_zero: 1,
        is_new_version: 1,
        is_seckill: 1
      },
      success: function (res) {
        if (res.status == 0) {
          let data = res.data;
          let isAllSelectd;
          data.map((item) => {// 用来跟踪用户是否选择该商品
            item.isSelected = false;
            isAllSelectd = false;
            item.price = item.seckill_price;
            if(item.form_data.goods_model && item.form_data.min_price != item.form_data.max_price){
              item.commission = item.commission_type != 2 ? ((item.commission * item.form_data.min_price * 0.01).toFixed(2) + '~' + (item.commission * item.form_data.max_price * 0.01).toFixed(2)) : item.commission;
            }else{
              item.commission = item.commission_type != 2 ? (item.commission * item.seckill_price * 0.01).toFixed(2) : item.commission;
            }
          })
          _this.setData({
            groupBuyingGoodsList: [..._this.data.groupBuyingGoodsList,...data],
            goodsIsMore: res.is_more,
            isAllSelectd
          })
        }
      }
    })
  },
  getCommunityList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetAppDistributionGroupList',
      method: "post",
      data: {
        page: _this.page,
        page_size: 20,
        status: 6,
        leader_token: this.leaderToken
      },
      success: function (res) { //获取团信息
        if (res.status == 0) {
          let data = res.data;
          for (let item of data) {
            item.start_date = item.start_date.replace(/\-/g, '.');
            item.end_date = item.end_date.replace(/\-/g, '.');
          }
          data = [..._this.data.communityArr, ...res.data];
          _this.isMore = res.is_more;
          _this.setData({
            communityArr: data
          })
        }
      }
    })
  },
  addCommunityGoods: function (e) {
    let dataset = e.currentTarget.dataset;
    let openStatus = dataset.openStatus;
    this.currentIndex = dataset.index;
    dataset.cardInfo.pic = dataset.cardInfo.pic.indexOf('community-share-pic') > 0 ? dataset.cardInfo.pic : dataset.cardInfo.pic;
    let param = {
      group_id: dataset.id,
      agent_goods_ids: dataset.agentGoodsIds,
      title: dataset.title,
      start_date: dataset.startDate,
      end_date: dataset.endDate,
      illustration: dataset.illustration,
      card_info: dataset.cardInfo,
      banner: dataset.banner,
      goods_num: dataset.goodsNum
    }
    param = encodeURIComponent(JSON.stringify(param));
    if (openStatus) {
      wx.navigateTo({
        url: `/promotion/pages/communityGroupAddGoods/communityGroupAddGoods?param=${param}&user_token=${this.user_token}&is_audit=${this.data.is_audit}&index=${this.currentIndex}`
      })
    }
  },
  passiveAgent: function(e) {
    let that = this;
    let group_id = e.currentTarget.dataset.id;
    let passive = e.detail.value;
    let index = e.currentTarget.dataset.index;
    let params = {
      leader_token: this.leaderToken,
      group_id: group_id,
      passive: passive ? 0 : 1,       //  0：开启，1：关闭
    }
    let newData = {};
    if (passive) {
      newData[`communityArr[${index}].passive_agent`] = 0;
      that.setData(newData);
      that.updatePassive(params);
      return
    }
    app.showModal({
      content: '关闭后，该活动中的商品将下架，确定关闭吗？',
      showCancel: true,
      confirm: function() {
        newData[`communityArr[${index}].passive_agent`] = 1;
        that.setData(newData);
        that.updatePassive(params);
      },
      cancel: function() {
        newData[`communityArr[${index}].passive_agent`] = 0;
        that.setData(newData);
      },
    })
  },
  updatePassive: function(params) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/UpdatePassiveAgent',
      data: params,
      method: 'post',
      success: function() {},
    })
  },
  changeDetailActive: function(e){
    let passive = e.detail.value;
    let param = {
      leader_token: this.leaderToken,
      passive: passive ? 0 : 1  
    }
    let communityArr = this.data.communityArr;
    this.updatePassive(param);
    communityArr.map((item) => {
      item.passive_agent = passive ? 0 : 1
    })
    this.setData({communityArr});
  }
})
