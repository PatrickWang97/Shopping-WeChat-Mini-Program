var Element = require('../../utils/element.js');
var app = getApp();
var suspension = new Element({
  events: {
    suspensionTurnToPage: function (e) {
      this.suspensionTurnToPage(e);
    },
    suspensionScrollPageTop: function(){
      app.pageScrollTo(0);
    }
  },
  methods: {
    init: function(compid, pageInstance, isPullRefresh){
      if(isPullRefresh){
        return;
      }
      this.suspensionBottom(compid, pageInstance);
    },
    suspensionBottom: function(compid, pageInstance) {
      let suspension = pageInstance.data[compid],
          newdata = {},
          margin = suspension.customFeature.margin,
          imgSize = suspension.customFeature['img-size'],
          width = suspension.customFeature.width,
          height = suspension.customFeature.height,
          bottom = suspension.suspension_bottom;
      if (suspension.hasInit){
        return;
      }
      newdata[compid + '.hasInit'] = true;
      if (margin) {
        let b = 0;
        if (/rpx/.test(height)) {
          b = parseFloat(margin);
        } else {
          b = parseFloat(margin) * 2.34;
        }
        newdata[compid + '.suspension_margin'] = b
      }
      if (imgSize) {
        let b = 0;
        if (/rpx/.test(height)) {
          b = parseFloat(imgSize);
        } else {
          b = parseFloat(imgSize) * 2.34;
        }
        newdata[compid + '.suspension_imgSize'] = b
      }
      if (width) {
        let b = 0;
        if (/rpx/.test(height)) {
          b = parseFloat(width);
        } else {
          b = parseFloat(width) * 2.34;
        }
        newdata[compid + '.suspension_width'] = b
      }
      if (height) {
        let b = 0;
        if (/rpx/.test(height)) {
          b = parseFloat(height);
        } else {
          b = parseFloat(height) * 2.34;
        }
        newdata[compid + '.suspension_height'] = b
      }
      if (bottom) {
        let b = 0;
        if (/rpx/.test(bottom)) {
          b = parseFloat(bottom);
        } else {
          b = parseFloat(bottom) * 2.34;
        }
        if (pageInstance.data.has_tabbar == 1) {
          newdata[compid + '.suspension_bottom'] = b - 56 * 2.34;
        } else {
          newdata[compid + '.suspension_bottom'] = b;
        }
      } else {
        newdata[compid + '.suspension_bottom'] = -1;
      }
      let top = suspension.style.match(/top:(-?\d+.?\d*)rpx/);
      if (top && pageInstance.data.page_hasNavBar){
        top = top[1];
        top = +top + app.globalData.topNavBarHeight * 2.34;
        let st = suspension.style.replace(/(top:-?)(\d+.?\d*)rpx/, '$1' + top + 'rpx');
        newdata[compid + '.style'] = st;
      }
      pageInstance.setData(newdata);
    },
    suspensionTurnToPage: function (event) {
      let router = event.currentTarget.dataset.router;
      app.turnToPage(app.pageRoot[router] || '/pages/' + router + '/' + router + '?from=suspension');
    },
  }
});
module.exports = suspension;