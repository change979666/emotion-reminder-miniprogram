/**
 * @file 写给未来自己的信 - 首页情感主页
 */

import { formatTime, getStats, getHelpLetters, initSampleFutureLetters, getOrInitUserId, getStoredPhone, setStoredPhone, getThemeClass, getUnreadNotificationCount, getCachedUserId } from '../../utils/util';
import { QUOTES } from '../../config/quotes';
import { grantAndShowSticker } from '../../utils/sticker-helper';

// 获取应用实例（后续如需用到全局数据可使用）
// const app = getApp<IAppOption>()

const defaultAvatarUrl =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

/**
 * 将长ID转换为6位短代码
 */
function generateShortId(longId: string): string {
  if (!longId) return '000000';
  // 简单哈希：取字符串的数字部分，然后取后6位
  const numStr = longId.replace(/\D/g, ''); // 只保留数字
  if (numStr.length >= 6) {
    return numStr.slice(-6); // 取后6位
  }
  // 如果数字不够，用字符串哈希填充
  let hash = 0;
  for (let i = 0; i < longId.length; i++) {
    hash = ((hash << 5) - hash) + longId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString().padStart(6, '0').slice(0, 6);
}

Component({
  data: {
    userInfo: {
      avatarUrl: defaultAvatarUrl,
      nickName: ''
    },
    hasUserInfo: false,
    userOpenId: '',
    shortUserId: '',
    userPhone: '',
    loggedIn: false,
    userPoints: 0,
    canIUseGetUserProfile: wx.canIUse('getUserProfile'),
    canIUseNicknameComp: wx.canIUse('input.type.nickname'),
    themeClass: '',
    todayText: '',
    todayMoodHint: '把现在的自己,给未来的你。',
    unreadMessageCount: 0,
    newStickerCount: 0,
    stats: {
      totalLetters: 0,
      upcomingLetters: 0,
      deliveredLetters: 0,
      receivedReplies: 0
    },
    achievements: {
      continuousDays: 0,
      totalPoints: 0
    },
    achievementCards: [] as Array<{
      id: string;
      title: string;
      subtitle: string;
      progressText: string;
      icon: string;
      status: 'locked' | 'active' | 'done';
    }>,
    helpStatus: {
      hasHelp: false,
      title: '',
      createdAtText: '',
      replyCount: 0,
      latestReplyContent: '',
      statusLabel: ''
    },
    // 每日温柔签
    showDailySign: false,
      dailySignMessage: '',
      dailyMoodOptions: [
        { id: 'happy', label: '开心', skin: 'sakura' },
        { id: 'calm', label: '平淡', skin: 'default' },
        { id: 'emo', label: 'emo', skin: 'star' },
        { id: 'hope', label: '期待', skin: 'star' }
      ],
      selectedDailyMood: 'calm'
  },
  lifetimes: {
    attached() {
      // 云开发模式下不需要初始化本地示例数据
      // initSampleFutureLetters();
      this.computeTodayText();
      this.loadStats();
      this.loadHelpStatus();
      this.loadAchievements();
      this.loadUserPoints();
      this.initUserId();
      this.initPhone();
      this.checkDailySign();
      this.setData({ themeClass: getThemeClass() });
      this.refreshMessageBadge();
      this.loadNewStickerCount();
      
      // 更新 tabBar 选中状态
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 0
        });
      }
    }
  },
  pageLifetimes: {
    show() {
      // 每次显示页面时刷新数据
      this.refreshMessageBadge();
      this.loadUserPoints();
      this.loadStats();
      this.loadHelpStatus();
      this.loadNewStickerCount();
      // 更新 tabBar 选中状态
      const tabBar = this.getTabBar();
      if (tabBar) {
        tabBar.setData({
          selected: 0
        });
      }
    }
  },
  methods: {
    async initUserId() {
      try {
        const id = await getOrInitUserId();
        const shortId = generateShortId(id);
        this.setData({ 
          userOpenId: id,
          shortUserId: shortId
        });
        this.updateLoginStatus();
        this.refreshMessageBadge();
        
        // 初始化后加载用户信息
        await this.loadUserInfo();
      } catch (e) {
        console.error('init user id error', e);
      }
    },

    /**
     * 从云端加载用户信息
     */
    async loadUserInfo() {
      try {
        const res = await (wx as any).cloud.callFunction({
          name: 'letters',
          data: {
            action: 'getUserInfo',
            data: {}
          }
        });
        
        if (res.result?.ok && res.result.user) {
          const user = res.result.user;
          const userInfo = {
            avatarUrl: user.avatarUrl || defaultAvatarUrl,
            nickName: user.nickName || ''
          };
          
          // 同步到本地存储
          wx.setStorageSync('userInfo', userInfo);
          
          this.setData({
            userInfo,
            hasUserInfo: !!(userInfo.nickName || userInfo.avatarUrl !== defaultAvatarUrl)
          });
          
          this.updateLoginStatus();
        }
      } catch (error) {
        console.log('Load user info from cloud failed, using local storage');
        // 云端加载失败，使用本地存储
        const localUserInfo = wx.getStorageSync('userInfo');
        if (localUserInfo) {
          this.setData({
            userInfo: localUserInfo,
            hasUserInfo: !!(localUserInfo.nickName || localUserInfo.avatarUrl !== defaultAvatarUrl)
          });
          this.updateLoginStatus();
        }
      }
    },

    refreshMessageBadge() {
      try {
        const uid = this.data.userOpenId || getCachedUserId();
        if (!uid) {
          this.setData({ unreadMessageCount: 0 });
          return;
        }
        const count = getUnreadNotificationCount(uid);
        this.setData({ unreadMessageCount: count });
      } catch {
        this.setData({ unreadMessageCount: 0 });
      }
    },

    /**
     * 加载新贴纸数量
     */
    async loadNewStickerCount() {
      try {
        const res = await (wx as any).cloud.callFunction({
          name: 'stickers',
          data: { action: 'getNewCount' }
        });
        const count = res.result?.count || 0;
        this.setData({ newStickerCount: count });
      } catch (error) {
        console.error('Load new sticker count error:', error);
        this.setData({ newStickerCount: 0 });
      }
    },

    goMessages() {
      wx.navigateTo({ url: '/pages/messages/messages' });
    },
    initPhone() {
      const phone = getStoredPhone();
      if (phone) {
        this.setData({ userPhone: phone });
        this.updateLoginStatus();
      }
    },
    updateLoginStatus() {
      const { hasUserInfo, userOpenId, userPhone } = this.data;
      this.setData({ loggedIn: !!(hasUserInfo || userOpenId || userPhone) });
    },
    /**
     * 计算今天文案
     */
    computeTodayText() {
      const today = new Date();
      const year = today.getFullYear();
      const month = `${today.getMonth() + 1}`.padStart(2, '0');
      const day = `${today.getDate()}`.padStart(2, '0');
      const weekMap = ['日', '一', '二', '三', '四', '五', '六'];
      const week = weekMap[today.getDay()];
      const todayText = `${year}.${month}.${day}  星期${week}`;
      this.setData({ todayText });
    },
    /**
     * 获取手机号（云函数）
     */
    async onGetPhoneNumber(e: WechatMiniprogram.ButtonGetPhoneNumber) {
      try {
        const detail = (e.detail as any) || {};
        const code = detail.code;
        if (!code) {
          wx.showToast({ title: '未获取到授权码', icon: 'none' });
          return;
        }
        if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
          wx.showToast({ title: '未开启云开发', icon: 'none' });
          return;
        }
        const res = await (wx as any).cloud.callFunction({
          name: 'phone',
          data: { code }
        });
        const phone = (res && res.result && res.result.phoneNumber) || '';
        if (phone) {
          setStoredPhone(phone);
          this.setData({ userPhone: phone });
          this.updateLoginStatus();
          wx.showToast({ title: '已绑定手机号', icon: 'success' });
        } else {
          wx.showToast({ title: '获取失败', icon: 'none' });
        }
      } catch (error) {
        console.error('get phone error', error);
        wx.showToast({ title: '获取失败', icon: 'none' });
      }
    },
    openSettings() {
      wx.navigateTo({
        url: '/pages/settings/settings'
      });
    },

    /**
     * 加载未来信件统计（云函数）
     */
    async loadStats() {
      try {
        const stats = await getStats();
        this.setData({
          stats
        });
        this.buildAchievementCards();
      } catch (error) {
        console.error('load stats error', error);
        this.setData({
          stats: {
            totalLetters: 0,
            upcomingLetters: 0,
            deliveredLetters: 0,
            receivedReplies: 0
          }
        });
        this.buildAchievementCards();
      }
    },

    /**
     * 加载成就数据
     */
    loadAchievements() {
      try {
        // 从本地存储获取连续写信天数和积分
        const continuousDays = wx.getStorageSync('continuousDays') || 0;
        const totalPoints = wx.getStorageSync('totalPoints') || 0;
        
        this.setData({
          achievements: {
            continuousDays,
            totalPoints
          }
        });
        this.buildAchievementCards();
      } catch (error) {
        console.error('load achievements error', error);
      }
    },

    /**
     * 构建成就名片
     */
    buildAchievementCards() {
      const { stats, achievements } = this.data;

      const cards: Array<{
        id: string;
        title: string;
        subtitle: string;
        progressText: string;
        icon: string;
        status: 'locked' | 'active' | 'done';
      }> = [
        {
          id: 'letters_10',
          title: '时光记录者',
          subtitle: '写满 10 封未来信',
          progressText: `${stats.totalLetters}/10`,
          icon: '📮',
          status: stats.totalLetters >= 10 ? 'done' : stats.totalLetters > 0 ? 'active' : 'locked'
        },
        {
          id: 'reply_3',
          title: '温柔回声',
          subtitle: '收到 3 封回信',
          progressText: `${stats.receivedReplies}/3`,
          icon: '💌',
          status: stats.receivedReplies >= 3 ? 'done' : stats.receivedReplies > 0 ? 'active' : 'locked'
        },
        {
          id: 'streak_3',
          title: '连续写信',
          subtitle: '连续 3 天写信',
          progressText: `${achievements.continuousDays}/3`,
          icon: '🔥',
          status: achievements.continuousDays >= 3 ? 'done' : achievements.continuousDays > 0 ? 'active' : 'locked'
        },
        {
          id: 'points_50',
          title: '温暖积攒',
          subtitle: '累积 50 积分',
          progressText: `${achievements.totalPoints}/50`,
          icon: '⭐',
          status: achievements.totalPoints >= 50 ? 'done' : achievements.totalPoints > 0 ? 'active' : 'locked'
        }
      ];

      this.setData({ achievementCards: cards });
    },

    /**
     * 加载树洞求助回信状态（云函数）
     */
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

        // 按创建时间排序，取最新的一条
        const sortedHelps = helps.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
        const latest = sortedHelps[0];
        
        // 获取该求助信的所有回信
        const replies = latest.replies || [];
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
      }
    },

    /**
     * 头像选择
     */
    async onChooseAvatar(e: WechatMiniprogram.CustomEvent) {
      const { avatarUrl } = (e.detail || {}) as { avatarUrl?: string };
      const newAvatarUrl = avatarUrl || defaultAvatarUrl;
      const { nickName } = this.data.userInfo;
      
      const newUserInfo = {
        ...this.data.userInfo,
        avatarUrl: newAvatarUrl
      };
      
      this.setData({
        userInfo: newUserInfo,
        hasUserInfo: !!nickName
      });
      
      // 保存到本地存储
      wx.setStorageSync('userInfo', newUserInfo);
      
      // 保存到云端
      try {
        const res = await (wx as any).cloud.callFunction({
          name: 'letters',
          data: {
            action: 'updateUserInfo',
            data: {
              updates: {
                avatarUrl: newAvatarUrl
              }
            }
          }
        });
        
        if (res.result?.ok) {
          wx.showToast({ title: '头像已保存', icon: 'success', duration: 1500 });
        }
      } catch (error) {
        console.error('Update avatar error:', error);
        wx.showToast({ title: '保存到云端失败', icon: 'none' });
      }
      
      this.updateLoginStatus();
    },
    /**
     * 昵称输入
     */
    onInputChange(e: WechatMiniprogram.Input) {
      const nickName = e.detail.value || '';
      // 只更新昵称值，不立即设置hasUserInfo，避免输入框消失
      this.setData({
        'userInfo.nickName': nickName
      });
    },

    /**
     * 昵称输入确认
     */
    async onInputConfirm(e: WechatMiniprogram.Input) {
      const nickName = e.detail.value || '';
      if (!nickName) return;

      const newUserInfo = {
        ...this.data.userInfo,
        nickName
      };

      this.setData({
        userInfo: newUserInfo,
        hasUserInfo: true
      });
      
      // 保存到本地存储
      wx.setStorageSync('userInfo', newUserInfo);
      
      // 保存到云端
      try {
        const res = await (wx as any).cloud.callFunction({
          name: 'letters',
          data: {
            action: 'updateUserInfo',
            data: {
              updates: {
                nickName,
                avatarUrl: newUserInfo.avatarUrl
              }
            }
          }
        });
        
        if (res.result?.ok) {
          wx.showToast({ title: '昵称已保存', icon: 'success' });
        }
      } catch (error) {
        console.error('Update nickname error:', error);
        wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
      }
      
      this.updateLoginStatus();
    },

    /**
     * 每日心情选择
     */
    onSelectDailyMood(e: WechatMiniprogram.BaseEvent) {
      const mood = (e.currentTarget.dataset.mood as string) || 'calm';
      this.setData({ selectedDailyMood: mood });
    },

    /**
     * 应用每日心情：解锁皮肤 + 记签到天数
     */
    applyDailyMood() {
      try {
        const { dailyMoodOptions, selectedDailyMood } = this.data;
        const selected = dailyMoodOptions.find(item => item.id === selectedDailyMood) || dailyMoodOptions[1];
        const unlockedSkins = wx.getStorageSync('unlockedSkins') || ['default'];
        if (selected && !unlockedSkins.includes(selected.skin)) {
          unlockedSkins.push(selected.skin);
          wx.setStorageSync('unlockedSkins', unlockedSkins);
        }
        wx.setStorageSync('activeSkin', selected?.skin || 'default');

        const signInDays = Number(wx.getStorageSync('signInDays') || 0) + 1;
        wx.setStorageSync('signInDays', signInDays);

        this.setData({ themeClass: getThemeClass() });
      } catch (error) {
        console.error('apply daily mood error', error);
      }
    },

    /**
     * 昵称输入失焦
     */
    async onInputBlur(e: WechatMiniprogram.Input) {
      const nickName = e.detail.value || '';
      if (nickName) {
        const newUserInfo = {
          ...this.data.userInfo,
          nickName
        };
        
        this.setData({
          hasUserInfo: true
        });
        
        // 保存到本地存储
        wx.setStorageSync('userInfo', newUserInfo);
        
        // 保存到云端
        try {
          await (wx as any).cloud.callFunction({
            name: 'letters',
            data: {
              action: 'updateUserInfo',
              data: {
                updates: {
                  nickName
                }
              }
            }
          });
        } catch (error) {
          console.error('Update nickname error:', error);
        }
        
        this.updateLoginStatus();
      }
    },

    /**
     * 使用微信授权获取头像昵称
     */
    getUserProfile() {
      wx.getUserProfile({
        desc: '用于在页面展示头像和昵称',
        success: (res) => {
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          });
        }
      });
    },

    /**
     * 跳转到写未来信页面
     */
    goWriteLetter() {
      wx.navigateTo({
        url: '/pages/write/write'
      });
    },

    /**
     * 快速记录今日心情
     */
    quickMoodRecord() {
      wx.navigateTo({
        url: '/pages/write/write?quickMood=true'
      });
    },

    /**
     * 跳转到我的信箱
     */
    goMyLetters() {
      wx.navigateTo({
        url: '/pages/letters/letters'
      });
    },

    /**
     * 跳转到解忧杂货铺（主页面）
     */
    goHelpWrite() {
      wx.switchTab({
        url: '/pages/help/index'
      });
    },

    /**
     * 跳转到成长报告
     */
    goReport() {
      wx.navigateTo({
        url: '/pages/report/report'
      });
    },

    /**
     * 跳转到成就页面
     */
    goAchievements() {
      wx.navigateTo({
        url: '/pages/achievements/achievements'
      });
    },

    /**
     * 跳转到贴纸页面
     */
    goStickers() {
      wx.navigateTo({
        url: '/pages/stickers/stickers'
      });
    },

    /**
     * 跳转到任务中心
     */
    goToTaskCenter() {
      wx.navigateTo({
        url: '/pages/task-center/task-center'
      });
    },

    /**
     * 加载用户积分
     */
    loadUserPoints() {
      try {
        const points = wx.getStorageSync('userPoints') || 0;
        this.setData({ userPoints: points });
      } catch (error) {
        console.error('load user points error', error);
      }
    },

    /**
     * 检查是否需要显示每日温柔签
     */
    checkDailySign() {
      try {
        const today = new Date().toDateString();
        const lastSignDate = wx.getStorageSync('lastDailySignDate');
        
        // 如果今天还没有显示过，则显示
        if (lastSignDate !== today) {
          const randomSign = QUOTES[Math.floor(Math.random() * QUOTES.length)];
          
          setTimeout(() => {
            this.setData({
              showDailySign: true,
              dailySignMessage: randomSign
            });
          }, 800);
          
          wx.setStorageSync('lastDailySignDate', today);
        }
      } catch (error) {
        console.error('check daily sign error', error);
      }
    },

    /**
     * 关闭每日温柔签
     */
    async onCloseDailySign() {
      this.applyDailyMood();
      this.setData({ showDailySign: false });
      
      // 赠送每日签到贴纸
      await this.grantDailySticker();
    },

    /**
     * 赠送每日签到贴纸
     */
    async grantDailySticker() {
      try {
        // 使用工具函数赠送贴纸
        const isNew = await grantAndShowSticker('daily');
        
        // 如果获得了新贴纸，刷新贴纸数量
        if (isNew) {
          this.loadNewStickerCount();
        }
      } catch (error) {
        console.error('Grant daily sticker error:', error);
      }
    },

    
  }
});
