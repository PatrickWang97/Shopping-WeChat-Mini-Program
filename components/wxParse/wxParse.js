import HtmlToJson from './html2json.js';
var realWindowWidth = 0;
var realWindowHeight = 0;
wx.getSystemInfo({
  success: function (res) {
    realWindowWidth = res.windowWidth
    realWindowHeight = res.windowHeight
  }
})
function wxParse(bindName = 'wxParseData', type='html', data='<div class="color:red;">数据不能为空</div>', target,imagePadding) {
  var that = target;
  var transData = {};//存放转化后的数据
  if (type == 'html') {
    transData = HtmlToJson.html2json(data, bindName);
  }
  transData.view = {};
  transData.view.imagePadding = 0;
  if(typeof(imagePadding) != 'undefined'){
    transData.view.imagePadding = imagePadding
  }
  that.wxParseImgTap = wxParseImgTap;
  that.wxParseImgLoad = wxParseImgLoad;
  if(bindName == getApp().getWxParseOldPattern()){
    return transData.nodes;
  } else {
    var bindData = {};
    bindData[bindName] = transData;
    that.setData(bindData)
    that.wxParseImgTap = wxParseImgTap;
    return transData.nodes;
  }
}
function wxParseImgTap(e) {
  var that = this;
  var nowImgUrl = e.target.dataset.src;
  var tagFrom = e.target.dataset.from;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    var data = getDataKey(that.data, tagFrom);
    var imageUrls = [nowImgUrl];
    if (data && data.imageUrls){
      imageUrls = data.imageUrls;
    }else{
      imageUrls = getImgUrl(data);
    }
    wx.previewImage({
      current: nowImgUrl, // 当前显示图片的http链接
      urls: imageUrls // 需要预览的图片http链接列表
    })
  }
}
function getImgUrl(data){
  let imgArr = [];
  for (let i = 0; i < data.length; i++) {
    let node = data[i];
    if (node.tag == 'img'){
      imgArr.push(node.attr.src);
    }else if (node.nodes){
      let img = getImgUrl(node.nodes);
      imgArr = imgArr.concat(img);
    }
  }
  return imgArr;
}
function wxParseImgLoad(e) {
  var that = this;
  var tagFrom = e.target.dataset.from;
  var index = e.target.dataset.index;
  if (typeof (tagFrom) != 'undefined' && tagFrom.length > 0) {
    calMoreImageInfo(e, index, that, tagFrom)
  } 
}
function calMoreImageInfo(e, index, that, bindName) {
  var temData = getDataKey(that.data, bindName);
  if (!temData) {
    return;
  }
  var recal = wxAutoImageCal(e.detail.width, e.detail.height, that, temData); 
  var key = `${bindName}`;
  if (temData && temData.nodes){
    for (var i of index.split('.')) key+=`.nodes[${i}]`;
  }else{
    let keyArr = index.split('.');
    for (let i = 0; i < keyArr.length; i++){
      if(i == 0){
        key += `[${keyArr[i]}]`;
      }else{
        key += `.nodes[${keyArr[i]}]`;
      }
    }
  }
  var keyW = key + '.width';
  var keyH = key + '.height';
  that.setData({
    [keyW]: recal.imageWidth,
    [keyH]: recal.imageheight,
  })
}
function wxAutoImageCal(originalWidth, originalHeight, that, temData) {
  var windowWidth = 0, windowHeight = 0;
  var autoWidth = 0, autoHeight = 0;
  var results = {};
  var padding = (temData && temData.view) ? temData.view.imagePadding : 0;
  windowWidth = realWindowWidth-2*padding;
  windowHeight = realWindowHeight;
  if (originalWidth > windowWidth) {//在图片width大于手机屏幕width时候
    autoWidth = windowWidth;
    autoHeight = (autoWidth * originalHeight) / originalWidth;
    results.imageWidth = autoWidth;
    results.imageheight = autoHeight;
  } else {//否则展示原来的数据
    results.imageWidth = originalWidth;
    results.imageheight = originalHeight;
  }
  return results;
}
function getDataKey(data, key){
  key = key.split('.');
  for (let i = 0; i < key.length; i++) {
    data = data[key[i]];
  }
  return data;
}
function wxParseTemArray(temArrayName,bindNameReg,total,that){
  var array = [];
  var temData = that.data;
  var obj = null;
  for(var i = 0; i < total; i++){
    var simArr = temData[bindNameReg+i].nodes;
    array.push(simArr);
  }
  temArrayName = temArrayName || 'wxParseTemArray';
  obj = JSON.parse('{"'+ temArrayName +'":""}');
  obj[temArrayName] = array;
  that.setData(obj);
}
function emojisInit(reg='',baseSrc="/wxParse/emojis/",emojis){
   HtmlToJson.emojisInit(reg,baseSrc,emojis);
}
module.exports = {
  wxParse: wxParse,
  wxParseTemArray:wxParseTemArray,
  emojisInit:emojisInit
}
