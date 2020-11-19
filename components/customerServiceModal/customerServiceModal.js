const app = getApp();
Component({
  properties: {
  },
  data: {
    hideModal: true,
    btnText: '添加专属客服',  // 按钮文案
    pagePath: '', // 小程序卡片的路径
    replyContent: '', // 回复内容
    replyType: '', // 回复类型
    sessionFrom: '',
  },
  methods: {
    showDialog: function (params) {
      let { replyType, replyContent, btnText } = params;
      const homePath = app.getHomepageRouter();
      const pageInstance = app.getAppCurrentPage();
      let pagePath = '';
      let sessionFrom = pageInstance.franchiseeId || pageInstance.data.franchiseeId || app.globalData.chainAppId || '1';
      if (replyType && replyContent && replyContent._id) {
        pagePath = `/pages/${homePath}/${homePath}?type=${replyType}&id=${replyContent._id}`;
      } else { // 没有设置回复内容
        pagePath = `/pages/${homePath}/${homePath}`;
      }
      if (!btnText) {
        const btnStr = {
          1: '获取客服微信',
          2: '获取群聊二维码',
          3: '获取活动海报',
          4: '获取个人微信',
          5: '获取链接',
          6: '获取企业微信',
        };
        btnText = btnStr[replyType];
      }
      this.setData({
        hideModal: false,
        pagePath: pagePath,
        btnText: btnText,
        replyType: replyType,
        sessionFrom: sessionFrom,
      });
    },
    closeDialog: function() {
      this.setData({
        hideModal: true,
      });
    }
  }
})
