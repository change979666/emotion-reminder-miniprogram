Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "个人"
      },
      {
        pagePath: "/pages/community/community",
        text: "社区"
      },
      {
        pagePath: "/pages/help/index",
        text: "解忧"
      }
    ]
  },
  
  methods: {
    switchTab(e: WechatMiniprogram.BaseEvent) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      const index = data.index;
      wx.switchTab({ url });
      this.setData({
        selected: index
      });
    }
  }
});
