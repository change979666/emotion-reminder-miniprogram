import { formatTime, getCachedUserId, getNotificationsForUser, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead, getThemeClass, getHelpLetters, getHelpReplies } from '../../utils/util';
import type { NotificationItem } from '../../utils/util';

type MessageViewItem = NotificationItem & {
  createdAtText: string;
  typeLabel: string;
  mainText: string;
  subText: string;
};

Component({
  data: {
    themeClass: '',
    userId: '',
    unreadCount: 0,
    helpStatus: {
      hasHelp: false,
      title: '',
      createdAtText: '',
      replyCount: 0,
      latestReplyContent: '',
      statusLabel: ''
    },
    messages: [] as MessageViewItem[]
  },
  lifetimes: {
    attached() {
      this.init();
    }
  },
  pageLifetimes: {
    show() {
      this.refresh();
    }
  },
  methods: {
    init() {
      const userId = getCachedUserId();
      this.setData({ userId, themeClass: getThemeClass() });
      this.refresh();
    },

    refresh() {
      try {
        this.loadHelpStatus();

        const userId = this.data.userId || getCachedUserId();
        if (!userId) {
          this.setData({ unreadCount: 0, messages: [] });
          return;
        }

        const list = getNotificationsForUser(userId);
        const unreadCount = getUnreadNotificationCount(userId);
        const messages: MessageViewItem[] = list.map((n) => {
          const createdAtText = n.createdAt ? formatTime(new Date(n.createdAt)) : '';
          const typeLabel = n.type === 'reply' ? '回复' : (n.type === 'comment' ? '评论' : '共鸣');
          const mainText = n.type === 'reply'
            ? `${n.fromName} 回复了你的评论`
            : (n.type === 'comment'
              ? `${n.fromName} 评论了你的发布《${n.postTitle}》`
              : `${n.fromName} 共鸣了你的发布《${n.postTitle}》`);
          const subText = (n.type === 'comment' || n.type === 'reply') ? (n.content || '') : '';
          return { ...n, createdAtText, typeLabel, mainText, subText };
        });

        this.setData({ unreadCount, messages });
      } catch (error) {
        console.error('messages refresh error', error);
        this.setData({ unreadCount: 0, messages: [] });
      }
    },

    async loadHelpStatus() {
      try {
        const helps = await getHelpLetters();
        if (!helps.length) {
          this.setData({
            helpStatus: {
              hasHelp: false,
              title: '',
              createdAtText: '',
              replyCount: 0,
              latestReplyContent: '',
              statusLabel: ''
            }
          });
          return;
        }

        const sortedHelps = helps.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        const latest = sortedHelps[0];
        const allReplies = await getHelpReplies();
        const replies = allReplies.filter((r: any) => r.letterId === latest.id);
        const replyCount = replies.length || 0;
        const latestReply = replyCount ? replies.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))[0] : null;
        const statusLabel = replyCount ? `已收到${replyCount}封回信` : '等待回信';

        this.setData({
          helpStatus: {
            hasHelp: true,
            title: latest.title || '我的树洞信',
            createdAtText: latest.createdAt ? formatTime(new Date(latest.createdAt)) : '',
            replyCount,
            latestReplyContent: latestReply ? latestReply.content : '还没有人回复，先给自己一点耐心。',
            statusLabel
          }
        });
      } catch (error) {
        console.error('load help status error', error);
      }
    },

    goHelpInbox() {
      wx.navigateTo({ url: '/pages/help/inbox' });
    },

    goHelpIndex() {
      wx.switchTab({ url: '/pages/help/index' });
    },

    /**
     * 跳转到社区广场
     */
    goToCommunity() {
      wx.switchTab({ url: '/pages/community/community' });
    },

    onOpenMessage(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      const postId = (e.currentTarget.dataset.postId as string) || '';
      if (!id) return;

      markNotificationRead(id);
      this.refresh();

      if (postId) {
        // 跳转到帖子详情页查看评论
        wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
      }
    },

    onMarkAllRead() {
      try {
        const userId = this.data.userId || getCachedUserId();
        if (!userId) return;
        markAllNotificationsRead(userId);
      } catch (error) {
        console.error('mark all read error', error);
      } finally {
        this.refresh();
      }
    }
  }
});
