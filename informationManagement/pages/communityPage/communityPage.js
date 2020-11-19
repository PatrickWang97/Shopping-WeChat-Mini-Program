const app = getApp();
const util = require('../../../utils/util.js');
var customEvent = require('../../../utils/custom_event.js');
let isTurnToDetail = false;
let likeTap = false; //防止重复点击
let isReply = false; //防止重复点击
let kbHeight = '';
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
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      type: 3,
      title: '圈组'
    },
    communityId: '',
    communityInfo: {},
    memberInfo: [],
    memberCount: '',
    category: [{
      value: 0,
      name: '全部',
      attr: 'category_id'
    }],
    activeCategory: {
      value: 0,
      name: '全部',
      attr: 'category_id'
    },
    carouselImg: [],
    sectionList: [],
    getSectionData: {
      page: 1,
      loading: false,
      nomore: false
    },
    search_value: '',
    imgData: {},
    showAddArticleBtn: true,
    hasCarousel: false,
    backTop: 0,
    showActionSheet: false,
    phoneNumCall: '',
    showBackTopBtn: false,
    showContact: false,
    showReplyBox: false,
    replyBoxFocus: false,
    closeDec: false,
    noticeDec: '',
    keyboardHeight: '50%',
    replyPlaceholder: '我来说两句',
    video_url: '',
    listOtherParam: {
      orderby: '', // 排序(默认按板块排序走)
      top_flag: 0, //如果为1 筛选置顶帖
      hot_flag: 0, //如果为1 筛选精品贴
      start_date: '', // 查询开始日期
      end_date: '', //查询结束日期
      latitude: '', // 纬度
      longitude: '' // 经度
    },
    currentSortbyName: '', // 当前显示的排序名称
    sortModal: { // 排序弹窗
      show: false,
      data: [{
          name: '最热话题',
          value: 'comment_count'
        },
        {
          name: '最新发表',
          value: 'add_time'
        },
        {
          name: '距离最近',
          value: 'distance'
        },
        {
          name: '最热回复',
          value: 'last_comment_time'
        }
      ]
    },
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
    currentTab: 0,
    topicMoreOperationModal: {
      mode: '', // 话题风格
      show: false, // 是否显示话题操作弹窗
      index: 0, // 当前被操作话题下标
      isAuthor: false, // 是否是作者自己的话题
      articleId: '', // 话题id
      sectionId: '', // 版块id
      franchisee: '', // 子店app_id
      isChargeTop: false, // 是否为置顶收费话题
      phone: '', // 联系手机号
    },
    vistorUserToken: '',
    sectionCommentLikeCounts: {
      comment_count: 0, // 社区话题被评论的次数
      like_count: 0, // 社区话题被点赞的次数
      show_type: 0, // 最新消息类型 0： 评论， 1： 点赞
    }
  },
  onLoad: function (options) {
    let communityId = options.detail;
    let that = this;
    let franchisee = options.franchisee || '';
    this.setData({
      communityId: communityId,
      franchisee: franchisee,
      ['replyParam.sub_app_id']: franchisee,
      sessionFrom: options.franchisee || app.getAppId() || '',
    });
    app.globalData.communityPageRefresh = false;
    if (app.isLogin()) {
      that.getSectionInfo(communityId, function () {
        that.getMemberInfo(communityId);
        that.getCategory(communityId);
      });
      this.setData({
        vistorUserToken: (app.getUserInfo() || {})['user_token'] || ''
      });
    } else {
      app.goLogin({
        success: function () {
          that.getSectionInfo(communityId, function () {
            that.getMemberInfo(communityId);
            that.getCategory(communityId);
          });
          that.setData({
            vistorUserToken: (app.getUserInfo() || {})['user_token'] || ''
          });
        }
      });
    }
    this.systemInfo = wx.getSystemInfoSync();
    this.getSysnInfoTimer = setTimeout(() => {
      let systemInfo = wx.getSystemInfoSync();
      if (systemInfo.windowHeight !== this.systemInfo.windowHeight) {
        this.systemInfo = systemInfo;
      }
    }, 500);
    that.getSectionCommentLikeCount();
  },
  onShow: function () {
    if (app.globalData.communityPageRefresh) {
      this.setData({
        getSectionData: {
          page: 1,
          loading: false,
          nomore: false
        },
        sectionList: []
      });
      app.globalData.communityPageRefresh = false;
      this.getSectionList();
      this.getSectionCommentLikeCount();
    }
    isTurnToDetail = false;
  },
  getSectionInfo: function (sId, callback) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetSectionByPage',
      data: {
        section_id: sId,
        page: 1,
        page_size: 100,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data[0] || {};
          that.setData({
            communityInfo: info,
            showContact: (info.require_phone == 1),
            showArticleComment: (info.show_article_comment == 1),
            'topNavBarData.type': info.article_style == 3 ? '4' : '3'
          });
          app.setStorage({
            key: 'communityThemeColor-' + info.id,
            data: info.theme_color
          });
          if (info.has_carousel == 1) {
            that.getCarousel(sId);
            that.setData({
              hasCarousel: true
            });
          }
          typeof callback == 'function' && callback(res);
        }
      }
    });
  },
  getMemberInfo: function (sId) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetSectionJoinUserList',
      data: {
        section_id: sId,
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let memberInfo = res.data;
          let memberCount = res.user_total;
          that.setData({
            memberInfo: memberInfo,
            memberCount: memberCount
          });
        }
      }
    })
  },
  getCategory: function (sId) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetCategoryByPage',
      data: {
        section_id: sId,
        page: 1,
        page_size: 100,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data,
            cData = that.data.category;
          cData = cData.concat(info.map(item => {
            return Object.assign({
                attr: 'category_id'
              },
              pickAttrObject({
                value: 'id',
                name: 'name'
              }, item));
          }));
          cData.splice(1, 0, {
            value: 1,
            attr: 'hot_flag',
            name: '精品'
          });
          that.setData({
            category: cData
          });
          that.getSectionList();
        }
      }
    });
  },
  getSectionList: function () {
    let that = this,
      sdata = that.data.getSectionData;
    if (sdata.loading || sdata.nomore) {
      return;
    }
    sdata.loading = true;
    let param = pickAttrObject({
      section_id: 'communityId',
      category_id: 'activeCategory.value',
      article_style: 'communityInfo.article_style',
      search_value: 'search_value', // 查询值
      sub_app_id: 'franchisee',
    }, this.data);
    param.page = sdata.page;
    param.page_size = 10;
    param.is_advertise = 1;
    param.is_publish = 1;
    param = Object.assign({}, param, this.data.listOtherParam);
    if (param.hot_flag > 0) {
      param.category_id = 0;
    }
    if (param.orderby === 'distance') { // 距离最近排序需要添加参数order，其他排序不用
      param.order = 'asc';
    } else if ('order' in param) {
      delete param.order;
    }
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetArticleByPage',
      data: param,
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data,
            oldData = that.data.sectionList,
            newData = [];
          for (let i = 0; i < info.length; i++) {
            let idata = info[i];
            if (!idata.wechat_id) {
              let ctext = that.showEllipsis(idata.content.text || '');
              idata.title = unescape(idata.title.replace(/\\u/g, "%u"));
              idata.content_text = ctext.text;
              idata.isellipsis = ctext.isellipsis;
              if (idata.content.type == 2) {
                if (idata.content.url.article) {
                  delete idata.content.url.article.body;
                  if (idata.content.url.article.type == 3) {
                    idata.content.url.article.cover = app.globalData.cdnUrl + '/zhichi_frontend/static/webapp/images/audio_default.png';
                  }
                }
              }
              let listRecomItem = getRightAttrVal('form_data.list_recommend.recommend_goods[0]', idata);
              if (listRecomItem) {
                idata.form_data.list_recommend.recommend_goods[0] = pickAttrObject({
                  name: 'title',
                  price: 'price',
                  image: 'cover',
                  id: 'id',
                  goods_type: 'goods_type',
                  app_id: 'app_id'
                }, listRecomItem)
              }
            }
            if ((idata.style == 2 || idata.style == 3) && idata.video_data) {
              idata['video_url'] = '';
            }
            let date = new Date(idata.update_time * 1000)
            idata['month'] = date.getMonth() + 1;
            idata['day'] = date.getDate();
            if (idata['month'] < 10) {
              idata['month'] = '0' + String(idata['month'])
            }
            if (idata['day'] < 10) {
              idata['day'] = '0' + String(idata['day'])
            }
            idata.topicMoreOperationModal = {
              index:i,
              isAuthor: idata.user_token === (app.getUserInfo() || {})['user_token'],
              articleId: idata.id,
              sectionId: idata.section_id,
              isChargeTop: !!(idata.top_flag == 1 && idata.order_id)
            }
            newData.push(idata);
          }
          if (sdata.page > 1) {
            newData = oldData.concat(newData);
          }
          that.setData({
            sectionList: newData,
            'getSectionData.page': sdata.page + 1
          });
        }
        that.setData({
          'getSectionData.loading': false,
          'getSectionData.nomore': res.is_more == 0 ? true : false
        });
      },
      fail: function (res) {
        that.setData({
          'getSectionData.loading': false
        });
      }
    });
  },
  getCarousel: function (sId) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetArticleByPage',
      data: {
        page: 1,
        section_id: sId,
        is_carousel: 1,
        orderby: 'id',
        page_size: 10,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          var info = res.data;
          that.setData({
            carouselImg: info
          });
        }
      }
    });
  },
  turnToAdDetail: function (event) {
    if (event.currentTarget.dataset.articleType == 3) {
      this.bindEventTapHandler(event);
      return;
    }
    let id = event.currentTarget.dataset.id;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/informationManagement/pages/newsDetail/newsDetail?detail=' + id + franchiseeParam);
  },
  bindEventTapHandler: function (e) {
    let form = e.currentTarget.dataset.eventParams;
    let action = form.action;
    let sub_app_id = this.data.franchisee;
    if (action && form && sub_app_id) {
      customEvent.clickEventHandler[action](form, sub_app_id);
      return;
    }
    customEvent.clickEventHandler[action] && customEvent.clickEventHandler[action](form);
  },
  clickTab: function (e) {
    var that = this;
    if (this.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      that.setData({
        currentTab: e.target.dataset.current,
      })
    }
  },
  announceModal: function (e) {
    this.setData({
      closeDec: true,
      noticeDec: e.currentTarget.dataset.text
    })
  },
  showIcon: function () {
    this.setData({
      closeDec: true
    })
  },
  closeIcon: function () {
    this.setData({
      closeDec: false
    })
  },
  stopEvent: function (e) {
    let that = this;
    let video_id = e.currentTarget.dataset.id;
    let index = e.currentTarget.dataset.index;
    let sectionList = that.data.sectionList;
    if (!sectionList[index].video_url) {
      app.getVideoUrlById(video_id, function (res) {
        sectionList[index].video_url = res;
        that.setData({
          sectionList: sectionList,
          video_url: res
        })
      })
    }
    return false;
  },
  tapCategory: function (event) {
    let {
      attr,
      value,
      index
    } = event.currentTarget.dataset,
      activeCategory = this.data.category[index],
      newdata = {};
    if (attr === 'hot_flag') {
      newdata['listOtherParam.hot_flag'] = value;
    } else if (attr === 'category_id') {
      newdata['listOtherParam.hot_flag'] = 0;
    }
    newdata.activeCategory = activeCategory;
    newdata.sectionList = [];
    newdata.getSectionData = {
      page: 1,
      loading: false,
      nomore: false
    }
    this.setData(newdata);
    this.getSectionList();
  },
  onReachBottom: function (event) {
    this.getSectionList();
  },
  oldscrolltop: 0,
  onPageScroll: function ({
    scrollTop
  }) {
    let showBackTopBtn = this.data.showBackTopBtn,
      showFlag = scrollTop < this.oldscrolltop && scrollTop;
    if (showBackTopBtn ^ showFlag) {
      this.setData({
        showBackTopBtn: showFlag
      });
    }
    this.oldscrolltop = scrollTop;
  },
  bindKeyInput: function (event) {
    let val = event.detail.value;
    this.setData({
      'search_value': val
    });
  },
  bindconfirmInput: function (event) {
    this.setData({
      sectionList: [],
      getSectionData: {
        page: 1,
        loading: false,
        nomore: false
      }
    });
    this.getSectionList();
  },
  imgLoad: function (event, ) {
    let owidth = event.detail.width,
      oheight = event.detail.height,
      index = event.currentTarget.dataset.index,
      path = event.currentTarget.dataset.path,
      oscale = owidth / oheight,
      cwidth = 290,
      cheight = 120,
      ewidth, eheight;
    if (this.data.communityInfo.article_style == 2) {
      cwidth = 240;
    }
    if (oscale > cwidth / cheight) {
      ewidth = cwidth;
      eheight = cwidth / oscale;
    } else {
      ewidth = cheight * oscale;
      eheight = cheight;
    }
    this.setData({
      [path]: `width:${ewidth}px;height:${eheight}px;`
    });
  },
  showEllipsis: function (oldtext) {
    let that = this,
      padding = that.data.communityInfo.article_style == 2 ? 70 : 25,
      newtext = '',
      newtextarr = [],
      textarr = oldtext.split(/\n|\\n/),
      eachline = (app.getSystemInfoData().windowWidth - padding) / 12 * 2,
      total_line_num = 2,
      has_line_num = 0,
      isellipsis = false;
    for (let i = 0; i < textarr.length; i++) {
      let len = that.stringLength(textarr[i]),
        lenline = Math.ceil(len / eachline);
      if (has_line_num + lenline >= total_line_num) {
        let spare_line = total_line_num - has_line_num;
        newtextarr.push(that.subString(textarr[i], (spare_line * eachline - 16)) + '...');
        isellipsis = true;
        break;
      } else {
        has_line_num += lenline;
        newtextarr.push(textarr[i]);
      }
    }
    if (isellipsis) {
      newtext = newtextarr;
    } else {
      newtext = textarr;
    }
    return {
      text: newtext,
      isellipsis: isellipsis
    };
  },
  stringLength: function (str) {
    let realLength = 0,
      len = str.length,
      charCode = -1;
    for (let i = 0; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode > 128) {
        realLength += 2;
      } else {
        realLength += 1;
      }
    }
    return realLength;
  },
  subString: function (str, len) {
    let newLength = 0,
      newStr = "",
      chineseRegex = /[^\x00-\xff]/g,
      singleChar = "",
      strLength = str.replace(chineseRegex, "**").length;
    for (let i = 0; i < strLength; i++) {
      singleChar = str.charAt(i).toString();
      if (singleChar.match(chineseRegex) != null) {
        newLength += 2;
      } else {
        newLength++;
      }
      if (newLength > len) {
        break;
      }
      newStr += singleChar;
    }
    if (strLength > len) {
      newStr += "...";
    }
    return newStr;
  },
  turnToDetail: function (event) {
    if (isTurnToDetail) {
      return;
    }
    isTurnToDetail = true;
    let id = event.currentTarget.dataset.id,
      dataLiked = event.currentTarget.dataset.liked,
      phoneNumber = event.currentTarget.dataset.phone,
      article_style = this.data.communityInfo.article_style,
      communityId = this.data.communityId;
    let newData = {};
    newData.sectionList = this.data.sectionList.map(function (item, idx) {
      if (item.showCom) {
        delete item.showCom;
      }
      if (item.id === id) {
        item.read_count = +item.read_count + 1;
      }
      return item;
    });
    this.setData(newData);
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/informationManagement/pages/communityDetail/communityDetail?detail=' + id + '&articleStyle=' + article_style + '&dataLiked=' + dataLiked + '&phoneNumber=' + phoneNumber + '&sectionid=' + communityId + franchiseeParam);
  },
  turnToUsercenter: function (event) {
    let userInfo = app.getUserInfo();
    if (!userInfo || !userInfo.user_token) {
      app.showModal({
        content: '您暂未登陆，请先登陆'
      });
      return;
    }
    let {
      usertoken,
      sourcetype
    } = event.currentTarget.dataset;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    if (usertoken) {
      franchiseeParam += '&usertoken=' + usertoken + '&sourcetype=' + sourcetype;
    }
    app.turnToPage('/informationManagement/pages/communityUsercenter/communityUsercenter?detail=' + this.data.communityId + franchiseeParam);
  },
  turnToNotify: function (event) {
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    let sectionCommentLikeCounts = this.data.sectionCommentLikeCounts;
    let commentCount = sectionCommentLikeCounts.comment_count;
    let likeCount = sectionCommentLikeCounts.like_count;
    let showType = sectionCommentLikeCounts.show_type;
    let commentLikeInfo = (commentCount > 0 ? '&comment=' + commentCount : '') + (likeCount > 0 ? '&like=' + likeCount : '') + '&showtype=' + showType;
    app.turnToPage('/informationManagement/pages/communityNotify/communityNotify?detail=' + this.data.communityId + franchiseeParam + commentLikeInfo);
  },
  turnToPublish: function (event) {
    this.setData({
      'communityPublishType.show': true,
      'communityPublishType.communityPublish': {
        'franchisee': this.data.franchisee,
        'detail': this.data.communityId,
        'reqAudit': this.data.communityInfo.require_audit,
        'from': 'communityPage'
      }
    });
  },
  turnComment: function (event) {
    let requireArticlePost = this.data.communityInfo.require_article_post;
    let requireArticleComment = this.data.communityInfo.require_article_comment;
    if (requireArticlePost == 0 || requireArticleComment == 0) {
      app.showModal({
        content: '当前话题圈组不允许评论'
      });
      return;
    }
    let {
      sectionId,
      commentId,
      parentCommentId,
      replyto,
      articleId,
      index,
      agentUserToken
    } = event.currentTarget.dataset;
    let newData = {};
    if (this.data.communityInfo.article_style == 2) {
      newData['sectionList[' + index + '].showCom'] = false;
    }
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
  articleLike: function (event) {
    let that = this,
      liked = event.currentTarget.dataset.liked,
      id = event.currentTarget.dataset.id,
      index = event.currentTarget.dataset.index,
      likeCount = +event.currentTarget.dataset.likeCount;
    if (likeTap) {
      return;
    };
    likeTap = true;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/PerformLike',
      data: {
        obj_type: 1, // obj_type 1-话题 2-评论
        obj_id: id, // obj_id 话题或评论的id
        sub_app_id: that.data.franchisee || app.getChainId(),
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (liked == 1) {
            let newData = {};
            newData['sectionList[' + index + '].is_liked'] = 0;
            newData['sectionList[' + index + '].like_count'] = likeCount - 1;
            that.setData(newData);
            app.showToast({
              title: '点赞取消'
            });
          } else {
            let newData = {};
            newData['sectionList[' + index + '].is_liked'] = 1;
            newData['sectionList[' + index + '].like_count'] = likeCount + 1;
            that.setData(newData);
            app.showToast({
              title: '点赞成功'
            });
          }
          that.getArticleLikeImgs(event);
          setTimeout(function () {
            let newData = {};
            newData['sectionList[' + index + '].showCom'] = false;
            that.setData(newData);
          }, 480);
          that.getSectionCommentLikeCount();
        }
      },
      complete: function () {
        likeTap = false;
      }
    });
  },
  showCommentBox: function (event) {
    let that = this,
      index = event.currentTarget.dataset.index,
      flag = this.data.sectionList[index].showCom,
      newData = {};
    newData.sectionList = this.data.sectionList.map(function (item, idx) {
      if (item.showCom) {
        delete item.showCom;
      }
      return item;
    });
    if (!flag) {
      newData.sectionList[index].showCom = true;
    }
    this.setData(newData);
  },
  getArticleLikeImgs: function (event) {
    let that = this,
      id = event.currentTarget.dataset.id,
      index = event.currentTarget.dataset.index;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/GetLikeLogByPage',
      data: {
        obj_type: 1, // obj_type 1-话题 2-评论
        obj_id: id, // obj_id 话题或评论的id
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let dataArr = res.data,
            headImgArr = [],
            newData = {};
          dataArr.map(function (item, idx) {
            headImgArr.push({
              headimgurl: item.headimgurl,
              nickname: item.nickname
            });
          })
          newData['sectionList[' + index + '].like'] = headImgArr;
          that.setData(newData);
        }
      }
    });
  },
  showActionSheet: function (event) {
    if (this.data.topicMoreOperationModal.show) {
      this.setData({
        'topicMoreOperationModal.show': false
      });
    }
    let that = this,
      telNum = event.currentTarget.dataset.tel,
      telArr = [telNum.substr(0, 3), telNum.substr(3, 4), telNum.substr(7)],
      isIphone = /ios/i.test(app.globalData.systemInfo.platform);
    if (isIphone) {
      wx.makePhoneCall({
        phoneNumber: telNum,
        success: function () {},
        fail: function () {}
      })
    } else {
      that.setData({
        phoneNumCall: telArr.join('-'),
        showActionSheet: true
      });
    }
  },
  backPageTop: function (event) {
    wx.pageScrollTo({
      scrollTop: 0
    });
  },
  onShareAppMessage: function (res) {
    if (this.data.topicMoreOperationModal.show) {
      this.setData({
        'topicMoreOperationModal.show': false
      });
    }
    let shareTitle = this.data.communityInfo.name;
    let sharePath = util.getCurrentPageUrlWithArgs();
    if (res.from === 'button') {
      let index = res.target.dataset.index,
        id = res.target.dataset.id,
        articleTitle = this.data.sectionList[index].title,
        franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '',
        articlePath = '/informationManagement/pages/communityDetail/communityDetail?detail=' + id + franchiseeParam;
      shareTitle = articleTitle;
      sharePath = articlePath;
    }
    sharePath += '&from_share=1';
    return app.shareAppMessage({
      title: shareTitle,
      path: sharePath,
      success: function (res) {
        app.showToast({
          title: '转发成功'
        });
      },
      fail: function (res) {}
    })
  },
  stopPropagation: function (event) {},
  closeActionSheet: function (event) {
    this.setData({
      showActionSheet: false
    });
  },
  makePhoneCall: function (event) {
    let phoneNumCall = this.data.phoneNumCall;
    wx.makePhoneCall({
      phoneNumber: phoneNumCall.replace(/\-/g, ''),
      success: function () {},
      fail: function () {
        app.showModal({
          content: '播打电话失败'
        });
      }
    })
    this.closeActionSheet();
  },
  cancelReply: function () {
    this.setData({
      showReplyBox: false,
      replyBoxFocus: false
    });
    this.clearCommentInput();
  },
  replyInput: function (event) {
    this.setData({
      'replyParam.text': event.detail.value
    });
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
      app.showModal({
        content: '请填写回复内容'
      });
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
          app.showToast({
            title: '回复成功',
            success: function () {
              that.setData({
                showReplyBox: false,
                replyBoxFocus: false
              });
            }
          });
          that.relatePagesRefresh();
          that.clearCommentInput();
        }
        that.refreshOneTopicData({
          articleId: replyParam.article_id
        })
        that.getSectionCommentLikeCount();
      },
      complete: function (res) {
        isReply = false;
      }
    });
  },
  tapPrevewPictureHandler: function (e) {
    app.tapPrevewPictureHandler(e);
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
    this.setData({
      'replyBoxFocus': true
    });
  },
  replyBlur: function (e) {
    this.setData({
      'replyBoxFocus': false,
      'replyParam.text': e.detail.value
    });
  },
  tapShowSortModal: function () {
    this.setData({
      ['sortModal.show']: true
    });
  },
  tapCloseSortModal: function () {
    this.setData({
      ['sortModal.show']: false
    });
  },
  tapSelectSortItem: function (e) {
    let that = this;
    let {
      orderby,
      name
    } = e.target.dataset;
    this.setData({
      ['listOtherParam.orderby']: orderby,
      currentSortbyName: name,
      getSectionData: {
        page: 1,
        loading: false,
        nomore: false
      }
    });
    if (orderby === 'distance' && (!this.data.listOtherParam.latitude)) {
      this.getCurrentLocation().then(({
        latitude,
        longitude
      }) => {
        that.setData({
          ['listOtherParam.latitude']: latitude,
          ['listOtherParam.longitude']: longitude
        });
        this.getSectionList();
      }).catch(err => {
        console.log(err);
      })
      return;
    }
    this.getSectionList();
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
    let commentImage = this.data.replyParam.comment_img_url
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
      success({
        name,
        address,
        latitude,
        longitude
      }) {
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
  turnToGoodsDetail: function (event) {
    let dataset = event.currentTarget.dataset;
    let id = dataset.id;
    let style = dataset.goodsType;
    let appId = dataset.appId;
    let franchiseeId = appId === app.getAppId() ? this.data.franchisee : appId;
    let franchiseeParam = franchiseeId ? ('&franchisee=' + franchiseeId) : '';
    if (style == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + franchiseeParam);
    } else {
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + franchiseeParam);
    }
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
  suspensionTouchEvent: function (e) {
    let {
      windowWidth,
      windowHeight
    } = this.systemInfo;
    let {
      clientX,
      clientY
    } = e.touches[0];
    if (e.type === 'touchstart') {
      let {
        offsetLeft,
        offsetTop
      } = e.currentTarget;
      let itemOffsetWidth = windowWidth / 750 * 80,
        itemOffsetHeight = windowWidth / 750 * 100,
        count = this.data.showBackTopBtn ? 3 : 2;
      if (this.data.communityInfo.require_custom_service != 1) { // 考虑关闭客服情况
        count = count - 1;
      }
      this.suspensionStyle = {
        width: itemOffsetWidth,
        height: itemOffsetHeight * count,
        deltX: clientX - offsetLeft,
        deltY: clientY - offsetTop
      };
      return;
    }
    let {
      width,
      height,
      deltX,
      deltY
    } = this.suspensionStyle;
    let leftVal = clientX - deltX;
    let topVal = clientY - deltY;
    let maxLeftVal = windowWidth - width;
    let maxTopVal = windowHeight - height;
    leftVal < 0 && (rightVal = 0);
    leftVal > maxLeftVal && (leftVal = maxLeftVal);
    topVal < 0 && (topVal = 0);
    topVal > maxTopVal && (topVal = maxTopVal);
    this.setData({
      suspensionStyle: `top:${topVal}px;left:${leftVal}px;`
    });
  },
  showTopicOperateModal: function (event) {
    let dataset = event.currentTarget.dataset;
    let index = dataset.index;
    let targetTopic = this.data.sectionList[index];
    let topicMoreOperationModal = this.data.topicMoreOperationModal;
    let articleStyle = this.data.communityInfo.article_style;
    let newData = {
      'topicMoreOperationModal.show': true,
      'topicMoreOperationModal.index': index,
      'topicMoreOperationModal.isAuthor': targetTopic.user_token === (app.getUserInfo() || {})['user_token'],
      'topicMoreOperationModal.articleId': targetTopic.id,
      'topicMoreOperationModal.sectionId': targetTopic.section_id,
      'topicMoreOperationModal.isChargeTop': !!(targetTopic.top_flag == 1 && targetTopic.order_id),
    };
    if (topicMoreOperationModal.mode != articleStyle) {
      newData['topicMoreOperationModal.mode'] = articleStyle;
    }
    if (topicMoreOperationModal.franchisee !== this.data.franchisee) {
      newData['topicMoreOperationModal.franchisee'] = this.data.franchisee;
    }
    if (this.data.communityInfo.require_phone == 1 && targetTopic.phone) {
      newData['topicMoreOperationModal.phone'] = targetTopic.phone;
    }
    this.setData(newData);
  },
  cancelTopicMoreOperate: function () {
    this.setData({
      topicMoreOperationModal: {
        mode: '', // 话题风格
        show: false, // 是否显示话题操作弹窗
        index: 0, // 当前被操作话题下标
        isAuthor: false, // 是否是作者自己的话题
        articleId: '', // 话题id
        sectionId: '', // 版块id
        franchisee: '', // 子店app_id
        isChargeTop: false, // 是否为置顶收费话题
        phone: '',
      }
    })
  },
  deleteTopicAct: function (event) {
    let that = this;
    let data = event.currentTarget.dataset.data;
    let index = data.index;
    let articleId = data.articleId;
    let sectionId = data.sectionId;
    let isChargeTop = data.isChargeTop;
    let franchiseeId = data.franchisee;
    let content = isChargeTop ? '该话题为付费置顶话题，' : '';
    content += '是否删除这个话题？';
    app.showModal({
      content: content,
      showCancel: true,
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppSNS/DeleteArticle',
          data: {
            article_id: articleId,
            section_id: sectionId,
            sub_app_id: franchiseeId || that.data.franchisee
          },
          method: 'post',
          success: function (res) {
            let list = that.data.sectionList;
            list.splice(index, 1);
            that.setData({
              sectionList: list
            });
            that.getSectionInfo(sectionId);
            that.cancelTopicMoreOperate();
            app.globalData.communityPageRefresh = true;
            app.showModal({
              content: '删除成功'
            });
          }
        });
      }
    })
  },
  getSectionCommentLikeCount: function (sectionId) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetSectionCommentOrLikeCount',
      data: {
        section_id: sectionId || this.data.communityId,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        let data = res.data;
        that.setData({
          sectionCommentLikeCounts: data
        });
      }
    })
  },
  refreshOneTopicData: function (param) {
    if (!param.articleId) {
      return;
    }
    let that = this;
    let index = this.data.sectionList.findIndex((article) => article.id === param.articleId);
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/GetArticleByPage',
      data: {
        article_id: param.articleId,
        sub_app_id: that.data.franchisee,
        page: 1,
        page_size: 10
      },
      method: 'post',
      success: function (res) {
        if (!res.data.length) {
          return;
        }
        let topic = res.data[0];
        if (topic.form_data.list_recommend && topic.form_data.list_recommend.recommend_goods && topic.form_data.list_recommend.recommend_goods[0]) {
          let {
            title,
            price,
            cover,
            id,
            goods_type,
            app_id
          } = topic.form_data.list_recommend.recommend_goods[0];
          topic.form_data.list_recommend.recommend_goods[0] = {
            name: title,
            price,
            image: cover,
            id,
            goods_type,
            app_id
          };
        }
        topic.topicMoreOperationModal = {
          index: index,
          isAuthor: idata.user_token === (app.getUserInfo() || {})['user_token'],
          articleId: idata.id,
          sectionId: idata.section_id,
          isChargeTop: !!(idata.top_flag == 1 && idata.order_id)
        }
        if (index > -1) {
          that.setData({
            ['sectionList[' + index + ']']: topic
          });
        }
      },
      fail: function () {}
    });
  },
  relatePagesRefresh: function () {
    app.globalData.topicRefresh = true;
    app.globalData.communityPageRefresh = true;
    app.globalData.communityUsercenterRefresh = true;
    app.globalData.franchiseeCommunity = true;
  }
});