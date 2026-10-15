/**
 * @file 任务中心页面
 */

import { getThemeClass } from '../../utils/util';

interface Task {
  id: string;
  title: string;
  desc?: string;
  subtitle?: string;
  icon: string;
  points: number;
  reward?: string;
  status: 'locked' | 'active' | 'done' | 'completed';
  current: number;
  target: number;
  progressPercent?: number;
}

interface PointsRecord {
  id: string;
  title: string;
  icon: string;
  points: number;
  type: 'earn' | 'spend';
  timeText: string;
  timestamp: number;
}

Component({
  data: {
    themeClass: '',
    userPoints: 0,
    levelTitle: '普通用户',
    levelProgress: 0,
    levelHint: '再获得100积分升级',
    dailyCompletedCount: 57,
    dailyTasks: [] as Task[],
    achievementTasks: [] as Task[],
    pointsHistory: [] as PointsRecord[]
  },

  lifetimes: {
    attached() {
      this.setData({ themeClass: getThemeClass() });
      this.loadUserPoints();
      this.loadDailyTasks();
      this.loadAchievementTasks();
      this.loadPointsHistory();
    }
  },

  methods: {
    /**
     * 加载用户积分
     */
    loadUserPoints() {
      try {
        const points = wx.getStorageSync('userPoints') || 0;
        
        // 计算等级
        let levelTitle = '普通用户';
        let levelProgress = 0;
        let levelHint = '';
        
        if (points < 100) {
          levelTitle = '普通用户';
          levelProgress = points;
          levelHint = `再获得${100 - points}积分升级`;
        } else if (points < 500) {
          levelTitle = '情感守护者';
          levelProgress = ((points - 100) / 400) * 100;
          levelHint = `再获得${500 - points}积分升级`;
        } else if (points < 1000) {
          levelTitle = '情绪解码者';
          levelProgress = ((points - 500) / 500) * 100;
          levelHint = `再获得${1000 - points}积分升级`;
        } else {
          levelTitle = '温柔诗人';
          levelProgress = 100;
          levelHint = '已达最高等级';
        }
        
        this.setData({
          userPoints: points,
          levelTitle,
          levelProgress,
          levelHint
        });
      } catch (error) {
        console.error('load user points error', error);
      }
    },

    /**
     * 加载每日任务
     */
    loadDailyTasks() {
      try {
        const letters = wx.getStorageSync('letters') || [];
        const helpReplies = wx.getStorageSync('helpReplies') || [];
        const today = new Date().toDateString();
        const completedTasks = wx.getStorageSync('completedDailyTasks') || {};
        
        // 统计今日数据
        const todayLetters = letters.filter((l: any) => {
          const createdDate = new Date(l.createdAt).toDateString();
          return createdDate === today;
        });
        
        const todayReplies = helpReplies.filter((r: any) => {
          const createdDate = new Date(r.createdAt).toDateString();
          return createdDate === today;
        });
        
        const tasks: Task[] = [
          {
            id: 'write_letter',
            title: '提笔一次',
            desc: '写下你今天的心情',
            icon: '✍️',
            points: 50,
            status: todayLetters.length >= 1 ? (completedTasks['write_letter'] ? 'completed' : 'done') : 'active',
            current: todayLetters.length,
            target: 1
          },
          {
            id: 'reply_help',
            title: '回信一次',
            desc: '为别人送去温暖',
            icon: '💌',
            points: 80,
            status: todayReplies.length >= 1 ? (completedTasks['reply_help'] ? 'completed' : 'done') : 'active',
            current: todayReplies.length,
            target: 1
          },
          {
            id: 'open_letter',
            title: '拆封一次',
            desc: '打开一封到期的信',
            icon: '📬',
            points: 30,
            status: 'active',
            current: 0,
            target: 1
          }
        ];
        
        this.setData({ dailyTasks: tasks });
      } catch (error) {
        console.error('load daily tasks error', error);
      }
    },

    /**
     * 加载成就任务
     */
    loadAchievementTasks() {
      try {
        const letters = wx.getStorageSync('letters') || [];
        const helpReplies = wx.getStorageSync('helpReplies') || [];
        const unlockedAchievements = wx.getStorageSync('unlockedAchievements') || [];
        const claimedAchievements = wx.getStorageSync('claimedAchievementRewards') || [];
        
        const tasks: Task[] = [
          {
            id: 'first_letter',
            title: '初见自己',
            subtitle: '你终于开始和自己对话了',
            icon: '✨',
            points: 100,
            reward: '樱花信纸',
            status: letters.length >= 1 ? (claimedAchievements.includes('first_letter') ? 'completed' : 'done') : (letters.length > 0 ? 'active' : 'locked'),
            current: letters.length,
            target: 1,
            progressPercent: Math.floor((letters.length / 1) * 100)
          },
          {
            id: 'gentle_persistence',
            title: '温柔的坚持',
            subtitle: '7天里，你没忘记对自己说：我很好',
            icon: '🌸',
            points: 300,
            reward: '专属信纸',
            status: unlockedAchievements.includes('gentle_persistence') ? (claimedAchievements.includes('gentle_persistence') ? 'completed' : 'done') : 'active',
            current: wx.getStorageSync('continuousDays') || 0,
            target: 7,
            progressPercent: Math.floor(((wx.getStorageSync('continuousDays') || 0) / 7) * 100)
          },
          {
            id: 'tree_guardian',
            title: '树洞守护者',
            subtitle: '你回的每句话，都像一束光',
            icon: '💡',
            points: 200,
            reward: '守护者徽章',
            status: helpReplies.length >= 5 ? (claimedAchievements.includes('tree_guardian') ? 'completed' : 'done') : 'active',
            current: helpReplies.length,
            target: 5,
            progressPercent: Math.floor((helpReplies.length / 5) * 100)
          }
        ];
        
        this.setData({ achievementTasks: tasks });
      } catch (error) {
        console.error('load achievement tasks error', error);
      }
    },

    /**
     * 加载积分记录
     */
    loadPointsHistory() {
      try {
        const history: PointsRecord[] = wx.getStorageSync('pointsHistory') || [];
        
        // 格式化时间
        const formattedHistory = history.map(record => ({
          ...record,
          timeText: this.formatTime(record.timestamp)
        })).slice(0, 10); // 只显示最近10条
        
        this.setData({ pointsHistory: formattedHistory });
      } catch (error) {
        console.error('load points history error', error);
      }
    },

    /**
     * 格式化时间
     */
    formatTime(timestamp: number): string {
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
      } else if (diff < 2 * day) {
        return '昨天';
      } else {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
      }
    },

    /**
     * 每日任务操作
     */
    onTaskAction(e: WechatMiniprogram.BaseEvent) {
      const id = e.currentTarget.dataset.id as string;
      const task = this.data.dailyTasks.find(t => t.id === id);
      
      if (!task) return;
      
      if (task.status === 'active') {
        // 跳转到对应功能
        this.navigateToTask(id);
      } else if (task.status === 'done') {
        // 领取奖励
        this.claimTaskReward(id, task.points, task.title);
      }
    },

    /**
     * 成就任务操作
     */
    onAchievementAction(e: WechatMiniprogram.BaseEvent) {
      const id = e.currentTarget.dataset.id as string;
      const task = this.data.achievementTasks.find(t => t.id === id);
      
      if (!task || task.status !== 'done') return;
      
      // 领取成就奖励
      this.claimAchievementReward(id, task.points, task.title);
    },

    /**
     * 跳转到任务对应功能
     */
    navigateToTask(taskId: string) {
      switch (taskId) {
        case 'write_letter':
          wx.navigateTo({ url: '/pages/write/write' });
          break;
        case 'reply_help':
          wx.navigateTo({ url: '/pages/help/index' });
          break;
        case 'open_letter':
          wx.navigateTo({ url: '/pages/letters/letters' });
          break;
      }
    },

    /**
     * 领取任务奖励
     */
    claimTaskReward(taskId: string, points: number, title: string) {
      try {
        // 增加积分
        const currentPoints = wx.getStorageSync('userPoints') || 0;
        const newPoints = currentPoints + points;
        wx.setStorageSync('userPoints', newPoints);
        
        // 记录已领取
        const completedTasks = wx.getStorageSync('completedDailyTasks') || {};
        completedTasks[taskId] = true;
        wx.setStorageSync('completedDailyTasks', completedTasks);
        
        // 添加积分记录
        this.addPointsHistory({
          title: `完成${title}`,
          icon: '✅',
          points,
          type: 'earn'
        });
        
        wx.showToast({
          title: `获得${points}积分`,
          icon: 'success'
        });
        
        // 刷新数据
        this.loadUserPoints();
        this.loadDailyTasks();
        this.loadPointsHistory();
      } catch (error) {
        console.error('claim task reward error', error);
        wx.showToast({
          title: '领取失败',
          icon: 'none'
        });
      }
    },

    /**
     * 领取成就奖励
     */
    claimAchievementReward(achievementId: string, points: number, title: string) {
      try {
        // 增加积分
        const currentPoints = wx.getStorageSync('userPoints') || 0;
        const newPoints = currentPoints + points;
        wx.setStorageSync('userPoints', newPoints);
        
        // 记录已领取
        const claimedAchievements = wx.getStorageSync('claimedAchievementRewards') || [];
        claimedAchievements.push(achievementId);
        wx.setStorageSync('claimedAchievementRewards', claimedAchievements);
        
        // 添加积分记录
        this.addPointsHistory({
          title: `解锁成就：${title}`,
          icon: '🏆',
          points,
          type: 'earn'
        });
        
        wx.showModal({
          title: '🎉 成就奖励',
          content: `恭喜你获得${points}积分！`,
          showCancel: false,
          confirmText: '太棒了',
          confirmColor: '#8b5cf6'
        });
        
        // 刷新数据
        this.loadUserPoints();
        this.loadAchievementTasks();
        this.loadPointsHistory();
      } catch (error) {
        console.error('claim achievement reward error', error);
        wx.showToast({
          title: '领取失败',
          icon: 'none'
        });
      }
    },

    /**
     * 添加积分记录
     */
    addPointsHistory(record: Omit<PointsRecord, 'id' | 'timestamp' | 'timeText'>) {
      try {
        const history: PointsRecord[] = wx.getStorageSync('pointsHistory') || [];
        const newRecord: PointsRecord = {
          ...record,
          id: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          timestamp: Date.now(),
          timeText: '刚刚'
        };
        
        history.unshift(newRecord);
        
        // 只保留最近100条记录
        if (history.length > 100) {
          history.length = 100;
        }
        
        wx.setStorageSync('pointsHistory', history);
      } catch (error) {
        console.error('add points history error', error);
      }
    }
  }
});
