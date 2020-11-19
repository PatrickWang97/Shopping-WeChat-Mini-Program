const app = getApp();
Page({
  data: {
    auditStatus: '',      // 审核状态
    formId: '',           // 表单ID
    formDataKey: [],      // 表单字段信息
    formDataValue: {},    // 表单字段的值
    requestFinish: false, // 接口数据是否请求回来
  },
  onLoad: function (options) {
    if (options && options.scene) {
      let scene = decodeURIComponent(options.scene),
          formId = scene.split('=')[1]; // 二维码带的表单ID
      if (formId) {
        this.setData({
          formId: formId,
        });
      } else {
        app.showModal({
          content: '获取表单ID出错了',
        });
        return false;
      }
    }
    this.dataInitial();
  },
  dataInitial: function() {
    let that = this;
    this.getUserCanSubmit().then(()=>{
      this.getFormDataByUser().then((res) => {
        let returnData = res.data;
        that.getFormData().then((res) => {
          let returnData2 = res.data;
          that.setData({
            requestFinish: true,                            // 请求数据完成
            formDataKey: returnData2 && returnData2.fields // 表单的所有字段
          });
        if (returnData) {  // 用户填写过表单信息
          returnData2.fields.forEach((item) => {
            if (item.type == 3) { // 图片类型
              let value = returnData.form_data[item.uuid];
              returnData.form_data[item.uuid] = Array.isArray(value) ? value: [];
            }
          });
          let reason = returnData.review_result.replace(/\\n/g,'\n');
          that.setData({
            requestFinish: true,                    // 请求数据完成
            formDataValue: returnData.form_data,    // 表单数据
            auditStatus: returnData.review_status,  // 审核状态
            auditReason: reason,                    // 不通过原因
          });
        } else {  // 用户没有填写过表单
          let formDataObj = {};
          if (returnData2.fields.length) {
            returnData2.fields.forEach((item) => {
              formDataObj[item.uuid] = '';
            });
            that.setData({
              formDataValue: formDataObj
            });
          }
        }
        }, () => {
          that.apiErrorTip();
        });
      },() => {
        that.apiErrorTip();
      });
    });
  },
  getUserCanSubmit: function () {
    return new Promise((resolve) => {
      app.sendRequest({
        url: '/index.php?r=WxGuide/CanSubmit',
        hideLoading: true,
        success: function() {
          resolve();
        },
        successStatusAbnormal: function() {
          app.showModal({
            content: '您暂无权限填写表单',
            confirm: function() {
              let router = app.getHomepageRouter();
              app.turnToPage(`/pages/${router}/${router}`, true);
            }
          });
        }
      });
    });
  },
  getFormData: function () {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=WxGuide/GetForm',
        hideLoading: true,
        data: {
          id: this.data.formId
        },
        success: function(res) {
          resolve(res);
        },
        fail: function(res) {
          reject(res);
        },
        complete: function() {
          wx.stopPullDownRefresh();
        }
      });
    });
  },
  getFormDataByUser: function() {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=WxGuide/GetFormDataByUser',
        hideLoading: true,
        data: {
          form_id: this.data.formId,
        },
        success: function (res) {
          resolve(res);
        },
        fail: function (res) {
          reject(res);
        },
        complete: function () {
          wx.stopPullDownRefresh();
        }
      });
    });
  },
  submitFormData: function () {
    let that = this,
    formDataKey = that.data.formDataKey,
        formDataValue = that.data.formDataValue;
    if (this.isLoading) { return; }
    let flag = false;
    formDataKey.forEach((item) => {
      if (!flag) {
        if (item.required == 1) { // 字段为必填项
          let tip = '';
          let value = formDataValue[item.uuid];
          if (item.type == 1 && (!value || (value && !value.trim()))) {        // 文本类型
            tip = `请输入${item.name}`;
          } else if (item.type == 2 && (!value || (value && !value.trim()))) { // 下拉选项
            tip = `请选择${item.name}`;
          } else if (item.type == 3 && (!value || (value && !value.length))) { // 图片
            tip = `请上传${item.name}图片`;
          }
          if (tip) {
            app.showToast({
              title: tip,
              icon: 'none',
              duration: 2000
            });
            flag = true;
          }
        }
      }
    });
    if (flag) { return; }
    this.isLoading = true;
    app.sendRequest({
      url: '/index.php?r=WxGuide/SubmitForm',
      method: 'POST',
      data: {
        form_id: that.data.formId,
        form_data: formDataValue
      },
      success: function() {
        that.getFormDataByUser().then(() => {
          that.setData({
            auditStatus: 1,
          });
          app.showModal({
            content: '数据提交成功，正在审核...'
          });
        })
      },
      fail: function () {
        app.showModal({
          content: '数据提交失败，请稍后重试！'
        });
      },
      complete: function () {
        that.isLoading = false;
      }
    });
  },
  onPullDownRefresh: function() {
    this.dataInitial();
  },
  bindInput: function(e) {
    let datasetObj = e.currentTarget.dataset,
        value = e.detail.value; // 输入的值
    let uuid = datasetObj.uuid; // 字段的key
    this.setData({
      [`formDataValue.${uuid}`]:  value
    });
  },
  bindPickerChange: function(e) {
    let datasetObj = e.currentTarget.dataset,
        value = e.detail.value,              // 选中的下标索引
        formDataKey = this.data.formDataKey; // 表单所有字段
    let index = datasetObj['index'],  // 该字段的下标索引
        uuid = datasetObj['uuid'];    // 字段的key
    this.setData({
      [`formDataValue.${uuid}`]: formDataKey[index]['selectArr'][value]
    });
  },
  chooseImage: function(e){
    let that = this,
        datasetObj = e.currentTarget.dataset,
        formDataValue = that.data.formDataValue;
    let uuid = datasetObj['uuid'],          // 字段的key
        imgArr = formDataValue[uuid] || []; // 当前字段的图片数组
    app.chooseImage(function(images){
      that.setData({
        [`formDataValue.${uuid}`]: imgArr.concat(images)
      });
    }, 3 - imgArr.length);
  },
  removeImage: function(e){
    let datasetObj = e.currentTarget.dataset,
        formDataValue = this.data.formDataValue;
    let uuid = datasetObj.uuid,         // 字段的key
        picIndex = datasetObj.imgIndex, // 图片的下标索引
        imgArr = formDataValue[uuid];   // 获取该字段图片数组
    imgArr.splice(picIndex, 1);
    this.setData({
      [`formDataValue.${uuid}`]: imgArr
    });
  },
  previewImage: function(e) {
    let datasetObj = e.currentTarget.dataset,
        formDataValue = this.data.formDataValue;
    let uuid = datasetObj.uuid,         // 字段的key
        imgIndex = datasetObj.imgIndex, // 图片的下标索引
        imgArr = formDataValue[uuid];   // 该字段下面的图片数组
    app.previewImage({
      current: imgArr[imgIndex],
      urls: imgArr
    });
  },
  apiErrorTip: function() {
    app.showToast({
      title: '获取数据出错了，请稍后重试',
      icon: 'none',
      duration: 2000
    });
  }
})