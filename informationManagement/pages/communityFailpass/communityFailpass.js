var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    articleId: '',
    articleInfo: {}
  },
  onLoad: function(options){
    let articleId = options.detail;
    let franchisee = options.franchisee || '';
    this.setData({
      articleId: articleId,
      franchisee: franchisee
    });
    this.getArticleInfo();
  },
  getArticleInfo: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetArticleByPage',
      data: {
        article_id: that.data.articleId,
        only_own_record: 1,
        page: 1,
        page_size: 100,
        sub_app_id: that.data.franchisee
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          let info = res.data[0];
          info.title = unescape(info.title.replace(/\\u/g, "%u"));
          info.content_text = info.content.text.replace(/\n|\\n/g, '\n');
          that.setData({
            articleInfo: info
          });
        }
      }
    });
  },
  turnToDetail: function (event) {
    let id = this.data.articleId;
    app.turnToPage('/informationManagement/pages/communityDetail/communityDetail?detail=' + id + (this.data.franchisee ? ('&franchisee=' + this.data.franchisee) : ''));
  },
})
