/**
 * @file 帖子详情页 - 评论功能
 */

import { formatTime, getThemeClass } from '../../utils/util';

interface Post {
  id: string;
  title: string;
  content: string;
  targetDate: string;
  createdAt: number;
  createdAtText: string;
  likeCount: number;
  commentCount: number;
  userLiked?: boolean;
  communityTags?: Record<string, number>;
  userTags?: Record<string, boolean>;
}

interface Comment {
  id: string;
  postId: string;
  text: string;
  anonymousId: string;
  createdAt: number;
  timeText: string;
  likeCount: number;
  userLiked?: boolean;
  replies?: Reply[];
}

interface Reply {
  id: string;
  commentId: string;
  text: string;
  anonymousId: string;
  createdAt: number;
}

interface Tag {
  id: string;
  emoji: string;
  text: string;
}

Component({
  data: {
    themeClass: '',
    postId: '',
    post: null as Post | null,
    loadError: '',
    comments: [] as Comment[],
    sortType: 'latest' as 'latest' | 'hot',
    inputText: '',
    inputFocus: false,
    replyingTo: null as Comment | null,
    refreshing: false,
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20,
    availableTags: [
      { id: 'warm', emoji: '🤗', text: '温暖' },
      { id: 'resonate', emoji: '💓', text: '共鸣' },
      { id: 'healing', emoji: '🌈', text: '治愈' },
      { id: 'touching', emoji: '😢', text: '感动' }
    ] as Tag[]
  },

  lifetimes: {
    attached() {
      this.setData({ themeClass: getThemeClass() });
    }
  },

  pageLifetimes: {
    show() {
      // 获取页面参数
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1] as any;
      const options = currentPage.options;
      
      if (options && options.id) {
        this.setData({ postId: options.id });
        this.loadPost();
        this.loadComments();
      }
    }
  },

  methods: {
    /**
     * 预览图片
     */
    onPreviewImage(e: WechatMiniprogram.BaseEvent) {
      const { url, urls } = e.currentTarget.dataset;
      wx.previewImage({
        current: url,
        urls: urls || [url]
      });
    },

    /**
     * 加载帖子详情
     */
    async loadPost() {
      try {
        console.log('Loading post, postId:', this.data.postId);
        
        // 先尝试从云函数加载
        const res = await (wx as any).cloud.callFunction({
          name: 'letters',
          data: {
            action: 'getById',
            data: { id: this.data.postId }
          }
        });
        
        console.log('Cloud function response:', res.result);
        
        const post = res.result?.data;
        
        if (post) {
          console.log('Post found in cloud:', post.title);
          
          const userLikes = wx.getStorageSync('userPostLikes') || {};
          const userTags = wx.getStorageSync(`userTags_${post.id}`) || {};
          const commentCount = await this.getCommentCount(post.id);
          
          const displayPost: Post = {
            id: post.id,
            title: post.title,
            content: post.content,
            targetDate: post.targetDate,
            createdAt: post.createdAt,
            createdAtText: formatTime(new Date(post.createdAt)),
            likeCount: post.likeCount || 0,
            commentCount,
            userLiked: userLikes[post.id] || false,
            communityTags: post.communityTags || {},
            userTags
          };
          
          console.log('Setting post data:', displayPost);
          this.setData({ post: displayPost });
        } else {
          console.log('Post not found in cloud, trying local storage');
          
          // 如果云函数没有数据，尝试从本地存储读取
          const letters = wx.getStorageSync('letters') || [];
          const localPost = letters.find((l: any) => l.id === this.data.postId);
          
          if (localPost) {
            console.log('Post found in local storage:', localPost.title);
            
            const userLikes = wx.getStorageSync('userPostLikes') || {};
            const userTags = wx.getStorageSync(`userTags_${localPost.id}`) || {};
            const commentCount = await this.getCommentCount(localPost.id);
            
            const displayPost: Post = {
              id: localPost.id,
              title: localPost.title,
              content: localPost.content,
              targetDate: localPost.targetDate,
              createdAt: localPost.createdAt,
              createdAtText: formatTime(new Date(localPost.createdAt)),
              likeCount: localPost.likeCount || 0,
              commentCount,
              userLiked: userLikes[localPost.id] || false,
              communityTags: localPost.communityTags || {},
              userTags
            };
            
            this.setData({ post: displayPost });
          } else {
            console.error('Post not found anywhere, postId:', this.data.postId);
            this.setData({ loadError: '信件不存在或已被删除' });
            wx.showToast({ title: '信件不存在', icon: 'none' });
          }
        }
      } catch (error) {
        console.error('Load post error:', error);
        this.setData({ loadError: '加载失败，请稍后重试' });
        wx.showToast({ title: '加载失败，请重试', icon: 'none' });
      }
    },

    /**
     * 获取评论总数（包括回复）
     */
    async getCommentCount(postId: string): Promise<number> {
      try {
        const res = await (wx as any).cloud.callFunction({
          name: 'comments',
          data: {
            action: 'countByPost',
            data: { postId }
          }
        });
        return res.result?.count || 0;
      } catch (error) {
        console.error('Get comment count error:', error);
        return 0;
      }
    },

    /**
     * 加载评论列表
     */
    async loadComments() {
      try {
        const postId = this.data.postId;
        const { page, pageSize } = this.data;
        
        const res = await (wx as any).cloud.callFunction({
          name: 'comments',
          data: {
            action: 'listByPost',
            data: { postId, page, pageSize }
          }
        });
        
        if (!res.result?.ok) {
          throw new Error('获取评论失败');
        }
        
        const comments = res.result.list || [];
        
        // 格式化评论
        const formattedComments = comments.map((comment: any) => ({
          ...comment,
          id: comment._id,
          timeText: this.formatCommentTime(comment.createdAt),
          userLiked: false, // TODO: 实现点赞状态
          replies: (comment.replies || []).map((reply: any) => ({
            ...reply,
            id: reply._id,
            timeText: this.formatCommentTime(reply.createdAt)
          }))
        }));
        
        this.setData({
          comments: formattedComments,
          hasMore: formattedComments.length >= pageSize,
          loading: false,
          refreshing: false
        });
      } catch (error) {
        console.error('Load comments error:', error);
        this.setData({ loading: false, refreshing: false });
        wx.showToast({ title: '加载评论失败', icon: 'none' });
      }
    },

    /**
     * 格式化评论时间
     */
    formatCommentTime(timestamp: number): string {
      const now = Date.now();
      const diff = now - timestamp;
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      
      if (diff < minute) {
        return '刚刚';
      } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`;
      } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`;
      } else if (diff < 7 * day) {
        return `${Math.floor(diff / day)}天前`;
      } else {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    },

    /**
     * 切换排序方式
     */
    onSortChange(e: WechatMiniprogram.BaseEvent) {
      const type = e.currentTarget.dataset.type as 'latest' | 'hot';
      this.setData({ sortType: type, page: 1 });
      this.loadComments();
    },

    /**
     * 点赞帖子
     */
    onLike() {
      try {
        const post = this.data.post;
        if (!post) return;
        
        const userLikes = wx.getStorageSync('userPostLikes') || {};
        const isLiked = userLikes[post.id] || false;
        
        // 更新点赞状态
        userLikes[post.id] = !isLiked;
        wx.setStorageSync('userPostLikes', userLikes);
        
        // 更新帖子点赞数
        const letters = wx.getStorageSync('letters') || [];
        const letterIndex = letters.findIndex((l: any) => l.id === post.id);
        
        if (letterIndex !== -1) {
          letters[letterIndex].likeCount = (letters[letterIndex].likeCount || 0) + (isLiked ? -1 : 1);
          wx.setStorageSync('letters', letters);
        }
        
        // 更新页面显示
        this.setData({
          post: {
            ...post,
            likeCount: post.likeCount + (isLiked ? -1 : 1),
            userLiked: !isLiked
          }
        });
        
        if (!isLiked) {
          wx.vibrateShort({ type: 'light' });
        }
      } catch (error) {
        console.error('Like error:', error);
      }
    },

    /**
     * 点击标签
     */
    onTagClick(e: WechatMiniprogram.BaseEvent) {
      try {
        const tagId = e.currentTarget.dataset.tagId as string;
        const post = this.data.post;
        if (!post) return;
        
        const userTags = post.userTags || {};
        const isTagged = userTags[tagId] || false;
        
        // 更新用户标签状态
        userTags[tagId] = !isTagged;
        wx.setStorageSync(`userTags_${post.id}`, userTags);
        
        // 更新社区标签计数
        const letters = wx.getStorageSync('letters') || [];
        const letterIndex = letters.findIndex((l: any) => l.id === post.id);
        
        if (letterIndex !== -1) {
          const communityTags = letters[letterIndex].communityTags || {};
          communityTags[tagId] = (communityTags[tagId] || 0) + (isTagged ? -1 : 1);
          letters[letterIndex].communityTags = communityTags;
          wx.setStorageSync('letters', letters);
          
          // 更新页面显示
          this.setData({
            post: {
              ...post,
              communityTags: communityTags,
              userTags
            }
          });
        }
      } catch (error) {
        console.error('Tag click error:', error);
      }
    },

    /**
     * 点赞评论
     */
    async onCommentLike(e: WechatMiniprogram.BaseEvent) {
      try {
        const commentId = e.currentTarget.dataset.id as string;
        const comment = this.data.comments.find(c => c.id === commentId);
        if (!comment) return;
        
        const isLiked = comment.userLiked;
        
        // 调用云函数
        const res = await (wx as any).cloud.callFunction({
          name: 'comments',
          data: {
            action: 'toggleLike',
            data: {
              commentId,
              action: isLiked ? 'unlike' : 'like'
            }
          }
        });
        
        if (!res.result?.ok) {
          throw new Error('点赞失败');
        }
        
        // 更新页面显示
        const displayComments = this.data.comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              likeCount: c.likeCount + (isLiked ? -1 : 1),
              userLiked: !isLiked
            };
          }
          return c;
        });
        
        this.setData({ comments: displayComments });
        
        if (!isLiked) {
          wx.vibrateShort({ type: 'light' });
        }
      } catch (error) {
        console.error('Comment like error:', error);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    },

    /**
     * 输入框输入
     */
    onInput(e: WechatMiniprogram.Input) {
      this.setData({ inputText: e.detail.value || '' });
    },

    /**
     * 输入框获得焦点
     */
    onInputFocus() {
      this.setData({ inputFocus: true });
    },

    /**
     * 显示回复输入框
     */
    onShowReplyInput(e: WechatMiniprogram.BaseEvent) {
      const commentId = e.currentTarget.dataset.id as string;
      const comment = this.data.comments.find(c => c.id === commentId);
      
      if (comment) {
        this.setData({
          replyingTo: comment,
          inputFocus: true
        });
      }
    },

    /**
     * 取消回复
     */
    onCancelReply() {
      this.setData({
        replyingTo: null,
        inputText: '',
        inputFocus: false
      });
    },

    /**
     * 发送评论/回复
     */
    async onSend() {
      try {
        const { inputText, postId, replyingTo } = this.data;
        
        if (!inputText.trim()) {
          wx.showToast({ title: '请输入内容', icon: 'none' });
          return;
        }
        
        // 获取用户信息
        const userRes = await (wx as any).cloud.callFunction({
          name: 'letters',
          data: { action: 'getUserInfo', data: {} }
        });
        
        const user = userRes.result?.user || {};
        const nickName = user.nickName || '匿名用户';
        const avatarUrl = user.avatarUrl || '';
        
        // 创建评论或回复
        const commentRes = await (wx as any).cloud.callFunction({
          name: 'comments',
          data: {
            action: 'create',
            data: {
              postId,
              parentId: replyingTo ? replyingTo.id : null,
              content: inputText.trim(),
              nickName,
              avatarUrl,
              isAnonymous: true
            }
          }
        });
        
        if (!commentRes.result?.ok) {
          throw new Error('发送失败');
        }
        
        // 发送通知
        const letters = wx.getStorageSync('letters') || [];
        const post = letters.find((l: any) => l.id === postId);
        
        if (post && post._openid) {
          await (wx as any).cloud.callFunction({
            name: 'notifications',
            data: {
              action: 'create',
              data: {
                toOpenid: post._openid,
                type: replyingTo ? 'reply' : 'comment',
                postId,
                commentId: replyingTo ? replyingTo.id : commentRes.result._id,
                postTitle: post.title || '匿名来信',
                fromName: nickName,
                content: inputText.trim()
              }
            }
          });
        }
        
        // 重置输入框
        this.setData({
          inputText: '',
          replyingTo: null,
          inputFocus: false
        });
        
        // 重新加载评论和帖子
        await this.loadComments();
        
        const commentCount = await this.getCommentCount(postId);
        const currentPost = this.data.post;
        if (currentPost) {
          this.setData({
            post: {
              ...currentPost,
              commentCount
            }
          });
        }
        
        wx.showToast({
          title: replyingTo ? '回复成功' : '评论成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('Send comment error:', error);
        wx.showToast({ title: '发送失败', icon: 'none' });
      }
    },



    /**
     * 下拉刷新
     */
    onRefresh() {
      this.setData({ refreshing: true, page: 1 });
      this.loadPost();
      this.loadComments();
    },

    /**
     * 加载更多
     */
    onLoadMore() {
      const { loading, hasMore } = this.data;
      
      if (loading || !hasMore) return;
      
      this.setData({
        loading: true,
        page: this.data.page + 1
      });
      
      this.loadComments();
    }
  }
});
