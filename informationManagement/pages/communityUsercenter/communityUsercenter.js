var app = getApp()
var util = require('../../../utils/util.js')
var likeTap = false; //防止重复点击
var kbHeight = '';
var isReply = false;
const dataType = function (data) {
  return Object.prototype.toString.call(data).match(/^\[object\s(\w+)\]$/)[1];
}
const checkDataType = function (data, typeString) {
  return (dataType(data)).toLowerCase() === typeString.toLowerCase();
}
const hasOwnProperty = function (data, property) {
  if (typeof data.hasOwnProperty === 'function') {
    return data.hasOwnProperty(property);
  }
  return Object.prototype.hasOwnProperty.call(data, property);
}
const ifHasDataType = function (data, typeArr) {
  return typeArr.some(_type => {
    return checkDataType(data, _type);
  });
}
const getRightAttrVal = function (path, target) {
  /\]$/.test(path) && (path = path.slice(0, -1));
  let pathArr = path.replace(/\]?\[|\]\.?/g, '.').split(/\./);
  let len = pathArr.length;
  let key;
  let result = target;
  while (ifHasDataType(result, ['object', 'array']) && len > 0) {
    key = pathArr.shift();
    result = result[key];
    len--;
  }
  return result;
}
const pickAttrObject = function (attrs, target) {
  let result = {};
  if (checkDataType(attrs, 'object') && checkDataType(target, 'object')) {
    for (let k in attrs) {
      if (hasOwnProperty(attrs, k)) {
        result[k] = getRightAttrVal(attrs[k], target);
      }
    }
  }
  return result;
}
const tabIfNeedFixed = function (f) {
  let flag = f;
  return function () {
    let scrollTop = Array.prototype.shift.call(arguments);
    let result = Math.abs(scrollTop - flag) < 20;
    return result;
  }
}
Page({
  data: {
    communityId: '',
    tabActive : 'publish' ,
    myArticleCount : 0 ,
    myArticleList : [],
    getMyArticleData : {
      page : 1 ,
      loading : false ,
      nomore : false
    },
    imgData : {} ,
    myCommentData : {
      page : 1 ,
      loading : false ,
      nomore : false
    },
    myCommentList : [],
    myCommentCount : 0,
    theme_color : '#00b6f8',
    appealReason: '',
    showAppeal: false,
    appealId: '',
    appealSectionId: '',
    showMoreIdx: '',
    showActionSheet: false,
    showAppealBtn: false,
    userToken: '', // 个人中心用户token
    sourceType: '', // 用户来源 1->后台添加 0->用户添加
    userInfo: {}, // 用户信息
    tadNeedFixed: false, // tab切换是否需要置顶
    userInfoHeight: 88, // 用户信息区域的高度
    tabInfoHeight: 42, // tab切换区域的高度
    contentHeight: null, // 页面内容高度
    publishScrollTop: 0, // 发布话题scroll-view的scrollTop值
    replyScrollTop: 0, // 话题回帖scroll-view的scrollTop值
    historyScrollTop: 0, // 浏览记录scroll-view的scrollTop值
    myHistoryData : { // 浏览记录状态参数
      page : 1 ,
      loading : false ,
      nomore : false
    },
    myHistoryList : [], // 浏览记录数据
    myHistoryCount: 0, // 浏览记录计数
    replyParam: {
      text: '',
      agent_user_token: '',
      address: '',
      latitude: '',
      longitude: '',
      comment_img_url: '',
      comment_id: '',
      parent_comment_id: '',
      sub_app_id: ''
    },
    commentContentMaxHeight: 0,
    commentContentHeight: 40,
    showReplyBox: false,
    replyBoxFocus: false,
    keyboardHeight: '50%',
    replyPlaceholder: '我来说两句',
  },
  onLoad: function(options){
    let that = this,
        communityId = options.detail || '',
        usertoken = options.usertoken || '',
        sourcetype = options.sourcetype || '',
        tabActive = options.tap || 'publish';
    let franchisee = options.franchisee || '';
    let newdata = {};
    if (usertoken) { // 代表其他人的
      newdata.sourceType = sourcetype;
      if (app.globalData.userInfo.user_token === usertoken) { // 处理用户看自己人个人中心
        newdata.userToken = '';
      }else {
        newdata.userToken = usertoken;
      }
      this.getUserInfoByUserToken(usertoken, sourcetype);
    }
    else { // 代表自己
      newdata.userInfo = pickAttrObject({
        name: 'nickname',
        headimgurl: 'cover_thumb',
        gender: 'sex',
        usertoken: 'user_token'},
        app.globalData.userInfo);
      newdata.userInfo.gender++;
      app.setPageTitle(app.globalData.userInfo.nickname || '个人中心');
    }
    newdata.communityId = communityId;
    newdata.tabActive = tabActive;
    newdata.franchisee = franchisee;
    this.setData(newdata);
    app.getStorage({
      key: 'communityThemeColor-' + communityId,
      success: function (res) {
        that.setData({ theme_color: res.data });
      },
      fail: function () {
        that.getThemeColor(communityId);
      }
    });
    this.getMyArticle();
    this.getMyComment();
    this.getMyHistory();  // 首次获取历史记录数据
    app.globalData.communityUsercenterRefresh = false;
    app.globalData.communityPageRefresh = true;
    app.globalData.topicRefresh = true;
    this.getScrollRelateRects(); // 获取滚动相关节点信息
  },
  onShow : function() {
    if (app.globalData.topicTurnToDetail) {
      app.globalData.topicTurnToDetail = false;
    }
    if(app.globalData.communityUsercenterRefresh){
      this.setData({
        myArticleList : [],
        getMyArticleData : {
            page : 1 ,
            loading : false ,
            nomore : false
        },
        myCommentList : [],
        myCommentData : {
          page : 1 ,
          loading : false ,
          nomore : false
        },
        myHistoryData : { // 浏览记录状态参数
          page : 1 ,
          loading : false ,
          nomore : false
        },
        myHistoryList : [] // 浏览记录数据
      });
      this.getMyArticle();
      this.getMyComment();
      this.getMyHistory();  // 首次获取历史记录数据
      app.globalData.communityUsercenterRefresh = false;
    }
  },
  getMyArticle : function() {
    let that = this,
        sdata = that.data.getMyArticleData ;
    if(sdata.loading || sdata.nomore){
      return ;
    }
    sdata.loading = true;
    let param = {
      page: sdata.page,
      section_id: that.data.communityId,
      only_own_record: 1,
      orderby: 'add_time',
      page_size: 10,
      sub_app_id: that.data.franchisee
    };
    let {
      userToken
    } = this.data;
    if (userToken) { // 浏览非本人的个人中心
      param.other_user_token = userToken;
    }
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetArticleByPage',
      data: param,
      method: 'post',
      success: function (res) {
        if (res.status == 0 && Array.isArray(res.data) && res.data[0]) {
          let info = res.data,
              oldData = that.data.myArticleList,
              newData = [];
          for (let i = 0; i < info.length; i++) {
            let idata = info[i];
            let isagent = !!idata.agent_user_token;
            idata.title = unescape(idata.title.replace(/\\u/g, "%u"));
            idata.content_text = idata.content.text.replace(/\n|\\n/g , '\n');
            if (isagent) {
              let auditStatus = idata.audit_status;
              idata.audit_status = auditStatus == 4 || auditStatus == 5 || auditStatus == 7 ? 0 : auditStatus == 6 || auditStatus == 9 ? 2 : auditStatus == 8 ? 1 : '';
            }
            if (idata.content.type == 2 && idata.content.url.article && idata.content.url.article.type == 3) {
              idata.content.url.article.cover = app.globalData.cdnUrl + '/zhichi_frontend/static/webapp/images/audio_default.png';
            }
            let listRecomItem = getRightAttrVal('form_data.list_recommend.recommend_goods[0]', idata);
            if (listRecomItem) {
              idata.form_data.list_recommend.recommend_goods[0] = pickAttrObject({
                name: 'title',
                price: 'price',
                image: 'cover',
                id: 'id',
                app_id: 'app_id'
              }, listRecomItem)
            }
            newData.push(idata);
          }
          newData = oldData.concat(newData);
          if(sdata.page == 1){
            that.setData({
              myArticleCount : res.count
            });
          }
          that.setData({
            myArticleList: newData ,
            'getMyArticleData.page' : sdata.page + 1
          });
        }
        that.setData({
          'getMyArticleData.loading': false ,
          'getMyArticleData.nomore' : res.is_more == 0 ? true : false
        });
      },
      fail: function(res){
        that.setData({
          'getMyArticleData.loading': false
        });
      }
    });
  },
  getMyComment : function() {
    var that = this,
        sdata = that.data.myCommentData ;
    if(sdata.loading || sdata.nomore){
      return ;
    }
    sdata.loading = true;
    let param = {
      page: sdata.page,
      section_id: that.data.communityId,
      only_own_record: 1,
      page_size: 10,
      sub_app_id: that.data.franchisee
    };
    let {
      userToken
    } = this.data;
    if (userToken) { // 获取滚动相关节点信息
      param.other_user_token = userToken;
    }
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetCommentByPage',
      data: param,
      method: 'post',
      success: function (res) {
        if (res.status == 0 && Array.isArray(res.data) && res.data[0]) {
          let info = res.data,
              oldData = that.data.myCommentList,
              newData = [];
          for (let i = 0; i < res.data.length; i++) {
            let idata = res.data[i];
            idata.content_text = idata.content.text.replace(/\n|\\n/g , '\n');
            if (idata.obj && idata.obj.content && idata.obj.content.type == 2) {
              if (idata.obj.content.url.article) {
                delete idata.obj.content.url.article.body;
                if (idata.obj.content.url.article.type == 3) {
                  idata.obj.content.url.article.cover = 'https://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/audio_default.png';
                }
              }
            }
            newData.push(idata);
          }
          newData = oldData.concat(newData);
          if(sdata.page == 1){
            that.setData({
              myCommentCount : res.count
            });
          }
          that.setData({
            myCommentList: newData ,
            'myCommentData.page' : sdata.page + 1
          });
        }
        that.setData({
          'myCommentData.loading': false ,
          'myCommentData.nomore' : res.is_more == 0 ? true : false
        });
      },
      fail: function(res){
        that.setData({
          'myCommentData.loading': false
        });
      }
    });
  },
  getMyHistory : function() {
    var that = this,
        sdata = that.data.myHistoryData;
    if(sdata.loading || sdata.nomore){
      return ;
    }
    sdata.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetBrowseRecord',
      data: {
          page: sdata.page ,
          section_id : that.data.communityId ,
          only_own_record : 1 ,
          article_style: 0,
          orderby: 'add_time',
          page_size: 10,
          sub_app_id: that.data.franchisee
      } ,
      method: 'post',
      success: function (res) {
        if (res.status == 0 && Array.isArray(res.data) && res.data[0]) {
          let info = res.data,
              oldData = that.data.myHistoryList,
              newData = [];
          for (let i = 0; i < info.length; i++) {
            let idata = info[i];
            let isagent = !!idata.agent_user_token;
            idata.title = unescape(idata.title.replace(/\\u/g, "%u"));
            idata.content_text = idata.content.text.replace(/\n|\\n/g , '\n');
            if (isagent) {
              let auditStatus = idata.audit_status;
              idata.audit_status = auditStatus == 4 || auditStatus == 5 || auditStatus == 7 ? 0 : auditStatus == 6 || auditStatus == 9 ? 2 : auditStatus == 8 ? 1 : '';
            }
            if (idata.content.type == 2 && idata.content.url.article && idata.content.url.article.type == 3) {
              idata.content.url.article.cover = app.globalData.cdnUrl + '/zhichi_frontend/static/webapp/images/audio_default.png';
            }
            let listRecomItem = getRightAttrVal('form_data.list_recommend.recommend_goods[0]', idata);
            if (listRecomItem) {
              idata.form_data.list_recommend.recommend_goods[0] = pickAttrObject({
                name: 'title',
                price: 'price',
                image: 'cover',
                id: 'id'
              }, listRecomItem)
            }
            newData.push(idata);
          }
          newData = oldData.concat(newData);
          if(sdata.page == 1){
            that.setData({
              myHistoryCount : res.count
            });
          }
          that.setData({
            myHistoryList: newData ,
            'myHistoryData.page' : sdata.page + 1
          });
        }
        that.setData({
          'myHistoryData.loading': false ,
          'myHistoryData.nomore' : res.is_more == 0 ? true : false
        });
      },
      fail: function(res){
        that.setData({
          'myHistoryData.loading': false
        });
      }
    });
  },
  imgLoad : function(event) {
    let owidth = event.detail.width,
        oheight = event.detail.height,
        path = event.currentTarget.dataset.path,
        oscale = owidth / oheight,
        cwidth = 290 ,
        cheight = 120,
        ewidth , eheight,
        newData = {};
    if( oscale > cwidth / cheight ){
      ewidth = cwidth;
      eheight = cwidth / oscale;
    }else{
      ewidth = cheight * oscale;
      eheight = cheight;
    }
    newData[path] = `width:${ewidth * 2.34}rpx;height:${eheight * 2.34}rpx;`;
    this.setData(newData);
  },
  getThemeColor : function( section_id ) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetSectionByPage',
      data: {
        page:  1 ,
        section_id : section_id,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0 && Array.isArray(res.data) && res.data[0]) {
          let info = res.data[0];
          that.setData({
            theme_color: info.theme_color
          });
        }
      }
    });
  },
  changeTab : function(event) {
    let type = event.currentTarget.dataset.type;
    this.setData({
      tabActive : type
    });
  },
  myArticleScroll : function(event) {
    this.getMyArticle();
  },
  myCommentScroll : function(event) {
    this.getMyComment();
  },
  turnBack : function(){
    app.turnBack();
  },
  turnToDetail : function(event) {
    let aId = event.currentTarget.dataset.id,
        sId = event.currentTarget.dataset.sid,
        verify = event.currentTarget.dataset.verify;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    this.verifyArticleExist(aId, sId, function (res) {
      let onlyOwnRecord = res == 1 ? 1 : '';
      if (res == 1 || res == 2) {
        app.turnToPage('/informationManagement/pages/communityDetail/communityDetail?detail=' + aId + '&onlyOwnRecord=' + onlyOwnRecord + franchiseeParam);
      }
      else {
        app.showModal({
          title: '提示',
          content: '话题不存在'
        });
      }
    });
  },
  turnToFailpass : function(event) {
    let id = event.currentTarget.dataset.id,
      audit = event.currentTarget.dataset.audit;
    if (audit != 2) {
      return;
    }
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/informationManagement/pages/communityFailpass/communityFailpass?detail=' + id + franchiseeParam);
  },
  turnToCommunityPublish : function(event) {
    let index = this.data.showMoreIdx,
        id = this.data.myArticleList[index].id,
        type = this.data.myArticleList[index].content.type == 2 ? 'link' : 'default';
        this.setData({ showActionSheet: false });
    if (this.data.myArticleList[index].audit_status == 0) {
      app.showModal({
        content: '待审核话题不可编辑'
      });
      return;
    }
    let communityOptions = {
      detail: this.data.communityId,
      articleId: id,
      type: type,
      franchisee: this.data.franchisee || ''
    };
    event.currentTarget.dataset = Object.assign({}, event.currentTarget.dataset, communityOptions);
    app.turnToCommunityPublish(event);
  },
  showMore : function(event) {
    let that = this,
        index = event.currentTarget.dataset.index,
        id = event.currentTarget.dataset.id,
        topicSectionId = this.data.myArticleList[index].section_id;
    let needAppeal = that.data.myArticleList[index].article_status == 2 ? true : false;// 话题是否屏闭
        that.setData({
          showActionSheet: true,
          showMoreIdx: index,
          showAppealBtn: needAppeal
        })
        if (needAppeal) {
          that.setData({ appealId: id, appealSectionId: topicSectionId  });
        }
  },
  deleteArticle : function( event ) {
    let that = this;
    let index = that.data.showMoreIdx;
    let targetTopic = that.data.myArticleList[index];
    let id = targetTopic.id;
    let sectionId = targetTopic.section_id;
    let isChargeTop = !!(targetTopic.top_flag == 1 && targetTopic.order_id);
    let content = isChargeTop ? '该话题为付费置顶话题，' : '';
    content += '是否删除这个话题？';
    that.setData({ showActionSheet: false });
    app.showModal({
      content : content,
      showCancel : true ,
      confirm : function(){
        app.sendRequest({
          url: '/index.php?r=AppSNS/DeleteArticle',
          data: {
            article_id : id ,
            section_id : that.data.communityId || sectionId,
            sub_app_id: that.data.franchisee
          },
          method: 'post',
          success: function (res) {
            if (res.status == 0) {
              let newData = {},
                  list = that.data.myArticleList;
              list.splice(index , 1);
              newData.myArticleList = list;
              newData.myArticleCount = that.data.myArticleCount - 1;
              that.setData(newData);
              app.globalData.communityPageRefresh = true;
              app.showModal({
                content: '删除成功'
              });
            }
          }
        });
      }
    })
  },
  deleteComment : function( event ) {
    let that = this,
        id = event.currentTarget.dataset.id,
        index = event.currentTarget.dataset.index,
        article_id = event.currentTarget.dataset.obj_id,
        sectionId = event.currentTarget.dataset.sid;
    app.showModal({
      content : '是否删除这个评论？',
      showCancel : true ,
      confirm : function(){
        app.sendRequest({
          url: '/index.php?r=AppSNS/DeleteComment',
          data: {
            article_id : article_id ,
            section_id : that.data.communityId || sectionId,
            comment_id : id, // 评论id
            sub_app_id: that.data.franchisee
          },
          method: 'post',
          success: function (res) {
            if (res.status == 0) {
              let newData = {},
                  list = that.data.myCommentList;
              list.splice(index , 1);
              newData.myCommentList = list;
              newData.myCommentCount = that.data.myCommentCount - 1;
              that.setData(newData);
              app.globalData.communityPageRefresh = true;
            }
          }
        });
      }
    })
  },
  changeAppealState: function (event) {
    var showAppeal = this.data.showAppeal;
    this.setData({ showAppeal: !showAppeal, showActionSheet: false});
  },
  appealInput: function (event) {
    let val = event.detail.value;
    this.setData({appealReason: val});
  },
  submitAppeal: function (event) {
    let that = this,
        appealReason = this.data.appealReason;
    if (!appealReason) {
      app.showModal({content: '请输入申诉原因'});
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppSNS/AddExplain',
      data: {
        section_id: this.data.appealSectionId,
        article_id: this.data.appealId,
        content: appealReason,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          app.showModal({ content: '提交成功' });
          let showMoreIdx = that.data.showMoreIdx,
              newData = {},
              list = that.data.myArticleList;
          newData['myArticleList[' + showMoreIdx +'].article_status'] = 3;
          newData.appealReason = '';
          that.setData(newData);
          that.changeAppealState();
        }else {
          app.showModal({ content: '提交失败' });
        }
      }
    })
  },
  closeActionSheet: function (event) {
    this.setData({showActionSheet: false});
  },
  verifyArticleExist: function (aId, sId, cb) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/DoesArticleExist',
      data: {
        article_id: aId,
        section_id: sId,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (typeof cb == 'function') {
            cb(res.data);
          }
        }
        else {
          alertTip('查询话题失败');
        }
      }
    })
  },
  onPageScroll: function ({scrollTop}) {
    let { tadNeedFixed } = this.data;
    let flag = this.tabIfNeedFixed(scrollTop);
    if (tadNeedFixed ^ flag) {
      this.setData({
        tadNeedFixed: flag
      })
    }
    this.pageScrollTop = scrollTop;
  },
  tabIfNeedFixed: null, // 页面tab是否需要定位
  getScrollRelateRects: function () {
    let that = this;
    let { windowHeight } = wx.getSystemInfoSync(); // globalData里面的系统参数里面windowHeight可能减掉了底部tab的高度
    app.getBoundingClientRect('#communityUsercenter-userinfo, #communityUsercenter-tab', rects => {
      let userInfoRect = rects[0],
      tabInfoRect = rects[1],
      userInfoHeight = userInfoRect.height,
      tabInfoHeight = tabInfoRect.height;
      that.tabIfNeedFixed = tabIfNeedFixed(userInfoHeight);
      that.setData({
        userInfoHeight,
        tabInfoHeight,
        contentHeight: windowHeight - tabInfoHeight
      });
    })
  },
  tapPrevewPictureHandler: function (event) {
    app.tapPrevewPictureHandler(event);
  },
  tapBackToTop: function () {
    let {
      tabActive
    } = this.data;
    this.setData({
      [`${tabActive}ScrollTop`]: 0
    });
    if (this.pageScrollTop > 0) {
      wx.pageScrollTo({scrollTop: 0});
      this.pageScrollTop = 0;
    }
  },
  bindScrollEvent: function (e) {
    let that = this,
    { tabActive } = this.data,
    { scrollTop } = e.detail;
    if (this[`${tabActive}ScrollTimer`]) {
      clearTimeout(this[`${tabActive}ScrollTimer`]);
      this[`${tabActive}ScrollTimer`] = null;
    }
    this[`${tabActive}ScrollTimer`] = setTimeout(function () {
      that.setData({
        [`${tabActive}ScrollTop`]: scrollTop
      })
    }, 100);
  },
  getUserInfoByUserToken: function (usertoken,sourcetype) {
    if (!usertoken) {
      return;
    }
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetUserInfo',
      data: {
        source_type: sourcetype,
        user_token: usertoken
      },
      success: ({data}) => {
        let newdata = {};
        newdata.userInfo = pickAttrObject({
          name: 'nickname',
          headimgurl: 'cover_thumb',
          gender: 'sex',
          usertoken: 'user_token'},
          data);
        app.setPageTitle(data.nickname || '个人中心');
        that.setData(newdata);
      }
    })
  },
  turnToGoodsDetail: function (e) {
    let {
      id
    } = e.currentTarget.dataset;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + franchiseeParam);
  },
  cancelReply: function () {
    this.setData({ showReplyBox: false, replyBoxFocus: false });
    this.clearCommentInput();
  },
  replyInput: function (event) {
    this.setData({
      'replyParam.text': event.detail.value
    });
  },
  replyFocus: function (e) {
    if (e.detail.height) {
      let curKbHeight = e.detail.height;
      kbHeight = e.detail.height;
      if (/iPhone\s?X/i.test(app.globalData.systemInfo.model)) {
        curKbHeight = 365;
      }
      this.setData({
        'replyBoxFocus': true,
        'keyboardHeight': curKbHeight + 'px'
      });
      return;
    }
    this.setData({ 'replyBoxFocus': true });
  },
  replyBlur: function (e) {
    this.setData({
      'replyBoxFocus': false,
      'replyParam.text': e.detail.value
    });
  },
  getCurrentLocation: function () {
    let locationInfo = app.globalData.locationInfo;
    return new Promise((resolve, reject) => {
      if (locationInfo.latitude) {
        resolve(locationInfo);
      }
      app.getLocation({
        success: resolve,
        fail: reject
      });
    })
  },
  replyLineChange: function (e) {
    let that = this;
    let lineHeight = 40;
    let marginTop = 45;
    let commentContentHeight = lineHeight;
    let maxHeight = this.data.commentContentMaxHeight;
    app.getBoundingClientRect('#comment-box', (rect) => {
      if (Array.isArray(rect) && rect[0]) {
        commentContentHeight = e.detail.lineCount * lineHeight;
        if (rect[0].top > marginTop && e.detail.lineCount >= 1) {
          if (rect[0].top - marginTop <= lineHeight) {
            maxHeight = commentContentHeight + lineHeight;
            that.setData({
              commentContentMaxHeight: maxHeight
            })
          }
          that.setData({
            commentContentHeight
          })
        }
        if (rect[0].top <= marginTop && commentContentHeight <= maxHeight) {
          that.setData({
            commentContentHeight
          })
        }
      }
    })
  },
  replyImageChoose: function () {
    let that = this;
    app.chooseImage((imageUrls) => {
      that.setData({
        ['replyParam.comment_img_url']: imageUrls[0]
      })
    }, 1)
  },
  replyImagePreview: function () {
    let commentImage = this.data.replyParam.comment_img_url;
    app.previewImage({
      current: commentImage
    })
  },
  replyImageDelete: function () {
    this.setData({
      ['replyParam.comment_img_url']: ''
    })
  },
  replyLocationChoose: function () {
    let that = this;
    app.chooseLocation({
      success({ name, address, latitude, longitude }) {
        let newdata = {};
        newdata['replyParam.latitude'] = latitude;
        newdata['replyParam.longitude'] = longitude;
        if (name || address) {
          newdata['replyParam.address'] = name || address;
        } else {
          that.getLocByLatAndLng(latitude, longitude, function (res) {
            address = res.address || '';
            that.setData({
              ['replyParam.address']: address
            });
          })
        }
        that.setData(newdata);
      }
    })
  },
  replyLocationDelete: function () {
    this.setData({
      ['replyParam.address']: '',
      ['replyParam.latitude']: '',
      ['replyParam.longitude']: ''
    })
  },
  getLocByLatAndLng: function (lat, lng, cb) {
    app.sendRequest({
      url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
      data: {
        latitude: lat,
        longitude: lng
      },
      method: 'post',
      success: function (data) {
        if (data.status == 0 && typeof cb == 'function') {
          cb(data.data);
        }
      }
    })
  },
  clearCommentInput: function () {
    this.setData({
      ['replyParam.text']: '',
      ['replyParam.agent_user_token']: '',
      ['replyParam.address']: '',
      ['replyParam.latitude']: '',
      ['replyParam.longitude']: '',
      ['replyParam.comment_img_url']: '',
      ['replyParam.comment_id']: '',
      ['replyParam.parent_comment_id']: ''
    })
  },
  turnComment: function (event) {
    let {
      sectionId,
      commentId,
      parentCommentId,
      articleId,
      agentUserToken,
      requireArticlePost,
      requireArticleComment
    } = event.currentTarget.dataset;
    if (requireArticlePost == 0 || requireArticleComment == 0) {
      app.showModal({
        content: '当前话题圈组不允许评论'
      });
      return;
    }
    let newData = {};
    newData['showReplyBox'] = true;
    newData['replyPlaceholder'] = '评论话题...';
    newData['replyParam.section_id'] = sectionId;
    newData['replyParam.article_id'] = articleId;
    newData['replyParam.comment_id'] = commentId;
    newData['replyParam.parent_comment_id'] = parentCommentId;
    newData['replyParam.agent_user_token'] = agentUserToken;
    this.setData(newData);
    setTimeout(() => {
      this.setData({
        replyBoxFocus: true
      });
    }, 500);
  },
  replyTimer: null,
  submitReply: function (event, repeat) {
    let that = this,
      {
        replyParam,
        franchisee
      } = this.data;
    if (this.replyTimer) {
      clearTimeout(this.replyTimer);
      this.replyTimer = null;
    }
    replyParam.text = replyParam.text.trim(); // 去除两端的空格
    if (!replyParam.text) {
      if (repeat === undefined) {
        this.replyTimer = setTimeout(() => this.submitReply(event, true), 500);
        return;
      }
      app.showModal({ content: '请填写回复内容' });
      return;
    }
    if (isReply) {
      return;
    }
    isReply = true;
    if (!replyParam.sub_app_id && franchisee) { // 子店话题详情回复评论
      replyParam.sub_app_id = franchisee;
    }
    app.sendRequest({
      url: '/index.php?r=AppSNS/AddComment',
      data: replyParam,
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let myArticleListIndex = that.data.myArticleList.findIndex((article) => article.section_id === replyParam.section_id && article.id === replyParam.article_id);
          let myHistoryListIndex = that.data.myHistoryList.findIndex((article) => article.section_id === replyParam.section_id && article.id === replyParam.article_id);
          app.showToast({
            title: '回复成功',
            success: function () {
              let newData = {
                showReplyBox: false,
                replyBoxFocus: false
              };
              if (myArticleListIndex > -1) {
                newData['myArticleList[' + myArticleListIndex + '].comment_count'] = that.data.myArticleList[myArticleListIndex].comment_count - 0 + 1;
              }
              if (myHistoryListIndex > -1) {
                newData['myHistoryList[' + myHistoryListIndex + '].comment_count'] = that.data.myHistoryList[myHistoryListIndex].comment_count - 0 + 1;
              }
              that.setData(newData);
            }
          });
          that.relatePagesRefresh();
          that.clearCommentInput();
        }
      },
      complete: function (res) {
        isReply = false;
      }
    });
  },
  relatePagesRefresh: function () {
    app.globalData.topicRefresh = true;
    app.globalData.communityPageRefresh = true;
    app.globalData.communityUsercenterRefresh = true;
    app.globalData.franchiseeCommunity = true;
  },
  articleLike: function (event) {
    let that = this,
      liked = event.currentTarget.dataset.liked,
      id = event.currentTarget.dataset.id,
      likeCount = +event.currentTarget.dataset.likeCount;
    if (likeTap) { return; };
    likeTap = true;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/PerformLike',
      data: {
        obj_type: 1,  // obj_type 1-话题 2-评论
        obj_id: id,     // obj_id 话题或评论的id
        sub_app_id: that.data.franchisee || app.getChainId(),
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let myArticleListIndex = that.data.myArticleList.findIndex((article) => article.id === id);
          let myHistoryListIndex = that.data.myHistoryList.findIndex((article) => article.id === id);
          let newData = {};
          if (liked == 1) {
            if (myArticleListIndex > -1) {
              newData['myArticleList[' + myArticleListIndex + '].is_liked'] = 0;
              newData['myArticleList[' + myArticleListIndex + '].like_count'] = likeCount - 1;
            }
            if (myHistoryListIndex > -1) {
              newData['myHistoryList[' + myHistoryListIndex + '].is_liked'] = 0;
              newData['myHistoryList[' + myHistoryListIndex + '].like_count'] = likeCount - 1;
            }
            app.showToast({ title: '点赞取消' });
          } else {
            if (myArticleListIndex > -1) {
              newData['myArticleList[' + myArticleListIndex + '].is_liked'] = 1;
              newData['myArticleList[' + myArticleListIndex + '].like_count'] = likeCount + 1;
            }
            if (myHistoryListIndex > -1) {
              newData['myHistoryList[' + myHistoryListIndex + '].is_liked'] = 1;
              newData['myHistoryList[' + myHistoryListIndex + '].like_count'] = likeCount + 1;
            }
            app.showToast({ title: '点赞成功' });
          }
          that.setData(newData);
        }
      },
      complete: function () {
        likeTap = false;
      }
    });
  },
})
