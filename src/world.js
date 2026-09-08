// 三人称（2.5D クォータービュー / 傾斜TPS）ワールドレンダリング

export const TILE_SIZE = 52;
export const WORLD_WIDTH = 90;
export const WORLD_HEIGHT = 90;
export const PITCH_RATIO = 0.72; // 斜め見下ろしのY軸傾斜圧縮（三人称パースペクティブ）

export const BIOMES = {
  DEEP_WATER: 0,
  WATER: 1,
  SAND: 2,
  GRASS: 3,
  FOREST: 4,
  MOUNTAIN: 5
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
          if (Math.random() < 0.38) {
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
          } else if (Math.random() < 0.12) {
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
          if (Math.random() < 0.12) {
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
          } else if (Math.random() < 0.09) {
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
          } else if (Math.random() < 0.08) {
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
          if (Math.random() < 0.35) {
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
          if (Math.random() < 0.05) {
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

  // 三人称（2.5Dクォータービュー）のタイルマップ描画
  renderTiles(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE) - 2);
    const endCol = Math.min(this.width - 1, Math.ceil((camera.x + camera.width) / TILE_SIZE) + 2);
    const startRow = Math.max(0, Math.floor((camera.y / PITCH_RATIO) / TILE_SIZE) - 2);
    const endRow = Math.min(this.height - 1, Math.ceil(((camera.y + camera.height) / PITCH_RATIO) / TILE_SIZE) + 4);

    const time = performance.now() * 0.0015;
    const tileH = TILE_SIZE * PITCH_RATIO;

    for (let y = startRow; y <= endRow; y++) {
      for (let x = startCol; x <= endCol; x++) {
        const biome = this.tiles[y * this.width + x];
        const screenX = x * TILE_SIZE - camera.x;
        const screenY = (y * TILE_SIZE) * PITCH_RATIO - camera.y;

        switch (biome) {
          case BIOMES.DEEP_WATER:
            ctx.fillStyle = '#0e2740';
            ctx.fillRect(screenX, screenY, TILE_SIZE, tileH);
            ctx.fillStyle = 'rgba(20, 60, 100, 0.4)';
            ctx.fillRect(screenX + ((Math.sin(time + y) + 1) * 8), screenY + 8, 26, 4);
            break;

          case BIOMES.WATER:
            const waterGrad = ctx.createLinearGradient(screenX, screenY, screenX, screenY + tileH);
            waterGrad.addColorStop(0, '#195e93');
            waterGrad.addColorStop(1, '#134b76');
            ctx.fillStyle = waterGrad;
            ctx.fillRect(screenX, screenY, TILE_SIZE, tileH);

            // 水面反射
            ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
            const wave1 = Math.sin(time * 2 + x * 0.6 + y * 0.4) * 4;
            ctx.fillRect(screenX + 8 + wave1, screenY + 6, 18, 2);
            ctx.fillRect(screenX + 20 - wave1, screenY + 18, 14, 2);
            break;

          case BIOMES.SAND:
            ctx.fillStyle = '#dfbe83';
            ctx.fillRect(screenX, screenY, TILE_SIZE, tileH);

            ctx.fillStyle = 'rgba(180, 140, 90, 0.28)';
            ctx.fillRect(screenX + ((x * 17) % 36) + 4, screenY + ((y * 23) % 24) + 3, 3, 2);

            // 白波
            if (this.isWater(x + 1, y) || this.isWater(x - 1, y) || this.isWater(x, y + 1) || this.isWater(x, y - 1)) {
              ctx.fillStyle = `rgba(255, 255, 255, ${0.45 + Math.sin(time * 3 + x + y) * 0.25})`;
              ctx.fillRect(screenX, screenY, TILE_SIZE, 3);
            }
            break;

          case BIOMES.GRASS:
            ctx.fillStyle = '#3c7932';
            ctx.fillRect(screenX, screenY, TILE_SIZE, tileH);

            ctx.fillStyle = '#4c993f';
            ctx.fillRect(screenX + ((x * 19) % 32) + 6, screenY + ((y * 13) % 22) + 4, 8, 3);
            ctx.fillStyle = '#2f6027';
            ctx.fillRect(screenX + ((x * 31) % 30) + 14, screenY + ((y * 17) % 22) + 12, 10, 2.5);
            break;

          case BIOMES.FOREST:
            ctx.fillStyle = '#22471c';
            ctx.fillRect(screenX, screenY, TILE_SIZE, tileH);

            ctx.fillStyle = '#1b3a16';
            ctx.fillRect(screenX + 6, screenY + 6, 14, 4);
            ctx.fillStyle = '#355e2d';
            ctx.fillRect(screenX + 24, screenY + 16, 12, 4);
            break;

          case BIOMES.MOUNTAIN:
            ctx.fillStyle = '#566573';
            ctx.fillRect(screenX, screenY, TILE_SIZE, tileH);

            ctx.fillStyle = '#414b56';
            ctx.fillRect(screenX + 4, screenY + 4, 20, 3);
            ctx.fillStyle = '#6c7d8d';
            ctx.fillRect(screenX + 16, screenY + 14, 16, 4);
            break;
        }

        // わずかなグリッドライン
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, tileH);
      }
    }
  }

  // 三人称立体リソース描画（垂直に立ち上がる樹木や岩石）
  renderResources(ctx, camera) {
    const visibleResources = this.resources.filter(res => {
      const sy = (res.y * PITCH_RATIO) - camera.y;
      return (
        res.x + res.radius >= camera.x - 40 &&
        res.x - res.radius <= camera.x + camera.width + 40 &&
        sy >= -60 &&
        sy <= camera.height + 60
      );
    });

    visibleResources.sort((a, b) => a.y - b.y);

    for (const res of visibleResources) {
      const sx = res.x - camera.x + (res.shake > 0 ? (Math.random() - 0.5) * res.shake : 0);
      const sy = (res.y * PITCH_RATIO) - camera.y;

      // 接地ドロップシャドウ（斜め見下ろしに合わせて扁平に）
      ctx.save();
      ctx.fillStyle = 'rgba(8, 12, 18, 0.35)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 4, res.radius * 1.1, res.radius * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (res.type === 'tree') {
        const wind = Math.sin(this.windTime + res.swayOffset) * 4;

        // 幹（上に向かって垂直に立ち上がる立体表現）
        const trunkGrad = ctx.createLinearGradient(sx - 7, sy, sx + 7, sy);
        trunkGrad.addColorStop(0, '#3e2723');
        trunkGrad.addColorStop(0.4, '#5d4037');
        trunkGrad.addColorStop(1, '#2e1c18');
        ctx.fillStyle = trunkGrad;
        ctx.beginPath();
        ctx.roundRect(sx - 7, sy - 28, 14, 32, [2, 2, 4, 4]);
        ctx.fill();

        // 根
        ctx.fillStyle = '#3e2723';
        ctx.beginPath();
        ctx.moveTo(sx - 12, sy + 4);
        ctx.lineTo(sx - 5, sy - 8);
        ctx.lineTo(sx + 5, sy - 8);
        ctx.lineTo(sx + 12, sy + 4);
        ctx.closePath();
        ctx.fill();

        // 立体キャノピー（立ち木の上部に大きく広がる）
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(sx + wind * 0.5, sy - 40, 26, 0, Math.PI * 2);
        ctx.fill();

        const foliageGrad = ctx.createRadialGradient(
          sx + wind * 0.8 - 6, sy - 48, 4,
          sx + wind * 0.8, sy - 46, 24
        );
        foliageGrad.addColorStop(0, '#4caf50');
        foliageGrad.addColorStop(0.7, '#2e7d32');
        foliageGrad.addColorStop(1, '#1b5e20');
        ctx.fillStyle = foliageGrad;
        ctx.beginPath();
        ctx.arc(sx + wind * 0.8, sy - 46, 24, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#81c784';
        ctx.beginPath();
        ctx.arc(sx + wind * 1.0 - 6, sy - 52, 9, 0, Math.PI * 2);
        ctx.arc(sx + wind * 1.0 + 5, sy - 48, 8, 0, Math.PI * 2);
        ctx.fill();

      } else if (res.type === 'rock' || res.type === 'iron_rock') {
        const isIron = res.type === 'iron_rock';

        ctx.save();
        ctx.translate(sx, sy - 6); // 少し持ち上げて立体的に

        const rockGrad = ctx.createLinearGradient(-res.radius, -res.radius, res.radius, res.radius);
        if (isIron) {
          rockGrad.addColorStop(0, '#606270');
          rockGrad.addColorStop(0.6, '#3e404d');
          rockGrad.addColorStop(1, '#252630');
        } else {
          rockGrad.addColorStop(0, '#90a4ae');
          rockGrad.addColorStop(0.6, '#607d8b');
          rockGrad.addColorStop(1, '#37474f');
        }

        ctx.fillStyle = rockGrad;
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

        ctx.strokeStyle = isIron ? 'rgba(255, 255, 255, 0.22)' : 'rgba(255, 255, 255, 0.32)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-res.radius * 0.4, -res.radius * 0.9);
        ctx.lineTo(0, -2);
        ctx.lineTo(res.radius * 0.6, -res.radius * 0.8);
        ctx.stroke();

        if (isIron) {
          const sparkle = Math.sin(performance.now() * 0.005 + res.seed * 10) > 0.3;
          ctx.fillStyle = '#ffb300';
          ctx.beginPath();
          ctx.arc(-4, -6, 4, 0, Math.PI * 2);
          ctx.arc(5, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff9c4';
          ctx.beginPath();
          ctx.arc(-5, -7, 1.8, 0, Math.PI * 2);
          ctx.arc(4, -1, 2, 0, Math.PI * 2);
          ctx.fill();

          if (sparkle) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(4, -1, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();

      } else if (res.type === 'berry_bush') {
        const wind = Math.sin(this.windTime + res.swayOffset) * 2;

        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(sx + wind, sy - 8, res.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#33691e';
        ctx.beginPath();
        ctx.arc(sx + wind - 3, sy - 11, res.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#558b2f';
        ctx.beginPath();
        ctx.arc(sx + wind + 2, sy - 13, res.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        if (res.hasBerries) {
          const berries = [
            { x: -6, y: -12 },
            { x: 5, y: -11 },
            { x: -3, y: -4 },
            { x: 6, y: -5 },
            { x: 0, y: -16 }
          ];
          for (const b of berries) {
            const bx = sx + wind + b.x;
            const by = sy + b.y;

            ctx.fillStyle = '#c2185b';
            ctx.beginPath();
            ctx.arc(bx, by, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f48fb1';
            ctx.beginPath();
            ctx.arc(bx - 1.2, by - 1.2, 1.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      if (res.hp < res.maxHp) {
        const barW = 32;
        const barH = 5;
        const pct = Math.max(0, res.hp / res.maxHp);
        const by = sy - (res.type === 'tree' ? 70 : 26);

        ctx.fillStyle = 'rgba(10, 14, 20, 0.85)';
        ctx.beginPath();
        ctx.roundRect(sx - barW / 2 - 1, by - 1, barW + 2, barH + 2, 3);
        ctx.fill();

        const hpGrad = ctx.createLinearGradient(sx - barW / 2, by, sx + barW / 2, by);
        hpGrad.addColorStop(0, '#ff9800');
        hpGrad.addColorStop(1, '#ff5722');
        ctx.fillStyle = hpGrad;
        ctx.beginPath();
        ctx.roundRect(sx - barW / 2, by, barW * pct, barH, 2);
        ctx.fill();
      }
    }
  }

  renderMinimap(canvas, playerX, playerY) {
    const ctx = canvas.getContext('2d');
    const scale = canvas.width / this.width;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgData = ctx.createImageData(canvas.width, canvas.height);
    const data = imgData.data;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
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

        const idx = (y * canvas.width + x) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    const pMinimapX = (playerX / (this.width * TILE_SIZE)) * canvas.width;
    const pMinimapY = (playerY / (this.height * TILE_SIZE)) * canvas.height;

    const pulse = (performance.now() * 0.004) % 1;
    ctx.strokeStyle = `rgba(255, 50, 50, ${1 - pulse})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pMinimapX, pMinimapY, 3 + pulse * 5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ff1744';
    ctx.beginPath();
    ctx.arc(pMinimapX, pMinimapY, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}
