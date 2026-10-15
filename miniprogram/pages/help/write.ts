/**
 * @file 树洞互助 - 写一封当下的小烦恼
 */

interface HelpLetterPayload {
  id: string;
  title: string;
  content: string;
  createdAt: number;
}

import { saveHelpLetter, getThemeClass, isLoggedIn, checkContent } from '../../utils/util';

const genId = (): string => {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
};

Component({
  data: {
    title: '',
    content: '',
    submitting: false,
    images: [] as string[],
    videoPath: '',
    themeClass: ''
  },
  lifetimes: {
    attached() {
      this.setData({ themeClass: getThemeClass() });
    }
  },
  methods: {
    /**
     * 标题输入变化
     */
    onTitleChange(e: WechatMiniprogram.Input) {
      const title = e.detail.value || '';
      this.setData({ title });
    },

    /**
     * 正文输入变化
     */
    onContentChange(e: WechatMiniprogram.TextareaInput) {
      const content = e.detail.value || '';
      this.setData({ content });
    },

    /**
     * 选择图片
     */
    onChooseImages() {
      const currentCount = this.data.images.length;
      if (currentCount >= 9) {
        wx.showToast({ title: '最多上传9张图片', icon: 'none' });
        return;
      }

      wx.chooseMedia({
        count: Math.min(9 - currentCount, 9),
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = res.tempFiles.map(file => file.tempFilePath);
          this.setData({
            images: [...this.data.images, ...newImages]
          });
        }
      });
    },

    /**
     * 删除图片
     */
    onDeleteImage(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset;
      const images = [...this.data.images];
      images.splice(index, 1);
      this.setData({ images });
    },

    /**
     * 预览图片
     */
    onPreviewImage(e: WechatMiniprogram.TouchEvent) {
      const { index } = e.currentTarget.dataset;
      wx.previewImage({
        current: this.data.images[index],
        urls: this.data.images
      });
    },

    /**
     * 选择视频
     */
    onChooseVideo() {
      if (this.data.videoPath) {
        wx.showToast({ title: '只能上传1个视频', icon: 'none' });
        return;
      }

      wx.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        success: (res) => {
          this.setData({
            videoPath: res.tempFiles[0].tempFilePath
          });
        }
      });
    },

    /**
     * 删除视频
     */
    onDeleteVideo() {
      this.setData({ videoPath: '' });
    },

    /**
     * 投递树洞求助信（本地存储模式）
     */
    async onSubmit() {
      if (this.data.submitting) return;

      if (!isLoggedIn()) {
        wx.showModal({
          title: '先完善一下资料吧～',
          content: '设置昵称或绑定手机号后再投递，会更好管理你的求助。',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/settings/settings' });
            }
          }
        });
        return;
      }

      const { title, content } = this.data;
      if (!content) {
        wx.showToast({ title: '先把此刻的心事写下来吧～', icon: 'none' });
        return;
      }

      this.setData({ submitting: true });

      // ===== 内容安全审核（合规要求）=====
      try {
        const checkTitle = await checkContent(title || '当下的小烦恼');
        if (!checkTitle.ok) {
          wx.showToast({ title: `标题${checkTitle.errMsg}`, icon: 'none', duration: 3000 });
          this.setData({ submitting: false });
          return;
        }

        const checkContentResult = await checkContent(content);
        if (!checkContentResult.ok) {
          wx.showToast({ title: `内容${checkContentResult.errMsg}`, icon: 'none', duration: 3000 });
          this.setData({ submitting: false });
          return;
        }
      } catch (error) {
        console.error('Content check failed:', error);
        wx.showToast({ title: '内容审核失败，请稍后重试', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      const letter: HelpLetterPayload = {
        id: genId(),
        title: title || '当下的小烦恼',
        content,
        createdAt: Date.now(),
        replyCount: 0, // 初始回复数为0
        images: this.data.images,
        videoPath: this.data.videoPath
      };

      try {
        const success = await saveHelpLetter(letter);
        if (!success) {
          throw new Error('保存失败');
        }

        wx.showToast({ title: '📮 你的心事已被温柔收下～', icon: 'success' });
        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 600);
      } catch (error) {
        console.error('createHelp error', error);
        wx.showToast({ title: '发送失败，晚点再试好吗～', icon: 'none' });
      } finally {
        this.setData({ submitting: false });
      }
    }
  }
});

