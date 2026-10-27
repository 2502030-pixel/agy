// Three.js スタイライズド・ローポリゴン 3D モデルファクトリー
import * as THREE from './vendor/three.module.js';

// マテリアルパレット
export const materials = {
  // プレイヤー用マテリアル
  skin: new THREE.MeshStandardMaterial({ color: 0xffd5b8, roughness: 0.65 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 }),
  shirtTrim: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.7 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }),
  belt: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.7 }),
  buckle: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.85, roughness: 0.25 }),
  backpack: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  backpackPocket: new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x29180c, roughness: 0.85 }),
  shoes: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }),
  eyeWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  eyePupil: new THREE.MeshBasicMaterial({ color: 0x0f172a }),

  // 自然環境用マテリアル
  trunk: new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.9, flatShading: true }),
  trunkDark: new THREE.MeshStandardMaterial({ color: 0x3e2c1e, roughness: 0.9, flatShading: true }),
  leaves1: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6, flatShading: true }),
  leaves2: new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.6, flatShading: true }),
  leaves3: new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.65, flatShading: true }),
  leavesYellow: new THREE.MeshStandardMaterial({ color: 0x7cb342, roughness: 0.6, flatShading: true }),

  rock: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.85, flatShading: true }),
  rockDark: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true }),
  ironRock: new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.4, roughness: 0.6, flatShading: true }),
  ironVein: new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2, emissive: 0x78350f, emissiveIntensity: 0.35 }),

  bushLeaves: new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.65, flatShading: true }),
  bushLeavesDark: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.65, flatShading: true }),
  berry: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.3, metalness: 0.1 }),

  // 建築・道具マテリアル
  wood: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8, flatShading: true }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75, flatShading: true }),
  woodLight: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.75, flatShading: true }),
  iron: new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 }),
  ironDark: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.3 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.9, roughness: 0.2 }),
  rope: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.9 }),

  // 炎・発光マテリアル
  fire: new THREE.MeshBasicMaterial({ color: 0xf97316 }),
  fireCore: new THREE.MeshBasicMaterial({ color: 0xfef08a }),
  charcoal: new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95, flatShading: true }),

  // 生物マテリアル
  rabbitBody: new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.75 }),
  rabbitEarInner: new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.8 }),
  rabbitNose: new THREE.MeshBasicMaterial({ color: 0xf43f5e }),

  deerBody: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8, flatShading: true }),
  deerBelly: new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8 }),
  deerHorn: new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.85, flatShading: true }),
  deerHoof: new THREE.MeshStandardMaterial({ color: 0x292524, roughness: 0.9 }),

  wolfFur: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8, flatShading: true }),
  wolfBelly: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.8, flatShading: true }),
  wolfMuzzle: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.85 }),
  wolfEye: new THREE.MeshBasicMaterial({ color: 0xef4444 }),
  wolfFang: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 }),

  zombieSkin: new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8, flatShading: true }),
  zombieShirt: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.85, flatShading: true }),
  zombiePants: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9, flatShading: true }),
  zombieEye: new THREE.MeshBasicMaterial({ color: 0xa3e635 }),

  // 守護精霊（完全非表示・無効化）
  spiritCore: new THREE.MeshBasicMaterial({ visible: false }),
  spiritRing: new THREE.MeshBasicMaterial({ visible: false }),
  spiritWing: new THREE.MeshBasicMaterial({ visible: false })
};

// プレイヤー 3D モデル
export function createPlayerModel() {
  const root = new THREE.Group();

  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0;
  root.add(bodyGroup);

  // 胴体 (シャツ)
  const torsoGeom = new THREE.BoxGeometry(0.72, 0.85, 0.42);
  const torso = new THREE.Mesh(torsoGeom, materials.shirt);
  torso.position.y = 1.15;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // 首元の襟・インナー
  const collarGeom = new THREE.BoxGeometry(0.32, 0.12, 0.1);
  const collar = new THREE.Mesh(collarGeom, materials.shirtTrim);
  collar.position.set(0, 1.52, 0.18);
  bodyGroup.add(collar);

  // ベルト
  const beltGeom = new THREE.BoxGeometry(0.74, 0.14, 0.44);
  const belt = new THREE.Mesh(beltGeom, materials.belt);
  belt.position.y = 0.78;
  bodyGroup.add(belt);

  // ベルトのバックル
  const buckleGeom = new THREE.BoxGeometry(0.18, 0.16, 0.06);
  const buckle = new THREE.Mesh(buckleGeom, materials.buckle);
  buckle.position.set(0, 0.78, 0.22);
  bodyGroup.add(buckle);

  // リュックサック（メインパック＋外側ポケット＋フラップ）
  const packGroup = new THREE.Group();
  packGroup.position.set(0, 1.18, -0.3);
  bodyGroup.add(packGroup);

  const packGeom = new THREE.BoxGeometry(0.52, 0.65, 0.26);
  const pack = new THREE.Mesh(packGeom, materials.backpack);
  pack.castShadow = true;
  packGroup.add(pack);

  const packPocketGeom = new THREE.BoxGeometry(0.38, 0.32, 0.12);
  const packPocket = new THREE.Mesh(packPocketGeom, materials.backpackPocket);
  packPocket.position.set(0, -0.1, -0.16);
  packPocket.castShadow = true;
  packGroup.add(packPocket);

  const packFlapGeom = new THREE.BoxGeometry(0.48, 0.1, 0.28);
  const packFlap = new THREE.Mesh(packFlapGeom, materials.belt);
  packFlap.position.set(0, 0.32, 0);
  packGroup.add(packFlap);

  // 頭部グループ
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.62;
  bodyGroup.add(headGroup);

  // 首
  const neckGeom = new THREE.CylinderGeometry(0.14, 0.16, 0.2, 8);
  const neck = new THREE.Mesh(neckGeom, materials.skin);
  neck.position.y = 0.05;
  headGroup.add(neck);

  // 顔・頭部
  const headGeom = new THREE.BoxGeometry(0.52, 0.52, 0.5);
  const head = new THREE.Mesh(headGeom, materials.skin);
  head.position.y = 0.32;
  head.castShadow = true;
  headGroup.add(head);

  // 髪型（トップ、サイド、前髪の立体構成）
  const hairTopGeom = new THREE.BoxGeometry(0.56, 0.2, 0.54);
  const hairTop = new THREE.Mesh(hairTopGeom, materials.hair);
  hairTop.position.set(0, 0.52, -0.02);
  headGroup.add(hairTop);

  const hairBackGeom = new THREE.BoxGeometry(0.56, 0.38, 0.2);
  const hairBack = new THREE.Mesh(hairBackGeom, materials.hair);
  hairBack.position.set(0, 0.34, -0.2);
  headGroup.add(hairBack);

  const bangsGeom = new THREE.BoxGeometry(0.48, 0.14, 0.12);
  const bangs = new THREE.Mesh(bangsGeom, materials.hair);
  bangs.position.set(0, 0.48, 0.24);
  headGroup.add(bangs);

  // 目（白目＋瞳で表情豊かに）
  const eyeWhiteGeom = new THREE.BoxGeometry(0.12, 0.09, 0.04);
  const eyePupilGeom = new THREE.BoxGeometry(0.06, 0.07, 0.05);

  const leftEyeW = new THREE.Mesh(eyeWhiteGeom, materials.eyeWhite);
  leftEyeW.position.set(-0.14, 0.33, 0.25);
  const leftEyeP = new THREE.Mesh(eyePupilGeom, materials.eyePupil);
  leftEyeP.position.set(-0.13, 0.33, 0.26);

  const rightEyeW = new THREE.Mesh(eyeWhiteGeom, materials.eyeWhite);
  rightEyeW.position.set(0.14, 0.33, 0.25);
  const rightEyeP = new THREE.Mesh(eyePupilGeom, materials.eyePupil);
  rightEyeP.position.set(0.13, 0.33, 0.26);

  headGroup.add(leftEyeW, leftEyeP, rightEyeW, rightEyeP);

  // 左腕（肩・袖・前腕・手）
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.5, 1.5, 0);
  bodyGroup.add(leftArm);

  const sleeveGeom = new THREE.BoxGeometry(0.24, 0.45, 0.24);
  sleeveGeom.translate(0, -0.2, 0);
  const leftSleeve = new THREE.Mesh(sleeveGeom, materials.shirt);
  leftSleeve.castShadow = true;
  leftArm.add(leftSleeve);

  const forearmGeom = new THREE.BoxGeometry(0.2, 0.42, 0.2);
  forearmGeom.translate(0, -0.58, 0);
  const leftForearm = new THREE.Mesh(forearmGeom, materials.skin);
  leftForearm.castShadow = true;
  leftArm.add(leftForearm);

  // 右腕（武器所持アーム）
  const rightArm = new THREE.Group();
  rightArm.position.set(0.5, 1.5, 0);
  bodyGroup.add(rightArm);

  const rightSleeve = new THREE.Mesh(sleeveGeom, materials.shirt);
  rightSleeve.castShadow = true;
  rightArm.add(rightSleeve);

  const rightForearm = new THREE.Mesh(forearmGeom, materials.skin);
  rightForearm.castShadow = true;
  rightArm.add(rightForearm);

  // 右手アイテムスロット（手首・拳の位置）
  const toolSlot = new THREE.Group();
  toolSlot.position.set(0, -0.72, 0.12);
  toolSlot.rotation.x = Math.PI / 4;
  rightArm.add(toolSlot);

  // 脚部ヘルパー
  const createLeg = (x) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(x, 0.72, 0);

    const legGeom = new THREE.BoxGeometry(0.26, 0.55, 0.26);
    legGeom.translate(0, -0.25, 0);
    const leg = new THREE.Mesh(legGeom, materials.pants);
    leg.castShadow = true;
    legGroup.add(leg);

    // ブーツ / 靴
    const bootGeom = new THREE.BoxGeometry(0.28, 0.24, 0.36);
    bootGeom.translate(0, -0.6, 0.04);
    const boot = new THREE.Mesh(bootGeom, materials.shoes);
    boot.castShadow = true;
    legGroup.add(boot);

    return legGroup;
  };

  const leftLeg = createLeg(-0.19);
  const rightLeg = createLeg(0.19);
  bodyGroup.add(leftLeg, rightLeg);

  // 松明用ダイナミックライト
  const torchLight = new THREE.PointLight(0xff9800, 0, 16, 1.4);
  torchLight.position.set(0, 1.5, 0.6);
  torchLight.castShadow = false;
  bodyGroup.add(torchLight);

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    toolSlot,
    torchLight,
    currentToolMesh: null
  };
}

// 手持ちツールメッシュ作成（アップグレード版）
export function createHeldToolMesh(itemId) {
  const group = new THREE.Group();

  if (itemId === 'wooden_axe' || itemId === 'stone_axe') {
    // 斧
    const handleGeom = new THREE.CylinderGeometry(0.035, 0.045, 0.95, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.25;
    group.add(handle);

    // 柄の革巻きバンド
    const gripGeom = new THREE.CylinderGeometry(0.046, 0.046, 0.22, 6);
    const grip = new THREE.Mesh(gripGeom, materials.rope);
    grip.position.y = 0.05;
    group.add(grip);

    // 斧頭部
    const mat = (itemId === 'wooden_axe') ? materials.woodPlank : materials.rock;
    const bladeGeom = new THREE.BoxGeometry(0.28, 0.32, 0.08);
    const blade = new THREE.Mesh(bladeGeom, mat);
    blade.position.set(0.14, 0.62, 0);
    blade.castShadow = true;
    group.add(blade);

    // 刃先（テーパー）
    const edgeGeom = new THREE.ConeGeometry(0.18, 0.32, 4);
    edgeGeom.rotateZ(-Math.PI / 2);
    edgeGeom.scale(0.25, 1, 0.1);
    const edge = new THREE.Mesh(edgeGeom, mat);
    edge.position.set(0.28, 0.62, 0);
    group.add(edge);

  } else if (itemId === 'wooden_pickaxe' || itemId === 'stone_pickaxe') {
    // ツルハシ
    const handleGeom = new THREE.CylinderGeometry(0.035, 0.045, 1.0, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.25;
    group.add(handle);

    const gripGeom = new THREE.CylinderGeometry(0.046, 0.046, 0.22, 6);
    const grip = new THREE.Mesh(gripGeom, materials.rope);
    grip.position.y = 0.05;
    group.add(grip);

    const mat = (itemId === 'wooden_pickaxe') ? materials.woodPlank : materials.rock;
    // アーチ状のツルハシ頭
    const pickCenterGeom = new THREE.BoxGeometry(0.16, 0.14, 0.12);
    const center = new THREE.Mesh(pickCenterGeom, materials.ironDark);
    center.position.set(0, 0.68, 0);
    group.add(center);

    const pickLeftGeom = new THREE.ConeGeometry(0.08, 0.45, 5);
    pickLeftGeom.rotateZ(Math.PI / 2.3);
    const pickLeft = new THREE.Mesh(pickLeftGeom, mat);
    pickLeft.position.set(-0.25, 0.66, 0);
    const pickRightGeom = new THREE.ConeGeometry(0.08, 0.45, 5);
    pickRightGeom.rotateZ(-Math.PI / 2.3);
    const pickRight = new THREE.Mesh(pickRightGeom, mat);
    pickRight.position.set(0.25, 0.66, 0);
    group.add(pickLeft, pickRight);

  } else if (itemId === 'wooden_sword' || itemId === 'iron_sword') {
    // 剣
    const isIron = itemId === 'iron_sword';
    const handleGeom = new THREE.CylinderGeometry(0.035, 0.035, 0.32, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.02;
    group.add(handle);

    // 柄頭 (ポンメル)
    const pommelGeom = new THREE.DodecahedronGeometry(0.06, 0);
    const pommel = new THREE.Mesh(pommelGeom, isIron ? materials.gold : materials.woodLight);
    pommel.position.y = -0.14;
    group.add(pommel);

    // 鍔 (クロスガード)
    const guardGeom = new THREE.BoxGeometry(0.42, 0.07, 0.12);
    const guard = new THREE.Mesh(guardGeom, isIron ? materials.ironDark : materials.woodLight);
    guard.position.y = 0.19;
    guard.castShadow = true;
    group.add(guard);

    // 刀身 (ブレード)
    const bladeGeom = new THREE.BoxGeometry(0.12, 1.05, 0.03);
    bladeGeom.translate(0, 0.52, 0);
    const blade = new THREE.Mesh(bladeGeom, isIron ? materials.iron : materials.woodPlank);
    blade.position.y = 0.22;
    blade.castShadow = true;
    group.add(blade);

    // 切っ先
    const tipGeom = new THREE.ConeGeometry(0.085, 0.2, 4);
    tipGeom.scale(1, 1, 0.3);
    const tip = new THREE.Mesh(tipGeom, isIron ? materials.iron : materials.woodPlank);
    tip.position.y = 1.34;
    group.add(tip);

  } else if (itemId === 'torch') {
    // 松明
    const handleGeom = new THREE.CylinderGeometry(0.045, 0.05, 0.85, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.25;
    group.add(handle);

    // 金属バンド
    const bandGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.06, 6);
    const band = new THREE.Mesh(bandGeom, materials.ironDark);
    band.position.y = 0.55;
    group.add(band);

    const headGeom = new THREE.BoxGeometry(0.16, 0.22, 0.16);
    const head = new THREE.Mesh(headGeom, materials.charcoal);
    head.position.y = 0.68;
    group.add(head);

    // 炎（外側オレンジ＋内側コア黄色）
    const flameGeom = new THREE.ConeGeometry(0.14, 0.38, 6);
    const flame = new THREE.Mesh(flameGeom, materials.fire);
    flame.position.y = 0.9;
    group.add(flame);

    const flameCoreGeom = new THREE.ConeGeometry(0.08, 0.24, 6);
    const flameCore = new THREE.Mesh(flameCoreGeom, materials.fireCore);
    flameCore.position.y = 0.88;
    group.add(flameCore);

  } else if (itemId === 'stick') {
    // 木の棒
    const stickGeom = new THREE.CylinderGeometry(0.035, 0.04, 0.8, 6);
    const stick = new THREE.Mesh(stickGeom, materials.wood);
    stick.position.y = 0.2;
    group.add(stick);
  }

  return group;
}

// 木の 3D モデル（バリエーション豊かで立体的なフォルム）
export function createTreeModel(seed = 0) {
  const group = new THREE.Group();

  const height = 3.6 + (seed % 0.3) * 3.2;
  const isPine = (seed * 10) % 2 > 1.0; // 針葉樹 or 広葉樹のバリエーション

  // 幹（根元の広がりフレアと自然な傾き）
  const trunkGeom = new THREE.CylinderGeometry(0.24, 0.48, height, 8);
  const trunk = new THREE.Mesh(trunkGeom, materials.trunk);
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // 根っこの張り出し
  for (let r = 0; r < 4; r++) {
    const rootAngle = (r / 4) * Math.PI * 2 + seed;
    const rootGeom = new THREE.BoxGeometry(0.22, 0.25, 0.5);
    const rootMesh = new THREE.Mesh(rootGeom, materials.trunkDark);
    rootMesh.position.set(Math.cos(rootAngle) * 0.42, 0.12, Math.sin(rootAngle) * 0.42);
    rootMesh.rotation.y = -rootAngle;
    rootMesh.castShadow = true;
    group.add(rootMesh);
  }

  const leafMat = (seed > 0.6) ? materials.leaves1 : (seed > 0.3 ? materials.leaves2 : materials.leaves3);

  if (isPine) {
    // 針葉樹（ピラミッド段型コーン）
    const tiers = 4;
    for (let i = 0; i < tiers; i++) {
      const radius = 1.9 - i * 0.38;
      const coneHeight = 1.6;
      const coneGeom = new THREE.ConeGeometry(radius, coneHeight, 7);
      const cone = new THREE.Mesh(coneGeom, leafMat);
      cone.position.y = height * 0.5 + i * 1.1;
      cone.castShadow = true;
      cone.receiveShadow = true;
      group.add(cone);
    }
  } else {
    // 広葉樹（重なり合う多面体の葉冠クラスタ）
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const radius = 1.7 - i * 0.32;
      const leafGeom = new THREE.DodecahedronGeometry(radius, 1);
      const leaves = new THREE.Mesh(leafGeom, leafMat);
      leaves.position.set(
        Math.sin(i * 2 + seed) * 0.25,
        height * 0.65 + i * 1.05,
        Math.cos(i * 2 + seed) * 0.25
      );
      leaves.scale.set(1.15, 0.85, 1.15);
      leaves.castShadow = true;
      leaves.receiveShadow = true;
      group.add(leaves);
    }

    // 周囲のサブリーフ
    for (let s = 0; s < 3; s++) {
      const subRadius = 0.85;
      const subGeom = new THREE.DodecahedronGeometry(subRadius, 0);
      const subLeaf = new THREE.Mesh(subGeom, materials.leavesYellow);
      const a = (s / 3) * Math.PI * 2;
      subLeaf.position.set(Math.cos(a) * 1.2, height * 0.75, Math.sin(a) * 1.2);
      subLeaf.castShadow = true;
      group.add(subLeaf);
    }
  }

  return group;
}

// 岩・鉱石の 3D モデル
export function createRockModel(type = 'rock', seed = 0) {
  const group = new THREE.Group();

  const isIron = type === 'iron_rock';
  const size = 1.25 + (seed % 0.4);
  const rockGeom = new THREE.DodecahedronGeometry(size, 1);

  // ランダムな歪みを与えて切り立った天然の岩石にする
  const pos = rockGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const noise = Math.sin(px * 3.0 + seed) * Math.cos(pz * 3.0) * 0.22;
    pos.setXYZ(
      i,
      px * (0.9 + noise),
      py * 0.68 + Math.abs(noise) * 0.2,
      pz * (0.9 - noise)
    );
  }
  rockGeom.computeVertexNormals();

  const rockMesh = new THREE.Mesh(rockGeom, isIron ? materials.ironRock : materials.rock);
  rockMesh.position.y = size * 0.45;
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  group.add(rockMesh);

  // 周囲の小石
  const smallRockGeom = new THREE.DodecahedronGeometry(size * 0.32, 0);
  const subRock1 = new THREE.Mesh(smallRockGeom, materials.rockDark);
  subRock1.position.set(size * 0.85, size * 0.15, size * 0.4);
  subRock1.castShadow = true;
  group.add(subRock1);

  if (isIron) {
    // 鉄鉱脈の突起結晶（キラリと光るゴールド/アンバー結晶）
    for (let i = 0; i < 6; i++) {
      const vGeom = new THREE.BoxGeometry(0.32, 0.25, 0.32);
      const vein = new THREE.Mesh(vGeom, materials.ironVein);
      const ang = (i / 6) * Math.PI * 2 + seed;
      vein.position.set(
        Math.cos(ang) * (size * 0.65),
        size * 0.42 + (i % 3) * 0.18,
        Math.sin(ang) * (size * 0.65)
      );
      vein.rotation.set(ang, i * 0.8, seed);
      vein.castShadow = true;
      group.add(vein);
    }
  }

  return group;
}

// ベリーの茂み 3D モデル
export function createBushModel(hasBerries = true) {
  const group = new THREE.Group();

  // 中心低木
  const bushGeom = new THREE.DodecahedronGeometry(0.95, 1);
  const bush = new THREE.Mesh(bushGeom, materials.bushLeaves);
  bush.scale.set(1.25, 0.8, 1.25);
  bush.position.y = 0.62;
  bush.castShadow = true;
  bush.receiveShadow = true;
  group.add(bush);

  // サイドの丸みクラスタ
  for (let i = 0; i < 3; i++) {
    const subGeom = new THREE.DodecahedronGeometry(0.55, 0);
    const subMesh = new THREE.Mesh(subGeom, materials.bushLeavesDark);
    const ang = (i / 3) * Math.PI * 2;
    subMesh.position.set(Math.cos(ang) * 0.65, 0.45, Math.sin(ang) * 0.65);
    subMesh.castShadow = true;
    group.add(subMesh);
  }

  // ベリーの実
  const berriesGroup = new THREE.Group();
  group.add(berriesGroup);
  group.berriesGroup = berriesGroup;

  if (hasBerries) {
    const berryGeom = new THREE.SphereGeometry(0.12, 6, 6);
    for (let i = 0; i < 10; i++) {
      const b = new THREE.Mesh(berryGeom, materials.berry);
      const phi = Math.random() * Math.PI * 0.55;
      const theta = Math.random() * Math.PI * 2;
      b.position.set(
        Math.sin(phi) * Math.cos(theta) * 1.05,
        0.5 + Math.cos(phi) * 0.55,
        Math.sin(phi) * Math.sin(theta) * 1.05
      );
      b.castShadow = true;
      berriesGroup.add(b);
    }
  }

  return group;
}

// 建築物 3D モデル
export function createBuildingModel(type) {
  const group = new THREE.Group();

  if (type === 'campfire') {
    // 焚き火
    // 灰のベース
    const ashGeom = new THREE.CylinderGeometry(0.95, 1.05, 0.1, 12);
    const ash = new THREE.Mesh(ashGeom, materials.charcoal);
    ash.position.y = 0.05;
    ash.receiveShadow = true;
    group.add(ash);

    // 外周の石囲い
    const stoneGeom = new THREE.DodecahedronGeometry(0.24, 0);
    for (let i = 0; i < 8; i++) {
      const stone = new THREE.Mesh(stoneGeom, materials.rock);
      const angle = (i / 8) * Math.PI * 2;
      stone.position.set(Math.cos(angle) * 0.88, 0.16, Math.sin(angle) * 0.88);
      stone.castShadow = true;
      group.add(stone);
    }

    // 組み木・薪
    const logGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.95, 6);
    for (let i = 0; i < 5; i++) {
      const log = new THREE.Mesh(logGeom, materials.wood);
      log.rotation.x = Math.PI / 2.7;
      log.rotation.z = (i / 5) * Math.PI * 2;
      log.position.set(0, 0.28, 0);
      log.castShadow = true;
      group.add(log);
    }

    // 炎メッシュ（立体多面体）
    const fireGroup = new THREE.Group();
    fireGroup.position.set(0, 0.55, 0);
    group.add(fireGroup);

    const fireGeom = new THREE.ConeGeometry(0.42, 0.95, 7);
    const fire = new THREE.Mesh(fireGeom, materials.fire);
    fireGroup.add(fire);

    const fireCoreGeom = new THREE.ConeGeometry(0.24, 0.65, 7);
    const fireCore = new THREE.Mesh(fireCoreGeom, materials.fireCore);
    fireGroup.add(fireCore);

    group.fireMesh = fireGroup;

    // 温かい光源
    const light = new THREE.PointLight(0xff7700, 2.8, 22, 1.2);
    light.position.set(0, 1.2, 0);
    light.castShadow = true;
    group.add(light);
    group.light = light;

  } else if (type === 'torch') {
    // 設置型トーチ
    const baseGeom = new THREE.BoxGeometry(0.35, 0.15, 0.35);
    const base = new THREE.Mesh(baseGeom, materials.rock);
    base.position.y = 0.08;
    group.add(base);

    const poleGeom = new THREE.CylinderGeometry(0.06, 0.08, 1.85, 6);
    const pole = new THREE.Mesh(poleGeom, materials.wood);
    pole.position.y = 0.95;
    pole.castShadow = true;
    group.add(pole);

    const bandGeom = new THREE.BoxGeometry(0.22, 0.08, 0.22);
    const band = new THREE.Mesh(bandGeom, materials.ironDark);
    band.position.y = 1.75;
    group.add(band);

    const flameGroup = new THREE.Group();
    flameGroup.position.set(0, 1.95, 0);
    group.add(flameGroup);

    const flameGeom = new THREE.ConeGeometry(0.2, 0.48, 6);
    const flame = new THREE.Mesh(flameGeom, materials.fire);
    flameGroup.add(flame);

    const flameCore = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 6), materials.fireCore);
    flameGroup.add(flameCore);
    group.fireMesh = flameGroup;

    const light = new THREE.PointLight(0xff9922, 2.0, 18, 1.2);
    light.position.set(0, 2.15, 0);
    light.castShadow = true;
    group.add(light);
    group.light = light;

  } else if (type === 'workbench') {
    // 作業台（厚みのある木製テーブル＋道具）
    const topGeom = new THREE.BoxGeometry(1.6, 0.22, 1.0);
    const top = new THREE.Mesh(topGeom, materials.woodPlank);
    top.position.y = 0.9;
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // 4本脚
    const legGeom = new THREE.BoxGeometry(0.18, 0.8, 0.18);
    const offsets = [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]];
    for (const [ox, oz] of offsets) {
      const leg = new THREE.Mesh(legGeom, materials.wood);
      leg.position.set(ox, 0.4, oz);
      leg.castShadow = true;
      group.add(leg);
    }

    // 下部補強棚板
    const shelfGeom = new THREE.BoxGeometry(1.3, 0.08, 0.7);
    const shelf = new THREE.Mesh(shelfGeom, materials.wood);
    shelf.position.y = 0.3;
    group.add(shelf);

    // 万力（バイス）
    const viseGeom = new THREE.BoxGeometry(0.24, 0.2, 0.18);
    const vise = new THREE.Mesh(viseGeom, materials.ironDark);
    vise.position.set(-0.6, 1.1, 0.35);
    group.add(vise);

    // 金槌・工具
    const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), materials.wood);
    hammerHandle.rotation.z = Math.PI / 3;
    hammerHandle.position.set(0.2, 1.04, 0.1);
    const hammerHead = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.08), materials.iron);
    hammerHead.position.set(0.3, 1.12, 0.1);
    group.add(hammerHandle, hammerHead);

  } else if (type === 'wall') {
    // 防壁（丸太を並べた頑丈なログウォール）
    const logCount = 5;
    for (let i = 0; i < logCount; i++) {
      const logGeom = new THREE.CylinderGeometry(0.15, 0.17, 2.0, 7);
      const log = new THREE.Mesh(logGeom, (i % 2 === 0) ? materials.wood : materials.woodLight);
      log.position.set(-0.6 + i * 0.3, 1.0, 0);
      log.castShadow = true;
      log.receiveShadow = true;
      group.add(log);

      // 上部の尖り
      const tipGeom = new THREE.ConeGeometry(0.15, 0.3, 7);
      const tip = new THREE.Mesh(tipGeom, materials.wood);
      tip.position.set(-0.6 + i * 0.3, 2.15, 0);
      group.add(tip);
    }

    // 横木ブレース
    const beamGeom = new THREE.BoxGeometry(1.65, 0.15, 0.16);
    const beam1 = new THREE.Mesh(beamGeom, materials.woodPlank);
    beam1.position.set(0, 0.6, 0.14);
    const beam2 = new THREE.Mesh(beamGeom, materials.woodPlank);
    beam2.position.set(0, 1.5, 0.14);
    group.add(beam1, beam2);

  } else if (type === 'door') {
    // ドア枠
    const frameMat = materials.wood;
    const postGeom = new THREE.BoxGeometry(0.22, 2.2, 0.3);
    const postL = new THREE.Mesh(postGeom, frameMat);
    postL.position.set(-0.7, 1.1, 0);
    const postR = new THREE.Mesh(postGeom, frameMat);
    postR.position.set(0.7, 1.1, 0);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.22, 0.3), frameMat);
    lintel.position.set(0, 2.18, 0);
    group.add(postL, postR, lintel);

    // 開閉可能な扉
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.6, 1.05, 0);
    group.add(doorPivot);
    group.doorPivot = doorPivot;

    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.12), materials.woodPlank);
    panel.position.set(0.6, 0, 0);
    panel.castShadow = true;
    doorPivot.add(panel);

    // Zブレース補強
    const braceZ = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.05), materials.wood);
    braceZ.position.set(0.6, 0.6, 0.08);
    doorPivot.add(braceZ);

    // ドアノブ / リング
    const knob = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 6, 12), materials.ironDark);
    knob.position.set(1.05, 0, 0.09);
    doorPivot.add(knob);

  } else if (type === 'chest') {
    // 木箱（チェスト）
    const boxGeom = new THREE.BoxGeometry(1.1, 0.58, 0.8);
    const box = new THREE.Mesh(boxGeom, materials.wood);
    box.position.y = 0.29;
    box.castShadow = true;
    group.add(box);

    // 金属のコーナー補強帯
    const strapL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.59, 0.82), materials.ironDark);
    strapL.position.set(-0.4, 0.29, 0);
    const strapR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.59, 0.82), materials.ironDark);
    strapR.position.set(0.4, 0.29, 0);
    group.add(strapL, strapR);

    // 開閉する蓋（ピボット）
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.58, -0.4);
    group.add(lidPivot);
    group.lidPivot = lidPivot;

    const lidGeom = new THREE.CylinderGeometry(0.42, 0.42, 1.15, 12, 1, false, 0, Math.PI);
    lidGeom.rotateZ(Math.PI / 2);
    const lid = new THREE.Mesh(lidGeom, materials.woodPlank);
    lid.position.set(0, 0, 0.4);
    lid.castShadow = true;
    lidPivot.add(lid);

    // 錠前
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.08), materials.gold);
    lock.position.set(0, 0.48, 0.42);
    group.add(lock);
  }

  return group;
}

// 動物 3D モデル（ウサギ・シカ）
export function createAnimalModel(type) {
  const group = new THREE.Group();

  if (type === 'rabbit') {
    // ウサギ
    const bodyGeom = new THREE.SphereGeometry(0.36, 8, 8);
    bodyGeom.scale(1, 0.85, 1.25);
    const body = new THREE.Mesh(bodyGeom, materials.rabbitBody);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    // 頭部
    const headGeom = new THREE.SphereGeometry(0.22, 8, 8);
    const head = new THREE.Mesh(headGeom, materials.rabbitBody);
    head.position.set(0, 0.52, 0.35);
    head.castShadow = true;
    group.add(head);

    // 耳
    const earGeom = new THREE.ConeGeometry(0.08, 0.45, 6);
    earGeom.scale(0.6, 1, 1.2);
    const ear1 = new THREE.Mesh(earGeom, materials.rabbitEarInner);
    ear1.position.set(-0.1, 0.82, 0.28);
    ear1.rotation.z = -0.15;
    ear1.rotation.x = -0.1;

    const ear2 = new THREE.Mesh(earGeom, materials.rabbitEarInner);
    ear2.position.set(0.1, 0.82, 0.28);
    ear2.rotation.z = 0.15;
    ear2.rotation.x = -0.1;
    group.add(ear1, ear2);

    // つぶらな黒目
    const eyeGeom = new THREE.SphereGeometry(0.035, 4, 4);
    const eye1 = new THREE.Mesh(eyeGeom, materials.eyePupil);
    eye1.position.set(-0.12, 0.55, 0.48);
    const eye2 = new THREE.Mesh(eyeGeom, materials.eyePupil);
    eye2.position.set(0.12, 0.55, 0.48);
    group.add(eye1, eye2);

    // 尻尾
    const tailGeom = new THREE.SphereGeometry(0.1, 6, 6);
    const tail = new THREE.Mesh(tailGeom, materials.rabbitBody);
    tail.position.set(0, 0.35, -0.42);
    group.add(tail);

  } else if (type === 'deer') {
    // シカ
    const bodyGeom = new THREE.BoxGeometry(0.72, 0.8, 1.55);
    const body = new THREE.Mesh(bodyGeom, materials.deerBody);
    body.position.y = 1.12;
    body.castShadow = true;
    group.add(body);

    // 白い腹部
    const bellyGeom = new THREE.BoxGeometry(0.68, 0.2, 1.3);
    const belly = new THREE.Mesh(bellyGeom, materials.deerBelly);
    belly.position.set(0, 0.8, 0);
    group.add(belly);

    // 首
    const neckGeom = new THREE.CylinderGeometry(0.18, 0.25, 0.75, 7);
    const neck = new THREE.Mesh(neckGeom, materials.deerBody);
    neck.position.set(0, 1.62, 0.7);
    neck.rotation.x = Math.PI / 4.8;
    neck.castShadow = true;
    group.add(neck);

    // 頭部
    const headGeom = new THREE.BoxGeometry(0.32, 0.32, 0.55);
    const head = new THREE.Mesh(headGeom, materials.deerBody);
    head.position.set(0, 1.95, 0.95);
    head.castShadow = true;
    group.add(head);

    // 枝分かれした角 (アントラー)
    const createAntler = (sign) => {
      const antler = new THREE.Group();
      const mainBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.65, 5), materials.deerHorn);
      mainBeam.position.set(sign * 0.16, 2.3, 0.9);
      mainBeam.rotation.z = sign * -0.35;
      mainBeam.rotation.x = -0.2;
      antler.add(mainBeam);

      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.035, 0.35, 5), materials.deerHorn);
      branch.position.set(sign * 0.26, 2.4, 0.95);
      branch.rotation.z = sign * -0.8;
      antler.add(branch);
      return antler;
    };
    group.add(createAntler(-1), createAntler(1));

    // 4本足
    const legGeom = new THREE.CylinderGeometry(0.08, 0.06, 0.85, 6);
    const legPos = [[-0.25, 0.42, 0.5], [0.25, 0.42, 0.5], [-0.25, 0.42, -0.5], [0.25, 0.42, -0.5]];
    for (const [lx, ly, lz] of legPos) {
      const leg = new THREE.Mesh(legGeom, materials.deerBody);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);

      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.14), materials.deerHoof);
      hoof.position.set(lx, 0.05, lz);
      group.add(hoof);
    }
  }

  return group;
}

// 敵モンスター 3D モデル（オオカミ・ゾンビ）
export function createEnemyModel(type) {
  const group = new THREE.Group();

  if (type === 'wolf') {
    // オオカミ（獰猛なフォルム、光る赤目、牙）
    const bodyGeom = new THREE.BoxGeometry(0.68, 0.72, 1.45);
    const body = new THREE.Mesh(bodyGeom, materials.wolfFur);
    body.position.y = 0.78;
    body.castShadow = true;
    group.add(body);

    // 首の毛並み (たてがみ)
    const maneGeom = new THREE.BoxGeometry(0.74, 0.8, 0.55);
    const mane = new THREE.Mesh(maneGeom, materials.wolfBelly);
    mane.position.set(0, 0.85, 0.45);
    group.add(mane);

    // 頭部
    const headGeom = new THREE.BoxGeometry(0.48, 0.48, 0.55);
    const head = new THREE.Mesh(headGeom, materials.wolfFur);
    head.position.set(0, 1.1, 0.8);
    head.castShadow = true;
    group.add(head);

    // マズル・口先
    const snoutGeom = new THREE.BoxGeometry(0.28, 0.22, 0.4);
    const snout = new THREE.Mesh(snoutGeom, materials.wolfMuzzle);
    snout.position.set(0, 0.98, 1.15);
    group.add(snout);

    // 牙
    const fangGeom = new THREE.ConeGeometry(0.03, 0.08, 4);
    const fangL = new THREE.Mesh(fangGeom, materials.wolfFang);
    fangL.position.set(-0.08, 0.86, 1.18);
    fangL.rotation.x = Math.PI;
    const fangR = new THREE.Mesh(fangGeom, materials.wolfFang);
    fangR.position.set(0.08, 0.86, 1.18);
    fangR.rotation.x = Math.PI;
    group.add(fangL, fangR);

    // 尖った耳
    const earGeom = new THREE.ConeGeometry(0.1, 0.25, 4);
    const ear1 = new THREE.Mesh(earGeom, materials.wolfFur);
    ear1.position.set(-0.16, 1.42, 0.7);
    const ear2 = new THREE.Mesh(earGeom, materials.wolfFur);
    ear2.position.set(0.16, 1.42, 0.7);
    group.add(ear1, ear2);

    // 赤く光る目
    const eyeGeom = new THREE.BoxGeometry(0.09, 0.08, 0.05);
    const eye1 = new THREE.Mesh(eyeGeom, materials.wolfEye);
    eye1.position.set(-0.14, 1.15, 1.08);
    const eye2 = new THREE.Mesh(eyeGeom, materials.wolfEye);
    eye2.position.set(0.14, 1.15, 1.08);
    group.add(eye1, eye2);

    // しっぽ
    const tailGeom = new THREE.CylinderGeometry(0.08, 0.04, 0.7, 6);
    const tail = new THREE.Mesh(tailGeom, materials.wolfFur);
    tail.position.set(0, 0.65, -0.9);
    tail.rotation.x = -Math.PI / 3;
    group.add(tail);

    // 4本足
    const legGeom = new THREE.CylinderGeometry(0.09, 0.07, 0.78, 6);
    const legPos = [[-0.24, 0.39, 0.45], [0.24, 0.39, 0.45], [-0.24, 0.39, -0.45], [0.24, 0.39, -0.45]];
    for (const [lx, ly, lz] of legPos) {
      const leg = new THREE.Mesh(legGeom, materials.wolfFur);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);
    }

  } else if (type === 'zombie') {
    // ゾンビ（ボロボロの衣服・突き出した腕・光る眼光）
    const torsoGeom = new THREE.BoxGeometry(0.72, 0.9, 0.46);
    const torso = new THREE.Mesh(torsoGeom, materials.zombieShirt);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    const headGeom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const head = new THREE.Mesh(headGeom, materials.zombieSkin);
    head.position.set(0, 1.88, 0.05);
    head.rotation.z = 0.1; // 不気味に傾いた首
    head.castShadow = true;
    group.add(head);

    // 光る緑の目
    const eyeGeom = new THREE.BoxGeometry(0.11, 0.08, 0.05);
    const eye1 = new THREE.Mesh(eyeGeom, materials.zombieEye);
    eye1.position.set(-0.15, 1.9, 0.33);
    const eye2 = new THREE.Mesh(eyeGeom, materials.zombieEye);
    eye2.position.set(0.15, 1.9, 0.33);
    group.add(eye1, eye2);

    // 前方に突き出した腕
    const armGeom = new THREE.BoxGeometry(0.22, 0.22, 0.85);
    const leftArm = new THREE.Mesh(armGeom, materials.zombieSkin);
    leftArm.position.set(-0.48, 1.45, 0.42);
    leftArm.castShadow = true;
    const rightArm = new THREE.Mesh(armGeom, materials.zombieSkin);
    rightArm.position.set(0.48, 1.45, 0.42);
    rightArm.castShadow = true;
    group.add(leftArm, rightArm);

    // 脚
    const legGeom = new THREE.BoxGeometry(0.28, 0.8, 0.28);
    const leftLeg = new THREE.Mesh(legGeom, materials.zombiePants);
    leftLeg.position.set(-0.2, 0.4, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeom, materials.zombiePants);
    rightLeg.position.set(0.2, 0.4, 0);
    rightLeg.castShadow = true;
    group.add(leftLeg, rightLeg);
  }

  return group;
}

// 観察者（守護精霊 ナビ）3D モデル - 削除済み（非表示・空グループ）
export function createSpiritModel() {
  const group = new THREE.Group();
  return group;
}

// ドロップアイテム 3D モデル
export function createDroppedItemModel(itemId) {
  const group = new THREE.Group();

  let geom, mat;
  if (itemId === 'wood') {
    geom = new THREE.CylinderGeometry(0.12, 0.12, 0.65, 7);
    mat = materials.trunk;
  } else if (itemId === 'stone') {
    geom = new THREE.DodecahedronGeometry(0.25, 0);
    mat = materials.rock;
  } else if (itemId === 'iron_ore') {
    geom = new THREE.DodecahedronGeometry(0.26, 0);
    mat = materials.ironVein;
  } else if (itemId === 'iron_ingot') {
    geom = new THREE.BoxGeometry(0.4, 0.14, 0.22);
    mat = materials.iron;
  } else if (itemId === 'berry') {
    geom = new THREE.SphereGeometry(0.2, 6, 6);
    mat = materials.berry;
  } else if (itemId === 'meat' || itemId === 'cooked_meat') {
    geom = new THREE.BoxGeometry(0.35, 0.15, 0.28);
    mat = (itemId === 'cooked_meat') ? materials.trunk : materials.rabbitEarInner;
  } else {
    geom = new THREE.BoxGeometry(0.32, 0.32, 0.32);
    mat = materials.woodPlank;
  }

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  group.add(mesh);

  return group;
}
