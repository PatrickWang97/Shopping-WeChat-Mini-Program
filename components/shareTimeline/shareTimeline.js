var app = getApp();
Component({
  properties: {
  },
  data: {
    show: false, // 进入小程序提示的显隐
  },
  ready: function() {
    let o = new Promise((resolve, reject) => {
      let i = setTimeout(() => {
        this.setData({
          show: true
        }, () => {
          clearTimeout(i)
          resolve();
        })
      }, 2000)
    })
    .then(() => {
      let i = setTimeout(() => {
        this.setData({
          show: false
        }, () => {
          clearTimeout(i)
        })
      }, 5000)
    })
  },
  methods: {
  }
})
