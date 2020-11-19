var app = getApp();
Page({
  data: {
  },
  onLoad: function (options) {
    let param = [];
    for(let i in options){
      param.push(i + '=' + options[i]);
    }
    app.globalData.turnToPageFlag = false;
    app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?' + param.join('&'), true);
  }
})
