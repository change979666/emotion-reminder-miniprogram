# 数据存储迁移指南

> **当前状态**：测试阶段，使用本地存储（wx.Storage）  
> **计划迁移**：云开发模式，使用云数据库（wx.cloud.database）

---

## 📊 当前数据存储结构

### 核心存储键（STORAGE_KEYS）

位置：`miniprogram/utils/util.ts`

```typescript
const STORAGE_KEYS = {
  LETTERS: 'future_letters',        // 未来信件
  COMMUNITY_POSTS: 'community_posts', // 社区帖子
  HELP_LETTERS: 'help_letters',     // 树洞求助信
  HELP_REPLIES: 'help_replies',     // 树洞回信
  NOTIFICATIONS: 'notifications',   // 消息通知
  USER_ID: 'local_user_id',        // 本地用户ID
  USER_PHONE: 'user_phone',         // 用户手机号
  ENCRYPT_KEY: 'encrypt_key'        // 加密口令
};
```

---

## 🗂️ 数据集合清单（需迁移到云数据库）

### 1. **信件相关**（最核心）

#### `letters` - 未来信件集合
- **当前存储**：`wx.getStorageSync('future_letters')`
- **数据结构**：
```typescript
{
  id: string;              // 信件唯一ID
  title: string;           // 标题
  content: string;         // 内容
  targetDate: string;      // 送达日期 YYYY-MM-DD
  createdAt: number;       // 创建时间戳
  opened: boolean;         // 是否已拆封
  openedAt?: number;       // 拆封时间
  userId: string;          // 作者ID（迁移云后改为_openid）
  shareable: boolean;      // 是否分享到社区
  published: boolean;      // 是否已发布
  tags?: string[];         // 标签
  mood?: string;           // 情绪标签
  likeCount: number;       // 点赞数
  communityTags?: Record<string, number>; // 社区情感标签
  comments?: Array<{      // 短评列表
    id: string;
    text: string;
    time: number;
  }>;
}
```
- **使用页面**：
  - `pages/index/index.ts` - 首页信件列表
  - `pages/write/write.ts` - 写信页
  - `pages/letters/letters.ts` - 信箱页
  - `pages/letter-detail/letter-detail.ts` - 信件详情
  - `pages/community/community.ts` - 社区广场

---

#### `helpLetters` - 树洞求助信
- **当前存储**：`wx.getStorageSync('help_letters')`
- **数据结构**：
```typescript
{
  id: string;
  userId: string;          // 求助者ID
  title: string;
  content: string;
  createdAt: number;
  category?: string;       // 困扰类型
  anonymous: boolean;      // 是否匿名
  status: 'pending' | 'replied' | 'resolved';
}
```
- **使用页面**：
  - `pages/help/index.ts` - 解忧信箱主页
  - `pages/help/write.ts` - 写求助信
  - `pages/help/inbox.ts` - 查看回信
  - `pages/messages/messages.ts` - 消息通知

---

#### `helpReplies` - 树洞回信
- **当前存储**：`wx.getStorageSync('help_replies')`
- **数据结构**：
```typescript
{
  id: string;
  letterId: string;        // 对应的求助信ID
  userId: string;          // 回信者ID
  content: string;
  createdAt: number;
  anonymous: boolean;
}
```
- **使用页面**：
  - `pages/help/reply.ts` - 回信页
  - `pages/help/inbox.ts` - 收件箱

---

### 2. **社区评论系统**

#### `comments_{postId}` - 评论数据（按帖子分组）
- **当前存储**：`wx.getStorageSync('comments_${postId}')`
- **数据结构**：
```typescript
{
  id: string;
  postId: string;
  text: string;
  anonymousId: string;     // 匿名用户ID
  createdAt: number;
  likeCount: number;
  replies?: Array<{
    id: string;
    commentId: string;
    text: string;
    anonymousId: string;
    createdAt: number;
  }>;
}
```
- **使用页面**：
  - `pages/post-detail/post-detail.ts` - 帖子详情页
  - `pages/community/community.ts` - 社区广场

---

### 3. **用户数据**

#### `userInfo` - 用户基本信息
- **当前存储**：`wx.getStorageSync('userInfo')`
- **数据结构**：
```typescript
{
  nickName: string;
  avatarUrl: string;
  phoneNumber?: string;
}
```
- **使用页面**：
  - `pages/settings/profile.ts` - 个人资料
  - `pages/index/index.ts` - 首页显示

---

#### `userId` / `local_user_id` - 用户唯一标识
- **当前存储**：`wx.getStorageSync('local_user_id')`
- **迁移说明**：云开发后使用 `_openid` 替代
- **使用位置**：几乎所有数据关联

---

#### `anonymousMapping` - 匿名ID映射表
- **当前存储**：`wx.getStorageSync('anonymousMapping')`
- **用途**：将真实userId映射到固定的匿名ID
- **数据结构**：`Record<userId, anonymousId>`
- **使用页面**：
  - `pages/post-detail/post-detail.ts` - 评论回复通知

---

### 4. **游戏化系统**

#### `userPoints` - 用户积分
- **当前存储**：`wx.getStorageSync('userPoints')`
- **数据类型**：`number`
- **使用页面**：
  - `pages/task-center/task-center.ts` - 任务中心
  - `pages/index/index.ts` - 首页积分徽章
  - `utils/util.ts` - 积分增减函数

---

#### `pointsHistory` - 积分历史记录
- **当前存储**：`wx.getStorageSync('pointsHistory')`
- **数据结构**：
```typescript
{
  id: string;
  type: 'earn' | 'spend';
  points: number;
  reason: string;
  timestamp: number;
}[]
```

---

#### `unlockedAchievements` - 已解锁成就
- **当前存储**：`wx.getStorageSync('unlockedAchievements')`
- **数据类型**：`string[]` - 成就ID列表
- **使用页面**：
  - `pages/achievements/achievements.ts` - 成就页
  - `pages/task-center/task-center.ts` - 任务中心
  - `utils/util.ts` - 成就检查函数

---

#### `claimedAchievementRewards` - 已领取的成就奖励
- **当前存储**：`wx.getStorageSync('claimedAchievementRewards')`
- **数据类型**：`string[]` - 成就ID列表

---

#### `completedDailyTasks` - 每日任务完成记录
- **当前存储**：`wx.getStorageSync('completedDailyTasks')`
- **数据结构**：
```typescript
{
  [taskId: string]: boolean;
}
```

---

#### `continuousDays` - 连续写信天数
- **当前存储**：`wx.getStorageSync('continuousDays')`
- **数据类型**：`number`

---

### 5. **通知消息**

#### `notifications` - 消息通知
- **当前存储**：`wx.getStorageSync('notifications')`
- **数据结构**：
```typescript
{
  id: string;
  toUserId: string;
  type: 'resonance' | 'comment' | 'reply';
  postId: string;
  commentId?: string;
  postTitle: string;
  fromName: string;
  content?: string;
  createdAt: number;
  read: boolean;
}[]
```
- **使用页面**：
  - `pages/messages/messages.ts` - 消息中心

---

### 6. **用户设置**

#### `preferences` - 用户偏好设置
- **当前存储**：`wx.getStorageSync('preferences')`
- **数据结构**：
```typescript
{
  theme: string;
  fontSize: string;
  darkMode: boolean;
  autoSave: boolean;
  vibration: boolean;
}
```
- **使用页面**：`pages/settings/preferences.ts`

---

#### `notificationSettings` - 通知设置
- **当前存储**：`wx.getStorageSync('notificationSettings')`
- **数据结构**：
```typescript
{
  letterReminder: boolean;
  systemMessage: boolean;
  nightMode: boolean;
}
```

---

#### `privacySettings` - 隐私设置
- **当前存储**：`wx.getStorageSync('privacySettings')`
- **使用页面**：`pages/settings/account.ts`

---

### 7. **交互数据**

#### `userPostLikes` - 用户点赞的帖子
- **当前存储**：`wx.getStorageSync('userPostLikes')`
- **数据结构**：`Record<postId, boolean>`
- **使用页面**：
  - `pages/post-detail/post-detail.ts`
  - `pages/community/community.ts`

---

#### `userCommentLikes` - 用户点赞的评论
- **当前存储**：`wx.getStorageSync('userCommentLikes')`
- **数据结构**：`Record<commentId, boolean>`

---

#### `userTags_{postId}` - 用户给帖子打的情感标签
- **当前存储**：`wx.getStorageSync('userTags_${postId}')`
- **数据结构**：`Record<tagId, boolean>`

---

### 8. **其他数据**

#### `feedbacks` - 用户反馈
- **当前存储**：`wx.getStorageSync('feedbacks')`
- **使用页面**：`pages/settings/contact.ts`

---

#### `timeCards` - 时光卡片
- **当前存储**：`wx.getStorageSync('timeCards')`
- **使用页面**：
  - `pages/letter-detail/letter-detail.ts`
  - `pages/cards/cards.ts`

---

#### `healingCards` - 治愈卡片
- **当前存储**：`wx.getStorageSync('healingCards')`

---

#### `activeSkin` - 当前激活的信纸皮肤
- **当前存储**：`wx.getStorageSync('activeSkin')`

---

#### `unlockedSkins` - 已解锁的皮肤
- **当前存储**：`wx.getStorageSync('unlockedSkins')`

---

#### `letter_draft` - 信件草稿
- **当前存储**：`wx.getStorageSync('letter_draft')`
- **临时数据**：不需要迁移到云端

---

#### `lastWriteDate` - 上次写信日期
- **当前存储**：`wx.getStorageSync('lastWriteDate')`
- **用于计算连续写信天数**

---

## 🚀 云开发迁移计划

### 阶段一：准备工作
1. ✅ 整理所有数据存储点（本文档）
2. ⏳ 设计云数据库集合结构
3. ⏳ 创建数据模型文档

### 阶段二：云数据库设计

#### 核心集合设计
```javascript
// 1. letters 集合
{
  _id: '',           // 云数据库自动生成
  _openid: '',       // 用户openid（云开发自动关联）
  title: '',
  content: '',
  targetDate: '',
  createdAt: 0,
  opened: false,
  shareable: false,
  published: false,
  // ...其他字段
}

// 2. help_letters 集合
// 3. help_replies 集合
// 4. comments 集合（统一管理，不再按postId分组）
// 5. notifications 集合
// 6. user_settings 集合（合并所有用户设置）
// 7. user_stats 集合（积分、成就、连续天数等）
// 8. user_interactions 集合（点赞、标签等）
```

### 阶段三：代码迁移

#### 需要修改的核心文件
1. **`utils/util.ts`** - 封装云数据库操作
   - `getLetters()` → `db.collection('letters').where({_openid}).get()`
   - `addLetter()` → `db.collection('letters').add()`
   - 等等...

2. **所有页面文件**
   - 替换 `wx.getStorageSync` → 云数据库查询
   - 替换 `wx.setStorageSync` → 云数据库更新

#### 迁移策略
- 保持接口不变：`getLetters()`、`addLetter()` 等函数名不变
- 内部实现从本地存储切换到云数据库
- 添加离线缓存机制（降级方案）

### 阶段四：数据同步
- 用户升级时一次性将本地数据上传到云端
- 提供数据导出/导入功能

---

## 📝 迁移注意事项

### 1. 用户标识变化
- **本地**：`local_user_id`（自生成）
- **云端**：`_openid`（云开发提供）
- **迁移**：需要建立映射关系

### 2. 匿名机制
- 社区评论的匿名ID需要保留
- 建立 `openid → anonymousId` 映射表

### 3. 数据安全
- 敏感数据加密存储
- 设置数据库权限规则
- 防止恶意读取他人数据

### 4. 性能优化
- 添加数据库索引
- 实现分页加载
- 缓存常用数据

### 5. 离线支持
- 关键数据保留本地缓存
- 网络异常时使用本地数据
- 网络恢复后自动同步

---

## 🔧 开发建议

### 当前测试阶段
- 继续使用本地存储
- 所有数据操作通过 `utils/util.ts` 封装
- 不要直接在页面中调用 `wx.getStorageSync`

### 迁移准备
1. 确保所有数据操作都经过工具函数
2. 避免硬编码存储键名
3. 统一使用 `STORAGE_KEYS` 常量

### 云开发上线前
1. 完成云数据库设计
2. 编写数据迁移脚本
3. 进行充分测试
4. 准备回滚方案

---

## 📊 数据使用统计

**本地存储操作分布**：
- `utils/util.ts` - 70次（核心工具函数）
- `pages/` - 130+ 次（各页面直接调用）
- 共涉及 20+ 个不同的存储键

**迁移优先级**：
1. 🔴 高优先级：`letters`, `helpLetters`, `helpReplies`, `notifications`
2. 🟡 中优先级：`comments`, `userPoints`, `achievements`
3. 🟢 低优先级：`preferences`, `feedbacks`, `skins`

---

## ✅ 行动清单

- [ ] 完成云开发环境配置
- [ ] 设计云数据库集合结构
- [ ] 创建数据库权限规则
- [ ] 封装云数据库操作函数
- [ ] 重构 `utils/util.ts`
- [ ] 逐页面迁移数据操作
- [ ] 实现数据同步机制
- [ ] 测试数据迁移流程
- [ ] 编写用户数据迁移指南

---

**更新时间**：2026-01-17  
**状态**：测试阶段 - 使用本地存储  
**下一步**：设计云数据库结构
