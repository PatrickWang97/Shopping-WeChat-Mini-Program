const app = getApp();
Page({
  data: {
    focus: true,
    name: '',         // 联系人性名
    phone: '',        // 联系人手机号
    isDefault: false, // 默认联系人
  },
  onLoad: function (options) {
    this.getAppECStoreConfig();
    if (options.id) {
      this.setData({
        id: options.id,
      });
      app.setPageTitle('编辑联系人');
      this.getContactInfo();
    } else {
      app.setPageTitle('新建联系人');
    }
  },
  getContactInfo: function () {
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetContactByPage',
      data: {
        id: this.data.id
      },
      success: (res) => {
        let contactInfo = res.data && res.data[0];
        if(contactInfo) {
          this.setData({
            name: contactInfo.name,
            phone: contactInfo.phone,
            isDefault: contactInfo.is_default == 1,
          });
        }
      }
    });
  },
  bindKeyInput: function (e) {
    let type = e.currentTarget.dataset.type;
    this.setData({
      [type]: e.detail.value
    });
  },
  defaultContactChange: function (e) {
    this.setData({
      isDefault: e.detail.value
    });
  },
  deleteContactInfo: function () {
    let id = this.data.id;
    app.showModal({
      content: `确定删除该联系人？`,
      showCancel: true,
      confirmText: '确定',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppEcommerce/DelContact',
          data: {
            id: id
          },
          success: (res) => {
            app.showModal({
              content: '删除成功！',
              confirm: function () {
                app.turnBack();
              }
            });
          }
        });
      }
    })
  },
  saveContactInfo: function (){
    let that = this;
    let {id, phone, name, isDefault} = this.data;
    if (!name.trim()) {
      app.showToast({title: '请填写姓名', icon: 'none'});
      return;
    }
    if (!phone.trim()) {
      app.showToast({title: '请填写手机号', icon: 'none'});
      return;
    }
    if (this.isLoading) {
      app.showToast({title: '请勿重复点击', icon: 'none'});
      return;
    }
    let params = {
      name: name,
      phone: phone,
      is_default: isDefault ? 1 : 0
    };
    if (id) {
      params['id'] = id;
    }
    this.isLoading = true;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/SaveContact',
      data: params,
      success: function (res) {
        that.isLoading = false;
        if (res.data ) {
          let prePageData = getCurrentPages()[getCurrentPages().length - 2];
          prePageData.setData({
            'evoucherContactSelected.id': res.data,
            'evoucherContactSelected.phone': phone,
            'evoucherContactSelected.name': name,
          });
          app.turnBack();
        }
      },
      complete: function() {
        that.isLoading = false;
      }
    });
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  },
})