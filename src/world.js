// ワールド生成、タイル、バイオーム、リソースノード、昼夜照明システム

export const TILE_SIZE = 40;
export const WORLD_WIDTH = 100;
export const WORLD_HEIGHT = 100;

export const BIOMES = {
  DEEP_WATER: 0,
  WATER: 1,
  SAND: 2,
  GRASS: 3,
  FOREST: 4,
  MOUNTAIN: 5
};

export const BIOME_COLORS = {
  [BIOMES.DEEP_WATER]: '#1d4872',
  [BIOMES.WATER]: '#2980b9',
  [BIOMES.SAND]: '#e0c98b',
  [BIOMES.GRASS]: '#4e8e45',
  [BIOMES.FOREST]: '#2d5a27',
  [BIOMES.MOUNTAIN]: '#6c7a89'
};

export class World {
  constructor() {
    this.width = WORLD_WIDTH;
    this.height = WORLD_HEIGHT;
    this.tiles = new Uint8Array(this.width * this.height);
    this.resources = []; // 木、石、鉱石、茂みなどのノード
    this.timeOfDay = 8.0; // 0.0 ~ 24.0 (8:00 からスタート)
    this.dayCount = 1;
    this.timeSpeed = 0.04; // 1秒あたりのゲーム時間進行 (1分で約2.4時間、1日10分)
  }

  // ノイズによる島の自動生成
  generate() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.88;

    // 擬似パーリンノイズ関数
    const pseudoNoise = (x, y, freq) => {
      return (
        Math.sin(x * freq + 1.2) * Math.cos(y * freq + 2.3) +
        Math.sin((x + y) * (freq * 1.7)) * 0.5 +
        Math.cos((x * 0.8 - y * 1.2) * (freq * 0.9)) * 0.3
      );
    };

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = dist / maxRadius;

        const n = pseudoNoise(x, y, 0.08) * 0.25 + pseudoNoise(x, y, 0.16) * 0.15;
        const elevation = 1.0 - normDist + n;

        let biome;
        if (elevation < 0.15) {
          biome = BIOMES.DEEP_WATER;
        } else if (elevation < 0.25) {
          biome = BIOMES.WATER;
        } else if (elevation < 0.35) {
          biome = BIOMES.SAND;
        } else if (elevation < 0.70) {
          // 草原か森
          const fNoise = pseudoNoise(x, y, 0.2);
          biome = fNoise > 0.1 ? BIOMES.FOREST : BIOMES.GRASS;
        } else {
          biome = BIOMES.MOUNTAIN;
        }

        this.tiles[y * this.width + x] = biome;
      }
    }

    // 淡水湖の配置（内陸部）
    for (let i = 0; i < 3; i++) {
      const lakeX = Math.floor(centerX + (Math.random() - 0.5) * 35);
      const lakeY = Math.floor(centerY + (Math.random() - 0.5) * 35);
      const lakeRadius = 3 + Math.floor(Math.random() * 3);

      for (let ly = -lakeRadius; ly <= lakeRadius; ly++) {
        for (let lx = -lakeRadius; lx <= lakeRadius; lx++) {
          if (lx * lx + ly * ly <= lakeRadius * lakeRadius) {
            const tx = lakeX + lx;
            const ty = lakeY + ly;
            if (this.isValidTile(tx, ty)) {
              this.tiles[ty * this.width + tx] = BIOMES.WATER;
            }
          }
        }
      }
    }

    // リソースの散布
    this.populateResources();
  }

  isValidTile(x, y) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  getTile(x, y) {
    if (!this.isValidTile(x, y)) return BIOMES.DEEP_WATER;
    return this.tiles[y * this.width + x];
  }

  isWater(x, y) {
    const tile = this.getTile(x, y);
    return tile === BIOMES.WATER || tile === BIOMES.DEEP_WATER;
  }

  isWalkable(worldX, worldY) {
    const tx = Math.floor(worldX / TILE_SIZE);
    const ty = Math.floor(worldY / TILE_SIZE);
    const tile = this.getTile(tx, ty);
    return tile !== BIOMES.DEEP_WATER;
  }

  populateResources() {
    this.resources = [];
    let idCounter = 1;

    for (let y = 3; y < this.height - 3; y++) {
      for (let x = 3; x < this.width - 3; x++) {
        const tile = this.getTile(x, y);
        const wx = x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 14;
        const wy = y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 14;

        if (tile === BIOMES.FOREST) {
          // 森林には木とベリー
          if (Math.random() < 0.42) {
            this.resources.push({
              id: idCounter++,
              type: 'tree',
              x: wx,
              y: wy,
              radius: 18,
              maxHp: 25,
              hp: 25,
              shake: 0
            });
          } else if (Math.random() < 0.12) {
            this.resources.push({
              id: idCounter++,
              type: 'berry_bush',
              x: wx,
              y: wy,
              radius: 14,
              maxHp: 10,
              hp: 10,
              hasBerries: true,
              regrowTimer: 0,
              shake: 0
            });
          }
        } else if (tile === BIOMES.GRASS) {
          // 草原には散発的な木と石
          if (Math.random() < 0.12) {
            this.resources.push({
              id: idCounter++,
              type: 'tree',
              x: wx,
              y: wy,
              radius: 18,
              maxHp: 25,
              hp: 25,
              shake: 0
            });
          } else if (Math.random() < 0.09) {
            this.resources.push({
              id: idCounter++,
              type: 'rock',
              x: wx,
              y: wy,
              radius: 15,
              maxHp: 35,
              hp: 35,
              shake: 0
            });
          } else if (Math.random() < 0.08) {
            this.resources.push({
              id: idCounter++,
              type: 'berry_bush',
              x: wx,
              y: wy,
              radius: 14,
              maxHp: 10,
              hp: 10,
              hasBerries: true,
              regrowTimer: 0,
              shake: 0
            });
          }
        } else if (tile === BIOMES.MOUNTAIN) {
          // 山岳には岩石と鉄鉱石
          if (Math.random() < 0.35) {
            const isIron = Math.random() < 0.35;
            this.resources.push({
              id: idCounter++,
              type: isIron ? 'iron_rock' : 'rock',
              x: wx,
              y: wy,
              radius: 16,
              maxHp: isIron ? 50 : 35,
              hp: isIron ? 50 : 35,
              shake: 0
            });
          }
        } else if (tile === BIOMES.SAND) {
          // 砂浜には小石
          if (Math.random() < 0.05) {
            this.resources.push({
              id: idCounter++,
              type: 'rock',
              x: wx,
              y: wy,
              radius: 12,
              maxHp: 20,
              hp: 20,
              shake: 0
            });
          }
        }
      }
    }
  }

  // 昼夜の更新
  update(dt) {
    this.timeOfDay += (this.timeSpeed * dt);
    if (this.timeOfDay >= 24.0) {
      this.timeOfDay -= 24.0;
      this.dayCount++;
    }

    // 茂みの実の再結実更新
    for (const res of this.resources) {
      if (res.shake > 0) {
        res.shake = Math.max(0, res.shake - dt * 10);
      }
      if (res.type === 'berry_bush' && !res.hasBerries) {
        res.regrowTimer += dt;
        if (res.regrowTimer > 90) { // 90秒で再収穫可能に
          res.hasBerries = true;
          res.regrowTimer = 0;
        }
      }
    }
  }

  // 現在の明るさ（0.0: 深夜の完全な闇 〜 1.0: 昼の明るい太陽）
  getAmbientLight() {
    const t = this.timeOfDay;
    // 04:00〜07:00: 夜明け
    if (t >= 4 && t < 7) {
      return 0.15 + ((t - 4) / 3) * 0.85;
    }
    // 07:00〜18:00: 昼
    if (t >= 7 && t < 18) {
      return 1.0;
    }
    // 18:00〜21:00: 日没・夕暮れ
    if (t >= 18 && t < 21) {
      return 1.0 - ((t - 18) / 3) * 0.85;
    }
    // 21:00〜04:00: 夜
    return 0.15;
  }

  // 時間フォーマット "08:30"
  getTimeFormatted() {
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay - hours) * 60);
    const hStr = String(hours).padStart(2, '0');
    const mStr = String(minutes).padStart(2, '0');
    return `${hStr}:${mStr}`;
  }

  isNight() {
    return this.timeOfDay >= 19.5 || this.timeOfDay < 5.0;
  }

  // タイルの描画
  renderTiles(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.width) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endRow = Math.min(this.height - 1, Math.ceil((camera.y + camera.height) / TILE_SIZE));

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const biome = this.tiles[y * this.width + x];
        const screenX = x * TILE_SIZE - camera.x;
        const screenY = y * TILE_SIZE - camera.y;

        ctx.fillStyle = BIOME_COLORS[biome];
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // 芝生や水面のテクスチャ風ディテール
        if (biome === BIOMES.GRASS || biome === BIOMES.FOREST) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.fillRect(screenX + 4, screenY + 4, 3, 3);
          ctx.fillRect(screenX + 22, screenY + 18, 3, 3);
        } else if (biome === BIOMES.WATER) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
          const waveOff = Math.sin((x + y) + performance.now() * 0.002) * 2;
          ctx.fillRect(screenX + 8 + waveOff, screenY + 14, 12, 2);
        } else if (biome === BIOMES.SAND) {
          ctx.fillStyle = 'rgba(200, 160, 100, 0.2)';
          ctx.fillRect(screenX + 12, screenY + 8, 2, 2);
        }
      }
    }
  }

  // 自然リソースの描画（木、岩、ベリーの茂みなど）
  renderResources(ctx, camera) {
    for (const res of this.resources) {
      if (
        res.x + res.radius < camera.x ||
        res.x - res.radius > camera.x + camera.width ||
        res.y + res.radius < camera.y ||
        res.y - res.radius > camera.y + camera.height
      ) {
        continue;
      }

      const sx = res.x - camera.x + (res.shake > 0 ? (Math.random() - 0.5) * res.shake : 0);
      const sy = res.y - camera.y;

      // 影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + res.radius * 0.6, res.radius * 0.9, res.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (res.type === 'tree') {
        // 幹
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(sx - 4, sy - 4, 8, 14);

        // 葉（2層の円）
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(sx, sy - 10, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#388e3c';
        ctx.beginPath();
        ctx.arc(sx, sy - 14, 12, 0, Math.PI * 2);
        ctx.fill();
      } else if (res.type === 'rock' || res.type === 'iron_rock') {
        // 岩石
        ctx.fillStyle = res.type === 'iron_rock' ? '#5d5d6a' : '#78909c';
        ctx.beginPath();
        ctx.arc(sx, sy, res.radius, 0, Math.PI * 2);
        ctx.fill();

        // 鉱脈のハイライト
        if (res.type === 'iron_rock') {
          ctx.fillStyle = '#d79b00';
          ctx.beginPath();
          ctx.arc(sx - 4, sy - 4, 3, 0, Math.PI * 2);
          ctx.arc(sx + 3, sy + 2, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#90a4ae';
          ctx.beginPath();
          ctx.arc(sx - 3, sy - 3, res.radius * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (res.type === 'berry_bush') {
        // 茂み
        ctx.fillStyle = '#33691e';
        ctx.beginPath();
        ctx.arc(sx, sy, res.radius, 0, Math.PI * 2);
        ctx.fill();

        // ベリーの実
        if (res.hasBerries) {
          ctx.fillStyle = '#ad1457';
          const offsets = [[-5, -4], [4, -3], [-2, 4], [5, 3]];
          for (const [ox, oy] of offsets) {
            ctx.beginPath();
            ctx.arc(sx + ox, sy + oy, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 被ダメージ時のHPバー表示
      if (res.hp < res.maxHp) {
        const barW = 26;
        const barH = 4;
        const pct = Math.max(0, res.hp / res.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(sx - barW / 2, sy - res.radius - 8, barW, barH);
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(sx - barW / 2, sy - res.radius - 8, barW * pct, barH);
      }
    }
  }

  // ミニマップの描画
  renderMinimap(canvas, playerX, playerY) {
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / this.width;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // タイルごとの色をピクセルとして描画
    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const tx = Math.floor(x / scale);
        const ty = Math.floor(y / scale);
        const biome = this.tiles[ty * this.width + tx];

        let r, g, b;
        switch (biome) {
          case BIOMES.DEEP_WATER: r = 29; g = 72; b = 114; break;
          case BIOMES.WATER: r = 41; g = 128; b = 185; break;
          case BIOMES.SAND: r = 224; g = 201; b = 139; break;
          case BIOMES.GRASS: r = 78; g = 142; b = 69; break;
          case BIOMES.FOREST: r = 45; g = 90; b = 39; break;
          case BIOMES.MOUNTAIN: r = 108; g = 122; b = 137; break;
          default: r = 0; g = 0; b = 0;
        }

        const idx = (y * canvas.width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // プレイヤーアイコンをミニマップに描画
    const pMinimapX = (playerX / (this.width * TILE_SIZE)) * canvas.width;
    const pMinimapY = (playerY / (this.height * TILE_SIZE)) * canvas.height;

    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(pMinimapX, pMinimapY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
