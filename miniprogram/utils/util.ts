export const formatTime = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return (
    [year, month, day].map(formatNumber).join('/') +
    ' ' +
    [hour, minute, second].map(formatNumber).join(':')
  )
}

const formatNumber = (n: number) => {
  const s = n.toString()
  return s[1] ? s : '0' + s
}

/**
 * 本地存储工具函数
 * 用于管理信件、社区帖子、树洞求助等数据
 */

const STORAGE_KEYS = {
  LETTERS: 'future_letters', // 未来信件
  COMMUNITY_POSTS: 'community_posts', // 社区帖子（已发布的信件）
  HELP_LETTERS: 'help_letters', // 树洞求助信
  HELP_REPLIES: 'help_replies', // 树洞回信
  NOTIFICATIONS: 'notifications', // 消息通知（本地）
  USER_ID: 'local_user_id', // 本地用户唯一ID（无云环境时生成）
  USER_PHONE: 'user_phone', // 用户手机号（云函数获取后持久化）
  ENCRYPT_KEY: 'encrypt_key' // 信件加密口令
};

export type NotificationType = 'resonance' | 'comment' | 'reply';

export interface NotificationItem {
  id: string;
  toUserId: string;
  type: NotificationType;
  postId: string;
  commentId?: string;
  postTitle: string;
  fromName: string;
  content?: string;
  createdAt: number;
  read: boolean;
}

const safeGetArray = <T = any>(key: string): T[] => {
  try {
    const v = wx.getStorageSync(key);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const safeSet = (key: string, value: any) => {
  try {
    wx.setStorageSync(key, value);
  } catch {}
};

/**
 * 读取缓存 userId（不触发云函数）
 */
export const getCachedUserId = (): string => {
  try {
    return wx.getStorageSync(STORAGE_KEYS.USER_ID) || '';
  } catch {
    return '';
  }
};

export const getNotifications = (): NotificationItem[] => {
  return safeGetArray<NotificationItem>(STORAGE_KEYS.NOTIFICATIONS);
};

export const getNotificationsForUser = (toUserId: string): NotificationItem[] => {
  if (!toUserId) return [];
  return getNotifications().filter(n => n.toUserId === toUserId);
};

export const getUnreadNotificationCount = (toUserId: string): number => {
  return getNotificationsForUser(toUserId).filter(n => !n.read).length;
};

export const addNotification = (item: NotificationItem): boolean => {
  try {
    const list = getNotifications();
    list.unshift(item);
    safeSet(STORAGE_KEYS.NOTIFICATIONS, list.slice(0, 200));
    return true;
  } catch (error) {
    console.error('addNotification error', error);
    return false;
  }
};

export const markNotificationRead = (id: string): boolean => {
  if (!id) return false;
  try {
    const list = getNotifications();
    const idx = list.findIndex(n => n.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], read: true };
    safeSet(STORAGE_KEYS.NOTIFICATIONS, list);
    return true;
  } catch (error) {
    console.error('markNotificationRead error', error);
    return false;
  }
};

export const markAllNotificationsRead = (toUserId: string): boolean => {
  if (!toUserId) return false;
  try {
    const list = getNotifications();
    const next = list.map(n => (n.toUserId === toUserId ? { ...n, read: true } : n));
    safeSet(STORAGE_KEYS.NOTIFICATIONS, next);
    return true;
  } catch (error) {
    console.error('markAllNotificationsRead error', error);
    return false;
  }
};

/**
 * 社区：共鸣通知
 */
export const notifyCommunityResonance = (postId: string, fromName: string): boolean => {
  try {
    const letters = getLetters();
    const post = letters.find((l: any) => l.id === postId);
    const toUserId = (post && (post.authorId || post.userId || post.ownerId)) || '';
    if (!toUserId) return false;
    return addNotification({
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      toUserId,
      type: 'resonance',
      postId,
      postTitle: post?.title || '匿名来信',
      fromName: fromName || '匿名朋友',
      createdAt: Date.now(),
      read: false
    });
  } catch (error) {
    console.error('notifyCommunityResonance error', error);
    return false;
  }
};

/**
 * 社区：短评通知
 */
export const notifyCommunityComment = (postId: string, commentText: string, fromName: string): boolean => {
  try {
    const letters = getLetters();
    const post = letters.find((l: any) => l.id === postId);
    const toUserId = (post && (post.authorId || post.userId || post.ownerId)) || '';
    if (!toUserId) return false;
    return addNotification({
      id: `msg_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      toUserId,
      type: 'comment',
      postId,
      postTitle: post?.title || '匿名来信',
      fromName: fromName || '匿名朋友',
      content: commentText || '',
      createdAt: Date.now(),
      read: false
    });
  } catch (error) {
    console.error('notifyCommunityComment error', error);
    return false;
  }
};

/**
 * 获取加密口令
 */
export const getEncryptKey = (): string => {
  return wx.getStorageSync(STORAGE_KEYS.ENCRYPT_KEY) || '';
};

/**
 * 保存加密口令
 */
export const setEncryptKey = (key: string) => {
  wx.setStorageSync(STORAGE_KEYS.ENCRYPT_KEY, key || '');
};

/**
 * 获取主题类
 */
export const getThemeClass = (): string => {
  const preferences = wx.getStorageSync('preferences') || {};
  return preferences.darkMode ? 'theme-dark' : '';
};

/**
 * 是否已登录（昵称/手机号任一存在）
 */
export const isLoggedIn = (): boolean => {
  const userInfo = wx.getStorageSync('userInfo') || {};
  const phone = wx.getStorageSync(STORAGE_KEYS.USER_PHONE) || '';
  return !!(userInfo.nickName || phone);
};

const xorText = (text: string, key: string): string => {
  if (!key) return text;
  let res = '';
  for (let i = 0; i < text.length; i++) {
    const k = key.charCodeAt(i % key.length);
    res += String.fromCharCode(text.charCodeAt(i) ^ k);
  }
  return res;
};

const encodeBase64 = (text: string): string => {
  const encoded = encodeURIComponent(text);
  const bytes = new Uint8Array(encoded.length);
  for (let i = 0; i < encoded.length; i++) {
    bytes[i] = encoded.charCodeAt(i);
  }
  return wx.arrayBufferToBase64(bytes.buffer);
};

const decodeBase64 = (base64: string): string => {
  const buffer = wx.base64ToArrayBuffer(base64);
  const bytes = new Uint8Array(buffer);
  let encoded = '';
  for (let i = 0; i < bytes.length; i++) {
    encoded += String.fromCharCode(bytes[i]);
  }
  return decodeURIComponent(encoded);
};

/**
 * 加密文本（弱加密，用于本地隐私保护）
 */
export const encryptText = (text: string, key: string): string => {
  if (!key) return text;
  return encodeBase64(xorText(text, key));
};

/**
 * 解密文本
 */
export const decryptText = (text: string, key: string): string => {
  if (!key) return text;
  try {
    return xorText(decodeBase64(text), key);
  } catch (e) {
    return '';
  }
};

/**
 * 获取所有未来信件（云函数）
 */
export const getLetters = async (): Promise<any[]> => {
  try {
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'listByUser',
        data: { type: 'future' }
      }
    });
    if (res.result && res.result.ok) {
      return res.result.list || [];
    }
    return [];
  } catch (error) {
    console.error('getLetters error', error);
    return [];
  }
};

/**
 * 保存未来信件（云函数）
 */
export const saveLetter = async (letter: any): Promise<boolean> => {
  try {
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'create',
        data: { letter }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('saveLetter error', error);
    return false;
  }
};

/**
 * 更新未来信件（云函数）
 */
export const updateLetter = async (id: string, updates: Partial<any>): Promise<boolean> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const letters = wx.getStorageSync(STORAGE_KEYS.LETTERS) || [];
      const index = letters.findIndex((l: any) => l.id === id);
      if (index === -1) return false;
      letters[index] = { ...letters[index], ...updates };
      wx.setStorageSync(STORAGE_KEYS.LETTERS, letters);
      return true;
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'update',
        data: { id, updates }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('updateLetter error', error);
    return false;
  }
};

/**
 * 软删除信件（回收站）（云函数）
 */
export const softDeleteLetter = async (id: string): Promise<boolean> => {
  try {
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'softDelete',
        data: { id }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('softDeleteLetter error', error);
    return false;
  }
};

/**
 * 还原信件（云函数）
 */
export const restoreLetter = async (id: string): Promise<boolean> => {
  try {
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'restore',
        data: { id }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('restoreLetter error', error);
    return false;
  }
};

/**
 * 增加信件阅读次数（云函数）
 */
export const incrementLetterReadCount = async (id: string): Promise<boolean> => {
  try {
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'incrementReadCount',
        data: { id }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('incrementLetterReadCount error', error);
    return false;
  }
};

/**
 * 永久删除信件（云函数）
 */
export const removeLetter = async (id: string): Promise<boolean> => {
  try {
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'delete',
        data: { id }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('removeLetter error', error);
    return false;
  }
};

/**
 * 获取社区帖子（已发布且可分享的信件）（云函数）
 */
export const getCommunityPosts = async (order: 'latest' | 'hot' = 'latest'): Promise<any[]> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const letters = wx.getStorageSync(STORAGE_KEYS.LETTERS) || [];
      return letters.filter((l: any) => l.shareable && l.published);
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'listCommunity',
        data: { order }
      }
    });
    if (res.result && res.result.ok) {
      return res.result.list || [];
    }
    return [];
  } catch (error) {
    console.error('getCommunityPosts error', error);
    // 降级到本地存储
    try {
      const letters = wx.getStorageSync(STORAGE_KEYS.LETTERS) || [];
      return letters.filter((l: any) => l.shareable && l.published);
    } catch {
      return [];
    }
  }
};

/**
 * 点赞/共鸣社区帖子（云函数）
 */
export const likePost = async (id: string): Promise<boolean> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const letters = wx.getStorageSync(STORAGE_KEYS.LETTERS) || [];
      const index = letters.findIndex((l: any) => l.id === id);
      if (index === -1) return false;
      if (!letters[index].likeCount) {
        letters[index].likeCount = 0;
      }
      letters[index].likeCount = (letters[index].likeCount || 0) + 1;
      wx.setStorageSync(STORAGE_KEYS.LETTERS, letters);
      return true;
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'like',
        data: { id }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('likePost error', error);
    return false;
  }
};

/**
 * 获取所有树洞求助信（云函数）
 */
export const getHelpLetters = async (): Promise<any[]> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      return wx.getStorageSync(STORAGE_KEYS.HELP_LETTERS) || [];
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'listMyHelps'
      }
    });
    if (res.result && res.result.ok) {
      return res.result.list || [];
    }
    return [];
  } catch (error) {
    console.error('getHelpLetters error', error);
    // 降级到本地存储
    try {
      return wx.getStorageSync(STORAGE_KEYS.HELP_LETTERS) || [];
    } catch {
      return [];
    }
  }
};

/**
 * 保存树洞求助信（云函数）
 */
export const saveHelpLetter = async (help: any): Promise<boolean> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const helps = wx.getStorageSync(STORAGE_KEYS.HELP_LETTERS) || [];
      helps.push(help);
      wx.setStorageSync(STORAGE_KEYS.HELP_LETTERS, helps);
      return true;
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'createHelp',
        data: { letter: help }
      }
    });
    
    if (res.result && res.result.ok) {
      return true;
    } else {
      // 如果云端保存失败，显示错误信息
      const errorMsg = res.result?.error || '保存失败';
      wx.showToast({ title: errorMsg, icon: 'none' });
      return false;
    }
  } catch (error) {
    console.error('saveHelpLetter error', error);
    // 降级到本地存储
    try {
      const helps = wx.getStorageSync(STORAGE_KEYS.HELP_LETTERS) || [];
      helps.push(help);
      wx.setStorageSync(STORAGE_KEYS.HELP_LETTERS, helps);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * 获取所有树洞回信（云函数）
 * 注意：此函数主要用于获取当前用户求助信的所有回信
 */
export const getHelpReplies = async (): Promise<any[]> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      return wx.getStorageSync(STORAGE_KEYS.HELP_REPLIES) || [];
    }
    // 先获取用户的求助信
    const helpsRes = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'listMyHelps'
      }
    });
    if (!helpsRes.result || !helpsRes.result.ok) {
      return [];
    }
    const helps = helpsRes.result.list || [];
    // 收集所有回信
    const allReplies: any[] = [];
    for (const help of helps) {
      if (help.replies && Array.isArray(help.replies)) {
        allReplies.push(...help.replies);
      }
    }
    return allReplies;
  } catch (error) {
    console.error('getHelpReplies error', error);
    // 降级到本地存储
    try {
      return wx.getStorageSync(STORAGE_KEYS.HELP_REPLIES) || [];
    } catch {
      return [];
    }
  }
};

/**
 * 保存树洞回信（云函数）
 */
export const saveHelpReply = async (reply: any): Promise<boolean> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const replies = wx.getStorageSync(STORAGE_KEYS.HELP_REPLIES) || [];
      replies.push(reply);
      wx.setStorageSync(STORAGE_KEYS.HELP_REPLIES, replies);
      
      // 更新对应求助信的回复计数
      const helps = wx.getStorageSync(STORAGE_KEYS.HELP_LETTERS) || [];
      const helpIndex = helps.findIndex((h: any) => h.id === reply.letterId);
      if (helpIndex !== -1) {
        if (!helps[helpIndex].replyCount) {
          helps[helpIndex].replyCount = 0;
        }
        helps[helpIndex].replyCount = (helps[helpIndex].replyCount || 0) + 1;
        wx.setStorageSync(STORAGE_KEYS.HELP_LETTERS, helps);
      }
      
      return true;
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'createReply',
        data: {
          letterId: reply.letterId,
          content: reply.content
        }
      }
    });
    return res.result && res.result.ok;
  } catch (error) {
    console.error('saveHelpReply error', error);
    return false;
  }
};

/**
 * 根据 letterId 获取回信列表（云函数）
 */
export const getRepliesByLetterId = async (letterId: string): Promise<any[]> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const replies = wx.getStorageSync(STORAGE_KEYS.HELP_REPLIES) || [];
      return replies.filter((r: any) => r.letterId === letterId);
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'listRepliesForLetter',
        data: { letterId }
      }
    });
    if (res.result && res.result.ok) {
      return res.result.list || [];
    }
    return [];
  } catch (error) {
    console.error('getRepliesByLetterId error', error);
    // 降级到本地存储
    try {
      const replies = wx.getStorageSync(STORAGE_KEYS.HELP_REPLIES) || [];
      return replies.filter((r: any) => r.letterId === letterId);
    } catch {
      return [];
    }
  }
};

/**
 * 获取统计信息（云函数）
 */
export const getStats = async (): Promise<{
  totalLetters: number;
  upcomingLetters: number;
  deliveredLetters: number;
  receivedReplies: number;
}> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const letters = wx.getStorageSync(STORAGE_KEYS.LETTERS) || [];
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`;
      const allReplies = wx.getStorageSync(STORAGE_KEYS.HELP_REPLIES) || [];
      return {
        totalLetters: letters.length,
        upcomingLetters: letters.filter((l: any) => l.targetDate >= todayStr).length,
        deliveredLetters: letters.filter((l: any) => l.targetDate < todayStr).length,
        receivedReplies: allReplies.length
      };
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'getStats'
      }
    });
    if (res.result && res.result.ok) {
      return res.result.stats;
    }
    return {
      totalLetters: 0,
      upcomingLetters: 0,
      deliveredLetters: 0,
      receivedReplies: 0
    };
  } catch (error) {
    console.error('getStats error', error);
    return {
      totalLetters: 0,
      upcomingLetters: 0,
      deliveredLetters: 0,
      receivedReplies: 0
    };
  }
};

/**
 * 获取可回复的求助信列表（云函数）
 */
export const getHelpLettersForReply = async (limit: number = 20): Promise<any[]> => {
  try {
    if (!(wx as any).cloud || !(wx as any).cloud.callFunction) {
      // 降级到本地存储
      const allHelps = wx.getStorageSync(STORAGE_KEYS.HELP_LETTERS) || [];
      return allHelps
        .filter((item: any) => (item.replyCount || 0) < 5)
        .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, limit);
    }
    const res = await (wx as any).cloud.callFunction({
      name: 'letters',
      data: {
        action: 'listHelpForReply',
        data: { limit }
      }
    });
    if (res.result && res.result.ok) {
      return res.result.list || [];
    }
    return [];
  } catch (error) {
    console.error('getHelpLettersForReply error', error);
    return [];
  }
};

export const initSampleData = () => {
  try {
    // 检查是否已有数据
    const existingHelps = getHelpLetters();
    if (existingHelps.length > 0) {
      return; // 已有数据，不初始化
    }

    // 创建示例树洞求助信
    const sampleHelps = [
      {
        id: `help_${Date.now()}_1`,
        title: '工作压力好大',
        content: '最近工作压力特别大，每天加班到很晚，感觉身体和心理都很累。想辞职但又担心找不到更好的工作，每天都在纠结中度过。不知道该怎么办才好...',
        createdAt: Date.now() - 86400000 * 2, // 2天前
        replyCount: 1
      },
      {
        id: `help_${Date.now()}_2`,
        title: '和好朋友闹矛盾了',
        content: '和最好的朋友因为一件小事闹矛盾了，现在谁也不理谁。其实我知道是我太敏感了，但就是拉不下脸去道歉。好怀念以前一起聊天、一起笑的日子...',
        createdAt: Date.now() - 86400000 * 1, // 1天前
        replyCount: 2
      },
      {
        id: `help_${Date.now()}_3`,
        title: '对未来很迷茫',
        content: '马上要毕业了，但完全不知道自己想做什么。看到同学们都有明确的目标，而我还在迷茫中。感觉人生失去了方向，不知道路在哪里...',
        createdAt: Date.now() - 3600000 * 12, // 12小时前
        replyCount: 0
      },
      {
        id: `help_${Date.now()}_4`,
        title: '总是觉得自己不够好',
        content: '无论做什么，总是觉得自己做得不够好。明明已经很努力了，但还是会自我怀疑。这种不自信让我错过了很多机会，也让我很痛苦...',
        createdAt: Date.now() - 3600000 * 6, // 6小时前
        replyCount: 1
      },
      {
        id: `help_${Date.now()}_5`,
        title: '异地恋的困扰',
        content: '和男朋友异地恋一年了，最近感觉感情变淡了。每天只能通过手机联系，见面的机会很少。不知道这段感情还能坚持多久，很害怕会失去他...',
        createdAt: Date.now() - 3600000 * 3, // 3小时前
        replyCount: 0
      },
      {
        id: `help_${Date.now()}_6`,
        title: '家庭关系紧张',
        content: '和父母的关系越来越紧张，每次回家都会因为各种小事吵架。我知道他们是为我好，但他们的方式让我很难接受。想要沟通但又不知道从何说起...',
        createdAt: Date.now() - 3600000 * 1, // 1小时前
        replyCount: 0
      },
      {
        id: `help_${Date.now()}_7`,
        title: '学习效率很低',
        content: '最近学习效率特别低，总是分心，看一会儿书就想玩手机。明明知道要考试了，但就是提不起精神。很焦虑但又不知道如何改变...',
        createdAt: Date.now() - 1800000, // 30分钟前
        replyCount: 0
      },
      {
        id: `help_${Date.now()}_8`,
        title: '害怕孤独',
        content: '一个人在大城市打拼，身边没有朋友，每天下班后就是一个人待在家里。感觉很孤独，有时候会想哭。不知道如何改变这种状态...',
        createdAt: Date.now() - 900000, // 15分钟前
        replyCount: 0
      }
    ];

    // 创建示例回信
    const sampleReplies = [
      {
        id: `reply_${Date.now()}_1`,
        letterId: sampleHelps[0].id,
        content: '看到你的困扰，我想说：工作很重要，但你的身心健康更重要。如果这份工作已经严重影响到你的生活，不妨考虑换个环境。不要害怕改变，有时候改变才能带来新的机会。',
        createdAt: Date.now() - 86400000 * 1 // 1天前
      },
      {
        id: `reply_${Date.now()}_2`,
        letterId: sampleHelps[1].id,
        content: '真正的友谊不会因为一次矛盾就结束。如果你觉得是你太敏感了，那就勇敢地去道歉吧。真正的朋友会理解你的。不要因为面子而失去一个好朋友。',
        createdAt: Date.now() - 3600000 * 20 // 20小时前
      },
      {
        id: `reply_${Date.now()}_3`,
        letterId: sampleHelps[1].id,
        content: '我也经历过类似的困扰。其实，主动道歉不是认输，而是珍惜这段友谊。相信你的朋友也在等你的消息。',
        createdAt: Date.now() - 3600000 * 18 // 18小时前
      },
      {
        id: `reply_${Date.now()}_4`,
        letterId: sampleHelps[3].id,
        content: '每个人都有自己的节奏，不要总是和别人比较。你已经很努力了，要相信自己。不自信的时候，可以试着列出自己的优点，你会发现其实自己很棒。',
        createdAt: Date.now() - 3600000 * 4 // 4小时前
      }
    ];

    // 保存示例数据
    wx.setStorageSync(STORAGE_KEYS.HELP_LETTERS, sampleHelps);
    wx.setStorageSync(STORAGE_KEYS.HELP_REPLIES, sampleReplies);

    console.log('示例数据初始化完成');
  } catch (error) {
    console.error('initSampleData error', error);
  }
};

export const initSampleFutureLetters = () => {
  try {
    const existing = wx.getStorageSync(STORAGE_KEYS.LETTERS) || [];
    if (existing && existing.length) return;
    const d = new Date();
    const fmt = (x: Date) => {
      const y = x.getFullYear();
      const m = `${x.getMonth() + 1}`.padStart(2, '0');
      const day = `${x.getDate()}`.padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    const plusDays = (n: number) => {
      const x = new Date(d.getTime() + n * 86400000);
      return fmt(x);
    };
    const minusDays = (n: number) => {
      const x = new Date(d.getTime() - n * 86400000);
      return fmt(x);
    };
    const base = Date.now();
    const letters = [
      {
        id: `letter_${base}_1`,
        title: '给一个月后的我',
        content: '希望那时的我依旧保持热爱，去做让自己快乐的事。',
        targetDate: plusDays(30),
        createdAt: base - 86400000 * 3,
        mood: 'hopeful',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 12,
        category: '成长',
        tags: ['期待', '自我']
      },
      {
        id: `letter_${base}_2`,
        title: '熬过这段忙碌',
        content: '这周很累，但会过去的。睡得好一点，吃得好一点。',
        targetDate: plusDays(7),
        createdAt: base - 86400000 * 1,
        mood: 'tired',
        shareable: false,
        remindEnabled: true,
        published: false,
        likeCount: 0,
        category: '情绪',
        tags: ['放松']
      },
      {
        id: `letter_${base}_3`,
        title: '新的计划',
        content: '尝试一项新的爱好，给生活加点不一样的颜色。',
        targetDate: plusDays(120),
        createdAt: base - 3600000 * 12,
        mood: 'excited',
        shareable: true,
        remindEnabled: false,
        published: true,
        likeCount: 8,
        category: '生活',
        tags: ['新计划']
      },
      {
        id: `letter_${base}_4`,
        title: '失眠的夜',
        content: '焦虑的时候深呼吸，把注意力放回当下。',
        targetDate: minusDays(5),
        createdAt: base - 86400000 * 10,
        mood: 'anxious',
        shareable: true,
        remindEnabled: false,
        published: true,
        likeCount: 15,
        category: '情绪',
        tags: ['焦虑']
      },
      {
        id: `letter_${base}_5`,
        title: '给昨天的自己',
        content: '已经做得很好了，别再苛责自己。',
        targetDate: minusDays(1),
        createdAt: base - 86400000 * 2,
        mood: 'peace',
        shareable: false,
        remindEnabled: false,
        published: false,
        likeCount: 0,
        category: '关系',
        tags: ['自我']
      },
      {
        id: `letter_${base}_6`,
        title: '关于勇气',
        content: '今天终于鼓起勇气做了一直想做但不敢做的事。虽然结果还不知道，但至少我尝试了。给未来的自己：勇敢一点，不要总是害怕失败。',
        targetDate: plusDays(60),
        createdAt: base - 86400000 * 5,
        mood: 'excited',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 23
      },
      {
        id: `letter_${base}_7`,
        title: '深夜思考',
        content: '凌晨三点，突然想明白了一些事。人生很短，没必要为不值得的人和事浪费时间。希望未来的我能记住这一刻的清醒。',
        targetDate: plusDays(90),
        createdAt: base - 86400000 * 7,
        mood: 'peace',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 31
      },
      {
        id: `letter_${base}_8`,
        title: '小小的成就',
        content: '今天完成了一个困扰我很久的项目，虽然不完美，但我已经尽力了。记住这种成就感，以后遇到困难时想想今天的自己。',
        targetDate: plusDays(180),
        createdAt: base - 86400000 * 4,
        mood: 'hopeful',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 18
      },
      {
        id: `letter_${base}_9`,
        title: '给未来恋爱的自己',
        content: '如果你现在在恋爱，希望你记得：爱情应该让你变得更好，而不是失去自我。保持独立，保持自信。',
        targetDate: plusDays(365),
        createdAt: base - 86400000 * 8,
        mood: 'hopeful',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 42
      },
      {
        id: `letter_${base}_10`,
        title: '雨天的感悟',
        content: '下雨了，看着窗外的雨滴，突然觉得很平静。有时候，慢下来也是一种勇气。希望你能偶尔停下来，享受当下。',
        targetDate: plusDays(45),
        createdAt: base - 86400000 * 6,
        mood: 'peace',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 27
      },
      {
        id: `letter_${base}_11`,
        title: '致我的梦想',
        content: '虽然现在距离梦想还很远，但我相信只要坚持，总会有收获的那一天。给未来的自己：不要放弃，继续努力。',
        targetDate: plusDays(200),
        createdAt: base - 86400000 * 9,
        mood: 'excited',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 36
      },
      {
        id: `letter_${base}_12`,
        title: '关于原谅',
        content: '今天学会了原谅，原谅别人，也原谅自己。放下过去的遗憾，轻装前行。希望未来的你能一直记得：放下才能重新开始。',
        targetDate: plusDays(75),
        createdAt: base - 86400000 * 11,
        mood: 'peace',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 29
      },
      {
        id: `letter_${base}_13`,
        title: '写给焦虑的夜晚',
        content: '又是一个失眠的夜晚，脑子里转个不停。但我知道，焦虑解决不了问题。深呼吸，一步一步来，一切都会好起来的。',
        targetDate: plusDays(20),
        createdAt: base - 86400000 * 2,
        mood: 'anxious',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 34
      },
      {
        id: `letter_${base}_14`,
        title: '新年的期待',
        content: '新的一年，希望能遇到更好的自己。不强求完美，但要努力成长。给未来的自己：加油，你可以的！',
        targetDate: plusDays(365),
        createdAt: base - 86400000 * 15,
        mood: 'hopeful',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 45
      },
      {
        id: `letter_${base}_15`,
        title: '学会独处',
        content: '今天一个人去看了电影，一个人吃了饭，发现独处也挺好的。享受一个人的时光，也是一种能力。',
        targetDate: plusDays(100),
        createdAt: base - 86400000 * 12,
        mood: 'peace',
        shareable: true,
        remindEnabled: true,
        published: true,
        likeCount: 21
      }
    ];
    const withExtras = letters.map((l: any, idx: number) => ({
      ...l,
      opened: idx % 2 === 0,
      target: idx % 3 === 0 ? '给未来的自己一个小目标' : '',
      targetStatus: idx % 3 === 0 ? 'progress' : 'pending'
    }));
    wx.setStorageSync(STORAGE_KEYS.LETTERS, withExtras);
  } catch (error) {
    console.error('initSampleFutureLetters error', error);
  }
};

/**
 * 获取或初始化用户唯一ID
 * 优先调用云函数 login 获取 openid；失败则生成本地ID并持久化
 */
export const getOrInitUserId = async (): Promise<string> => {
  try {
    const cached = wx.getStorageSync(STORAGE_KEYS.USER_ID);
    if (cached) return cached;
    if ((wx as any).cloud && (wx as any).cloud.callFunction) {
      try {
        const res = await (wx as any).cloud.callFunction({ name: 'login' });
        const openid = (res && res.result && res.result.openid) || '';
        if (openid) {
          wx.setStorageSync(STORAGE_KEYS.USER_ID, openid);
          return openid;
        }
      } catch (e) {
        console.warn('cloud login failed, fallback to local id', e);
      }
    }
    const localId = `local_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    wx.setStorageSync(STORAGE_KEYS.USER_ID, localId);
    return localId;
  } catch (error) {
    console.error('getOrInitUserId error', error);
    const localId = `local_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    try { wx.setStorageSync(STORAGE_KEYS.USER_ID, localId); } catch {}
    return localId;
  }
};

export const getStoredPhone = (): string => {
  try {
    return wx.getStorageSync(STORAGE_KEYS.USER_PHONE) || '';
  } catch {
    return '';
  }
};

export const setStoredPhone = (phone: string) => {
  try {
    wx.setStorageSync(STORAGE_KEYS.USER_PHONE, phone || '');
  } catch {}
};

/**
 * AI 调用工具函数
 */
export interface AICallOptions {
  action: 'chat' | 'generate' | 'analyze' | 'optimize';
  prompt: string;
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

export const callAI = async (options: AICallOptions): Promise<string> => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'ai',
      data: {
        action: options.action,
        prompt: options.prompt,
        messages: options.messages
      }
    });

    const result = res.result as any;
    if (result.ok) {
      return result.content || '';
    } else {
      throw new Error(result.error || 'AI service error');
    }
  } catch (error: any) {
    console.error('AI call error', error);
    throw new Error(error.errMsg || error.message || 'AI 调用失败');
  }
};

/**
 * 生成信件开头
 */
export const generateLetterOpening = async (keyword: string): Promise<string> => {
  const prompt = `请为一封写给未来自己的信生成开头，主题是"${keyword}"。要求：温暖、真诚、富有情感，字数在50-100字之间。`;
  return callAI({ action: 'chat', prompt });
};

/**
 * 分析信件情感倾向
 */
export const analyzeEmotion = async (content: string): Promise<string> => {
  const prompt = `请分析以下文字的情感倾向，简洁回复情感类型（如：积极、平和、焦虑、期待等）和简短分析（30字内）：\n\n${content}`;
  return callAI({ action: 'chat', prompt });
};

/**
 * 生成智能回复建议
 */
export const generateReplySuggestion = async (letterContent: string): Promise<string> => {
  const prompt = `有人在树洞里倾诉了以下内容，请给出一条温暖、治愈的回复建议（50-80字）：\n\n${letterContent}`;
  return callAI({ action: 'chat', prompt });
};

/**
 * 优化信件内容
 */
export const optimizeLetterContent = async (content: string): Promise<string> => {
  const prompt = `请帮我优化以下写给未来自己的信件内容，保持原意和情感，让表达更流畅、更有温度（保持字数相近）：\n\n${content}`;
  return callAI({ action: 'chat', prompt });
};

/**
 * 内容安全审核
 * 调用云函数进行内容审核，确保合规
 */
export const checkContent = async (content: string): Promise<{ ok: boolean; errMsg?: string }> => {
  try {
    const res = await wx.cloud.callFunction({
      name: 'contentCheck',
      data: { content }
    });

    const result = res.result as any;
    return {
      ok: result.ok || false,
      errMsg: result.errMsg || '审核失败'
    };
  } catch (error: any) {
    console.error('Content check error', error);
    // 审核接口失败时，为了不影响用户体验，可以选择放行
    // 但建议在生产环境中记录日志
    return {
      ok: true,
      errMsg: 'ok (fallback)'
    };
  }
};

/**
 * 检查成就解锁并显示通知
 * @param triggerType 触发类型：'writeLetter' | 'openLetter' | 'sendReply' | 'receiveReply'
 */
export const checkAchievements = (triggerType: string) => {
  try {
    // 获取历史解锁记录
    const unlockedAchievements: string[] = wx.getStorageSync('unlockedAchievements') || [];
    
    // 检查可能新解锁的成就
    const newUnlocked: string[] = [];
    
    // 获取当前数据
    const letters = wx.getStorageSync('letters') || [];
    const helpLetters = wx.getStorageSync('helpLetters') || [];
    const helpReplies = wx.getStorageSync('helpReplies') || [];
    const continuousDays = wx.getStorageSync('continuousDays') || 0;
    const aiOptimizedCount = wx.getStorageSync('aiOptimizedCount') || 0;
    
    // 计算特殊字段
    const moodTags = new Set(letters.map((l: any) => l.mood).filter(Boolean));
    const uniqueMoodCount = moodTags.size;
    
    const lateNightLetters = letters.filter((l: any) => {
      const hour = new Date(l.createdAt).getHours();
      return hour >= 23 || hour < 2;
    }).length;
    
    const letterViewCount = letters.filter((l: any) => {
      const isOpened = new Date(l.openAt) <= new Date();
      return isOpened && l.readCount && l.readCount > 0;
    }).length;
    
    // 成就检查映射（包含积分奖励）
    const achievementChecks: Record<string, { condition: boolean; title: string; message: string; points: number }> = {
      'first_letter': {
        condition: letters.length >= 1 && !unlockedAchievements.includes('first_letter'),
        title: '初见自己',
        message: '你终于开始和自己对话了，这封信是勇敢的起点。',
        points: 100
      },
      'time_messenger': {
        condition: letters.length >= 10 && !unlockedAchievements.includes('time_messenger'),
        title: '时间的信使',
        message: '10封信，10次对自己说出心里话，你开始认真看见自己了。',
        points: 200
      },
      'emotion_decoder': {
        condition: uniqueMoodCount >= 10 && !unlockedAchievements.includes('emotion_decoder'),
        title: '情绪解码者',
        message: '你已经给10种不同的情绪都写过信了，你比你想象的更懂自己。',
        points: 150
      },
      'gentle_persistence': {
        condition: continuousDays >= 7 && !unlockedAchievements.includes('gentle_persistence'),
        title: '温柔的坚持',
        message: '7天里，你没忘记对自己说一句：「我很好」。',
        points: 300
      },
      'hundred_letters': {
        condition: letters.length >= 100 && !unlockedAchievements.includes('hundred_letters'),
        title: '写满100封',
        message: '100封信，100个你。你已走过100个情绪角落。',
        points: 1000
      },
      'tree_guardian': {
        condition: helpReplies.length >= 5 && !unlockedAchievements.includes('tree_guardian'),
        title: '树洞守护者',
        message: '你回的每句话，都像一束光，照进了别人的树洞。',
        points: 200
      },
      'resonance_ripple': {
        condition: helpReplies.length >= 20 && !unlockedAchievements.includes('resonance_ripple'),
        title: '共鸣的涟漪',
        message: '你的20句回应，正成为20个人心底的涟漪。',
        points: 400
      },
      'midnight_listener': {
        condition: lateNightLetters >= 10 && !unlockedAchievements.includes('midnight_listener'),
        title: '深夜倾听者',
        message: '深夜给自己写过10封信，你是自己最懂的那个人。',
        points: 250
      },
      'gratitude_seed': {
        condition: letters.filter((l: any) => l.mood === 'grateful').length >= 10 && !unlockedAchievements.includes('gratitude_seed'),
        title: '感谢的种子',
        message: '你已种下10颗感恩的种子，它们会在心里慢慢开花。',
        points: 150
      },
      'see_your_light': {
        condition: letterViewCount >= 30 && !unlockedAchievements.includes('see_your_light'),
        title: '看见自己的光',
        message: '你重读了30封自己的信。你开始发现，曾经的自己闪闪发光。',
        points: 300
      },
      'emotion_archaeology': {
        condition: letterViewCount >= 50 && !unlockedAchievements.includes('emotion_archaeology'),
        title: '情绪的考古学家',
        message: '你读了50封过去的信，像挖掘珍宝一样，找回了很多情绪碎片。',
        points: 500
      },
      'unfinished_completeness': {
        condition: letters.length >= 50 && helpReplies.length >= 10 && !unlockedAchievements.includes('unfinished_completeness'),
        title: '未完成的圆满',
        message: '50封自己的信 + 10次对别人的陪伴，不完美，但已足够美好。',
        points: 600
      },
      'worry_poet': {
        condition: helpReplies.length >= 50 && !unlockedAchievements.includes('worry_poet'),
        title: '解忧的诗人',
        message: '50次倾听，50次共鸣。你的文字有治愈的力量。',
        points: 800
      },
      'emotion_explorer': {
        condition: aiOptimizedCount >= 20 && !unlockedAchievements.includes('emotion_explorer'),
        title: '情绪探索者',
        message: '用AI优化了20次，你在学着用更好的方式表达自己。',
        points: 250
      },
      'night_companion': {
        condition: lateNightLetters >= 30 && continuousDays >= 14 && !unlockedAchievements.includes('night_companion'),
        title: '夜晚的陪伴者',
        message: '深夜里写了30封信，连续14天没断过，你是自己最长情的陪伴。',
        points: 500
      }
    };
    
    // 检查每个成就
    for (const [id, check] of Object.entries(achievementChecks)) {
      if (check.condition) {
        newUnlocked.push(id);
      }
    }
    
    // 如果有新解锁的成就，显示通知并更新记录
    if (newUnlocked.length > 0) {
      const updatedUnlocked = [...unlockedAchievements, ...newUnlocked];
      wx.setStorageSync('unlockedAchievements', updatedUnlocked);
      
      // 显示第一个新解锁的成就
      const firstNew = newUnlocked[0];
      const achievement = achievementChecks[firstNew];
      showAchievementUnlockModal(achievement.title, achievement.message, achievement.points);
    }
  } catch (error) {
    console.error('Check achievements error:', error);
  }
};

/**
 * 显示成就解锁弹窗
 */
const showAchievementUnlockModal = (title: string, message: string, points: number) => {
  wx.showModal({
    title: `🎉 解锁成就：${title}`,
    content: `${message}\n\n获得${points}积分奖励！`,
    showCancel: false,
    confirmText: '好的',
    confirmColor: '#8B5CF6'
  });
  
  // 增加积分（不显示toast，因为已经有弹窗了）
  addUserPoints(points, `解锁成就：${title}`, false);
};

/**
 * 增加用户积分
 * @param points 积分数量
 * @param reason 获得原因
 * @param showToast 是否显示提示
 */
export const addUserPoints = (points: number, reason: string, showToast: boolean = true) => {
  try {
    const currentPoints = wx.getStorageSync('userPoints') || 0;
    const newPoints = currentPoints + points;
    wx.setStorageSync('userPoints', newPoints);
    
    // 添加积分记录
    const history = wx.getStorageSync('pointsHistory') || [];
    const record = {
      id: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      title: reason,
      icon: '✨',
      points,
      type: 'earn',
      timestamp: Date.now(),
      timeText: '刚刚'
    };
    
    history.unshift(record);
    if (history.length > 100) {
      history.length = 100;
    }
    
    wx.setStorageSync('pointsHistory', history);
    
    if (showToast) {
      wx.showToast({
        title: `+${points}积分`,
        icon: 'success'
      });
    }
    
    return newPoints;
  } catch (error) {
    console.error('Add user points error:', error);
    return 0;
  }
};

/**
 * 扣除用户积分
 * @param points 积分数量
 * @param reason 扣除原因
 */
export const deductUserPoints = (points: number, reason: string): boolean => {
  try {
    const currentPoints = wx.getStorageSync('userPoints') || 0;
    
    if (currentPoints < points) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return false;
    }
    
    const newPoints = currentPoints - points;
    wx.setStorageSync('userPoints', newPoints);
    
    // 添加积分记录
    const history = wx.getStorageSync('pointsHistory') || [];
    const record = {
      id: `${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      title: reason,
      icon: '💎',
      points,
      type: 'spend',
      timestamp: Date.now(),
      timeText: '刚刚'
    };
    
    history.unshift(record);
    if (history.length > 100) {
      history.length = 100;
    }
    
    wx.setStorageSync('pointsHistory', history);
    
    return true;
  } catch (error) {
    console.error('Deduct user points error:', error);
    return false;
  }
};

/**
 * 获取用户当前积分
 */
export const getUserPoints = (): number => {
  try {
    return wx.getStorageSync('userPoints') || 0;
  } catch (error) {
    console.error('Get user points error:', error);
    return 0;
  }
};
