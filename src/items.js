// アイテムおよびクラフトレシピの定義

export const ITEMS = {
  // 素材
  wood: {
    id: 'wood',
    name: '木材',
    icon: '🪵',
    category: 'materials',
    description: '木を伐採して得られる基本素材。建築や道具作りに必須。',
    maxStack: 99
  },
  stick: {
    id: 'stick',
    name: '木の棒',
    icon: '🥢',
    category: 'materials',
    description: '細い木の枝。道具の柄などに使用。',
    maxStack: 99
  },
  stone: {
    id: 'stone',
    name: '小石',
    icon: '🪨',
    category: 'materials',
    description: '硬い石。焚き火や石器の作成に使用。',
    maxStack: 99
  },
  fiber: {
    id: 'fiber',
    name: '植物繊維',
    icon: '🌾',
    category: 'materials',
    description: '草や茂みから採取した繊維。包帯作りに必要。',
    maxStack: 99
  },
  iron_ore: {
    id: 'iron_ore',
    name: '鉄鉱石',
    icon: '⛰️',
    category: 'materials',
    description: '地下や岩山から採れる貴重な金属の鉱石。',
    maxStack: 99
  },
  iron_ingot: {
    id: 'iron_ingot',
    name: '鉄インゴット',
    icon: '⛓️',
    category: 'materials',
    description: '精錬された鉄。強靭な武器や防具の材料。',
    maxStack: 99
  },

  // 食料・薬品
  berry: {
    id: 'berry',
    name: '野生のベリー',
    icon: '🫐',
    category: 'survival',
    description: '甘酸っぱい果実。空腹と喉の渇きを少し癒やす。',
    type: 'food',
    hungerRestore: 15,
    thirstRestore: 10,
    healthRestore: 2,
    maxStack: 50
  },
  raw_meat: {
    id: 'raw_meat',
    name: '生肉',
    icon: '🥩',
    category: 'survival',
    description: '動物から得た生の肉。生食すると体調を崩す危険がある。',
    type: 'food',
    hungerRestore: 20,
    thirstRestore: 0,
    healthRestore: -5,
    maxStack: 30
  },
  cooked_meat: {
    id: 'cooked_meat',
    name: '焼き肉',
    icon: '🍖',
    category: 'survival',
    description: '焚き火でじっくり焼いた肉。体力と空腹を大きく回復！',
    type: 'food',
    hungerRestore: 55,
    thirstRestore: 5,
    healthRestore: 25,
    maxStack: 30
  },
  bandage: {
    id: 'bandage',
    name: '包帯',
    icon: '🩹',
    category: 'survival',
    description: '傷口を保護する包帯。体力を回復する。',
    type: 'medical',
    healthRestore: 35,
    maxStack: 20
  },

  // 道具・武器
  wooden_axe: {
    id: 'wooden_axe',
    name: '木の斧',
    icon: '🪓',
    category: 'tools',
    description: '木を切るスピードが2倍になる基本的な斧。',
    type: 'tool',
    toolType: 'axe',
    chopPower: 2,
    minePower: 1,
    damage: 8,
    maxDurability: 50,
    maxStack: 1
  },
  stone_axe: {
    id: 'stone_axe',
    name: '石の斧',
    icon: '🪓',
    category: 'tools',
    description: '頑丈な石の斧。木を素早く伐採できる。',
    type: 'tool',
    toolType: 'axe',
    chopPower: 4,
    minePower: 1,
    damage: 14,
    maxDurability: 100,
    maxStack: 1
  },
  wooden_pickaxe: {
    id: 'wooden_pickaxe',
    name: '木のツルハシ',
    icon: '⛏️',
    category: 'tools',
    description: '岩を砕くことができる簡易ツルハシ。',
    type: 'tool',
    toolType: 'pickaxe',
    chopPower: 1,
    minePower: 2,
    damage: 6,
    maxDurability: 50,
    maxStack: 1
  },
  stone_pickaxe: {
    id: 'stone_pickaxe',
    name: '石のツルハシ',
    icon: '⛏️',
    category: 'tools',
    description: '硬い岩や鉄鉱石を効率よく採掘できるツルハシ。',
    type: 'tool',
    toolType: 'pickaxe',
    chopPower: 1,
    minePower: 4,
    damage: 12,
    maxDurability: 100,
    maxStack: 1
  },
  wooden_sword: {
    id: 'wooden_sword',
    name: '木の剣',
    icon: '🗡️',
    category: 'tools',
    description: '野生生物や夜の怪異から身を守る武器。',
    type: 'weapon',
    toolType: 'sword',
    damage: 18,
    maxDurability: 60,
    maxStack: 1
  },
  iron_sword: {
    id: 'iron_sword',
    name: '鉄の剣',
    icon: '⚔️',
    category: 'tools',
    description: '鋭利な鋼鉄の刃。高い攻撃力を誇る。',
    type: 'weapon',
    toolType: 'sword',
    damage: 32,
    maxDurability: 160,
    maxStack: 1
  },
  torch: {
    id: 'torch',
    name: '松明',
    icon: '🕯️',
    category: 'survival',
    description: '手元や周囲を明るく照らす。夜の探索に必須。',
    type: 'placeable',
    placeType: 'torch',
    lightRadius: 180,
    maxStack: 20
  },

  // 建築・設置物
  campfire: {
    id: 'campfire',
    name: '焚き火',
    icon: '🔥',
    category: 'survival',
    description: '周囲を暖かく照らし、近くで生肉を調理できる。',
    type: 'placeable',
    placeType: 'campfire',
    lightRadius: 260,
    maxStack: 10
  },
  workbench: {
    id: 'workbench',
    name: '作業台',
    icon: '🪚',
    category: 'build',
    description: 'より高度な道具、武器、建築物をクラフトできる作業台。',
    type: 'placeable',
    placeType: 'workbench',
    maxStack: 5
  },
  wooden_wall: {
    id: 'wooden_wall',
    name: '木の壁',
    icon: '🪵',
    category: 'build',
    description: 'モンスターの侵入を防ぐ頑丈な木の防壁。',
    type: 'placeable',
    placeType: 'wall',
    maxHp: 150,
    maxStack: 50
  },
  wooden_door: {
    id: 'wooden_door',
    name: '木のドア',
    icon: '🚪',
    category: 'build',
    description: '近づいてクリックすると開閉できる扉。',
    type: 'placeable',
    placeType: 'door',
    maxHp: 100,
    maxStack: 10
  },
  chest: {
    id: 'chest',
    name: '木箱 (チェスト)',
    icon: '📦',
    category: 'build',
    description: 'アイテムを最大18個安全に保管できる収納箱。',
    type: 'placeable',
    placeType: 'chest',
    maxStack: 5
  }
};

// クラフトレシピ一覧
export const RECIPES = [
  // 基本クラフト
  {
    id: 'craft_stick',
    result: 'stick',
    count: 4,
    category: 'materials',
    requiresWorkbench: false,
    ingredients: [{ id: 'wood', count: 1 }]
  },
  {
    id: 'craft_wooden_axe',
    result: 'wooden_axe',
    count: 1,
    category: 'tools',
    requiresWorkbench: false,
    ingredients: [
      { id: 'wood', count: 3 },
      { id: 'stick', count: 2 }
    ]
  },
  {
    id: 'craft_wooden_pickaxe',
    result: 'wooden_pickaxe',
    count: 1,
    category: 'tools',
    requiresWorkbench: false,
    ingredients: [
      { id: 'wood', count: 3 },
      { id: 'stick', count: 2 }
    ]
  },
  {
    id: 'craft_wooden_sword',
    result: 'wooden_sword',
    count: 1,
    category: 'tools',
    requiresWorkbench: false,
    ingredients: [
      { id: 'wood', count: 2 },
      { id: 'stick', count: 1 }
    ]
  },
  {
    id: 'craft_torch',
    result: 'torch',
    count: 2,
    category: 'survival',
    requiresWorkbench: false,
    ingredients: [
      { id: 'wood', count: 1 },
      { id: 'stick', count: 1 }
    ]
  },
  {
    id: 'craft_campfire',
    result: 'campfire',
    count: 1,
    category: 'survival',
    requiresWorkbench: false,
    ingredients: [
      { id: 'wood', count: 3 },
      { id: 'stone', count: 4 }
    ]
  },
  {
    id: 'craft_bandage',
    result: 'bandage',
    count: 1,
    category: 'survival',
    requiresWorkbench: false,
    ingredients: [
      { id: 'fiber', count: 3 }
    ]
  },
  {
    id: 'craft_workbench',
    result: 'workbench',
    count: 1,
    category: 'build',
    requiresWorkbench: false,
    ingredients: [
      { id: 'wood', count: 5 }
    ]
  },

  // 作業台が必要なレシピ
  {
    id: 'craft_stone_axe',
    result: 'stone_axe',
    count: 1,
    category: 'tools',
    requiresWorkbench: true,
    ingredients: [
      { id: 'stone', count: 4 },
      { id: 'stick', count: 2 }
    ]
  },
  {
    id: 'craft_stone_pickaxe',
    result: 'stone_pickaxe',
    count: 1,
    category: 'tools',
    requiresWorkbench: true,
    ingredients: [
      { id: 'stone', count: 4 },
      { id: 'stick', count: 2 }
    ]
  },
  {
    id: 'craft_iron_sword',
    result: 'iron_sword',
    count: 1,
    category: 'tools',
    requiresWorkbench: true,
    ingredients: [
      { id: 'iron_ingot', count: 3 },
      { id: 'stick', count: 2 }
    ]
  },
  {
    id: 'craft_iron_ingot',
    result: 'iron_ingot',
    count: 1,
    category: 'materials',
    requiresWorkbench: true,
    ingredients: [
      { id: 'iron_ore', count: 2 },
      { id: 'wood', count: 1 }
    ]
  },
  {
    id: 'craft_wooden_wall',
    result: 'wooden_wall',
    count: 2,
    category: 'build',
    requiresWorkbench: true,
    ingredients: [
      { id: 'wood', count: 3 }
    ]
  },
  {
    id: 'craft_wooden_door',
    result: 'wooden_door',
    count: 1,
    category: 'build',
    requiresWorkbench: true,
    ingredients: [
      { id: 'wood', count: 4 }
    ]
  },
  {
    id: 'craft_chest',
    result: 'chest',
    count: 1,
    category: 'build',
    requiresWorkbench: true,
    ingredients: [
      { id: 'wood', count: 6 }
    ]
  },
  {
    id: 'craft_cooked_meat',
    result: 'cooked_meat',
    count: 1,
    category: 'survival',
    requiresCampfire: true,
    requiresWorkbench: false,
    ingredients: [
      { id: 'raw_meat', count: 1 },
      { id: 'wood', count: 1 }
    ]
  }
];
