/**
 * @file 树洞互助 - 帮别人回信
 */

import { formatTime, getHelpLettersForReply, saveHelpReply, getRepliesByLetterId, initSampleData, generateReplySuggestion, checkContent, checkAchievements, addUserPoints } from '../../utils/util';
import { grantAndShowSticker } from '../../utils/sticker-helper';

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
    isPicking: false, // 是否正在捞取
    pickedLetter: null as HelpLetter | null, // 捞到的信件
    showPickedCard: false, // 是否显示捞到的卡片
    pickAnimation: false, // 捞取动画状态
    aiGenerating: false // AI 生成回复建议中
  },
  lifetimes: {
    attached() {
      // 初始化示例数据（如果为空）
      initSampleData();
      this.loadHelps();
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

      // 开始捞取动画
      this.setData({ 
        isPicking: true,
        pickAnimation: true,
        showPickedCard: false,
        pickedLetter: null
      });

      // 模拟捞取过程（1秒动画）
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 随机选择一封信
      const randomIndex = Math.floor(Math.random() * helps.length);
      const picked = helps[randomIndex];

      // 显示捞到的信件
      this.setData({
        pickedLetter: picked,
        pickAnimation: false,
        showPickedCard: true
      });

      // 延迟显示回复按钮
      setTimeout(() => {
        this.setData({ isPicking: false });
      }, 500);
    },

    /**
     * 跳过当前信件（关闭回复面板，重新捞取）
     */
    onSkipHelp() {
      this.setData({
        showReplyPanel: false,
        replyContent: '',
        showReplies: false,
        currentReplies: []
      });
      // 延迟一下再重新捞取，让关闭动画完成
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
     * 打开捞到的信件详情（显示回复面板）
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
        showPickedCard: false // 关闭捞取卡片
      });
    },

    /**
     * 重新捞取（跳过当前信件）
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
      this.setData({
        showReplyPanel: false,
        replyContent: '',
        replyFocus: false,
        showReplies: false,
        currentReplies: []
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
     * 加载当前信件的回复（云函数）
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
     * 提交回信（云函数）
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

      // ===== 内容安全审核（合规要求）=====
      try {
        const checkResult = await checkContent(replyContent);
        if (!checkResult.ok) {
          wx.showToast({ title: checkResult.errMsg || '回信包含不当内容', icon: 'none', duration: 3000 });
          this.setData({ submitting: false });
          return;
        }
      } catch (error) {
        console.error('Content check failed:', error);
        wx.showToast({ title: '内容审核失败，请稍后重试', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

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

        // 检查成就解锁
        checkAchievements('sendReply');
        
        // 增加回信积分
        addUserPoints(80, '为他人送去温暖回信');

        // 赠送贴纸
        grantAndShowSticker('reply', 'healing');

        wx.showToast({ title: '回信已送达 💌', icon: 'success' });
        
        // 延迟关闭，让用户看到成功提示
        setTimeout(() => {
          this.setData({
            showReplyPanel: false,
            replyContent: '',
            pickedLetter: null,
            showPickedCard: false
          });
          this.loadHelps(); // 刷新列表
        }, 1500);
      } catch (error) {
        console.error('createReply error', error);
        wx.showToast({ title: '发送失败，请稍后重试', icon: 'none' });
      } finally {
        this.setData({ submitting: false });
      }
    },

    /**
     * AI 智能回复建议
     */
    async onAIReplysuggestion() {
      const { currentHelp } = this.data;
      if (!currentHelp || !currentHelp.content) {
        wx.showToast({ title: '无法获取信件内容', icon: 'none' });
        return;
      }

      this.setData({ aiGenerating: true });
      try {
        const suggestion = await generateReplySuggestion(currentHelp.content);
        wx.showModal({
          title: 'AI 回复建议',
          content: suggestion,
          confirmText: '采用',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.setData({ 
                replyContent: suggestion,
                replyFocus: true 
              });
            }
          }
        });
      } catch (error: any) {
        wx.showToast({ 
          title: error.message || 'AI 生成失败', 
          icon: 'none' 
        });
      } finally {
        this.setData({ aiGenerating: false });
      }
    }
  }
});
