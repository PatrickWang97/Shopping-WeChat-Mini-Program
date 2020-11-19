var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    communityId: '',
    tabActive : 'like' ,
    likeList : [],
    likeListData : {
      page : 1 ,
      loading : false ,
      nomore : false
    },
    commentList : [],
    commentListData : {
      page : 1 ,
      loading : false ,
      nomore : false
    },
    reportList : [],
    reportListData : {
      page : 1 ,
      loading : false ,
      nomore : false
    },
    theme_color : '',
    sectionCommentLikeCounts: {
      comment_count: 0, // 社区话题被评论的次数
      like_count: 0, // 社区话题被点赞的次数
      show_type: 0, // 最新消息类型 0： 评论， 1： 点赞
    }
  },
  onLoad: function(options){
    let that = this,
        communityId = options.detail;
    let franchisee = options.franchisee || '';
    let commentCount = options.comment;
    let likeCount = options.like;
    let compid = options.compid;
    let newData = {
      communityId: communityId,
      franchisee: franchisee
    };
    if (commentCount > 0) {
      newData['sectionCommentLikeCounts.comment_count'] = commentCount;
    }
    if (likeCount > 0) {
      newData['sectionCommentLikeCounts.like_count'] = likeCount;
    }
    if (options.showtype !== undefined && options.showtype == 0) {
      newData['tabActive'] = 'comment';
    } else {
      newData['tabActive'] = 'like';
    }
    if (compid) {
      newData['fromCompid'] = compid;
    }
    this.setData(newData);
    if (likeCount > 0 && newData['tabActive'] === 'like') {
      setTimeout(() => this.updateSectionCommentLikeCount(communityId, 1), 1000);
    } else if (commentCount > 0 && newData['tabActive'] === 'comment') {
      setTimeout(() => this.updateSectionCommentLikeCount(communityId, 0), 1000);
    }
    app.getStorage({
      key: 'communityThemeColor-' + communityId,
      success: function (res) {
        that.setData({ theme_color: res.data });
      },
      fail: function () {
        that.getThemeColor(communityId);
      }
    })
    this.getlikeLog();
    this.getComment();
    this.getReport();
  },
  getlikeLog : function() {
    var that = this,
        sdata = that.data.likeListData ;
    if(sdata.loading || sdata.nomore){
      return ;
    }
    sdata.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetLikeLogByPage',
      data: {
        page: sdata.page,
        section_id : that.data.communityId,
        only_receiver_record : 1,
        sub_app_id: that.data.franchisee
      } ,
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data,
              oldData = that.data.likeList,
              newData = [];
          for (let i = 0; i < res.data.length; i++) {
            let idata = res.data[i];
            if( idata.type == 1){
              idata.article_id = idata.obj_id;
              idata.post_text = unescape(idata.obj.title.replace(/\\u/g, "%u"));
            }else if( idata.type == 2 ){
              idata.article_id = idata.obj.obj_id;
              idata.post_text = idata.obj.content.text.replace(/\n|\\n/g , '\n');
            }
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
          that.setData({
            likeList: newData ,
            'likeListData.page' : sdata.page + 1
          });
        }
        that.setData({
          'likeListData.loading': false ,
          'likeListData.nomore' : res.is_more == 0 ? true : false
        });
      },
      fail: function(res){
        that.setData({
          'likeListData.loading': false
        });
      }
    });
  },
  getComment : function() {
    var that = this,
        sdata = that.data.commentListData ;
    if(sdata.loading || sdata.nomore){
      return ;
    }
    sdata.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetCommentByPage',
      data: {
        page: sdata.page,
        section_id : that.data.communityId,
        only_receiver_record : 1,
        sub_app_id: that.data.franchisee,
        order: 'desc'
      } ,
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data,
              oldData = that.data.commentList,
              newData = [];
          for (let i = 0; i < res.data.length; i++) {
            let idata = res.data[i];
            if(idata.comment_id != 0 && !!idata.comment_id){
              idata.article_text = unescape(idata.obj.title.replace(/\\u/g, "%u"));
            }
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
          that.setData({
            commentList: newData ,
            'commentListData.page' : sdata.page + 1
          });
        }
        that.setData({
          'commentListData.loading': false ,
          'commentListData.nomore' : res.is_more == 0 ? true : false
        });
      },
      fail: function(res){
        that.setData({
          'commentListData.loading': false
        });
      }
    });
  },
  getReport: function () {
    var that = this,
      sdata = that.data.reportListData;
    if (sdata.loading || sdata.nomore) {
      return;
    }
    sdata.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetMaskArticleByPage',
      data: {
        page: sdata.page,
        section_id: that.data.communityId,
        only_receiver_record: 1,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data,
            oldData = that.data.reportList,
            newData = [];
          for (let i = 0; i < res.data.length; i++) {
            let idata = res.data[i];
            if (idata.content.imgs) {
              idata.showImg = idata.content.imgs[0];
            }else {
              if (idata.carousel_img) {
                idata.showImg = idata.carousel_img;
              }else {
                idata.showImg = idata.headimgurl;
              }
            }
            newData.push(idata);
          }
          newData = oldData.concat(newData);
          that.setData({
            reportList: newData,
            'reportListData.page': sdata.page + 1
          });
        }
        that.setData({
          'reportListData.loading': false,
          'reportListData.nomore': res.is_more == 0 ? true : false
        });
      },
      fail: function (res) {
        that.setData({
          'reportListData.loading': false
        });
      }
    });
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
        if (res.status == 0) {
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
    let sectionCommentLikeCounts = this.data.sectionCommentLikeCounts;
    this.setData({
      tabActive : type
    });
    if (type === 'like' && sectionCommentLikeCounts.like_count > 0) {
      this.updateSectionCommentLikeCount(null, 1);
    }
    if (type === 'comment' && sectionCommentLikeCounts.comment_count > 0) {
      this.updateSectionCommentLikeCount(null, 0);
    }
  },
  likeScroll : function(event) {
    this.getlikeLog();
  },
  commentScroll : function(event) {
    this.getComment();
  },
  reportScroll : function(event) {
    this.getReport();
  },
  turnBack : function(){
    app.turnBack();
  },
  turnToDetail : function(event) {
    let aId = event.currentTarget.dataset.id,
        sId = event.currentTarget.dataset.sid;
    let that = this;
    this.verifyArticleExist(aId, sId, function (res) {
      if (res == 1 || res == 2) {
        let onlyOwnRecord = res == 1 ? 1 : '';
        let franchiseeParam = that.data.franchisee ? ('&franchisee=' + that.data.franchisee) : '';
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
  getSectionCommentLikeCount: function(sectionId) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetSectionCommentOrLikeCount',
      data: {
        section_id: sectionId || this.data.communityId,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        let data = res.data;
        if (data.comment_count || data.like_count) {
          that.setData({
            sectionCommentLikeCounts: data
          })
        }
      }
    })
  },
  updateSectionCommentLikeCount: function (sectionId, type) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/UpdateSectionCommentOrLikeCount',
      data: {
        section_id: sectionId || this.data.communityId || '',
        read_type: type,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        let newData = {};
        if (type == 0) {
          newData['sectionCommentLikeCounts.comment_count'] = 0;
        }
        if (type == 1) {
          newData['sectionCommentLikeCounts.like_count'] = 0;
        }
        that.setData(newData);
        app.globalData.communityPageRefresh = true;
        if (that.data.fromCompid) {
          app.globalData.refreshSearchCompId = that.data.fromCompid;
        }
      }
    })
  }
})
