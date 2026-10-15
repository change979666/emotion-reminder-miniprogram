/**
 * @file 我的贴纸页面
 */

import { formatTime, getThemeClass } from '../../utils/util';

interface Sticker {
  id: string;
  name: string;
  emoji: string;
  quote: string;
  category: string;
  categoryName: string;
  order: number;
  obtainHint: string;
  owned?: boolean;
  isNew?: boolean;
  obtainedAt?: number;
  obtainedText?: string;
  source?: string;
  sourceText?: string;
}

Component({
  data: {
    themeClass: '',
    currentCategory: 'all',
    categories: [
      { id: 'all', name: '全部' },
      { id: 'healing', name: '治愈陪伴' },
      { id: 'encourage', name: '情绪鼓励' },
      { id: 'time', name: '时光美好' },
      { id: 'life', name: '生活小确幸' },
      { id: 'growth', name: '成长力量' }
    ],
    allStickers: [] as Sticker[],
    filteredStickers: [] as Sticker[],
    ownedCount: 0,
    totalCount: 0,
    newCount: 0,
    showDetail: false,
    selectedSticker: null as Sticker | null
  },

  lifetimes: {
    attached() {
      this.setData({ themeClass: getThemeClass() });
      this.loadStickers();
    }
  },

  methods: {
    /**
     * 加载贴纸数据
     */
    async loadStickers() {
      try {
        wx.showLoading({ title: '加载中...', mask: true });
        
        // 获取所有贴纸定义
        const allRes = await (wx as any).cloud.callFunction({
          name: 'stickers',
          data: { action: 'listAll' }
        });
        
        // 获取用户拥有的贴纸
        const ownedRes = await (wx as any).cloud.callFunction({
          name: 'stickers',
          data: { action: 'getUserStickers' }
        });
        
        // 获取新贴纸数量
        const newRes = await (wx as any).cloud.callFunction({
          name: 'stickers',
          data: { action: 'getNewCount' }
        });
        
        const allStickers = allRes.result?.list || [];
        const ownedStickers = ownedRes.result?.list || [];
        const newCount = newRes.result?.count || 0;
        
        // 合并数据
        const ownedMap = new Map();
        ownedStickers.forEach((item: any) => {
          ownedMap.set(item.stickerId, {
            obtainedAt: item.obtainedAt,
            source: item.source,
            isNew: item.isNew
          });
        });
        
        const stickers: Sticker[] = allStickers.map((sticker: any) => {
          const owned = ownedMap.has(sticker.id);
          const ownedData = ownedMap.get(sticker.id);
          
          return {
            ...sticker,
            owned,
            isNew: owned && ownedData.isNew,
            obtainedAt: owned ? ownedData.obtainedAt : 0,
            obtainedText: owned ? formatTime(new Date(ownedData.obtainedAt)) : '',
            source: owned ? ownedData.source : '',
            sourceText: owned ? this.getSourceText(ownedData.source) : ''
          };
        });
        
        this.setData({
          allStickers: stickers,
          totalCount: stickers.length,
          ownedCount: ownedStickers.length,
          newCount
        });
        
        this.filterStickers();
        
        wx.hideLoading();
      } catch (error) {
        console.error('Load stickers error:', error);
        wx.hideLoading();
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    /**
     * 获取来源文本
     */
    getSourceText(source: string): string {
      const map: Record<string, string> = {
        'daily': '每日签到',
        'achievement': '成就奖励',
        'reply': '回信赠送',
        'shop': '积分兑换',
        'system': '系统赠送'
      };
      return map[source] || '未知来源';
    },

    /**
     * 切换分类
     */
    onCategoryChange(e: WechatMiniprogram.BaseEvent) {
      const category = e.currentTarget.dataset.id;
      this.setData({ currentCategory: category });
      this.filterStickers();
    },

    /**
     * 筛选贴纸
     */
    filterStickers() {
      const { currentCategory, allStickers } = this.data;
      
      let filtered = allStickers;
      if (currentCategory !== 'all') {
        filtered = allStickers.filter(s => s.category === currentCategory);
      }
      
      // 已拥有的排在前面，新获得的最前面
      filtered.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        if (a.owned && !b.owned) return -1;
        if (!a.owned && b.owned) return 1;
        return a.order - b.order;
      });
      
      this.setData({ filteredStickers: filtered });
    },

    /**
     * 点击贴纸
     */
    onStickerClick(e: WechatMiniprogram.BaseEvent) {
      const id = e.currentTarget.dataset.id;
      const sticker = this.data.allStickers.find(s => s.id === id);
      
      if (sticker) {
        this.setData({
          selectedSticker: sticker,
          showDetail: true
        });
        
        // 如果是新贴纸，标记为已查看
        if (sticker.isNew && sticker.owned) {
          this.markAsViewed(id);
        }
      }
    },

    /**
     * 标记为已查看
     */
    async markAsViewed(stickerId: string) {
      try {
        await (wx as any).cloud.callFunction({
          name: 'stickers',
          data: {
            action: 'markAsViewed',
            data: { stickerId }
          }
        });
        
        // 更新本地数据
        const stickers = this.data.allStickers.map(s => {
          if (s.id === stickerId) {
            return { ...s, isNew: false };
          }
          return s;
        });
        
        this.setData({
          allStickers: stickers,
          newCount: this.data.newCount - 1
        });
        
        this.filterStickers();
      } catch (error) {
        console.error('Mark as viewed error:', error);
      }
    },

    /**
     * 关闭详情
     */
    onCloseDetail() {
      this.setData({
        showDetail: false,
        selectedSticker: null
      });
    }
  }
});
