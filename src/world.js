// 高速・軽量化された三人称（2.5D クォータービュー）ワールドレンダリング

export const TILE_SIZE = 52;
export const WORLD_WIDTH = 90;
export const WORLD_HEIGHT = 90;
export const PITCH_RATIO = 0.72;

export const BIOMES = {
  DEEP_WATER: 0,
  WATER: 1,
  SAND: 2,
  GRASS: 3,
  FOREST: 4,
  MOUNTAIN: 5
};

// 高速ルックアップ用カラーパレット
const BIOME_PALETTE = {
  [BIOMES.DEEP_WATER]: '#0e2740',
  [BIOMES.WATER]: '#195e93',
  [BIOMES.SAND]: '#dfbe83',
  [BIOMES.GRASS]: '#3c7932',
  [BIOMES.FOREST]: '#22471c',
  [BIOMES.MOUNTAIN]: '#566573'
};

export class World {
  constructor() {
    this.width = WORLD_WIDTH;
    this.height = WORLD_HEIGHT;
    this.tiles = new Uint8Array(this.width * this.height);
    this.resources = [];
    this.timeOfDay = 8.5;
    this.dayCount = 1;
    this.timeSpeed = 0.035;
    this.windTime = 0;

    // ミニマップ事前描画バッファ（毎フレームのピクセル再生成をゼロにする）
    this.minimapBgCanvas = null;
  }

  generate() {
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.88;

    const pseudoNoise = (x, y, freq) => {
      return (
        Math.sin(x * freq + 1.3) * Math.cos(y * freq + 2.7) +
        Math.sin((x + y) * (freq * 1.8)) * 0.5 +
        Math.cos((x * 0.7 - y * 1.3) * (freq * 0.95)) * 0.35
      );
    };

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const normDist = dist / maxRadius;

        const n = pseudoNoise(x, y, 0.07) * 0.28 + pseudoNoise(x, y, 0.15) * 0.14;
        const elevation = 1.0 - normDist + n;

        let biome;
        if (elevation < 0.14) {
          biome = BIOMES.DEEP_WATER;
        } else if (elevation < 0.26) {
          biome = BIOMES.WATER;
        } else if (elevation < 0.36) {
          biome = BIOMES.SAND;
        } else if (elevation < 0.70) {
          const fNoise = pseudoNoise(x, y, 0.18);
          biome = fNoise > 0.08 ? BIOMES.FOREST : BIOMES.GRASS;
        } else {
          biome = BIOMES.MOUNTAIN;
        }

        this.tiles[y * this.width + x] = biome;
      }
    }

    for (let i = 0; i < 3; i++) {
      const lakeX = Math.floor(centerX + (Math.random() - 0.5) * 30);
      const lakeY = Math.floor(centerY + (Math.random() - 0.5) * 30);
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

    this.populateResources();
    this.preRenderMinimap();
  }

  // ミニマップを1度だけ事前描画
  preRenderMinimap() {
    const size = 120;
    this.minimapBgCanvas = document.createElement('canvas');
    this.minimapBgCanvas.width = size;
    this.minimapBgCanvas.height = size;
    const ctx = this.minimapBgCanvas.getContext('2d');
    const scale = size / this.width;

    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tx = Math.floor(x / scale);
        const ty = Math.floor(y / scale);
        const biome = this.tiles[ty * this.width + tx];

        let r, g, b;
        switch (biome) {
          case BIOMES.DEEP_WATER: r = 14; g = 39; b = 64; break;
          case BIOMES.WATER: r = 25; g = 94; b = 147; break;
          case BIOMES.SAND: r = 223; g = 190; b = 131; break;
          case BIOMES.GRASS: r = 60; g = 121; b = 50; break;
          case BIOMES.FOREST: r = 34; g = 71; b = 28; break;
          case BIOMES.MOUNTAIN: r = 86; g = 101; b = 115; break;
          default: r = 0; g = 0; b = 0;
        }

        const idx = (y * size + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
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
        const wx = x * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 16;
        const wy = y * TILE_SIZE + TILE_SIZE / 2 + (Math.random() - 0.5) * 16;

        if (tile === BIOMES.FOREST) {
          if (Math.random() < 0.35) {
            this.resources.push({
              id: idCounter++,
              type: 'tree',
              x: wx,
              y: wy,
              radius: 24,
              maxHp: 25,
              hp: 25,
              shake: 0,
              swayOffset: Math.random() * Math.PI * 2,
              seed: Math.random()
            });
          } else if (Math.random() < 0.10) {
            this.resources.push({
              id: idCounter++,
              type: 'berry_bush',
              x: wx,
              y: wy,
              radius: 17,
              maxHp: 10,
              hp: 10,
              hasBerries: true,
              regrowTimer: 0,
              shake: 0,
              swayOffset: Math.random() * Math.PI * 2
            });
          }
        } else if (tile === BIOMES.GRASS) {
          if (Math.random() < 0.10) {
            this.resources.push({
              id: idCounter++,
              type: 'tree',
              x: wx,
              y: wy,
              radius: 24,
              maxHp: 25,
              hp: 25,
              shake: 0,
              swayOffset: Math.random() * Math.PI * 2,
              seed: Math.random()
            });
          } else if (Math.random() < 0.08) {
            this.resources.push({
              id: idCounter++,
              type: 'rock',
              x: wx,
              y: wy,
              radius: 19,
              maxHp: 35,
              hp: 35,
              shake: 0,
              seed: Math.random()
            });
          } else if (Math.random() < 0.07) {
            this.resources.push({
              id: idCounter++,
              type: 'berry_bush',
              x: wx,
              y: wy,
              radius: 17,
              maxHp: 10,
              hp: 10,
              hasBerries: true,
              regrowTimer: 0,
              shake: 0,
              swayOffset: Math.random() * Math.PI * 2
            });
          }
        } else if (tile === BIOMES.MOUNTAIN) {
          if (Math.random() < 0.32) {
            const isIron = Math.random() < 0.4;
            this.resources.push({
              id: idCounter++,
              type: isIron ? 'iron_rock' : 'rock',
              x: wx,
              y: wy,
              radius: 20,
              maxHp: isIron ? 50 : 35,
              hp: isIron ? 50 : 35,
              shake: 0,
              seed: Math.random()
            });
          }
        } else if (tile === BIOMES.SAND) {
          if (Math.random() < 0.04) {
            this.resources.push({
              id: idCounter++,
              type: 'rock',
              x: wx,
              y: wy,
              radius: 14,
              maxHp: 20,
              hp: 20,
              shake: 0,
              seed: Math.random()
            });
          }
        }
      }
    }
  }

  update(dt) {
    this.timeOfDay += (this.timeSpeed * dt);
    if (this.timeOfDay >= 24.0) {
      this.timeOfDay -= 24.0;
      this.dayCount++;
    }

    this.windTime += dt * 1.8;

    for (const res of this.resources) {
      if (res.shake > 0) {
        res.shake = Math.max(0, res.shake - dt * 12);
      }
      if (res.type === 'berry_bush' && !res.hasBerries) {
        res.regrowTimer += dt;
        if (res.regrowTimer > 75) {
          res.hasBerries = true;
          res.regrowTimer = 0;
        }
      }
    }
  }

  getAmbientLight() {
    const t = this.timeOfDay;
    if (t >= 4.5 && t < 7) {
      return 0.18 + ((t - 4.5) / 2.5) * 0.82;
    }
    if (t >= 7 && t < 17.5) {
      return 1.0;
    }
    if (t >= 17.5 && t < 20.5) {
      return 1.0 - ((t - 17.5) / 3.0) * 0.82;
    }
    return 0.18;
  }

  getSkyColor() {
    const t = this.timeOfDay;
    if (t >= 5 && t < 7.5) {
      return { r: 255, g: 190, b: 120, a: 0.15 };
    } else if (t >= 17.5 && t < 20.5) {
      return { r: 250, g: 110, b: 60, a: 0.22 };
    } else if (t >= 20.5 || t < 5) {
      return { r: 20, g: 30, b: 70, a: 0.35 };
    }
    return null;
  }

  getTimeFormatted() {
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  isNight() {
    return this.timeOfDay >= 19.5 || this.timeOfDay < 5.0;
  }

  // 高速化された三人称タイルレンダリング（グラデーション生成を撤廃）
  renderTiles(ctx, camera) {
    const tileH = TILE_SIZE * PITCH_RATIO;
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.width) / TILE_SIZE));
    const startRow = Math.max(0, Math.floor((camera.y / PITCH_RATIO) / TILE_SIZE));
    const endRow = Math.min(this.height - 1, Math.ceil(((camera.y + camera.height) / PITCH_RATIO) / TILE_SIZE) + 2);

    const time = performance.now() * 0.002;

    for (let y = startRow; y <= endRow; y++) {
      const screenY = (y * TILE_SIZE) * PITCH_RATIO - camera.y;

      for (let x = startCol; x <= endCol; x++) {
        const biome = this.tiles[y * this.width + x];
        const screenX = x * TILE_SIZE - camera.x;

        // パレットによる一発塗り
        ctx.fillStyle = BIOME_PALETTE[biome] || '#22471c';
        ctx.fillRect(screenX, screenY, TILE_SIZE + 0.5, tileH + 0.5);

        // 必要最小限の軽量ディテール
        if (biome === BIOMES.WATER) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          const waveOff = Math.sin(time + x * 0.5 + y) * 4;
          ctx.fillRect(screenX + 10 + waveOff, screenY + 8, 16, 2);
        } else if (biome === BIOMES.SAND) {
          if (this.isWater(x + 1, y) || this.isWater(x - 1, y) || this.isWater(x, y + 1) || this.isWater(x, y - 1)) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(screenX, screenY, TILE_SIZE, 2.5);
          }
        }
      }
    }
  }

  // 最適化された三人称立体リソース描画
  renderResources(ctx, camera) {
    const time = this.windTime;

    // 画面内のみ厳密にフィルタリング
    const visible = [];
    for (let i = 0; i < this.resources.length; i++) {
      const res = this.resources[i];
      const sy = (res.y * PITCH_RATIO) - camera.y;
      if (
        res.x + res.radius >= camera.x - 30 &&
        res.x - res.radius <= camera.x + camera.width + 30 &&
        sy >= -70 &&
        sy <= camera.height + 40
      ) {
        visible.push(res);
      }
    }

    // Yソート
    visible.sort((a, b) => a.y - b.y);

    for (let i = 0; i < visible.length; i++) {
      const res = visible[i];
      const sx = res.x - camera.x + (res.shake > 0 ? (Math.random() - 0.5) * res.shake : 0);
      const sy = (res.y * PITCH_RATIO) - camera.y;

      // 接地影
      ctx.fillStyle = 'rgba(8, 12, 20, 0.35)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 4, res.radius * 1.05, res.radius * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();

      if (res.type === 'tree') {
        const wind = Math.sin(time + res.swayOffset) * 4;

        // 幹
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(sx - 7, sy - 28, 14, 32, [2, 2, 4, 4]);
        ctx.fill();

        // 根
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.moveTo(sx - 11, sy + 4);
        ctx.lineTo(sx - 5, sy - 8);
        ctx.lineTo(sx + 5, sy - 8);
        ctx.lineTo(sx + 11, sy + 4);
        ctx.closePath();
        ctx.fill();

        // キャノピー（下層・中層・ハイライト）
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(sx + wind * 0.5, sy - 40, 25, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.arc(sx + wind * 0.8, sy - 46, 23, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4caf50';
        ctx.beginPath();
        ctx.arc(sx + wind * 1.0 - 5, sy - 52, 9, 0, Math.PI * 2);
        ctx.arc(sx + wind * 1.0 + 5, sy - 48, 8, 0, Math.PI * 2);
        ctx.fill();

      } else if (res.type === 'rock' || res.type === 'iron_rock') {
        const isIron = res.type === 'iron_rock';

        ctx.save();
        ctx.translate(sx, sy - 6);

        ctx.fillStyle = isIron ? '#455a64' : '#607d8b';
        ctx.beginPath();
        ctx.moveTo(-res.radius * 0.85, res.radius * 0.3);
        ctx.lineTo(-res.radius, -res.radius * 0.4);
        ctx.lineTo(-res.radius * 0.4, -res.radius * 0.9);
        ctx.lineTo(res.radius * 0.6, -res.radius * 0.8);
        ctx.lineTo(res.radius, -res.radius * 0.2);
        ctx.lineTo(res.radius * 0.75, res.radius * 0.5);
        ctx.lineTo(0, res.radius * 0.6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = isIron ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-res.radius * 0.4, -res.radius * 0.9);
        ctx.lineTo(0, -2);
        ctx.lineTo(res.radius * 0.6, -res.radius * 0.8);
        ctx.stroke();

        if (isIron) {
          ctx.fillStyle = '#ffb300';
          ctx.beginPath();
          ctx.arc(-4, -6, 3.5, 0, Math.PI * 2);
          ctx.arc(5, 0, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff9c4';
          ctx.beginPath();
          ctx.arc(-5, -7, 1.6, 0, Math.PI * 2);
          ctx.arc(4, -1, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

      } else if (res.type === 'berry_bush') {
        const wind = Math.sin(time + res.swayOffset) * 2;

        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(sx + wind, sy - 8, res.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#33691e';
        ctx.beginPath();
        ctx.arc(sx + wind - 3, sy - 11, res.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        if (res.hasBerries) {
          ctx.fillStyle = '#c2185b';
          const berries = [[-6, -12], [5, -11], [-3, -4], [6, -5]];
          for (let b = 0; b < berries.length; b++) {
            const bx = sx + wind + berries[b][0];
            const by = sy + berries[b][1];
            ctx.beginPath();
            ctx.arc(bx, by, 3.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (res.hp < res.maxHp) {
        const barW = 32;
        const barH = 4;
        const pct = Math.max(0, res.hp / res.maxHp);
        const by = sy - (res.type === 'tree' ? 68 : 25);

        ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
        ctx.fillRect(sx - barW / 2, by, barW, barH);
        ctx.fillStyle = '#ff5722';
        ctx.fillRect(sx - barW / 2, by, barW * pct, barH);
      }
    }
  }

  // 1発で描画される超高速ミニマップ（毎フレームの重いループ全廃）
  renderMinimap(canvas, playerX, playerY) {
    if (!this.minimapBgCanvas) return;
    const ctx = canvas.getContext('2d');

    // 焼き込み済み背景を1発コピー (0.01ms)
    ctx.drawImage(this.minimapBgCanvas, 0, 0);

    // プレイヤーの点だけ描画
    const pMinimapX = (playerX / (this.width * TILE_SIZE)) * canvas.width;
    const pMinimapY = (playerY / (this.height * TILE_SIZE)) * canvas.height;

    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(pMinimapX, pMinimapY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
