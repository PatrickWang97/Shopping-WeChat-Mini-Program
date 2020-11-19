var app = getApp()
Page({
  data: {
    messageType: 5, // 5:默认展示系统消息列表
    systemBranch: {
      data: [],
      isMore: 0,
      currentPage: 1,
      onload: false,
      unreadCount: 0
    },
    interactBranch: {
      data: [],
      isMore: 0,
      currentPage: 1,
      onload: false,
      unreadCount: 0
    },
    pushBranch: {
      data: [],
      isMore: 0,
      currentPage: 1,
      onload: false,
      unreadCount: 0
    },
    messageDetail: 0, // 控制是否展开 0:不展示消息详情页 3:展示表单详情页
    messageDetailFormData: [], //消息详情页：表单数据
    review_switch: 0, //  表单是否开启审核
    form_data: {
      review_status: 3,
      review_result: ''
    }
  },
  onLoad: function(options){
    this.options = options;
    this.getReviewConfig();
    if (options.from === "transforDetail") {
      this.setData({
        messageDetail: 3
      })
      this.showMessageDetailForm({
        currentTarget: {
          dataset: {
            form: options.form,
            formDataId: options.formDataId,
            formId: options.formid
          }
        }
      })
    } else {
      this.getMessageData();
    }
  },
  getMessageData: function(type, page){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppNotify/GetUserAppNotifyMsg',
      data: {
        'app_id': app.globalData.appId,
        'types': type || '5,6,16',
        'page': page || ''
      },
      success: function(res){
        for(var key in res.data){
          switch(parseInt(key)){
            case 5:
              that.setData({
                'systemBranch.data': that.data.systemBranch.data ? that.data.systemBranch.data.concat(that.parseMessageData(res.data[key].data)) : that.parseMessageData(res.data[key].data) ,
                'systemBranch.isMore': res.data[key].is_more || '',
                'systemBranch.currentPage': res.data[key].current_page || '',
                'systemBranch.onload': false,
                'systemBranch.unreadCount': res.data[key].unread_count || ''
              });
              break;
            case 6:
              that.setData({
                'interactBranch.data': that.data.interactBranch.data ? that.data.interactBranch.data.concat(that.parseMessageData(res.data[key].data)) : that.parseMessageData(res.data[key].data) ,
                'interactBranch.isMore': res.data[key].is_more || '',
                'interactBranch.currentPage': res.data[key].current_page || '',
                'interactBranch.onload': false,
                'interactBranch.unreadCount': res.data[key].unread_count || ''
              })
              break;
            case 16:
              let newData = {};
              let currentPushBranchData = that.data.pushBranch.data || [];
              let returnData = res.data[key];
              newData['pushBranch.data'] = currentPushBranchData ? currentPushBranchData.concat(that.parseMessageData(returnData.data)) : that.parseMessageData(returnData.data);
              newData['pushBranch.isMore'] = returnData.is_more || '';
              newData['pushBranch.currentPage'] = returnData.current_page || '';
              newData['pushBranch.onload'] = false;
              newData['pushBranch.unreadCount'] = returnData.unread_count || '';
              that.setData(newData);
              break;
          }
        }
      }
    });
  },
  parseMessageData: function(data){
    let array = [];
    let contentJson;
    let item;
    for (var i = 0; i < data.length; i++) {
      switch(parseInt(data[i].type)){
        case 1:
          contentJson = data[i].content && JSON.parse(data[i].content);
          item = {};
          item.messageType = parseInt(data[i].type);
          item.className = 'type-system';
          item.messageTitle = contentJson.title;
          item.messageTime = data[i].add_time;
          item.messageImg = contentJson.pic;
          item.messageContent = contentJson.description;
          item.messagePageUrl = data[i].page_url;
          array.push(item);
          break;
        case 2:
          contentJson = data[i].content && JSON.parse(data[i].content);
          item = {};
          item.messageType = parseInt(data[i].type);
          item.className = 'type-pay';
          item.messageTitle = '支付成功';
          item.messageTime = data[i].add_time;
          item.messageImg = 'icon-red-envelope-block';
          item.messagePrice = contentJson.total_price;
          item.messageOrderId = contentJson.order_id;
          array.push(item);
          break;
        case 3:
          contentJson = data[i].content && JSON.parse(data[i].content);
          item = {};
          item.messageType = parseInt(data[i].type);
          item.className = 'type-form';
          item.messageTitle = '表单提交成功';
          item.messageTime = data[i].add_time;
          item.messageImg = 'icon-message-form';
          item.messageContent = contentJson.form_name;
          item.messageForm = contentJson.form;
          item.messageFormId = contentJson.form_id;
          item.messageFormDataId = data[i].sub_id;
          item.review_status = data[i].data_info.length ? data[i].data_info[0].form_data.review_status : 3;
          item.review_switch = data[i].data_info.length ? data[i].data_info[0].form_data.review_switch : 0;
          array.push(item);
          break;
        case 4:
          item = {};
          item.messageType = parseInt(data[i].type);
          item.className = 'type-comment';
          item.messageTitle = '评论消息';
          item.messageTime = data[i].add_time;
          item.messageImg = 'icon-franchisee-dynamics';
          item.messageContent = data[i].content + ' 回复了你的话题';
          array.push(item);
          break;
        case 8:
          item = {};
          item.messageType = parseInt(data[i].type);
          item.className = 'type-Administrators';
          item.messageTitle = '管理员通知';
          item.messageTime = data[i].add_time;
          item.messageImg = 'icon-notify';
          item.messageContent = data[i].content.replace(/\\n/g, '\n');
          array.push(item);
          break;
        case 16:
          contentJson = data[i].content && JSON.parse(data[i].content);
          item = {};
          item.messageType = parseInt(data[i].type);
          item.className = 'type-push';
          item.messageTitle = '推送消息';
          item.messageTime = data[i].add_time;
          item.messageImg = 'icon-seting-release-block';
          item.messageContent = contentJson && contentJson.content || '';
          item.messageEventParams = contentJson.page_url || '';
          array.push(item);
          break;
      }
    }
    return array;
  },
  checkMoreMessageData: function(event){
    let that = this;
    let targetId = event.target.id;
    switch(targetId) {
      case 'myMessage-system-message':
        if ((that.data.systemBranch.isMore != 0 ) && ( !that.data.systemBranch.onload)) {
          that.getMessageData(5, (that.data.systemBranch.currentPage + 1));
          that.setData({
            'systemBranch.onload': true
          });
        }
        break;
      case 'myMessage-interact-message':
        if ((that.data.interactBranch.isMore != 0 ) && ( !that.data.interactBranch.onload)) {
          that.getMessageData(6, (that.data.interactBranch.currentPage + 1));
          that.setData({
            'interactBranch.onload': true
          });
        }
        break;
      case 'myMessage-push-message':
        let pushBranchData = that.data.pushBranch;
        if ((pushBranchData.isMore != 0) && (!pushBranchData.onload)) {
          that.getMessageData(16,(pushBranchData.currentPage + 1));
          that.setData({
            'pushBranch.onload': true
          });
        }
        break;
    }
  },
  changeMessageType: function(event){
    if(event.target.dataset.messageType == 6) {
      this.setData({
        'interactBranch.unreadCount': 0
      });
    }
    this.setData({
      messageType: event.target.dataset.messageType
    });
  },
  jumpToPage: function(event){
    let router = event.currentTarget.dataset.pageUrl;
    if (!router){
      return;
    }
    let url = '/pages/' + router + '/' + router;
    app.turnToPage(url, true);
  },
  showMessageDetailForm: function(event){
    let that = this;
    let _form = event.currentTarget.dataset.form;
    let _formId = event.currentTarget.dataset.formId;
    let _formDataId = event.currentTarget.dataset.formDataId;
    let _formData_list = []; // 该表单对应的字段详情数组
    app.setPageTitle('表单消息');
    app.sendRequest({
      url: '/index.php?r=pc/WebAppMgr/getForm',
      data: {
        'app_id': app.globalData.appId,
        'form_id': _formId,
      },
      success: function(res){
        _formData_list = res.data.field_arr;
        for (let i in _formData_list) {
          if(_formData_list[i].field === 'region_id'){
            _formData_list.splice(i, 1);
          }
        }
        that.setData({"review_switch": res.data.review_switch});
        app.sendRequest({
          url: '/index.php?r=AppData/getFormData',
          data: {
            'app_id': app.globalData.appId,
            'form': _form,
            'data_id': _formDataId,
          },
          success: function(res){
            let _array = []; // 临时存放表单提交详情的显示数据
            let _form_data = res.data["0"].form_data;
            for(var key in _form_data) {
              let _index = -1; // 判断改表单提交详情对应在字段详情数组的位置
              for (var i = 0; i < _formData_list.length; i++) {
                if (_formData_list[i]['field'] == key) {
                  _index = i;
                }
              }
              if(_index == -1) continue;
              let _item = {}; // 临时存放
              switch(parseInt(_formData_list[_index]['type'])) {
                case 1:
                  _item = {};
                  _item.dataType = 1;
                  _item.dataName = _formData_list[_index]['name'];
                  _item.dataContent = _form_data[key];
                  _array.push(_item);
                  break;
                case 2:
                  _item = {};
                  _item.dataType = 2;
                  _item.dataName = _formData_list[_index]['name'];
                  _item.dataContent = _form_data[key];
                  _array.push(_item);
                  break;
                case 3:
                  _item = {};
                  _item.dataType = 3;
                  _item.dataName = _formData_list[_index]['name'];
                  _item.dataContent = '富文本类型';
                  _array.push(_item);
                  break;
                case 12:
                  _item = {};
                  _item.dataType = 12;
                  _item.dataName = _formData_list[_index]['name'];
                  _form_data[key].map((item)=> { item.virtual = "" });
                  _item.dataContent = _form_data[key];
                  _array.push(_item);
                  break;
                case 13:
                  _item = {};
                  _item.dataType = 13;
                  _item.dataName = _formData_list[_index]['name'];
                  _item.dataContent = _form_data[key];
                  _array.push(_item);
                  break; 
              }
              _index++;
            }
            that.setData({
              'messageDetail': 3,
              'messageDetailFormData': _array,
              'form_data': _form_data
            });
          }
        });
      }
    });
  },
  confirmMessageDetailForm: function(){
    app.setPageTitle('系统通知');
    if (this.options.from === "transforDetail") {
      this.getMessageData();
    } 
    this.setData({
      'messageDetail': 0,
      'messageDetailFormData': []
    });
  },
  tapEventCommonHandler: function(e) {
    let { eventParams } = e.currentTarget.dataset;
    if (eventParams && eventParams.action && eventParams.action != 'none') {
      app.tapEventCommonHandler(e);
    }
  },
  getReviewConfig: function() {
    app.sendRequest({
      url: '/index.php?r=AppConfig/GetAppDataReviewTextConfig',
      method: 'post',
      hideLoading: true,
      success: res=> {
        this.setData({ "reviewList" : res.data});
      }
    })
  },
  bindplay: function(e) {
    let dataset = e.currentTarget.dataset;
    let tag = dataset.tag;
    let index = dataset.index;
    let id = dataset.id;
    let videoList = this.data.messageDetailFormData[tag].dataContent;
    let contextData = this.data.contextData || {};
    wx.showLoading({ title: '加载中' });
    videoList[index].virtual = videoList[index].fileName;
    if (!contextData[id]) {
      contextData[id] = wx.createVideoContext(id)
    }
    this.setData({
      'contextData': contextData,
      [`messageDetailFormData[${tag}].dataContent`]: videoList
    })
    setTimeout(() => {
      contextData[id].play();
      contextData[id].requestFullScreen();
      wx.hideLoading()
    }, 600)
  },
  bindPlayVideo: function (e) {
    let id = e.currentTarget.dataset.id;
    let contextData = this.data.contextData || {};
    if (Object.keys(contextData).length > 0) {
      Object.keys(contextData).forEach((val, key) => {
        if (id != val) contextData[val].pause();
      })
    }
  }
})
