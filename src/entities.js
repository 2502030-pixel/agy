// ドロップアイテム、建築物、野生動物、敵モンスター、パーティクル、ポップアップ

import { ITEMS } from './items.js';
import { sound } from './audio.js';

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
    this.pickupDelay = 0.5; // 生成直後の拾いディレイ
  }

  update(dt, playerX, playerY) {
    this.floatTimer += dt * 3;
    if (this.pickupDelay > 0) {
      this.pickupDelay -= dt;
    }

    // プレイヤーへの吸い寄せ（マグネット）
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 80 && this.pickupDelay <= 0) {
      const speed = 260 * dt;
      this.x += (dx / dist) * speed;
      this.y += (dy / dist) * speed;
      this.baseY = this.y;
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = (this.baseY - camera.y) + Math.sin(this.floatTimer) * 4;

    const itemDef = ITEMS[this.itemId];
    if (!itemDef) return;

    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx, this.baseY - camera.y + 6, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // アイコン描画
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(itemDef.icon, sx, sy);

    if (this.count > 1) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 10px sans-serif';
      ctx.strokeText(`x${this.count}`, sx + 8, sy + 6);
      ctx.fillText(`x${this.count}`, sx + 8, sy + 6);
    }
  }
}

// 建築物・設置物
export class Building {
  constructor(type, x, y) {
    this.type = type; // 'campfire', 'workbench', 'wall', 'door', 'chest', 'torch'
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.isOpen = false; // ドア用
    this.chestItems = type === 'chest' ? new Array(18).fill(null) : null;
    this.hp = type === 'wall' ? 150 : (type === 'door' ? 100 : 50);
    this.maxHp = this.hp;
    this.fireTimer = 0;
  }

  update(dt, particles) {
    if (this.type === 'campfire' || this.type === 'torch') {
      this.fireTimer += dt;
      // 火の粉パーティクル
      if (Math.random() < 0.25) {
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * 8,
          this.y - 4,
          (Math.random() - 0.5) * 20,
          -Math.random() * 40 - 15,
          '#ff9800',
          0.6,
          2.5
        ));
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 8, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'campfire') {
      // 焚き火の薪
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(sx - 12, sy + 2, 24, 6);
      ctx.fillRect(sx - 6, sy - 4, 12, 18);

      // 炎の揺らぎ
      const flicker = Math.sin(performance.now() * 0.01) * 3;
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(sx, sy - 2 + flicker * 0.5, 9 + flicker, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(sx, sy - 2 + flicker * 0.5, 5 + flicker * 0.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'workbench') {
      // 作業台（木のテーブル）
      ctx.fillStyle = '#795548';
      ctx.fillRect(sx - 16, sy - 12, 32, 24);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(sx - 14, sy - 10, 28, 20);

      // のこぎり・工具の模様
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(sx - 8, sy - 6, 16, 4);
    } else if (this.type === 'wall') {
      // 木の防壁
      ctx.fillStyle = '#8d6e63';
      ctx.fillRect(sx - 16, sy - 16, 32, 32);
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 16, sy - 16, 32, 32);
      ctx.beginPath();
      ctx.moveTo(sx - 16, sy);
      ctx.lineTo(sx + 16, sy);
      ctx.stroke();
    } else if (this.type === 'door') {
      // 木のドア
      if (this.isOpen) {
        ctx.fillStyle = '#a1887f';
        ctx.fillRect(sx - 16, sy - 16, 8, 32);
      } else {
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(sx - 16, sy - 16, 32, 32);
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(sx + 8, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'chest') {
      // 木箱
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(sx - 14, sy - 10, 28, 20);
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 14, sy - 10, 28, 20);
      ctx.fillStyle = '#ffc107';
      ctx.fillRect(sx - 3, sy - 2, 6, 6);
    } else if (this.type === 'torch') {
      // 設置松明
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(sx - 2, sy - 8, 4, 16);
      ctx.fillStyle = '#ff9800';
      ctx.beginPath();
      ctx.arc(sx, sy - 9, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // HPゲージ
    if (this.hp < this.maxHp) {
      const w = 28;
      const h = 4;
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - w / 2, sy - 22, w, h);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(sx - w / 2, sy - 22, w * (this.hp / this.maxHp), h);
    }
  }
}

// 野生動物
export class Animal {
  constructor(type, x, y) {
    this.type = type; // 'rabbit', 'deer'
    this.x = x;
    this.y = y;
    this.hp = type === 'deer' ? 30 : 12;
    this.maxHp = this.hp;
    this.radius = type === 'deer' ? 14 : 9;
    this.speed = type === 'deer' ? 70 : 90;
    this.vx = 0;
    this.vy = 0;
    this.wanderTimer = Math.random() * 3;
    this.fleeTimer = 0;
  }

  update(dt, playerX, playerY, world) {
    const distToPlayer = Math.hypot(playerX - this.x, playerY - this.y);

    // プレイヤーが近づくとパニック逃走
    if (distToPlayer < 120) {
      this.fleeTimer = 2.0;
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

    const nextX = this.x + this.vx * dt;
    const nextY = this.y + this.vy * dt;

    if (world.isWalkable(nextX, nextY)) {
      this.x = nextX;
      this.y = nextY;
    } else {
      this.vx = -this.vx;
      this.vy = -this.vy;
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 4, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = this.type === 'deer' ? '22px sans-serif' : '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'deer' ? '🦌' : '🐇', sx, sy - 2);

    if (this.hp < this.maxHp) {
      const w = 24;
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - w / 2, sy - this.radius - 12, w, 3);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(sx - w / 2, sy - this.radius - 12, w * (this.hp / this.maxHp), 3);
    }
  }
}

// 敵モンスター（ゾンビ、オオカミ）
export class Enemy {
  constructor(type, x, y) {
    this.type = type; // 'zombie', 'wolf'
    this.x = x;
    this.y = y;
    this.hp = type === 'wolf' ? 35 : 45;
    this.maxHp = this.hp;
    this.radius = type === 'wolf' ? 14 : 15;
    this.speed = type === 'wolf' ? 85 : 55;
    this.damage = type === 'wolf' ? 12 : 16;
    this.attackCooldown = 0;
    this.attackRange = 30;
    this.hitShake = 0;
  }

  update(dt, player, buildings, world) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    if (this.hitShake > 0) {
      this.hitShake -= dt * 10;
    }

    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

    // 焚き火への警戒（火の近くには近寄りにくい）
    let avoidFireX = 0;
    let avoidFireY = 0;
    for (const b of buildings) {
      if (b.type === 'campfire') {
        const d = Math.hypot(this.x - b.x, this.y - b.y);
        if (d < 120 && d > 0) {
          const repel = (120 - d) / 120;
          avoidFireX += ((this.x - b.x) / d) * repel * 60;
          avoidFireY += ((this.y - b.y) / d) * repel * 60;
        }
      }
    }

    // プレイヤー追跡
    if (distToPlayer < 350) {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      let vx = Math.cos(angle) * this.speed + avoidFireX;
      let vy = Math.sin(angle) * this.speed + avoidFireY;

      // 壁との衝突判定
      let nextX = this.x + vx * dt;
      let nextY = this.y + vy * dt;

      // 建物への攻撃または回避
      let blocked = false;
      for (const b of buildings) {
        if (b.type === 'wall' || (b.type === 'door' && !b.isOpen)) {
          if (Math.hypot(nextX - b.x, nextY - b.y) < this.radius + b.radius) {
            blocked = true;
            // 壁を殴る
            if (this.attackCooldown <= 0) {
              b.hp -= this.damage;
              this.attackCooldown = 1.2;
              sound.hitWood();
            }
            break;
          }
        }
      }

      if (!blocked && world.isWalkable(nextX, nextY)) {
        this.x = nextX;
        this.y = nextY;
      }

      // プレイヤーへの攻撃
      if (distToPlayer <= this.attackRange && this.attackCooldown <= 0) {
        player.takeDamage(this.damage, 'モンスター');
        this.attackCooldown = 1.0;
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x + (this.hitShake > 0 ? (Math.random() - 0.5) * 6 : 0);
    const sy = this.y - camera.y;

    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 6, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = this.type === 'wolf' ? '24px sans-serif' : '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type === 'wolf' ? '🐺' : '🧟', sx, sy - 2);

    // HPゲージ
    if (this.hp < this.maxHp) {
      const w = 28;
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - w / 2, sy - this.radius - 14, w, 4);
      ctx.fillStyle = '#e53935';
      ctx.fillRect(sx - w / 2, sy - this.radius - 14, w * (this.hp / this.maxHp), 4);
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
    this.vy += 80 * dt; // 重力
  }

  render(ctx, camera) {
    if (this.life <= 0) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.fillRect(sx, sy, this.size, this.size);
    ctx.restore();
  }
}

// ダメージ数値・獲得アイテムポップアップ
export class PopupText {
  constructor(text, x, y, color = '#fff') {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.life = 0.8;
    this.maxLife = 0.8;
  }

  update(dt) {
    this.life -= dt;
    this.y -= 25 * dt;
  }

  render(ctx, camera) {
    if (this.life <= 0) return;
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(this.text, sx, sy);
    ctx.fillText(this.text, sx, sy);
    ctx.restore();
  }
}
