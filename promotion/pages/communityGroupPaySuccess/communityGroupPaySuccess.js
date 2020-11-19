import Scratch from "../../../utils/scratch.js"
var app = getApp()
Page({
  data: {
    status: 0, // 0: 普通页面 1:有集集乐的情况
    orderId: '',
    franchiseeId: '',
    collectBenefitData: {}, // 集集乐数据
    starData: [], //集集乐的星 light:已集样式 dark:未集样式
    isFail: true, //刮刮乐未中奖
    isWinning: true, //刮刮乐中奖
    isComfort: true, //刮刮乐安慰奖
    isWhole: true, //刮奖区域是否显示
    scratchId: '', //活动号
    isShowteam: false,
    winingTitle: '',
    canShow: wx.canIUse('cover-view'),
    isScroll: true, //刮刮乐当在 canvas 中移动时且有绑定手势事件时禁止屏幕滚动以及下拉刷新
    ifWxCoupon: false,
    timestamp: '',
    signature: '',
    ifGetComfort: false
  },
  onLoad: function(options) {
    let that = this;
    if (options.collectBenefit == 1) {
      that.getCollectBenefitData(options.detail);
      that.setData({
        'status': 1
      });
    }
    that.setData({
      'orderId': options.detail || '',
      'code': options.code || ''
    });
    that.getOrderDetail();
    that.getGoldenData(options.detail);
    let systemInfo = app.globalData.systemInfo;
    let width = 558 * systemInfo.windowWidth / 750;
    let height = 258 * systemInfo.windowWidth / 750;
    that.scratch = new Scratch(that, {
      canvasWidth: width,
      canvasHeight: height,
      imageResource: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=' + app.getCdnUrl() + '/static/webapp/images/scratchMovie.png',
      maskColor: "red",
      r: 15,
      callback: () => {
        that.setData({
          hideCanvas: true
        })
        if (that.data.ifWxCoupon) {
          setTimeout(function() {
            that.toAddCard()
          }, 500)
        }
      },
      imgLoadCallback: () => {
        setTimeout(function() {
          that.setData({
            isShowteam: true
          });
        }, 150);
      }
    });
  },
  touchStart: function(e) {
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true)
  },
  touchMove: function(e) {
    if (!this.isStart) return
    let pos = this.drawRect(e.touches[0].x, e.touches[0].y)
    this.ctx.clearRect(pos[0], pos[1], pos[2], pos[2])
    this.ctx.draw(true)
  },
  touchEnd: function(e) {
    if (!this.isStart) return
    let {
      canvasWidth,
      canvasHeight,
      minX,
      minY,
      maxX,
      maxY
    } = this
    if (maxX - minX > .5 * canvasWidth && maxY - minY > .5 * canvasHeight) {
      this.ctx.draw()
      this.endCallBack && this.endCallBack()
      this.isStart = false
      this.page.setData({
        "isScroll": true
      })
    }
  },
  getGoldenData: function(id) {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getTimeAfterConsume",
      method: "post",
      data: {
        order_id: id
      },
      success: function(data) {
        if (data.data) {
          if (that.data.code) {
            that.setData({
              isWhole: true,
            })
          } else {
            that.setData({
              isWhole: false,
              scratchId: data.data
            })
          }
        } else {
          that.setData({
            isWhole: true,
          })
        }
        if (data.integral) { //支付获取积分
          that.setData({
            'rewardPointObj': {
              showModal: true,
              count: data.integral,
              callback: ''
            }
          })
        }
      }
    })
  },
  showAreaClick: function() {
    let that = this;
    that.setData({
      isShowteam: false
    })
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/lottery",
      hideLoading: true,
      data: {
        activity_id: that.data.scratchId
      },
      success: function(res) {
        let data = res.data;
        that.scratch.start();
        if (data.title == '谢谢参与') {
          that.setData({
            isFail: false
          })
        } else {
          let params = {
            ifWxCoupon: data.card_id || false,
            timestamp: data.timestamp || '',
            signature: data.signature || ''
          };
          if (data.is_comfort) {
            params['isComfort'] = false;
          } else {
            params['isWinning'] = false;
            params['winingTitle'] = data.title;
          }
          that.setData(params)
        }
      }
    })
  },
  getCollectBenefitData: function(id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppMarketing/CollectmeSendCoupon',
      data: {
        order_id: id
      },
      hideLoading: true,
      success: function(res) {
        let starData = [];
        for (var i = 0; i < res.data.star_num; i++) {
          starData.push('light');
        }
        for (var i = 0; i < res.data.collect_num - res.data.star_num; i++) {
          starData.push('dark');
        }
        that.setData({
          'collectBenefitData': res.data,
          'starData': starData
        });
      }
    });
  },
  goToHomepage: function() {
    let router = app.getHomepageRouter();
    app.reLaunch({
      url: '/pages/' + router + '/' + router
    });
  },
  goToOrderDetail: function() {
    let groupPath = '/promotion/pages/communityGroupOrderDetail/communityGroupOrderDetail?detail=' + this.data.orderId;
    app.turnToPage(groupPath, true);
  },
  getOrderDetail: function() {
    var _this = this;
    app.getOrderDetail({
      data: {
        order_id: _this.data.orderId
      },
      success: function(res) {
        let formData = res.data[0].form_data;
        _this.setData({
          orderInfo: formData,
          disNotice: formData.dis_group_info.dis_notice
        });
        _this.initCommunity(formData.dis_group_info.leader_token);
        _this.groupCanvas()
      }
    })
  },
  toAddCard: function() {
    let _data = this.data,
      wxcouponId = _data.ifWxCoupon,
      _this = this;
    wx.addCard({
      cardList: [{
        cardId: wxcouponId,
        cardExt: '{"nonce_str":"' + _data.timestamp + '","timestamp":"' + _data.timestamp + '", "signature":"' + _data.signature + '"}'
      }],
      success: function(res) {
        _this.setData({
          ifWxCoupon: false,
          ifGetComfort: true
        });
        app.sendRequest({
          url: '/index.php?r=appLotteryActivity/recvWeChatCoupon',
          data: {
            card_id: res.cardList[0].cardId,
            sub_app_id: _data.franchisee,
            activity_id: _data.scratchId,
          },
          success: function(res) {
            app.showModal({
              title: '提示',
              content: '领取卡券成功',
              showCancel: false
            });
          }
        });
      }
    })
  },
  callPhone: function (e) {
    let phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  initCommunity: function (leaderToken) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      method: 'post',
      data: {
        leader_token: leaderToken
      },
      success: function (res) {
        let leaderInfo = res.data[0];
        _this.setData({
          leaderInfo: leaderInfo
        })
      }
    })
  },
  groupCanvas: function(){
    let goodsInfoArr = this.data.orderInfo.goods_info;
    let goodsInfoNum = 0;
    let goodsInfo = goodsInfoArr[0];
    let random = (parseInt(Math.random() * 10 + 90));
    let _this = this;
    for (let item of goodsInfoArr){
      goodsInfoNum += Number(item.num);
    }
    const context = wx.createCanvasContext('shareCanvas');
    this.setDrawImage(context, 'http://cdn.jisuapp.cn/static/webapp/images/promotion/group_share_bg.png', 0, 0, 414, 330,() => {
      this.setDrawImage(context, goodsInfo.cover, 150, 124, 116, 116,() => {
        this.setfillFonts(context, '#FF7100', 18, '共购买' + goodsInfoNum + '个商品，购买指数超过' + random + '%的群好友', 36, 96);
        let name = goodsInfo.goods_name;
        if (name.length > 5) {
          name = name.substr(0, 4) + '...';
        }
        this.setfillFonts(context, '#333', 18, name, 168, 270);
        this.setfillFonts(context, '#FF1919', 21, '¥' + goodsInfo.price, 168, 300);
        context.draw(true);
        setTimeout(()=>{
          wx.canvasToTempFilePath({
            canvasId: 'shareCanvas',
            success(res) {
              console.log(res.tempFilePath)
              _this.canvasImg = res.tempFilePath;
            }
          })
        },100)
      });
    });
  },
  setfillFonts: function(ctx,color,size,word,x,y){
    ctx.draw(true)
    ctx.setFontSize(size);
    ctx.setFillStyle(color);
    ctx.fillText(word, x, y);
  },
  onShareAppMessage: function () {
    let homePage = app.getHomepageRouter();
    let path = '/pages/' + homePage + '/' + homePage;
    return app.shareAppMessage({
      path: path,
      imageUrl: this.canvasImg
    });
  },
  setDrawImage: function (ctx, src, x, y, w, h, callBack) {
    let _this = this;
    wx.getImageInfo({
      src: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=' + src,
      success: function (res) {
        ctx.drawImage(res.path, x, y, w, h);
        ctx.draw(true);
        callBack && callBack();
      }
    })
  },
})
