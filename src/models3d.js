// Three.js ローポリゴン 3D モデルファクトリー
import * as THREE from './vendor/three.module.js';

// マテリアルキャッシュ
const materials = {
  skin: new THREE.MeshStandardMaterial({ color: 0xffd1b3, roughness: 0.8 }),
  shirt: new THREE.MeshStandardMaterial({ color: 0x2b78e4, roughness: 0.7 }),
  pants: new THREE.MeshStandardMaterial({ color: 0x3d4852, roughness: 0.8 }),
  backpack: new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.9 }),
  hair: new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 }),
  shoes: new THREE.MeshStandardMaterial({ color: 0x1f2421, roughness: 0.9 }),
  
  trunk: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.85 }),
  leaves1: new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.6 }),
  leaves2: new THREE.MeshStandardMaterial({ color: 0x388e3c, roughness: 0.6 }),
  leaves3: new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.6 }),
  
  rock: new THREE.MeshStandardMaterial({ color: 0x78909c, roughness: 0.9, flatShading: true }),
  ironRock: new THREE.MeshStandardMaterial({ color: 0x546e7a, metalness: 0.5, roughness: 0.5, flatShading: true }),
  ironVein: new THREE.MeshStandardMaterial({ color: 0xffa726, metalness: 0.8, roughness: 0.3 }),
  
  bushLeaves: new THREE.MeshStandardMaterial({ color: 0x43a047, roughness: 0.7 }),
  berry: new THREE.MeshStandardMaterial({ color: 0xe53935, roughness: 0.4 }),
  
  wood: new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.8 }),
  woodPlank: new THREE.MeshStandardMaterial({ color: 0xa1887f, roughness: 0.75 }),
  iron: new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.8, roughness: 0.3 }),
  
  fire: new THREE.MeshBasicMaterial({ color: 0xff7043 }),
  fireCore: new THREE.MeshBasicMaterial({ color: 0xffeb3b }),
  
  rabbit: new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 }),
  rabbitEar: new THREE.MeshStandardMaterial({ color: 0xffcdd2, roughness: 0.8 }),
  deer: new THREE.MeshStandardMaterial({ color: 0xa1662f, roughness: 0.8 }),
  deerHorn: new THREE.MeshStandardMaterial({ color: 0xefebe9, roughness: 0.9 }),
  wolf: new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.85 }),
  wolfEye: new THREE.MeshBasicMaterial({ color: 0xff1744 }),
  zombie: new THREE.MeshStandardMaterial({ color: 0x558b2f, roughness: 0.85 }),
  zombieEye: new THREE.MeshBasicMaterial({ color: 0x76ff03 }),
  
  spirit: new THREE.MeshBasicMaterial({ color: 0x80d8ff }),
  spiritWing: new THREE.MeshStandardMaterial({ color: 0xb3e5fc, transparent: true, opacity: 0.7, roughness: 0.3 })
};

// プレイヤー 3D モデル
export function createPlayerModel() {
  const root = new THREE.Group();

  // ルック基準・シャドウ用ベース
  const bodyGroup = new THREE.Group();
  bodyGroup.position.y = 0;
  root.add(bodyGroup);

  // 胴体
  const torsoGeom = new THREE.BoxGeometry(0.7, 0.9, 0.45);
  const torso = new THREE.Mesh(torsoGeom, materials.shirt);
  torso.position.y = 1.15;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // リュックサック
  const packGeom = new THREE.BoxGeometry(0.5, 0.65, 0.25);
  const pack = new THREE.Mesh(packGeom, materials.backpack);
  pack.position.set(0, 1.18, -0.32);
  pack.castShadow = true;
  bodyGroup.add(pack);

  // 頭部
  const headGroup = new THREE.Group();
  headGroup.position.y = 1.6;
  bodyGroup.add(headGroup);

  const headGeom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
  const head = new THREE.Mesh(headGeom, materials.skin);
  head.position.y = 0.28;
  head.castShadow = true;
  headGroup.add(head);

  // 髪
  const hairGeom = new THREE.BoxGeometry(0.58, 0.22, 0.58);
  const hair = new THREE.Mesh(hairGeom, materials.hair);
  hair.position.y = 0.5;
  headGroup.add(hair);

  // 目
  const eyeGeom = new THREE.BoxGeometry(0.1, 0.08, 0.05);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x212121 });
  const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
  leftEye.position.set(-0.15, 0.28, 0.28);
  const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
  rightEye.position.set(0.15, 0.28, 0.28);
  headGroup.add(leftEye, rightEye);

  // 左腕
  const armGeom = new THREE.BoxGeometry(0.25, 0.8, 0.25);
  armGeom.translate(0, -0.35, 0); // ピボットを肩に
  const leftArm = new THREE.Mesh(armGeom, materials.shirt);
  leftArm.position.set(-0.5, 1.5, 0);
  leftArm.castShadow = true;
  bodyGroup.add(leftArm);

  // 右腕（武器所持アーム）
  const rightArm = new THREE.Mesh(armGeom, materials.shirt);
  rightArm.position.set(0.5, 1.5, 0);
  rightArm.castShadow = true;
  bodyGroup.add(rightArm);

  // 右手アイテムスロット
  const toolSlot = new THREE.Group();
  toolSlot.position.set(0, -0.7, 0.15);
  toolSlot.rotation.x = Math.PI / 4;
  rightArm.add(toolSlot);

  // 左脚
  const legGeom = new THREE.BoxGeometry(0.28, 0.8, 0.28);
  legGeom.translate(0, -0.4, 0); // ピボットを股関節に
  const leftLeg = new THREE.Mesh(legGeom, materials.pants);
  leftLeg.position.set(-0.2, 0.8, 0);
  leftLeg.castShadow = true;
  bodyGroup.add(leftLeg);

  // 右脚
  const rightLeg = new THREE.Mesh(legGeom, materials.pants);
  rightLeg.position.set(0.2, 0.8, 0);
  rightLeg.castShadow = true;
  bodyGroup.add(rightLeg);

  // 松明用ダイナミックライト
  const torchLight = new THREE.PointLight(0xff9800, 0, 15, 1.5);
  torchLight.position.set(0, 1.5, 0.5);
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

// 手持ちツールメッシュ作成
export function createHeldToolMesh(itemId) {
  const group = new THREE.Group();

  if (itemId === 'wooden_axe' || itemId === 'stone_axe') {
    // 斧
    const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.9, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.2;
    group.add(handle);

    const bladeGeom = new THREE.BoxGeometry(0.25, 0.35, 0.1);
    const mat = itemId === 'wooden_axe' ? materials.woodPlank : materials.rock;
    const blade = new THREE.Mesh(bladeGeom, mat);
    blade.position.set(0.12, 0.55, 0);
    blade.castShadow = true;
    group.add(blade);
  } else if (itemId === 'wooden_pickaxe' || itemId === 'stone_pickaxe') {
    // ツルハシ
    const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.95, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.2;
    group.add(handle);

    const pickGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6);
    const mat = itemId === 'wooden_pickaxe' ? materials.woodPlank : materials.rock;
    const pick = new THREE.Mesh(pickGeom, mat);
    pick.rotation.z = Math.PI / 2;
    pick.position.set(0, 0.6, 0);
    group.add(pick);
  } else if (itemId === 'wooden_sword' || itemId === 'iron_sword') {
    // 剣
    const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    group.add(handle);

    const guardGeom = new THREE.BoxGeometry(0.35, 0.06, 0.1);
    const guard = new THREE.Mesh(guardGeom, itemId === 'iron_sword' ? materials.iron : materials.wood);
    guard.position.y = 0.18;
    group.add(guard);

    const bladeGeom = new THREE.BoxGeometry(0.12, 1.0, 0.04);
    const mat = itemId === 'iron_sword' ? materials.iron : materials.woodPlank;
    const blade = new THREE.Mesh(bladeGeom, mat);
    blade.position.y = 0.7;
    blade.castShadow = true;
    group.add(blade);
  } else if (itemId === 'torch') {
    // 松明
    const handleGeom = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.2;
    group.add(handle);

    const headGeom = new THREE.BoxGeometry(0.14, 0.2, 0.14);
    const head = new THREE.Mesh(headGeom, materials.fire);
    head.position.y = 0.6;
    group.add(head);

    const flameGeom = new THREE.ConeGeometry(0.12, 0.3, 6);
    const flame = new THREE.Mesh(flameGeom, materials.fireCore);
    flame.position.y = 0.8;
    group.add(flame);
  } else if (itemId === 'stick') {
    // 棒
    const handleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6);
    const handle = new THREE.Mesh(handleGeom, materials.wood);
    handle.position.y = 0.15;
    group.add(handle);
  }

  return group;
}

// 木の 3D モデル
export function createTreeModel(seed = 0) {
  const group = new THREE.Group();

  const height = 3.5 + (seed % 0.3) * 3;
  const trunkGeom = new THREE.CylinderGeometry(0.25, 0.45, height, 7);
  const trunk = new THREE.Mesh(trunkGeom, materials.trunk);
  trunk.position.y = height / 2;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  group.add(trunk);

  // 葉のクラスタ（3〜4段の重なり）
  const leafMat = (seed > 0.5) ? materials.leaves1 : materials.leaves2;
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const radius = 1.6 - i * 0.35;
    const leafGeom = new THREE.DodecahedronGeometry(radius, 1);
    const leaves = new THREE.Mesh(leafGeom, leafMat);
    leaves.position.y = height * 0.6 + i * 1.1;
    leaves.scale.set(1.1, 0.85, 1.1);
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    group.add(leaves);
  }

  return group;
}

// 岩・鉱石の 3D モデル
export function createRockModel(type = 'rock', seed = 0) {
  const group = new THREE.Group();

  const isIron = type === 'iron_rock';
  const size = 1.2 + (seed % 0.4);
  const rockGeom = new THREE.DodecahedronGeometry(size, 0);
  
  // ランダムな歪みで自然な岩の形に
  const pos = rockGeom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setXYZ(
      i,
      pos.getX(i) * (0.85 + Math.sin(i * 1.7) * 0.2),
      pos.getY(i) * 0.65,
      pos.getZ(i) * (0.85 + Math.cos(i * 1.9) * 0.2)
    );
  }
  rockGeom.computeVertexNormals();

  const rockMesh = new THREE.Mesh(rockGeom, isIron ? materials.ironRock : materials.rock);
  rockMesh.position.y = size * 0.45;
  rockMesh.castShadow = true;
  rockMesh.receiveShadow = true;
  group.add(rockMesh);

  if (isIron) {
    // 鉄鉱脈の輝く突起
    for (let i = 0; i < 4; i++) {
      const vGeom = new THREE.BoxGeometry(0.3, 0.2, 0.3);
      const vein = new THREE.Mesh(vGeom, materials.ironVein);
      const ang = (i / 4) * Math.PI * 2;
      vein.position.set(Math.cos(ang) * (size * 0.7), size * 0.4 + (i % 2) * 0.2, Math.sin(ang) * (size * 0.7));
      vein.rotation.set(Math.random(), Math.random(), Math.random());
      group.add(vein);
    }
  }

  return group;
}

// ベリーの茂み 3D モデル
export function createBushModel(hasBerries = true) {
  const group = new THREE.Group();

  const bushGeom = new THREE.DodecahedronGeometry(1.0, 1);
  const bush = new THREE.Mesh(bushGeom, materials.bushLeaves);
  bush.scale.set(1.2, 0.8, 1.2);
  bush.position.y = 0.65;
  bush.castShadow = true;
  bush.receiveShadow = true;
  group.add(bush);

  // ベリーの実
  const berriesGroup = new THREE.Group();
  group.add(berriesGroup);
  group.berriesGroup = berriesGroup;

  if (hasBerries) {
    const berryGeom = new THREE.SphereGeometry(0.12, 6, 6);
    for (let i = 0; i < 8; i++) {
      const b = new THREE.Mesh(berryGeom, materials.berry);
      const phi = Math.random() * Math.PI * 0.6;
      const theta = Math.random() * Math.PI * 2;
      b.position.set(
        Math.sin(phi) * Math.cos(theta) * 1.1,
        0.5 + Math.cos(phi) * 0.6,
        Math.sin(phi) * Math.sin(theta) * 1.1
      );
      berriesGroup.add(b);
    }
  }

  return group;
}

// 建築物 3D モデル
export function createBuildingModel(type) {
  const group = new THREE.Group();

  if (type === 'campfire') {
    // 石のサークル
    const stoneGeom = new THREE.DodecahedronGeometry(0.22, 0);
    for (let i = 0; i < 8; i++) {
      const stone = new THREE.Mesh(stoneGeom, materials.rock);
      const angle = (i / 8) * Math.PI * 2;
      stone.position.set(Math.cos(angle) * 0.85, 0.15, Math.sin(angle) * 0.85);
      group.add(stone);
    }

    // 薪
    const logGeom = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 6);
    for (let i = 0; i < 4; i++) {
      const log = new THREE.Mesh(logGeom, materials.wood);
      log.rotation.x = Math.PI / 2.8;
      log.rotation.z = (i / 4) * Math.PI * 2;
      log.position.set(0, 0.25, 0);
      group.add(log);
    }

    // 炎メッシュ
    const fireGeom = new THREE.ConeGeometry(0.4, 0.9, 6);
    const fire = new THREE.Mesh(fireGeom, materials.fireCore);
    fire.position.y = 0.55;
    group.add(fire);
    group.fireMesh = fire;

    // 光源
    const light = new THREE.PointLight(0xff7700, 2.5, 20, 1.2);
    light.position.set(0, 1.2, 0);
    light.castShadow = true;
    group.add(light);
    group.light = light;

  } else if (type === 'torch') {
    const poleGeom = new THREE.CylinderGeometry(0.06, 0.08, 1.8, 6);
    const pole = new THREE.Mesh(poleGeom, materials.wood);
    pole.position.y = 0.9;
    group.add(pole);

    const flameGeom = new THREE.ConeGeometry(0.2, 0.45, 6);
    const flame = new THREE.Mesh(flameGeom, materials.fireCore);
    flame.position.y = 1.95;
    group.add(flame);
    group.fireMesh = flame;

    const light = new THREE.PointLight(0xff9922, 1.8, 16, 1.2);
    light.position.set(0, 2.1, 0);
    light.castShadow = true;
    group.add(light);
    group.light = light;

  } else if (type === 'workbench') {
    // 作業台（テーブル）
    const topGeom = new THREE.BoxGeometry(1.6, 0.2, 1.0);
    const top = new THREE.Mesh(topGeom, materials.woodPlank);
    top.position.y = 0.9;
    top.castShadow = true;
    group.add(top);

    const legGeom = new THREE.BoxGeometry(0.16, 0.8, 0.16);
    const offsets = [[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]];
    for (const [ox, oz] of offsets) {
      const leg = new THREE.Mesh(legGeom, materials.wood);
      leg.position.set(ox, 0.4, oz);
      leg.castShadow = true;
      group.add(leg);
    }

    // 金槌や道具
    const toolGeom = new THREE.BoxGeometry(0.4, 0.1, 0.15);
    const tool = new THREE.Mesh(toolGeom, materials.iron);
    tool.position.set(0.2, 1.05, 0.1);
    group.add(tool);

  } else if (type === 'wall') {
    const wallGeom = new THREE.BoxGeometry(1.6, 2.0, 0.4);
    const wall = new THREE.Mesh(wallGeom, materials.wood);
    wall.position.y = 1.0;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

  } else if (type === 'door') {
    // ドア枠
    const frameLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.0, 0.3), materials.wood);
    frameLeft.position.set(-0.7, 1.0, 0);
    const frameRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.0, 0.3), materials.wood);
    frameRight.position.set(0.7, 1.0, 0);
    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.2, 0.3), materials.wood);
    frameTop.position.set(0, 2.0, 0);
    group.add(frameLeft, frameRight, frameTop);

    // 開閉可能な扉（ピボット）
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.6, 1.0, 0);
    group.add(doorPivot);
    group.doorPivot = doorPivot;

    const panel = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.9, 0.1), materials.woodPlank);
    panel.position.set(0.6, 0, 0);
    panel.castShadow = true;
    doorPivot.add(panel);

  } else if (type === 'chest') {
    // チェスト本体
    const boxGeom = new THREE.BoxGeometry(1.1, 0.6, 0.8);
    const box = new THREE.Mesh(boxGeom, materials.wood);
    box.position.y = 0.3;
    box.castShadow = true;
    group.add(box);

    // 蓋（ピボット）
    const lidPivot = new THREE.Group();
    lidPivot.position.set(0, 0.6, -0.4);
    group.add(lidPivot);
    group.lidPivot = lidPivot;

    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.2, 0.85), materials.woodPlank);
    lid.position.set(0, 0.1, 0.4);
    lid.castShadow = true;
    lidPivot.add(lid);

    const lockGeom = new THREE.BoxGeometry(0.18, 0.2, 0.08);
    const lock = new THREE.Mesh(lockGeom, materials.iron);
    lock.position.set(0, 0.45, 0.42);
    group.add(lock);
  }

  return group;
}

// 動物 3D モデル
export function createAnimalModel(type) {
  const group = new THREE.Group();

  if (type === 'rabbit') {
    // ウサギ
    const bodyGeom = new THREE.SphereGeometry(0.35, 7, 7);
    bodyGeom.scale(1, 0.8, 1.2);
    const body = new THREE.Mesh(bodyGeom, materials.rabbit);
    body.position.y = 0.35;
    body.castShadow = true;
    group.add(body);

    const earGeom = new THREE.CylinderGeometry(0.04, 0.08, 0.4, 6);
    const ear1 = new THREE.Mesh(earGeom, materials.rabbitEar);
    ear1.position.set(-0.12, 0.72, -0.1);
    ear1.rotation.z = -0.2;
    const ear2 = new THREE.Mesh(earGeom, materials.rabbitEar);
    ear2.position.set(0.12, 0.72, -0.1);
    ear2.rotation.z = 0.2;
    group.add(ear1, ear2);

  } else if (type === 'deer') {
    // シカ
    const bodyGeom = new THREE.BoxGeometry(0.7, 0.8, 1.5);
    const body = new THREE.Mesh(bodyGeom, materials.deer);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);

    // 首と頭
    const neckGeom = new THREE.CylinderGeometry(0.15, 0.2, 0.7, 6);
    const neck = new THREE.Mesh(neckGeom, materials.deer);
    neck.position.set(0, 1.6, 0.65);
    neck.rotation.x = Math.PI / 5;
    group.add(neck);

    const headGeom = new THREE.BoxGeometry(0.35, 0.35, 0.5);
    const head = new THREE.Mesh(headGeom, materials.deer);
    head.position.set(0, 1.9, 0.85);
    group.add(head);

    // 角
    const hornGeom = new THREE.CylinderGeometry(0.03, 0.05, 0.6, 5);
    const horn1 = new THREE.Mesh(hornGeom, materials.deerHorn);
    horn1.position.set(-0.18, 2.25, 0.8);
    horn1.rotation.z = -0.3;
    const horn2 = new THREE.Mesh(hornGeom, materials.deerHorn);
    horn2.position.set(0.18, 2.25, 0.8);
    horn2.rotation.z = 0.3;
    group.add(horn1, horn2);

    // 4本足
    const legGeom = new THREE.CylinderGeometry(0.08, 0.06, 0.85, 6);
    const legPos = [[-0.25, 0.42, 0.5], [0.25, 0.42, 0.5], [-0.25, 0.42, -0.5], [0.25, 0.42, -0.5]];
    for (const [lx, ly, lz] of legPos) {
      const leg = new THREE.Mesh(legGeom, materials.deer);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  return group;
}

// 敵モンスター 3D モデル
export function createEnemyModel(type) {
  const group = new THREE.Group();

  if (type === 'wolf') {
    // オオカミ
    const bodyGeom = new THREE.BoxGeometry(0.65, 0.7, 1.4);
    const body = new THREE.Mesh(bodyGeom, materials.wolf);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);

    const headGeom = new THREE.BoxGeometry(0.45, 0.45, 0.6);
    const head = new THREE.Mesh(headGeom, materials.wolf);
    head.position.set(0, 1.05, 0.75);
    group.add(head);

    // 赤い目
    const eyeGeom = new THREE.BoxGeometry(0.08, 0.08, 0.05);
    const eye1 = new THREE.Mesh(eyeGeom, materials.wolfEye);
    eye1.position.set(-0.14, 1.15, 1.05);
    const eye2 = new THREE.Mesh(eyeGeom, materials.wolfEye);
    eye2.position.set(0.14, 1.15, 1.05);
    group.add(eye1, eye2);

    // 4本足
    const legGeom = new THREE.CylinderGeometry(0.09, 0.07, 0.75, 6);
    const legPos = [[-0.22, 0.38, 0.45], [0.22, 0.38, 0.45], [-0.22, 0.38, -0.45], [0.22, 0.38, -0.45]];
    for (const [lx, ly, lz] of legPos) {
      const leg = new THREE.Mesh(legGeom, materials.wolf);
      leg.position.set(lx, ly, lz);
      leg.castShadow = true;
      group.add(leg);
    }

  } else if (type === 'zombie') {
    // ゾンビ（両手を前に突き出した徘徊者）
    const bodyGeom = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    const body = new THREE.Mesh(bodyGeom, materials.zombie);
    body.position.y = 1.15;
    body.castShadow = true;
    group.add(body);

    const headGeom = new THREE.BoxGeometry(0.55, 0.55, 0.55);
    const head = new THREE.Mesh(headGeom, materials.zombie);
    head.position.set(0, 1.88, 0);
    head.castShadow = true;
    group.add(head);

    // 光る目
    const eyeGeom = new THREE.BoxGeometry(0.1, 0.08, 0.05);
    const eye1 = new THREE.Mesh(eyeGeom, materials.zombieEye);
    eye1.position.set(-0.15, 1.9, 0.28);
    const eye2 = new THREE.Mesh(eyeGeom, materials.zombieEye);
    eye2.position.set(0.15, 1.9, 0.28);
    group.add(eye1, eye2);

    // 前方に突き出した腕
    const armGeom = new THREE.BoxGeometry(0.22, 0.22, 0.8);
    const leftArm = new THREE.Mesh(armGeom, materials.zombie);
    leftArm.position.set(-0.48, 1.45, 0.4);
    leftArm.castShadow = true;
    const rightArm = new THREE.Mesh(armGeom, materials.zombie);
    rightArm.position.set(0.48, 1.45, 0.4);
    rightArm.castShadow = true;
    group.add(leftArm, rightArm);

    // 脚
    const legGeom = new THREE.BoxGeometry(0.28, 0.8, 0.28);
    const leftLeg = new THREE.Mesh(legGeom, materials.pants);
    leftLeg.position.set(-0.2, 0.4, 0);
    leftLeg.castShadow = true;
    const rightLeg = new THREE.Mesh(legGeom, materials.pants);
    rightLeg.position.set(0.2, 0.4, 0);
    rightLeg.castShadow = true;
    group.add(leftLeg, rightLeg);
  }

  return group;
}

// 観察者（守護精霊 / 観察ドローン）3D モデル
export function createSpiritModel() {
  const group = new THREE.Group();

  // 青く光るコア
  const coreGeom = new THREE.IcosahedronGeometry(0.3, 2);
  const core = new THREE.Mesh(coreGeom, materials.spirit);
  group.add(core);

  // 精霊の羽
  const wingGeom = new THREE.PlaneGeometry(0.5, 0.7);
  const wing1 = new THREE.Mesh(wingGeom, materials.spiritWing);
  wing1.position.set(-0.25, 0.15, -0.1);
  wing1.rotation.y = Math.PI / 4;
  const wing2 = new THREE.Mesh(wingGeom, materials.spiritWing);
  wing2.position.set(0.25, 0.15, -0.1);
  wing2.rotation.y = -Math.PI / 4;
  group.add(wing1, wing2);
  group.wing1 = wing1;
  group.wing2 = wing2;

  // ほのかな青い光
  const light = new THREE.PointLight(0x80d8ff, 1.2, 10, 2);
  group.add(light);

  return group;
}

// ドロップアイテム 3D モデル
export function createDroppedItemModel(itemId) {
  const group = new THREE.Group();

  let geom, mat;
  if (itemId === 'wood') {
    geom = new THREE.CylinderGeometry(0.12, 0.12, 0.6, 6);
    mat = materials.trunk;
  } else if (itemId === 'stone' || itemId === 'iron_ore') {
    geom = new THREE.DodecahedronGeometry(0.25, 0);
    mat = itemId === 'iron_ore' ? materials.ironVein : materials.rock;
  } else if (itemId === 'berry') {
    geom = new THREE.SphereGeometry(0.2, 6, 6);
    mat = materials.berry;
  } else {
    geom = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    mat = materials.woodPlank;
  }

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  group.add(mesh);

  return group;
}
