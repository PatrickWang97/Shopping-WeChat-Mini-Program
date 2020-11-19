var Element = require('../../utils/element.js');
var app = getApp();
var carousel = new Element({
  events: {
    getCarouselData: function(e) {
      let compid = e.currentTarget.dataset.compid;
      this._initialCarouselData('', compid );
    },
    carouselVideoClose: function(e) {
      this.carouselVideoClose(e);
    },
    carouselVideoFullscreen: function(e){
      this.carouselVideoFullscreen(e);
    }
  },
  methods: {
    init: function(compid, pageInstance){
      let customFeature = pageInstance.data[compid].customFeature;
      let dataObjectForm = customFeature.dataObjectForm; //是否是数据绑定的轮播组
      let carouselgroupId = customFeature.carouselgroupId;
      dataObjectForm && this._initialCarouselData(pageInstance, compid, carouselgroupId);
    },
    detailPageInit: function(compid, pageInstance){
      let segment = pageInstance.data[compid].customFeature.segment;
      let detail_data = pageInstance.data.detail_data;
      let carouselgroupId = segment && detail_data && detail_data[segment] ? detail_data[segment][0].text : '';
      carouselgroupId && this._initialCarouselData(pageInstance, compid, carouselgroupId);
    },
    _initialCarouselData: function(pageInstance, compid, carouselgroupId){
      pageInstance = pageInstance || app.getAppCurrentPage();
      let newdata = {};
      newdata[compid + '.loading'] = true;
      newdata[compid + '.loadingFail'] = false;
      pageInstance.setData(newdata);
      let groupId = carouselgroupId;
      if (!groupId){
        groupId = pageInstance.data[compid].customFeature.carouselgroupId;
      }
      let url = '/index.php?r=AppExtensionInfo/carouselPhotoProjiect';
      app.sendRequest({
        hideLoading: true,
        url: url,
        data: {
          type: groupId
        },
        method: 'post',
        chain: true,
        subshop: pageInstance.franchiseeId || '',
        success: function (res) {
          let newdata = {};
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = false;
          if (res.data.length) {
            let content = [];
            for (let j in res.data) {
              let form_data = JSON.parse(res.data[j].form_data);
              if (form_data.isShow == 1) {
                let customFeature = {};
                customFeature = form_data;
                customFeature.compid = compid;
                content.push({
                  "customFeature": customFeature,
                  'pic': form_data.pic
                })
              }
            }
            newdata[compid+'.content'] = content;
          }
          pageInstance.setData(newdata);
        },
        fail: function(){
          let newdata = {};
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = true;
          pageInstance.setData(newdata);
        }
      });
    },
    carouselVideoClose:function(event){
      let pageInstance = app.getAppCurrentPage(),
          compid = event.currentTarget.dataset.compid ;
      let newdata = {};
      newdata[compid + '.videoUrl'] = '';
      pageInstance.setData(newdata);
    },
    carouselVideoFullscreen: function (event) {
      let isFullScreen = event.detail.fullScreen;
      let pageInstance = app.getAppCurrentPage();
      if (pageInstance.data.page_hasNavBar) {
        pageInstance.setData({
          'custom_top_nav1.customFeature.isDefault': isFullScreen ? 0 : 1
        })
      }
    }
  }
})
module.exports = carousel;