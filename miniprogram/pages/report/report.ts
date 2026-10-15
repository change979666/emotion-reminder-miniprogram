/**
 * @file 时光成长报告
 */

import { getLetters, getHelpLetters, getHelpReplies } from '../../utils/util';

Component({
  data: {
    // 基础统计
    totalLetters: 0,
    totalWords: 0,
    helpedCount: 0,
    repliesReceived: 0,
    continuousDays: 0,
    
    // 关键词分析
    topKeywords: [] as Array<{word: string; count: number}>,
    
    // 情绪趋势
    moodTrend: '保持积极' as string,
    
    // 成长故事
    growthStory: '' as string,
    
    // 帮助他人
    helpStats: {
      repliedCount: 0,
      avgReplyWords: 0
    }
  },
  
  lifetimes: {
    attached() {
      this.loadReport();
    }
  },
  
  methods: {
    /**
     * 加载成长报告数据
     */
    async loadReport() {
      try {
        // 1. 统计未来信
        const letters = await getLetters();
        const totalLetters = letters.length;
        const totalWords = letters.reduce((sum: number, letter: any) => {
          return sum + (letter.content || '').length;
        }, 0);
        
        // 2. 统计帮助他人
        const helpLetters = await getHelpLetters();
        const allReplies = await getHelpReplies();
        const myReplies = allReplies.filter((r: any) => r.isMyReply); // 假设有标记
        const helpedCount = new Set(myReplies.map((r: any) => r.letterId)).size;
        const repliesReceived = allReplies.filter((r: any) => {
          return helpLetters.some((h: any) => h.id === r.letterId);
        }).length;
        
        // 3. 关键词提取（简单版本）
        const topKeywords = this.extractKeywords(letters);
        
        // 4. 连续天数（从localStorage读取）
        const continuousDays = wx.getStorageSync('continuousDays') || 0;
        
        // 5. 生成成长故事
        const growthStory = this.generateGrowthStory(totalLetters, totalWords, helpedCount, topKeywords);
        
        // 6. 情绪趋势分析
        const moodTrend = this.analyzeMoodTrend(letters);
        
        // 7. 帮助统计
        const helpStats = {
          repliedCount: myReplies.length,
          avgReplyWords: myReplies.length > 0 
            ? Math.round(myReplies.reduce((sum: number, r: any) => sum + (r.content || '').length, 0) / myReplies.length)
            : 0
        };
        
        this.setData({
          totalLetters,
          totalWords,
          helpedCount,
          repliesReceived,
          continuousDays,
          topKeywords,
          moodTrend,
          growthStory,
          helpStats
        });
      } catch (error) {
        console.error('load report error', error);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },
    
    /**
     * 提取关键词（前5个高频词）
     */
    extractKeywords(letters: any[]): Array<{word: string; count: number}> {
      const wordMap = new Map<string, number>();
      const stopWords = new Set(['的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这']);
      
      letters.forEach((letter: any) => {
        const content = letter.content || '';
        // 简单分词：匹配2-4个汉字的词
        const words = content.match(/[\u4e00-\u9fa5]{2,4}/g) || [];
        words.forEach((word: string) => {
          if (!stopWords.has(word)) {
            wordMap.set(word, (wordMap.get(word) || 0) + 1);
          }
        });
      });
      
      return Array.from(wordMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => ({ word, count }));
    },
    
    /**
     * 生成成长故事
     */
    generateGrowthStory(totalLetters: number, totalWords: number, helpedCount: number, keywords: Array<{word: string; count: number}>): string {
      const parts = [];
      
      if (totalLetters > 0) {
        parts.push(`你写了 ${totalLetters} 封信给未来的自己`);
      }
      
      if (keywords.length > 0) {
        const topWord = keywords[0].word;
        parts.push(`最常提到的词是"${topWord}"`);
      }
      
      if (helpedCount > 0) {
        parts.push(`帮助了 ${helpedCount} 位陌生人缓解焦虑`);
      }
      
      if (totalWords > 1000) {
        parts.push(`累计写下 ${Math.floor(totalWords / 1000)}k+ 字的心路历程`);
      }
      
      return parts.join('，') + '。';
    },
    
    /**
     * 分析情绪趋势
     */
    analyzeMoodTrend(letters: any[]): string {
      // 简单情感分析：统计积极/消极词汇
      const positiveWords = ['开心', '快乐', '幸福', '美好', '希望', '期待', '喜欢', '爱', '温暖', '感恩'];
      const negativeWords = ['难过', '伤心', '痛苦', '焦虑', '担心', '害怕', '失望', '孤独', '压力', '累'];
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      letters.forEach((letter: any) => {
        const content = letter.content || '';
        positiveWords.forEach(word => {
          if (content.includes(word)) positiveCount++;
        });
        negativeWords.forEach(word => {
          if (content.includes(word)) negativeCount++;
        });
      });
      
      if (positiveCount > negativeCount * 1.5) {
        return '保持积极向上 ✨';
      } else if (negativeCount > positiveCount * 1.5) {
        return '情绪波动较大，记得照顾好自己 💙';
      } else {
        return '情绪平稳，继续加油 🌟';
      }
    },
    
    /**
     * 分享报告
     */
    onShareReport() {
      wx.showToast({ title: '分享功能开发中', icon: 'none' });
      // TODO: 生成分享图片
    }
  }
});
