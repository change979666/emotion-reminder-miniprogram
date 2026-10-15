# 轻量化情感提醒助手 - 项目文档

## 📋 项目简介

一个面向"写给未来的自己"的轻量微信小程序：写信、投递到未来、信箱查看，并支持**匿名求助**与**社区互动**。

**当前版本**：v3.0.0（情感化升级，本地存储模式）  
**更新日期**：2026年1月16日  
**开发状态**：🟢 活跃开发中

> 所有数据（信件、社区帖子、点赞、用户设置）均存储在本地，方便测试功能。  
> 测试完成后，可一键迁移到云开发（云数据库 + 云函数 + 订阅消息）。

---

## ✨ 功能清单

### 📱 首页（个人主页）

#### 用户信息卡片
- ✅ 头像/昵称编辑（支持微信授权 `chooseAvatar`）
- ✅ 6位短ID显示（哈希算法生成，可复制）
- ✅ 日期显示（年.月.日 星期X）
- ✅ 右上角成就徽章：🔥连续写信天数、⭐积分
- ✅ 登录引导提示：未设置头像/昵称时展示轻量引导

#### 数据统计（4项横向排列）
- ✅ **写下的信**：累计写信总数
- ✅ **已送达**：已到期的信件数
- ✅ **在路上**：未来待送达的信件数
- ✅ **获得回信**：解忧杂货铺收到的回信数

#### 功能入口（5格图标网格）
- ✏️ **写信**：跳转到写信页
- 📮 **信箱**：查看我的信件
- 💬 **解忧**：解忧杂货铺
- 📊 **成长报告**：时光成长报告
- ⚙️ **设置**：个人设置中心

#### 解忧信箱动态
- ✅ 显示最新投递的树洞信状态
- ✅ 回信数量提示
- ✅ 快速跳转到收件箱

#### 成就名片
- ✅ 成就卡片（锁定/进行中/完成）
- ✅ 已内置：时光记录者、温柔回声、连续写信、温暖积攒

#### 每日温柔签
- ✅ 每日首次打开弹出全屏温柔签
- ✅ 手写体 + 纸质纹理背景
- ✅ 30+ 本地金句库
- ✅ 今日心情签到（解锁信纸皮肤）
- ✅ 签到天数累计（本地保存）

---

### ✏️ 写信页

#### 基础信息
- ✅ 标题、正文内容
- ✅ 目标日期选择（送达日期）
- ✅ 心情标签（开心/平静/难过/兴奋/焦虑/感恩等）
- ✅ 分类选择（例如：成长/感情/家庭/梦想/学业/工作/健康）
- ✅ 标签自定义（逗号分隔）
- ✅ 地点记录（允许获取定位）
- ✅ 目标/愿望填写
- ✅ 温柔文案占位与提示语（去AI味优化）

#### 时光彩蛋（媒体附件）
- ✅ 📸 **图片**：支持上传最多9张图片
- ✅ 🎬 **视频**：支持上传1个视频
- 🎤 **语音**：预留功能（待开发）
- ~~模板功能~~：已删除

#### 隐私设置
- ✅ **可分享**开关：允许匿名发布到社区广场
- ✅ **本地加密**开关：使用口令对内容加密
- ✅ **到期提醒**开关：已展示在写信页（本地模式仅提示，迁移云开发后启用）

#### 数据存储
- 本地：`wx.setStorageSync('future_letters')`
- 云端（待迁移）：云数据库 `letters` 集合

---

### 📮 信箱页

- ✅ **按送达状态分类**：
  - 等待开启：未到期的信件
  - 已经抵达：已到期可查看的信件
- ✅ 搜索（标题/内容/标签）
- ✅ 排序（最新/最早/最早送达/最晚送达）
- ✅ 管理模式（多选批量删除/还原）
- ✅ 回收站（软删除/还原/永久删除）
- ✅ 对"可分享"的信件提供**发布/取消发布**按钮
- ✅ 信件详情查看
- ✅ 支持多媒体附件展示（图片、视频）
- ✅ 已读/未读手绘标记（🔖 未拆封 / ✓ 已拆封）
- ✅ 明日提醒文案（开启提醒且为明日到期时展示）

---

### 💌 拆信详情页（letter-detail）
- ✅ 拆信仪式动效（信封展开 + 信纸滑出）
- ✅ 轻微震动反馈
- ✅ 时光小提问弹窗（随机提问）
- ✅ 记录并保存“对过去自己的回信/感想”
- ✅ 信纸皮肤切换（原木/樱花/星空）
- ✅ 拆信沙沙声（音效开关）
- ✅ 加密信件解锁（口令验证后显示正文）
- ✅ 目标/愿望完成状态展示
- ✅ 复制内容、导出文本
- ✅ 首次拆信触发目标打卡弹窗
- ✅ 生成“时光对比卡片”（当时的期待 + 现在的结果）

---

### 🌍 社区广场页（匿名信墙）

- ✅ 展示已发布的匿名信件（**15条多样化示例数据**）
- ✅ 排序方式：**最新** / **热门**
- ✅ 点赞功能（本地存储）
- ✅ 匿名贴贴标签与10字短评
- ✅ 贴贴标签统计（单独字段，不影响信件标签）
- ✅ 今日主题便签
- ✅ 「陌生人的温柔」精选回信
- ✅ 主题标签显示（勇气、梦想、爱情、成长、亲情、自由、坚持、希望、改变、感恩、友情、突破、平静、未来、回忆）
- ✅ 点赞数范围：12-45

---

### 💬 解忧杂货铺（匿名树洞）

- ✅ **主页**（help/index）：展示求助信列表（匿名）
- ✅ **写信页**（help/write）：投递树洞求助信
- ✅ **收件箱**（help/inbox）：查看收到的回信
- ✅ **回复页**（help/reply）：给他人的求助写回信
- ✅ 完全匿名，保护隐私
- ✅ 捞一捞随机温柔提示 + 小惊喜
- ✅ 回信引导轮播 + 温柔模板参考
- ✅ 回信状态与预计时效提示
- ✅ 治愈小纸条生成（保存至本地）

---

### 🧾 时光卡片生成器（cards）
- ✅ 选择“治愈小纸条”生成海报
- ✅ 选择“时光对比卡片”（当时的期待 + 现在的结果）
- ✅ Canvas 纸质纹理背景
- ✅ 保存到相册

---

### ⚙️ 设置中心（7个子功能页）

#### 1. 个人资料（settings/profile）
- ✅ 更换头像（微信授权 `open-type="chooseAvatar"`）
- ✅ 编辑昵称（支持 `type="nickname"` 输入组件）
- ✅ 个性签名（50字限制）
- ✅ 实时自动保存到本地存储

#### 2. 账号与隐私（settings/account）
- ✅ 用户ID显示（6位短码，点击可复制）
- 🔜 手机号绑定（预留云函数接口 `getPhoneNumber`）
- ✅ 信件加密口令设置（用于本地加密/解密）
- ✅ 隐私开关（3项）：
  - 允许他人搜索
  - 显示在线状态
  - 允许陌生人私信
- ✅ 设置实时保存

#### 3. 提醒设置（settings/notification）
- ✅ 信件送达提醒开关
- ✅ 回信通知开关
- ✅ 系统消息开关
- ✅ 勿扰模式（可设置时间段：如22:00-08:00）
- ✅ 支持时间选择器

#### 4. 偏好设置（settings/preferences）
- ✅ 默认心情标签选择（6种情绪）
- ✅ 字体大小切换（小/中/大，三选一）
- ✅ 深色模式开关
- ✅ 自动保存草稿开关

#### 5. 平台协议（settings/agreement）
- ✅ 用户服务协议全文（6大条款）
  - 服务说明
  - 账号管理
  - 隐私保护
  - 内容规范
  - 免责声明
  - 协议修订
- ✅ 更新时间显示：2026年1月16日

#### 6. 关于我们（settings/about）
- ✅ 应用介绍与Slogan："记录当下，寄语未来"
- ✅ 4大功能特性展示（图标+描述）
- ✅ 版本信息（v1.0.0）
- ✅ 更新日期（2026.01.16）
- ✅ 检查更新功能
- ✅ 版权信息

#### 7. 联系客服/反馈（settings/contact）
- ✅ 反馈类型选择（功能建议/问题反馈/内容举报/其他）
- ✅ 反馈内容提交（500字限制，实时字数统计）
- ✅ 联系方式选填（微信号/手机号/邮箱）
- ✅ 本地保存反馈记录到 `wx.setStorageSync('feedbacks')`
- ✅ 提交成功后自动返回

---

### 🚪 退出登录

- ✅ 二次确认弹窗
- ✅ 清除所有本地数据（`wx.clearStorageSync()`）
- ✅ 自动跳转回首页

---

## 🛠️ 技术栈

### 核心技术
- **框架**：微信小程序原生开发
- **语言**：TypeScript + WXML + WXSS
- **渲染引擎**：Skyline（`app.json` 中已开启）
- **组件框架**：glass-easel（Skyline配套）

### 开发规范
- **代码注释**：JSDoc 格式 + TypeScript 类型定义
- **命名规范**：
  - 页面文件：`kebab-case`（小写+连字符）
  - 组件：`PascalCase`（驼峰命名）
  - 变量/函数：`camelCase`（驼峰命名）
  - 常量：`SNAKE_CASE`（全大写+下划线）

### UI设计
- **配色方案**：橙黄色系渐变
  - 主色：#f97316（橙色）
  - 辅助色：#ffe4c4、#ffd7a8
  - 强调色：#ea580c、#d97706
- **设计风格**：
  - 圆角卡片（border-radius: 16-24rpx）
  - 毛玻璃效果（backdrop-filter: blur）
  - 多层阴影（box-shadow）
  - 渐变背景（linear-gradient）

### 存储方案（当前版本）
- **本地存储**：`wx.setStorageSync()`
- **主要数据**：
  - `future_letters`：信件列表（含分类/标签/目标/加密等字段）
  - `community_posts`：社区帖子（已发布信件）
  - `help_letters`：解忧求助信
  - `help_replies`：解忧回信
  - `local_user_id`：本地用户唯一ID
  - `user_phone`：用户手机号（云函数获取后持久化）
  - `encrypt_key`：信件加密口令
  - `userInfo`：用户资料
  - `privacySettings`：隐私设置
  - `notificationSettings`：提醒设置
  - `preferences`：偏好设置（含深色模式）
  - `feedbacks`：用户反馈
  - `continuousDays`：连续写信天数
  - `totalPoints`：积分
  - `healingCards`：治愈小纸条收藏
  - `surprises`：小惊喜记录
  - `lastDailySignDate`：每日温柔签显示时间
  - `lastWriteDate`：上次写信日期
  - `unlockedSkins`：已解锁信纸皮肤
  - `activeSkin`：当前使用皮肤
  - `signInDays`：心情签到天数
  - `timeCards`：时光对比卡片
- **云端存储（待迁移）**：云数据库集合 `letters`、`community_posts`

---

## 📁 项目结构

```
轻量化情感提醒助手/
├─ miniprogram/                         # 小程序源码
│  ├─ app.json                          # 小程序配置（页面注册、tabBar、Skyline）
│  ├─ app.ts                            # App 启动 & 云开发 init（待启用）
│  ├─ app.wxss                          # 全局样式
│  ├─ config.ts                         # 云环境ID/订阅模板ID配置
│  ├─ config/                            # 文案&金句配置
│  │  ├─ copywriting.js                  # 温柔文案配置
│  │  └─ quotes.js                       # 每日温柔签金句库
│  ├─ styles/                            # 动画样式
│  │  └─ animation.wxss                  # 信封/信纸动效
│  ├─ sitemap.json                      # 搜索配置
│  │
│  ├─ assets/                           # 资源文件
│  │  └─ icons/                         # 图标（预留）
│  │  └─ audio/                         # 音效（纸张沙沙声）
│  │
│  ├─ components/                       # 自定义组件
│  │  └─ navigation-bar/                # 自定义导航栏组件
│  │     ├─ navigation-bar.ts           # 逻辑：返回按钮、标题
│  │     ├─ navigation-bar.wxml         # UI：标题栏布局
│  │     ├─ navigation-bar.wxss         # 样式：透明背景、安全区
│  │     └─ navigation-bar.json
│  │
│  ├─ pages/                            # 页面目录
│  │  │
│  │  ├─ index/                         # 首页（个人主页）
│  │  │  ├─ index.ts                    # 逻辑：用户信息、统计数据、成就系统
│  │  │  ├─ index.wxml                  # UI：用户卡片、4项统计、4格功能入口
│  │  │  ├─ index.wxss                  # 样式：渐变卡片、徽章、网格布局
│  │  │  └─ index.json
│  │  │
│  │  ├─ write/                         # 写信页
│  │  │  ├─ write.ts                    # 逻辑：多图片、视频上传，心情标签
│  │  │  ├─ write.wxml                  # UI：表单、时光彩蛋区、隐私开关
│  │  │  ├─ write.wxss                  # 样式：输入框、媒体预览
│  │  │  └─ write.json
│  │  │
│  │  ├─ letters/                       # 信箱页
│  │  │  ├─ letters.ts                  # 逻辑：信件列表、发布/取消发布
│  │  │  ├─ letters.wxml                # UI：信件卡片、状态标签
│  │  │  ├─ letters.wxss
│  │  │  └─ letters.json
│  │  │
│  │  ├─ letter-detail/                 # 拆信详情页
│  │  │  ├─ letter-detail.ts
│  │  │  ├─ letter-detail.wxml
│  │  │  ├─ letter-detail.wxss
│  │  │  └─ letter-detail.json
│  │  │
│  │  ├─ community/                     # 社区广场页
│  │  │  ├─ community.ts                # 逻辑：15条示例数据、排序、点赞
│  │  │  ├─ community.wxml              # UI：信墙卡片、主题标签
│  │  │  ├─ community.wxss
│  │  │  └─ community.json
│  │  │
│  │  ├─ cards/                         # 时光卡片生成器
│  │  │  ├─ cards.ts
│  │  │  ├─ cards.wxml
│  │  │  ├─ cards.wxss
│  │  │  └─ cards.json
│  │  │
│  │  ├─ help/                          # 解忧杂货铺（4个子页面）
│  │  │  ├─ index.ts/wxml/wxss/json    # 主页：求助信列表
│  │  │  ├─ write.ts/wxml/wxss/json    # 写信：投递树洞
│  │  │  ├─ inbox.ts/wxml/wxss/json    # 收件箱：查看回信
│  │  │  └─ reply.ts/wxml/wxss/json    # 回复页：给他人回信
│  │  │
│  │  ├─ settings/                      # 设置中心（8个页面）
│  │  │  ├─ settings.ts/wxml/wxss/json # 设置主页：列表式导航
│  │  │  ├─ profile.ts/wxml/wxss/json  # 个人资料：头像、昵称、签名
│  │  │  ├─ account.ts/wxml/wxss/json  # 账号与隐私：ID、手机号、隐私开关
│  │  │  ├─ notification.ts/wxml/wxss/json  # 提醒设置：通知开关、勿扰模式
│  │  │  ├─ preferences.ts/wxml/wxss/json   # 偏好设置：心情、字体、主题
│  │  │  ├─ agreement.ts/wxml/wxss/json     # 平台协议：服务条款全文
│  │  │  ├─ about.ts/wxml/wxss/json         # 关于我们：版本、特性、版权
│  │  │  └─ contact.ts/wxml/wxss/json       # 联系客服：反馈表单
│  │  │
│  │  └─ logs/                          # 示例日志页（调试用）
│  │     ├─ logs.ts
│  │     ├─ logs.wxml
│  │     ├─ logs.wxss
│  │     └─ logs.json
│  │
│  └─ utils/                            # 工具函数
│     └─ util.ts                        # 时间格式化、数据操作、ID生成
│
├─ cloudfunctions/                      # 云函数（待启用）
│  ├─ login/                            # 获取 openid
│  │  ├─ index.js
│  │  └─ package.json
│  ├─ phone/                            # 获取手机号
│  │  ├─ index.js
│  │  └─ package.json
│  ├─ letters/                          # 信件CRUD（505行完整实现）
│  │  ├─ index.js
│  │  └─ package.json
│  ├─ reminder/                         # 定时发送订阅消息
│  │  ├─ index.js
│  │  ├─ config.json                    # 定时触发器 + openapi 权限
│  │  └─ package.json
│  └─ seed/                             # 测试数据生成
│     ├─ index.js
│     └─ package.json
│
├─ typings/                             # TypeScript 类型定义
│  ├─ index.d.ts
│  └─ types/
│     ├─ index.d.ts
│     └─ wx/                            # 微信API类型
│        ├─ index.d.ts
│        ├─ lib.wx.api.d.ts
│        ├─ lib.wx.app.d.ts
│        ├─ lib.wx.behavior.d.ts
│        ├─ lib.wx.cloud.d.ts
│        ├─ lib.wx.component.d.ts
│        ├─ lib.wx.event.d.ts
│        └─ lib.wx.page.d.ts
│
├─ minitest/                            # 测试配置
│  └─ test.config.json
│
├─ project.config.json                  # 项目配置
├─ project.private.config.json          # 私有配置（gitignore）
├─ tsconfig.json                        # TypeScript 配置
├─ package.json                         # npm 依赖
└─ README.md                            # 项目文档（本文件）
```

---

## 📊 数据结构

### FutureLetter（未来信件）
```typescript
interface FutureLetter {
  id: string;                  // 唯一标识（local_时间戳_随机数）
  title: string;               // 标题
  content: string;             // 正文内容
  targetDate: string;          // 目标日期（YYYY-MM-DD）
  createdAt: number;           // 创建时间戳
  mood: string;                // 心情标识
  shareable: boolean;          // 是否允许匿名发布
  published: boolean;          // 是否已发布到社区
  remindEnabled: boolean;      // 是否开启到期提醒（待启用）
  capsuleImages?: string[];    // 图片路径数组（最多9张）
  capsuleVideoPath?: string;   // 视频路径
  capsuleAudioPath?: string;   // 音频路径（预留）
  opened?: boolean;            // 是否已拆封
  reflection?: string;         // 拆信后的感想
  category?: string;           // 分类
  tags?: string[];             // 标签（用于信箱搜索）
  encrypted?: boolean;         // 是否加密
  target?: string;             // 当时的小目标
  targetStatus?: 'done' | 'progress' | 'pending'; // 目标状态
  targetChecked?: boolean;     // 是否已打卡
  targetResult?: string;       // 目标结果描述
  locationText?: string;       // 定位文本
  deletedAt?: number;          // 软删除时间戳
  communityTags?: Record<string, number>; // 贴贴标签统计
  comments?: Array<{id: string; text: string; time: number}>; // 匿名短评
}
```

### HelpLetter（解忧求助信）
```typescript
interface HelpLetter {
  id: string;
  title: string;               // 标题
  content: string;             // 求助内容
  type: 'help';                // 类型标识
  createdAt: number;
  mood?: string;
  images?: string[];           // 图片附件
  videoPath?: string;          // 视频附件
}
```

### HelpReply（解忧回信）
```typescript
interface HelpReply {
  id: string;
  letterId: string;            // 关联的求助信ID
  content: string;             // 回复内容
  createdAt: number;
  isMyReply?: boolean;         // 是否本人回复（统计用）
}
```

### CommunityPost（社区帖子）
```typescript
interface CommunityPost {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  likeCount: number;           // 点赞数（12-45）
  mood: string;                // 主题标签
  communityTags?: Record<string, number>; // 贴贴标签统计
  comments?: Array<{id: string; text: string; time: number}>; // 匿名短评
}
```

### 用户设置相关
```typescript
// 用户信息
interface UserInfo {
  avatarUrl: string;
  nickName: string;
  signature?: string;          // 个性签名
}

// 隐私设置
interface PrivacySettings {
  allowSearch: boolean;
  showOnlineStatus: boolean;
  allowStrangerMessage: boolean;
}

// 提醒设置
interface NotificationSettings {
  letterArrival: boolean;
  replyNotice: boolean;
  systemMessage: boolean;
  nightMode: boolean;
}

// 偏好设置
interface Preferences {
  defaultMood: string;
  fontSize: 'small' | 'medium' | 'large';
  darkMode: boolean;
  autoSave: boolean;
}
```

---

## 🔧 核心功能实现

### 1. 6位短ID生成算法
**位置**：`miniprogram/pages/index/index.ts` 和 `miniprogram/utils/util.ts`

```typescript
function generateShortId(longId: string): string {
  if (!longId) return '000000';
  // 提取数字部分，取后6位
  const numStr = longId.replace(/\D/g, '');
  if (numStr.length >= 6) {
    return numStr.slice(-6);
  }
  // 不足6位时用哈希填充
  let hash = 0;
  for (let i = 0; i < longId.length; i++) {
    hash = ((hash << 5) - hash) + longId.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString().padStart(6, '0').slice(0, 6);
}
```

### 2. 多图片上传（最多9张）
**位置**：`miniprogram/pages/write/write.ts`

```typescript
onChooseImages() {
  const maxCount = 9 - this.data.capsuleImages.length;
  if (maxCount <= 0) {
    wx.showToast({ title: '最多上传9张图片', icon: 'none' });
    return;
  }
  wx.chooseImage({
    count: maxCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      this.setData({
        capsuleImages: [...this.data.capsuleImages, ...res.tempFilePaths]
      });
    }
  });
}
```

### 3. 社区示例数据生成
**位置**：`miniprogram/utils/util.ts`

```typescript
export function initSampleFutureLetters() {
  const existing = wx.getStorageSync('futureLetters') || [];
  if (existing.length > 0) return;
  
  const samples = [
    { title: '给自己的一封信', content: '...', mood: '勇气', likeCount: 23 },
    // ... 共15条数据
  ];
  
  wx.setStorageSync('futureLetters', samples.map(s => ({
    ...s,
    id: `local_${Date.now()}_${Math.random()}`,
    targetDate: '2026-12-31',
    createdAt: Date.now(),
    shareable: true,
    published: true
  })));
}
```

### 4. 成就系统（连续天数&积分）
**位置**：`miniprogram/pages/index/index.ts`

```typescript
loadAchievements() {
  const continuousDays = wx.getStorageSync('continuousDays') || 0;
  const totalPoints = wx.getStorageSync('totalPoints') || 0;
  this.setData({
    achievements: { continuousDays, totalPoints }
  });
}
```

---

## 🚀 快速开始

### 环境要求
- **微信开发者工具**：最新稳定版
- **Node.js**：v14+ （可选，用于云函数开发）

### 运行步骤
1. 使用**微信开发者工具**打开本项目（根目录）
2. 直接编译运行，所有功能基于本地存储，**无需配置云开发**即可测试
3. 首次运行会自动生成15条社区示例数据

### 体验功能
1. **首页**：查看统计数据、成就徽章
2. **写信**：尝试上传多张图片和视频
3. **信箱**：查看信件列表
4. **社区**：浏览匿名信墙，点赞互动
5. **解忧**：投递树洞，查看回信
6. **设置**：编辑个人资料、调整偏好

---

## 🔄 迁移到云开发

> **当前版本为本地存储模式，所有功能均可正常使用。**  
> 测试完成后，可按以下步骤迁移到云开发，启用云端数据同步与订阅消息提醒功能。

### 步骤1：恢复云开发初始化代码

编辑 `miniprogram/app.ts`：

```typescript
import { CLOUD_ENV_ID } from './config';

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 初始化云开发
    if (CLOUD_ENV_ID && wx.cloud && typeof wx.cloud.init === 'function') {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      });
    }
  },
})
```

### 步骤2：填写云开发环境 ID

编辑 `miniprogram/config.ts`：

```typescript
// 云开发环境 ID（在开发者工具"云开发"面板查看）
export const CLOUD_ENV_ID = 'your-env-id-xxxx';

// 订阅消息模板 ID（公众平台创建模板后获取）
export const REMINDER_TEMPLATE_ID = 'your-template-id-xxxx';
```

### 步骤3：创建云数据库集合

在云开发控制台创建以下集合：

| 集合名 | 用途 | 索引字段 | 权限 |
|--------|------|----------|------|
| `letters` | 用户信件 | `_openid`, `targetDate` | 仅创建者可读写 |
| `community_posts` | 社区帖子 | `createdAt`, `likeCount` | 所有人可读，仅创建者可写 |
| `help_letters` | 解忧求助信 | `createdAt` | 所有人可读，仅创建者可写 |
| `help_replies` | 解忧回信 | `letterId`, `createdAt` | 所有人可读，仅创建者可写 |

### 步骤4：部署云函数

在开发者工具的"云开发"面板中上传并部署：

1. **login**：获取用户 openid
2. **phone**：获取用户手机号
3. **letters**：信件CRUD操作（505行完整实现）
4. **reminder**：定时扫描到期信件并发送订阅消息
5. **seed**：生成测试数据

### 步骤5：配置 reminder 云函数

编辑 `cloudfunctions/reminder/config.json`：

```json
{
  "permissions": {
    "openapi": [
      "subscribeMessage.send"
    ]
  },
  "triggers": [
    {
      "name": "dailyReminder",
      "type": "timer",
      "config": "0 0 9 * * * *"
    }
  ]
}
```

**环境变量**：
- `REMINDER_TEMPLATE_ID`：订阅消息模板ID

### 步骤6：订阅消息模板

**模板字段建议**：
- `thing1`：信件标题（20字内）
- `date2`：送达日期（YYYY-MM-DD）
- `thing3`：温馨提示

### 步骤7：修改代码切换到云模式

**写信页** (`miniprogram/pages/write/write.ts`)：
- 取消注释 `saveToCloud()` 方法
- 恢复订阅消息请求逻辑

**信箱页** (`miniprogram/pages/letters/letters.ts`)：
- 改为云数据库查询
- 发布到社区改为写入 `community_posts` 集合

**社区页** (`miniprogram/pages/community/community.ts`)：
- 改为从云数据库 `community_posts` 读取
- 点赞改为云数据库更新操作

---

## 📝 更新日志

### v3.0.0 (2026-01-16)
- ✅ 情感化升级：温柔文案库、每日温柔签、随机彩蛋
- ✅ 拆信仪式感：信封展开 + 信纸滑出 + 震动 + 音效
- ✅ 信纸皮肤切换（原木/樱花/星空）
- ✅ 成就名片与成长报告
- ✅ 社区“今日主题”与“陌生人的温柔”板块
- ✅ 解忧回信模板与轮播引导
- ✅ 时光卡片生成器（海报生成/保存）

### v2.0.0 (2026-01-16)
- ✅ 社区互动与匿名树洞体系
- ✅ 解忧回信箱、状态与预计时效
- ✅ 治愈小纸条生成与收藏

### v1.0.0 (2026-01-16)
- ✅ 完成首页优化：4项统计、成就系统、图标网格
- ✅ 写信页支持多图片（9张）和视频上传
- ✅ 删除模板功能，简化交互
- ✅ 修复昵称输入框消失bug
- ✅ 新增完整设置中心（7个子页面）
- ✅ 实现6位短ID生成算法
- ✅ 扩展社区数据到15条
- ✅ 完善解忧杂货铺功能
- ✅ 添加退出登录功能
- ✅ 优化UI设计（渐变色、圆角卡片、毛玻璃效果）

---

## 📄 许可证

MIT License

---

## 📞 联系方式

如有问题或建议，欢迎通过小程序内"联系客服"功能反馈。

---

**开发者**: 轻量化情感提醒助手团队  
**最后更新**: 2026年1月16日  
**文档版本**: v1.0.0
