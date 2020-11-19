var app = getApp();
var util = require('../../../utils/util.js');
var WxParse = require('../../../components/wxParse/wxParse.js');
var customEvent = require('../../../utils/custom_event.js');
var isSubmiting = false; //防止重复点击
var likeTap = false; //防止重复点击
var kbHeight = '';
var eventSource = [{ action: "get-coupon", name: "优惠券详情", local_icon: "icon-news-coupon" }, { action: "goods-trade", name: "商品详情", local_icon: "icon-news-goodsdetail" }, { action: "community", name: "社区详情", local_icon: "icon-news-community" }, { action: "to-franchisee", name: "商家详情", local_icon: "icon-news-business" }, { action: "coupon-receive-list", name: "优惠券列表", local_icon: "icon-news-coupon" }, { action: "recharge", name: "储值", local_icon: "icon-news-storage" }, { action: "transfer", name: "付款", local_icon: "icon-news-payment" }, { action: "to-promotion", name: "代言人中心", local_icon: "icon-news-extension" }, { action: "scratch-card", name: "刮刮乐", local_icon: "icon-news-scratch" }, { action: "lucky-wheel", name: "大转盘", local_icon: "icon-news-turntable" }, { action: "golden-eggs", name: "砸金蛋", local_icon: "icon-news-goldegg" }, { action: "call", name: "拨打电话", local_icon: "icon-tokeout-phone" }, { action: "turn-to-xcx", name: "跳转action小程序", local_icon: "icon-news-jump" }, { action: "share", name: "分享好友", local_icon: "icon-share" }, { action: "page-share", name: "分享朋友圈", local_icon: "icon-news-sharecircle" }, { action: "refresh-list", name: "刷新列表", local_icon: "icon-news-refreshlist" }, { action: "refresh-page", name: "刷新页面", local_icon: "icon-news-refreshpage" }, { action: "contact", name: "联系客服", local_icon: "icon-news-custom" }, { action: "preview-picture", name: "预览大图", local_icon: "icon-news-coupon" }, { action: "to-seckill", name: "秒杀", local_icon: "icon-news-kill" }, { action: "video-detail", name: "视频详情", local_icon: "icon-news-videodetail" }, { action: "topic", name: "话题详情", local_icon: "icon-news-topic" }, { action: "news", name: "资讯详情", local_icon: "icon-news-news" }, { action: "vcard", name: "名片详情", local_icon: "icon-vcard" }, { action: "vcard-msg-list", name: "名片消息列表", local_icon: "icon-vcard-msg-list" }];
var customEvent = require('../../../utils/custom_event.js');
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
      title: '详情',
    },
    articleId: '',
    articleInfo: {},
    likeLogItems: [],
    commentList: [],
    getCommentData: {
      page: 1,
      loading: false,
      nomore: false
    },
    likeLogData: {
      page: 1,
      loading: false,
      nomore: false
    },
    imgData: {},
    showAddArticleBtn: true,
    themeColor: '#00b6f8',
    address: '',
    showActionSheet: false,
    phoneNumCall: '',
    showReplyBox: false,
    replyBoxFocus: false,
    keyboardHeight: '50%',
    replyPlaceholder: '我来说两句',
    innerAudioContext: {
      currentTime: 0,
      duration: 0,
      canPlay: false,
      play: false
    },
    franchisee: '',
    sectionInfo: {}, // 板块详情
    requireComment: false, // 需要评论
    showHiddenContent: false, // 是否发表过评论
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
    commentTab: 0,
    showGoodsModal: false,
    showModal: false,
    communityPublish: {}
  },
  onLoad: function (options) {
    let that = this;
    app.getStorage({
      key: 'communityThemeColor-' + options.sectionid,
      success: function (res) {
        that.setData({themeColor: res.data});
      }
    })
    let articleId = options.detail,
      onlyOwnRecord = options.onlyOwnRecord || '';
    let franchisee = options.franchisee || '';
    this.setData({
      articleId: articleId,
      onlyOwnRecord: onlyOwnRecord,
      franchisee: franchisee,
      ['replyParam.sub_app_id']: franchisee
    });
    if (app.isLogin()) { // 判断是否登录
      this.getComment();
    }else {
      app.goLogin({
        success: function () {
          that.getComment();
        }
      })
    }
    this.getArticleInfo();
    this.getLikeLog();
    this.countReadCount(articleId);
    app.globalData.communityDetailRefresh = false;
  },
  onShow: function () {
    if (app.globalData.topicTurnToDetail) {
      app.globalData.topicTurnToDetail = false;
    }
    if (app.globalData.communityDetailRefresh) {
      this.setData({
        getCommentData: {
          page: 1,
          loading: false,
          nomore: false
        },
        commentList: []
      });
      app.globalData.communityDetailRefresh = false;
      this.getComment();
    }
  },
  getArticleInfo: function (own) {
    let that = this,
      param = {
        article_id: that.data.articleId,
        page: 1,
        page_size: 100,
        sub_app_id: that.data.franchisee
      };
    if (that.data.onlyOwnRecord == 1) {
      param.only_own_record = 1;
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/GetArticleByPage',
      data: param,
      method: 'post',
      success: function (res) {
        if (res.status == 0 && Array.isArray(res.data) && res.data[0]) {
          let info = res.data[0];
          let newdata = {};
          info.title = unescape(info.title.replace(/\\u/g, "%u"));
          if (info.content.type == 2) {
            if (info.content.url.article) {
              let artBody = info.content.url.article.body;
              if (/[>]\s+/.test(artBody)) { // 替换空格
                artBody = artBody.replace(/(\>)(\s+)/g, ($0, $1, $2) => {
                  return $1 + (new Array($2.length + 1).join('&nbsp;'));
                });
              }
              if (/\'/.test(artBody)) { // 过滤掉单引号
                artBody = artBody.replace(/\'/g, '"');
              }
              if (/\<img[^<>]*['"]\s*\>/.test(artBody)) { // 筛选过滤掉图片标签有错误的属性
                artBody = artBody.replace(/\<img([^<>]*['"])\s*\>/g, ($0, $1) => {
                  return '<img' + $1.match(/\s[^'"=\s]+\=['"][^"]+['"]/g).join('') + '/>';
                });
              }
              if (/<mpvoice/.test(artBody)) { // 替换音频
                artBody = artBody.replace(/\<mpvoice[^<>]*\>\<\/mpvoice\>/g, ($0,$1) => {
                  return $0.replace(/\s(\w+)\=\"([^"]*)\"/g, ($00,$01,$03) => {
                    if (/voice\_encode\_fileid/.test($01)) {
                      return ' src="https://res.wx.qq.com/voice/getvoice?mediaid='+$03+'"';
                    } else if (/name|author/.test($01)) {
                      return $00;
                    } else {}
                    return '';
                  })
                })
              }
              info.content_text = artBody;
              delete info.content.url.article.body;
              if (info.content.url.article.type == 3) {
                that.createAudioPlayer(info.content.url.article);
              }
            }
          }else {
            info.content_text = info.content.text.replace(/\n|\\n/g, '\n');
          }
          info.form_data.recommend = info.form_data.recommend.map(rg => {
            if (rg.recommend_good_type == 3) {
              rg.recommend_goods = rg.recommend_goods.map(ri => {
                if (!ri.name) {
                  ri.name = ri.pageRouterName ? ri.pageRouterName.split('/').pop() : '';
                }
                ri.iconImg = ri.iconImg ? ri.iconImg : ri.icon;
                if (!ri.name || !ri.iconImg || /click_event.*svg$/.test(ri.iconImg)) {
                  let eventObj = eventSource.find(eb => eb.action == ri.action);
                  if (eventObj) {
                    ri.name || (ri.name = eventObj.name);
                    if (!ri.iconImg || /click_event.*svg$/.test(ri.iconImg)) {
                      ri.local_icon = eventObj.local_icon;
                    }
                  }
                }
                return ri;
              });
            }
            else if (rg.recommend_good_type == 0) {
              rg.recommend_goods = rg.recommend_goods.map(ri => {
                if (ri.article_type == 3 && ri.form_data.event.action) {
                  let oldEventParams = ri.form_data.event,
                    newEventParams = {};
                    delete ri.form_data;
                  Object.keys(oldEventParams).forEach(k => {
                    if (/\-/.test(k)) {
                      newEventParams[k.replace(/\-/g, '_')] = oldEventParams[k];
                    } else {
                      newEventParams[k] = oldEventParams[k];
                    }
                  });
                  ri.event_params = newEventParams;
                } else {
                  ri.event_params = '';
                }
                if (ri.form_data && ri.form_data.recommend) {
                  delete ri.form_data.recommend;
                }
                return ri;
              });
            }
            else if (rg.recommend_good_type == 1){
              info.form_data.show_recommend = rg;
            }
            else { };
            return rg;
          });
          if (info.hidden_content) {
            info.hidden_content = info.hidden_content.replace(/\n|\\n/g, '\n'); // 处理隐藏内容换行
          }
          delete info.comment;
          newdata.articleInfo = info;
          newdata.address = info.address;
          if (info.visible_after_comment == 1) { // 话题是否评论后可见
            newdata.requireComment = true;
          }
          newdata.showHiddenContent = info.show_hidden_content == 1;
          if (info.agent_user_token) { // 代理
            newdata['replyParam.agent_user_token'] = info.agent_user_token;
          }
          if (app.globalData.userInfo.user_token === info.user_token) {
            newdata.isAuthorSelf = true;
          }
          that.setData(newdata);
          WxParse.wxParse('wxParseDescription', 'html', info.content_text, that, 10);
          that.getThemeColor(info.section_id);
          if (info.content.type == 2 && info.content.url.video) {
            that.getCurVideoUrl(info.content.url.video.url);
          }
        }
      }
    });
  },
  getLikeLog: function () {
    var that = this;
    let {
      articleId,
      franchisee,
      likeLogItems,
      likeLogData: {
        page,
        loading,
        nomore
      }
    } = this.data;
    if (loading || nomore) {
      return;
    }
    this.setData({
      'likeLogData.loading': true
    });
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/GetLikeLogByPage',
      data: {
        page: page,
        obj_type: 1,
        obj_id: articleId,
        page_size: 10,
        sub_app_id: franchisee
      },
      method: 'post',
      success: function ({ data, current_page, is_more }) {
        if (current_page === 1) {
          likeLogItems = data;
        } else {
          likeLogItems = likeLogItems.concat(data);
        }
        that.setData({
          likeLogItems: likeLogItems,
          'likeLogData.page': current_page + 1,
          'likeLogData.loading': false,
          'likeLogData.nomore': is_more != 1
        });
      },
      fail: function () {
        that.setData({
          'likeLogData.loading': false,
          'likeLogData.nomore': false
        });
      }
    });
  },
  getComment: function () {
    var that = this,
      sdata = that.data.getCommentData;
    if (sdata.loading || sdata.nomore) {
      return;
    }
    sdata.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetCommentByPage',
      data: {
        page: sdata.page,
        article_id: that.data.articleId,
        page_size: 10,
        article_style: 0,
        sub_app_id: that.data.franchisee,
        child_page: 1,
        child_page_size: 5
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data,
            oldData = that.data.commentList,
            newData = info;
          for (var i = 0; i < newData.length; i++) {
            let item = newData[i],
              likecount = item.like_count;
            item.like_count_text = likecount <= 0 ? '赞' : (likecount > 10000 ? (Math.floor(likecount / 10000) + '万') : likecount);
            item.likeAnimateShow = true;
          }
          newData = oldData.concat(newData);
          that.setData({
            commentList: newData,
            'getCommentData.page': sdata.page + 1
          });
        }
        that.setData({
          'getCommentData.loading': false,
          'getCommentData.nomore': res.is_more == 0 ? true : false
        });
      },
      fail: function (res) {
        that.setData({
          'getCommentData.loading': false
        });
      }
    });
  },
  onReachBottom: function (e) {
    this.scrollTolower(e);
  },
  onPageScroll: function (e) {
    this.scrollEvent(e);
  },
  scrollTolower: function (event) {
    switch (this.data.commentTab) {
      case 0:
        this.getComment();
        break;
      case 1:
        this.getLikeLog();
        break;
    }
  },
  oldscrolltop: 0,
  scrollEvent: function (event) {
    let scrolltop = event.scrollTop,
      oldscrolltop = this.oldscrolltop;
    if (scrolltop - oldscrolltop > 60) {
      this.oldscrolltop = scrolltop;
      this.setData({
        showAddArticleBtn: false
      });
    } else if (oldscrolltop - scrolltop > 60) {
      this.oldscrolltop = scrolltop;
      this.setData({
        showAddArticleBtn: true
      });
    }
  },
  getThemeColor: function (section_id) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetSectionByPage',
      data: {
        page: 1,
        section_id: section_id,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data[0];
          that.setData({
            themeColor: info.theme_color,
            sectionInfo: info
          });
        }
      }
    });
  },
  turnReply: function (event) {
    event.currentTarget.dataset.parentid = event.currentTarget.dataset.id;
    this.turnComment(event);
  },
  turnComment: function (event) {
    let requireArticlePost = this.data.articleInfo.require_article_post;
    let requireArticleComment = this.data.articleInfo.require_article_comment;
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
      articleId
    } = event.currentTarget.dataset;
    this.setData({
      showReplyBox: true,
      replyPlaceholder: "回复：" + replyto,
      ['replyParam.section_id']: sectionId,
      ['replyParam.article_id']: articleId,
      ['replyParam.comment_id']: commentId,
      ['replyParam.parent_comment_id']: parentCommentId
    });
    setTimeout(() => {
      this.setData({
        replyBoxFocus: true
      });
    }, 500);
  },
  turnToPublish: function (event) {
    app.turnToPage('/informationManagement/pages/communityPublish/communityPublish?detail=' + this.data.articleInfo.section_id + (this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : ''));
  },
  articleLike: function (event) {
    var that = this,
      liked = event.currentTarget.dataset.liked,
      likeCount = +event.currentTarget.dataset.likeCount;
    if (likeTap) { return; };
    likeTap = true;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/PerformLike',
      data: {
        obj_type: 1,  // obj_type 1-话题 2-评论
        obj_id: that.data.articleId,     // obj_id 话题或评论的id
        sub_app_id: that.data.franchisee || app.getChainId(),
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          that.getLikeLog();
          if (liked == 1) {
            that.setData({
              'articleInfo.is_liked': 0,
              'articleInfo.like_count': likeCount - 1
            });
            app.showToast({ title: '点赞取消' });
          } else {
            that.setData({
              'articleInfo.is_liked': 1,
              'articleInfo.like_count': likeCount + 1
            });
            app.showToast({ title: '点赞成功' });
          }
          that.relatePagesRefresh();
          that.setData({
            likeLogData: {
              pageL: 1,
              loading: false,
              nomore: false
            }
          });
          that.getLikeLog();
        }
      },
      complete: function () {
        likeTap = false;
      }
    });
  },
  commentLike: function (event) {
    var that = this,
      liked = event.currentTarget.dataset.liked,
      id = event.currentTarget.dataset.id,
      index = +event.currentTarget.dataset.index,
      likeCount = +event.currentTarget.dataset.likeCount;
    if (likeTap) { return; };
    likeTap = true;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppSNS/PerformLike',
      data: {
        obj_type: 2,  // obj_type 1-话题 2-评论
        obj_id: id,     // obj_id 话题或评论的id
        sub_app_id: that.data.franchisee || app.getChainId(),
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (liked == 1) {
            var newData = {},
              likecount = likeCount - 1;
            newData['commentList[' + index + '].is_liked'] = 0;
            newData['commentList[' + index + '].like_count'] = likecount;
            newData['commentList[' + index + '].like_count_text'] = likecount <= 0 ? '赞' : (likecount > 10000 ? (Math.floor(likecount / 10000) + '万') : likecount);
            newData['commentList[' + index + '].likeAnimateShow'] = false;
            that.setData(newData);
            app.showToast({ title: '点赞取消' });
          } else {
            var newData = {},
              likecount = likeCount + 1;
            newData['commentList[' + index + '].is_liked'] = 1;
            newData['commentList[' + index + '].like_count'] = likecount;
            newData['commentList[' + index + '].like_count_text'] = likecount <= 0 ? '赞' : (likecount > 10000 ? (Math.floor(likecount / 10000) + '万') : likecount);
            newData['commentList[' + index + '].likeAnimateShow'] = false;
            that.setData(newData);
            app.showToast({ title: '点赞成功' });
          }
          that.relatePagesRefresh();
          setTimeout(function () {
            let newData = {};
            newData['commentList[' + index + '].likeAnimateShow'] = true;
            that.setData(newData);
          }, 480);
        }
      },
      complete: function () {
        likeTap = false;
      }
    });
  },
  previewImage: function (event) {
    let {
        img,
        imgsArr
      } = event.currentTarget.dataset;
    if (!Array.isArray(imgsArr)) {
      imgsArr = [img]
    }
    app.previewImage({
      current: img,
      urls: imgsArr
    });
  },
  showActionSheet: function (event) {
    let that = this,
      telNum = that.data.articleInfo.phone,
      telArr = [telNum.substr(0, 3), telNum.substr(3, 4), telNum.substr(7)],
      isIphone = /ios/i.test(app.globalData.systemInfo.platform);
    if (isIphone) {
      wx.makePhoneCall({
        phoneNumber: telNum,
        success: function () { },
        fail: function () { }
      })
    } else {
      that.setData({
        phoneNumCall: telArr.join('-'),
        showActionSheet: true
      });
    }
  },
  rePublish: function (e) {
    let newdata = {
      'communityPublish.show': true,
      'communityPublish.articleId': this.data.articleId
    };
    if ( this.data.articleInfo.content.type == 2 ) {
      newdata['communityPublish.publishType'] = 2;
    }
    this.setData(newdata);
  },
  showGoods: function () {
    this.setData({
      showModal: true
    })
  },
  closeModal: function () {
    this.setData({
      showModal: false
    })
  },
  showModal: function () {
    this.setData({
      showModal: true
    })
  },
  onShareAppMessage: function (res) {
    let that = this;
    let shareTitle = this.data.articleInfo.title;
    let sharePath = util.getCurrentPageUrlWithArgs();
    sharePath += '&from_share=1';
    return app.shareAppMessage({
      title: shareTitle,
      path: sharePath,
      success: function (res) {
        app.showToast({ title: '转发成功' });
        app.CountSpreadCount(that.data.articleId);
        that.relatePagesRefresh();
      },
      fail: function (res) { }
    })
  },
  turnToReport: function () {
    app.turnToPage('/informationManagement/pages/communityReport/communityReport?detail=' + this.data.articleId + '&sectionid=' + this.data.articleInfo.section_id + (this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : ''));
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
  backToPre: function () {
    wx.navigateBack();
  },
  closeActionSheet: function (event) {
    this.setData({ showActionSheet: false });
  },
  makePhoneCall: function (event) {
    wx.makePhoneCall({
      phoneNumber: this.data.articleInfo.phone,
      success: function () { },
      fail: function () {
        app.showModal({ content: '拨打电话失败' });
      }
    })
    this.closeActionSheet();
  },
  cancelReply: function () {
    this.setData({ showReplyBox: false, replyBoxFocus: false });
    this.clearCommentInput();
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
      return;
    }
    if (isSubmiting) {
      return;
    }
    isSubmiting = true;
    if (!replyParam.sub_app_id && franchisee) { // 子店话题详情回复评论
      replyParam.sub_app_id = franchisee;
    }
    app.sendRequest({
      url: '/index.php?r=AppSNS/AddComment',
      data: replyParam,
      method: 'post',
      success: function (res) {
        app.showToast({
          title: '回复成功',
          success: function () {
            let { comment_count } = that.data.articleInfo;
            that.setData({
              showReplyBox: false,
              replyBoxFocus: false,
              'articleInfo.comment_count': +comment_count + 1
            });
          }
        });
        that.relatePagesRefresh();
        that.clearCommentInput();
        let {
          requireComment,
          showHiddenContent
        } = that.data;
        if (requireComment && !showHiddenContent) {
          that.setData({
            showHiddenContent: true
          });
        }
        that.setData({
          'getCommentData.page': 1,
          'getCommentData.loading': false,
          'getCommentData.nomore': false,
          'commentList': []
        });
        that.getComment();
      },
      complete: function (res) {
        isSubmiting = false;
      }
    });
  },
  replyInput: function (event) {
    this.setData({
      'replyParam.text': event.detail.value
    });
  },
  openWXMap: function () {
    let articleInfo = this.data.articleInfo;
    app.openLocation({
      latitude: +articleInfo.latitude,
      longitude: +articleInfo.longitude,
      address: articleInfo.address
    });
  },
  countReadCount: function (articleId) {
    app.sendRequest({
      url: '/index.php?r=AppSNS/CountReadCount',
      method: 'get',
      data: {
        article_id: articleId || this.data.communityId,
        sub_app_id: this.data.franchisee
      },
      success: function () {}
    })
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
    this.setData({'replyBoxFocus': true});
  },
  replyBlur: function (e) {
    this.setData({'replyBoxFocus': false});
  },
  createAudioPlayer(article) {
    const innerAudioContext = wx.createInnerAudioContext();
    this.innerAudioContext = innerAudioContext;
    innerAudioContext.src = article.audio_url;
    innerAudioContext.onCanplay(() => {
      this.setData({
        'innerAudioContext.canPlay': true,
        'innerAudioContext.duration': article.duration || 0
      });
    });
    innerAudioContext.onError((res) => {
      app.showModal({content: res.errCode+ ":" +res.errMsg});
    });
  },
  audioPlayAct: function () {
    if (!this.data.innerAudioContext.canPlay) {
      return;
    }
    this.audioTimer && clearInterval(this.audioTimer);
    if (this.data.innerAudioContext.play) {
      this.setData({
        'innerAudioContext.play': false,
        'innerAudioContext.currentTime': this.innerAudioContext.currentTime
      });
      this.innerAudioContext.pause();
      return;
    }
    this.innerAudioContext.play();
    this.audioTimer = setInterval(() => {
      this.setData({
        'innerAudioContext.play': true,
        'innerAudioContext.currentTime': this.innerAudioContext.currentTime
      });
      if (!this.data.innerAudioContext.duration) {
        this.setData({
          'innerAudioContext.duration': this.innerAudioContext.duration
        });
      }
    }, 1000);
  },
  getCurVideoUrl: function (url) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppNews/GetVideoUrl',
      data: { argv: url },
      success: function (res) {
        that.setData({
          'articleInfo.content.url.video.url': res.data
        })
      }
    });
  },
  replyLineChange: function(e) {
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
  replyImageChoose: function() {
    let that = this;
    app.chooseImage((imageUrls) => {
      that.setData({
        ['replyParam.comment_img_url']: imageUrls[0]
      })
    }, 1)
  },
  replyImagePreview: function() {
    let commentImage = this.data.replyParam.comment_img_url
    app.previewImage({
      current: commentImage
    })
  },
  replyImageDelete: function() {
    this.setData({
      ['replyParam.comment_img_url']: ''
    })
  },
  replyLocationChoose: function() {
    let that = this;
    app.chooseLocation({
      success({name, address, latitude, longitude}) {
        let newdata = {};
        newdata['replyParam.latitude'] = latitude;
        newdata['replyParam.longitude'] = longitude;
        if (name || address) {
          newdata['replyParam.address'] = name || address;
        }else {
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
  replyLocationDelete: function() {
    this.setData({
      ['replyParam.address']: '',
      ['replyParam.latitude']: '',
      ['replyParam.longitude']: ''
    })
  },
  switchCommentTab: function(e) {
    this.setData({
      commentTab: Number(e.currentTarget.dataset.num)
    })
  },
  goCommentDetail: function(e) {
    let {
      id,
      articleId
    } = e.currentTarget.dataset;
    let {
      franchisee
    } = this.data,
    franchiseeParam = franchisee ? `&franchisee=${franchisee}` : '';
    app.turnToPage(`/informationManagement/pages/communityComments/communityComments?detail=${id}&articleId=${articleId}${franchiseeParam}`);
  },
  turnToCommunityPage: function (e) {
    let { section_id } = this.data.articleInfo;
    if (!section_id) {
      app.showModal({
        content: '板块不存在'
      });
      return;
    }
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage(`/informationManagement/pages/communityPage/communityPage?detail=${section_id}${franchiseeParam}`);
  },
  commentImageLoad: function (e) {
    let ow = e.detail.width,
      oh = e.detail.height,
      path = e.currentTarget.dataset.path,
      dw = 375,
      dh = 240, sw, sh;
    if (ow / oh > dw / dh) {
      sw = dw;
      sh = dw * oh / ow;
    }else {
      sh = dh;
      sw = dh * ow / oh;
    }
    this.setData({
      [path]: `width:${sw}rpx;height:${sh}rpx;`
    });
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
    if (sourcetype === undefined) {
      return;
    }
    if (usertoken) {
      franchiseeParam += '&usertoken=' + usertoken + '&sourcetype=' + sourcetype;
    }
    app.turnToPage('/informationManagement/pages/communityUsercenter/communityUsercenter?detail='+ franchiseeParam);
  },
  tapBackPageTop: function () {
    wx.pageScrollTo({
      scrollTop: 0
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
  bindEventTapHandler: function (e) {
    let form = e.currentTarget.dataset.eventParams;
    let action = form.action;
    let args = [form];
    if (this.data.franchisee) {
      args.push(this.data.franchisee);
    }
    customEvent.clickEventHandler[action] && customEvent.clickEventHandler[action].apply(null, args);
  },
  turnToGoodsDetail: function (event) {
    let dataset = event.currentTarget.dataset;
    let id = dataset.id;
    let style = dataset.style;
    let appId = dataset.appId;
    let franchiseeId = appId === app.getAppId() ? this.data.franchisee : appId;
    let franchiseeParam = franchiseeId ? ('&franchisee=' + franchiseeId) : '';
    if (style == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + franchiseeParam);
    } else {
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + franchiseeParam);
    }
  },
  turnToArticle: function (event) {
    if (event.currentTarget.dataset.articleType == 3) {
      this.bindEventTapHandler(event);
      return;
    }
    let id = event.currentTarget.dataset.id;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/informationManagement/pages/newsDetail/newsDetail?detail=' + id + franchiseeParam);
  },
  gotoCouponDetail: function (event) {
    let id = event.currentTarget.dataset.couponId;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/pages/couponDetail/couponDetail?couponStatus=recieve&detail=' + id + franchiseeParam);
  },
  relatePagesRefresh: function () {
    app.globalData.topicRefresh = true;
    app.globalData.communityPageRefresh = true;
    app.globalData.communityUsercenterRefresh = true;
    app.globalData.franchiseeCommunity = true;
  },
  goLivePlay: function(e) {
    let liveId = e.currentTarget.dataset.id;
    let paramstr = '';
    if(app.globalData.PromotionUserToken){
      paramstr = '&custom_params=' + encodeURIComponent(JSON.stringify({
        user_token: app.globalData.PromotionUserToken
      }));
    }
    app.turnToPage('plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id=' + liveId + paramstr);
  }
})
