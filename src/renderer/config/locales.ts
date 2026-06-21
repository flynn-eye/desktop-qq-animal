// 所有用户可见的文案集中管理，便于后续 i18n 国际化
export const locales = {
  // 宠物名称
  petName: 'QQ宠物',

  // 状态面板标签
  statusLabels: {
    hunger: '饥饿',
    mood: '心情',
    clean: '清洁',
    health: '健康',
    energy: '能量',
    exp: '经验',
  },

  // 随机说话短语
  speechPhrases: [
    '主人~ 你在忙什么呢?',
    '今天天气好好呀!',
    '我好想出去玩~',
    '主人记得喂我哦!',
    '嘿嘿~',
    '无聊死了...',
    '主人主人~',
    '我想吃好吃的!',
    '嘿嘿，主人最好了!',
    '好困呀~ 想睡觉...',
    '主人在看我吗?',
    '我喜欢主人~',
    '陪我玩嘛~',
    '肚子咕咕叫了...',
  ],

  // 点击互动短语
  clickPhrases: [
    '嘿嘿~ 好舒服~',
    '别闹~',
    '好痒啊~',
    '哇! 主人你手速好快!',
  ],

  // 菜单说话短语
  menuSpeakPhrases: [
    '主人~ 我在这儿呢!',
    '汪汪~ 好无聊啊!',
    '今天吃什么好吃的?',
    '主人今天心情好吗?',
    '我想出去溜溜~',
    '嘿嘿, 主人最好了!',
    '抱抱~',
  ],

  // 右键菜单项
  contextMenu: {
    feed: '喂食 (恢复饥饿)',
    wash: '洗澡 (恢复清洁)',
    cure: '治疗 (恢复健康)',
    play: '玩耍 (恢复心情)',
    speak: '说话',
    walk: '走动',
    hideStatus: '隐藏状态面板',
    showStatus: '显示状态面板',
    hideToken: '隐藏 Token 面板',
    showToken: '显示 Token 面板',
    revive: '复活宠物',
    quit: '退出',
  },

  // 交互反馈消息
  feedback: {
    feed: '好好吃呀~ 谢谢主人!',
    wash: '洗完澡好舒服呀~',
    cure: '感觉好多了~',
    play: '和主人一起玩好开心!',
    hideSeek: '嘿嘿，找到我了吗?',
    welcome: '你好呀! 我是你的桌面宠物~',
    dying: '呜呜... 我撑不住了...',
    dead: '宠物已经去世了...',
    deadToast: '宠物去世了... 右键选择复活',
    alreadyDead: '宠物已经去世了...',
    healthy: '宠物很健康，不需要治疗',
    revive: '我回来啦! 谢谢主人救我~',
    alreadyAlive: '宠物还活着呢~',
    hungry: '我好饿呀~ 主人喂我吃点东西吧!',
    dirty: '身上好脏呀~ 帮我洗洗澡吧!',
    bored: '好无聊啊... 陪我玩一会儿嘛~',
    lowEnergy: '我好累呀... 没有能量了...',
    energyRestored: '充满能量！好有活力！',
  },

  // 托盘菜单
  tray: {
    tooltip: '桌面宠物',
    show: '显示宠物',
    hide: '隐藏宠物',
    installPlugins: '安装 Agent 插件',
    exit: '退出',
  },
}
