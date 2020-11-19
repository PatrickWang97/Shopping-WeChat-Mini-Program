var app = getApp()
Page({
  data: {
    array: ['中国大陆', '中国香港', '中国澳门', '中国台湾', '美国', '加拿大', '日本', '马来西亚', '新加坡', '澳大利亚'],
    nationCode: '86',
    intlCode: '',
    newPhone: '',
  },
  onLoad: function (options) {
  },
  bindPickerChange: function (e) {
    let value = e.detail.value;
    let nationCode;
    let intlCode;
    switch (value) {
      case '0':
        nationCode = '86';
        intlCode = 'CN';
        break;
      case '1':
        nationCode = '852';
        intlCode = 'HK';
        break;
      case '2':
        nationCode = '853';
        intlCode = 'MO';
        break;
      case '3':
        nationCode = '886';
        intlCode = 'TW';
        break;
      case '4':
        nationCode = '1';
        intlCode = 'US';
        break;
      case '5':
        nationCode = '1';
        intlCode = 'CA';
        break;
      case '6':
        nationCode = '81';
        intlCode = 'JP';
        break;
      case '7':
        nationCode = '60';
        intlCode = 'MY';
        break;
      case '8':
        nationCode = '65';
        intlCode = 'SG';
        break;
    }
    this.setData({
      nationCode: nationCode,
      intlCode: intlCode
    })
  },
  inputPhone: function (e) {
    this.setData({
      newPhone: e.detail.value
    })
  },
  next: function(e) {
    let phone = this.data.nationCode === '86' ? this.data.newPhone : (this.data.nationCode + '-' + this.data.newPhone);
    let pages = getCurrentPages();
    let lastPage = pages[pages.length - 2];
    if (!this.data.newPhone) {
      app.showModal({
        content: '请输入手机号',
      })
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppUser/ValidateUserPhone',
      data: {
        phone: phone
      },
      success: function (res) {
        if (res['status'] === 0 && res['data']) {
          lastPage.setData({
            hideVerifyPhone: true,
            hideBindNewPhone: false
          })
          app.turnBack()
        } else {
          app.showModal({
            content: '输入有误，请重新输入',
          })
          return;
        }
      }
    })
  },
})