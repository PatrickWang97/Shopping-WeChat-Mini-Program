var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    recordParam: {
      rp_id: '',
      page: 1,
      page_size: 10
    },
    recordStatus: {
      isLoading: false,
      isMore: true
    },
    userGarbRecord: [],
    pocketConfig: {},
    ownGrabRecord: {}
  },
  onLoad: function(options){
    let franchisee = options.franchisee || '';
    this.setData({
      'recordParam.rp_id': options.detail || '',
      franchisee: franchisee
    });
    this.getRedPocketRecord();
  },
  getRedPocketRecord: function () {
    let that = this;
    let recordParam = that.data.recordParam;
    if (!recordParam.rp_id || this.data.recordStatus.isLoading || !this.data.recordStatus.isMore) {
      return;
    }
    recordParam.sub_app_id = that.data.franchisee;
    this.setData({'recordStatus.isLoading': true});
    app.sendRequest({
      url: '/index.php?r=AppNews/GetUserRPByPage',
      data: recordParam,
      success: function (res) {
        if (recordParam.page == 1) {
          res.data.config.opened_count = res.count;
          that.setData({
            userGarbRecord: res.data.user_grab_record,
            pocketConfig: res.data.config,
            ownGrabRecord: res.data.my_grab_record
          });
        }else {
          that.setData({
            userGarbRecord: that.data.userGarbRecord.concat(res.data.user_grab_record)
          });
        }
        that.setData({
          'recordParam.page': res.current_page + 1,
          'recordStatus.isLoading': false,
          'recordStatus.isMore': res.is_more ? true : false
        });
      }
    });
  },
  turnToNewsPocketsBalance: function (e) {
    let franchiseeParam = this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : '';
    app.turnToPage('/userCenter/pages/newsPocketsBalance/newsPocketsBalance' + franchiseeParam);
  }
})
