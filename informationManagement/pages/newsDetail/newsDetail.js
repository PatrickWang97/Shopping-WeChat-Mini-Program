var app = getApp();
var util = require('../../../utils/util.js');
var WxParse = require('../../../components/wxParse/wxParse.js');
var likeTap = false; //防止重复点击
var isReply = false; //防止重复点击
var redPocketUserInput = '';
var kbHeight = '';
var eventSource = [{ action: "get-coupon", name: "优惠券详情", local_icon: "icon-news-coupon" }, { action: "goods-trade", name: "商品详情", local_icon: "icon-news-goodsdetail" }, { action: "community", name: "社区详情", local_icon: "icon-news-community" }, { action: "to-franchisee", name: "商家详情", local_icon: "icon-news-business" }, { action: "coupon-receive-list", name: "优惠券列表", local_icon: "icon-news-coupon" }, { action: "recharge", name: "储值", local_icon: "icon-news-storage" }, { action: "transfer", name: "付款", local_icon: "icon-news-payment" }, { action: "to-promotion", name: "代言人中心", local_icon: "icon-news-extension" }, { action: "scratch-card", name: "刮刮乐", local_icon: "icon-news-scratch" }, { action: "lucky-wheel", name: "大转盘", local_icon: "icon-news-turntable" }, { action: "golden-eggs", name: "砸金蛋", local_icon: "icon-news-goldegg" }, { action: "call", name: "拨打电话", local_icon: "icon-tokeout-phone" }, { action: "turn-to-xcx", name: "跳转action小程序", local_icon: "icon-news-jump" }, { action: "share", name: "分享好友", local_icon: "icon-share" }, { action: "page-share", name: "分享朋友圈", local_icon: "icon-news-sharecircle" }, { action: "refresh-list", name: "刷新列表", local_icon: "icon-news-refreshlist" }, { action: "refresh-page", name: "刷新页面", local_icon: "icon-news-refreshpage" }, { action: "contact", name: "联系客服", local_icon: "icon-news-custom" }, { action: "preview-picture", name: "预览大图", local_icon: "icon-news-coupon" }, { action: "to-seckill", name: "秒杀", local_icon: "icon-news-kill" }, { action: "video-detail", name: "视频详情", local_icon: "icon-news-videodetail" }, { action: "topic", name: "话题详情", local_icon: "icon-news-topic" }, { action: "news", name: "资讯详情", local_icon: "icon-news-news" },{ action: "vcard", name: "名片详情", local_icon: "icon-vcard" }, { action: "vcard-msg-list", name: "名片消息列表", local_icon: "icon-vcard-msg-list" }];
var customEvent = require('../../../utils/custom_event.js');
var images = {
  wechatShare: 'https://cdn.jisuapp.cn/static/webapp/images/wechatShare.svg',
  canvasShare: 'https://cdn.jisuapp.cn/static/webapp/images/canvasShare.svg',
  canvasBgImg: 'https://cdn.jisuapp.cn/static/webapp/images/canvasBg.png',
  canvasImg: ''
}
let isPaying = false;
Page({
  data: {
    topNavBarData: {
      title: '资讯详情',
      isDefault:0
    },
    articleId: '',
    articleInfo: {},
    likeLogCount: '',
    likeLogItems: [],
    is_liked: '',
    commentWidth: '',
    commentList: [],
    commentTop: '',
    commentBottom: '',
    couponList: '',
    payPrice: '',
    replyContent: '',
    radioCheckVal: 0,
    child_comment: [],
    article_style: '',
    showMask: false,
    contentDescription: '',
    showReplyBox: false,
    replyBoxFocus: false,
    keyboardHeight: '50%',
    showCustom: false,
    pricePay: false,
    getCommentData: {
      page: 1,
      loading: false,
      nomore: false
    },
    strechHeight: '',
    strech: false,
    commentCount: '',
    imgData: {},
    showAddArticleBtn: true,
    theme_color: '#00b6f8',
    thumbUpBackgroundColor: '#3091f2',
    thumbUpColor: '#fff',
    address: '',
    scrollInto: '',
    coverThumbShow: true,
    cdnUrl: app.globalData.cdnUrl,
    siteBaseUrl: app.globalData.siteBaseUrl,
    haveRedPocket: false,
    showRedPocket: false,
    redPocketStatus: 0,
    redPocketAnimation: {},
    redPocketUserInput: '',
    redPocketObject: {},
    redAnimate: false,
    innerAudioContext: {
      currentTime: 0,
      duration: 0,
      canPlay: false,
      play: false
    },
    showSharePanel: false,
    showArticlePayPanel: false,
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
    isNeedPayArticle: true,
    isLimitedTimeFreeArticle: false,
    hasPay: false,
    payMethod: 'wechat',
    commentTab: 0,
    isNeedPayArticle: true,
    isLimitedTimeFreeArticle: false,
    hasPay: false,
    canvasData: {
      show: false,
      appName: '即速应用',
      bgImg: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=' + images.canvasBgImg,
      img: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=' + images.canvasBgImg,
      qrcodeImg: '',
      title: '',
      text: ''
    },
    imageload: {},
    likeData: {
      page: 0,
      likeList: [],
      isMore: 1
    },
    staticImages: images,
    isCustomRewardPrice: false,
    customRewardPrice: 0,
    trueArticleType: 0,
    titleBlockHeight: 250, // 标题区域的高度
    titleImageHeight: 200, // 标题图片的高度
    recommendToFranchisee: [],
    isLoading: false,      // 是否正在加载文章，当文章太长时防止页面空白
  },
  onLoad: function (options) {
    let that = this,
        articleId = '',
        franchisee = '';
    if (options.scene) {
      let scene = decodeURIComponent(options.scene);
      let keyValues = scene.split("&");
      let qrcodeParams = {}
      for(let i = 0; i < keyValues.length; i++) {
        let key = keyValues[i].split('=')[0];
        let value = keyValues[i].split('=')[1];
        qrcodeParams[key] = value;
      }
      articleId = qrcodeParams.d;
      franchisee = qrcodeParams.f || '';
    } else {
      articleId = options.detail;
      franchisee = options.franchisee || '';
    }
    this.setData({
      articleId: articleId,
      franchisee: franchisee
    });
    this.getArticleInfo(() => {
      let articleInfo = that.data.articleInfo,
          title = that.data.articleInfo.title,
          nodes = that.data.wxParseDescription.nodes,
          imgs = that.data.wxParseDescription.imageUrls,
          text = that.data.canvasData.text,
          imgArr = [],
          videoCover = '',
          articleCover = '';
      this.checkLimitTimeFree();
      if (articleInfo.form_data.paid_visible.charge_type && articleInfo.user_payment_status == 0 && articleInfo.article_type == 1) {
        let trueArticleType = articleInfo.article_type;
        this.setData({
          'articleInfo.article_type': 0,
          trueArticleType
        })
      }
      if (articleInfo.form_data.url) {
        if (articleInfo.form_data.url.article) {
          if (articleInfo.form_data.url.article.title) {
            title = articleInfo.form_data.url.article.title;
          }
          articleCover = articleInfo.form_data.url.article.cover || articleInfo.form_data.url.article.logo;
        }
        if (articleInfo.form_data.url.video && articleInfo.form_data.url.video.cover) {
          videoCover = articleInfo.form_data.url.video.cover;
        }
      }
      title = title.replace(/&nbsp;/g, '');
      if (imgs) {
        imgArr = imgArr.concat(imgs);
      }
      imgArr = imgArr.concat(articleInfo.imgs);
      that.getCanvasText();
      that.setData({
        'canvasData.title': title,
        'canvasData.img': that.imgAddResource(imgArr[0] || articleCover || videoCover),
        'canvasData.appName': articleInfo.app_name,
        'canvasData.bgImg': that.imgAddResource(articleInfo.imgs[0] || articleCover || videoCover),
        isLoading: false,
      });
    });
    this.countRead();
    this.getComment();
    this.getLikeList({
      type: 1,
      id: that.data.articleId
    });
    app.globalData.communityDetailRefresh = false;
  },
  onShow: function () {
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
  getRectBottom: function () {
    var that = this;
    wx.createSelectorQuery().select('#news-main').boundingClientRect(function (rect) {
      var bottom = rect.bottom; // 节点的上边界坐标
      that.setData({
        commentBottom: bottom
      })
    }).exec()
  },
  getArticleInfo: function (callback) {
    var that = this;
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppNews/GetArticleByPage',
      data: {
        article_id: that.data.articleId,
        page: 1,
        is_detail: 1,
        page_size: 100,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (!(res.data instanceof Array) || res.data.length <= 0 || !res.data[0].id) {
            return;
          }
          let info = res.data[0],
            description = info.article_type == 2 ? (info.form_data.url.article && info.form_data.url.article.body) : info.content,
            couponList = info.recommend || [];
          let recommendToFranchisee = [];
          if (!description) {
            description = ' ';
          }
          delete info.content;
          if (/[>]\s+/.test(description)) { // 替换空格
            description = description.replace(/(\>)(\s+)/g, ($0, $1, $2) => {
              return $1 + (new Array($2.length + 1).join('&nbsp;'));
            });
            if (info.article_type == 2) {
              if (info.form_data.url.article) {
                delete info.form_data.url.article.body;
              }
            }
          }
          if (/\'/.test(description)) { // 过滤掉单引号
            description = description.replace(/\'/g, '"');
          }
          if (/\<img[^<>]*['"]\s*\>/.test(description)) { // 筛选过滤掉图片标签有错误的属性
            description = description.replace(/\<img([^<>]*['"])\s*\>/g, ($0, $1) => {
              return '<img' + $1.match(/\s[^'"=\s]+\=['"][^"]+['"]/g).join('') + '/>';
            });
          }
          if (/<mpvoice/.test(description)) { // 替换音频
            description = description.replace(/\<mpvoice[^<>]*\>\<\/mpvoice\>/g, ($0,$1) => {
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
                if (ri.action === 'to-franchisee') {
                  recommendToFranchisee.push(ri);
                }
                return ri;
              }).filter(ri => ri.action !== 'to-franchisee');
            }
            else if (rg.recommend_good_type == 0) {
              rg.recommend_goods = rg.recommend_goods.map(ri => {
                if (ri.article_type == 3 && ri.form_data.event.action) {
                  let oldEventParams = ri.form_data.event,
                  newEventParams = {};
                  Object.keys(oldEventParams).forEach(k => {
                    if (/\-/.test(k)) {
                      newEventParams[k.replace(/\-/g, '_')] = oldEventParams[k];
                    }else {
                      newEventParams[k] = oldEventParams[k];
                    }
                  });
                  ri.event_params = newEventParams;
                }else {
                  ri.event_params = '';
                }
                if (ri.form_data && ri.form_data.recommend) {
                  delete ri.form_data.recommend;
                }
                return ri;
              });
            }
            else {};
            return rg;
          });
          that.setData({
            articleInfo: info,
            couponList: couponList,
            contentDescription: description || '',
            haveRedPocket: info.form_data.red_package.command ? true : false,
            redPocketObject: info.form_data.red_package,
            contentDescription: description || '',
            wechatAdver: res.wechat_advertise || '',
            recommendToFranchisee
          });
          WxParse.wxParse('wxParseDescription', 'html', description, _this, 10);
          if (info.form_data.red_package.grab_money > 0) {
            that.setData({redPocketStatus: 1});
          }else if (info.form_data.red_package.is_empty == 1) {
            that.setData({redPocketStatus: 2});
          }else {}
          if (info.form_data.url.article && info.form_data.url.article.type == 3) {
            that.createAudioPlayer(info.form_data.url.article);
          }
          if (info.article_type == 2 && info.form_data.url.video) {
            that.getCurVideoUrl(info.form_data.url.video.url);
          }
          callback && callback();
        }
      }
    });
  },
  getArticleLike: function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppNews/GetArticleByPage',
      data: {
        article_id: that.data.articleId,
        page: 1,
        is_detail: 1,
        page_size: 10,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (!(res.data instanceof Array) || res.data.length <= 0 || !res.data[0].id) {
            return;
          }
          let info = res.data[0];
          that.setData({
            'articleInfo.is_liked': info.is_liked
          });
        }
      }
    });
  },
  countRead: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppNews/CountReadCount',
      data: {
        article_id: that.data.articleId,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
    });
  },
  rewardCancel: function () {
    this.setData({
      showMask: false,
      payPrice: 0,
      customRewardPrice: 0,
      isCustomRewardPrice: false
    })
  },
  radioCheckedChange: function (e) {
    this.setData({
      radioCheckVal: e.detail.value
    })
  },
  customPriceBlur: function (e) {
    this.setData({
      payPrice: e.detail.value,
      customRewardPrice: e.detail.value
    })
  },
  payPrice: function (event) {
    this.setData({
      payPrice: event.currentTarget.dataset.price,
      isCustomRewardPrice: false
    })
  },
  confirmationOfpayment: function (e) {
    if(isPaying) {
      console.log('请勿多次点击');
      return;
    }
    isPaying = true;
    var list = this.data.goodsList,
      that = this,
      selected_benefit = this.data.selectDiscountInfo,
      hasWritedAdditionalInfo = false;
    if (this.data.payPrice < 1 || this.data.payPrice > 200) {
      app.showModal({
        content: '请输入1-200的数值',
      })
      isPaying = false;
      return false;
    }
    let payMethod = this.data.payMethod,
        payment_method = 1,
        use_balance;
    if (payMethod == 'wechat') {
      payment_method = 1;
    } else if (payMethod == 'wallet') {
      payment_method = 2;
      use_balance = this.data.payPrice;
    } else {}
    app.sendRequest({
      url: '/index.php?r=AppNews/AddRewardOrder',
      method: 'post',
      data: {
        article_id: that.data.articleId,
        price: that.data.payPrice,
        sub_app_id: that.data.franchisee,
        payment_method,
        use_balance
      },
      success: function (res) {
        that.payOrder(res.data, payMethod);
      },
      fail: function () {
        that.requesting = false;
        isPaying = false;
      },
      successStatusAbnormal: function () {
        that.requesting = false;
        isPaying = false;
      }
    });
  },
  payOrder: function (orderId, payMethod, callback) {
    var that = this;
    let toastText = '打赏成功';
    function paySuccess() {
      isPaying = false;
      let isLimitTimeFree = false; //是否限免
      app.showToast({
        title: toastText,
        icon: 'success'
      })
      that.rewardCancel();
      if (that.data.articleInfo.form_data.paid_visible.charge_type == 2) {
        isLimitTimeFree = true;
      }
      that.setData({
        articleInfo: {},
        couponList: '',
        payPrice: 0,
        haveRedPocket: false,
        showCustom: false,
        redPocketObject: {},
        contentDescription: '',
        wechatAdver: ''
      });
      if (isLimitTimeFree) {
        that.getArticleInfo(() => {
          that.setData({
            'articleInfo.user_payment_status': 1
          })
        });
      } else {
        that.getArticleInfo();
      }
    }
    function payFail() {
      isPaying = false;
      var showCustom = false;
      that.setData({
        showCustom: showCustom
      })
    }
    if (payMethod == 'wechat') {
      app.sendRequest({
        url: '/index.php?r=AppNews/GetWxWebappPaymentCode',
        data: {
          order_id: orderId,
          sub_app_id: that.data.franchisee
        },
        success: function (res) {
          var param = res.data;
          param.orderId = orderId;
          param.success = paySuccess;
          param.fail = payFail;
          app.wxPay(param);
        },
        fail: function () {
          payFail();
        },
        successStatusAbnormal: function () {
          payFail();
        }
      })
    } else if (payMethod == 'wallet') {
      app.sendRequest({
        url: '/index.php?r=AppNews/UseBalancePayReward',
        data: {
          order_id: orderId,
          sub_app_id: that.data.franchisee
        },
        success: function (res) {
          paySuccess();
        },
        fail: function () {
          isPaying = false;
          app.showToast({
            title: '打赏失败',
            icon: 'none'
          })
        }
      })
    } else if (payMethod == 'articlePay') {
      app.sendRequest({
        url: '/index.php?r=AppNews/GetWxPaidVisiblePaymentCode',
        data: {
          order_id: orderId,
          sub_app_id: that.data.franchisee
        },
        success: function (res) {
          let param = res.data;
          param.orderId = orderId;
          param.success = callback;
          param.fail = payFail;
          app.wxPay(param);
        },
        fail: function () {
          payFail();
        },
        successStatusAbnormal: function () {
          payFail();
        }
      })
    } else {}
  },
  rewardPlay: function () {
    let that = this;
    if(app.isLogin()){
      that.setData({
        showMask: true
      })
    }else{
      app.goLogin({
        success: function(){
          that.setData({
            showMask: true
          })
        }
      })
    }
  },
  customByReward: function () {
    var showMask = false,
      showCustom = true;
    this.setData({
      showMask: showMask,
      showCustom: showCustom,
      isCustomRewardPrice: true
    })
  },
  cancelPay: function () {
    this.setData({
      showCustom: false,
      showMask: true
    })
  },
  getComment: function () {
    var that = this,
      sdata = that.data.getCommentData;
    if (sdata.loading || sdata.nomore) {
      return;
    }
    sdata.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppNews/GetCommentByPage',
      data: {
        page: sdata.page,
        obj_id: that.data.articleId,
        page_size: 10,
        article_style: that.data.article_style,
        sub_app_id: that.data.franchisee
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
            commentCount: res.count,
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
  scrollTolower: function (event) {
    this.getComment();
  },
  oldscrolltop: 0,
  scrollEvent: function (event) {
    let scrolltop = event.detail.scrollTop,
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
  imgLoad: function (event, ) {
    let owidth = event.detail.width,
      oheight = event.detail.height,
      oscale = owidth / oheight,
      cwidth = 290,
      cheight = 120,
      ewidth, eheight,
      newData = {};
    if (oscale > cwidth / cheight) {
      ewidth = cwidth;
      eheight = cwidth / oscale;
    } else {
      ewidth = cheight * oscale;
      eheight = cheight;
    }
    newData['imgData'] = {
      imgWidth: ewidth * 2.34,
      imgHeight: eheight * 2.34
    }
    this.setData(newData);
  },
  turnReply: function (event) {
    this.turnComment(event);
  },
  turnComment: function (event) {
    let articleId = this.data.articleId,
      replyto = event.currentTarget.dataset.replyto;
    this.setData({
      showReplyBox: true,
      replyPlaceholder: '',
      'replyParam.obj_id': articleId // 话题id
    });
    setTimeout(() => {
      this.setData({
        replyBoxFocus: true
      });
    }, 500);
  },
  previewImage: function (event) {
    let that = this,
      curImg = event.currentTarget.dataset.src;
    app.previewImage({
      current: curImg,
      urls: that.data.articleInfo.content.imgs
    });
  },
  historyBack: function () {
    app.turnBack();
  },
  onShareAppMessage: function (res) {
    let shareTitle = this.data.articleInfo.title;
    let sharePath = util.getCurrentPageUrlWithArgs();
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
  turnToReport: function () {
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/informationManagement/pages/communityReport/communityReport?detail=' + this.data.articleId + franchiseeParam);
  },
  gotoCouponDetail: function (event) {
    let id = event.currentTarget.dataset.couponId;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/pages/couponDetail/couponDetail?couponStatus=recieve&detail=' + id + franchiseeParam);
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
  turntovideo: function () {
    let coverThumbShow = false;
    this.setData({
      coverThumbShow: coverThumbShow
    })
  },
  receiveCoupon: function (event) {
    let _this = this;
    let couponId = event.currentTarget.dataset.couponId;
    app.sendRequest({
      url: '/index.php?r=AppShop/recvCoupon',
      data: {
        coupon_id: couponId,
        sub_app_id: that.data.franchisee
      },
      hideLoading: true,
      success: function (res) {
        app.sendUseBehavior([{'goodsId': couponId}],18); // 行为记录
        _this.setData({
          receiveSuccess: 1,
          receiveCount: res.data.recv_count,
          receiveLimitNum: res.data.limit_num
        });
        setTimeout(function () {
          _this.hideToast();
        }, 3000);
        if (res.data.is_already_recv == 1) {
          let couponList = _this.data.couponList;
          for (var i = 0; i < couponList.length; i++) {
            if (couponList[i]['id'] == couponId) {
              let newData = {};
              newData['couponList[' + i + '].recv_status'] = 0;
              _this.setData(newData);
            }
          }
        }
      }
    })
  },
  cancelReply: function () {
    this.setData({
      showReplyBox: false,
      replyBoxFocus: false
    });
  },
  submitReply: function () {
    let that = this,
        replyParam = that.data.replyParam,
        replyText = replyParam.content;
    if (/^\s*$/.test(replyText) || !replyText) {
      app.showModal({
        content: '请填写回复内容'
      });
      return;
    }
    replyParam.obj_id = this.data.articleId;
    replyParam.parent_comment_id = replyParam.parent_comment_id || '0';
    replyParam.comment_id = replyParam.parent_comment_id || '0';
    replyParam.comment_img_url = this.data.commentImage || "";
    replyParam.longitude = this.data.commentLocation.longitude || "";
    replyParam.latitude = this.data.commentLocation.latitude || "";
    replyParam.address = this.data.commentLocation.name || "";
    replyParam.sub_app_id =  that.data.franchisee;
    if (isReply) { return; };
    isReply = true;
    replyParam.sub_app_id = that.data.franchisee;
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
          app.globalData.communityDetailRefresh = true;
          that.onShow();
          that.setData({
            'articleInfo.comment_count': Number(that.data.articleInfo.comment_count) + 1
          })
        }
      },
      complete: function () {
        isReply = false;
      }
    });
  },
  replyInput: function (event) {
    this.setData({
      'replyParam.content': event.detail.value
    });
  },
  scrollTo: function (e) {
    wx.createSelectorQuery().select('#news-main').boundingClientRect(function (rect) {
      var height = rect.height + 15; // 节点的上边界坐标
      app.pageScrollTo(height);
    }).exec()
  },
  streching: function () {
    let strechHeight = '',
      strech = this.data.strech;
    if (strech == false) {
      strechHeight = '38rpx';
      strech = true;
    } else {
      strech = false;
    }
    this.setData({
      strechHeight: strechHeight,
      strech: strech
    })
  },
  replyFocus: function (e) {
    if (e.detail.height && e.detail.height != this.data.keyboardHeight) {
      console.log('实时获取键盘高度', e.detail.height);
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
  onReachBottom: function () {
    if (this.data.commentTab == 0) {
      this.scrollTolower();
    }
    if (this.data.commentTab == 1) {
      this.getLikeList({
        type: 1,
        id: this.data.articleId
      });
    }
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
  stopPropagation: function () {
  },
  showRedPocketAct: function () {
    this.setData({showRedPocket: true});
  },
  closeRedPocketModal: function () {
    this.setData({showRedPocket: false});
  },
  openRedPocketAct: function () {
    let command = this.data.redPocketObject.command,
    inputCommand = redPocketUserInput || this.data.redPocketUserInput;
    if (command === inputCommand) {
      this.redPocketOpenSucc();
      return;
    }
    this.redPocketOpenFail();
  },
  turnToRedPocketDetail: function () {
    this.setData({showRedPocket: false});
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/informationManagement/pages/newsPocketsDetail/newsPocketsDetail?detail='+ this.data.redPocketObject.rp_id + franchiseeParam);
  },
  redPocketOpenSucc: function () {
    let that = this;
    let redPocketObject = this.data.redPocketObject;
    redPocketObject.sub_app_id = that.data.franchisee;
    app.sendRequest({
      url: '/index.php?r=AppNews/GrabRP',
      data: redPocketObject,
      complete: function (res) {
        if (!res) {
          return;
        }
        switch (res.status) {
          case 0:
            that.setData({
              redPocketStatus: 1,
              'redPocketObject.grab_money': res.data
            });
            break;
          case 3:
            that.setData({redPocketStatus: 1});
            break;
          case 4:
            that.setData({redPocketStatus: 2});
            break;
          default:
            break;
        }
      }
    });
  },
  redPocketOpenFail: function () {
    this.setData({
      redAnimate: true
    });
    let animation = wx.createAnimation({
      transformOrigin: "50% 50%",
      duration: 350,
      timingFunction: "start-end",
      delay: 0
    });
    animation.rotate(3).step({duration: 50})
      .rotate(-3).step({duration: 100})
      .rotate(3).step({duration: 100})
      .rotate(-3).step({duration: 100});
    this.setData({
      redPocketAnimation: animation.export()
    });
    setTimeout(() => {
      animation.rotate(0).step({duration: 0});
      this.setData({
        redPocketAnimation: animation.export()
      });
      setTimeout(() => {
        this.setData({
          redAnimate: false,
          redPocketUserInput: ''
        });
      }, 0);
    }, 350);
  },
  redPocketCmmandInput: function (e) {
    let val = e.detail.value;
    this.setData({redPocketUserInput: val});
  },
  redPocketCmmandBlur: function (e) {
    let val = e.detail.value;
    redPocketUserInput = val;
    this.setData({redPocketUserInput: val});
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
          'articleInfo.form_data.url.video.url': res.data
        })
      }
    });
  },
  openArticlePayPanel: function() {
    this.setData({
      showArticlePayPanel: true
    })
  },
  closeArticlePayPanel: function() {
    this.setData({
      showArticlePayPanel: false
    })
  },
  payForArticle: function() {
    if(isPaying) {
      console.log('请勿多次点击');
      return;
    }
    isPaying = true;
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppNews/AddPaidVisibleOrder',
      method: 'post',
      data: {
        article_id: that.data.articleId,
        price: that.data.articleInfo.form_data.paid_visible.amount,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        that.payOrder(res.data, 'articlePay', () => {
          isPaying = false;
          app.showToast({
            title: '付费成功',
            icon: 'success'
          })
          that.setData({
            'articleInfo.user_payment_status': 1
          })
          if (that.data.trueArticleType == 1) {
            that.setData({
              'articleInfo.article_type': 1
            })
          }
          that.closeArticlePayPanel();
          that.showAllArticle();
        });
      },
      fail: function () {
        that.requesting = false;
        isPaying = false;
      },
      successStatusAbnormal: function () {
        that.requesting = false;
        isPaying = false;
      }
    });
  },
  showAllArticle: function() {
    let that = this;
    let type = this.data.articleInfo.form_data.paid_visible.charge_type; //1为付费，2为限免
    let hasPay = this.data.articleInfo.user_payment_status; //0为未付款，1为已付费
    if (type == 2) {
      this.setData({
        'articleInfo.user_payment_status': 1
      })
      if (that.data.trueArticleType == 1) {
        that.setData({
          'articleInfo.article_type': 1
        })
      }
      return;
    }
    if (type == 1 && hasPay == 0) {
      this.openArticlePayPanel();
    }
  },
  replyLineChange: function(e) {
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
  replyImageChoose: function() {
    let that = this;
    app.chooseImage((imageUrls) => {
      that.setData({
        commentImage: imageUrls[0]
      })
    }, 1)
  },
  replyImagePreview: function() {
    let commentImage = this.data.commentImage
    app.previewImage({
      current: commentImage
    })
  },
  replyImageDelete: function() {
    this.setData({
      commentImage: ''
    })
  },
  replyLocationChoose: function() {
    let that = this;
    app.chooseLocation({
      success(res) {
        that.setData({
          commentLocation: res
        })
      }
    })
  },
  replyLocationDelete: function() {
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
  openSharePanel: function() {
    this.setData({
      showSharePanel: true
    })
  },
  closeSharePanel: function() {
    this.setData({
      showSharePanel: false
    })
  },
  payMethodChange: function(e) {
    this.setData({
      payMethod: e.detail.value
    })
  },
  switchCommentTab: function(e) {
    this.setData({
      commentTab: Number(e.currentTarget.dataset.num)
    })
  },
  goCommentDetail: function(e) {
    let type = e.currentTarget.dataset.type;
    app.turnToPage(`/informationManagement/pages/newsCommentDetail/newsCommentDetail?type=${type}&commentId=${e.currentTarget.dataset.id}&articleId=${this.data.articleId }&franchisee=${this.data.franchisee}`);
  },
  imageload: function (e) {
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
    if (setWidth < minWidth) {
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
  addCommentLike: function (e) {
    let that = this,
        dataset = e.currentTarget.dataset,
        type = dataset.type,
        likeId = dataset.id,
        likeIndex = dataset.index;
    if(!app.isLogin()){
      app.goLogin({
        success: () => {
          this.setData({
            getCommentData: {
              page: 1,
              loading: false,
              nomore: false
            },
            commentList: []
          });
          this.getComment();
          this.getArticleLike();
        }
      })
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppNews/PerformLike',
      data: {
        obj_type: type, //1为文章，2为评论
        obj_id: likeId, //传文章id或评论id
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: (res) => {
        if (res.status == 0) {
          if (likeIndex == 'article') {
            let articleInfo = that.data.articleInfo;
            if (articleInfo.is_liked == "0") {
              articleInfo.is_liked = true;
              articleInfo.like_count = Number(articleInfo.like_count) + 1;
            } else {
              articleInfo.is_liked = false;
              articleInfo.like_count = Number(articleInfo.like_count) - 1;
            }
            that.setData({
              articleInfo,
              likeData: {
                page: 0,
                likeList: [],
                isMore: 1
              }
            })
            that.getLikeList({
              type: type,
              id: likeId
            });
            return;
          }
          let commentList = that.data.commentList,
              thisComment = commentList[likeIndex];
          if (thisComment.is_liked == "0") {
            thisComment.is_liked = true;
            thisComment.like_count = Number(thisComment.like_count) + 1;
          } else {
            thisComment.is_liked = false;
            thisComment.like_count = Number(thisComment.like_count) - 1;
          };
          commentList[likeIndex] = thisComment;
          that.setData({
            commentList
          })
        }
      }
    });
  },
  commentToComment: function(e) {
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
  previewOneImage: function(e) {
    app.previewImage({
      current: e.currentTarget.dataset.image
    })
  },
  getLikeList: function(e) {
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
        page_size: 10,
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
  getCanvasText() {
    let content = this.data.contentDescription;
    content = content.replace(/<[^>]+>/g, "");
    content = content.replace(/&nbsp;/g, '');
    this.setData({
      'canvasData.text': content
    })
  },
  openCanvasSharePanel: function() {
    let that = this;
    that.getQrcode().then(qrcodeUrl => {
      that.setData({
        'canvasData.qrcodeImg': that.imgAddResource(qrcodeUrl),
        showSharePanel: false,
        'canvasData.show': true
      })
    }).catch(err => {
      console.log(that.data.canvasData);
      that.setData({
        'canvasData.qrcodeImg': '',
        showSharePanel: false,
        'canvasData.show': true
      })
      console.log('二维码加载失败', err);
    })
  },
  dateToTimestamp: function(date) {
    date = date.slice(0, 19);
    date = date.replace(/-/g, '/');
    let timestamp = new Date(date).getTime();
    return timestamp;
  },
  checkLimitTimeFree: function() {
    let paid_visible = this.data.articleInfo.form_data.paid_visible;
    if (paid_visible.charge_type == 2) {
      let formTime = this.dateToTimestamp(paid_visible.free_start_date);
      let toTime = this.dateToTimestamp(paid_visible.free_end_date);
      let now = new Date().getTime();
      if (now < formTime || now > toTime) {
        this.setData({
          'articleInfo.form_data.paid_visible.charge_type': 1
        })
      }
    }
  },
  getQrcode: function () {
    let that = this;
    return new Promise((resolve, reject) => {
      let articleId = that.data.articleId;
      app.sendRequest({
        url: '/index.php?r=api/tool/GenerateQRCode',
        data: {
          path: 'informationManagement/pages/newsDetail/newsDetail',
          scene: `d=${articleId}&f=${that.data.franchisee}` //d为detail, f为franchisee
        },
        method: 'get',
        success(res) {
          resolve(res.data);
        },
        fail() {
          reject();
        },
        successStatusAbnormal() {
          reject();
        }
      });
    })
  },
  titleImageLoad: function (event) {
    const scale = 3 / 2;
    const systemInfo = wx.getSystemInfoSync();
    const screenW = systemInfo.screenWidth;
    const imgW = event.detail.width;
    const imgH = event.detail.height;
    const titleImageHeight = screenW * imgH / imgW;
    const titleBlockHeight = screenW / scale;
    this.setData({
      titleBlockHeight: titleBlockHeight,
      titleImageHeight: titleImageHeight
    });
  },
  bindTurnGoodsDetail:function(event){
    let data = event.currentTarget.dataset
    let goods_id = data.goods_id;
    let franchiseeId = data.franchisee_id
    let franchiseeParam = franchiseeId ? ('&franchisee=' + franchiseeId) : '';
    let url = '/detailPage/pages/goodsDetail/goodsDetail?detail=' + goods_id + franchiseeParam;
    app.turnToPage(url)
  },
  imgAddResource(src) {
    return `${app.getSiteBaseUrl()}/index.php?r=Download/DownloadResourceFromUrl&url=${src}`;
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
