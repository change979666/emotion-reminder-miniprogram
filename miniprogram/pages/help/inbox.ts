/**
 * @file 树洞互助 - 我的树洞回信箱
 */

import { formatTime, getHelpLetters, getThemeClass } from '../../utils/util';

interface HelpReply {
  _id: string;
  content: string;
  createdAt: number;
  createdAtText: string;
}

interface HelpWithReplies {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  createdAtText: string;
  replies: HelpReply[];
  status: 'pending' | 'replied'; // 状态：待回复/已回复
  expectedReplyTime?: string; // 预计回复时间
}

Component({
  data: {
    helps: [] as HelpWithReplies[],
    refreshing: false,
    themeClass: ''
  },
  lifetimes: {
    attached() {
      this.loadHelps();
      this.setData({ themeClass: getThemeClass() });
    }
  },
  methods: {
    onRefresh() {
      this.setData({ refreshing: true });
      this.loadHelps();
      this.setData({ refreshing: false });
    },

    /**
     * 打开治愈小纸条
     */
    goCards() {
      wx.navigateTo({
        url: '/pages/cards/cards'
      });
    },

    /**
     * 加载我发过的树洞求助和收到的回信（云函数）
     */
    async loadHelps() {
      try {
        const myHelps = await getHelpLetters();
        // 云函数返回的数据已经包含了 replies
        
        // 为每个求助信匹配对应的回信
        const helps: HelpWithReplies[] = myHelps
          .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
          .map((item: any) => {
            const replies = (item.replies || [])
              .sort((a: any, b: any) => (a.createdAt || 0) - (b.createdAt || 0))
              .map((r: any) => ({
                _id: r._id || r.id || `${r.letterId}_${r.createdAt}`,
                content: r.content,
                createdAt: r.createdAt,
                createdAtText: r.createdAt ? formatTime(new Date(r.createdAt)) : ''
              }));
            
            // 计算状态
            const status = replies.length > 0 ? 'replied' : 'pending';
            
            // 计算预计回复时间（如果还没有回复）
            let expectedReplyTime = '';
            if (status === 'pending') {
              const hoursSinceCreated = (Date.now() - item.createdAt) / (1000 * 60 * 60);
              if (hoursSinceCreated < 24) {
                expectedReplyTime = `预计 ${Math.ceil(24 - hoursSinceCreated)} 小时内收到回信`;
              } else {
                expectedReplyTime = '正在等待温柔的回复...';
              }
            }
            
            // 计算预期回信数量（基于发布时长，每24小时预期1-3封）
            const daysSinceCreated = Math.floor((Date.now() - item.createdAt) / (1000 * 60 * 60 * 24));
            const expectedReplies = Math.max(1, Math.min(daysSinceCreated * 2, 10)); // 最少1封，最多10封
            
            return {
              id: item.id,
              title: item.title,
              content: item.content,
              createdAt: item.createdAt,
              createdAtText: item.createdAt ? formatTime(new Date(item.createdAt)) : '',
              replies,
              status,
              expectedReplyTime,
              expectedReplies
            };
          });
        
        this.setData({ helps });
      } catch (error) {
        console.error('loadMyHelps error', error);
        wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      }
    },

    /**
     * 生成治愈小纸条
     */
    onGenerateCard(e: WechatMiniprogram.BaseEvent) {
      const { helpId, replyContent } = e.currentTarget.dataset;
      if (!replyContent) {
        wx.showToast({ title: '这封回信还没有内容', icon: 'none' });
        return;
      }

      // 提取暖心句子（取50字以内）
      const quote = replyContent.length > 50 ? replyContent.slice(0, 47) + '...' : replyContent;

      // 保存到本地收藏
      try {
        const cards = wx.getStorageSync('healingCards') || [];
        cards.push({
          id: `card_${Date.now()}`,
          quote,
          fullContent: replyContent,
          helpId,
          createdAt: Date.now()
        });
        wx.setStorageSync('healingCards', cards);

        wx.showModal({
          title: '治愈小纸条',
          content: `“${quote}”\n\n已保存到你的收藏，可以在个人中心查看`,
          showCancel: false,
          confirmText: '好的'
        });
      } catch (error) {
        console.error('generate card error', error);
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    }
  }
});

