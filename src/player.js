// 三人称（2.5D クォータービュー / 背後・斜め追従）プレイヤーレンダリング

import { ITEMS } from './items.js';
import { sound } from './audio.js';
import { DroppedItem, Particle, PopupText } from './entities.js';
import { PITCH_RATIO } from './world.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 16;
    this.baseSpeed = 135;
    this.sprintSpeed = 210;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0; // マウス方向の角度

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

    // インベントリ
    this.inventory = new Array(24).fill(null);
    this.selectedSlot = 0;

    this.addItem('stick', 2);
    this.addItem('berry', 3);

    // アニメーション
    this.isAttacking = false;
    this.swingProgress = 0;
    this.attackCooldown = 0;
    this.walkAnimTime = 0;
    this.isMoving = false;
    this.facing = 1; // 1: 右向き, -1: 左向き
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

    if (input.moveDx !== undefined && input.moveDy !== undefined && (input.moveDx !== 0 || input.moveDy !== 0)) {
      dx = input.moveDx;
      dy = input.moveDy;
    } else {
      if (input.keys['KeyW'] || input.keys['ArrowUp']) dy -= 1;
      if (input.keys['KeyS'] || input.keys['ArrowDown']) dy += 1;
      if (input.keys['KeyA'] || input.keys['ArrowLeft']) dx -= 1;
      if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;
    }

    this.isMoving = dx !== 0 || dy !== 0;
    const isSprinting = input.keys['ShiftLeft'] || input.keys['ShiftRight'] || !!input.isSprinting;

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

      const inWater = world.isWater(Math.floor(this.x / 52), Math.floor(this.y / 52));
      const speedMult = inWater ? 0.6 : 1.0;

      const stepX = dx * currentSpeed * speedMult * dt;
      const stepY = dy * currentSpeed * speedMult * dt;

      // 移動を適用
      const prevX = this.x;
      const prevY = this.y;

      if (world.isWalkable(this.x + stepX, this.y)) {
        this.x += stepX;
      }
      if (world.isWalkable(this.x, this.y + stepY)) {
        this.y += stepY;
      }

      // 木・石（岩・鉄鉱脈）などの自然オブジェクトの当たり判定と押し出し解決
      if (world && world.resources) {
        for (let iter = 0; iter < 3; iter++) {
          for (let i = 0; i < world.resources.length; i++) {
            const res = world.resources[i];
            if (res.hp <= 0) continue;
            if (res.type === 'tree' || res.type === 'rock' || res.type === 'iron_rock') {
              const resRadius = res.type === 'tree' ? 24 : (res.type === 'iron_rock' ? 24 : 22);
              const totalRadius = this.radius + resRadius;
              const distX = this.x - res.x;
              const distY = this.y - res.y;
              const dist = Math.hypot(distX, distY);

              if (dist < totalRadius && dist > 0.0001) {
                const push = totalRadius - dist;
                this.x += (distX / dist) * push;
                this.y += (distY / dist) * push;
              }
            }
          }
        }
      }

      // 建築物（壁・閉じた扉）の当たり判定と押し出し解決
      if (buildings) {
        for (let iter = 0; iter < 3; iter++) {
          for (let i = 0; i < buildings.length; i++) {
            const b = buildings[i];
            if (b.type === 'wall' || (b.type === 'door' && !b.isOpen)) {
              const totalRadius = this.radius + b.radius;
              const distX = this.x - b.x;
              const distY = this.y - b.y;
              const dist = Math.hypot(distX, distY);

              if (dist < totalRadius && dist > 0.0001) {
                const push = totalRadius - dist;
                this.x += (distX / dist) * push;
                this.y += (distY / dist) * push;
              }
            }
          }
        }
      }

      // マップ外周境界チェック
      const mapPadding = 30;
      const maxBound = (world.width || 60) * 52 - mapPadding;
      this.x = Math.max(mapPadding, Math.min(maxBound, this.x));
      this.y = Math.max(mapPadding, Math.min(maxBound, this.y));

      // マウス非操作時または移動中は移動方向に自然に向く
      if (input.isTouchActive || !input.hasMouseMoved) {
        this.angle = Math.atan2(dy, dx);
      }
    }

    if (!input.isTouchActive && input.hasMouseMoved && input.mouseWorldAngle !== undefined) {
      this.angle = input.mouseWorldAngle;
    }
    this.facing = Math.cos(this.angle) >= 0 ? 1 : -1;

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

    this.hunger = Math.max(0, this.hunger - (100 / 480) * dt);
    this.thirst = Math.max(0, this.thirst - (100 / 360) * dt);

    if (this.hunger <= 0 || this.thirst <= 0) {
      this.takeDamage(2.5 * dt, this.hunger <= 0 ? '飢餓' : '脱水症状');
    } else if (this.hunger > 75 && this.thirst > 75 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + 2.0 * dt);
    }

    const tileUnder = world.getTile(Math.floor(this.x / 52), Math.floor(this.y / 52));
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

    const reach = 52;
    const hitX = this.x + Math.cos(this.angle) * reach;
    const hitY = this.y + Math.sin(this.angle) * reach;

    for (let i = entities.enemies.length - 1; i >= 0; i--) {
      const e = entities.enemies[i];
      if (Math.hypot(hitX - e.x, hitY - e.y) < e.radius + 20) {
        const dmg = itemDef ? itemDef.damage || 6 : 6;
        e.hp -= dmg;
        e.hitShake = 1.0;
        sound.hitEnemy();
        popups.push(new PopupText(`-${dmg}`, e.x, e.y, '#ff1744'));

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

    for (let i = entities.animals.length - 1; i >= 0; i--) {
      const a = entities.animals[i];
      if (Math.hypot(hitX - a.x, hitY - a.y) < a.radius + 20) {
        const dmg = itemDef ? itemDef.damage || 6 : 6;
        a.hp -= dmg;
        a.fleeTimer = 3.0;
        sound.hitEnemy();
        popups.push(new PopupText(`-${dmg}`, a.x, a.y, '#ff5252'));

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
            popups.push(new PopupText('+ベリー', res.x, res.y, '#66bb6a'));
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
      popups.push(new PopupText(`+${itemDef.hungerRestore} 満腹度`, this.x, this.y, '#ffa726'));
      this.removeItem(this.selectedSlot, 1);
    } else if (itemDef.type === 'medical') {
      if (this.hp >= this.maxHp) return;
      this.hp = Math.min(this.maxHp, this.hp + itemDef.healthRestore);
      sound.eat();
      popups.push(new PopupText(`+${itemDef.healthRestore} HP`, this.x, this.y, '#66bb6a'));
      this.removeItem(this.selectedSlot, 1);
    }
  }

  // 三人称視点でのキャラクター描画（背中・正面・横顔が見える立体モデル）
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const groundSy = (this.y * PITCH_RATIO) - camera.y;

    // 接地影
    ctx.fillStyle = 'rgba(8, 12, 20, 0.38)';
    ctx.beginPath();
    ctx.ellipse(sx, groundSy + 4, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    const bob = this.isMoving ? Math.sin(this.walkAnimTime) * 3 : 0;
    const footSwing = this.isMoving ? Math.sin(this.walkAnimTime) * 7 : 0;

    // 向いている方向（上下左右）の判定
    // sin(angle) < -0.3 : 奥（背中が見える）
    // sin(angle) > 0.3  : 手前（正面が見える）
    // それ以外          : 横顔
    const isBackView = Math.sin(this.angle) < -0.25;

    ctx.save();
    ctx.translate(sx, groundSy - 14 + bob);
    ctx.scale(this.facing, 1);

    // 脚・ブーツ（2本）
    ctx.fillStyle = '#212121';
    ctx.fillRect(-6, 8 + footSwing, 5, 8);
    ctx.fillRect(1, 8 - footSwing, 5, 8);

    // 胴体（冒険者ジャケット）
    const bodyGrad = ctx.createLinearGradient(-10, -10, 10, 10);
    bodyGrad.addColorStop(0, '#1e88e5');
    bodyGrad.addColorStop(1, '#1565c0');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.roundRect(-8, -10, 16, 18, 4);
    ctx.fill();

    if (isBackView) {
      // 背面（三人称背後カメラ）：バックパックが大きく見える
      ctx.fillStyle = '#4e342e';
      ctx.beginPath();
      ctx.roundRect(-6, -8, 12, 14, 3);
      ctx.fill();
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(-2, -4, 4, 3); // バックル
    } else {
      // 正面・側面：ベルトと服の合わせ
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(-8, 3, 16, 4); // ベルト
      ctx.fillStyle = '#ffb300';
      ctx.fillRect(-2, 3, 4, 4);
    }

    // 頭部
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, -17, 8, 0, Math.PI * 2);
    ctx.fill();

    if (isBackView) {
      // 後頭部・髪全体
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(0, -17, 8.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 顔（目と前髪）
      ctx.fillStyle = '#3e2723';
      ctx.beginPath();
      ctx.arc(0, -19, 8.5, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();

      // 目
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(3, -16, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // スイングアニメーション
    const held = this.getHeldItem();
    let swingAngle = 0;
    if (this.isAttacking) {
      swingAngle = (Math.sin(this.swingProgress * Math.PI) * 1.8) - 0.6;
    }

    // 手と武器
    ctx.save();
    ctx.translate(6, -4);
    ctx.rotate(swingAngle);

    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    if (held) {
      this.renderEquippedTool(ctx, held.id);
    }
    ctx.restore();

    ctx.restore();

    // 斬撃軌跡（三人称アーク）
    if (this.isAttacking && this.swingProgress > 0.1 && this.swingProgress < 0.9) {
      ctx.save();
      ctx.translate(sx, groundSy - 14);
      ctx.scale(this.facing, 1);
      ctx.rotate(swingAngle);

      const slashGrad = ctx.createLinearGradient(12, -20, 45, 20);
      slashGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      slashGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)');
      slashGrad.addColorStop(1, 'rgba(100, 200, 255, 0.9)');

      ctx.strokeStyle = slashGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 34, -0.7, 0.7);
      ctx.stroke();

      ctx.restore();
    }
  }

  renderEquippedTool(ctx, id) {
    if (id === 'iron_sword' || id === 'wooden_sword') {
      const isIron = id === 'iron_sword';
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(0, -2, 6, 4);
      ctx.fillStyle = isIron ? '#ffb300' : '#8d6e63';
      ctx.fillRect(5, -6, 3, 12);

      const bladeGrad = ctx.createLinearGradient(8, -4, 28, 4);
      bladeGrad.addColorStop(0, isIron ? '#eceff1' : '#bcaaa4');
      bladeGrad.addColorStop(0.5, isIron ? '#cfd8dc' : '#8d6e63');
      bladeGrad.addColorStop(1, isIron ? '#90a4ae' : '#5d4037');
      ctx.fillStyle = bladeGrad;
      ctx.beginPath();
      ctx.moveTo(8, -3);
      ctx.lineTo(26, -2);
      ctx.lineTo(32, 0);
      ctx.lineTo(26, 2);
      ctx.lineTo(8, 3);
      ctx.closePath();
      ctx.fill();
    } else if (id.includes('axe')) {
      const isStone = id === 'stone_axe';
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(0, -2, 22, 4);
      ctx.fillStyle = isStone ? '#607d8b' : '#8d6e63';
      ctx.beginPath();
      ctx.moveTo(16, -2);
      ctx.lineTo(12, -9);
      ctx.quadraticCurveTo(18, -12, 24, -9);
      ctx.lineTo(20, -2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isStone ? '#b0bec5' : '#d7ccc8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (id.includes('pickaxe')) {
      const isStone = id === 'stone_pickaxe';
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(0, -2, 22, 4);
      ctx.fillStyle = isStone ? '#546e7a' : '#8d6e63';
      ctx.beginPath();
      ctx.moveTo(18, -11);
      ctx.quadraticCurveTo(17, 0, 18, 11);
      ctx.lineTo(21, 10);
      ctx.quadraticCurveTo(20, 0, 21, -10);
      ctx.closePath();
      ctx.fill();
    } else if (id === 'torch') {
      ctx.fillStyle = '#4e342e';
      ctx.fillRect(0, -2, 18, 4);
      ctx.fillStyle = '#ff5722';
      ctx.beginPath();
      ctx.arc(20, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(20, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const def = ITEMS[id];
      if (def) {
        ctx.font = '16px serif';
        ctx.fillText(def.icon, 10, 4);
      }
    }
  }
}
