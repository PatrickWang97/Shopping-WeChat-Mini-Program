let app = getApp()
export class DrawShare {
  constructor(canvas, goodsType, goodsInfo, selectType, options) {
    this.canvas = canvas
    this.goodsType = goodsType
    this.goodsInfo = goodsInfo
    this.selectType = selectType
    this.options = options
    this.nickname = ''
    this.cover_thumb = ''
    this.share_dotted = app.getSiteBaseUrl() + "/static/webapp/images/xcx-goods/sharePic.png"
    this.group_dotted = app.getSiteBaseUrl() + '/static/webapp/images/goods-share/share-group-left.png'
    this.group_dotted2 = app.getSiteBaseUrl() + '/static/webapp/images/goods-share/share-group-right.png'
    this.skill_dotted = app.getSiteBaseUrl() + '/static/webapp/images/goods-share/share-skill-left.png'
    this.skill_dotted2 = app.getSiteBaseUrl() + '/static/webapp/images/goods-share/share-skill-right.png'
    this.presell_dotted = app.getSiteBaseUrl() + '/static/webapp/images/goods-share/share-presell.png'
    this.goods_share2 = app.getSiteBaseUrl() + '/static/webapp/images/goods-share/goods-share2.png'
    this.factor = app.globalData.systemInfo.screenWidth / 750
  }
  init() {
    this.ctx = this.canvas.getContext('2d')
    this.nickname = app.globalData.userInfo.nickname || '未登录'
    this.cover_thumb = app.globalData.userInfo.cover_thumb || 'https://wx.qlogo.cn/mmopen/vi_32/DYAIOgq83eqZ3ml5EesibAXS3nMzfLWQ7K3hxDslQfa6XibBeW0gVdjjQtLQzzNSQdAfcFbe7c5IiaFtAUQTfGsww/132'
    this.ctx.clearRect(0, 0, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
    if (this.selectType == 2) {
      switch (this.goodsType) {
        case 0:
          this.getGoodsDeti1(56, 53, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 1:
          this.getGroupDisgn1(28, 28, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 2:
          this.getGroupSkill1(28, 28, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 3:
          this.getPreSell1(20, 30, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 4:
          this.getCommunityGroup1(30, 30, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        default:
          break;
      }
    } else {
      switch (this.goodsType) {
        case 0:
          this.getGoodsDeti2(42, 32, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 1:
          this.getGroupDisgn2(58, 51, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 2:
          this.getGroupSkill2(58, 51, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 3:
          this.getPreSell2(37, 30, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        case 4:
          this.getCommunityGroup2(20, 30, this.toPx(this.options.canvas.width), this.toPx(this.options.canvas.height))
          break;
        default:
          break;
      }
    }
  }
  static getInstance(canvas, goodsType, goodsInfo, selectType, options) {
    if (!this.instance) {
      this.instance = new DrawShare(canvas, goodsType, goodsInfo, selectType, options);
    } else {
      this.instance.canvas = canvas
      this.instance.goodsType = goodsType
      this.instance.goodsInfo = goodsInfo
      this.instance.selectType = selectType
      this.instance.options = options
    }
    return this.instance;
  }
  getGoodsDeti1(x, y, width, height) {
    this.ctx.fillStyle = "#ffffff"
    this.setRadiusRectWidthNone(0, 0, this.toRpx(width), this.toRpx(height), 20, '#fff')
    this.creatLineGradient(0, 0, width, 237, '#FA4209', '#FF8A00')
    this.setRadiusRectWidthNone(x, y, 430, 620, 20, '#fff', 1)
    this.drawRadiusRect(x, y, 430, 430, 20, this.goodsInfo.goods_img)
    this.drawIconWidthText('', this.goodsInfo.text, x + 20, y + 431 + 26, 0, 0, 24, 28, 'bold')
    this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(36)}px normal`, '#FF3600', x + 20, y + 431 + 26 + 120)
    if (this.goodsInfo.virtual_price) {
      let right = (this.goodsInfo.price.length + 1) * this.toPx(36);
      this.setDrawText(`¥${this.goodsInfo.virtual_price}`, `${this.toPx(24)}px normal`, '#999999', x + 20 + 20 + right, y + 431 + 26 + 120)
      let virtual_price = this.goodsInfo.virtual_price.replace(/\./g, '')
      this.setDrawLine(x + 20 + 20 + right, y + 431 + 26 + 112, virtual_price, 18)
    }
    this.setDrawImg(this.goodsInfo.qrcode_img_url, x + 210 - 62, y + 620 + 30, 124, 124)
    this.setDrawText('长按图片识别小程序码', `${this.toPx(20)}px normal`, '#999', 172, y + 620 + 30 + 124 + 32)
  }
  getGoodsDeti2(x, y, width, height) {
    this.drawRadiusRect(0, 0, this.toRpx(width), this.toRpx(height), 20, this.goods_share2, () => {
      this.setRadiusRectWidthNone(x, y, 468, 689, 30)
      this.setRadiusRectWidthNone(x, y + 689 + 16, 468, 123, 30)
      this.drawRadiusRect(x + 18, y + 92, 430, 430, 30, this.goodsInfo.goods_img)
      this.setDrawText('推荐一个好物给你，请接收', `${this.toPx(24)}px normal`, '#666', x + 90, y + 58)
      this.getCircleImg(this.cover_thumb, x + 18, y + 18, 30)
      this.drawIconWidthText('', this.goodsInfo.text, x + 18, y + 92 + 430 + 26, 0, 0, 27, 28, 'bold')
      this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(36)}px normal`, '#FF0000', x + 18, y + 92 + 430 + 26 + 80 + 34)
      if (this.goodsInfo.virtual_price) {
        let right = (this.goodsInfo.price.length + 1) * this.toPx(36);
        this.setDrawText(`¥${this.goodsInfo.virtual_price}`, `${this.toPx(24)}px normal`, '#999999', x + 18 + right + 20, y + 92 + 430 + 26 + 80 + 34)
        let virtual_price = this.goodsInfo.virtual_price.replace(/\./g, '')
        this.setDrawLine(x + 18 + right + 20, y + 92 + 430 + 26 + 80 + 26, virtual_price, 18)
      }
      this.setDrawImg(this.goodsInfo.qrcode_img_url, x + 18, y + 92 + 430 + 26 + 80 + 34 + 56, 100, 100)
      this.setDrawText('长按图片识别小程序码', `${this.toPx(24)}px normal`, '#999', x + 18 + 100 + 20, y + 92 + 430 + 26 + 80 + 34 + 112)
    })
  }
  getGroupDisgn1(x, y, width, height) {
    this.ctx.fillStyle = "#fff"
    this.ctx.fillRect(0, 0, width, height)
    this.setDrawText(this.nickname, `${this.toPx(28)}px normal`, '#333', x + 64 + 20, y + 24)
    this.setDrawText('推荐给您一个好物', `${this.toPx(24)}px normal`, '#666', x + 64 + 20, y + 60)
    this.setDrawImg(this.share_dotted, x + 400, y + 16, 28, 22)
    this.getCircleImg(this.cover_thumb, x, y, 32)
    this.drawRadiusRect(x, y + 84, 440, 440, 30, this.goodsInfo.goods_img)
    this.drawIconWidthText(this.group_dotted, this.goodsInfo.text, x, y + 84 + 440 + 26, 101, 32, 21)
    this.setDrawImg(this.goodsInfo.qrcode_img_url, x + 330, y + 82 + 440 + 24, 100, 100)
    this.setDrawText('扫码立即抢购', `${this.toPx(18)}px normal`, '#999', x + 325, y + 82 + 440 + 24 + 130)
    this.setDrawText('¥', `${this.toPx(24)}px normal`, '#FF3600', x, y + 64 + 20 + 440 + 24 + 126)
    this.setDrawText(this.goodsInfo.price, `${this.toPx(36)}px normal`, '#FF3600', x + 28, y + 64 + 20 + 440 + 24 + 126)
    if (this.goodsInfo.virtual_price) {
      let right = (this.goodsInfo.price.length + 1) * this.toPx(24) + 30;
      this.setDrawText(`¥${this.goodsInfo.virtual_price}`, `${this.toPx(28)}px normal`, '#999999', x + 28 + right, y + 64 + 20 + 440 + 24 + 126)
      this.setDrawLine(x + 28 + right, y + 64 + 20 + 440 + 24 + 118, this.goodsInfo.virtual_price, 22)
    }
  }
  getGroupDisgn2(x, y, width, height) {
    this.ctx.fillStyle = "#FFF8F0"
    this.ctx.fillRect(0, 0, width, height)
    this.creatLineGradient(0, 0, width, 263, '#FA4209', '#FF8A00')
    this.setRadiusRectWidthNone(x, y, 500, 888, 10, '#fff')
    let vx = x + 30;
    let vy = y + 30;
    this.setDrawText(this.nickname, `${this.toPx(28)}px normal`, '#333', vx + 64 + 20, vy + 24)
    this.setDrawText('推荐给您一个好物', `${this.toPx(24)}px normal`, '#666', vx + 64 + 20, vy + 60)
    this.setDrawImg(this.share_dotted, vx + 400, vy + 16, 28, 22)
    this.getCircleImg(this.cover_thumb, vx, vy, 32)
    this.drawRadiusRect(vx, vy + 84, 440, 440, 30, this.goodsInfo.goods_img)
    this.drawIconWidthText('', this.goodsInfo.text, vx, vy + 84 + 440 + 26, 100, 32, 28, 26, 'bold')
    this.setDrawText('¥', `${this.toPx(24)}px normal`, '#FF3600', vx, vy + 64 + 20 + 440 + 24 + 120)
    this.setDrawText(this.goodsInfo.price, `${this.toPx(36)}px normal`, '#FF3600', vx + 28, vy + 64 + 20 + 440 + 24 + 120)
    if (this.goodsInfo.virtual_price) {
      let right = (this.goodsInfo.price.length + 1) * this.toPx(32);
      this.setDrawText(`¥${this.goodsInfo.virtual_price}`, `${this.toPx(28)}px normal`, '#999999', vx + 28 + right, vy + 64 + 20 + 440 + 24 + 120)
      this.setDrawLine(vx + 28 + right, vy + 64 + 20 + 440 + 24 + 110, this.goodsInfo.virtual_price, 22)
      let rigthX = vx + (this.goodsInfo.price.length + this.goodsInfo.virtual_price.length + 2) * this.toPx(28) + 80
      this.setDrawImg(this.group_dotted2, rigthX, vy + 64 + 20 + 440 + 24 + 90, 116, 36)
    } else {
      let right = (this.goodsInfo.price.length + 1) * this.toPx(32) + 20;
      this.setDrawImg(this.group_dotted2, vx + 28 + right, vy + 64 + 20 + 440 + 24 + 90, 116, 36)
    }
    this.setDrawImg(this.goodsInfo.qrcode_img_url, vx, vy + 64 + 20 + 440 + 24 + 120 + 26, 140, 140)
    if (this.goodsInfo.stock) {
      this.setDrawText(`仅剩${this.goodsInfo.stock}件`, `${this.toPx(22)}px normal`, '#666', vx + 140 + 26, vy + 64 + 20 + 440 + 24 + 120 + 26 + 46)
    }
    this.setDrawText('长按识别小程序快来抢购吧', `${this.toPx(22)}px normal`, '#666', vx + 140 + 26, vy + 64 + 20 + 440 + 24 + 120 + 26 + 110)
    this.getCircleBall(width, height, 70, 'rgba(251, 187, 145, 0.2)')
    this.getCircleBall(width - 60, height + 26, 50, 'rgba(255, 138, 0,0.2)')
  }
  getGroupSkill1(x, y, width, height) {
    this.ctx.fillStyle = "#fff"
    this.ctx.fillRect(0, 0, width, height)
    this.setDrawText(this.nickname, `${this.toPx(28)}px normal`, '#333', x + 64 + 20, y + 24)
    this.setDrawText('推荐给您一个好物', `${this.toPx(24)}px normal`, '#666', x + 64 + 20, y + 60)
    this.setDrawImg(this.share_dotted, x + 400, y + 16, 28, 22)
    this.getCircleImg(this.cover_thumb, x, y, 32)
    this.drawRadiusRect(x, y + 84, 440, 440, 30, this.goodsInfo.goods_img)
    this.drawIconWidthText(this.skill_dotted, this.goodsInfo.text, x, y + 84 + 440 + 26, 134, 32, 21)
    this.setDrawImg(this.goodsInfo.qrcode_img_url, x + 330, y + 82 + 440 + 24, 100, 100)
    this.setDrawText('扫码立即抢购', `${this.toPx(18)}px normal`, '#999', x + 325, y + 82 + 440 + 24 + 130)
    this.setDrawText('¥', `${this.toPx(24)}px normal`, '#FF3600', x, y + 64 + 20 + 440 + 24 + 126)
    this.setDrawText(this.goodsInfo.seckill_price, `${this.toPx(36)}px normal`, '#FF3600', x + 28, y + 64 + 20 + 440 + 24 + 126)
    if (this.goodsInfo.price) {
      let right = (this.goodsInfo.seckill_price.length + 1) * this.toPx(24) + 30;
      this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(28)}px normal`, '#999999', x + 28 + right, y + 64 + 20 + 440 + 24 + 126)
      this.setDrawLine(x + 28 + right, y + 64 + 20 + 440 + 24 + 118, this.goodsInfo.price, 22)
    }
    if (this.goodsInfo.stock) {
      this.setDrawText(`剩余件数：${this.goodsInfo.stock}`, `${this.toPx(22)}px normal`, '#666', x, y + 64 + 20 + 440 + 24 + 126 + 38)
    }
  }
  getGroupSkill2(x, y, width, height) {
    this.ctx.fillStyle = "#FFF8F0"
    this.ctx.fillRect(0, 0, width, height)
    this.creatLineGradient(0, 0, width, 263, '#FD3636', '#FF475D')
    this.setRadiusRectWidthNone(x, y, 500, 888, 10, '#fff')
    let vx = x + 30;
    let vy = y + 30;
    this.setDrawText(this.nickname, `${this.toPx(28)}px normal`, '#333', vx + 64 + 20, vy + 24)
    this.setDrawText('推荐给您一个好物', `${this.toPx(24)}px normal`, '#666', vx + 64 + 20, vy + 60)
    this.setDrawImg(this.share_dotted, vx + 400, vy + 16, 28, 22)
    this.getCircleImg(this.cover_thumb, vx, vy, 32)
    this.drawRadiusRect(vx, vy + 84, 440, 440, 30, this.goodsInfo.goods_img)
    this.drawIconWidthText('', this.goodsInfo.text, vx, vy + 84 + 440 + 26, 100, 32, 28, 26, 'bold')
    this.setDrawText('¥', `${this.toPx(24)}px normal`, '#FF3600', vx, vy + 64 + 20 + 440 + 24 + 120)
    this.setDrawText(this.goodsInfo.seckill_price, `${this.toPx(36)}px normal`, '#FF3600', vx + 28, vy + 64 + 20 + 440 + 24 + 120)
    if (this.goodsInfo.price) {
      let right = (this.goodsInfo.seckill_price.length + 1) * this.toPx(32);
      this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(28)}px normal`, '#999999', vx + 28 + right, vy + 64 + 20 + 440 + 24 + 120)
      this.setDrawLine(vx + 28 + right, vy + 64 + 20 + 440 + 24 + 110, this.goodsInfo.price, 22)
      let rigthX = vx + (this.goodsInfo.seckill_price.length + this.goodsInfo.price.length + 2) * this.toPx(28) + 80
      this.setDrawImg(this.skill_dotted2, rigthX, vy + 64 + 20 + 440 + 24 + 90, 134, 32)
    } else {
      let right = (this.goodsInfo.seckill_price.length + 1) * this.toPx(32) + 20;
      this.setDrawImg(this.skill_dotted2, vx + 28 + right, vy + 64 + 20 + 440 + 24 + 90, 134, 32)
    }
    this.setDrawImg(this.goodsInfo.qrcode_img_url, vx, vy + 64 + 20 + 440 + 24 + 120 + 26, 140, 140)
    if (this.goodsInfo.stock) {
      this.setDrawText(`仅剩${this.goodsInfo.stock}件`, `${this.toPx(22)}px normal`, '#666', vx + 140 + 26, vy + 64 + 20 + 440 + 24 + 120 + 26 + 46)
    }
    this.setDrawText('长按识别小程序快来抢购吧', `${this.toPx(22)}px normal`, '#666', vx + 140 + 26, vy + 64 + 20 + 440 + 24 + 120 + 26 + 110)
    this.getCircleBall(width, height, 70, 'rgba(253, 172, 177, 0.2)')
    this.getCircleBall(width - 60, height + 26, 50, 'rgba(254, 208, 214,0.2)')
  }
  getPreSell1(x, y, width, height) {
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(0, 0, width, height)
    this.getCircleImg(this.cover_thumb, x + 46, y, 23)
    this.getEllipse(x + 70, y, 300, 46, '#f3f3f3', '推荐一个宝贝给您，请查收')
    this.drawRadiusRect(x, y + 46 + 30, 440, 432, 20, this.goodsInfo.goods_img)
    this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(26)}px normal`, '#ff4d4f', x, y + 46 + 30 + 432 + 60)
    this.drawIconWidthText(this.presell_dotted, this.goodsInfo.text, x, y + 46 + 30 + 432 + 60 + 20, 54, 25, 20, 26, 'bold')
    this.setDrawImg(this.goodsInfo.qrcode_img_url, x + 300 + 40, y + 46 + 30 + 432 + 60, 103, 103)
    this.setDrawText('长  按  识  别', `${this.toPx(18)}px normal`, '#999', 187, y + 46 + 30 + 432 + 60 + 140)
  }
  getPreSell2(x, y, width, height) {
    this.creatLineGradient(0, 0, width, this.toRpx(height), '#F8704E', '#F5684F', '#EB4436')
    this.getCircleImg(this.cover_thumb, x + 70, y, 23)
    this.getEllipse(x + 95, y, 300, 46, 'rgba(255,255,255,.1)', '推荐一个宝贝给您，请查收', '#fff')
    this.setRadiusRectWidthNone(x, y + 46 + 30, 480, 672, 20)
    let vx = x + 20
    let vy = y + 20
    this.drawRadiusRect(vx, vy + 46 + 30, 440, 432, 20, this.goodsInfo.goods_img)
    this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(26)}px normal`, '#ff4d4f', vx, vy + 46 + 30 + 432 + 60)
    this.drawIconWidthText(this.presell_dotted, this.goodsInfo.text, vx, vy + 46 + 30 + 432 + 60 + 20, 54, 25, 20, 26, 'bold')
    this.setDrawImg(this.goodsInfo.qrcode_img_url, vx + 300 + 40, vy + 46 + 30 + 432 + 60, 103, 103)
    this.setDrawText('长  按  识  别', `${this.toPx(18)}px normal`, '#999', 207, vy + 46 + 30 + 432 + 60 + 140)
  }
  getCommunityGroup1(x, y, width, height) {
    const grd = this.ctx.createLinearGradient(0, 0, width, height)
    grd.addColorStop(0, '#FF8E66')
    grd.addColorStop(0.5, '#FF8141')
    grd.addColorStop(1, '#FE402C')
    this.setRadiusRectWidthNone(0, 0, this.toRpx(width), this.toRpx(height), 20, grd)
    this.getCircleImg(this.cover_thumb, x + 70, y, 23)
    this.getEllipse(x + 95, y, 300, 46, '#fff', '推荐一个宝贝给您，请查收')
    this.setRadiusRectWidthNone(x, y + 46 + 23, 470, 150, 40)
    this.drawRadiusRect(x + 20, y + 46 + 23 + 20, 110, 110, 20, this.goodsInfo.goods_img)
    this.drawIconWidthText('', this.goodsInfo.text, x + 30 + 110, y + 46 + 23 + 10, 0, 0, 18, 26, 'bold', '#333')
    this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(26)}px bold`, '#ff4d4f', x + 30 + 110, y + 46 + 23 + 24 + 100)
    this.setRadiusRectWidthNone(x, y + 46 + 23 + 150 + 24, 470, 209, 40)
    this.setDrawText(`小区团长：`, `${this.toPx(22)}px normal`, '#333', x + 20, y + 46 + 23 + 150 + 24 + 70)
    this.setDrawText(this.goodsInfo.leaderInfo.nick_name, `${this.toPx(22)}px bold`, '#333', x + 20 + 100, y + 46 + 23 + 150 + 24 + 70)
    this.setDrawText(`抢购时间：`, `${this.toPx(22)}px normal`, '#333', x + 20, y + 46 + 23 + 150 + 24 + 70 + 32)
    this.drawIconWidthText('', this.goodsInfo.communityInfo.start_date, x + 20 + 100, y + 46 + 23 + 150 + 24 + 72, 0, 0, 14, 22, 'bold')
    this.setDrawText(`提货地址：`, `${this.toPx(22)}px normal`, '#333', x + 20, y + 46 + 23 + 150 + 24 + 70 + 64 + 24)
    this.drawIconWidthText('', this.goodsInfo.leaderInfo.housing_estate + this.goodsInfo.leaderInfo.address_detail, x + 20 + 100, y + 46 + 23 + 150 + 24 + 70 + 62, 0, 0, 18, 20, 'bold')
    this.setDrawImg(this.goodsInfo.qrcode_img_url, x + 20 + 314, y + 46 + 23 + 150 + 24 + 40, 106, 106)
    this.setDrawText(`长 按 识 别`, `${this.toPx(18)}px bold`, '#999', x + 20 + 324, y + 46 + 23 + 150 + 24 + 40 + 136)
    this.getCircular(x, y + 46 + 23 + 150 + 24, 18, 90, 36, '社区团购')
  }
  getCommunityGroup2(x, y, width, height) {
    this.ctx.fillStyle = '#fff'
    this.setRadiusRectWidthNone(0, 0, this.toRpx(width), this.toRpx(height), 20)
    this.getCircleImg(this.cover_thumb, x + 70, y, 23)
    this.getEllipse(x + 95, y, 300, 46, '#F3F3F3', '推荐一个宝贝给您，请查收')
    this.drawRadiusRect(x + 20, y + 46 + 23 + 10, 110, 110, 20, this.goodsInfo.goods_img)
    this.drawIconWidthText('', this.goodsInfo.text, x + 20 + 110 + 20, y + 46 + 23, 0, 0, 22, 26, 'bold', '#333')
    this.setDrawText(`¥${this.goodsInfo.price}`, `${this.toPx(26)}px bold`, '#ff4d4f', x + 20 + 110 + 20, y + 46 + 23 + 114)
    this.setRadiusRectWidthNone(0, 245, 530, 220, 0, '#F96D08')
    this.setDrawText(`小区团长：`, `${this.toPx(22)}px normal`, '#fff', x, y + 215 + 76)
    this.setDrawText(this.goodsInfo.leaderInfo.nick_name, `${this.toPx(22)}px bold`, '#fff', x + 100, y + 215 + 76)
    this.setDrawText(`抢购时间：`, `${this.toPx(22)}px normal`, '#fff', x, y + 215 + 76 + 32)
    this.drawIconWidthText('', this.goodsInfo.communityInfo.start_date, x + 100, y + 215 + 80, 0, 0, 14, 22, 'bold', '#fff')
    this.setDrawText(`提货地址：`, `${this.toPx(22)}px normal`, '#fff', x, y + 215 + 76 + 64 + 24)
    this.drawIconWidthText('', this.goodsInfo.leaderInfo.housing_estate + this.goodsInfo.leaderInfo.address_detail, x + 100, y + 215 + 76 + 36 + 26, 0, 0, 20, 20, 'bold', '#fff')
    this.getCircleImg(this.goodsInfo.qrcode_img_url, x + 285 + 68, y + 215 + 30, 63)
    this.setDrawText('长 按 识 别', `${this.toPx(20)}px bold`, '#fff', x + 285 + 68 + 10, y + 215 + 30 + 126 + 32)
  }
  getCircular(x, y, r, w, h, title, color = '#F8D000') {
    x = this.toPx(x)
    y = this.toPx(y)
    r = this.toPx(r)
    w = this.toPx(w)
    h = this.toPx(h)
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x + w, y)
    this.ctx.lineTo(x + w + r, y)
    this.ctx.arcTo(x + w + r, y + h, x + w - r, y + h, r)
    this.ctx.lineTo(x, y + h)
    this.ctx.lineTo(x, y + r)
    this.ctx.arcTo(x, y, x + r, y, r)
    this.ctx.fillStyle = color
    this.ctx.fill()
    this.ctx.restore()
    this.setDrawText(title, `${this.toPx(18)}px normal`, '#2A1C09', this.toRpx(x) + 18, this.toRpx(y) + 24)
  }
  getCircleBall(x, y, r, color) {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, 2 * Math.PI)
    this.ctx.fillStyle = color
    this.ctx.fill()
    this.ctx.restore()
  }
  creatLineGradient(startX, startY, width, height, ...color) {
    const grd = this.ctx.createLinearGradient(this.toPx(startX), this.toPx(startY), width, this.toPx(0))
    let average = 100 / (color.length - 1);
    color.forEach((value, index) => {
      grd.addColorStop((index * average) / 100, value)
    })
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.translate(0, -100)
    this.ctx.arc(width / 2, startY, height, 0, Math.PI)
    this.ctx.fillStyle = grd
    this.ctx.fill()
    this.ctx.restore()
  }
  getCircleImg(src, x, y, r) {
    x = this.toPx(x);
    y = this.toPx(y);
    r = this.toPx(r);
    const img = this.canvas.createImage()
    img.src = src
    img.onload = () => {
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.arc(x + r, y + r, r, 0, 2 * Math.PI)
      this.ctx.clip()
      this.ctx.drawImage(img, x, y, 2 * r, 2 * r)
      this.ctx.closePath()
      this.ctx.restore()
    }
  }
  drawIconWidthText(icon, title, x, y, w, h, lineMaxLen = 12, fontSize = 26, fontStyle = 'normal', color = "#333") {
    let lineLength = 0
    let startX = 0
    let lineOneArray = [];
    let lineTwoArray = [];
    let limit = {
      'line1': 0,
      'line2': 0
    }
    if (icon) {
      this.setDrawImg(icon, x, y + 32 - h, w, h)
      startX = w + 10
      lineMaxLen = lineMaxLen - parseInt(w / fontSize * 1.75)
    }
    title.split('').some(value => {
      let len = this.getByteLen(value);
      lineLength += len;
      if (lineLength <= lineMaxLen) {
        lineOneArray.push(value)
        limit.line1 = lineLength
      } else {
        lineTwoArray.push(value)
        limit.line2 = lineLength - limit.line1;
      }
      if (lineLength >= (icon ? (lineMaxLen * 2 + parseInt(w / fontSize * 1.75) - 4.5) : (lineMaxLen * 2 - 3))) return true
    })
    this.setDrawText(lineOneArray.join(''), `${this.toPx(fontSize)}px ${fontStyle}`, color, x + startX, y + 28)
    this.setDrawText(lineTwoArray.join('') + (limit.line2 >= lineMaxLen - 3 ? '...' : ''), `${this.toPx(fontSize)}px ${fontStyle}`, color, x, y + 62)
  }
  getByteLen(val) {
    let len = 0;
    if (val.match(/[^\x00-\xff]/ig) != null) {
      len = 1.75;
    } else {
      if (val.match(/[a-zA-Z]/) != null) {
        len = 0.95;
      } else {
        len = 1;
      }
    }
    return len;
  }
  setDrawImg(src, x, y, width, height) {
    const img = this.canvas.createImage()
    img.src = src
    img.onload = () => {
      this.ctx.drawImage(img, this.toPx(x), this.toPx(y), this.toPx(width), this.toPx(height));
    }
  }
  setDrawText(title, fontSize, color, x, y) {
    fontSize = fontSize.split(' ');
    this.ctx.fillStyle = color
    this.ctx.font = `${fontSize[1]} ${fontSize[0]} sans-serif`
    this.ctx.fillText(title, this.toPx(x), this.toPx(y))
  }
  setDrawLine(x, y, content, font = 22, color = '#999') {
    x = this.toPx(x)
    y = this.toPx(y)
    let width = content.length * this.toPx(font)
    this.ctx.beginPath()
    this.ctx.moveTo(x, y)
    this.ctx.lineTo(x + width, y)
    this.ctx.strokeStyle = color
    this.ctx.stroke()
  }
  drawRadiusRect(x, y, w, h, r, src, callback) {
    const br = r / 2
    const img = this.canvas.createImage()
    img.src = src
    img.onload = () => {
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.moveTo(this.toPx(x + br), this.toPx(y))                                                            // 移动到左上角的点
      this.ctx.lineTo(this.toPx(x + w - br), this.toPx(y))                                                        // 画上边的线
      this.ctx.arcTo(this.toPx(x + w), this.toPx(y), this.toPx(x + w), this.toPx(y + br), this.toPx(br))          // 画右上角的弧		
      this.ctx.lineTo(this.toPx(x + w), this.toPx(y + h - br))                                                    // 画右边的线
      this.ctx.arcTo(this.toPx(x + w), this.toPx(y + h), this.toPx(x + w - br), this.toPx(y + h), this.toPx(br))  // 画右下角的弧
      this.ctx.lineTo(this.toPx(x + br), this.toPx(y + h))                                                        // 画下边的线
      this.ctx.arcTo(this.toPx(x), this.toPx(y + h), this.toPx(x), this.toPx(y + h - br), this.toPx(br))          // 画左下角的弧
      this.ctx.lineTo(this.toPx(x), this.toPx(y + br))                                                            // 画左边的线
      this.ctx.arcTo(this.toPx(x), this.toPx(y), this.toPx(x + br), this.toPx(y), this.toPx(br))                  // 画左上角的弧
      this.ctx.clip();
      this.ctx.drawImage(img, this.toPx(x), this.toPx(y), this.toPx(w), this.toPx(h))
      this.ctx.restore()
      callback && callback()
    }
  }
  setRadiusRectWidthNone(x, y, w, h, r, color = "#fff", shadow = 0) {
    const br = r / 2
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.moveTo(this.toPx(x + br), this.toPx(y))                                                            // 移动到左上角的点
    this.ctx.lineTo(this.toPx(x + w - br), this.toPx(y))                                                        // 画上边的线
    this.ctx.arcTo(this.toPx(x + w), this.toPx(y), this.toPx(x + w), this.toPx(y + br), this.toPx(br))          // 画右上角的弧		
    this.ctx.lineTo(this.toPx(x + w), this.toPx(y + h - br))                                                    // 画右边的线
    this.ctx.arcTo(this.toPx(x + w), this.toPx(y + h), this.toPx(x + w - br), this.toPx(y + h), this.toPx(br))  // 画右下角的弧
    this.ctx.lineTo(this.toPx(x + br), this.toPx(y + h))                                                        // 画下边的线
    this.ctx.arcTo(this.toPx(x), this.toPx(y + h), this.toPx(x), this.toPx(y + h - br), this.toPx(br))          // 画左下角的弧
    this.ctx.lineTo(this.toPx(x), this.toPx(y + br))                                                            // 画左边的线
    this.ctx.arcTo(this.toPx(x), this.toPx(y), this.toPx(x + br), this.toPx(y), this.toPx(br))                  // 画左上角的弧
    this.ctx.fillStyle = color
    if (shadow) {
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0
      this.ctx.shadowColor = 'rgba(126,124,124,0.3)'
      this.ctx.shadowBlur = 30
    }
    this.ctx.fill()
    this.ctx.restore()
  }
  getEllipse(x, y, w, h, style = 'fff', title = '', titleColor = '#666') {
    x = this.toPx(x)
    y = this.toPx(y)
    w = this.toPx(w)
    h = this.toPx(h)
    let r = h / 2
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.moveTo(x + r, y)
    this.ctx.lineTo(x + w - r, y)
    this.ctx.arcTo(x + w + r, y, x + w + r, y + r, r)
    this.ctx.lineTo(x + w + r, y - r)
    this.ctx.arcTo(x + w + r, y + h, x + w - r, y + h, r)
    this.ctx.lineTo(x + r, y + h)
    this.ctx.arcTo(x - r, y + h, x - r, y - r, r)
    this.ctx.lineTo(x - r, y + r)
    this.ctx.arcTo(x - r, y, x + r, y, r)
    this.ctx.fillStyle = style
    this.ctx.fill()
    this.ctx.restore()
    this.setDrawText(title, `${this.toPx(20)}px normal`, titleColor, this.toRpx(x) + 34, this.toRpx(y) + 30)
  }
  setShadowBox(x, y, width, height, ox, oy, color, blur) {
    this.ctx.shadowOffsetX = ox
    this.ctx.shadowOffsetY = oy
    this.ctx.shadowColor = color
    this.ctx.shadowBlur = blur
    this.ctx.fillRect(this.toPx(x), this.toPx(y), this.toPx(width), this.toPx(height))
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
    this.ctx.shadowColor = '#fff'
    this.ctx.shadowBlur = 0
  }
  toPx(rpx) {
    return rpx * this.factor;
  }
  toRpx(px) {
    return px / this.factor;
  }
}