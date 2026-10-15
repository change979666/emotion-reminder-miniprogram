/**
 * @file 时光卡片生成器
 */

import { formatTime } from '../../utils/util';

type CardType = 'healing' | 'time';

interface CardItem {
  id: string;
  type: CardType;
  quote?: string;
  fullContent?: string;
  target?: string;
  result?: string;
  letterTitle?: string;
  createdAt: number;
  createdAtText?: string;
}

import { getThemeClass } from '../../utils/util';

Page({
  data: {
    cards: [] as CardItem[],
    selectedCard: null as CardItem | null,
    posterPath: '',
    generating: false,
    themeClass: ''
  },

  onLoad() {
    this.loadCards();
    this.setData({ themeClass: getThemeClass() });
  },

  onShow() {
    this.loadCards();
  },

  loadCards() {
    const healing = (wx.getStorageSync('healingCards') || []) as CardItem[];
    const timeCards = (wx.getStorageSync('timeCards') || []) as CardItem[];
    const merged = [
      ...healing.map(item => ({ ...item, type: 'healing' as CardType })),
      ...timeCards.map(item => ({ ...item, type: 'time' as CardType }))
    ];

    const cards = merged
      .map(item => ({
        ...item,
        createdAtText: item.createdAt ? formatTime(new Date(item.createdAt)) : ''
      }))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    this.setData({ cards });
  },

  onSelectCard(e: WechatMiniprogram.BaseEvent) {
    const { id } = e.currentTarget.dataset;
    const card = this.data.cards.find(item => item.id === id) || null;
    this.setData({ selectedCard: card, posterPath: '' });
  },

  async onGeneratePoster() {
    const { selectedCard } = this.data;
    if (!selectedCard) {
      wx.showToast({ title: '先选一句暖心话吧～', icon: 'none' });
      return;
    }

    this.setData({ generating: true });

    try {
      const query = wx.createSelectorQuery();
      query.select('#posterCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const canvas = res[0].node as WechatMiniprogram.Canvas;
          const ctx = canvas.getContext('2d');
          const dpr = wx.getSystemInfoSync().pixelRatio;

          const width = 900;
          const height = 1200;
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);

          // 背景
          ctx.fillStyle = '#FFF7ED';
          ctx.fillRect(0, 0, width, height);

          // 纸张纹理
          ctx.fillStyle = 'rgba(120, 113, 108, 0.05)';
          for (let i = 0; i < height; i += 12) {
            ctx.fillRect(0, i, width, 1);
          }

          if (selectedCard.type === 'time') {
            ctx.fillStyle = '#92400e';
            ctx.font = 'bold 36px serif';
            ctx.fillText('时光对比卡片', 60, 100);

            if (selectedCard.letterTitle) {
              ctx.fillStyle = '#7c2d12';
              ctx.font = '24px serif';
              this.drawText(ctx, `来自「${selectedCard.letterTitle}」`, 60, 150, 780, 32);
            }

            ctx.fillStyle = '#78350f';
            ctx.font = '26px serif';
            ctx.fillText('当时的期待', 60, 240);
            this.drawText(ctx, selectedCard.target || '', 60, 290, 780, 38);

            ctx.fillStyle = '#78350f';
            ctx.font = '26px serif';
            ctx.fillText('现在的结果', 60, 520);
            this.drawText(ctx, selectedCard.result || '', 60, 570, 780, 38);

            ctx.fillStyle = '#a16207';
            ctx.font = '22px serif';
            const date = new Date(selectedCard.createdAt).toLocaleDateString();
            ctx.fillText(date, 60, 1120);

            ctx.fillStyle = '#f59e0b';
            ctx.font = '22px serif';
            ctx.fillText('来自未来的你', 640, 1120);
          } else {
            // 标题
            ctx.fillStyle = '#92400e';
            ctx.font = 'bold 36px serif';
            ctx.fillText('时光小纸条', 60, 100);

            // 引言
            const quote = selectedCard.quote || '';
            ctx.fillStyle = '#78350f';
            ctx.font = '28px serif';
            this.drawText(ctx, quote, 60, 180, 780, 40);

            // 日期
            ctx.fillStyle = '#a16207';
            ctx.font = '22px serif';
            const date = new Date(selectedCard.createdAt).toLocaleDateString();
            ctx.fillText(date, 60, 1120);

            // 角标
            ctx.fillStyle = '#f59e0b';
            ctx.font = '22px serif';
            ctx.fillText('来自未来的你', 640, 1120);
          }

          wx.canvasToTempFilePath({
            canvas,
            success: (result) => {
              this.setData({ posterPath: result.tempFilePath, generating: false });
              wx.showToast({ title: '海报已生成', icon: 'success' });
            },
            fail: () => {
              this.setData({ generating: false });
              wx.showToast({ title: '生成失败，请稍后再试', icon: 'none' });
            }
          });
        });
    } catch (error) {
      this.setData({ generating: false });
      wx.showToast({ title: '生成失败，请稍后再试', icon: 'none' });
    }
  },

  drawText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const chars = text.split('');
    let line = '';
    let lineCount = 0;

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, y + lineCount * lineHeight);
        line = chars[i];
        lineCount++;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y + lineCount * lineHeight);
  },

  onSavePoster() {
    const { posterPath } = this.data;
    if (!posterPath) {
      wx.showToast({ title: '请先生成海报', icon: 'none' });
      return;
    }

    wx.saveImageToPhotosAlbum({
      filePath: posterPath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: () => {
        wx.showToast({ title: '保存失败，请检查权限', icon: 'none' });
      }
    });
  },

  
});
