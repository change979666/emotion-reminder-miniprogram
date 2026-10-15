/**
 * @file 写给未来自己的信 - 信箱列表页面
 */

import { formatTime, getLetters, updateLetter, initSampleFutureLetters, softDeleteLetter, restoreLetter, removeLetter, getThemeClass } from '../../utils/util';

interface StoredFutureLetter {
  id: string;
  title: string;
  content: string;
  targetDate: string;
  createdAt: number;
  mood: string;
  /** 是否已拆封 */
  opened?: boolean;
  /** 拆信后的感想 */
  reflection?: string;
  /** 分类 */
  category?: string;
  /** 标签 */
  tags?: string[];
  /** 是否加密 */
  encrypted?: boolean;
  /** 目标 */
  target?: string;
  /** 目标状态 */
  targetStatus?: 'done' | 'progress' | 'pending';
  /** 目标是否已打卡 */
  targetChecked?: boolean;
  /** 目标结果描述 */
  targetResult?: string;
  /** 定位 */
  latitude?: number;
  longitude?: number;
  locationText?: string;
  /** 软删除 */
  deletedAt?: number;
  /** 是否允许匿名分享 */
  shareable?: boolean;
  /** 是否开启到期提醒 */
  remindEnabled?: boolean;
  /** 是否已发布到社区 */
  published?: boolean;
  /** 发布所在城市（可选） */
  city?: string;
  /** 经纬度（可选） */
  latitude?: number;
  longitude?: number;
}

interface DisplayFutureLetter extends StoredFutureLetter {
  /** 人类可读的创建时间 */
  createdAtText: string;
  /** 心情文案 */
  moodLabel: string;
  /** 提前提醒文案 */
  remindLabel?: string;
}


/**
 * 将心情 value 转成展示文案
 * @param mood 心情标识
 */
const getMoodLabel = (mood: string): string => {
  switch (mood) {
    case 'hopeful':
      return '那时我在期待些什么';
    case 'anxious':
      return '那时有点焦虑';
    case 'tired':
      return '那时很累但在撑着';
    case 'peace':
      return '那时很平静';
    case 'excited':
      return '那时超级兴奋';
    default:
      return '';
  }
};

/**
 * 判断是否为未来日期（含今天之后）
 * @param targetDate 目标日期（YYYY-MM-DD）
 */
const isFutureOrToday = (targetDate: string): boolean => {
  if (!targetDate) return false;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;
  return targetDate >= todayStr;
};

/**
 * 从地址字符串中粗略提取城市名（匹配“XX市/自治州/地区/盟”等）
 */
const pickCity = (address: string): string => {
  if (!address) return '';
  const patterns = ['市', '自治州', '地区', '盟', '县'];
  for (const p of patterns) {
    const idx = address.indexOf(p);
    if (idx > 0 && idx < 20) {
      // 取前面2-6个汉字 + 后缀
      const start = Math.max(0, idx - 6);
      const slice = address.slice(start, idx + p.length);
      // 去掉“省/自治区/直辖市”等前缀干扰
      return slice.replace(/.*(省|自治区|直辖市)/, '').trim();
    }
  }
  return '';
};

Component({
  data: {
    upcomingLetters: [] as DisplayFutureLetter[],
    pastLetters: [] as DisplayFutureLetter[],
    trashLetters: [] as DisplayFutureLetter[],
    searchText: '',
    sortOptions: ['最新创建', '最早创建', '最早送达', '最晚送达'],
    sortIndex: 0,
    showTrash: false,
    managing: false,
    selectedIds: [] as string[],
    themeClass: ''
  },
  lifetimes: {
    attached() {
      // 云开发模式下不需要初始化本地示例数据
      // initSampleFutureLetters();
      this.loadLetters();
      this.setData({ themeClass: getThemeClass() });
    },
    show() {
      // 每次显示页面时刷新数据
      this.loadLetters();
    }
  },
  methods: {
    /**
     * 从云函数加载所有未来信件，并拆分为未到期与已到期
     */
    async loadLetters() {
      try {
        const letters = await getLetters();
        const stored: StoredFutureLetter[] = letters.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content,
          targetDate: item.targetDate,
          createdAt: item.createdAt,
          mood: item.mood,
          opened: item.opened,
          reflection: item.reflection,
          category: item.category,
          tags: item.tags,
          encrypted: item.encrypted,
          latitude: item.latitude,
          longitude: item.longitude,
          locationText: item.locationText,
          deletedAt: item.deletedAt,
          shareable: item.shareable,
          remindEnabled: item.remindEnabled,
          published: item.published || false,
          readCount: item.readCount || 0
        }));

        const upcoming: DisplayFutureLetter[] = [];
        const past: DisplayFutureLetter[] = [];
        const trash: DisplayFutureLetter[] = [];

        stored.forEach((item) => {
          const createdAtText = item.createdAt ? formatTime(new Date(item.createdAt)) : '';
          const moodLabel = getMoodLabel(item.mood);
          const today = new Date();
          const tomorrow = new Date(today.getTime() + 86400000);
          const fmt = (x: Date) => {
            const y = x.getFullYear();
            const m = `${x.getMonth() + 1}`.padStart(2, '0');
            const d = `${x.getDate()}`.padStart(2, '0');
            return `${y}-${m}-${d}`;
          };
          const remindLabel = item.remindEnabled && item.targetDate === fmt(tomorrow)
            ? '明天就能拆啦～'
            : '';
          const displayItem: DisplayFutureLetter = {
            ...item,
            createdAtText,
            moodLabel,
            remindLabel
          };

          if (item.deletedAt) {
            trash.push(displayItem);
            return;
          }

          if (isFutureOrToday(item.targetDate)) {
            upcoming.push(displayItem);
          } else {
            past.push(displayItem);
          }
        });

        const { searchText, sortIndex } = this.data;
        const filterAndSort = (list: DisplayFutureLetter[]) => {
          const keyword = (searchText || '').trim();
          let filtered = list;
          if (keyword) {
            filtered = list.filter((item) => {
              const tagsText = (item.tags || []).join(' ');
              const categoryText = item.category || '';
              return `${item.title} ${item.content} ${tagsText} ${categoryText}`.includes(keyword);
            });
          }

          const sorted = [...filtered];
          switch (sortIndex) {
            case 0:
              sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              break;
            case 1:
              sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
              break;
            case 2:
              sorted.sort((a, b) => (a.targetDate || '').localeCompare(b.targetDate || ''));
              break;
            case 3:
              sorted.sort((a, b) => (b.targetDate || '').localeCompare(a.targetDate || ''));
              break;
            default:
              break;
          }
          return sorted;
        };

        this.setData({
          upcomingLetters: filterAndSort(upcoming),
          pastLetters: filterAndSort(past),
          trashLetters: filterAndSort(trash)
        });
      } catch (error) {
        console.error('load future letters error', error);
        wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' });
      }
    },

    onSearchInput(e: WechatMiniprogram.Input) {
      this.setData({ searchText: e.detail.value || '' });
      this.loadLetters();
    },

    onSortChange(e: WechatMiniprogram.PickerChange) {
      this.setData({ sortIndex: Number(e.detail.value) || 0 });
      this.loadLetters();
    },

    onToggleTrash() {
      this.setData({ showTrash: !this.data.showTrash, managing: false, selectedIds: [] });
    },

    onToggleManage() {
      this.setData({ managing: !this.data.managing, selectedIds: [] });
    },

    onToggleSelect(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;
      const selected = new Set(this.data.selectedIds);
      if (selected.has(id)) {
        selected.delete(id);
      } else {
        selected.add(id);
      }
      this.setData({ selectedIds: Array.from(selected) });
    },

    async onBatchDelete() {
      const { selectedIds } = this.data;
      if (!selectedIds.length) return;
      for (const id of selectedIds) {
        await softDeleteLetter(id);
      }
      this.setData({ selectedIds: [], managing: false });
      this.loadLetters();
    },

    async onBatchRestore() {
      const { selectedIds } = this.data;
      if (!selectedIds.length) return;
      for (const id of selectedIds) {
        await restoreLetter(id);
      }
      this.setData({ selectedIds: [], managing: false });
      this.loadLetters();
    },

    /**
     * 显示更多菜单
     */
    onShowMoreMenu(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;
      
      wx.showActionSheet({
        itemList: ['删除', '编辑', '分享'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 删除
            this.deleteLetter(id);
          } else if (res.tapIndex === 1) {
            // 编辑 - 后续实现
            wx.showToast({ title: '编辑功能开发中', icon: 'none' });
          } else if (res.tapIndex === 2) {
            // 分享 - 后续实现
            wx.showToast({ title: '分享功能开发中', icon: 'none' });
          }
        }
      });
    },

    /**
     * 删除信件
     */
    deleteLetter(id: string) {
      wx.showModal({
        title: '确认删除',
        content: '这封信将进入回收站',
        success: async (res) => {
          if (res.confirm) {
            await softDeleteLetter(id);
            this.loadLetters();
          }
        }
      });
    },

    onDeleteLetter(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;
      this.deleteLetter(id);
    },

    async onRestoreLetter(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;
      await restoreLetter(id);
      this.loadLetters();
    },

    onPermanentDelete(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;
      wx.showModal({
        title: '永久删除',
        content: '此操作不可恢复，确定继续吗？',
        success: async (res) => {
          if (res.confirm) {
            await removeLetter(id);
            this.loadLetters();
          }
        }
      });
    },

    /**
     * 切换发布到社区（云函数）
     * @param e 事件
     */
    async onTogglePublish(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;

      try {
        const current = [...this.data.upcomingLetters, ...this.data.pastLetters].find((l) => l.id === id);
        if (!current) return;
        if (!current.shareable) {
          wx.showToast({ title: '请先在写信时开启"可分享"', icon: 'none' });
          return;
        }

        const nextPublished = !current.published;
        if (nextPublished) {
          // 采集定位（城市），不强制，失败时写入"未知城市"
          wx.chooseLocation({
            success: async (loc) => {
              const city = pickCity(loc.address || '') || '未知城市';
              const success = await updateLetter(id, {
                published: true,
                city,
                latitude: loc.latitude,
                longitude: loc.longitude
              });
              if (!success) throw new Error('更新失败');
              wx.showToast({ title: '已匿名发布到广场', icon: 'success' });
              this.loadLetters();
            },
            fail: async () => {
              const success = await updateLetter(id, { published: true, city: '未知城市' });
              if (!success) {
                wx.showToast({ title: '更新失败', icon: 'none' });
                return;
              }
              wx.showToast({ title: '已匿名发布到广场', icon: 'success' });
              this.loadLetters();
            }
          });
          return;
        } else {
          const success = await updateLetter(id, { published: false });
          if (!success) throw new Error('更新失败');
        }

        wx.showToast({ title: nextPublished ? '已匿名发布到广场' : '已取消发布', icon: 'success' });
        this.loadLetters();
      } catch (error) {
        console.error('toggle publish error', error);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    },

    /**
     * 查看信件详情（跳转到拆信页面）
     */
    onViewLetter(e: WechatMiniprogram.BaseEvent) {
      const id = (e.currentTarget.dataset.id as string) || '';
      if (!id) return;

      wx.navigateTo({
        url: `/pages/letter-detail/letter-detail?id=${id}`
      });
    }
  }
});
