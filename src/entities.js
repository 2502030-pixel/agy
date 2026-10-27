// 最適化された三人称（2.5D）エンティティ描画（画面外カリングとアロケーション削減）

import { ITEMS } from './items.js';
import { PITCH_RATIO } from './world.js';

// ドロップアイテム
export class DroppedItem {
  constructor(itemId, count, x, y) {
    this.itemId = itemId;
    this.count = count;
    this.x = x + (Math.random() - 0.5) * 16;
    this.y = y + (Math.random() - 0.5) * 16;
    this.baseY = this.y;
    this.floatTimer = Math.random() * Math.PI * 2;
    this.radius = 12;
    this.pickupDelay = 0.4;
  }

  update(dt, playerX, playerY) {
    this.floatTimer += dt * 3.5;
    if (this.pickupDelay > 0) {
      this.pickupDelay -= dt;
    }

    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 90 && this.pickupDelay <= 0) {
      const speed = (280 + (90 - dist) * 3) * dt;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
      this.baseY = this.y;
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const groundSy = (this.baseY * PITCH_RATIO) - camera.y;

    // 画面外カリング
    if (sx < -30 || sx > camera.width + 30 || groundSy < -30 || groundSy > camera.height + 30) {
      return;
    }

    const floatY = Math.sin(this.floatTimer) * 4;
    const sy = groundSy - 8 + floatY;

    const itemDef = ITEMS[this.itemId];
    if (!itemDef) return;

    // 接地ソフトシャドウ
    ctx.fillStyle = 'rgba(10, 15, 25, 0.28)';
    ctx.beginPath();
    ctx.ellipse(sx, groundSy + 2, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // アイテムアイコン
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(itemDef.icon, sx, sy);

    if (this.count > 1) {
      ctx.fillStyle = '#1e232d';
      ctx.beginPath();
      ctx.roundRect(sx + 3, sy + 2, 16, 11, 2.5);
      ctx.fill();

      ctx.fillStyle = '#ffca28';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this.count}`, sx + 11, sy + 7.5);
    }
  }
}

// 建築物・設置物
export class Building {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = 20;
    this.isOpen = false;
    this.chestItems = type === 'chest' ? new Array(18).fill(null) : null;
    this.hp = type === 'wall' ? 150 : (type === 'door' ? 100 : 50);
    this.maxHp = this.hp;
    this.animTime = Math.random() * 10;
  }

  update(dt, particles) {
    this.animTime += dt;

    if (this.type === 'campfire' || this.type === 'torch') {
      if (Math.random() < 0.3) {
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * 12,
          this.y,
          (Math.random() - 0.5) * 20,
          -Math.random() * 40 - 20,
          Math.random() < 0.5 ? '#ffb300' : '#ff5722',
          0.6,
          2.5
        ));
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = (this.y * PITCH_RATIO) - camera.y;

    // 画面外カリング
    if (sx < -40 || sx > camera.width + 40 || sy < -50 || sy > camera.height + 40) {
      return;
    }

    // 接地影
    ctx.fillStyle = 'rgba(8, 12, 20, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'campfire') {
      ctx.fillStyle = '#546e7a';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const stoneX = sx + Math.cos(a) * 15;
        const stoneY = sy + Math.sin(a) * 6;
        ctx.beginPath();
        ctx.ellipse(stoneX, stoneY, 4.5, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#4e342e';
      ctx.save();
      ctx.translate(sx, sy - 2);
      ctx.rotate(0.5);
      ctx.fillRect(-12, -3, 24, 6);
      ctx.rotate(-1.0);
      ctx.fillRect(-12, -3, 24, 6);
      ctx.restore();

      ctx.fillStyle = '#ff3d00';
      ctx.beginPath();
      ctx.arc(sx, sy - 3, 7, 0, Math.PI * 2);
      ctx.fill();

      const fTime = this.animTime * 6;
      const flameOffX = Math.sin(fTime) * 3;
      const flameH = 19 + Math.sin(fTime * 1.5) * 4;

      ctx.fillStyle = '#ff6f00';
      ctx.beginPath();
      ctx.moveTo(sx - 9, sy);
      ctx.quadraticCurveTo(sx - 10, sy - flameH * 0.5, sx + flameOffX, sy - flameH);
      ctx.quadraticCurveTo(sx + 10, sy - flameH * 0.5, sx + 9, sy);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fff59d';
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy - 1);
      ctx.quadraticCurveTo(sx - 5, sy - flameH * 0.4, sx + flameOffX * 0.7, sy - flameH * 0.75);
      ctx.quadraticCurveTo(sx + 5, sy - flameH * 0.4, sx + 5, sy - 1);
      ctx.closePath();
      ctx.fill();

    } else if (this.type === 'workbench') {
      ctx.fillStyle = '#6d4c41';
      ctx.beginPath();
      ctx.roundRect(sx - 18, sy - 18, 36, 24, 3);
      ctx.fill();

      ctx.fillStyle = '#3e2723';
      ctx.fillRect(sx - 16, sy + 6, 6, 8);
      ctx.fillRect(sx + 10, sy + 6, 6, 8);

      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx - 18, sy - 18, 36, 24);

      ctx.fillStyle = '#37474f';
      ctx.fillRect(sx - 14, sy - 14, 8, 6);
      ctx.fillStyle = '#fff9c4';
      ctx.fillRect(sx + 2, sy - 12, 11, 4);

    } else if (this.type === 'wall') {
      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.roundRect(sx - 18, sy - 28, 36, 36, 2);
      ctx.fill();

      ctx.fillStyle = '#795548';
      ctx.fillRect(sx - 16, sy - 26, 10, 32);
      ctx.fillRect(sx - 5, sy - 26, 10, 32);
      ctx.fillRect(sx + 6, sy - 26, 10, 32);

      ctx.fillStyle = '#37474f';
      ctx.fillRect(sx - 18, sy - 16, 36, 4);
      ctx.fillRect(sx - 18, sy - 2, 36, 4);

    } else if (this.type === 'door') {
      if (this.isOpen) {
        ctx.fillStyle = 'rgba(40, 50, 60, 0.35)';
        ctx.fillRect(sx - 16, sy - 28, 32, 36);

        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.roundRect(sx - 18, sy - 28, 8, 36, 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.roundRect(sx - 18, sy - 28, 36, 36, 2);
        ctx.fill();

        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(sx - 14, sy - 24, 28, 28);

        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.arc(sx + 8, sy - 10, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.type === 'chest') {
      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.roundRect(sx - 16, sy - 12, 32, 20, 2);
      ctx.fill();

      ctx.fillStyle = '#6d4c41';
      ctx.beginPath();
      ctx.roundRect(sx - 16, sy - 18, 32, 10, 2);
      ctx.fill();

      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sx - 16, sy - 12, 32, 20);

      ctx.fillStyle = '#ffc107';
      ctx.fillRect(sx - 4, sy - 10, 8, 8);

    } else if (this.type === 'torch') {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(sx - 3, sy - 16, 6, 20);

      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(sx, sy - 16, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(sx, sy - 17, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.hp < this.maxHp) {
      const w = 30;
      const h = 4;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(sx - w / 2, sy - 34, w, h);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(sx - w / 2, sy - 34, w * pct, h);
    }
  }
}

// 野生動物
export class Animal {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.hp = type === 'deer' ? 30 : 12;
    this.maxHp = this.hp;
    this.radius = type === 'deer' ? 16 : 10;
    this.speed = type === 'deer' ? 70 : 90;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.wanderTimer = Math.random() * 3;
    this.fleeTimer = 0;
    this.animTime = Math.random() * 10;
  }

  update(dt, playerX, playerY, world) {
    this.animTime += dt;
    const distToPlayer = Math.hypot(playerX - this.x, playerY - this.y);

    if (distToPlayer < 140) {
      this.fleeTimer = 2.5;
    }

    if (this.fleeTimer > 0) {
      this.fleeTimer -= dt;
      const angle = Math.atan2(this.y - playerY, this.x - playerX);
      this.vx = Math.cos(angle) * (this.speed * 1.5);
      this.vy = Math.sin(angle) * (this.speed * 1.5);
    } else {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 2 + Math.random() * 4;
        if (Math.random() < 0.6) {
          const angle = Math.random() * Math.PI * 2;
          this.vx = Math.cos(angle) * (this.speed * 0.4);
          this.vy = Math.sin(angle) * (this.speed * 0.4);
        } else {
          this.vx = 0;
          this.vy = 0;
        }
      }
    }

    if (Math.abs(this.vx) > 5) {
      this.facing = this.vx > 0 ? 1 : -1;
    }

    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    let blocked = false;
    if (world.resources) {
      for (let i = 0; i < world.resources.length; i++) {
        const res = world.resources[i];
        if (res.hp <= 0) continue;
        if (res.type === 'tree' || res.type === 'rock' || res.type === 'iron_rock') {
          const resRadius = res.type === 'tree' ? 16 : 18;
          if (Math.hypot(nextX - res.x, nextY - res.y) < this.radius + resRadius) {
            blocked = true;
            break;
          }
        }
      }
    }

    if (!blocked && world.isWalkable(nextX, nextY)) {
      this.x = nextX;
      this.y = nextY;
    } else {
      this.vx = -this.vx;
      this.vy = -this.vy;
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = (this.y * PITCH_RATIO) - camera.y;

    // 画面外カリング
    if (sx < -30 || sx > camera.width + 30 || sy < -40 || sy > camera.height + 30) {
      return;
    }

    const isMoving = Math.hypot(this.vx, this.vy) > 8;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(this.facing, 1);

    if (this.type === 'rabbit') {
      const hop = isMoving ? Math.abs(Math.sin(this.animTime * 10)) * 6 : 0;

      ctx.fillStyle = 'rgba(8, 12, 18, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0d8cc';
      ctx.beginPath();
      ctx.ellipse(0, -4 - hop, 8, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fbf9f5';
      ctx.beginPath();
      ctx.ellipse(2, -2 - hop, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e0d8cc';
      ctx.beginPath();
      ctx.arc(5, -8 - hop, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#d2c4b2';
      ctx.beginPath();
      ctx.ellipse(-1, -15 - hop, 2.5, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(7, -9 - hop, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-8, -4 - hop, 2.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'deer') {
      const legWalk = isMoving ? Math.sin(this.animTime * 8) * 4 : 0;

      ctx.fillStyle = 'rgba(8, 12, 18, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 6, 16, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-8, -2);
      ctx.lineTo(-9 + legWalk, 6);
      ctx.moveTo(-5, -2);
      ctx.lineTo(-4 - legWalk, 6);
      ctx.moveTo(8, -2);
      ctx.lineTo(9 - legWalk, 6);
      ctx.moveTo(11, -2);
      ctx.lineTo(10 + legWalk, 6);
      ctx.stroke();

      ctx.fillStyle = '#8d4e28';
      ctx.beginPath();
      ctx.ellipse(0, -6, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff4e6';
      for (const spot of [[-4, -9], [0, -10], [4, -9]]) {
        ctx.beginPath();
        ctx.arc(spot[0], spot[1], 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#7a3e1f';
      ctx.beginPath();
      ctx.moveTo(8, -8);
      ctx.lineTo(14, -18);
      ctx.lineTo(19, -16);
      ctx.lineTo(13, -4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, -18);
      ctx.lineTo(16, -26);
      ctx.lineTo(12, -29);
      ctx.moveTo(16, -24);
      ctx.lineTo(20, -28);
      ctx.stroke();

      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(17, -16, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    if (this.hp < this.maxHp) {
      const w = 24;
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - w / 2, sy - this.radius - 20, w, 3);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(sx - w / 2, sy - this.radius - 20, w * (this.hp / this.maxHp), 3);
    }
  }
}

// 敵モンスター
export class Enemy {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.hp = type === 'wolf' ? 35 : 45;
    this.maxHp = this.hp;
    this.radius = type === 'wolf' ? 16 : 17;
    this.speed = type === 'wolf' ? 88 : 58;
    this.damage = type === 'wolf' ? 12 : 16;
    this.attackCooldown = 0;
    this.attackRange = 34;
    this.hitShake = 0;
    this.facing = 1;
    this.animTime = Math.random() * 10;
  }

  update(dt, player, buildings, world) {
    this.animTime += dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.hitShake > 0) this.hitShake -= dt * 12;

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    let avoidFireX = 0;
    let avoidFireY = 0;
    for (let i = 0; i < buildings.length; i++) {
      const b = buildings[i];
      if (b.type === 'campfire') {
        const d = Math.hypot(this.x - b.x, this.y - b.y);
        if (d < 130 && d > 0) {
          const repel = (130 - d) / 130;
          avoidFireX += ((this.x - b.x) / d) * repel * 65;
          avoidFireY += ((this.y - b.y) / d) * repel * 65;
        }
      }
    }

    if (distToPlayer < 380) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      let vx = Math.cos(angle) * this.speed + avoidFireX;
      let vy = Math.sin(angle) * this.speed + avoidFireY;

      if (Math.abs(vx) > 5) {
        this.facing = vx > 0 ? 1 : -1;
      }

      let nextX = this.x + vx * dt;
      let nextY = this.y + vy * dt;

      let blocked = false;
      for (let i = 0; i < buildings.length; i++) {
        const b = buildings[i];
        if (b.type === 'wall' || (b.type === 'door' && !b.isOpen)) {
          if (Math.hypot(nextX - b.x, nextY - b.y) < this.radius + b.radius) {
            blocked = true;
            if (this.attackCooldown <= 0) {
              b.hp -= this.damage;
              this.attackCooldown = 1.1;
            }
            break;
          }
        }
      }

      if (!blocked && world.resources) {
        for (let i = 0; i < world.resources.length; i++) {
          const res = world.resources[i];
          if (res.hp <= 0) continue;
          if (res.type === 'tree' || res.type === 'rock' || res.type === 'iron_rock') {
            const resRadius = res.type === 'tree' ? 16 : 18;
            if (Math.hypot(nextX - res.x, nextY - res.y) < this.radius + resRadius) {
              blocked = true;
              break;
            }
          }
        }
      }

      if (!blocked && world.isWalkable(nextX, nextY)) {
        this.x = nextX;
        this.y = nextY;
      }

      if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
        player.takeDamage(this.damage, this.type === 'wolf' ? '凶暴なオオカミ' : '夜のゾンビ');
        this.attackCooldown = 1.1;
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x + (this.hitShake > 0 ? (Math.random() - 0.5) * 6 : 0);
    const sy = (this.y * PITCH_RATIO) - camera.y;

    // 画面外カリング
    if (sx < -30 || sx > camera.width + 30 || sy < -40 || sy > camera.height + 30) {
      return;
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(this.facing, 1);

    ctx.fillStyle = 'rgba(8, 12, 20, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 6, this.radius * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'zombie') {
      const wobble = Math.sin(this.animTime * 4) * 3;
      const armSwing = Math.sin(this.animTime * 4) * 4;

      ctx.fillStyle = '#2e4a36';
      ctx.beginPath();
      ctx.roundRect(-8, -18 + wobble, 16, 18, 3);
      ctx.fill();

      ctx.fillStyle = '#37474f';
      ctx.fillRect(-7, -16 + wobble, 14, 10);

      ctx.fillStyle = '#263238';
      ctx.fillRect(-6, 0 + wobble, 5, 8);
      ctx.fillRect(1, 0 - wobble, 5, 8);

      ctx.fillStyle = '#3d6346';
      ctx.fillRect(6, -14 + wobble + armSwing, 12, 4);

      ctx.fillStyle = '#3d6346';
      ctx.beginPath();
      ctx.arc(0, -23 + wobble, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(3, -23 + wobble, 1.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'wolf') {
      const legRun = Math.sin(this.animTime * 12) * 5;

      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, -4);
      ctx.lineTo(-12 + legRun, 5);
      ctx.moveTo(-6, -4);
      ctx.lineTo(-4 - legRun, 5);
      ctx.moveTo(8, -4);
      ctx.lineTo(6 - legRun, 5);
      ctx.moveTo(12, -4);
      ctx.lineTo(14 + legRun, 5);
      ctx.stroke();

      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.ellipse(0, -6, 15, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.moveTo(8, -10);
      ctx.lineTo(16, -16);
      ctx.lineTo(21, -9);
      ctx.lineTo(12, -2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(18, -8);
      ctx.lineTo(19, -4);
      ctx.lineTo(20, -8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffd600';
      ctx.beginPath();
      ctx.arc(17, -12, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-13, -8);
      ctx.quadraticCurveTo(-18, -2, -16, 3);
      ctx.stroke();
    }

    ctx.restore();

    if (this.hp < this.maxHp) {
      const w = 30;
      const h = 4;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(sx - w / 2, sy - this.radius - 24, w, h);
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(sx - w / 2, sy - this.radius - 24, w * pct, h);
    }
  }
}

// パーティクル
export class Particle {
  constructor(x, y, vx, vy, color, life, size = 3) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size;
  }

  update(dt) {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.96;
    this.vy += 45 * dt;
  }

  render(ctx, camera) {
    if (this.life <= 0) return;
    const sx = this.x - camera.x;
    const sy = (this.y * PITCH_RATIO) - camera.y;

    if (sx < 0 || sx > camera.width || sy < 0 || sy > camera.height) return;

    ctx.fillStyle = this.color;
    ctx.fillRect(sx, sy, this.size, this.size);
  }
}

// ダメージポップアップ
export class PopupText {
  constructor(text, x, y, color = '#fff') {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 0.85;
    this.maxLife = 0.85;
    this.vy = -35;
  }

  update(dt) {
    this.life -= dt;
    this.y += this.vy * dt;
    this.vy *= 0.92;
  }

  render(ctx, camera) {
    if (this.life <= 0) return;
    const sx = this.x - camera.x;
    const sy = (this.y * PITCH_RATIO) - camera.y - 20;

    if (sx < 0 || sx > camera.width || sy < 0 || sy > camera.height) return;

    ctx.save();
    ctx.font = '900 13px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000';
    ctx.strokeText(this.text, sx, sy);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, sx, sy);
    ctx.restore();
  }
}
