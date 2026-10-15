/**
 * @file 解忧杂货铺 - 主页面
 */

import { formatTime, getHelpLettersForReply, saveHelpReply, getRepliesByLetterId, initSampleData, getThemeClass } from '../../utils/util';
import { COPYWRITING } from '../../config/copywriting';

interface HelpLetter {
  id: string;
  title: string;
  content: string;
  replyCount?: number;
}

interface HelpReply {
  _id: string;
  content: string;
  createdAt: number;
  createdAtText: string;
}

Component({
  data: {
    helps: [] as HelpLetter[],
    refreshing: false,
    showReplyPanel: false,
    currentHelp: {} as HelpLetter,
    replyContent: '',
    submitting: false,
    replyFocus: false,
    showReplies: false,
    replyLoading: false,
    currentReplies: [] as HelpReply[],
    // 捞取动画相关
    isPicking: false,
    pickedLetter: null as HelpLetter | null,
    showPickedCard: false,
    // 随机提示语
    pickMessage: '',
    // 随机提示语库
    pickMessages: [
      '💌 这封信来自一个深夜 emo 的人，需要你的安慰～',
      '✨ 你捞到了一个藏着小确幸的信封！',
      '🌙 这是一个需要陪伴的时刻，你愿意听吗？',
      '🌿 有人在迷雾里等待一束光，你愿意成为那束光吗？',
      '💐 这封信带着一些小悲伤，但也许你的话能温暖TA～',
      '🌸 你捞到了一个勇敢的灵魂，用温柔回应TA吧！'
    ],
    // 小惊喜提示
    surpriseMessages: [
      '🎁 你获得了一张\'治愈贴纸\'，可以装饰你的信纸～',
      '⭐ 祝贺！你解锁了\'温柔徽章\'，继续加油！',
      '🎉 你的暖心值 +10，越来越有爱了！'
    ],
    // 捞一捞随机反馈
    pickToastMessages: COPYWRITING.help.pickToast,
    // 回信引导轮播
    replyGuides: COPYWRITING.help.replyGuide,
    // 温柔回信模板
    replyTemplates: [
      '抱抱你～我懂这种孤独的感觉，你已经很勇敢了✨',
      '慢慢来，不用急着改变，先好好照顾自己～',
      '你的感受很重要，不用强迫自己开心～'
    ],
    themeClass: ''
  },
  lifetimes: {
    attached() {
      // 云开发模式下不需要初始化本地示例数据
      // initSampleData();
      this.loadHelps();
      this.setData({ themeClass: getThemeClass() });
      
      // 更新 tabBar 选中状态
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 2
        });
      }
    },
    show() {
      // 每次显示页面时刷新数据
      this.loadHelps();
      // 更新 tabBar 选中状态
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 2
        });
      }
    }
  },
  methods: {
    /**
     * 下拉刷新
     */
    async onRefresh() {
      this.setData({ refreshing: true });
      await this.loadHelps();
      this.setData({ refreshing: false });
    },

    /**
     * 从云函数拉取一批可被回复的求助信
     */
    async loadHelps() {
      try {
        const allHelps = await getHelpLettersForReply(20);
        const helps: HelpLetter[] = allHelps.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          replyCount: item.replyCount || 0
        }));
        this.setData({ helps });
      } catch (error) {
        console.error('loadHelps error', error);
        wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      }
    },

    /**
     * 捞一封信（带动画效果）
     */
    async onPickRandom() {
      if (this.data.isPicking) return;
      
      const { helps } = this.data;
      if (!helps.length) {
        wx.showToast({ title: '暂时没有可捞的信', icon: 'none' });
        return;
      }

      this.setData({ 
        isPicking: true,
        showPickedCard: false,
        pickedLetter: null
      });

      const toastMessage = this.data.pickToastMessages[
        Math.floor(Math.random() * this.data.pickToastMessages.length)
      ];
      wx.showToast({ title: toastMessage, icon: 'none' });

      await new Promise(resolve => setTimeout(resolve, 1000));

      const randomIndex = Math.floor(Math.random() * helps.length);
      const picked = helps[randomIndex];
      
      // 随机选择一条提示语
      const randomMessage = this.data.pickMessages[Math.floor(Math.random() * this.data.pickMessages.length)];
      
      // 10%概率触发小惊喜
      const isSurprise = Math.random() < 0.1;
      if (isSurprise) {
        const surpriseMsg = this.data.surpriseMessages[Math.floor(Math.random() * this.data.surpriseMessages.length)];
        // 保存到本地存储
        const surprises = wx.getStorageSync('surprises') || [];
        surprises.push({
          id: `surprise_${Date.now()}`,
          message: surpriseMsg,
          createdAt: Date.now()
        });
        wx.setStorageSync('surprises', surprises);
        
        // 显示惊喜提示
        wx.showModal({
          title: '🎁 小惊喜！',
          content: surpriseMsg,
          showCancel: false,
          confirmText: '好开心！'
        });
      }
      
      this.setData({
        isPicking: false,
        pickedLetter: picked,
        showPickedCard: false,
        pickMessage: randomMessage
      });

      setTimeout(() => {
        this.setData({ showPickedCard: true });
      }, 50);
    },

    /**
     * 跳过当前信件
     */
    onSkipHelp() {
      this.setData({
        showReplyPanel: false,
        replyContent: '',
        showReplies: false,
        currentReplies: []
      });
      setTimeout(() => {
        this.onPickRandom();
      }, 300);
    },

    /**
     * 评论（聚焦输入框）
     */
    onCommentTap() {
      this.setData({ replyFocus: true });
    },

    /**
     * 查看他人回复
     */
    async onToggleReplies() {
      const { showReplies } = this.data;
      if (showReplies) {
        this.setData({ showReplies: false });
        return;
      }
      await this.loadRepliesForCurrent();
    },

    /**
     * 打开捞到的信件详情
     */
    onOpenPickedLetter() {
      const { pickedLetter } = this.data;
      if (!pickedLetter) return;

      this.setData({
        showReplyPanel: true,
        currentHelp: pickedLetter,
        replyContent: '',
        replyFocus: false,
        showReplies: false,
        currentReplies: [],
        showPickedCard: false
      });
    },

    /**
     * 重新捞取
     */
    onRepick() {
      this.setData({
        showPickedCard: false,
        pickedLetter: null
      });
      this.onPickRandom();
    },

    /**
     * 打开回信面板
     */
    onOpenReply(e: WechatMiniprogram.BaseEvent) {
      const { id, title, content } = e.currentTarget.dataset as any;
      this.setData({
        showReplyPanel: true,
        currentHelp: {
          id,
          title,
          content
        },
        replyContent: '',
        replyFocus: false,
        showReplies: false,
        currentReplies: []
      });
    },

    /**
     * 关闭回信面板
     */
    onCloseReply() {
      if (this.data.submitting) return;
      const { pickedLetter } = this.data;
      this.setData({
        showReplyPanel: false,
        replyContent: '',
        replyFocus: false,
        showReplies: false,
        currentReplies: [],
        // 如果有捞到的信件，关闭后恢复显示
        showPickedCard: !!pickedLetter
      });
    },

    /**
     * 回信内容输入
     */
    onReplyContentChange(e: WechatMiniprogram.TextareaInput) {
      const replyContent = e.detail.value || '';
      this.setData({ replyContent, replyFocus: false });
    },

    /**
     * 使用回信模板
     */
    onUseTemplate(e: WechatMiniprogram.BaseEvent) {
      const text = (e.currentTarget.dataset.text as string) || '';
      if (!text) return;

      const current = this.data.replyContent || '';
      const next = current ? `${current}\n${text}` : text;
      this.setData({ replyContent: next, replyFocus: true });
    },

    /**
     * 加载当前信件的回复
     */
    async loadRepliesForCurrent() {
      const { currentHelp } = this.data;
      if (!currentHelp || !currentHelp.id) {
        wx.showToast({ title: '未选择信件', icon: 'none' });
        return;
      }
      this.setData({ replyLoading: true, showReplies: true });
      try {
        const replies = await getRepliesByLetterId(currentHelp.id);
        const formattedReplies: HelpReply[] = replies.map((item: any) => ({
          _id: item._id || item.id || `${item.letterId}_${item.createdAt}`,
          content: item.content,
          createdAt: item.createdAt,
          createdAtText: item.createdAt ? formatTime(new Date(item.createdAt)) : ''
        }));
        this.setData({ currentReplies: formattedReplies });
      } catch (error) {
        console.error('loadRepliesForCurrent error', error);
        wx.showToast({ title: '加载回复失败', icon: 'none' });
      } finally {
        this.setData({ replyLoading: false });
      }
    },

    /**
     * 提交回信
     */
    async onSubmitReply() {
      if (this.data.submitting) return;
      const { currentHelp, replyContent } = this.data;
      if (!replyContent) {
        wx.showToast({ title: '先写点想对ta说的话吧～', icon: 'none' });
        return;
      }
      if (!currentHelp || !currentHelp.id) {
        wx.showToast({ title: '没有可回复的信件', icon: 'none' });
        return;
      }

      this.setData({ submitting: true });

      try {
        const reply = {
          id: `${Date.now()}_${Math.floor(Math.random() * 100000)}`,
          letterId: currentHelp.id,
          content: replyContent,
          createdAt: Date.now()
        };

        const success = await saveHelpReply(reply);
        if (!success) {
          throw new Error('保存失败');
        }

        wx.showToast({ title: '回信已送达 💌', icon: 'success' });
        
        setTimeout(() => {
          this.setData({
            showReplyPanel: false,
            replyContent: '',
            pickedLetter: null,
            showPickedCard: false
          });
          this.loadHelps();
        }, 1500);
      } catch (error) {
        console.error('createReply error', error);
        wx.showToast({ title: '发送失败，请稍后重试', icon: 'none' });
      } finally {
        this.setData({ submitting: false });
      }
    },

    /**
     * 跳转到写求助信页面
     */
    goWrite() {
      wx.navigateTo({
        url: '/pages/help/write'
      });
    },

    /**
     * 跳转到我的树洞回信箱
     */
    goInbox() {
      wx.navigateTo({
        url: '/pages/help/inbox'
      });
    }
  }
});
