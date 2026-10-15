# 轻量化情感提醒助手（微信小程序）

一个面向“写给未来的自己”的轻量微信小程序：写信、投递到未来、信箱查看，并支持将部分信件**匿名发布到社区广场**。

> **数据存储方案**：微信云开发  
> 使用**云数据库**存储用户数据，配合**云函数**处理业务逻辑，支持**订阅消息**提醒功能。数据安全存储在微信官方云端，支持多设备同步。

## 功能概览

- **首页（情感主页）**
  - 展示头像/昵称（轻量授权）
  - 今日日期与提示语
  - 信件统计（已写/在路上）
  - 入口：写信 / 信箱 / 社区广场

- **写信页**
  - 标题、内容、目标日期、心情标签
  - **可分享（匿名）**开关：决定该信是否允许发布到广场
  - **到期提醒（订阅消息）**开关：通过云函数定时触发消息推送
  - 数据存储：云数据库 `letters` 集合

- **信箱页**
  - 按日期拆分：等待开启 / 已经抵达
  - 对开启"可分享"的信件提供**发布到广场/取消发布**按钮
  - 通过云数据库查询和更新信件状态

- **社区广场页（匿名信墙）**
  - 从云数据库读取已发布的信件（`shareable=true` 且 `published=true`）
  - 支持最新/热门排序
  - 匿名点赞、评论功能，数据实时同步

- **到期提醒**
  - 通过云函数定时任务（每日扫描）
  - 自动发送订阅消息给用户
  - 提醒用户有信件已到达

## 技术栈与说明

- **小程序**：TypeScript + WXML/WXSS
- **渲染**：Skyline（`app.json` 中已开启）
- **云开发**：微信云开发（云数据库 + 云函数 + 订阅消息）
- **注释规范**：关键逻辑使用 **JSDoc** 注释
- **数据存储**
  - 云数据库：`letters` 集合（信件数据）
  - 云数据库：`help_letters` 集合（树洞求助）
  - 云数据库：`comments` 集合（社区评论）
  - 云数据库：`notifications` 集合（消息通知）
  - 云数据库：`user_stats` 集合（用户积分、成就等）

## 快速开始

### 前置准备
1. 注册微信小程序账号
2. 开通云开发服务
3. 在微信开发者工具中配置云开发环境

### 本地开发
1. 使用微信开发者工具打开本项目（根目录）
2. 在工具中关联您的云开发环境
3. 部署云函数到云端
4. 初始化云数据库集合
5. 开始调试

## 云开发配置

### 1）初始化云开发环境

编辑 `miniprogram/app.ts`，确保云开发已初始化：

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
    // ... 其他代码
  },
})
```

### 2）配置云环境 ID 与模板 ID

编辑 `miniprogram/config.ts`：

- `CLOUD_ENV_ID`：你的云开发环境 ID（在开发者工具"云开发"面板可查看）
- `REMINDER_TEMPLATE_ID`：订阅消息模板 ID（公众平台创建模板后获取）

### 3）创建云数据库集合

在云开发控制台创建以下集合：

- **`letters`**：存储用户信件
- **`help_letters`**：存储树洞求助信
- **`help_replies`**：存储树洞回信
- **`comments`**：存储社区评论
- **`notifications`**：存储消息通知
- **`user_stats`**：存储用户积分、成就等数据

> 权限设置：建议使用"仅创建者可读写"规则，确保数据安全。

### 4）部署云函数

### 4）部署云函数

项目已提供云函数目录：

- `cloudfunctions/login`：获取用户 openid
- `cloudfunctions/reminder`：定时扫描并发送订阅消息
- `cloudfunctions/letters`：信件数据操作
- `cloudfunctions/phone`：获取用户手机号

在开发者工具的"云开发"面板中上传并部署这些云函数。

### 5）配置云函数定时触发器

为 `reminder` 云函数配置定时触发器：
- 触发周期：每天早上 8:00
- 用于扫描到期信件并发送订阅消息

### 5）订阅消息模板字段说明（需要你对齐）

`cloudfunctions/reminder/index.js` 里默认按如下字段发送：

- `thing1`：标题（截取 20 字）
- `date2`：日期（YYYY-MM-DD）
- `thing3`：提示语

你创建模板时的字段名可能不同，请按实际模板字段名调整云函数发送的 `data` 键名。

## 目录结构

```
.
├─ miniprogram/                         # 小程序源码
│  ├─ app.json
│  ├─ app.ts                            # App 启动 & 云开发 init
│  ├─ app.wxss
│  ├─ config.ts                         # 云环境ID/订阅模板ID配置
│  ├─ components/
│  │  └─ navigation-bar/                # 自定义导航栏组件
│  ├─ pages/
│  │  ├─ index/                         # 首页（情感主页）
│  │  ├─ write/                         # 写信页
│  │  ├─ letters/                       # 我的信箱页
│  │  ├─ community/                     # 社区广场（匿名信墙）
│  │  └─ logs/                          # 示例日志页（调试）
│  ├─ utils/
│  │  └─ util.ts                        # 时间格式化等工具
│  └─ sitemap.json
├─ cloudfunctions/                      # 云函数（可选）
│  ├─ login/
│  │  ├─ index.js
│  │  └─ package.json
│  └─ reminder/
│     ├─ index.js
│     ├─ config.json                    # 定时触发器 + openapi 权限
│     └─ package.json
├─ typings/                             # 小程序 typings
├─ project.config.json
├─ project.private.config.json
├─ tsconfig.json
└─ package.json
```

## 数据结构（简要）

- **本地存储 Key**
  - `futureLetters`: `FutureLetter[]`（信件列表）
  - `communityPosts`: `CommunityPost[]`（社区帖子点赞数据）

- **信件字段（关键）**
  - `id`: 唯一标识
  - `title`: 标题
  - `content`: 正文内容
  - `targetDate`: 目标日期（YYYY-MM-DD）
  - `createdAt`: 创建时间戳
  - `mood`: 心情标识
  - `shareable`: 是否允许匿名发布
  - `published`: 是否已发布到社区（本地存储模式）
  - `remindEnabled`: 是否开启到期提醒（迁移到云开发后启用）

## 迁移到云开发后的改动点

1. **写信页** (`miniprogram/pages/write/write.ts`)
   - 恢复 `saveToCloud()` 方法，保存时同步写入云数据库
   - 恢复订阅消息请求逻辑（取消注释）

2. **信箱页** (`miniprogram/pages/letters/letters.ts`)
   - 恢复云数据库的发布/取消发布逻辑

3. **社区页** (`miniprogram/pages/community/community.ts`)
   - 改为从云数据库 `community_posts` 读取
   - 点赞改为云数据库更新操作

4. **云函数**
   - 部署 `reminder` 云函数，启用定时发送订阅消息

