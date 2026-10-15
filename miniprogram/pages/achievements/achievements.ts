/**
 * @file 成就系统页面
 */

import { getLetters, getHelpLetters, getHelpReplies, getThemeClass } from '../../utils/util';

interface Achievement {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  status: 'locked' | 'inProgress' | 'completed';
  progressText: string;
  progressPercent: number;
  current: number;
  target: number;
  reward?: string;
  category: 'growth' | 'connection' | 'healing' | 'special';
}

// 成就定义列表（情感化设计）
const ACHIEVEMENT_DEFINITIONS = [
  // ✨ 自我成长类（聚焦「与自己对话」）
  {
    id: 'first_letter',
    title: '初见自己',
    subtitle: '你终于开始和自己对话了，这封信是勇敢的起点',
    icon: '✨',
    target: 1,
    reward: '解锁樱花信纸',
    category: 'growth' as const
  },
  {
    id: 'future_letters',
    title: '时间的信使',
    subtitle: '你把此刻的自己，寄给了未来的你。时间会回答',
    icon: '⏰',
    target: 1,
    reward: '+20积分',
    category: 'growth' as const
  },
  {
    id: 'emotion_tags',
    title: '情绪解码者',
    subtitle: '你开始读懂自己的情绪了，标签是心的密码',
    icon: '🎭',
    target: 3,
    reward: '+30积分',
    category: 'growth' as const
  },
  {
    id: 'gentle_persistence',
    title: '温柔的坚持',
    subtitle: '7天里，你没忘记对自己说一句：「我很好」',
    icon: '🌸',
    target: 7,
    reward: '+100积分 | 专属信纸',
    category: 'growth' as const
  },
  {
    id: 'hundred_letters',
    title: '写满100封',
    subtitle: '100封信，100个你。你已走过100个情绪角落',
    icon: '📖',
    target: 100,
    reward: '+500积分 | 传奇徽章',
    category: 'growth' as const
  },
  
  // 💬 温暖连接类（聚焦「与他人共鸣」）
  {
    id: 'tree_hole_guardian',
    title: '树洞守护者',
    subtitle: '你回的每句话，都像一束光，照进了别人的树洞',
    icon: '💡',
    target: 5,
    reward: '+80积分',
    category: 'connection' as const
  },
  {
    id: 'resonance_ripple',
    title: '共鸣的涟漪',
    subtitle: '你的文字成了别人的光，涟漪扩散了10次',
    icon: '🌊',
    target: 10,
    reward: '+100积分',
    category: 'connection' as const
  },
  {
    id: 'late_night_listener',
    title: '深夜倾听者',
    subtitle: '当世界睡着时，你依然在和自己对话',
    icon: '🌙',
    target: 3,
    reward: '+50积分 | 夜空主题',
    category: 'connection' as const
  },
  {
    id: 'thanks_seed',
    title: '感谢的种子',
    subtitle: '你种下了一颗感谢的种子，它正在发芽',
    icon: '🌱',
    target: 1,
    reward: '+30积分',
    category: 'connection' as const
  },
  
  // 🌈 深度治愈类（聚焦「情感深化」）
  {
    id: 'see_own_light',
    title: '看见自己的光',
    subtitle: '你开始学会温柔地打磨自己，像打磨一颗星星',
    icon: '⭐',
    target: 3,
    reward: '+50积分',
    category: 'healing' as const
  },
  {
    id: 'emotion_archaeologist',
    title: '情绪的考古学家',
    subtitle: '你翻出过去的自己，像考古学家发现宝藏',
    icon: '🔍',
    target: 3,
    reward: '+40积分',
    category: 'healing' as const
  },
  {
    id: 'unfinished_wholeness',
    title: '未完成的圆满',
    subtitle: '你寄出的信，终被未来的自己接住',
    icon: '💌',
    target: 1,
    reward: '+20积分',
    category: 'healing' as const
  },
  {
    id: 'worry_poet',
    title: '解忧的诗人',
    subtitle: '你的一句「我懂」，成了别人的解药',
    icon: '🎐',
    target: 1,
    reward: '+30积分',
    category: 'healing' as const
  },
  
  // 🌟 深度探索成就
  {
    id: 'emotion_explorer',
    title: '情绪探索者',
    subtitle: '你尝试了5种不同的心情，开始理解自己的多面',
    icon: '🎨',
    target: 5,
    reward: '+60积分',
    category: 'growth' as const
  },
  {
    id: 'night_companion',
    title: '夜晚的陪伴者',
    subtitle: '深夜写下的文字，是对自己最深的陪伴',
    icon: '🌃',
    target: 5,
    reward: '+80积分 | 夜色信纸',
    category: 'special' as const
  }
];

Component({
  data: {
    themeClass: '',
    activeFilter: 'all' as 'all' | 'completed' | 'inProgress' | 'locked',
    achievements: [] as Achievement[],
    filteredAchievements: [] as Achievement[],
    completedCount: 0,
    inProgressCount: 0,
    lockedCount: 0
  },

  lifetimes: {
    attached() {
      this.setData({ themeClass: getThemeClass() });
      this.loadAchievements();
    }
  },

  methods: {
    /**
     * 加载成就数据
     */
    async loadAchievements() {
      try {
        // 获取用户数据
        const letters = await getLetters();
        const helpLetters = await getHelpLetters();
        const helpReplies = await getHelpReplies();
        const continuousDays = wx.getStorageSync('continuousDays') || 0;
        const unlockedAchievements: string[] = wx.getStorageSync('unlockedAchievements') || [];

        // 计算各项数据
        const totalLetters = letters.length;
        const deliveredLetters = letters.filter((l: any) => {
          const today = new Date();
          const targetDate = new Date(l.targetDate);
          return targetDate < today;
        }).length;
        
        // 计算我写的回信数量
        const myRepliesCount = helpReplies.length;
        
        // 计算我收到的回信数量（需要匹配我的求助信）
        const myHelpLetterIds = helpLetters.map((h: any) => h.id);
        const receivedRepliesCount = helpReplies.filter((r: any) => 
          myHelpLetterIds.includes(r.letterId)
        ).length;
        
        // 计算收到的点赞总数
        const totalLikes = letters.reduce((sum: number, l: any) => sum + (l.likeCount || 0), 0);
        
        // 计算使用过的不同情绪标签数量
        const uniqueMoods = new Set(letters.filter((l: any) => l.mood).map((l: any) => l.mood));
        const uniqueMoodCount = uniqueMoods.size;
        
        // 计算深夜写信次数（23:00-2:00）
        const lateNightLetters = letters.filter((l: any) => {
          if (!l.createdAt) return false;
          const hour = new Date(l.createdAt).getHours();
          return hour >= 23 || hour <= 2;
        }).length;
        
        // 计算AI优化使用次数（需要在写信时记录，这里暂用总信件数的一个估算）
        const aiOptimizedCount = wx.getStorageSync('aiOptimizedCount') || 0;
        
        // 计算重复阅读信件的次数（查看已到期信件的次数）
        const letterViewCount = letters.filter((l: any) => {
          const targetDate = new Date(l.targetDate);
          const today = new Date();
          return targetDate < today && (l.readCount || 0) > 0;
        }).length;

        // 构建成就列表
        const achievements: Achievement[] = ACHIEVEMENT_DEFINITIONS.map(def => {
          let current = 0;
          
          // 根据成就ID计算当前进度
          switch (def.id) {
            // ✨ 自我成长类
            case 'first_letter':
              current = totalLetters;
              break;
            case 'future_letters':
              current = letters.filter((l: any) => {
                const targetDate = new Date(l.targetDate);
                const today = new Date();
                return targetDate >= today;
              }).length;
              break;
            case 'emotion_tags':
              current = uniqueMoodCount;
              break;
            case 'gentle_persistence':
              current = continuousDays;
              break;
            case 'hundred_letters':
              current = totalLetters;
              break;
            
            // 💬 温暖连接类
            case 'tree_hole_guardian':
              current = myRepliesCount;
              break;
            case 'resonance_ripple':
              current = totalLikes;
              break;
            case 'late_night_listener':
              current = lateNightLetters;
              break;
            case 'thanks_seed':
              // 检查是否发布过"感谢"相关的社区贴贴
              current = letters.filter((l: any) => 
                l.published && (l.title?.includes('谢谢') || l.content?.includes('感谢') || l.content?.includes('谢谢'))
              ).length;
              break;
            
            // 🌈 深度治愈类
            case 'see_own_light':
              current = aiOptimizedCount;
              break;
            case 'emotion_archaeologist':
              current = letterViewCount;
              break;
            case 'unfinished_wholeness':
              current = deliveredLetters;
              break;
            case 'worry_poet':
              current = receivedRepliesCount;
              break;
            
            // 🌟 深度探索成就
            case 'emotion_explorer':
              current = uniqueMoodCount;
              break;
            case 'night_companion':
              current = lateNightLetters;
              break;
          }

          // 判断状态（优先使用已解锁记录）
          let status: 'locked' | 'inProgress' | 'completed' = 'locked';
          if (unlockedAchievements.includes(def.id)) {
            status = 'completed';
          } else if (current >= def.target) {
            // 数据满足条件但未记录解锁，标记为已完成
            status = 'completed';
          } else if (current > 0) {
            status = 'inProgress';
          }

          // 计算进度百分比
          const progressPercent = Math.min((current / def.target) * 100, 100);
          const progressText = `${current}/${def.target}`;

          return {
            id: def.id,
            title: def.title,
            subtitle: def.subtitle,
            icon: def.icon,
            status,
            progressText,
            progressPercent,
            current,
            target: def.target,
            reward: def.reward,
            category: def.category
          };
        });

        // 统计各状态数量
        const completedCount = achievements.filter(a => a.status === 'completed').length;
        const inProgressCount = achievements.filter(a => a.status === 'inProgress').length;
        const lockedCount = achievements.filter(a => a.status === 'locked').length;

        this.setData({
          achievements,
          completedCount,
          inProgressCount,
          lockedCount
        });

        this.filterAchievements();
      } catch (error) {
        console.error('loadAchievements error', error);
      }
    },

    /**
     * 筛选成就
     */
    filterAchievements() {
      const { activeFilter, achievements } = this.data;
      let filtered = achievements;

      if (activeFilter === 'completed') {
        filtered = achievements.filter(a => a.status === 'completed');
      } else if (activeFilter === 'inProgress') {
        filtered = achievements.filter(a => a.status === 'inProgress');
      } else if (activeFilter === 'locked') {
        filtered = achievements.filter(a => a.status === 'locked');
      }

      this.setData({ filteredAchievements: filtered });
    },

    /**
     * 切换筛选
     */
    onFilterChange(e: WechatMiniprogram.BaseEvent) {
      const filter = e.currentTarget.dataset.filter as 'all' | 'completed' | 'inProgress' | 'locked';
      this.setData({ activeFilter: filter });
      this.filterAchievements();
    }
  }
});
