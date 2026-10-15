/**
 * @file 写给未来自己的信 - 写信页面逻辑
 */

interface MoodOption {
  /** 心情值，用于存储 */
  value: string;
  /** 展示文案 */
  label: string;
}

interface FutureLetter {
  /** 唯一 id */
  id: string;
  /** 发件人（本地用户ID），用于消息通知/归属 */
  authorId?: string;
  /** 标题 */
  title: string;
  /** 正文内容 */
  content: string;
  /** 目标日期（YYYY-MM-DD） */
  targetDate: string;
  /** 创建时间戳 */
  createdAt: number;
  /** 当前心情 */
  mood: string;
  /** 分类 */
  category?: string;
  /** 标签 */
  tags?: string[];
  /** 目标文本 */
  target?: string;
  /** 目标状态 */
  targetStatus?: 'pending' | 'progress' | 'done' | 'failed';
  /** 是否允许匿名分享 */
  shareable: boolean;
  /** 是否开启到期提醒（订阅消息） */
  remindEnabled: boolean;
  /** 是否已发布到社区（本地存储模式） */
  published?: boolean;
  /** 点赞数 */
  likeCount?: number;
  /** 是否加密 */
  encrypted?: boolean;
  /** 定位 */
  latitude?: number;
  longitude?: number;
  locationText?: string;
  /** 时光彩蛋：图片本地路径 */
  capsuleImagePath?: string;
  /** 时光彩蛋：语音本地路径 */
  capsuleAudioPath?: string;
}

/**
 * 信件模板
 */
interface LetterTemplate {
  /** 模板唯一 id */
  id: string;
  /** 分类 key */
  category: 'newyear' | 'career' | 'trouble';
  /** 模板标题 */
  title: string;
  /** 模板开头引导语 */
  prefix: string;
}

const TEMPLATE_LIST: LetterTemplate[] = [
  {
    id: 'newyear-1',
    category: 'newyear',
    title: '2026 马年新年愿望清单',
    prefix: '今年我最想完成的 3 件事是：\n1、\n2、\n3、'
  },
  {
    id: 'newyear-2',
    category: 'newyear',
    title: '写给跨年的那个夜晚',
    prefix: '如果一切顺利，跨年夜的我会对现在的自己说：\n'
  },
  {
    id: 'career-1',
    category: 'career',
    title: '给一年后职场的自己',
    prefix: '一年后的我，希望你在工作上能少一点自我怀疑，多一点底气。此刻你最想改变的 3 件事是：\n'
  },
  {
    id: 'career-2',
    category: 'career',
    title: '写给正在纠结要不要跳槽的自己',
    prefix: '如果你看到这封信时还在纠结要不要离开现在的公司，不妨先回答几个问题：\n1、你现在最不开心的点是什么？\n2、留下来的最大原因是什么？\n3、如果离开，你最期待的变化是什么？\n'
  },
  {
    id: 'trouble-1',
    category: 'trouble',
    title: '当下的小烦恼树洞',
    prefix: '最近最让你心累的 3 件小事是：\n1、\n2、\n3、\n写完之后，试着给当时的自己一个温柔的回答：\n'
  },
  {
    id: 'trouble-2',
    category: 'trouble',
    title: '给正在 emo 的你',
    prefix: '如果你又开始觉得一切都没意义，可以先把这些话写下来：\n'
  }
];

import { saveLetter, encryptText, getEncryptKey, getThemeClass, isLoggedIn, getOrInitUserId, generateLetterOpening, analyzeEmotion, optimizeLetterContent, checkContent, checkAchievements, addUserPoints } from '../../utils/util';
import { COPYWRITING } from '../../config/copywriting';

const recorderManager = wx.getRecorderManager();

/**
 * 生成简易唯一 id
 */
const genId = (): string => {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
};


Component({
  data: {
    title: '',
    content: '',
    targetDate: '',
    minDate: '',
    copywriting: COPYWRITING,
    themeClass: '',
    moodOptions: [
      { value: 'hopeful', label: '期待中' },
      { value: 'anxious', label: '有点焦虑' },
      { value: 'tired', label: '有点累' },
      { value: 'peace', label: '很平静' },
      { value: 'excited', label: '超级兴奋' },
      { value: 'happy', label: '开心' },
      { value: 'sad', label: '有点难过' },
      { value: 'grateful', label: '感恩' }
    ] as MoodOption[],
    selectedMood: '',
    categoryOptions: ['成长', '情绪', '关系', '目标', '生活', '其他'],
    selectedCategory: '成长',
    tagsInput: '',
    tags: [] as string[],
    targetText: '',
    shareable: false,
    remindEnabled: true,
    encryptEnabled: false,
    locationText: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    capsuleImages: [] as string[],
    capsuleVideoPath: '',
    capsuleAudioPath: '',
    isRecording: false,
    submitting: false,
    canSubmit: false,
    aiGenerating: false,
    aiAnalyzing: false,
    aiOptimizing: false,
    autoSaveStatus: '',
    autoSaveTimer: null as number | null,
    showTemplates: false,
    templates: TEMPLATE_LIST
  },
  lifetimes: {
    attached() {
      const today = new Date();
      const year = today.getFullYear();
      const month = `${today.getMonth() + 1}`.padStart(2, '0');
      const day = `${today.getDate()}`.padStart(2, '0');
      const minDate = `${year}-${month}-${day}`;
      this.setData({
        minDate,
        targetDate: minDate
      });
      this.setData({ themeClass: getThemeClass() });
      this.updateCanSubmit();

      recorderManager.onStop((res) => {
        this.setData({
          capsuleAudioPath: res.tempFilePath,
          isRecording: false
        });
      });
    }
  },
  methods: {
    /**
     * 标题输入变化
     */
    onTitleChange(e: WechatMiniprogram.Input) {
      const title = e.detail.value || '';
      this.setData({ title });
      this.updateCanSubmit();
      this.triggerAutoSave();
    },

    /**
     * 内容输入变化
     */
    onContentChange(e: WechatMiniprogram.TextareaInput) {
      const content = e.detail.value || '';
      this.setData({ content });
      this.updateCanSubmit();
      this.triggerAutoSave();
    },

    /**
     * 选择目标日期
     */
    onDateChange(e: WechatMiniprogram.PickerChange) {
      const targetDate = e.detail.value || '';
      this.setData({ targetDate });
      this.updateCanSubmit();
    },

    /**
     * 选择心情
     */
    onSelectMood(e: WechatMiniprogram.BaseEvent) {
      const value = (e.currentTarget.dataset.value as string) || '';
      this.setData({ selectedMood: value });
      this.updateCanSubmit();
    },

    /**
     * 选择分类
     */
    onCategoryChange(e: WechatMiniprogram.PickerChange) {
      const index = Number(e.detail.value);
      const selectedCategory = this.data.categoryOptions[index] || '其他';
      this.setData({ selectedCategory });
    },

    /**
     * 输入标签
     */
    onTagsInput(e: WechatMiniprogram.Input) {
      this.setData({ tagsInput: e.detail.value || '' });
    },

    onTargetInput(e: WechatMiniprogram.Input) {
      this.setData({ targetText: e.detail.value || '' });
    },

    /**
     * 添加标签
     */
    onAddTags() {
      const raw = (this.data.tagsInput || '').trim();
      if (!raw) return;
      const next = raw.split(/[,，、\s]+/).filter(Boolean).slice(0, 5);
      this.setData({ tags: Array.from(new Set([...this.data.tags, ...next])), tagsInput: '' });
    },

    /**
     * 删除标签
     */
    onRemoveTag(e: WechatMiniprogram.BaseEvent) {
      const tag = (e.currentTarget.dataset.tag as string) || '';
      this.setData({ tags: this.data.tags.filter(t => t !== tag) });
    },

    /**
     * 切换是否可匿名分享
     */
    onShareableChange(e: WechatMiniprogram.SwitchChange) {
      const shareable = !!e.detail.value;
      this.setData({ shareable });
    },

    /**
     * 切换是否加密
     */
    onEncryptChange(e: WechatMiniprogram.SwitchChange) {
      this.setData({ encryptEnabled: !!e.detail.value });
    },

    /**
     * 获取定位
     */
    onChooseLocation() {
      wx.getLocation({
        type: 'gcj02',
        success: (res) => {
          this.setData({
            latitude: res.latitude,
            longitude: res.longitude,
            locationText: `已记录定位（${res.latitude.toFixed(2)}, ${res.longitude.toFixed(2)})`
          });
        },
        fail: () => {
          wx.showToast({ title: '未能获取定位', icon: 'none' });
        }
      });
    },

    /**
     * 切换是否开启到期提醒（订阅消息）
     * - 本地存储模式下，该功能暂时不启用，等迁移到云开发后再启用
     * - 开启时会尝试请求一次订阅授权（需要配置订阅消息模板ID）
     */
    async onRemindChange(e: WechatMiniprogram.SwitchChange) {
      const remindEnabled = !!e.detail.value;
      this.setData({ remindEnabled });

      if (!remindEnabled) return;
      
      // 本地存储模式下，订阅消息功能暂时不启用
      wx.showToast({ 
        title: '订阅提醒功能将在迁移到云开发后启用', 
        icon: 'none',
        duration: 2000
      });
      this.setData({ remindEnabled: false });
      return;

      // 以下代码为云开发模式下的订阅消息逻辑（暂时注释）
      /*
      if (!REMINDER_TEMPLATE_ID) {
        wx.showToast({ title: '请先配置订阅消息模板ID', icon: 'none' });
        this.setData({ remindEnabled: false });
        return;
      }

      try {
        const res = await wx.requestSubscribeMessage({
          tmplIds: [REMINDER_TEMPLATE_ID]
        });
        // 用户拒绝时，关闭开关
        if (res[REMINDER_TEMPLATE_ID] !== 'accept') {
          wx.showToast({ title: '未授权订阅，无法提醒', icon: 'none' });
          this.setData({ remindEnabled: false });
        }
      } catch (error) {
        console.error('requestSubscribeMessage error', error);
        wx.showToast({ title: '订阅请求失败', icon: 'none' });
        this.setData({ remindEnabled: false });
      }
      */
    },

    /**
     * 打开模板选择面板
     */
    openTemplatePanel() {
      // 模板功能已删除
    },

    /**
     * 关闭模板选择面板
     */
    closeTemplatePanel() {
      // 模板功能已删除
    },

    /**
     * 切换模板分类
     */
    onTemplateCategoryChange(e: WechatMiniprogram.BaseEvent) {
      // 模板功能已删除
    },

    /**
     * 选中某个模板，填充到标题和内容开头
     */
    onApplyTemplate(e: WechatMiniprogram.BaseEvent) {
      // 模板功能已删除
    },

    /**
     * 选择多张图片
     */
    onChooseImages() {
      const { capsuleImages } = this.data;
      const maxCount = 9 - capsuleImages.length;
      if (maxCount <= 0) {
        wx.showToast({ title: '最多只能添加9张图片', icon: 'none' });
        return;
      }
      wx.chooseImage({
        count: maxCount,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const newImages = [...capsuleImages, ...res.tempFilePaths];
          this.setData({ capsuleImages: newImages });
          wx.showToast({ title: `已添加${res.tempFilePaths.length}张图片`, icon: 'success' });
        }
      });
    },

    /**
     * 选择视频
     */
    onChooseVideo() {
      wx.chooseVideo({
        sourceType: ['album', 'camera'],
        maxDuration: 60,
        camera: 'back',
        success: (res) => {
          this.setData({ capsuleVideoPath: res.tempFilePath });
          wx.showToast({ title: '视频已添加', icon: 'success' });
        }
      });
    },

    /**
     * 选择一张作为时光彩蛋的照片（兼容旧代码）
     */
    onChooseCapsuleImage() {
      this.onChooseImages();
    },

    /**
     * 开始/结束录制语音彩蛋
     */
    onToggleRecord() {
      const { isRecording } = this.data;
      if (isRecording) {
        recorderManager.stop();
        return;
      }
      this.setData({ isRecording: true });
      recorderManager.start({
        duration: 30000,
        format: 'mp3',
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000
      });
      wx.showToast({ title: '开始录音，点击再次结束', icon: 'none' });
    },

    /**
     * 根据表单状态更新提交按钮是否可用
     */
    updateCanSubmit() {
      const { content, targetDate } = this.data;
      const canSubmit = !!content && !!targetDate;
      this.setData({ canSubmit });
    },

    /**
     * 触发自动保存草稿
     */
    triggerAutoSave() {
      // 清除之前的定时器
      if (this.data.autoSaveTimer) {
        clearTimeout(this.data.autoSaveTimer);
      }

      // 立即显示"正在输入..."
      this.setData({ autoSaveStatus: '正在输入...' });

      // 2秒后保存草稿
      const timer = setTimeout(() => {
        this.saveDraft();
      }, 2000) as unknown as number;

      this.setData({ autoSaveTimer: timer });
    },

    /**
     * 保存草稿到本地存储
     */
    saveDraft() {
      const { title, content, targetDate, selectedMood, selectedCategory, tags } = this.data;
      
      if (!content && !title) {
        this.setData({ autoSaveStatus: '' });
        return;
      }

      const draft = {
        title,
        content,
        targetDate,
        mood: selectedMood,
        category: selectedCategory,
        tags,
        savedAt: Date.now()
      };

      try {
        wx.setStorageSync('letter_draft', draft);
        this.setData({ autoSaveStatus: '已自动保存' });
        
        // 3秒后隐藏提示
        setTimeout(() => {
          this.setData({ autoSaveStatus: '' });
        }, 3000);
      } catch (error) {
        console.error('保存草稿失败', error);
      }
    },

    /**
     * 记录连续写信天数并解锁信纸皮肤
     */
    updateWriteStreak() {
      const today = new Date();
      const getDateStr = (date: Date) => {
        const y = date.getFullYear();
        const m = `${date.getMonth() + 1}`.padStart(2, '0');
        const d = `${date.getDate()}`.padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const todayStr = getDateStr(today);
      const lastWriteDate = wx.getStorageSync('lastWriteDate');
      let continuousDays = wx.getStorageSync('continuousDays') || 0;
      let skinUnlocked = '';

      if (lastWriteDate !== todayStr) {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = getDateStr(yesterday);

        if (lastWriteDate === yesterdayStr) {
          continuousDays += 1;
        } else {
          continuousDays = 1;
        }

        wx.setStorageSync('continuousDays', continuousDays);
        wx.setStorageSync('lastWriteDate', todayStr);

        const totalPoints = wx.getStorageSync('totalPoints') || 0;
        wx.setStorageSync('totalPoints', totalPoints + 5);

        const unlockedSkins = wx.getStorageSync('unlockedSkins') || [];
        if (continuousDays >= 3 && !unlockedSkins.includes('sakura')) {
          unlockedSkins.push('sakura');
          wx.setStorageSync('unlockedSkins', unlockedSkins);
          wx.setStorageSync('activeSkin', 'sakura');
          skinUnlocked = '樱花信笺';
        }
      }

      return { continuousDays, skinUnlocked };
    },


    /**
     * 提交并保存一封给未来的信（本地存储模式）
     */
    async onSubmit() {
      if (this.data.submitting) return;

      if (!isLoggedIn()) {
        wx.showModal({
          title: '先完善一下资料吧～',
          content: '设置昵称或绑定手机号后再写信，会更好管理你的信件。',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({ url: '/pages/settings/settings' });
            }
          }
        });
        return;
      }

      const { title, content, targetDate, selectedMood, shareable, remindEnabled, encryptEnabled, selectedCategory, tags, targetText } = this.data;
      if (!content) {
        wx.showToast({ title: COPYWRITING.write.emptyContentToast, icon: 'none' });
        return;
      }
      if (!targetDate) {
        wx.showToast({ title: COPYWRITING.write.emptyDateToast, icon: 'none' });
        return;
      }

      this.setData({ submitting: true });

      // ===== 内容安全审核（合规要求）=====
      try {
        const checkTitle = await checkContent(title || '写给未来的我');
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

        // 检查标签内容
        if (tags && tags.length > 0) {
          const tagsText = tags.join(' ');
          const checkTags = await checkContent(tagsText);
          if (!checkTags.ok) {
            wx.showToast({ title: `标签${checkTags.errMsg}`, icon: 'none', duration: 3000 });
            this.setData({ submitting: false });
            return;
          }
        }
      } catch (error) {
        console.error('Content check failed:', error);
        // 审核失败时提示用户
        wx.showToast({ title: '内容审核失败，请稍后重试', icon: 'none' });
        this.setData({ submitting: false });
        return;
      }

      let finalContent = content;
      let encrypted = false;
      if (encryptEnabled) {
        const key = getEncryptKey();
        if (!key) {
          wx.showToast({ title: '请先在「账号与隐私」设置加密口令', icon: 'none' });
          return;
        }
        finalContent = encryptText(content, key);
        encrypted = true;
      }

      this.setData({ submitting: true });

      const authorId = await getOrInitUserId();

      const letter: FutureLetter = {
        id: genId(),
        authorId,
        title: title || '写给未来的我',
        content: finalContent,
        targetDate,
        createdAt: Date.now(),
        mood: selectedMood,
        category: selectedCategory,
        tags,
        target: targetText,
        targetStatus: 'pending',
        shareable,
        remindEnabled,
        published: false, // 默认未发布
        likeCount: 0, // 初始点赞数为0
        encrypted,
        latitude: this.data.latitude,
        longitude: this.data.longitude,
        locationText: this.data.locationText,
        capsuleImagePath: this.data.capsuleImagePath || undefined,
        capsuleAudioPath: this.data.capsuleAudioPath || undefined
      };

      try {
        const success = await saveLetter(letter);
        if (!success) {
          throw new Error('保存失败');
        }

        const { skinUnlocked } = this.updateWriteStreak();
        if (skinUnlocked) {
          wx.showModal({
            title: '🎁 连续写信奖励',
            content: `恭喜你解锁「${skinUnlocked}」～可以在信纸皮肤里使用啦！`,
            showCancel: false,
            confirmText: '收下啦'
          });
        }

        // 检查成就解锁
        checkAchievements('writeLetter');
        
        // 增加写信积分
        addUserPoints(50, '写下一封信');

        wx.showToast({ title: COPYWRITING.write.savedToast, icon: 'success' });

        setTimeout(() => {
          wx.navigateBack({ delta: 1 });
        }, 600);
      } catch (error) {
        console.error('save future letter error', error);
        wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
      } finally {
        this.setData({ submitting: false });
      }
    },

    /**
     * AI 生成信件开头
     */
    async onAIGenerate() {
      const { title } = this.data;
      if (!title) {
        wx.showToast({ title: '请先输入标题', icon: 'none' });
        return;
      }

      this.setData({ aiGenerating: true });
      try {
        const opening = await generateLetterOpening(title);
        const newContent = this.data.content 
          ? `${opening}\n\n${this.data.content}` 
          : opening;
        
        this.setData({ content: newContent });
        this.updateCanSubmit();
        wx.showToast({ title: 'AI 已生成开头', icon: 'success' });
      } catch (error: any) {
        wx.showToast({ 
          title: error.message || 'AI 生成失败', 
          icon: 'none' 
        });
      } finally {
        this.setData({ aiGenerating: false });
      }
    },

    /**
     * AI 分析情感
     */
    async onAIAnalyze() {
      const { content } = this.data;
      if (!content) {
        wx.showToast({ title: '请先输入内容', icon: 'none' });
        return;
      }

      this.setData({ aiAnalyzing: true });
      try {
        const analysis = await analyzeEmotion(content);
        wx.showModal({
          title: '情感分析',
          content: analysis,
          showCancel: false,
          confirmText: '知道了'
        });
      } catch (error: any) {
        wx.showToast({ 
          title: error.message || 'AI 分析失败', 
          icon: 'none' 
        });
      } finally {
        this.setData({ aiAnalyzing: false });
      }
    },

    /**
     * AI 优化内容
     */
    async onAIOptimize() {
      const { content } = this.data;
      if (!content) {
        wx.showToast({ title: '请先输入内容', icon: 'none' });
        return;
      }

      this.setData({ aiOptimizing: true });
      try {
        const optimized = await optimizeLetterContent(content);
        wx.showModal({
          title: 'AI 优化建议',
          content: optimized,
          confirmText: '采用',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.setData({ content: optimized });
              this.updateCanSubmit();
              
              // 记录AI优化次数
              const count = wx.getStorageSync('aiOptimizedCount') || 0;
              wx.setStorageSync('aiOptimizedCount', count + 1);
            }
          }
        });
      } catch (error: any) {
        wx.showToast({ 
          title: error.message || 'AI 优化失败', 
          icon: 'none' 
        });
      } finally {
        this.setData({ aiOptimizing: false });
      }
    },

    /**
     * 显示模板选择弹窗
     */
    showTemplateModal() {
      this.setData({ showTemplates: true });
    },

    /**
     * 隐藏模板选择弹窗
     */
    hideTemplateModal() {
      this.setData({ showTemplates: false });
    },

    /**
     * 阻止弹窗冒泡
     */
    stopPropagation() {
      // 阻止事件冒泡，避免点击弹窗内容时关闭弹窗
    },

    /**
     * 使用模板
     */
    useTemplate(e: WechatMiniprogram.BaseEvent) {
      const template = e.currentTarget.dataset.template as LetterTemplate;
      if (!template) return;

      this.setData({
        title: template.title,
        content: template.prefix,
        showTemplates: false
      });
      this.updateCanSubmit();
      wx.showToast({ title: '模板已应用', icon: 'success' });
    }
  }
});

