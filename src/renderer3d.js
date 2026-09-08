// Three.js 二人称（Second-Person）3D レンダリングエンジン
import * as THREE from './vendor/three.module.js';
import {
  createPlayerModel,
  createHeldToolMesh,
  createTreeModel,
  createRockModel,
  createBushModel,
  createBuildingModel,
  createAnimalModel,
  createEnemyModel,
  createSpiritModel,
  createDroppedItemModel
} from './models3d.js';
import { TILE_SIZE, BIOMES } from './world.js';
import { ITEMS } from './items.js';

export const WORLD_SCALE = 2.0 / TILE_SIZE; // 2Dピクセル座標から3Dユニットへの変換係数

export class Renderer3D {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // シーン
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.012);

    // レンダラー
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // カメラ（二人称視点カメラ）
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 500);

    // 二人称カメラ設定
    this.cameraMode = 'spirit'; // 'spirit' | 'creature'
    this.cameraTargetEntity = null; // 視界ジャック対象（敵や動物）
    this.cameraTargetName = '守護精霊 ナビ (Guardian Spirit)';

    // 観察者（守護精霊）のパラメータ
    this.spiritAngle = Math.PI * 0.25; // プレイヤー周囲の水平角度
    this.spiritPitch = 0.55;           // 仰角（ラジアン）
    this.spiritDistance = 14.0;        // プレイヤーからの距離
    this.targetDistance = 14.0;
    this.spiritHeightOffset = 4.5;

    this.spiritPos = new THREE.Vector3();
    this.spiritModel = createSpiritModel();
    this.scene.add(this.spiritModel);

    // ライティング
    this.initLighting();

    // 地形・海
    this.terrainMesh = null;
    this.oceanMesh = null;

    // エンティティメッシュ追跡マップ
    this.resourceMeshes = new Map();
    this.buildingMeshes = new Map();
    this.animalMeshes = new Map();
    this.enemyMeshes = new Map();
    this.droppedItemMeshes = new Map();
    this.particleObjects = [];

    // プレイヤー 3D
    this.player3D = createPlayerModel();
    this.scene.add(this.player3D.root);

    // 3D ターゲットレティクル & レイキャスター
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.groundIntersection = new THREE.Vector3();
    this.hasGroundIntersection = false;
    this.hoveredObject = null;

    this.initReticle();
    this.initPlacementPreview();

    // リサイズハンドラ
    window.addEventListener('resize', () => this.onWindowResize());
  }

  initLighting() {
    // 環境光
    this.ambientLight = new THREE.AmbientLight(0xddeeff, 0.45);
    this.scene.add(this.ambientLight);

    // 半球光
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444455, 0.35);
    this.scene.add(this.hemiLight);

    // 太陽 / 月光 (DirectionalLight)
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.3);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);
  }

  initReticle() {
    // 地面に投影されるターゲットレティクルリング
    const geom = new THREE.RingGeometry(0.55, 0.7, 32);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    this.reticleMesh = new THREE.Mesh(geom, mat);
    this.reticleMesh.visible = false;
    this.scene.add(this.reticleMesh);
  }

  initPlacementPreview() {
    this.previewGroup = new THREE.Group();
    this.previewGroup.visible = false;
    this.scene.add(this.previewGroup);
    this.currentPreviewType = null;
  }

  // 島の 3D 地形と海面の構築
  buildIsland(world) {
    const w = world.width;
    const h = world.height;
    const geom = new THREE.PlaneGeometry(w * 2.0, h * 2.0, w - 1, h - 1);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = [];

    // バイオーム高度 & カラー
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        const biome = world.tiles[idx];

        let elev = 0;
        let c = new THREE.Color();

        switch (biome) {
          case BIOMES.DEEP_WATER:
            elev = -2.8;
            c.setHex(0x0a2239);
            break;
          case BIOMES.WATER:
            elev = -0.5;
            c.setHex(0x195e93);
            break;
          case BIOMES.SAND:
            elev = 0.35 + Math.sin(x * 0.3 + y * 0.4) * 0.08;
            c.setHex(0xdfbe83);
            break;
          case BIOMES.GRASS:
            elev = 0.85 + Math.sin(x * 0.2 + y * 0.3) * 0.15;
            c.setHex(0x3e8e41);
            break;
          case BIOMES.FOREST:
            elev = 1.25 + Math.cos(x * 0.25 + y * 0.2) * 0.2;
            c.setHex(0x275924);
            break;
          case BIOMES.MOUNTAIN:
            elev = 2.8 + Math.sin(x * 0.4) * Math.cos(y * 0.4) * 1.5;
            c.setHex(0x6b7782);
            break;
          default:
            elev = 0;
            c.setHex(0x2e7d32);
        }

        pos.setY(idx, elev);
        colors.push(c.r, c.g, c.b);
      }
    }

    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });

    this.terrainMesh = new THREE.Mesh(geom, mat);
    this.terrainMesh.position.set((w * 2.0) / 2, 0, (h * 2.0) / 2);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);

    // 立体海面
    const oceanGeom = new THREE.PlaneGeometry(w * 3.5, h * 3.5, 32, 32);
    oceanGeom.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x0077be,
      transparent: true,
      opacity: 0.75,
      roughness: 0.15,
      metalness: 0.4
    });
    this.oceanMesh = new THREE.Mesh(oceanGeom, oceanMat);
    this.oceanMesh.position.set((w * 2.0) / 2, 0.05, (h * 2.0) / 2);
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);
  }

  // 2D座標から3D地形の高さをサンプリング
  getTerrainHeight(worldX2D, worldY2D, world) {
    const tx = Math.floor(worldX2D / TILE_SIZE);
    const ty = Math.floor(worldY2D / TILE_SIZE);
    if (!world.isValidTile(tx, ty)) return 0;

    const biome = world.getTile(tx, ty);
    switch (biome) {
      case BIOMES.DEEP_WATER: return -2.5;
      case BIOMES.WATER: return -0.4;
      case BIOMES.SAND: return 0.35;
      case BIOMES.GRASS: return 0.85;
      case BIOMES.FOREST: return 1.25;
      case BIOMES.MOUNTAIN: return 2.8;
      default: return 0.5;
    }
  }

  // 昼夜サイクルとライティング更新
  updateLighting(world, dt) {
    const time = world.timeOfDay;
    // 太陽の回転角度 (0: 朝, 6: 正午, 12: 夕方, 18: 深夜)
    const angle = ((time - 6) / 24) * Math.PI * 2;
    const sunDist = 70;

    const pX = this.player3D.root.position.x;
    const pZ = this.player3D.root.position.z;

    this.sunLight.position.set(
      pX + Math.cos(angle) * sunDist,
      Math.max(2, Math.sin(angle) * sunDist),
      pZ + Math.sin(angle * 0.5) * 30
    );
    this.sunLight.target.position.set(pX, 0, pZ);

    const isNight = world.isNight();
    const ambientCoeff = world.getAmbientLight();

    if (isNight) {
      // 夜の月光
      this.sunLight.color.setHex(0x3b5284);
      this.sunLight.intensity = 0.25;
      this.ambientLight.color.setHex(0x101a2e);
      this.ambientLight.intensity = 0.3;
      this.hemiLight.color.setHex(0x1a2638);
      this.hemiLight.groundColor.setHex(0x050a12);
      this.scene.background.setHex(0x060c18);
      this.scene.fog.color.setHex(0x060c18);
    } else {
      // 昼〜夕暮れ
      const sky = world.getSkyColor();
      if (sky && (time > 16.5 || time < 7.0)) {
        // 夕焼け・朝焼け
        this.sunLight.color.setRGB(1.0, 0.65, 0.4);
        this.sunLight.intensity = 1.1;
        this.ambientLight.color.setRGB(0.7, 0.5, 0.4);
        this.scene.background.setRGB(sky.r / 255, sky.g / 255, sky.b / 255);
        this.scene.fog.color.setRGB(sky.r / 255, sky.g / 255, sky.b / 255);
      } else {
        // 昼間
        this.sunLight.color.setHex(0xfffaed);
        this.sunLight.intensity = 1.35;
        this.ambientLight.color.setHex(0xddeeff);
        this.ambientLight.intensity = 0.5;
        this.scene.background.setHex(0x82b9e0);
        this.scene.fog.color.setHex(0x82b9e0);
      }
    }

    // 波のアニメーション
    if (this.oceanMesh) {
      this.oceanMesh.position.y = 0.05 + Math.sin(performance.now() * 0.0015) * 0.08;
    }
  }

  // 二人称（Second-Person）カメラの更新
  updateSecondPersonCamera(player, allEnemies, allAnimals, dt) {
    const px = player.x * WORLD_SCALE;
    const pz = player.y * WORLD_SCALE;
    const py = this.player3D.root.position.y;
    const playerTargetPos = new THREE.Vector3(px, py + 1.2, pz);

    if (this.cameraMode === 'creature' && this.cameraTargetEntity) {
      // 視界ジャックモード：生物（オオカミ、ゾンビ、シカ等）の目線からプレイヤーを見る
      const ent = this.cameraTargetEntity;
      if (ent.hp <= 0) {
        // 対象が死亡した場合は守護霊視点に戻る
        this.setCameraMode('spirit');
        return;
      }

      const ex = ent.x * WORLD_SCALE;
      const ez = ent.y * WORLD_SCALE;
      const ey = this.getTerrainHeight(ent.x, ent.y, { isValidTile: () => true, getTile: () => BIOMES.GRASS }) + 1.2;

      // 生物の頭・目の位置にカメラを配置
      this.camera.position.set(ex, ey, ez);
      // プレイヤー「あなた」をじっと見つめる（二人称）
      this.camera.lookAt(playerTargetPos);

      // 守護霊モデルは非表示
      this.spiritModel.visible = false;
      return;
    }

    // デフォルト二人称モード：守護精霊ナビの目線からプレイヤーを見下ろす・見つめる
    this.spiritModel.visible = true;

    // スムーズなズーム
    this.spiritDistance += (this.targetDistance - this.spiritDistance) * dt * 8.0;

    // 守護精霊の位置計算（プレイヤーの周りを旋回）
    const hDist = this.spiritDistance * Math.cos(this.spiritPitch);
    const vDist = this.spiritDistance * Math.sin(this.spiritPitch) + this.spiritHeightOffset;

    // わずかな浮遊ゆらぎ（息づかい）
    const bob = Math.sin(performance.now() * 0.003) * 0.35;

    const targetCamX = px + Math.sin(this.spiritAngle) * hDist;
    const targetCamY = py + vDist + bob;
    const targetCamZ = pz + Math.cos(this.spiritAngle) * hDist;

    // スムーズなカメラ追従
    this.camera.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), dt * 9.0);
    this.camera.lookAt(playerTargetPos);

    // 守護精霊モデルはカメラの少し前方・斜めに舞う
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    this.spiritModel.position.copy(this.camera.position).addScaledVector(fwd, 1.8).add(new THREE.Vector3(0.5, -0.3, 0));
    this.spiritModel.lookAt(playerTargetPos);

    // 羽ばたきアニメーション
    if (this.spiritModel.wing1 && this.spiritModel.wing2) {
      const flap = Math.sin(performance.now() * 0.015) * 0.6;
      this.spiritModel.wing1.rotation.y = Math.PI / 4 + flap;
      this.spiritModel.wing2.rotation.y = -Math.PI / 4 - flap;
    }
  }

  // 二人称カメラモード切替（[V]キー押下時など）
  toggleCameraMode(allEnemies, allAnimals, player) {
    if (this.cameraMode === 'spirit') {
      // 近くにいる敵や動物を探索して視界ジャック
      const candidates = [...allEnemies, ...allAnimals].filter(e => e.hp > 0);
      if (candidates.length > 0) {
        // 最もプレイヤーに近い生物を選択
        candidates.sort((a, b) => {
          const da = Math.hypot(a.x - player.x, a.y - player.y);
          const db = Math.hypot(b.x - player.x, b.y - player.y);
          return da - db;
        });

        this.cameraTargetEntity = candidates[0];
        this.cameraMode = 'creature';

        const nameMap = {
          wolf: '🐺 オオカミ (Wolf)',
          zombie: '🧟 ゾンビ (Zombie)',
          deer: '🦌 シカ (Deer)',
          rabbit: '🐇 ウサギ (Rabbit)'
        };
        this.cameraTargetName = nameMap[this.cameraTargetEntity.type] || '野性生物 (Creature)';
        return { mode: 'creature', name: this.cameraTargetName };
      }
    }

    // 守護精霊視点に戻る
    this.cameraMode = 'spirit';
    this.cameraTargetEntity = null;
    this.cameraTargetName = '守護精霊 ナビ (Guardian Spirit)';
    return { mode: 'spirit', name: this.cameraTargetName };
  }

  setCameraMode(mode) {
    this.cameraMode = mode;
    if (mode === 'spirit') {
      this.cameraTargetEntity = null;
      this.cameraTargetName = '守護精霊 ナビ (Guardian Spirit)';
    }
  }

  // プレイヤー 3D のアニメーションと同期
  updatePlayer(player, world, dt) {
    const root = this.player3D.root;
    const body = this.player3D.bodyGroup;

    // 位置
    const px = player.x * WORLD_SCALE;
    const pz = player.y * WORLD_SCALE;
    const py = this.getTerrainHeight(player.x, player.y, world);
    root.position.set(px, py, pz);

    // 向き（角度）
    // player.angle は2Dのマウス方向角
    // 3Dでは Y軸周りの回転
    root.rotation.y = -player.angle + Math.PI / 2;

    // 手持ちアイテムメッシュの更新
    const held = player.getHeldItem();
    const heldId = held ? held.id : null;

    if (this.player3D.currentHeldId !== heldId) {
      this.player3D.currentHeldId = heldId;
      // 既存ツールを削除
      while (this.player3D.toolSlot.children.length > 0) {
        this.player3D.toolSlot.remove(this.player3D.toolSlot.children[0]);
      }
      if (heldId) {
        const mesh = createHeldToolMesh(heldId);
        this.player3D.toolSlot.add(mesh);
      }
    }

    // 松明ダイナミックライト
    if (heldId === 'torch') {
      this.player3D.torchLight.intensity = 2.0 + Math.sin(performance.now() * 0.009) * 0.3;
    } else {
      this.player3D.torchLight.intensity = 0;
    }

    // 歩行アニメーション
    if (player.isMoving) {
      player.walkAnimTime += dt * 10;
      const swing = Math.sin(player.walkAnimTime) * 0.6;
      this.player3D.leftLeg.rotation.x = swing;
      this.player3D.rightLeg.rotation.x = -swing;
      this.player3D.leftArm.rotation.x = -swing * 0.8;
      if (!player.isAttacking) {
        this.player3D.rightArm.rotation.x = swing * 0.8;
      }
    } else {
      this.player3D.leftLeg.rotation.x *= 0.8;
      this.player3D.rightLeg.rotation.x *= 0.8;
      this.player3D.leftArm.rotation.x *= 0.8;
      if (!player.isAttacking) {
        this.player3D.rightArm.rotation.x *= 0.8;
      }
    }

    // 攻撃・スイングアニメーション
    if (player.isAttacking) {
      const progress = player.swingProgress; // 0 -> 1
      const armAngle = -Math.sin(progress * Math.PI) * 1.6;
      this.player3D.rightArm.rotation.x = armAngle;
    }
  }

  // 自然リソースの 3D メッシュ同期
  syncResources(resources, world, dt) {
    const currentIds = new Set(resources.map(r => r.id));

    // 破壊されたリソースの削除
    for (const [id, mesh] of this.resourceMeshes.entries()) {
      if (!currentIds.has(id)) {
        this.scene.remove(mesh);
        this.resourceMeshes.delete(id);
      }
    }

    // リソースの更新と新規追加
    for (const res of resources) {
      let mesh = this.resourceMeshes.get(res.id);
      if (!mesh) {
        if (res.type === 'tree') {
          mesh = createTreeModel(res.seed);
        } else if (res.type === 'rock' || res.type === 'iron_rock') {
          mesh = createRockModel(res.type, res.seed);
        } else if (res.type === 'berry_bush') {
          mesh = createBushModel(res.hasBerries);
        }

        const rx = res.x * WORLD_SCALE;
        const rz = res.y * WORLD_SCALE;
        const ry = this.getTerrainHeight(res.x, res.y, world);
        mesh.position.set(rx, ry, rz);
        mesh.userData = { id: res.id, type: res.type, entity: res };

        this.scene.add(mesh);
        this.resourceMeshes.set(res.id, mesh);
      }

      // 被攻撃時のシェイク
      if (res.shake > 0) {
        mesh.rotation.z = Math.sin(performance.now() * 0.05) * 0.15;
      } else {
        mesh.rotation.z = 0;
      }

      // ベリーの再実り同期
      if (res.type === 'berry_bush' && mesh.berriesGroup) {
        mesh.berriesGroup.visible = res.hasBerries;
      }
    }
  }

  // 建築物の 3D メッシュ同期
  syncBuildings(buildings, world, dt) {
    // 建築物の一意キー
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      b._uniqueId = b._uniqueId || `b_${b.type}_${b.x}_${b.y}`;
    }

    const currentKeys = new Set(buildings.map(b => b._uniqueId));

    for (const [key, mesh] of this.buildingMeshes.entries()) {
      if (!currentKeys.has(key)) {
        this.scene.remove(mesh);
        this.buildingMeshes.delete(key);
      }
    }

    for (const b of buildings) {
      let mesh = this.buildingMeshes.get(b._uniqueId);
      if (!mesh) {
        mesh = createBuildingModel(b.type);
        const bx = b.x * WORLD_SCALE;
        const bz = b.y * WORLD_SCALE;
        const by = this.getTerrainHeight(b.x, b.y, world);
        mesh.position.set(bx, by, bz);
        mesh.userData = { type: b.type, entity: b };

        this.scene.add(mesh);
        this.buildingMeshes.set(b._uniqueId, mesh);
      }

      // 炎のアニメーションと光のゆらめき
      if (mesh.fireMesh) {
        mesh.fireMesh.scale.y = 0.85 + Math.sin(performance.now() * 0.012 + b.x) * 0.25;
      }
      if (mesh.light) {
        mesh.light.intensity = (b.type === 'campfire' ? 2.5 : 1.8) + Math.sin(performance.now() * 0.01 + b.y) * 0.4;
      }

      // ドア開閉
      if (b.type === 'door' && mesh.doorPivot) {
        const targetRot = b.isOpen ? Math.PI / 2 : 0;
        mesh.doorPivot.rotation.y += (targetRot - mesh.doorPivot.rotation.y) * dt * 10;
      }

      // チェスト開閉
      if (b.type === 'chest' && mesh.lidPivot) {
        const isOpen = b._isOpenedModal;
        const targetRot = isOpen ? -Math.PI / 2.2 : 0;
        mesh.lidPivot.rotation.x += (targetRot - mesh.lidPivot.rotation.x) * dt * 10;
      }
    }
  }

  // 動物の 3D メッシュ同期
  syncAnimals(animals, world, dt) {
    for (let i = 0; i < animals.length; i++) {
      animals[i]._uniqueId = animals[i]._uniqueId || `a_${animals[i].type}_${i}_${animals[i].spawnTime || performance.now()}`;
    }

    const currentKeys = new Set(animals.map(a => a._uniqueId));
    for (const [key, mesh] of this.animalMeshes.entries()) {
      if (!currentKeys.has(key)) {
        this.scene.remove(mesh);
        this.animalMeshes.delete(key);
      }
    }

    for (const a of animals) {
      let mesh = this.animalMeshes.get(a._uniqueId);
      if (!mesh) {
        mesh = createAnimalModel(a.type);
        mesh.userData = { type: a.type, entity: a };
        this.scene.add(mesh);
        this.animalMeshes.set(a._uniqueId, mesh);
      }

      const ax = a.x * WORLD_SCALE;
      const az = a.y * WORLD_SCALE;
      const ay = this.getTerrainHeight(a.x, a.y, world);
      mesh.position.set(ax, ay, az);
      mesh.rotation.y = -a.angle + Math.PI / 2;

      // ウサギのホッピング
      if (a.type === 'rabbit' && a.isMoving) {
        mesh.position.y += Math.abs(Math.sin(performance.now() * 0.01)) * 0.35;
      }
    }
  }

  // 敵モンスターの 3D メッシュ同期
  syncEnemies(enemies, world, dt) {
    for (let i = 0; i < enemies.length; i++) {
      enemies[i]._uniqueId = enemies[i]._uniqueId || `e_${enemies[i].type}_${i}_${enemies[i].spawnTime || performance.now()}`;
    }

    const currentKeys = new Set(enemies.map(e => e._uniqueId));
    for (const [key, mesh] of this.enemyMeshes.entries()) {
      if (!currentKeys.has(key)) {
        this.scene.remove(mesh);
        this.enemyMeshes.delete(key);
      }
    }

    for (const e of enemies) {
      let mesh = this.enemyMeshes.get(e._uniqueId);
      if (!mesh) {
        mesh = createEnemyModel(e.type);
        mesh.userData = { type: e.type, entity: e };
        this.scene.add(mesh);
        this.enemyMeshes.set(e._uniqueId, mesh);
      }

      const ex = e.x * WORLD_SCALE;
      const ez = e.y * WORLD_SCALE;
      const ey = this.getTerrainHeight(e.x, e.y, world);
      mesh.position.set(ex, ey, ez);
      mesh.rotation.y = -e.angle + Math.PI / 2;

      // 被ダメージ時の赤色点滅
      if (e.hurtTimer > 0) {
        mesh.position.y = ey + 0.1;
      }
    }
  }

  // ドロップアイテムの 3D メッシュ同期
  syncDroppedItems(droppedItems, world, dt) {
    for (let i = 0; i < droppedItems.length; i++) {
      droppedItems[i]._uniqueId = droppedItems[i]._uniqueId || `drop_${droppedItems[i].itemId}_${i}_${droppedItems[i].x}`;
    }

    const currentKeys = new Set(droppedItems.map(d => d._uniqueId));
    for (const [key, mesh] of this.droppedItemMeshes.entries()) {
      if (!currentKeys.has(key)) {
        this.scene.remove(mesh);
        this.droppedItemMeshes.delete(key);
      }
    }

    for (const d of droppedItems) {
      let mesh = this.droppedItemMeshes.get(d._uniqueId);
      if (!mesh) {
        mesh = createDroppedItemModel(d.itemId);
        mesh.userData = { itemId: d.itemId, entity: d };
        this.scene.add(mesh);
        this.droppedItemMeshes.set(d._uniqueId, mesh);
      }

      const dx = d.x * WORLD_SCALE;
      const dz = d.y * WORLD_SCALE;
      const dy = this.getTerrainHeight(d.x, d.y, world) + 0.45 + Math.sin(d.floatTimer) * 0.12;
      mesh.position.set(dx, dy, dz);
      mesh.rotation.y += dt * 2.5;
    }
  }

  // 3D レイキャスターによる地面・オブジェクトの交点判定
  updateRaycast(mouseX, mouseY) {
    this.mouse.x = (mouseX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(mouseY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    if (this.terrainMesh) {
      const intersects = this.raycaster.intersectObject(this.terrainMesh);
      if (intersects.length > 0) {
        this.groundIntersection.copy(intersects[0].point);
        this.hasGroundIntersection = true;

        this.reticleMesh.position.copy(this.groundIntersection);
        this.reticleMesh.position.y += 0.08;
        this.reticleMesh.visible = true;
      } else {
        this.hasGroundIntersection = false;
        this.reticleMesh.visible = false;
      }
    }

    // オブジェクトホバー検出
    const interactiveObjects = [
      ...Array.from(this.resourceMeshes.values()),
      ...Array.from(this.buildingMeshes.values()),
      ...Array.from(this.enemyMeshes.values()),
      ...Array.from(this.animalMeshes.values())
    ];

    const objIntersects = this.raycaster.intersectObjects(interactiveObjects, true);
    if (objIntersects.length > 0) {
      let topObj = objIntersects[0].object;
      while (topObj.parent && !topObj.userData.entity && topObj.parent !== this.scene) {
        topObj = topObj.parent;
      }
      this.hoveredObject = topObj.userData.entity ? topObj : null;
    } else {
      this.hoveredObject = null;
    }
  }

  // 建築設置プレビューの更新
  updatePlacementPreview(selectedItem, canPlace) {
    if (!selectedItem || !selectedItem.buildType || !this.hasGroundIntersection) {
      this.previewGroup.visible = false;
      return;
    }

    this.previewGroup.visible = true;
    this.previewGroup.position.copy(this.groundIntersection);

    if (this.currentPreviewType !== selectedItem.buildType) {
      this.currentPreviewType = selectedItem.buildType;
      while (this.previewGroup.children.length > 0) {
        this.previewGroup.remove(this.previewGroup.children[0]);
      }
      const model = createBuildingModel(selectedItem.buildType);
      // 半透明化
      model.traverse(child => {
        if (child.isMesh) {
          child.material = child.material.clone();
          child.material.transparent = true;
          child.material.opacity = 0.55;
        }
      });
      this.previewGroup.add(model);
    }
  }

  // レンダリング実行
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
