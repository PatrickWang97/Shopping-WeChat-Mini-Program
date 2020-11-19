const app = getApp();
const util = require('../../../utils/util.js');
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
const setDataToCache = function (path, value, cache) {
  /\]$/.test(path) && (path = path.slice(0, -1));
  let pathArr = path.replace(/\]?\[|\]\.?/g, '.').split(/\./);
  let _last = pathArr.pop();
  let len = pathArr.length;
  let key;
  let target = cache;
  while (len > 0) {
    key = pathArr.shift();
    if (!ifHasDataType(target[key], ['object', 'array'])) {
      target[key] = {};
    }
    target = target[key];
    len--;
  }
  target[_last] = value;
  return cache;
}
Page({
  data: {
    type: 'simple', //all or simple 用来控制两种模板谁显示
    replyBoxFocus: false,
    keyboardHeight: '50%',
    showReplyBox: false,
    showSharePanel: false,
    franchisee: '', // 多商家子店id
    commentId: '',
    articleId: '',
    mainComment: {},
    subComments: [],
    subCommentsStatus: {
      page: 2,
      loading: false,
      isMore: true
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
    commentTab: 0
  },
  onLoad: function (options) {
    let {
      detail,
      articleId,
      franchisee
    } = options;
    let newdata = {};
    newdata.commentId = detail;
    newdata.articleId = articleId;
    newdata.franchisee = franchisee || '';
    newdata.sub_app_id = newdata.franchisee;
    this.setData(newdata);
    if (!app.isLogin()) {
      app.goLogin({});
    }
    this.getComment(options);
  },
  isTapping: false,
  pageTap: function () {
    if (this.isTapping) {
      return true;
    }
    return this.isTapping = true, false;
  },
  pageTapEnd: function () {
    this.isTapping = false;
  },
  turnComment: function (e) {
    let {
      sectionId,
      commentId,
      parentCommentId,
      replyto,
      articleId
    } = e.currentTarget.dataset;
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
  replyFocus: function (e) {
    if (e.detail.height && e.detail.height != this.data.keyboardHeight) {
      this.setData({
        'replyBoxFocus': true,
        'keyboardHeight': e.detail.height + 'px'
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
  commentImageLoad: function (e) {
    let ow = e.detail.width,
      oh = e.detail.height,
      {
        path,
        cache
      } = e.currentTarget.dataset,
      dw = 564,
      dh = 240, sw, sh, imgStyle;
    if (ow / oh > dw / dh) {
      sw = dw;
      sh = dw * oh / ow;
    }else {
      sh = dh;
      sw = dh * ow / oh;
    }
    imgStyle = `width:${sw}rpx;height:${sh}rpx;`;
    this.setData({
      [path]: imgStyle
    });
    this.cache === undefined && (this.cache = { });
    setDataToCache(`commentImages.${cache}`, imgStyle, this.cache);
  },
  getComment: function (options) {
    let that = this;
    let {
      detail,
      articleId,
      franchisee
    } = options;
    if (!detail || !articleId) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=/AppSNS/GetCommentByPage',
      data: {
        page: 1,
        comment_id: detail,
        obj_id: articleId, //好像不传也可以
        page_size: 10, //好像没啥用
        article_style: 0, // 0可以取到二级评论
        sub_app_id: franchisee || that.data.franchisee,
        child_page: 1,
        child_page_size: 10
      },
      method: 'post',
      success: function ({ data: [data] }) {
        let mainComment = data;
        let subComments = data.child_comment.data || [];
        delete data.child_comment;
        mainComment.content.comment_img_style = getRightAttrVal(`commentImages.mainComment[${mainComment.id}]`, that.cache);
        subComments.forEach(element => {
          element.content.comment_img_style = getRightAttrVal(`commentImages.subComments[${element.id}]`, that.cache);
        });
        that.setData({
          mainComment,
          subComments
        })
      }
    });
  },
  getSubComments: function () {
    let that = this;
    let {
      subCommentsStatus: {
        page,
        loading,
        isMore
      },
      subComments,
      commentId,
      articleId,
      franchisee
    } = this.data;
    if (loading || !isMore) {
      return;
    }
    this.setData({
      ['subCommentsStatus.loading']: true
    });
    app.sendRequest({
      url: '/index.php?r=/AppSNS/GetCommentByPage',
      data: {
        page: 1,
        comment_id: commentId,
        obj_id: articleId, //好像不传也可以
        page_size: 10, //好像没啥用
        article_style: 0, // 0可以取到二级评论
        sub_app_id: franchisee,
        child_page: page,
        child_page_size: 10,
        only_child: 1
      },
      method: 'post',
      success: function ({data, is_more}) {
        let newdata = {};
        if (checkDataType(data, 'array')) {
          subComments = subComments.concat(data);
          newdata.subComments = subComments;
        }
        if (is_more == 0) {
          newdata['subCommentsStatus.isMore'] = false;
        } else {
          newdata['subCommentsStatus.isMore'] = true;
        }
        that.setData(newdata);
      },
      complete: function () {
        that.setData({
          ['subCommentsStatus.loading']: false
        });
      }
    });
  },
  onReachBottom: function () {
    this.getSubComments();
  },
  addCommentLike: function (e) {
    let that = this,
      {
        id,
        isLiked,
        likeCount,
        path
      } = e.currentTarget.dataset;
    if (this.pageTap()) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppSNS/PerformLike',
      data: {
        obj_type: 2,  // obj_type 1-话题 2-评论
        obj_id: id,     // obj_id 话题或评论的id
        sub_app_id: that.data.franchisee || app.getChainId(),
      },
      method: 'post',
      success: () => {
        let newdata = {};
        let tipText = '';
        if (isLiked == 1) {
          likeCount = likeCount - 1;
          isLiked = 0;
          newdata[path + '.is_liked'] = isLiked;
          newdata[path + '.like_count'] = likeCount;
          tipText = '取消点赞';
        } else {
          likeCount = +likeCount + 1;
          isLiked = 1;
          newdata[path + '.is_liked'] = isLiked;
          newdata[path + '.like_count'] = likeCount;
          tipText = '点赞成功';
        }
        app.globalData.communityDetailRefresh = true;
        app.globalData.communityUsercenterRefresh = true;
        app.globalData.topicRefresh = true;
        app.globalData.franchiseeCommunity = true;
        that.setData(newdata);
        app.showToast({
          title: tipText,
          icon: 'none'
        });
      },
      complete: function () {
        that.pageTapEnd();
      }
    });
  },
  previewOneImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.image
    })
  },
  replyTimer: null,
  submitReply: function (e, repeat) {
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
        this.replyTimer = setTimeout(() => this.submitReply(e, true), 500);
        return;
      }
      app.showModal({ content: '请填写回复内容' });
      return;
    }
    if (this.pageTap()) {
      return;
    }
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
            that.getComment(pickAttrObject({ detail: 'commentId', articleId: 'articleId' }, that.data));
            that.setData({
              showReplyBox: false
            })
          }
        });
        that.clearCommentInput();
        app.globalData.communityDetailRefresh = true;
        app.globalData.communityUsercenterRefresh = true;
        app.globalData.topicRefresh = true;
        app.globalData.franchiseeCommunity = true;
        setTimeout(() => {
          that.onShow();
        }, 1000);
      },
      complete: function (res) {
        that.pageTapEnd();
      }
    });
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
})
