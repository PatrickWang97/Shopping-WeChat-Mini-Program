const app = getApp();
const util = require('../../../utils/util.js');
Page({
  data: {
    type: 'simple', //all or simple 用来控制两种模板谁显示
    replyBoxFocus: false,
    keyboardHeight: '50%',
    showReplyBox: false,
    showSharePanel: false,
    replyParam: {
      obj_id: 0,
      content: '',
      comment_id: 0,
      parent_comment_id: 0
    },
    commentContentMaxHeight: 0,
    commentContentHeight: 40,
    commentImage: '',
    commentLocation: {
      address: '',
      latitude: 0,
      longitude: 0,
      name: ''
    },
    commentTab: 0,
    replyPlaceholder: '',
    imageload: {}, //图片尺寸处理最终值
    articleId: '',
    commentId: '',
    commentInfo: [],
    commentData: {
      page: 0,
      isMore: 1,
      commentList: []
    },
    canvasData: {
      show: false,
      logo: 'https://unsplash.it/220/72?image=19',
      site: 'www.jisuapp.cn',
      bgImg: 'https://unsplash.it/620/864?image=9',
      title: '我是标题我是标题我是标题我是标题我是标题我是标题我是标题。',
      text: '我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文。'
    },
    likeData: {
      page: 0,
      likeList: [],
      isMore: 1
    },
    franchisee: ""
  },
  onLoad: function (options) {
    this.setData({
      type: options.type,
      commentId: options.commentId,
      articleId: options.articleId,
      franchisee: options.franchisee
    })
    this.getLikeList({
      type: 2,
      id: this.data.commentId
    });
    this.getComment();
  },
  onReady: function () {
  },
  onShow: function () {
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  onPullDownRefresh: function () {
  },
  onReachBottom: function () {
  },
  onShareAppMessage: function () {
    let shareTitle = "评论详情";
    let sharePath = util.getCurrentPageUrlWithArgs();
    console.log(shareTitle, sharePath)
    return {
      title: shareTitle,
      path: sharePath,
      success: function (res) {
        app.showToast({
          title: '转发成功'
        });
      },
      fail: function (res) { }
    }
  },
  turnComment: function (e) {
    let bodyId = this.data.bodyId,
        replyto = e.currentTarget.dataset.replyto;
    this.setData({
      showReplyBox: true,
      replyPlaceholder: "@" + replyto,
      'replyParam.obj_id': bodyId // 主体id
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
  },
  replyInput: function (event) {
    this.setData({
      'replyParam.content': event.detail.value
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
      'replyBoxFocus': false
    });
  },
  replyLineChange: function (e) {
    let that = this;
    let lineHeight = 40;
    let marginTop = 45;
    let commentContentHeight = lineHeight;
    let maxHeight = this.data.commentContentMaxHeight;
    app.getBoundingClientRect('#comment-box', (rect) => {
      if (!(rect instanceof Array) || !rect[0]) {
        return;
      }
      commentContentHeight = e.detail.lineCount * lineHeight;
      if (rect[0].top > marginTop && e.detail.lineCount >= 1) {
        if (rect[0].top - marginTop <= lineHeight) {
          maxHeight = commentContentHeight + lineHeight;
          this.setData({
            commentContentMaxHeight: maxHeight
          })
        }
        this.setData({
          commentContentHeight
        })
      }
      console.log(this.data.commentContentHeight, this.data.commentContentMaxHeight);
      if (rect[0].top <= marginTop && commentContentHeight <= maxHeight) {
        this.setData({
          commentContentHeight
        })
      }
    })
  },
  replyImageChoose: function () {
    let that = this;
    app.chooseImage((imageUrls) => {
      that.setData({
        commentImage: imageUrls[0]
      })
    }, 1)
  },
  replyImagePreview: function () {
    let commentImage = this.data.commentImage
    app.previewImage({
      current: commentImage
    })
  },
  replyImageDelete: function () {
    this.setData({
      commentImage: ''
    })
  },
  replyLocationChoose: function () {
    let that = this;
    app.chooseLocation({
      success(res) {
        that.setData({
          commentLocation: res
        })
      }
    })
  },
  replyLocationDelete: function () {
    let empty = {
      address: '',
      latitude: 0,
      longitude: 0,
      name: ''
    };
    this.setData({
      commentLocation: empty
    })
  },
  openSharePanel: function () {
    this.setData({
      showSharePanel: true
    })
  },
  closeSharePanel: function () {
    this.setData({
      showSharePanel: false
    })
  },
  switchCommentTab: function (e) {
    this.setData({
      commentTab: Number(e.currentTarget.dataset.num)
    })
  },
  imageload: function(e) {
    let imageload = this.data.imageload;
    let width = e.detail.width;
    let height = e.detail.height;
    let minWidth = Number(e.currentTarget.dataset.minWidth);
    let minHeight = Number(e.currentTarget.dataset.minHeight);
    let maxWidth = Number(e.currentTarget.dataset.maxWidth);
    let maxHeight = Number(e.currentTarget.dataset.maxHeight);
    let key = e.currentTarget.dataset.key;
    let setWidth, setHeight;
    setWidth = maxHeight / height * width;
    setHeight = maxHeight;
    if (setWidth > maxWidth) {
      setWidth = maxWidth;
      setHeight = setWidth / width * height;
    }
    if(setWidth < minWidth) {
      setWidth = minWidth;
      setHeight = setWidth / width * height;
    }
    imageload[key] = {
      width: setWidth,
      height: setHeight
    }
    this.setData({
      imageload
    })
  },
  getComment: function () {
    let that = this,
        commentData = this.data.commentData,
        commentList = this.data.commentList;
    if (commentData.isMore == 0) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=/AppNews/GetCommentByPage',
      data: {
        page: commentData.page + 1,
        comment_id: that.data.commentId,
        obj_id: that.data.articleId, //好像不传也可以
        page_size: 10, //好像没啥用
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (!(res.data instanceof Array) || res.data.length <= 0 || !res.data[0].id) {
            return;
          }
          let newCommentList = res.data[0].child_comment.data;
          for (let i = 0; i < newCommentList.length; i++) {
            let item = newCommentList[i],
                likecount = item.like_count;
            item.like_count_text = likecount <= 0 ? '0' : (likecount > 10000 ? (Math.floor(likecount / 10000) + '万') : likecount);
          }
          if (commentData.isMore == 2) {
            console.log(newCommentList[newCommentList.length - 1]);
            let newComment = newCommentList[newCommentList.length - 1];
            commentData.commentList.push(newComment);
          } else {
            commentData.commentList = commentData.commentList.concat(newCommentList);
          }
          commentData.page = res.data[0].child_comment.current_page;
          commentData.isMore = res.data[0].child_comment.is_more;
          that.setData({
            commentInfo: res.data[0],
            commentData
          });
        }
      }
    });
  },
  getLikeList: function (e) {
    let that = this,
        likeData = this.data.likeData;
    if (likeData.isMore == 0) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppNews/GetLikeLogByPage',
      data: {
        obj_type: e.type,
        obj_id: e.id,
        page_size: 1,
        page: likeData.page + 1,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (!(res.data instanceof Array) || res.data.length <= 0 || !res.data[0].id) {
            return;
          }
          likeData.page = res.current_page;
          likeData.isMore = res.is_more;
          likeData.likeList = likeData.likeList.concat(res.data);
          that.setData({
            likeData
          })
        }
      }
    });
  },
  addCommentLike: function (e) {
    let that = this,
        dataset = e.currentTarget.dataset,
        likeId = dataset.id,
        likeIndex = dataset.index;
    app.sendRequest({
      url: '/index.php?r=AppNews/PerformLike',
      data: {
        obj_type: 2,
        obj_id: likeId,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: (res) => {
        if (res.status == 0) {
          if (likeIndex == 'body') {
            let commentInfo = that.data.commentInfo;
            if (commentInfo.is_liked == "0") {
              commentInfo.is_liked = true;
              commentInfo.like_count = Number(commentInfo.like_count) + 1;
            } else {
              commentInfo.is_liked = false;
              commentInfo.like_count = Number(commentInfo.like_count) - 1;
            }
            that.setData({
              commentInfo,
              likeData: {
                page: 0,
                likeList: [],
                isMore: 1
              }
            })
            that.getLikeList({
              type: 2,
              id: that.data.commentId
            });
            return;
          }
          let commentList = that.data.commentData.commentList,
              thisComment = commentList[likeIndex];
          if (thisComment.is_liked == "0") {
            thisComment.is_liked = true;
          } else {
            thisComment.is_liked = false;
          };
          if (thisComment.is_liked) {
            thisComment.like_count = Number(thisComment.like_count) + 1;
          } else {
            thisComment.like_count = Number(thisComment.like_count) - 1;
          }
          commentList[likeIndex] = thisComment;
          that.setData({
            'commentData.commentList': commentList
          })
        }
      }
    });
  },
  commentToComment: function (e) {
    let that = this;
    let dataset = e.currentTarget.dataset;
    let replyParam = this.data.replyParam;
    replyParam.obj_id = that.data.articleId;
    replyParam.comment_id = dataset.commentId;
    replyParam.parent_comment_id = dataset.parentCommentId;
    this.setData({
      showReplyBox: true,
      replyPlaceholder: "回复" + dataset.nickname,
      replyParam
    })
    setTimeout(() => {
      this.setData({
        replyBoxFocus: true
      });
    }, 500);
  },
  previewOneImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.image
    })
  },
  submitReply: function (e) {
    let that = this,
        replyParam = that.data.replyParam,
        replyText = replyParam.content;
    if (/^\s*$/.test(replyText) || !replyText) {
      app.showModal({
        content: '请填写回复内容'
      });
      return;
    }
    replyParam.parent_comment_id = replyParam.parent_comment_id || '0';
    replyParam.comment_id = replyParam.comment_id || '0';
    replyParam.comment_img_url = this.data.commentImage || "";
    replyParam.longitude = this.data.commentLocation.longitude || "";
    replyParam.latitude = this.data.commentLocation.latitude || "";
    replyParam.address = this.data.commentLocation.name || "";
    replyParam.sub_app_id = that.data.franchisee;
    console.log(replyParam);
    app.sendRequest({
      url: '/index.php?r=AppNews/AddComment',
      data: replyParam,
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          app.showToast({
            title: '回复成功',
            success: function () {
              that.setData({
                showReplyBox: false,
                replyBoxFocus: false,
                replyParam: {},
                commentImage: '',
                commentLocation: ''
              });
            }
          });
          that.setData({
            'commentData.isMore': 2
          })
          that.getComment();
        }
      }
    });
  }
})