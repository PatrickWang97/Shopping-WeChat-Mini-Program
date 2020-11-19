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
Page({
  data: {
    backBtnShow: true,
    navigatorBarPaddingTop: 20,
    mainRect: {
      width: 375,
      height: 667
    },
    franchiseeId: '',
    modeId: '',
    images: [],
    count: 0,
    index: 0,
    title: '',
    imageLoadCount: 0,
    playVideo: false, // 是否播放视频
    currentVideoUrl: '', // 当前播放的视频链接
    videoControlsShow: false, // 是否显示视频控制
    videoFullScreenShow: false, // 视频全屏播放
  },
  onLoad: function (options) {
    let {
      statusBarHeight,
      windowWidth,
      windowHeight,
      model
    } = wx.getSystemInfoSync();
    let {
      viewImgOrVideo
    } = app.globalData;
    let newdata = {};
    if (statusBarHeight) {
      newdata.navigatorBarPaddingTop = statusBarHeight;
      newdata.mainRect = {
        width: windowWidth,
          height: windowHeight - statusBarHeight - 40
      };
      this.windowWidth = windowWidth;
    }
    if (viewImgOrVideo) {
      let {
        index,
        images
      } = viewImgOrVideo;
      let curImg = images[index];
      newdata = Object.assign(newdata, viewImgOrVideo);
      if (curImg.type === 'video') {
        this.videoPlayerContext = wx.createVideoContext('video-player');
        newdata.playVideo = true;
        newdata.currentVideoUrl = curImg.videoUrl;
        setTimeout(() => {
          this.videoPlayerContext.play();
        }, 500);
      }
    } else {
      newdata.index = options.index || 0;
      this.getAppShopConfig(options);
      this.getAppShopByPage(options);
    }
    if (!/^iphone\s?6/i.test(model)) {
      newdata.videoControlsShow = true;
    }
    if (+options.share === 1) {
      newdata.backBtnShow = false;
    }
    newdata.franchiseeId = options.franchisee || '';
    newdata.modeId = options.modeid || '';
    this.setData(newdata);
    wx.showLoading({
      title: '加载中'
    });
  },
  onUnload: function () {
    app.globalData.viewImgOrVideo = null;
    this.videoPlayerContext = null;
  },
  getAppShopConfig: function (options) {
    let that = this;
    let {
      franchisee,
      modeid
    } = options;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShopConfig/GetAppShopConfig',
      data: {
        sub_app_id: franchisee,
        mode_id: modeid
      },
      success: function ({data:[data]}) {
        if (data) {
          let product = (typeof data.object_data === 'string' ?
            JSON.parse(data.object_data)
            : data.object_data)['product'];
          let {
            video,
            image
          } = product;
          let imageAry = [];
          let newdata = {};
          if (video && video[0] && video[0].imageUrl) {
            imageAry[0] = Object.assign({}, pickAttrObject({
              imageUrl: 'imageUrl',
              id: 'id'
            }, video[0]), { type: 'video' });
            that.getVideoUrlById(video[0].id).then(({ data }) => {
              if (data) {
                that.setData({
                  ['images[0].videoUrl']: data
                });
              }
            })
          }
          imageAry = imageAry.concat(image.map(img => Object.assign({}, img, { type: 'image' })));
          newdata.images = imageAry;
          newdata.count = imageAry.length;
          that.setData(newdata);
        }
      },
      complete: function () {
      }
    });
  },
  getAppShopByPage: function(options){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: {
        sub_shop_app_id: options.franchisee
      },
      success: function ({data: [data]}) {
        if (data) {
          let name = data.name || '';
          that.setData({
            title: name
          });
        }
      }
    })
  },
  getVideoUrlById: function (id) {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppVideo/GetVideoLibURL',
        data: {
          id
        },
        success: resolve,
        error: reject
      });
    })
  },
  bindImageLoad: function (e) {
    let path = e.currentTarget.dataset.path,
    detail = e.detail,
    ow = detail.width,
    oh = detail.height;
    let mainRect = this.data.mainRect,
    mw = mainRect.width,
    mh = mainRect.height;
    let loadCount = this.data.imageLoadCount;
    let fw, fh, mt;
    fw = mw;
    fh = oh / ow * mw;
    mt = (mh-fh) / 2;
    loadCount += 1;
    this.setData({
      [path] : `width:${fw}px;height:${fh}px;padding:${mt}px 0;`,
      imageLoadCount: loadCount
    });
    if (this.data.count == loadCount) {
      wx.hideLoading();
    }
  },
  swiperChange: function (e) {
    let {
      current,
      source
    } = e.detail;
    if (source === 'touch') {
      this.setData({
        index: current
      });
    }
  },
  turnBackTap: function () {
    app.turnBack();
  },
  tapVideo: function (e) {
    let action = this.videoPlayerIsPlay ? 'pause' : 'play';
    this.videoPlayerContext[action]();
  },
  videoPlay: function (e) {
    this.videoPlayerIsPlay = true;
    return Promise.resolve(this.videoPlayerIsPlay);
  },
  videoPause: function (e) {
    this.videoPlayerIsPlay = false;
    return Promise.resolve(this.videoPlayerIsPlay);
  },
  videoViewTouchStartClientX: '',
  videoStateBotBoundary: '',
  videoViewTouchEvent: function (e) {
    let {
      type,
      changedTouches,
      target
    } = e;
    let {
      clientX,
      clientY
    } = changedTouches[0];
    if (type === 'touchstart') {
      this.videoViewTouchStartClientX = clientX;
      return;
    }
    if (target.id === 'video-player' && !this.videoStateBoundary) {
      this.videoStateBotBoundary = target.offsetTop + this.windowWidth / 750 * 500;
    }
    let toBotDelt = this.videoStateBotBoundary - clientY;
    if (toBotDelt > 0 && toBotDelt < 50) { // 默认为是滑动视频控制条
      return;
    }
    let deltX = clientX - this.videoViewTouchStartClientX;
    if (Math.abs(deltX) < 30) {
      return;
    }
    if (this.videoPlayerIsPlay) {
      this.videoPlayerContext.pause();
      return;
    }
    let { index, count } = this.data;
    if (deltX > 0) {
      console.log('向右滑动 减少')
      if (index == 0) {
        return;
      }
      index--;
    } else {
      console.log('向左滑动 增加')
      if (count - 1 == index) {
        app.showToast({
          title: '已经是最后1页了',
          icon: 'none'
        })
        return;
      }
      index++;
    }
    this.setData({
      index,
      playVideo: false
    })
  },
  showVideo: function (e) {
    let {
      videoUrl
    } = e.currentTarget.dataset;
    let newdata = {};
    if (!this.videoPlayerContext) {
      this.videoPlayerContext = wx.createVideoContext('video-player');
    }
    newdata.playVideo = true;
    newdata.currentVideoUrl = videoUrl;
    this.setData(newdata);
    setTimeout(() => {
      this.videoPlayerContext.play();
    }, 500)
  },
  onShareAppMessage: function () {
    let {
      title,
      images
    } = this.data;
    let path = util.getCurrentPageUrlWithArgs();
    if (path) {
      path = path + (~path.indexOf('?') ? '&' : '?') + 'share=1';
    }
    return app.shareAppMessage({
      path: path,
      title: title,
      imageUrl: images[0].imageUrl,
      success: function () {
      }
    })
  },
  videoWating: function () {
    console.log('wating')
  },
  videoError: function () {
    app.showModal({
      content: 'error happen'
    })
  },
  videoFullScreen: function (e) {
    let {
      fullScreen
    } = e.detail;
    if (typeof fullScreen === 'boolean') {
      this.setData({
        videoFullScreenShow: fullScreen
      });
    }
  },
  exitFullScreen: function () {
    this.videoPlayerContext.exitFullScreen();
  },
  backHomeAct: function () {
    let { homepageRouter } = app.globalData;
    if (homepageRouter) {
      wx.switchTab({
        url: `/pages/${homepageRouter}/${homepageRouter}`
      })
    }
  }
})
