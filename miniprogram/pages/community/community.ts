/**
 * @file 社区/广场页（匿名信墙）
 *
 * 说明：
 * - 通过云函数 `letters` 从云数据库集合 `letters` 加载数据
 * - 仅展示 shareable=true 且 published=true 的信件
 */

import { formatTime, getCommunityPosts, likePost, getThemeClass, updateLetter, notifyCommunityResonance, notifyCommunityComment } from '../../utils/util';
import { COPYWRITING } from '../../config/copywriting';

interface CommunityPost {
  /** 帖子 id（信件 id） */
  id: string;
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 目标日期（YYYY-MM-DD） */
  targetDate: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 点赞数 */
  likeCount: number;
  /** 创建时间展示 */
  createdAtText: string;
  /** 匿名标签计数 */
  communityTags?: Record<string, number>;
  /** 匿名短评列表 */
  comments?: Array<{id: string; text: string; time: number}>;
  /** 原信件标签（用于搜索） */
  tags?: string[];
}

Component({
  data: {
    tab: 'latest' as 'latest' | 'hot',
    posts: [] as CommunityPost[],
    refreshing: false,
    searchText: '',
    // 短评输入框
    commentInputVisible: '',
    commentText: '',
    // 可用标签
    availableTags: [
      { id: 'hug', text: '抱抱你', emoji: '🤗' },
      { id: 'understand', text: '我也懂', emoji: '🫂' },
      { id: 'cheer', text: '加油', emoji: '💪' },
      { id: 'warm', text: '好温暖', emoji: '☀️' },
    ],
    // 今日主题
    todayTheme: {
      title: '📅 今天的心事小主题',
      desc: '写下你今天最真实的一个情绪吧～'
    },
    // 陌生人的温柔
    warmReplies: [
      '💬 来自匿名朋友的话：你不是一个人，我也曾经历过这种迷茫～',
      '💬 来自匿名朋友的话：慢慢来，不必急着变好，先照顾自己～',
      '💬 来自匿名朋友的话：你的感受很重要，不用强迫自己坚强～'
    ],
    themePool: [
      { title: '📅 2026 马年愿望', desc: '写下今年最想实现的一件事吧～' },
      { title: '💼 年后跳槽的小焦虑', desc: '工作上的不安，欢迎在这里说出来～' },
      { title: '💗 想对谁说一句谢谢', desc: '把感谢写下来，会被温柔地看见～' },
      { title: '🌙 深夜emo时刻', desc: '如果今晚有点难过，也没关系～' },
      { title: '☀️ 小确幸清单', desc: '记录今天的小幸福，给自己一点光～' }
    ],
    themeClass: ''
  },
  lifetimes: {
    attached() {
      this.loadPosts();
      this.loadDailyTheme();
      this.setData({ themeClass: getThemeClass() });
      
      // 更新 tabBar 选中状态
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 1
        });
      }
    },
    show() {
      // 每次显示页面时刷新数据
      this.loadPosts();
      // 更新 tabBar 选中状态
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 1
        });
      }
    }
  },
  methods: {
    /**
     * 获取随机涂鸦
     */
    getRandomDoodle() {
      const doodles = ['🌱', '🌙', '✨', '☕', '🌸', '⭐', '🍃', '🎨'];
      return doodles[Math.floor(Math.random() * doodles.length)];
    },

    /**
     * 搜索输入
     */
    onSearchInput(e: WechatMiniprogram.Input) {
      const searchText = (e.detail.value || '').trim();
      this.setData({ searchText });
      this.loadPosts();
    },

    /**
     * 刷新
     */
    async onRefresh() {
      this.setData({ refreshing: true });
      await this.loadPosts();
      this.setData({ refreshing: false });
    },

    /**
     * 切换展示区最新/热门
     */
    onTabChange(e: WechatMiniprogram.BaseEvent) {
      const tab = (e.currentTarget.dataset.tab as 'latest' | 'hot') || 'latest';
      this.setData({ tab });
      this.loadPosts();
    },

    /**
     * 从云函数加载展示区帖子列表
     */
    async loadPosts() {
      try {
        const { tab, searchText } = this.data;
        const list = await getCommunityPosts(tab);
        
        // 排序：最新按创建时间倒序，热门按点赞数倒序
        let sortedList = [...list];
        if (tab === 'latest') {
          sortedList.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        } else {
          sortedList.sort((a: any, b: any) => (b.likeCount || 0) - (a.likeCount || 0));
        }
        
        const mapped: CommunityPost[] = sortedList.map((letter: any) => ({
          id: letter.id,
          title: letter.title || '匿名来信',
          content: letter.content || '',
          targetDate: letter.targetDate || '',
          createdAt: letter.createdAt || Date.now(),
          likeCount: letter.likeCount || 0,
          createdAtText: letter.createdAt ? formatTime(new Date(letter.createdAt)) : '',
          communityTags: letter.communityTags || {},
          comments: letter.comments || [],
          tags: Array.isArray(letter.tags) ? letter.tags : [],
          doodle: this.getRandomDoodle() // 添加随机涂鸦
        }));

        // 搜索：标题/内容/标签
        const keyword = (searchText || '').toLowerCase();
        const posts = keyword
          ? mapped.filter((p) => {
              const title = (p.title || '').toLowerCase();
              const content = (p.content || '').toLowerCase();
              const tags = (p.tags || []).join(' ').toLowerCase();
              return title.includes(keyword) || content.includes(keyword) || tags.includes(keyword);
            })
          : mapped;

        this.setData({ posts });
      } catch (error) {
        console.error('load community posts error', error);
        wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      }
    },

    /**
     * 生成今日主题
     */
    loadDailyTheme() {
      const pool = this.data.themePool || [];
      if (!pool.length) return;
      const today = new Date();
      const index = (today.getDate() + today.getMonth()) % pool.length;
      this.setData({ todayTheme: pool[index] });
    },

    /**
     * 点赞/共鸣（云函数）
     */
    async onLike(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;

      try {
        const success = await likePost(id);
        if (!success) {
          throw new Error('点赞失败');
        }

        wx.showToast({ title: COPYWRITING.community.resonanceToast, icon: 'none' });

        // 通知发件人
        try {
          const userInfo = wx.getStorageSync('userInfo') || {};
          const fromName = userInfo.nickName || '匿名朋友';
          notifyCommunityResonance(id, fromName);
        } catch {}

        this.loadPosts();
      } catch (error) {
        console.error('like post error', error);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    },

    /**
     * 点击标签
     */
    async onTagClick(e: WechatMiniprogram.BaseEvent) {
      const { postId, tagId } = e.currentTarget.dataset;
      if (!postId || !tagId) return;

      try {
        // 从云函数获取帖子数据
        const posts = await getCommunityPosts();
        const post = posts.find((p: any) => p.id === postId);
        if (!post) return;

        // 初始化标签计数
        const nextTags = { ...(post.communityTags || {}) };
        nextTags[tagId] = (nextTags[tagId] || 0) + 1;
        await updateLetter(postId, { communityTags: nextTags });

        const tag = this.data.availableTags.find(t => t.id === tagId);
        wx.showToast({ title: `已送出${tag?.text}`, icon: 'none' });
        this.loadPosts();
      } catch (error) {
        console.error('tag click error', error);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    },

    /**
     * 显示短评输入框
     */
    onShowCommentInput(e: WechatMiniprogram.BaseEvent) {
      const { id } = e.currentTarget.dataset;
      this.setData({ 
        commentInputVisible: id,
        commentText: ''
      });
    },

    /**
     * 短评输入
     */
    onCommentInput(e: WechatMiniprogram.Input) {
      this.setData({ commentText: e.detail.value });
    },

    /**
     * 提交短评
     */
    async onSubmitComment(e: WechatMiniprogram.BaseEvent) {
      const { id } = e.currentTarget.dataset;
      const text = this.data.commentText.trim();
      
      if (!text) {
        wx.showToast({ title: '请输入短评内容', icon: 'none' });
        return;
      }

      if (text.length > 10) {
        wx.showToast({ title: '短评最多10字', icon: 'none' });
        return;
      }

      // ===== 内容安全审核（合规要求）=====
      try {
        const checkResult = await checkContent(text);
        if (!checkResult.ok) {
          wx.showToast({ title: checkResult.errMsg || '短评包含不当内容', icon: 'none', duration: 3000 });
          return;
        }
      } catch (error) {
        console.error('Content check failed:', error);
        wx.showToast({ title: '内容审核失败，请稍后重试', icon: 'none' });
        return;
      }

      try {
        // 从云函数获取帖子数据
        const posts = await getCommunityPosts();
        const post = posts.find((p: any) => p.id === id);
        if (!post) return;

        // 添加短评
        const nextComments = [...(post.comments || [])];
        nextComments.push({
          id: `comment_${Date.now()}`,
          text,
          time: Date.now()
        });
        await updateLetter(id, { comments: nextComments });

        // 通知发件人
        try {
          const userInfo = wx.getStorageSync('userInfo') || {};
          const fromName = userInfo.nickName || '匿名朋友';
          notifyCommunityComment(id, text, fromName);
        } catch {}

        wx.showToast({ title: '短评已发送', icon: 'success' });
        this.setData({ 
          commentInputVisible: '',
          commentText: ''
        });
        this.loadPosts();
      } catch (error) {
        console.error('submit comment error', error);
        wx.showToast({ title: '发送失败', icon: 'none' });
      }
    },

    /**
     * 取消短评输入
     */
    onCancelComment() {
      this.setData({ 
        commentInputVisible: '',
        commentText: ''
      });
    },

    /**
     * 点击帖子卡片，跳转到详情页
     */
    onPostClick(e: WechatMiniprogram.BaseEvent) {
      const { id } = e.currentTarget.dataset;
      if (!id) return;
      
      wx.navigateTo({
        url: `/pages/post-detail/post-detail?id=${id}`
      });
    },

    /**
     * 阻止事件冒泡（用于子元素）
     */
    stopPropagation() {
      // 阻止事件冒泡
    }
  }
});

