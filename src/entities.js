// 現代的ゲームビジュアルのエンティティ描画（ウサギ、シカ、ゾンビ、オオカミ、建築物、パーティクル）

import { ITEMS } from './items.js';

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
    const floatY = Math.sin(this.floatTimer) * 5;
    const sy = (this.baseY - camera.y) + floatY;

    const itemDef = ITEMS[this.itemId];
    if (!itemDef) return;

    // 接地ソフトシャドウ（浮遊に合わせて伸縮）
    const shadowScale = 1 - (floatY + 5) / 30;
    ctx.fillStyle = `rgba(10, 15, 25, ${0.28 * shadowScale})`;
    ctx.beginPath();
    ctx.ellipse(sx, this.baseY - camera.y + 8, 10 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // アイテム背後のソフトグローサークル
    const glowGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 16);
    glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    glowGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sx, sy, 16, 0, Math.PI * 2);
    ctx.fill();

    // アイテムアイコン
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(itemDef.icon, sx, sy);

    // スタック個数バッジ
    if (this.count > 1) {
      ctx.fillStyle = '#1e232d';
      ctx.beginPath();
      ctx.roundRect(sx + 4, sy + 2, 18, 12, 3);
      ctx.fill();

      ctx.fillStyle = '#ffca28';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${this.count}`, sx + 13, sy + 8);
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
      // 焚き火の火の粉（上昇＆揺らぎ）
      if (Math.random() < 0.35) {
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * 12,
          this.y - 6,
          (Math.random() - 0.5) * 24,
          -Math.random() * 45 - 20,
          Math.random() < 0.5 ? '#ffb300' : '#ff5722',
          0.7,
          2.5
        ));
      }
      // 煙の微粒子
      if (Math.random() < 0.15) {
        particles.push(new Particle(
          this.x + (Math.random() - 0.5) * 8,
          this.y - 12,
          (Math.random() - 0.5) * 15,
          -Math.random() * 25 - 10,
          'rgba(180, 180, 190, 0.4)',
          1.2,
          4.0
        ));
      }
    }
  }

  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 影
    ctx.fillStyle = 'rgba(8, 12, 20, 0.35)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 10, 20, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'campfire') {
      // 焚き火の台座の石組み（円形に配置された石）
      ctx.fillStyle = '#546e7a';
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
        const stoneX = sx + Math.cos(a) * 14;
        const stoneY = sy + Math.sin(a) * 7 + 4;
        ctx.beginPath();
        ctx.ellipse(stoneX, stoneY, 4.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 薪の組み木（交差する角材）
      ctx.fillStyle = '#4e342e';
      ctx.save();
      ctx.translate(sx, sy + 2);
      ctx.rotate(0.5);
      ctx.fillRect(-12, -3, 24, 6);
      ctx.rotate(-1.0);
      ctx.fillRect(-12, -3, 24, 6);
      ctx.restore();

      // 赤熱した炭のコア（Glowing embers）
      ctx.fillStyle = '#ff3d00';
      ctx.beginPath();
      ctx.arc(sx, sy + 1, 7, 0, Math.PI * 2);
      ctx.fill();

      // 躍動する炎（マルチレイヤー）
      const fTime = this.animTime * 6;
      const flameOffX = Math.sin(fTime) * 3;
      const flameH = 16 + Math.sin(fTime * 1.5) * 5;

      // 外炎（深紅・オレンジ）
      ctx.fillStyle = '#ff6f00';
      ctx.beginPath();
      ctx.moveTo(sx - 9, sy + 3);
      ctx.quadraticCurveTo(sx - 10, sy - flameH * 0.5, sx + flameOffX, sy - flameH);
      ctx.quadraticCurveTo(sx + 10, sy - flameH * 0.5, sx + 9, sy + 3);
      ctx.closePath();
      ctx.fill();

      // 内炎（イエロー・ホワイト）
      ctx.fillStyle = '#fff59d';
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy + 2);
      ctx.quadraticCurveTo(sx - 5, sy - flameH * 0.4, sx + flameOffX * 0.7, sy - flameH * 0.75);
      ctx.quadraticCurveTo(sx + 5, sy - flameH * 0.4, sx + 5, sy + 2);
      ctx.closePath();
      ctx.fill();

    } else if (this.type === 'workbench') {
      // 頑丈な作業台（木目のテーブルトップと道具）
      // 天板
      const benchGrad = ctx.createLinearGradient(sx - 18, sy - 14, sx + 18, sy + 14);
      benchGrad.addColorStop(0, '#8d6e63');
      benchGrad.addColorStop(0.5, '#6d4c41');
      benchGrad.addColorStop(1, '#4e342e');
      ctx.fillStyle = benchGrad;
      ctx.beginPath();
      ctx.roundRect(sx - 18, sy - 14, 36, 26, 4);
      ctx.fill();

      // 縁取り
      ctx.strokeStyle = '#3e2723';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 金敷き / 万力 (Vise)
      ctx.fillStyle = '#37474f';
      ctx.fillRect(sx - 14, sy - 10, 8, 6);
      ctx.fillStyle = '#78909c';
      ctx.fillRect(sx - 12, sy - 8, 4, 2);

      // 設計図ロール
      ctx.fillStyle = '#fff9c4';
      ctx.fillRect(sx + 2, sy - 8, 11, 4);
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(sx + 3, sy - 1, 10, 3); // 鋸

    } else if (this.type === 'wall') {
      // 重厚な丸太防壁
      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.roundRect(sx - 18, sy - 18, 36, 36, 3);
      ctx.fill();

      // 縦の木材スリット
      ctx.fillStyle = '#795548';
      ctx.fillRect(sx - 16, sy - 16, 10, 32);
      ctx.fillRect(sx - 5, sy - 16, 10, 32);
      ctx.fillRect(sx + 6, sy - 16, 10, 32);

      // 鉄の補強帯
      ctx.fillStyle = '#37474f';
      ctx.fillRect(sx - 18, sy - 8, 36, 4);
      ctx.fillRect(sx - 18, sy + 6, 36, 4);

      // 鋲（リベット）
      ctx.fillStyle = '#cfd8dc';
      for (const rx of [-12, 0, 12]) {
        ctx.beginPath();
        ctx.arc(sx + rx, sy - 6, 1.5, 0, Math.PI * 2);
        ctx.arc(sx + rx, sy + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.type === 'door') {
      // ドア（開閉アニメーション付き）
      if (this.isOpen) {
        // 開いたドア
        ctx.fillStyle = 'rgba(40, 50, 60, 0.4)';
        ctx.fillRect(sx - 16, sy - 16, 32, 32);

        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.roundRect(sx - 18, sy - 18, 10, 36, 2);
        ctx.fill();
        ctx.fillStyle = '#ffd54f';
        ctx.fillRect(sx - 12, sy, 3, 3);
      } else {
        // 閉じたドア
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.roundRect(sx - 18, sy - 18, 36, 36, 3);
        ctx.fill();

        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - 14, sy - 14, 28, 28);

        // 金色のノブ
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.arc(sx + 8, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff8e1';
        ctx.beginPath();
        ctx.arc(sx + 7, sy - 1, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (this.type === 'chest') {
      // 豪華な木製チェスト
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.roundRect(sx - 16, sy - 12, 32, 24, 3);
      ctx.fill();

      // 金具枠
      ctx.strokeStyle = '#ffb300';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 16, sy - 12, 32, 24);

      // 中央の鍵穴金具
      ctx.fillStyle = '#ffc107';
      ctx.fillRect(sx - 4, sy - 4, 8, 9);
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(sx - 1, sy, 2, 3);

    } else if (this.type === 'torch') {
      // 松明
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(sx - 3, sy - 8, 6, 18);

      // 炎
      const fTime = this.animTime * 7;
      const fH = 10 + Math.sin(fTime) * 3;
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(sx, sy - 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(sx, sy - 9, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 耐久度バー
    if (this.hp < this.maxHp) {
      const w = 30;
      const h = 4;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(sx - w / 2, sy - 24, w, h);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(sx - w / 2, sy - 24, w * pct, h);
    }
  }
}

// 野生動物（絵文字を使わず、高品質ベクターアートで描画）
export class Animal {
  constructor(type, x, y) {
    this.type = type; // 'rabbit', 'deer'
    this.x = x;
    this.y = y;
    this.hp = type === 'deer' ? 30 : 12;
    this.maxHp = this.hp;
    this.radius = type === 'deer' ? 16 : 10;
    this.speed = type === 'deer' ? 70 : 90;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1: 右, -1: 左
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
    const isMoving = Math.hypot(this.vx, this.vy) > 8;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(this.facing, 1);

    if (this.type === 'rabbit') {
      // ウサギ（ホッピングアニメーション）
      const hop = isMoving ? Math.abs(Math.sin(this.animTime * 10)) * 6 : 0;

      // 影
      ctx.fillStyle = 'rgba(8, 12, 18, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 7, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 体
      ctx.fillStyle = '#e0d8cc';
      ctx.beginPath();
      ctx.ellipse(0, 1 - hop, 8, 6.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 白いお腹
      ctx.fillStyle = '#fbf9f5';
      ctx.beginPath();
      ctx.ellipse(2, 3 - hop, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // 頭
      ctx.fillStyle = '#e0d8cc';
      ctx.beginPath();
      ctx.arc(5, -3 - hop, 5, 0, Math.PI * 2);
      ctx.fill();

      // 耳（進行方向になびく）
      ctx.fillStyle = '#d2c4b2';
      ctx.beginPath();
      ctx.ellipse(-1, -10 - hop, 2.5, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8bbd0'; // 内側のピンク
      ctx.beginPath();
      ctx.ellipse(-1, -10 - hop, 1.2, 4.5, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // 目
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(7, -4 - hop, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // しっぽ
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-8, 1 - hop, 2.8, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'deer') {
      // シカ（しなやかな体、角、足の歩行アニメーション）
      const legWalk = isMoving ? Math.sin(this.animTime * 8) * 4 : 0;

      // 影
      ctx.fillStyle = 'rgba(8, 12, 18, 0.28)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // 脚（4本）
      ctx.strokeStyle = '#5d4037';
      ctx.lineWidth = 2.5;
      // 後ろ脚
      ctx.beginPath();
      ctx.moveTo(-8, 3);
      ctx.lineTo(-9 + legWalk, 12);
      ctx.moveTo(-5, 3);
      ctx.lineTo(-4 - legWalk, 12);
      // 前脚
      ctx.moveTo(8, 3);
      ctx.lineTo(9 - legWalk, 12);
      ctx.moveTo(11, 3);
      ctx.lineTo(10 + legWalk, 12);
      ctx.stroke();

      // 胴体（優美なカーブ）
      const bodyGrad = ctx.createLinearGradient(-12, -8, 12, 8);
      bodyGrad.addColorStop(0, '#a16538');
      bodyGrad.addColorStop(1, '#7a421f');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // 背中の白い斑点（バンビ風）
      ctx.fillStyle = '#fff4e6';
      for (const spot of [[-4, -3], [0, -4], [4, -3]]) {
        ctx.beginPath();
        ctx.arc(spot[0], spot[1], 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // 首と頭
      ctx.fillStyle = '#8d4e28';
      ctx.beginPath();
      ctx.moveTo(8, -2);
      ctx.lineTo(14, -12);
      ctx.lineTo(19, -10);
      ctx.lineTo(13, 2);
      ctx.closePath();
      ctx.fill();

      // 枝角 (Antlers)
      ctx.strokeStyle = '#4e342e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(15, -12);
      ctx.lineTo(16, -20);
      ctx.lineTo(12, -23);
      ctx.moveTo(16, -18);
      ctx.lineTo(20, -22);
      ctx.stroke();

      // 目
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(17, -10, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // HPゲージ
    if (this.hp < this.maxHp) {
      const w = 24;
      ctx.fillStyle = '#000';
      ctx.fillRect(sx - w / 2, sy - this.radius - 14, w, 3);
      ctx.fillStyle = '#4caf50';
      ctx.fillRect(sx - w / 2, sy - this.radius - 14, w * (this.hp / this.maxHp), 3);
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
    this.radius = type === 'wolf' ? 16 : 17;
    this.speed = type === 'wolf' ? 88 : 58;
    this.damage = type === 'wolf' ? 12 : 16;
    this.attackCooldown = 0;
    this.attackRange = 32;
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
    for (const b of buildings) {
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
      for (const b of buildings) {
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
    const sy = this.y - camera.y;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(this.facing, 1);

    // 影
    ctx.fillStyle = 'rgba(8, 12, 20, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 10, this.radius * 0.9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (this.type === 'zombie') {
      // ゾンビ（よろめき、破れた服、発光する赤い眼光）
      const wobble = Math.sin(this.animTime * 4) * 3;
      const armSwing = Math.sin(this.animTime * 4) * 4;

      // 腐敗した胴体
      ctx.fillStyle = '#2e4a36';
      ctx.beginPath();
      ctx.roundRect(-8, -10 + wobble, 16, 18, 3);
      ctx.fill();

      // ボロボロの青いシャツ
      ctx.fillStyle = '#37474f';
      ctx.fillRect(-7, -8 + wobble, 14, 10);

      // 脚
      ctx.fillStyle = '#263238';
      ctx.fillRect(-6, 8 + wobble, 5, 8);
      ctx.fillRect(1, 8 - wobble, 5, 8);

      // 前に突き出した腕（ゾンビポーズ）
      ctx.fillStyle = '#3d6346';
      ctx.fillRect(6, -6 + wobble + armSwing, 12, 4);

      // 頭部
      ctx.fillStyle = '#3d6346';
      ctx.beginPath();
      ctx.arc(0, -15 + wobble, 7, 0, Math.PI * 2);
      ctx.fill();

      // 発光する赤い眼（Glowing red eyes）
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.arc(3, -15 + wobble, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 目のグロー
      ctx.fillStyle = 'rgba(255, 23, 68, 0.4)';
      ctx.beginPath();
      ctx.arc(3, -15 + wobble, 4, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === 'wolf') {
      // オオカミ（疾走、逆立った毛並み、ギラつく黄色い目）
      const legRun = Math.sin(this.animTime * 12) * 5;

      // 脚
      ctx.strokeStyle = '#263238';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, 2);
      ctx.lineTo(-12 + legRun, 11);
      ctx.moveTo(-6, 2);
      ctx.lineTo(-4 - legRun, 11);
      ctx.moveTo(8, 2);
      ctx.lineTo(6 - legRun, 11);
      ctx.moveTo(12, 2);
      ctx.lineTo(14 + legRun, 11);
      ctx.stroke();

      // 胴体（獰猛な流線型）
      const wolfGrad = ctx.createLinearGradient(-14, -8, 14, 8);
      wolfGrad.addColorStop(0, '#455a64');
      wolfGrad.addColorStop(0.6, '#37474f');
      wolfGrad.addColorStop(1, '#212121');
      ctx.fillStyle = wolfGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 首と頭部
      ctx.fillStyle = '#37474f';
      ctx.beginPath();
      ctx.moveTo(8, -4);
      ctx.lineTo(16, -10);
      ctx.lineTo(21, -3);
      ctx.lineTo(12, 4);
      ctx.closePath();
      ctx.fill();

      // 尖った耳
      ctx.fillStyle = '#263238';
      ctx.beginPath();
      ctx.moveTo(13, -10);
      ctx.lineTo(15, -17);
      ctx.lineTo(17, -9);
      ctx.closePath();
      ctx.fill();

      // 牙
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(18, -2);
      ctx.lineTo(19, 2);
      ctx.lineTo(20, -2);
      ctx.closePath();
      ctx.fill();

      // ギラつく黄色の眼光
      ctx.fillStyle = '#ffd600';
      ctx.beginPath();
      ctx.arc(17, -6, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // 尾
      ctx.strokeStyle = '#37474f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-13, -2);
      ctx.quadraticCurveTo(-18, 4, -16, 9);
      ctx.stroke();
    }

    ctx.restore();

    // HPゲージ
    if (this.hp < this.maxHp) {
      const w = 30;
      const h = 4;
      const pct = Math.max(0, this.hp / this.maxHp);
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.beginPath();
      ctx.roundRect(sx - w / 2, sy - this.radius - 16, w, h, 2);
      ctx.fill();
      ctx.fillStyle = '#ff1744';
      ctx.beginPath();
      ctx.roundRect(sx - w / 2, sy - this.radius - 16, w * pct, h, 2);
      ctx.fill();
    }
  }
}

// パーティクル（破片、火花、煙、血痕、輝き）
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
    const sy = this.y - camera.y;

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(sx, sy, this.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ダメージポップアップ（ポップな浮遊とイージング）
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
    const sy = this.y - camera.y;

    ctx.save();
    const alpha = Math.min(1, (this.life / this.maxLife) * 1.5);
    ctx.globalAlpha = alpha;

    ctx.font = '900 14px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#000';
    ctx.strokeText(this.text, sx, sy);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, sx, sy);
    ctx.restore();
  }
}
