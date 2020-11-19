const util = require("../../utils/util.js");
Component({
  properties: {
    showWriteOffCodeBox: {
      type: Boolean,
      value: false,
    },
    codeStatus: {
      type: Number,
      value: 0,
    },
    codeImgUrl: {
      type: String,
      value: "",
    },
    codeNum: {
      type: null,
      value: "",
    },
    verifiTimeInterval: {
      type: Object,
      value: {},
    },
  },
  data: {
    showWriteOffCodeBox: false,
    codeImgFullUrl: "", // 核销码完整url
  },
  observers: {
    'codeImgUrl': function (val) {
      if (!val) return;
      this.setData({
        codeImgFullUrl: util.showFullUrl(val)
      })
    },
  },
  methods: {
    hideWriteOffCodeBox: function () {
      this.setData({
        showWriteOffCodeBox: false,
      });
      if (this.verifiTimeInterval) {
        clearInterval(this.verifiTimeInterval);
      }
      wx.closeSocket();
    },
  },
});
