import Scratch from "../../../utils/scratch.js"
var app = getApp()
Page({
  data:{
    topNavBarData: {
      title: '刮刮乐',
      isDefault: 0,
    },
    isShowBtn:false,//点我刮奖显示与隐藏
    scratchInfo:{},//获取活动信息
    scratchTimes:'',//剩余次数
    scratchId:'',//活动号
    winnerList:[],//获奖名单信息
    isPrizeSick:false,//中奖纪录弹窗显示与隐藏
    isIntel:false,//兑奖次数弹窗显示
    myPrize:[],//中奖记录
    intelMes:{},//兑换信息
    inputValue:'',//兑换次数
    isFail:true,//显示未中奖
    isPrize:true,//显示中奖
    isComfort:true,//显示安慰奖
    hideCanvas:false,
    isDegree:false,
    isDurMax:false,
    scratchPrizeTitle:'',//中奖名称
    animationData : {},
    animationData2: {},
    isScroll : true,//刮刮乐当在 canvas 中移动时且有绑定手势事件时禁止屏幕滚动以及下拉刷新
    isPlay:false,
    isLimit:false,
    time_limit:'',
    isRoll:true,
    scratchStatus:'',
    franchisee: '',
    ifWxCoupon:false,
    timestamp:'',
    signature:'',
    ifGetComfort:false
  },
  onLoad:function(options){
    let that=this;
    let franchisee = options.franchisee || '';
    let systemInfo = app.globalData.systemInfo;
    let width = 558 * systemInfo.windowWidth / 750;
    let height = 258 * systemInfo.windowWidth / 750;
    that.setData({
      franchisee: franchisee,
      shareKey: options.shareKey || ""
    });
    that.scratch = new Scratch(that,{
      canvasWidth: width,
      canvasHeight: height,
      imageResource: app.getSiteBaseUrl()+'/index.php?r=Download/DownloadResourceFromUrl&url=https://chn.jisuapp.cn/zhichi_frontend/static/webapp/images/scratchMovie.png',
      maskColor: "red",
      r: 18,
      callback: () => {
        that.setData({
          hideCanvas:true
        })
        if (that.data.ifWxCoupon) {
          setTimeout(function(){
              that.toAddCard()
          },500)
        }
      },
      imgLoadCallback: () =>{
        setTimeout(function() {
          that.setData({
            isShowBtn: true
          });
        }, 10);
      }
    })
    if (app.isLogin()) {
      that.getScratchData();
    } else {
      app.goLogin({
        success: function () {
          that.getScratchData();
        },
        fail: function(){
          app.turnBack();
        }
      });
    }
    this.animation = wx.createAnimation({
      duration: 0,
      timingFunction: 'step-start'
    });
    this.animation2 = wx.createAnimation({
      duration: 0,
      timingFunction: 'step-start'
    });
  },
  onUnload: function () {
    let that = this;
    clearTimeout(that.timeer);
    clearTimeout(that.timeer2);
    clearTimeout(that.timeer3);
    clearTimeout(that.timeer4);
  },
  getShareKey: function(id) {
    var that = this,
      dataObj = new Object;
    dataObj['activity_id'] = id;
    if (that.data.franchisee) {
      dataObj['sub_app_id'] = that.data.franchisee
    };
    app.sendRequest({
      url: '/index.php?r=appLotteryActivity/getShareKey',
      data: dataObj,
      success: function(res) {
        var data = res;
        if (data.status == 0) {
          that.setData({
            shareKey: data.data
          })
        }
      }
    })
  },
  getTimeByShareKey: function(id, shareKey) {
    var that = this,
      dataObj = new Object;
    dataObj['activity_id'] = id;
    dataObj['share_key'] = shareKey;
    if (that.data.franchisee) {
      dataObj['sub_app_id'] = that.data.franchisee
    };
    app.sendRequest({
      url: '/index.php?r=appLotteryActivity/getTimeByShareKey',
      data: dataObj,
      success: function(res) {}
    })
  },
  startScratch: function() {
    let that = this;
    if (!that.data.scratchId) {
      return;
  }
  if (that.data.time_limit==0){
    that.setData({
      isLimit: true,
      hideCanvas: true,
      isShowBtn: false
    })
  }else{
    if (that.data.scratchTimes<=0){
      if (that.data.scratchInfo.time_share == 0){
        that.setData({
          isDegree: true,
          hideCanvas: true,
          isShowBtn: false
        })
      }else{
        that.setData({
          isDurMax: true,
          hideCanvas: true,
          isShowBtn: false
        })
      }
    }else{
      if (that.scratchLoading) {
        return false;
      }
      that.setData({
        isShowBtn: false
      })
      that.scratchLoading = true;
      that.getLottery();
    }
  }
  },
  getScratchData:function(){
    let that = this,
      dataObj = new Object();
    dataObj['category'] = 3;
    if (that.data.franchisee) {
      dataObj['sub_app_id'] = that.data.franchisee
    };
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getActivity",
      method: "post",
      data: dataObj,
      success: function(res) {
        let mes = res.data;
        mes.description = mes.description.replace(/\\n/g, '\n');
        that.setData({
          scratchInfo: mes,
          scratchTimes: mes.times,
          scratchId:mes.id,
          time_limit: mes.time_limit
        })
        wx.setNavigationBarTitle({
          title: mes.title
        });
        that.audioCtx = wx.createAudioContext('scratchAudio');
        if (mes.bgm != 0) {
          that.audioCtx.play();
        } else {
          that.audioCtx.pause();
        }
        that.getWinnerList(mes.id);
        if (that.data.shareKey) {
          that.getTimeByShareKey(mes.id, that.data.shareKey)
        }
        that.getShareKey(that.data.scratchId);
      }
    })
  },
  scratchLoading:false,
  getLottery:function(){
    let that=this;
    app.sendRequest({
      url:"/index.php?r=appLotteryActivity/lottery",
      method:"post",
      hideLoading:true,
      data:{
        activity_id: that.data.scratchId,
        sub_app_id: that.data.franchisee
      },
      success:function(res){
        let data=res.data,
        newData={};
        that.scratch.start();
        if(data.title=="谢谢参与"){
          newData={};
          newData['isFail']=false;
          newData['scratchTimes'] = data.time;
          newData['time_limit'] = data.time_limit;
          that.setData(newData);
        }else{
          newData={};
          if (data.is_comfort==1){
            newData['isComfort']=false;
          }else{
            newData['isPrize'] = false;
            newData['scratchPrizeTitle'] = data.title;
          }
          let ifWxCoupon = data.card_id || false;
          newData['ifWxCoupon'] = ifWxCoupon;
          newData['timestamp'] = data.timestamp || '';
          newData['signature'] = data.signature || '';
          newData['scratchTimes'] = data.time;
          newData['time_limit'] = data.time_limit;
          that.setData(newData);
          that.getWinnerList(that.data.scratchId)
        }
        that.scratchLoading = false;
      },
      successStatusAbnormal:function(res){
        that.scratchLoading = false;
       if(res.status==1){
         that.setData({
           isShowBtn:true
         })
       }
      }
    })
  },
  getWinnerList: function (id) {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getWinnerList",
      method: "post",
      hideLoading: true,
      data: {
        activity_id: id,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        let winHeight=(res.count + 5)*44;
        that.setData({
          winnerList: res.data
        });
        that.animationTop(winHeight , true);
      }
    })
  },
  animation : '',
  animation2: '',
  animationTop : function( h , isreset){
    var that = this;
    clearTimeout(that.timeer);
    clearTimeout(that.timeer2);
    if(isreset){
      that.animation.top('190rpx').step({ duration: 0, timingFunction: 'step-start'});
      that.animation2.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
      that.setData({
        animationData: that.animation.export(),
        animationData2: that.animation2.export()
      });
      setTimeout(function(){
        that.animation.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
        that.setData({
          animationData: that.animation.export()
        });
        that.animationTopCopy(h, isreset);
      }, 50)
    }else{
      that.timeer = setTimeout(function(){
        that.animation.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
        that.setData({
          animationData: that.animation.export()
        });
      }, 200 / (h + 200) * 15000);
      that.timeer2 = setTimeout(function(){
        that.animation.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
        that.setData({
          animationData: that.animation.export()
        })
        that.animationTopCopy(h);
      }, h / (h + 200) * 15000 );
    }
  },
  animationTopCopy: function (h, isreset) {
    var that = this;
    clearTimeout(that.timeer3);
    clearTimeout(that.timeer4);
    if (!isreset){
      that.timeer3 = setTimeout(function () {
        that.animation2.top('190rpx').step({ duration: 0, timingFunction: 'step-start' });
        that.setData({
          animationData2: that.animation2.export()
        });
      }, 200 / (h + 200) * 15000);
    }
    that.timeer4  = setTimeout(function () {
      that.animation2.top('-' + h + 'rpx').step({ duration: 15000, timingFunction: 'linear' });
      that.setData({
        animationData2: that.animation2.export()
      });
      that.animationTop(h);
    }, h / (h + 200) * 15000);
  },
  playMusics: function () {
    if (this.data.scratchInfo.bgm){
      if (this.data.isPlay) {
        this.audioCtx.pause();
      } else {
        this.audioCtx.play();
      }
    }else{
      app.showToast({
        title: '活动未开始，没有音乐',
        icon: 'none'
      })
    }
  },
  audioPlay: function () {
    this.setData({
      isPlay: true
    });
  },
  audioPause: function () {
    this.setData({
      isPlay: false
    });
  },
  lookPrize:function(){
    let that=this;
    if (that.data.scratchId){
      that.setData({
        isPrizeSick: true,
        hideCanvas: true,
        isShowBtn: false,
        isRoll: false
      })
      that.getMyPrize();
    }
  },
  wrapPrize:function(){
    var that = this;
    this.scratch.reset();
    this.setData({
      isPrizeSick: false,
      hideCanvas:false,
      isRoll:true
    });
    setTimeout(function(){
      that.setData({
        isShowBtn: true
      });
    }, 100);
  },
  stopPropagation() {
  },
  intelClick:function(){
    if (this.data.scratchId){
      this.setData({
         isIntel: true,
        hideCanvas: true,
        isShowBtn: false
      })
      this.getMyIntegral();
    }
  },
  intelClose:function(){
    var that = this;
    this.scratch.reset();
    this.setData({
      isIntel: false,
      hideCanvas: false,
      isFail: true,//显示未中奖
      isPrize: true,//显示中奖
      isComfort: true,//显示安慰奖
    });
    setTimeout(function () {
      that.setData({
        isShowBtn: true
      });
    }, 50);
  },
  failBtnClick:function(){
    let that=this;
    that.scratch.reset();
    that.setData({
      hideCanvas:false,
      isFail:true
    });
    setTimeout(function () {
      that.setData({
        isShowBtn: true
      });
    }, 100);
  },
  winningBtnClick:function(){
    let that=this;
    that.scratch.reset();
    that.setData({
      hideCanvas: false,
      isPrize: true
    });
    setTimeout(function () {
      that.setData({
        isShowBtn: true
      });
    }, 100);
  },
  comfortBtnClick:function(){
    let that=this;
    that.scratch.reset();
    that.setData({
      hideCanvas: false,
      isComfort: true,
      ifGetComfort:false
    });
    setTimeout(function () {
      that.setData({
        isShowBtn: true
      });
    }, 100);
  },
  bindReplaceInput: function (e) {
    this.setData({
      inputValue: e.detail.value
    })
  },
  intelConfirm:function(){
    let that=this;
    if (that.data.scratchId){
      that.getIntegralTime();
    }
  },
  scratchInteAll:function(){
    let that=this;
    that.setData({
      inputValue: that.data.intelMes.exchange_times
    })
  },
  getMyPrize: function () {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getMyPrize",
      method: "post",
      hideLoading:true,
      data: {
        activity_id: that.data.scratchId,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        that.setData({
          myPrize: res.data
        })
      }
    })
  },
  getMyIntegral: function () {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getMyIntegralExchangeTimes",
      method: "post",
      data: {
        activity_id: that.data.scratchId,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        that.setData({
          intelMes: res.data
        })
      }
    })
  },
  getIntegralTime: function () {
    let that = this;
    app.sendRequest({
      url: "/index.php?r=appLotteryActivity/getTime",
      method: "post",
      data: {
        activity_id: that.data.scratchId,
        type: "integral",
        times: that.data.inputValue,
        sub_app_id: that.data.franchisee
      },
      success: function (res) {
        that.scratch.reset();
        that.setData({
          scratchTimes: res.data,
          isIntel: false,
          inputValue: '',
          hideCanvas: false,
          isDurMax: false,
          isDegree: false,
        })
        setTimeout(function () {
          that.setData({
            isShowBtn: true
          });
        }, 200);
      }
    })
  },
  onShareAppMessage: function(res) {
    var that = this;
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    return app.shareAppMessage({
      title: that.data.scratchInfo.title,
      path: '/awardManagement/pages/scratch/scratch?id=' + that.data.scratchId + '&shareKey=' + that.data.shareKey + franchiseeParam,
      success: function(res) {
      },
      fail: function (res) {
      }
    })
  },
  touchStart: function(){
  },
  touchEnd: function(){
  },
  touchMove: function(){
  },
  imgOnLoad: function(){
  },
  toAddCard:function(){
    let _data = this.data,wxcouponId = _data.ifWxCoupon,_this = this;
    wx.addCard({
        cardList: [
            {
                cardId: wxcouponId,
                cardExt: '{"nonce_str":"' + _data.timestamp + '","timestamp":"' + _data.timestamp + '", "signature":"' + _data.signature + '"}'
            }
        ],
        success: function (res) {
            _this.setData({
                ifWxCoupon:false
            });
            app.sendRequest({
                url: '/index.php?r=appLotteryActivity/recvWeChatCoupon',
                data: {
                    card_id: res.cardList[0].cardId,
                    sub_app_id:_data.franchisee,
                    activity_id:_data.scratchInfo.id,
                    app_id:_data.scratchInfo.app_id
                },
                success: function (res) {
                    app.showModal({
                        title:'提示',
                        content: '领取卡券成功',
                        showCancel : false
                    });
                    _this.setData({
                        ifGetComfort:true
                    })
                    _this.getWinnerList(_this.data.scratchId);
                }
            });
        }
    })
  },
  shadeClose:function(el){
      let _this = this,
          type = el.currentTarget.dataset.type;
      app.showModal({
          title:'提示',
          content:'微信优惠券不领取到卡包，下次就不能再领取了哦，确定放弃优惠么？',
          showCancel:true,
          confirm:function(res){
              _this.setData({
                  ifWxCoupon:false,
                  ifGetComfort:false
              });
              if(type == 1){
                  _this.winningBtnClick();
              }else if(type == 2){
                  _this.comfortBtnClick()
              }
          }
      })
  }
})