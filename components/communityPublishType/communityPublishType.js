var app = getApp()
Component({
  properties: {
    communityPublishType: {
      type: Object,
      value: {
        show: false,
        communityPublish: {}
      }
    }
  },
  data: {
    communityPublishType: {
      show: false,
      communityPublish: {}
    }
  },
  methods: {
    turnToCommunityPublish: function (e) {
      e.currentTarget.dataset = Object.assign({},e.currentTarget.dataset, this.data.communityPublishType.communityPublish);
      app.turnToCommunityPublish(e);
    },
    returnBack: function (e) {
      this.setData({
        'communityPublishType.show': false
      });
    }
  }
})