// プレイヤーの挙動、ステータス、インベントリ、アクション、および現代的なキャラクター・武器レンダリング

import { ITEMS } from './items.js';
import { sound } from './audio.js';
import { DroppedItem, Particle, PopupText } from './entities.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.baseSpeed = 135;
    this.sprintSpeed = 210;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0;

    // バイタル
    this.maxHp = 100;
    this.hp = 100;
    this.maxHunger = 100;
    this.hunger = 100;
    this.maxThirst = 100;
    this.thirst = 100;
    this.maxStamina = 100;
    this.stamina = 100;

    this.isDead = false;
    this.deathReason = '';

    // インベントリ (24枠、うち最初の8枠がホットバー)
    this.inventory = new Array(24).fill(null);
    this.selectedSlot = 0;

    // 初期アイテム
    this.addItem('stick', 2);
    this.addItem('berry', 3);

    // アニメーション用変数
    this.isAttacking = false;
    this.swingProgress = 0;
    this.attackCooldown = 0;
    this.walkAnimTime = 0;
    this.isMoving = false;
  }

  getHeldItem() {
    return this.inventory[this.selectedSlot];
  }

  addItem(itemId, count = 1, durability = null) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return 0;

    let remaining = count;

    if (itemDef.maxStack > 1) {
      for (let i = 0; i < this.inventory.length; i++) {
        const slot = this.inventory[i];
        if (slot && slot.id === itemId && slot.count < itemDef.maxStack) {
          const canAdd = itemDef.maxStack - slot.count;
          const toAdd = Math.min(canAdd, remaining);
          slot.count += toAdd;
          remaining -= toAdd;
          if (remaining <= 0) return count;
        }
      }
    }

    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        const toAdd = Math.min(itemDef.maxStack, remaining);
        this.inventory[i] = {
          id: itemId,
          count: toAdd,
          durability: durability !== null ? durability : itemDef.maxDurability || null
        };
        remaining -= toAdd;
        if (remaining <= 0) return count;
      }
    }

    return count - remaining;
  }

  removeItem(slotIdx, count = 1) {
    const slot = this.inventory[slotIdx];
    if (!slot) return;
    slot.count -= count;
    if (slot.count <= 0) {
      this.inventory[slotIdx] = null;
    }
  }

  hasIngredients(ingredients) {
    for (const req of ingredients) {
      let total = 0;
      for (const slot of this.inventory) {
        if (slot && slot.id === req.id) {
          total += slot.count;
        }
      }
      if (total < req.count) return false;
    }
    return true;
  }

  consumeIngredients(ingredients) {
    for (const req of ingredients) {
      let needed = req.count;
      for (let i = 0; i < this.inventory.length; i++) {
        const slot = this.inventory[i];
        if (slot && slot.id === req.id) {
          const take = Math.min(slot.count, needed);
          slot.count -= take;
          needed -= take;
          if (slot.count <= 0) {
            this.inventory[i] = null;
          }
          if (needed <= 0) break;
        }
      }
    }
  }

  reduceHeldItemDurability() {
    const held = this.getHeldItem();
    if (held && held.durability !== null) {
      held.durability -= 1;
      if (held.durability <= 0) {
        this.inventory[this.selectedSlot] = null;
        sound.playNoise(0.2, 0.3, 2000);
      }
    }
  }

  takeDamage(amount, source = '野生の脅威') {
    if (this.isDead) return;
    this.hp -= amount;
    sound.playerHurt();
    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.deathReason = `${source}により力尽きた`;
      sound.gameOver();
    }
  }

  update(dt, input, world, buildings) {
    if (this.isDead) return;

    let dx = 0;
    let dy = 0;
    if (input.keys['KeyW'] || input.keys['ArrowUp']) dy -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) dy += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) dx -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

    this.isMoving = dx !== 0 || dy !== 0;
    const isSprinting = input.keys['ShiftLeft'] || input.keys['ShiftRight'];

    let currentSpeed = this.baseSpeed;
    if (this.isMoving && isSprinting && this.stamina > 5) {
      currentSpeed = this.sprintSpeed;
      this.stamina = Math.max(0, this.stamina - 15 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    }

    if (this.isMoving) {
      this.walkAnimTime += dt * (isSprinting ? 14 : 9);

      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      const nextX = this.x + dx * currentSpeed * dt;
      const nextY = this.y + dy * currentSpeed * dt;

      let blockedX = false;
      let blockedY = false;
      for (const b of buildings) {
        if (b.type === 'wall' || (b.type === 'door' && !b.isOpen)) {
          if (Math.hypot(nextX - b.x, this.y - b.y) < this.radius + b.radius) blockedX = true;
          if (Math.hypot(this.x - b.x, nextY - b.y) < this.radius + b.radius) blockedY = true;
        }
      }

      const inWater = world.isWater(Math.floor(this.x / 48), Math.floor(this.y / 48));
      const speedMult = inWater ? 0.6 : 1.0;

      if (!blockedX && world.isWalkable(nextX, this.y)) {
        this.x += dx * currentSpeed * speedMult * dt;
      }
      if (!blockedY && world.isWalkable(this.x, nextY)) {
        this.y += dy * currentSpeed * speedMult * dt;
      }
    }

    this.angle = input.mouseWorldAngle;

    if (this.isAttacking) {
      this.swingProgress += dt * 8.0;
      if (this.swingProgress >= 1.0) {
        this.isAttacking = false;
        this.swingProgress = 0;
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // バイタル減少
    this.hunger = Math.max(0, this.hunger - (100 / 480) * dt);
    this.thirst = Math.max(0, this.thirst - (100 / 360) * dt);

    if (this.hunger <= 0 || this.thirst <= 0) {
      this.takeDamage(2.5 * dt, this.hunger <= 0 ? '飢餓' : '脱水症状');
    } else if (this.hunger > 75 && this.thirst > 75 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + 2.0 * dt);
    }

    const tileUnder = world.getTile(Math.floor(this.x / 48), Math.floor(this.y / 48));
    if (tileUnder === 1 && input.justPressedWater) {
      this.thirst = Math.min(this.maxThirst, this.thirst + 40);
      sound.drink();
      input.justPressedWater = false;
    }
  }

  performAttack(world, entities, popups, particles) {
    if (this.attackCooldown > 0 || this.isDead) return;

    this.isAttacking = true;
    this.swingProgress = 0;
    this.attackCooldown = 0.28;

    const held = this.getHeldItem();
    const itemDef = held ? ITEMS[held.id] : null;

    const reach = 50;
    const hitX = this.x + Math.cos(this.angle) * reach;
    const hitY = this.y + Math.sin(this.angle) * reach;

    // 1. 敵への攻撃
    for (let i = entities.enemies.length - 1; i >= 0; i--) {
      const e = entities.enemies[i];
      if (Math.hypot(hitX - e.x, hitY - e.y) < e.radius + 20) {
        const dmg = itemDef ? itemDef.damage || 6 : 6;
        e.hp -= dmg;
        e.hitShake = 1.0;
        sound.hitEnemy();
        popups.push(new PopupText(`-${dmg}`, e.x, e.y - 12, '#ff1744'));

        // クリティカル・血痕パーティクル
        for (let p = 0; p < 5; p++) {
          particles.push(new Particle(e.x, e.y, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, '#c62828', 0.4, 3));
        }

        e.x += Math.cos(this.angle) * 18;
        e.y += Math.sin(this.angle) * 18;
        this.reduceHeldItemDurability();

        if (e.hp <= 0) {
          sound.enemyDefeat();
          if (e.type === 'wolf') {
            entities.droppedItems.push(new DroppedItem('raw_meat', 2, e.x, e.y));
            entities.droppedItems.push(new DroppedItem('fiber', 2, e.x, e.y));
          } else {
            entities.droppedItems.push(new DroppedItem('iron_ore', 1, e.x, e.y));
            entities.droppedItems.push(new DroppedItem('fiber', 1, e.x, e.y));
          }
          entities.enemies.splice(i, 1);
        }
        return;
      }
    }

    // 2. 動物への攻撃
    for (let i = entities.animals.length - 1; i >= 0; i--) {
      const a = entities.animals[i];
      if (Math.hypot(hitX - a.x, hitY - a.y) < a.radius + 20) {
        const dmg = itemDef ? itemDef.damage || 6 : 6;
        a.hp -= dmg;
        a.fleeTimer = 3.0;
        sound.hitEnemy();
        popups.push(new PopupText(`-${dmg}`, a.x, a.y - 10, '#ff5252'));

        this.reduceHeldItemDurability();

        if (a.hp <= 0) {
          sound.pickup();
          if (a.type === 'deer') {
            entities.droppedItems.push(new DroppedItem('raw_meat', 2, a.x, a.y));
            entities.droppedItems.push(new DroppedItem('fiber', 2, a.x, a.y));
          } else {
            entities.droppedItems.push(new DroppedItem('raw_meat', 1, a.x, a.y));
          }
          entities.animals.splice(i, 1);
        }
        return;
      }
    }

    // 3. 資源ノードの採掘・伐採
    for (let i = world.resources.length - 1; i >= 0; i--) {
      const res = world.resources[i];
      if (Math.hypot(hitX - res.x, hitY - res.y) < res.radius + 22) {
        let dmg = 2;
        if (res.type === 'tree') {
          dmg = itemDef && itemDef.toolType === 'axe' ? (itemDef.chopPower * 5) : 3;
          sound.hitWood();
          for (let p = 0; p < 5; p++) {
            particles.push(new Particle(hitX, hitY, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, '#8d6e63', 0.45, 3.5));
          }
        } else if (res.type === 'rock' || res.type === 'iron_rock') {
          dmg = itemDef && itemDef.toolType === 'pickaxe' ? (itemDef.minePower * 5) : 2;
          sound.hitStone();
          for (let p = 0; p < 5; p++) {
            particles.push(new Particle(hitX, hitY, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80, '#9e9e9e', 0.45, 3.5));
          }
        } else if (res.type === 'berry_bush') {
          if (res.hasBerries) {
            res.hasBerries = false;
            sound.pickup();
            entities.droppedItems.push(new DroppedItem('berry', 2 + Math.floor(Math.random() * 2), res.x, res.y));
            entities.droppedItems.push(new DroppedItem('fiber', 1, res.x, res.y));
            popups.push(new PopupText('+ベリー', res.x, res.y - 14, '#66bb6a'));
          }
          return;
        }

        res.hp -= dmg;
        res.shake = 7;
        this.reduceHeldItemDurability();

        if (res.hp <= 0) {
          sound.breakResource();
          if (res.type === 'tree') {
            entities.droppedItems.push(new DroppedItem('wood', 3 + Math.floor(Math.random() * 3), res.x, res.y));
            entities.droppedItems.push(new DroppedItem('stick', 1 + Math.floor(Math.random() * 2), res.x, res.y));
          } else if (res.type === 'rock') {
            entities.droppedItems.push(new DroppedItem('stone', 3 + Math.floor(Math.random() * 3), res.x, res.y));
          } else if (res.type === 'iron_rock') {
            entities.droppedItems.push(new DroppedItem('iron_ore', 2 + Math.floor(Math.random() * 2), res.x, res.y));
            entities.droppedItems.push(new DroppedItem('stone', 1 + Math.floor(Math.random() * 2), res.x, res.y));
          }
          world.resources.splice(i, 1);
        }
        return;
      }
    }

    sound.playNoise(0.04, 0.08, 1200);
  }

  useHeldItem(world, entities, popups) {
    const held = this.getHeldItem();
    if (!held) return;
    const itemDef = ITEMS[held.id];
    if (!itemDef) return;

    if (itemDef.type === 'food') {
      this.hunger = Math.min(this.maxHunger, this.hunger + itemDef.hungerRestore);
      this.thirst = Math.min(this.maxThirst, this.thirst + (itemDef.thirstRestore || 0));
      this.hp = Math.min(this.maxHp, this.hp + (itemDef.healthRestore || 0));
      sound.eat();
      popups.push(new PopupText(`+${itemDef.hungerRestore} 満腹度`, this.x, this.y - 14, '#ffa726'));
      this.removeItem(this.selectedSlot, 1);
    } else if (itemDef.type === 'medical') {
      if (this.hp >= this.maxHp) return;
      this.hp = Math.min(this.maxHp, this.hp + itemDef.healthRestore);
      sound.eat();
      popups.push(new PopupText(`+${itemDef.healthRestore} HP`, this.x, this.y - 14, '#66bb6a'));
      this.removeItem(this.selectedSlot, 1);
    }
  }

  // 美麗なプレイヤーキャラクターと装備ツールの描画
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 接地影
    ctx.fillStyle = 'rgba(8, 12, 18, 0.38)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 8, 16, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // 歩行時のボビング＆足の動き
    const bob = this.isMoving ? Math.sin(this.walkAnimTime) * 2 : 0;
    const footSwing = this.isMoving ? Math.sin(this.walkAnimTime) * 6 : 0;

    // ブーツ（足）
    ctx.fillStyle = '#212121';
    // 左足
    ctx.beginPath();
    ctx.ellipse(-6, 9 + footSwing, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    // 右足
    ctx.beginPath();
    ctx.ellipse(-6, -9 - footSwing, 4.5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 胴体（冒険者ジャケット・ベルト）
    const bodyGrad = ctx.createLinearGradient(-12, -12, 12, 12);
    bodyGrad.addColorStop(0, '#1e88e5');
    bodyGrad.addColorStop(1, '#1565c0');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-10, -10 + bob, 20, 20, 6);
    ctx.fill();

    // レザーベルトとバックル
    ctx.fillStyle = '#4e342e';
    ctx.fillRect(-2, -10 + bob, 5, 20);
    ctx.fillStyle = '#ffb300';
    ctx.fillRect(-1, -2 + bob, 3, 4);

    // バックパック
    ctx.fillStyle = '#5d4037';
    ctx.beginPath();
    ctx.roundRect(-15, -7 + bob, 6, 14, 2);
    ctx.fill();

    // 頭部（サバイバーの髪・顔）
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(3, 0 + bob, 8, 0, Math.PI * 2);
    ctx.fill();

    // 髪 / バンダナ
    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(1, 0 + bob, 8.5, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();

    // スイングアニメーション角度
    const held = this.getHeldItem();
    let swingAngle = 0;
    if (this.isAttacking) {
      swingAngle = (Math.sin(this.swingProgress * Math.PI) * 1.5) - 0.5;
    }

    // 手と武器の描画
    ctx.save();
    ctx.translate(10, 8 + bob);
    ctx.rotate(swingAngle);

    // 手のひら
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // 装備ツールのベクター描画
    if (held) {
      this.renderEquippedTool(ctx, held.id);
    }
    ctx.restore();

    ctx.restore();

    // 攻撃時の斬撃エフェクト (Slash Trail Arc)
    if (this.isAttacking && this.swingProgress > 0.1 && this.swingProgress < 0.9) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(this.angle + swingAngle);

      const slashGrad = ctx.createLinearGradient(12, -20, 45, 20);
      slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      slashGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      slashGrad.addColorStop(1, 'rgba(100, 200, 255, 0.9)');

      ctx.strokeStyle = slashGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 36, -0.6, 0.6);
      ctx.stroke();

      ctx.restore();
    }
  }

  // 武器・ツールの高精細ベクター描画
  renderEquippedTool(ctx, id) {
    if (id === 'iron_sword' || id === 'wooden_sword') {
      const isIron = id === 'iron_sword';
      // 柄
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(0, -2, 6, 4);
      // 鍔 (Guard)
      ctx.fillStyle = isIron ? '#ffb300' : '#8d6e63';
      ctx.fillRect(5, -6, 3, 12);
      // 刀身 (Blade)
      const bladeGrad = ctx.createLinearGradient(8, -4, 28, 4);
      bladeGrad.addColorStop(0, isIron ? '#eceff1' : '#bcaaa4');
      bladeGrad.addColorStop(0.5, isIron ? '#cfd8dc' : '#8d6e63');
      bladeGrad.addColorStop(1, isIron ? '#90a4ae' : '#5d4037');
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(8, -3);
      ctx.lineTo(26, -2);
      ctx.lineTo(32, 0); // 剣先
      ctx.lineTo(26, 2);
      ctx.lineTo(8, 3);
      ctx.closePath();
      ctx.fill();
    } else if (id.includes('axe')) {
      const isStone = id === 'stone_axe';
      // 柄
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(0, -2, 22, 4);
      // 斧頭 (Axe Head)
      ctx.fillStyle = isStone ? '#607d8b' : '#8d6e63';
      ctx.beginPath();
      ctx.moveTo(16, -2);
      ctx.lineTo(12, -9);
      ctx.quadraticCurveTo(18, -12, 24, -9);
      ctx.lineTo(20, -2);
      ctx.closePath();
      ctx.fill();
      // 刃先ハイライト
      ctx.strokeStyle = isStone ? '#b0bec5' : '#d7ccc8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (id.includes('pickaxe')) {
      const isStone = id === 'stone_pickaxe';
      // 柄
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(0, -2, 22, 4);
      // ツルハシ頭 (Pickaxe Head)
      ctx.fillStyle = isStone ? '#546e7a' : '#8d6e63';
      ctx.beginPath();
      ctx.moveTo(18, -11);
      ctx.quadraticCurveTo(17, 0, 18, 11);
      ctx.lineTo(21, 10);
      ctx.quadraticCurveTo(20, 0, 21, -10);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'torch') {
      // 松明
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(0, -2, 18, 4);
      // 炎
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(20, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(20, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // その他はアイコンを小さく描画
      const def = ITEMS[id];
      if (def) {
        ctx.font = '16px serif';
        ctx.fillText(def.icon, 10, 4);
      }
    }
  }
}
