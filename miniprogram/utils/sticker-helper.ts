/**
 * 贴纸工具函数
 */

/**
 * 赠送随机贴纸
 * @param source 来源：daily-每日签到, achievement-成就, reply-回复
 * @param category 可选：指定分类
 */
export async function grantRandomSticker(
  source: 'daily' | 'achievement' | 'reply' | 'system',
  category?: 'healing' | 'encourage' | 'time' | 'life' | 'growth'
): Promise<{
  success: boolean;
  isNew: boolean;
  sticker?: any;
  message: string;
}> {
  try {
    // 获取所有贴纸
    const allRes = await (wx as any).cloud.callFunction({
      name: 'stickers',
      data: { action: 'listAll' }
    });

    let availableStickers = allRes.result?.list || [];
    
    // 如果指定了分类，过滤
    if (category) {
      availableStickers = availableStickers.filter(
        (s: any) => s.category === category
      );
    }

    if (availableStickers.length === 0) {
      return {
        success: false,
        isNew: false,
        message: '没有可赠送的贴纸'
      };
    }

    // 随机选择一个贴纸
    const randomSticker = availableStickers[
      Math.floor(Math.random() * availableStickers.length)
    ];

    // 尝试赠送
    const grantRes = await (wx as any).cloud.callFunction({
      name: 'stickers',
      data: {
        action: 'grantSticker',
        data: {
          stickerId: randomSticker.id,
          source
        }
      }
    });

    return {
      success: grantRes.result?.success || false,
      isNew: grantRes.result?.isNew || false,
      sticker: randomSticker,
      message: grantRes.result?.isNew 
        ? `获得新贴纸: ${randomSticker.name}` 
        : '你已拥有这个贴纸'
    };
  } catch (error) {
    console.error('Grant random sticker error:', error);
    return {
      success: false,
      isNew: false,
      message: '赠送贴纸失败'
    };
  }
}

/**
 * 显示贴纸获得提示
 */
export function showStickerToast(result: {
  success: boolean;
  isNew: boolean;
  sticker?: any;
  message: string;
}) {
  if (result.success && result.isNew && result.sticker) {
    wx.showToast({
      title: `🎁 ${result.message}`,
      icon: 'none',
      duration: 2000
    });
  }
}

/**
 * 赠送贴纸并显示提示
 */
export async function grantAndShowSticker(
  source: 'daily' | 'achievement' | 'reply' | 'system',
  category?: 'healing' | 'encourage' | 'time' | 'life' | 'growth'
): Promise<boolean> {
  const result = await grantRandomSticker(source, category);
  showStickerToast(result);
  return result.isNew;
}
