var app = '';
setTimeout(function(){
  app = getApp();
}, 100);
function formatTime(date) {
  if(!date){
    date = new Date();
  }
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds();
  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}
function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}
function formatTimeYMD(date, fmt) {
  if (!date) {
    date = new Date();
  }else if(/^\d+$/.test(date)){
    date = new Date(date * 1000);
  }else if(typeof date === 'string'){
    date = new Date(date.replace(/\-/g, '/'));
  }else{
    date = date;
  }
  fmt = fmt || 'YYYY-MM-DD hh:mm:ss'
  var time = {
    "M+": date.getMonth() + 1, //月份 
    "D+": date.getDate(), //日 
    "h+": date.getHours(), //小时 
    "m+": date.getMinutes(), //分 
    "s+": date.getSeconds(), //秒
  };
  if (/(Y+)/.test(fmt)){
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (var k in time){
    if (new RegExp("(" + k + ")").test(fmt)){
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (time[k]) : (("00" + time[k]).substr(("" + time[k]).length)));
    }
  }
  return fmt;
}
function formatDistance(distance) {
  if (!distance){
    return 0;
  }
  distance = +distance;
  return distance < 1000 ? Math.round(distance) + 'm' : (distance/1000).toFixed(1) + 'km';
}
function isPlainObject(obj) {
  for (let name in obj) {
    return false;
  }
  return true;
}
function isPhoneNumber(num) {
  return /^\d{11}$/.test(num);
}
function getCurrentPageUrl() {
  var pages = getCurrentPages();
  var currentPage = pages[pages.length - 1];
  var url = currentPage.route;
  return url;
}
function getCurrentPageUrlWithArgs() {
  var pages = getCurrentPages();
  var currentPage = pages[pages.length - 1];
  var url = currentPage.route;
  var options = currentPage.options;
  var urlWithArgs = url + '?';
  for (var key in options) {
    var value = options[key];
    urlWithArgs += key + '=' + value + '&';
  }
  urlWithArgs = urlWithArgs.substring(0, urlWithArgs.length - 1);
  return urlWithArgs;
}
function getCurrentPageArgs(){
  var pages = getCurrentPages();
  var currentPage = pages[pages.length - 1];
  var options = currentPage.options;
  var args = '';
  for (var key in options) {
    var value = options[key];
    args += key + '=' + value + '&';
  }
  args = args.substring(0, args.length - 1);
  return args;
}
function getGoodsTypeByForm(form) {
  switch (form) {
    case 'goods':
    case 'community_group':
      return 0;
    case 'appointment':
      return 1;
    case 'waimai':
      return 2;
    case 'tostore':
      return 3;
    case 'new_appointment':
      return 10;
    default:
      return 0;
  }
}
function getFormByGoodsType(gt) {
  var type = +gt || 0;
  switch (type) {
    case 0:
      return 'goods';
    case 1:
      return 'appointment';
    case 2:
      return 'waimai';
    case 3:
      return 'tostore';
    case 10:
      return 'new_appointment';
    default:
      return 'goods';
  }
}
function __each(arr, func) {
  var res = [];
  for (var k in arr) {
    res.push(func.call(this, arr[k], k));
  }
  return res;
}
function __filter(arr, func) {
  var res = [];
  __each(arr, function (v) {
    if (func(v)) {
      res.push(v);
    }
  })
  return res;
}
function __reduce(arr, func, init) {
  var res = init;
  var self = this;
  if (res === undefined) {
    res = arr[0];
    arr = arr.slice(1);
  }
  __each(arr, function (v, k) {
    res = func.call(self, res, v, k, arr);
  })
  return res;
}
function createAttrArr(attrStr) {
  var attrArr = attrStr.split(/[.\[\]]/) || [],
    func = function (v) {
      return v;
    },
    func2 = function (v) {
      return /^\d+$/.test(v) ? +v : v;
    };
  return __each(__filter(attrArr, func), func2);
}
function getValueByAttrStr(obj, attrStr) {
  var func = function (o, k) {
    return o && o[k];
  }
  return __reduce(createAttrArr(attrStr), func, obj);
}
function showFullUrl(url) {
  if (!url) {
    return;
  }
  let patteUrl = /(http|https):\/\/([\w.]+\/?)\S*/;
  if (patteUrl.test(url)) {
    return url;
  } else {
    return app.globalData.siteBaseUrl + url;
  }
}
module.exports = {
  formatTime: formatTime,
  formatTimeYMD: formatTimeYMD,
  formatNumber:formatNumber,
  isPlainObject: isPlainObject,
  isPhoneNumber: isPhoneNumber,
  formatDistance: formatDistance,
  getCurrentPageUrl: getCurrentPageUrl,
  getCurrentPageUrlWithArgs: getCurrentPageUrlWithArgs,
  getCurrentPageArgs: getCurrentPageArgs,
  getGoodsTypeByForm: getGoodsTypeByForm,
  getFormByGoodsType: getFormByGoodsType,
  getValueByAttrStr: getValueByAttrStr,
  showFullUrl: showFullUrl
}
