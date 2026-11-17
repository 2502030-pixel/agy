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
  createDroppedItemModel
} from './models3d.js?v=20261117_night_lighting';
import { TILE_SIZE, BIOMES } from './world.js';
import { ITEMS } from './items.js';

export const WORLD_SCALE = 2.0 / TILE_SIZE; // 2Dピクセル座標から3Dユニットへの変換係数

// 24時間スムーズ昼夜サイクル キーフレーム定義（完全連続補間）
const TIME_KEYFRAMES = [
  {
    t: 0.0,
    sky: 0x121b2d,
    fog: 0x121b2d,
    fogNear: 55,
    fogFar: 220,
    sunIntensity: 0.0,
    sunColor: 0xffaa66,
    moonIntensity: 0.65,
    moonColor: 0x92b2de,
    ambientColor: 0x324765,
    ambientIntensity: 0.42,
    hemiSky: 0x3d5478,
    hemiGround: 0x182535,
    hemiIntensity: 0.45,
    nightFactor: 1.0,
    starOpacity: 0.95
  },
  {
    t: 4.0,
    sky: 0x141e33,
    fog: 0x141e33,
    fogNear: 55,
    fogFar: 225,
    sunIntensity: 0.0,
    sunColor: 0xff9944,
    moonIntensity: 0.60,
    moonColor: 0x92b2de,
    ambientColor: 0x324765,
    ambientIntensity: 0.42,
    hemiSky: 0x3d5478,
    hemiGround: 0x182535,
    hemiIntensity: 0.45,
    nightFactor: 1.0,
    starOpacity: 0.90
  },
  {
    t: 5.2,
    sky: 0x382c48,
    fog: 0x382c48,
    fogNear: 58,
    fogFar: 230,
    sunIntensity: 0.15,
    sunColor: 0xff7e44,
    moonIntensity: 0.35,
    moonColor: 0x829fc4,
    ambientColor: 0x483a52,
    ambientIntensity: 0.48,
    hemiSky: 0x4c3d5c,
    hemiGround: 0x1f1d2b,
    hemiIntensity: 0.48,
    nightFactor: 0.7,
    starOpacity: 0.50
  },
  {
    t: 6.2,
    sky: 0xdf6e43,
    fog: 0xdf6e43,
    fogNear: 65,
    fogFar: 245,
    sunIntensity: 1.10,
    sunColor: 0xffa45c,
    moonIntensity: 0.05,
    moonColor: 0x829fc4,
    ambientColor: 0x7c5848,
    ambientIntensity: 0.68,
    hemiSky: 0x9c6852,
    hemiGround: 0x382b24,
    hemiIntensity: 0.62,
    nightFactor: 0.1,
    starOpacity: 0.0
  },
  {
    t: 7.5,
    sky: 0x7ab6e8,
    fog: 0x7ab6e8,
    fogNear: 70,
    fogFar: 260,
    sunIntensity: 1.30,
    sunColor: 0xfff0d8,
    moonIntensity: 0.0,
    moonColor: 0x92b2de,
    ambientColor: 0xccdeef,
    ambientIntensity: 0.52,
    hemiSky: 0xebf5ff,
    hemiGround: 0x485844,
    hemiIntensity: 0.50,
    nightFactor: 0.0,
    starOpacity: 0.0
  },
  {
    t: 12.0,
    sky: 0x68ade8,
    fog: 0x68ade8,
    fogNear: 70,
    fogFar: 260,
    sunIntensity: 1.35,
    sunColor: 0xfffaed,
    moonIntensity: 0.0,
    moonColor: 0x92b2de,
    ambientColor: 0xddeeff,
    ambientIntensity: 0.55,
    hemiSky: 0xffffff,
    hemiGround: 0x4c5e48,
    hemiIntensity: 0.50,
    nightFactor: 0.0,
    starOpacity: 0.0
  },
  {
    t: 16.0,
    sky: 0x7ebae6,
    fog: 0x7ebae6,
    fogNear: 70,
    fogFar: 260,
    sunIntensity: 1.32,
    sunColor: 0xffe6b8,
    moonIntensity: 0.0,
    moonColor: 0x92b2de,
    ambientColor: 0xd6d2c4,
    ambientIntensity: 0.56,
    hemiSky: 0xf5ebd5,
    hemiGround: 0x4c463a,
    hemiIntensity: 0.52,
    nightFactor: 0.0,
    starOpacity: 0.0
  },
  {
    t: 17.5,
    sky: 0xee783e,
    fog: 0xee783e,
    fogNear: 66,
    fogFar: 250,
    sunIntensity: 1.25,
    sunColor: 0xff7e38,
    moonIntensity: 0.10,
    moonColor: 0x92b2de,
    ambientColor: 0x825442,
    ambientIntensity: 0.68,
    hemiSky: 0x9a583e,
    hemiGround: 0x362822,
    hemiIntensity: 0.60,
    nightFactor: 0.1,
    starOpacity: 0.0
  },
  {
    t: 18.8,
    sky: 0x62335f,
    fog: 0x62335f,
    fogNear: 60,
    fogFar: 235,
    sunIntensity: 0.45,
    sunColor: 0xd85656,
    moonIntensity: 0.35,
    moonColor: 0x92b2de,
    ambientColor: 0x45354e,
    ambientIntensity: 0.48,
    hemiSky: 0x4e3a62,
    hemiGround: 0x201e2c,
    hemiIntensity: 0.48,
    nightFactor: 0.5,
    starOpacity: 0.35
  },
  {
    t: 20.0,
    sky: 0x1a243a,
    fog: 0x1a243a,
    fogNear: 56,
    fogFar: 222,
    sunIntensity: 0.05,
    sunColor: 0x994444,
    moonIntensity: 0.62,
    moonColor: 0x92b2de,
    ambientColor: 0x324765,
    ambientIntensity: 0.42,
    hemiSky: 0x3d5478,
    hemiGround: 0x182535,
    hemiIntensity: 0.45,
    nightFactor: 0.95,
    starOpacity: 0.85
  },
  {
    t: 24.0,
    sky: 0x121b2d,
    fog: 0x121b2d,
    fogNear: 55,
    fogFar: 220,
    sunIntensity: 0.0,
    sunColor: 0xffaa66,
    moonIntensity: 0.65,
    moonColor: 0x92b2de,
    ambientColor: 0x324765,
    ambientIntensity: 0.42,
    hemiSky: 0x3d5478,
    hemiGround: 0x182535,
    hemiIntensity: 0.45,
    nightFactor: 1.0,
    starOpacity: 0.95
  }
];

const _tmpColorA = new THREE.Color();
const _tmpColorB = new THREE.Color();

function interpolateDayNightConfig(timeOfDay) {
  let t = timeOfDay % 24.0;
  if (t < 0) t += 24.0;

  let kf1 = TIME_KEYFRAMES[0];
  let kf2 = TIME_KEYFRAMES[TIME_KEYFRAMES.length - 1];

  for (let i = 0; i < TIME_KEYFRAMES.length - 1; i++) {
    if (t >= TIME_KEYFRAMES[i].t && t <= TIME_KEYFRAMES[i + 1].t) {
      kf1 = TIME_KEYFRAMES[i];
      kf2 = TIME_KEYFRAMES[i + 1];
      break;
    }
  }

  const range = kf2.t - kf1.t;
  const alpha = range === 0 ? 0 : (t - kf1.t) / range;
  const smoothAlpha = alpha * alpha * (3 - 2 * alpha);

  const lerpCol = (hex1, hex2) => {
    _tmpColorA.setHex(hex1);
    _tmpColorB.setHex(hex2);
    return _tmpColorA.lerp(_tmpColorB, smoothAlpha);
  };
  const lerpNum = (v1, v2) => v1 + (v2 - v1) * smoothAlpha;

  return {
    skyColor: lerpCol(kf1.sky, kf2.sky).clone(),
    fogColor: lerpCol(kf1.fog, kf2.fog).clone(),
    fogNear: lerpNum(kf1.fogNear, kf2.fogNear),
    fogFar: lerpNum(kf1.fogFar, kf2.fogFar),
    sunIntensity: lerpNum(kf1.sunIntensity, kf2.sunIntensity),
    sunColor: lerpCol(kf1.sunColor, kf2.sunColor).clone(),
    moonIntensity: lerpNum(kf1.moonIntensity, kf2.moonIntensity),
    moonColor: lerpCol(kf1.moonColor, kf2.moonColor).clone(),
    ambientColor: lerpCol(kf1.ambientColor, kf2.ambientColor).clone(),
    ambientIntensity: lerpNum(kf1.ambientIntensity, kf2.ambientIntensity),
    hemiSkyColor: lerpCol(kf1.hemiSky, kf2.hemiSky).clone(),
    hemiGroundColor: lerpCol(kf1.hemiGround, kf2.hemiGround).clone(),
    hemiIntensity: lerpNum(kf1.hemiIntensity, kf2.hemiIntensity),
    nightFactor: lerpNum(kf1.nightFactor, kf2.nightFactor),
    starOpacity: lerpNum(kf1.starOpacity, kf2.starOpacity)
  };
}

export class Renderer3D {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // シーン
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    // 近距離はフォグがかからず極めてクリア、遠景だけ自然にフェードする線形フォグ
    this.scene.fog = new THREE.Fog(0x87ceeb, 70, 260);

    // レンダラー
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.container.appendChild(this.renderer.domElement);

    // カメラ（二人称視点カメラ）
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.2, 500);
    this.scene.add(this.camera);

    // 二人称カメラからの夜間視界サポートライト（観察者・プレイヤー視野を明るく照らす）
    this.cameraLight = new THREE.PointLight(0xdceaff, 0, 70, 1.0);
    this.camera.add(this.cameraLight);

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
    this.spiritModel = new THREE.Group();

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
    // 夜間でもプレイヤーの周囲や足元が確認できる淡い月光・観察者の光
    this.playerNightLight = new THREE.PointLight(0xa5c2f0, 0.75, 24, 1.0);
    this.playerNightLight.position.set(0, 2.0, 0);
    this.player3D.root.add(this.playerNightLight);
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

    // 太陽光 (DirectionalLight)
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.35);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 160;
    const d = 35;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // 月光 (DirectionalLight)
    this.moonLight = new THREE.DirectionalLight(0x92b2de, 0.65);
    this.moonLight.castShadow = false;
    this.scene.add(this.moonLight);
    this.scene.add(this.moonLight.target);

    // 太陽・月・星空の天球オブジェクト初期化
    this.initCelestialSky();
  }

  initCelestialSky() {
    this.skyDomeGroup = new THREE.Group();
    this.scene.add(this.skyDomeGroup);

    // 1. 太陽メッシュ（輝く球体＋コロナ光輪）
    this.sunGroup = new THREE.Group();
    const sunGeom = new THREE.SphereGeometry(6.5, 20, 20);
    this.sunMat = new THREE.MeshBasicMaterial({ color: 0xfff6dd, depthWrite: false });
    const sunCore = new THREE.Mesh(sunGeom, this.sunMat);
    this.sunGroup.add(sunCore);

    const sunHaloGeom = new THREE.RingGeometry(6.5, 13.5, 32);
    this.sunHaloMat = new THREE.MeshBasicMaterial({
      color: 0xffaa44,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const sunHalo = new THREE.Mesh(sunHaloGeom, this.sunHaloMat);
    this.sunGroup.add(sunHalo);
    this.skyDomeGroup.add(this.sunGroup);

    // 2. 月メッシュ（青白く澄んだ月球＋月光オーラ）
    this.moonGroup = new THREE.Group();
    const moonGeom = new THREE.SphereGeometry(5.2, 20, 20);
    this.moonMat = new THREE.MeshBasicMaterial({ color: 0xdff0ff, depthWrite: false });
    const moonCore = new THREE.Mesh(moonGeom, this.moonMat);
    this.moonGroup.add(moonCore);

    const moonHaloGeom = new THREE.RingGeometry(5.2, 10.5, 32);
    this.moonHaloMat = new THREE.MeshBasicMaterial({
      color: 0x90c0ff,
      transparent: true,
      opacity: 0.40,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const moonHalo = new THREE.Mesh(moonHaloGeom, this.moonHaloMat);
    this.moonGroup.add(moonHalo);
    this.skyDomeGroup.add(this.moonGroup);

    // 3. 星空パーティクル（夜空のきらめく星々）
    const starCount = 750;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.88 + 0.05); // 水平線より上空
      const r = 180 + Math.random() * 30;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }

    const starGeom = new THREE.BufferGeometry();
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: 0.0,
      depthWrite: false
    });
    this.starPoints = new THREE.Points(starGeom, this.starMat);
    this.skyDomeGroup.add(this.starPoints);
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

  // 昼夜サイクルとライティング更新（24時間連続スムーズ補間＆天体運行）
  updateLighting(world, dt) {
    const time = world.timeOfDay;
    const pX = this.player3D.root.position.x;
    const pZ = this.player3D.root.position.z;

    const cfg = interpolateDayNightConfig(time);

    // プレイヤーの頭上に天球ドームを追従
    if (this.skyDomeGroup) {
      this.skyDomeGroup.position.set(pX, 0, pZ);
    }

    // 太陽と月の天球軌道（06:00昇る、12:00南中、18:00沈む）
    const sunAngle = ((time - 6.0) / 24.0) * Math.PI * 2;
    const orbitRadius = 155;
    const orbitDepth = 45;

    const sunX = Math.cos(sunAngle) * orbitRadius;
    const sunY = Math.sin(sunAngle) * orbitRadius;
    const sunZ = Math.cos(sunAngle * 0.5) * orbitDepth;

    // 月は太陽の対角（180度反対）
    const moonAngle = sunAngle + Math.PI;
    const moonX = Math.cos(moonAngle) * orbitRadius;
    const moonY = Math.sin(moonAngle) * orbitRadius;
    const moonZ = Math.cos(moonAngle * 0.5) * orbitDepth;

    // 太陽メッシュ更新
    if (this.sunGroup) {
      this.sunGroup.position.set(sunX, sunY, sunZ);
      this.sunGroup.lookAt(0, 0, 0);
      this.sunMat.color.copy(cfg.sunColor);
      this.sunHaloMat.color.copy(cfg.sunColor);
      this.sunGroup.visible = (sunY > -12);
    }

    // 月メッシュ更新
    if (this.moonGroup) {
      this.moonGroup.position.set(moonX, moonY, moonZ);
      this.moonGroup.lookAt(0, 0, 0);
      this.moonGroup.visible = (moonY > -12);
    }

    // 星空パーティクル更新（夜空のきらめき効果）
    if (this.starMat) {
      const twinkle = Math.sin(performance.now() * 0.003) * 0.06;
      this.starMat.opacity = Math.max(0.0, Math.min(1.0, cfg.starOpacity + twinkle));
      this.starPoints.visible = (this.starMat.opacity > 0.01);
    }

    // 太陽光（DirectionalLight）
    this.sunLight.position.set(pX + sunX * 0.6, Math.max(2.0, sunY * 0.6), pZ + sunZ * 0.6);
    this.sunLight.target.position.set(pX, 0, pZ);
    this.sunLight.target.updateMatrixWorld();
    this.sunLight.color.copy(cfg.sunColor);
    this.sunLight.intensity = cfg.sunIntensity;
    // 太陽が地平線より上にあり十分な光量がある時のみ影を落とす
    this.sunLight.castShadow = (sunY > 4.0 && cfg.sunIntensity > 0.15);

    // 月光（DirectionalLight）
    this.moonLight.position.set(pX + moonX * 0.5, Math.max(20.0, moonY * 0.5), pZ + moonZ * 0.5);
    this.moonLight.target.position.set(pX, 0, pZ);
    this.moonLight.target.updateMatrixWorld();
    this.moonLight.color.copy(cfg.moonColor);
    this.moonLight.intensity = cfg.moonIntensity;

    // 環境光・半球光
    this.ambientLight.color.copy(cfg.ambientColor);
    this.ambientLight.intensity = cfg.ambientIntensity;

    this.hemiLight.color.copy(cfg.hemiSkyColor);
    this.hemiLight.groundColor.copy(cfg.hemiGroundColor);
    this.hemiLight.intensity = cfg.hemiIntensity;

    // 空とフォグ
    this.scene.background.copy(cfg.skyColor);
    this.scene.fog.color.copy(cfg.fogColor);
    this.scene.fog.near = cfg.fogNear;
    this.scene.fog.far = cfg.fogFar;

    // 夜間サポートライト（薄暗さと確実な視認性を両立しつつ滑らかにフェード）
    if (this.playerNightLight) {
      this.playerNightLight.intensity = cfg.nightFactor * 0.85;
      this.playerNightLight.color.setHex(0xa8ccf5);
      this.playerNightLight.distance = 24;
    }
    if (this.cameraLight) {
      this.cameraLight.intensity = cfg.nightFactor * 0.45;
      this.cameraLight.color.setHex(0x9ec0ea);
      this.cameraLight.distance = 45;
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

    // デフォルト二人称モード：守護精霊ナビの目線からプレイヤーを見下ろす・見つめる（守護精霊モデルは非表示）
    this.spiritModel.visible = false;

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

    // アイドル時の呼吸
    const breath = Math.sin(performance.now() * 0.003) * 0.02;
    this.player3D.bodyGroup.position.y = breath;

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
      this.player3D.bodyGroup.position.y = Math.abs(Math.sin(player.walkAnimTime)) * 0.06;
      if (this.player3D.headGroup) {
        this.player3D.headGroup.rotation.y = Math.sin(player.walkAnimTime * 0.5) * 0.08;
      }
    } else {
      this.player3D.leftLeg.rotation.x *= 0.8;
      this.player3D.rightLeg.rotation.x *= 0.8;
      this.player3D.leftArm.rotation.x *= 0.8;
      if (!player.isAttacking) {
        this.player3D.rightArm.rotation.x *= 0.8;
      }
      if (this.player3D.headGroup) {
        this.player3D.headGroup.rotation.y *= 0.8;
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
      const aAngle = (typeof a.angle === 'number' && !isNaN(a.angle)) ? a.angle : (a.facing < 0 ? Math.PI : 0);
      mesh.rotation.y = -aAngle + Math.PI / 2;

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
        mesh.userData = { type: e.type, entity: e, ...mesh.userData };
        this.scene.add(mesh);
        this.enemyMeshes.set(e._uniqueId, mesh);
      }

      const ex = e.x * WORLD_SCALE;
      const ez = e.y * WORLD_SCALE;
      const ey = this.getTerrainHeight(e.x, e.y, world);
      mesh.position.set(ex, ey, ez);

      const eAngle = (typeof e.angle === 'number' && !isNaN(e.angle)) ? e.angle : (e.facing < 0 ? Math.PI : 0);
      mesh.rotation.y = -eAngle + Math.PI / 2;

      // 敵の頭上HPバー同期（カメラに正対させるビルボード処理）
      if (mesh.userData.hpBarGroup) {
        mesh.userData.hpBarGroup.quaternion.copy(this.camera.quaternion);
      }
      if (mesh.userData.hpBarFill) {
        const hpRatio = Math.max(0.001, Math.min(1.0, e.hp / (e.maxHp || 40)));
        mesh.userData.hpBarFill.scale.x = hpRatio;
        mesh.userData.hpBarFill.position.x = -(1.14 * (1.0 - hpRatio)) / 2;
      }

      // 被ダメージ時のシェイク
      if (e.hitShake > 0) {
        mesh.position.y = ey + 0.12;
        mesh.position.x = ex + (Math.random() - 0.5) * 0.2;
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
