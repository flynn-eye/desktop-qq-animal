const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'public', 'assets');
const OUTPUT_FILE = path.join(__dirname, 'swf-assets.json');

function inferFunctionality(relativePath, fileName) {
  const name = fileName.replace('.swf', '').replace('.SWF', '');
  const parts = relativePath.replace(/\\/g, '/').split('/');
  const dirParts = parts.slice(0, -1);

  const mood = dirParts.find(p => ['happy', 'peaceful', 'prostrate', 'sad', 'upset'].includes(p)) || '';
  const subDir = dirParts[dirParts.length - 1];

  const rootActions = {
    'First': '首次出现动画',
    'Appear': '出现动画',
    'Hide': '隐藏动画',
    'Stand': '站立待机动画',
    'Stand1': '站立待机动画(变体)',
    'StandC': '站立待机动画(特殊变体)',
    'Speak': '说话动画',
    'Speak1': '说话动画(变体1)',
    'Speak2': '说话动画(变体2)',
    'Speak3': '说话动画(变体3)',
    'Eat1': '进食动画1',
    'Eat2': '进食动画2',
    'Clean': '清洁动画',
    'Clean1': '清洁动画1',
    'Clean2': '清洁动画2',
    'Dirty': '变脏动画',
    'Cure': '治疗动画',
    'Cure1': '治疗动画1',
    'Cure2': '治疗动画2',
    'Sick': '生病动画',
    'Sick1': '生病动画1',
    'Sick2': '生病动画2',
    'Hungry': '饥饿动画',
    'Dying': '濒死动画',
    'Die': '死亡动画',
    'Bury': '埋葬动画',
    'Revival': '复活动画',
    'LevUp': '升级动画',
    'Enter1': '进入动画1',
    'Enter2': '进入动画2',
    'Enter3': '进入动画3',
    'Exit1': '退出动画1',
    'Exit2': '退出动画2',
    'Exit3': '退出动画3',
    'Exit4': '退出动画4',
    'Hide_left': '向左隐藏动画',
    'Hide_right': '向右隐藏动画',
    'Hide_left1': '向左隐藏动画1',
    'Hide_left2': '向左隐藏动画2',
    'Hide_right1': '向右隐藏动画1',
    'Hide_right2': '向右隐藏动画2',
    'Hide_Left_2': '向左隐藏动画2',
    'Hide_Right_2': '向右隐藏动画2',
    'Etoj': '蛋形态转幼年形态动画',
    'Jtoc': '幼年形态转成年形态动画',
  };

  if (rootActions[name]) return rootActions[name];

  const newActions = {
    'BirthDay': '生日特殊动画',
    'Christmas': '圣诞节特殊动画',
    'NewYearsDay': '新年特殊动画',
  };
  if (newActions[name]) return newActions[name];

  if (name.startsWith('Game')) return `小游戏动画${name.replace('Game', '')}`;

  if (subDir === 'interact' || subDir === 'Interact') {
    const interactMap = {
      'H': '抚摸头部互动动画',
      'LE': '摸左耳互动动画',
      'RE': '摸右耳互动动画',
      'LF': '摸左手/前爪互动动画',
      'RF': '摸右手/前爪互动动画',
      'LH': '摸左手互动动画',
      'RH': '摸右手互动动画',
      'LFA': '摸左前爪互动动画',
      'M': '摸身体互动动画',
      'S': '特殊互动动画',
      'BE': '拍打/击打互动动画',
      'SC': '挠痒痒互动动画',
      'E': '眼神互动动画',
      'F': '脚部互动动画',
      'FA': '前爪互动动画',
      'Fall': '摔倒互动动画',
    };

    for (const [prefix, desc] of Object.entries(interactMap)) {
      if (name === prefix || name.startsWith(prefix)) {
        const suffix = name.slice(prefix.length);
        return suffix ? `${desc}${suffix}` : desc;
      }
    }

    if (name === '010') return '特殊互动动画';
    return `互动动画 ${name}`;
  }

  if (subDir === 'play') {
    return `玩耍动画${name.replace('P', '')}`;
  }

  return `动画 ${name}`;
}

function walkDir(dir, baseDir, results) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir, results);
    } else if (entry.name.toLowerCase().endsWith('.swf')) {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      results.push({ fileName: entry.name, relativePath });
    }
  }
}

const allFiles = [];
walkDir(ASSETS_DIR, ASSETS_DIR, allFiles);

const result = { GG: { Adult: {}, Kid: {}, Egg: {} }, MM: { Adult: {}, Kid: {}, Egg: {} } };

for (const { fileName, relativePath } of allFiles) {
  const parts = relativePath.replace(/^Action\//i, '').split('/');
  const gender = parts[0];
  const stage = parts[1];

  if (!result[gender] || !result[gender][stage]) continue;

  const pathAfterStage = parts.slice(2).join('/');
  const uniqueKey = pathAfterStage.replace(/\.swf$/i, '').replace(/\//g, '_');

  result[gender][stage][uniqueKey] = {
    path: `./assets/${relativePath}`,
    functionality: inferFunctionality(relativePath, fileName),
  };
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2), 'utf-8');
for (const g of ['GG', 'MM']) {
  for (const s of ['Adult', 'Kid', 'Egg']) {
    console.log(`${g}/${s}: ${Object.keys(result[g][s]).length}`);
  }
}
