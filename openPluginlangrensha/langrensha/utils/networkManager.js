var app = getApp()
module.exports = {
  getCurrentUser: getCurrentUser,
  login: login,
  openSet: openSet,
  insertRoom: insertRoom,//点击开始发牌的时候调用,参数有userNum和身份数组array
  getIdentity: getIdentity//参数是roomid,传递success方法，返回a={"identity":i,"roomNum":roomNum,"roomId":roomId,"userNum":userNum,"gameUserNum":gameUserNum}，分别是身份0-12，其中12为上帝，房间号，房间id,总人数m，已发牌人数
}
var Parse = require("parse.js");
var Util = require("util.js");
Parse.initialize("langrenshuo123456")
Parse.serverURL = app.globalData.siteBaseUrl +'/langrensha/parse';
var Room = Parse.Object.extend("Room")
var UserInfo = Parse.Object.extend("UserInfo")
var currentUser = wx.getStorageSync('newCurrentUser');
var userInfo
var openid
var versionNum=wx.getStorageSync('versionNum');
function queryBasic(className, handler, success) {
  var query = new Parse.Query(className)
  query = handler(query)
  query.find().then(function (results) {
    success(results)
  }, function (error) {
    console.log("error" + error.message)
  })
}
function saveBasic(id, className, handler, success) {
  var basic
  if (id == null) {
    basic = new className()
  } else {
    basic = className.createWithoutData(id)
  }
  handler(basic)
  basic.save().then(function (result) {
    success(result)
  })
}
function getIdentity(roomId, success) {
  login(function () {
    queryBasic(Room, function (query) {
      query.equalTo("objectId", roomId)
      return query
    }, function (results) {
      if (results.length != 0) {
        console.log("查询到具体房间")
        var gameUserList = results[0].get("gameUserList")
        var identityList = results[0].get("identity")
        var roomNum = results[0].get("roomNum")
        var owner = results[0].get("owner")
        var userNum = results[0].get("userNum")
        var flag = false
        var result = 0
        var gameUserNum = 0;
        if (owner == currentUser.openid) {
          flag = true
          for (var i = 0; i < gameUserList.length; i++) {
            if (gameUserList[i] != null) {
              gameUserNum++
            }
          }
          var nameList = new Array(gameUserList.length)
          var avatarList = new Array(gameUserList.length)
          setName(avatarList, nameList, gameUserList, 0, function () {
            var a = { "identity": 12, "roomNum": roomNum, "userNum": userNum, "gameUserNum": gameUserNum, "identityList": identityList, "gameUserList": gameUserList, "nameList": nameList, "avatarList": avatarList }
            success(a)
          })
        } else {
          for (var i = 0; i < gameUserList.length; i++) {
            if (gameUserList[i] == currentUser.openid) {
              flag = true
              result = i;
            }
          }
          if (!flag) {
            var j = 0;
            for (var i = 0; i < gameUserList.length; i++) {
              if (gameUserList[i] == null) {
                j++
              }
            }
            if (j == 0) {
              success(null)
              return
            }
            var num = randomNum(0, j)
            var temp = 0
            for (var i = 0; i < gameUserList.length; i++) {
              if (gameUserList[i] == null) {
                if (temp == num) {
                  result = i
                }
                temp++
              }
            }
            gameUserList[result] = currentUser.openid
            saveBasic(results[0].id, Room, function (obj) {
              obj.set("gameUserList", gameUserList)
            }, function (res) {
              console.log("res:", res)
            })
          }
          var index = 0
          for (var i = 0; i < 11; i++) {
            index = index + identityList[i]
            if (index > result) {
              for (var j = 0; j < gameUserList.length; j++) {
                if (gameUserList[j] != null) {
                  gameUserNum++
                }
              }
              var nameList = new Array(gameUserList.length)
              var avatarList = new Array(gameUserList.length)
              setName(avatarList, nameList, gameUserList, 0, function () {
                var a = { "identity": i, "roomNum": roomNum, "userNum": userNum, "gameUserNum": gameUserNum, "identityList": identityList, "gameUserList": gameUserList, "nameList": nameList, "avatarList": avatarList }
                success(a)
              })
              break;
            } else if (i == 10) {
              var nameList = new Array(gameUserList.length)
              var avatarList = new Array(gameUserList.length)
              setName(avatarList, nameList, gameUserList, 0, function () {
                var a = { "identity": i, "roomNum": roomNum, "userNum": userNum, "gameUserNum": gameUserNum, "identityList": identityList, "gameUserList": gameUserList, "nameList": nameList, "avatarList": avatarList }
                success(a)
              })
              break;
            }
          }
        }
      }
      console.log("results", gameUserList)
    })
  })
}
function initialRoom(userNum, success) {
  login(function () {
    room.init(userNum)
    success(room)
  })
}
function addIdentity(index, success, error) {
  login(function () {
    room.add(index, success, error)
  })
}
function insertRoom(userNum, array, success) {
  login(function (user) {
    console.log("begin to insert Room")
    room.init(userNum)
    room.identity = array
    var roomNum = randomNum(1000, 10000)
    saveBasic(null, Room, function (obj) {
      obj.set("userNum", room.userNum)
      obj.set("identity", room.identity)
      obj.set("gameUserList", room.gameUserList)
      obj.set("roomNum", roomNum)
      obj.set("owner", currentUser.openid)
      obj.set("userNum", room.userNum)
    }, function (result) {
      success(result)
    })
  })
}
var room = {
  userNum: 6,
  identity: new Array(12),
  gameUserList: [],
  init: function (userNum) {
    this.userNum = userNum
    this.identity[1] = Math.floor(userNum / 3)  //狼人的人数
    this.identity[0] = userNum - Math.floor(userNum / 3) - 3  //平民的人数
    this.identity[2] = 1 //女巫的人数
    this.identity[3] = 1 //预言家的人数
    this.identity[4] = 1 //猎人的人数
    for (var i = 5; i < 12; i++) {
      this.identity[i] = 0  //后面的身份的人数
    }
    this.gameUserList = new Array(userNum);
  },
  add: function (index, success, error) {
    if (index == 0) {
      if (this.identity[1] == 1) {
        error(room)
      } else {
        this.identity[0] = this.identity[0] + 1
        this.identity[1] = this.identity[1] - 1
        success(room)
      }
    }
    else if (index == 1) {
      if (this.identity[0] == 1) {
        error(room)
      } else {
        this.identity[1] = this.identity[1] + 1
        this.identity[0] = this.identity[0] - 1
        success(room)
      }
    }
    else {
      if (this.identity[index] == 1) {
        this.identity[index] = 0
        this.identity[0]++
        success(room)
      } else {
        if (this.identity[0] == 1) {
          error(room)
        } else {
          this.identity[index] = 1
          this.identity[0]--
          success(room)
        }
      }
    }
  }
}
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
      break;
    case 2:
      return parseInt(Math.random() * (maxNum - minNum) + minNum, 10);
      break;
    default:
      return 0;
      break;
  }
}
function openSet(handler) {
  wx.openSetting({
    success: function (data) {
      console.log("data:", data)
      if (data.authSetting["scope.userInfo"] == true) {
        console.log("重新获取用户授权")
        handler()
        login(function () {
          console.log("success to login")
        })
      }
    }
  })
}
function login(handler) {
 var result=app.isLogin();
  versionNum = wx.getStorageSync('versionNum');
 if(!result||versionNum!=1){
   app.goLogin({
     success: function (res) {
       var a = app.getUserInfo()
       userInfo = {
         "userName": a.nickname,
         "openid": a.weixin_id,
         "avatar": a.cover_thumb,
         "appId":a.app_id
       }
       console.log("my userInfo:",userInfo)
       if (!currentUser || versionNum != 1) {
         saveBasic(null, UserInfo, function (obj) {
           obj.set("userName", userInfo.userName)
           obj.set("openid", userInfo.appId+userInfo.openid)
           obj.set("avatar", userInfo.avatar)
           obj.set("versionNum", 1)
         }, function (result) {
           wx.setStorageSync("newCurrentUser", result)
           currentUser = wx.getStorageSync("newCurrentUser")
           console.log("currentUser", currentUser)
           wx.setStorageSync('versionNum', 1)
           handler(currentUser)
         })
       } else {
         console.log("userInfo", currentUser)
         handler(currentUser)
       }
     }
   });
 }else{
   currentUser=wx.getStorageSync("newCurrentUser")
   handler(currentUser)
 }
}
function setName(avatarList, nameList, userList, len, success) {
  if (len < userList.length) {
    queryBasic(UserInfo, function (query) {
      query.equalTo("openid", userList[len])
      return query
    }, function (res) {
      if (res.length == 0 || userList[len] == null) {
        nameList[len] = "name"
        avatarList[len] = "http://cdn.jisuapp.cn/static/plugin/images/langrensha/wenhao.png"
      } else {
        nameList[len] = res[0].get("userName")
        avatarList[len] = res[0].get("avatar")
      }
      len++
      setName(avatarList, nameList, userList, len, success)
    })
  } else {
    success()
  }
}
function getCurrentUser(){
  return currentUser;
}
