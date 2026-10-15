/**
 * @file 信件详情 - 拆信仪式
 */

import { formatTime, getLetters, decryptText, getEncryptKey, updateLetter, getThemeClass, incrementLetterReadCount, checkAchievements } from '../../utils/util';

interface LetterDetail {
  id: string;
  title: string;
  content: string;
  targetDate: string;
  createdAt: number;
  mood: string;
  opened?: boolean;
  reflection?: string; // 用户的回信/感想
  createdAtText?: string;
  encrypted?: boolean;
  target?: string;
  targetStatus?: 'done' | 'progress' | 'pending';
  targetChecked?: boolean;
  targetResult?: string;
}

Component({
  data: {
    letter: null as LetterDetail | null,
    // 拆信状态
    isOpening: false,
    envelopeOpened: false,
    showContent: false,
    // 音效
    soundEnabled: true,
    // 皮肤
    skins: [
      { id: 'default', name: '原木信纸' },
      { id: 'sakura', name: '樱花信笺' },
      { id: 'star', name: '星空信纸' }
    ],
    activeSkin: 'default',
    themeClass: '',
    // 解锁
    unlockVisible: false,
    unlockKey: '',
    decryptedContent: '',
    // 目标打卡
    targetStatusOptions: [
      { id: 'done', label: '已完成' },
      { id: 'progress', label: '进度中' },
      { id: 'pending', label: '未完成' }
    ],
    showTargetCheckin: false,
    showTargetCardModal: false,
    targetResultInput: '',
    // 时光小提问
    showReflection: false,
    reflectionText: '',
    reflections: [
      '✨ 现在的你，完成了当时的目标吗？',
      '💭 回看这段文字，你有什么新的感悟？',
      '🌟 想对那时的自己说些什么？',
      '💌 这封信给现在的你带来了什么？',
      '🎯 你变成了期待中的样子吗？'
    ],
    currentReflection: ''
  },

  lifetimes: {
    attached() {
      const activeSkin = wx.getStorageSync('activeSkin') || 'default';
      this.setData({ activeSkin, themeClass: getThemeClass() });
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const options = currentPage.options as any;
      
      if (options && options.id) {
        this.loadLetter(options.id);
      }
    }
  },

  methods: {
    /**
     * 加载信件详情
     */
    async loadLetter(id: string) {
      try {
        const letters = await getLetters();
        const letter = letters.find((item: any) => item.id === id);
        
        if (letter) {
          // 随机选择一个时光小提问
          const randomReflection = this.data.reflections[
            Math.floor(Math.random() * this.data.reflections.length)
          ];
          
          const createdAtText = letter.createdAt ? formatTime(new Date(letter.createdAt)) : '';

          this.setData({
            letter: {
              ...letter,
              createdAtText
            },
            currentReflection: randomReflection,
            reflectionText: letter.reflection || '',
            decryptedContent: letter.encrypted ? '' : letter.content
          });

          // 如果是第一次打开，显示未拆封状态
          if (!letter.opened) {
            this.setData({ 
              envelopeOpened: false,
              showContent: false 
            });
          } else {
            this.setData({ 
              envelopeOpened: true,
              showContent: true 
            });
            // 增加阅读次数（非首次打开）
            incrementLetterReadCount(id);
          }
        }
      } catch (error) {
        console.error('load letter error', error);
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    /**
     * 拆信动效
     */
    async onOpenEnvelope() {
      if (this.data.isOpening || this.data.envelopeOpened) return;

      try {
        wx.vibrateShort({ type: 'light' });
      } catch (e) {
        // ignore vibration failure
      }

      if (this.data.soundEnabled) {
        try {
          const audio = wx.createInnerAudioContext();
          audio.autoplay = false;
          audio.src = '/assets/audio/paper.mp3';
          audio.play();
          audio.onError(() => {
            // ignore missing audio
          });
        } catch (e) {
          // ignore audio failure
        }
      }

      this.setData({ isOpening: true });

      // 播放拆信动画
      await new Promise(resolve => setTimeout(resolve, 800));

      this.setData({ 
        envelopeOpened: true,
        isOpening: false 
      });

      // 延迟显示内容
      await new Promise(resolve => setTimeout(resolve, 400));

      this.setData({ showContent: true });

      // 标记为已打开
      const letter = this.data.letter;
      if (letter && !letter.opened) {
        updateLetter(letter.id, { opened: true });
        this.setData({ letter: { ...letter, opened: true } });
        
        // 检查成就解锁
        checkAchievements('openLetter');
      }

      if (letter?.target && !letter?.targetChecked) {
        this.setData({ showTargetCheckin: true });
        return;
      }

      // 延迟弹出时光小提问
      setTimeout(() => {
        this.setData({ showReflection: true });
      }, 1000);
    },

    /**
     * 保存感想
     */
    onSaveReflection() {
      const { letter, reflectionText } = this.data;
      if (!letter) return;

      updateLetter(letter.id, { reflection: reflectionText.trim() });
      wx.showToast({ 
        title: '💌 感想已保存', 
        icon: 'none' 
      });
      this.setData({
        showReflection: false,
        letter: {
          ...letter,
          reflection: reflectionText.trim()
        }
      });
    },

    /**
     * 关闭时光小提问
     */
    onCloseReflection() {
      this.setData({ showReflection: false });
    },

    /**
     * 输入感想
     */
    onReflectionInput(e: WechatMiniprogram.Input) {
      this.setData({ reflectionText: e.detail.value });
    },

    /**
     * 打开感想编辑
     */
    onOpenReflection() {
      this.setData({ showReflection: true });
    },

    /**
     * 切换皮肤
     */
    onSelectSkin(e: WechatMiniprogram.BaseEvent) {
      const skin = (e.currentTarget.dataset.skin as string) || 'default';
      this.setData({ activeSkin: skin });
      wx.setStorageSync('activeSkin', skin);
    },

    /**
     * 切换音效
     */
    onToggleSound() {
      this.setData({ soundEnabled: !this.data.soundEnabled });
    },

    onOpenUnlock() {
      this.setData({ unlockVisible: true, unlockKey: '' });
    },

    onUnlockInput(e: WechatMiniprogram.Input) {
      this.setData({ unlockKey: e.detail.value || '' });
    },

    onConfirmUnlock() {
      const { letter, unlockKey } = this.data;
      if (!letter || !letter.encrypted) return;
      const key = unlockKey || getEncryptKey();
      if (!key) {
        wx.showToast({ title: '请先设置解锁口令', icon: 'none' });
        return;
      }
      const content = decryptText(letter.content, key);
      if (!content) {
        wx.showToast({ title: '口令不正确', icon: 'none' });
        return;
      }
      this.setData({ decryptedContent: content, unlockVisible: false });
    },

    onCloseUnlock() {
      this.setData({ unlockVisible: false, unlockKey: '' });
    },

    onUpdateTargetStatus(e: WechatMiniprogram.BaseEvent) {
      const status = ((e.currentTarget.dataset.status as string) || 'pending') as 'done' | 'progress' | 'pending';
      const { letter } = this.data;
      if (!letter) return;
      updateLetter(letter.id, { targetStatus: status, targetChecked: true });
      this.setData({
        letter: {
          ...letter,
          targetStatus: status,
          targetChecked: true
        }
      });
      wx.showToast({ title: '已记录打卡状态', icon: 'success' });
    },

    onCloseTargetCheckin() {
      this.setData({ showTargetCheckin: false });
      setTimeout(() => {
        this.setData({ showReflection: true });
      }, 600);
    },

    onSelectTargetStatus(e: WechatMiniprogram.BaseEvent) {
      this.onUpdateTargetStatus(e);
      this.setData({ showTargetCheckin: false });
      setTimeout(() => {
        this.setData({ showReflection: true });
      }, 600);
    },

    onOpenTargetCard() {
      const { letter } = this.data;
      if (!letter || !letter.target) return;
      this.setData({
        showTargetCardModal: true,
        targetResultInput: letter.targetResult || ''
      });
    },

    onTargetResultInput(e: WechatMiniprogram.Input) {
      this.setData({ targetResultInput: e.detail.value || '' });
    },

    onCloseTargetCard() {
      this.setData({ showTargetCardModal: false, targetResultInput: '' });
    },

    onConfirmTargetCard() {
      const { letter, targetResultInput, targetStatusOptions } = this.data;
      if (!letter || !letter.target) return;
      const statusLabel = targetStatusOptions.find(opt => opt.id === (letter.targetStatus || 'pending'))?.label || '未完成';
      const resultText = targetResultInput.trim() || statusLabel;

      updateLetter(letter.id, { targetResult: resultText, targetChecked: true });

      const cards = wx.getStorageSync('timeCards') || [];
      cards.push({
        id: `time_${Date.now()}`,
        target: letter.target,
        result: resultText,
        letterTitle: letter.title,
        createdAt: Date.now()
      });
      wx.setStorageSync('timeCards', cards);

      this.setData({
        showTargetCardModal: false,
        targetResultInput: '',
        letter: {
          ...letter,
          targetResult: resultText,
          targetChecked: true
        }
      });

      wx.showModal({
        title: '时光对比卡片已生成',
        content: '已加入时光卡片生成器，是否立即查看？',
        confirmText: '去查看',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/cards/cards' });
          }
        }
      });
    },

    onCopyContent() {
      const { letter, decryptedContent } = this.data;
      if (!letter) return;
      const text = letter.encrypted ? decryptedContent : letter.content;
      if (!text) {
        wx.showToast({ title: '请先解锁信件', icon: 'none' });
        return;
      }
      wx.setClipboardData({
        data: text,
        success: () => wx.showToast({ title: '内容已复制', icon: 'success' })
      });
    },

    onExportContent() {
      const { letter, decryptedContent } = this.data;
      if (!letter) return;
      const text = letter.encrypted ? decryptedContent : letter.content;
      if (!text) {
        wx.showToast({ title: '请先解锁信件', icon: 'none' });
        return;
      }
      wx.setClipboardData({
        data: `${letter.title}\n\n${text}`,
        success: () => wx.showToast({ title: '内容已导出到剪贴板', icon: 'success' })
      });
    }
  }
});
