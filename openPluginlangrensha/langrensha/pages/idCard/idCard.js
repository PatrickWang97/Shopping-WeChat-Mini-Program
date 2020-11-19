let n = require('../../utils/networkManager.js')
let roomId = '';
var interval=0
Page({
  data: {
    room:{identity:13},
    cardList: ['平民', '狼人', '女巫', '预言家', '猎人', '丘比特', '守卫', '白痴', '盗贼', '长老', '野孩子', '野熊','上帝','--'],
    countList: [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,0],
    playerCount:4,
    roomId:'',
    myIdIndex:0,
    hide:true,
    tapped:true,
    userList:[],
    opacity:[],
    hiddenLoading:false,
    open:false,
    openFlag:false,
    avatarList:[],
    out_display:[],
    gray:[],
    box:[],
    height:500,
    owner:false,
    imgBaseUrl: 'http://cdn.jisuapp.cn/static/plugin/images/langrensha/',
    login:false
  },
  onLoad: function (options) {
    var that=this
    var user = n.getCurrentUser();
    if (user && user!='null'&&user!=null&&user!=undefined){
      that.setData({
        login:true
      })
    }else{
      that.setData({
        login: false
      })
    }
    wx.setNavigationBarTitle({
      title: '即速狼人杀',
    })
    roomId = options.roomId;
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          height: res.screenHeight * 750 / res.windowWidth - 435
        })
      }
    })
    if (that.data.login){
     that.firstFresh()
     interval = setInterval(function () {
       that.refresh()
     }, 5000);
   }
  },
  onReady: function () {
  },
  onShow: function () {
  },
  onHide: function () {
  console.log("hide")
  },
  onUnload: function () {
 console.log("unload")
 clearInterval(interval)
  },
  onPullDownRefresh: function () {
  },
  onReachBottom: function () {
  },
  onGotUserInfo: function () {
  },
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      console.log(res.target)
    }
    return {
      title: '极速狼人杀',
      path: '/openPlugin/langrensha/pages/idCard/idCard?roomId='+roomId,
      imageUrl: 'http://cdn.jisuapp.cn/static/plugin/images/langrensha/animal/1.png',
      success: function (res) {
      },
      fail: function (res) {
      }
    }
  },
  openGame:function(e){
    var that=this
    that.setData({
open:false
    })
  },
  toRoomPage: function() {
    var that = this
    that.setData({
      login: true
    })
    that.firstFresh();
    interval = setInterval(function () {
      that.refresh()
    }, 5000);
  },
  changOpacity:function(e){
    if (this.data.opacity[e.currentTarget.id]=='animal'){
      var array=new Array()
      array=this.data.opacity
      array[e.currentTarget.id] = 'animalBlack'
      var array1=new Array()
      array1=this.data.out_display
      array1[e.currentTarget.id]=""
      var array2 = new Array()
      array2 = this.data.box
      array2[e.currentTarget.id] = "box_gray"
      var array3 = new Array()
      array3 = this.data.gray
      array3[e.currentTarget.id] = 0.5
      this.setData({
        opacity:array,
        out_display:array1,
        box:array2,
        gray:array3
      })
    }else{
      var array = new Array()
      array = this.data.opacity
      var array1 = new Array()
      array1 = this.data.out_display
      array1[e.currentTarget.id] = "none"
      var array2 = new Array()
      array2 = this.data.box
      array2[e.currentTarget.id] = "box"
      array[e.currentTarget.id] ='animal'
      var array3 = new Array()
      array3 = this.data.gray
      array3[e.currentTarget.id] = 1
      this.setData({
        opacity: array,
        out_display:array1,
        box:array2,
        gray:array3
      })
    }
  },
  hideIdentity:function(){
    if (this.data.room.identity==12){
      var that=this
      that.refresh()
      if (this.data.tapped) {
        this.setData({
          tapped: false
        })
      } else {
        this.setData({
          tapped: true
        })
      }
    }else{
      if (this.data.hide) {
        this.setData({
          hide: false
        })
      } else {
        this.setData({
          hide: true
        })
      }
    }
  },
  backToIndex:function(){
    wx.showModal({
      title: '极速狼人杀',
      content: '确定重新发牌吗',
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定')
          wx.redirectTo({
            url: '../index/index',
          }) 
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  firstFresh:function(){
    var that = this
    n.getIdentity(roomId, function (res) {
      if (res == null) {
        wx.showModal({
          title: '极速狼人杀',
          content: '当前房间已满',
          showCancel: false,
          success: function (res) {
            wx.navigateTo({
              url: '../index/index',
            })
          }
        })
      }
      var array = new Array()
      var opacity = new Array()
      var out_display = new Array()
      var box = new Array()
      var gray = new Array()
      var temp = 0
      for (var i = 0; i < res.identityList.length; i++) {
        for (var j = 0; j < res.identityList[i]; j++) {
          if (res.identity != 12) {
            that.setData({
              owner: true
            })
          }
          if (res.userNum == res.gameUserNum) {
            that.setData({
              open: true
            })
            clearInterval(interval)
          }
          var a = {
            index: i,
            name: res.nameList[temp],
            avatar: res.avatarList[temp]
          }
          array.push(a)
          opacity.push("animal")
          out_display.push("none")
          box.push("box")
          gray.push(1)
          temp++
        }
      }
      if (that.data.opacity.length == 0) {
        that.setData({
          opacity: opacity,
          out_display: out_display,
          box: box,
          gray: gray
        })
      }
      that.setData({
        room: res,
        userList: array,
        hiddenLoading: true
      })
    });
  },
  refresh:function(){
    var that=this
    n.getIdentity(roomId, function (res) {
      var array=new Array()
      var opacity=new Array()
      var out_display=new Array()
      var box=new Array()
      var gray=new Array()
      var temp=0
      for (var i = 0; i < res.identityList.length;i++){
        for (var j = 0; j < res.identityList[i];j++){
          if(res.identity!=12){
            that.setData({
              owner:true
            })
          }
          if(res.userNum==res.gameUserNum){
            that.setData({
              open:true
            })
            clearInterval(interval)
          }
          var a={
            index:i,
            name:res.nameList[temp],
            avatar:res.avatarList[temp]
          }
          array.push(a)
          opacity.push("animal")
          out_display.push("none")
          box.push("box")
          gray.push(1)
          temp++
        }
      }
      if(that.data.opacity.length==0){
       that.setData({
         opacity:opacity,
         out_display:out_display,
         box:box,
         gray:gray
       })
      }
      that.setData({
        room: res,
        userList:array,
        hiddenLoading:true
      })
    });
  },
  onPullDownRefresh: function () {
    this.refresh();
    wx.stopPullDownRefresh()
  },
})