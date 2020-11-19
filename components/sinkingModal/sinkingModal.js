const app = getApp();
Component({
  properties: {
    sinkingModalData: {
      type: Object,
      value: {
        showModal: false,
        isSinking: false,
        pushContent: '',
        eventParams: {}
      }
    }
  },
  data: {
    sinkingModalData: {
      showModal: false, // 是否显示弹窗
      isSinking: false, // 是否下沉动画
      pushContent: '',  // 推送内容
      eventParams: {}   // 点击事件
    },
  },
  ready: function () {
    this.getUserSetNoticesList();
  },
  methods: {
    getUserSetNoticesList: function () {
      let that = this;
      let newData = {};
      app.sendRequest({
        url: '/index.php?r=EventMessage/GetEventNoticeList',
        hideLoading: true,
        success: function (res) {
          let noticesData = res.data;
          let isEmpty = !noticesData || JSON.stringify(noticesData) === '[]' || JSON.stringify(noticesData) === '{}';
          if (isEmpty) {
            return false;
          }
          newData['sinkingModalData.id'] = res.id;
          let eventParams = noticesData.page_url;
          eventParams = typeof eventParams === 'string' ? JSON.parse(eventParams) : eventParams;
          newData['sinkingModalData.eventParams'] = eventParams;
          newData['sinkingModalData.showModal'] = true;
          newData['sinkingModalData.isSinking'] = true;
          newData['sinkingModalData.pushContent'] = noticesData.content || '';
          that.setData(newData);
          setTimeout(function () {
            that.setData({
              'sinkingModalData.isSinking': false,
            });
          }, 3000);
        },
        fail: function (res) {
          console.log(res);
        }
      });
    },
    tapEventCommonHandler: function(e) {
      let id = this.data.sinkingModalData.id || '';
      app.sendRequest({
        url: '/index.php?r=EventMessage/SetMsgReadById',
        hideLoading: true,
        data: {
          'msg_id': id
        },
        success: function () {
          let { eventParams } = e.currentTarget.dataset;
            if (eventParams && eventParams.action && eventParams.action != 'none') {
              app.tapEventCommonHandler(e);
            }
        }
      });
    }
  }
})
