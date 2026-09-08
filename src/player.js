// プレイヤーの挙動、ステータス、インベントリ、アクション、レンダリング

import { ITEMS } from './items.js';
import { sound } from './audio.js';
import { DroppedItem, Particle, PopupText } from './entities.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.baseSpeed = 135;
    this.sprintSpeed = 205;
    this.vx = 0;
    this.vy = 0;
    this.angle = 0; // マウス方向の向き

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

    // 初期アイテム（サバイバル開始時の救済支給）
    this.addItem('stick', 2);
    this.addItem('berry', 3);

    // アクション・アニメーション
    this.isAttacking = false;
    this.attackAngle = 0;
    this.swingProgress = 0; // 0.0 ~ 1.0
    this.attackCooldown = 0;
  }

  // ホットバーで現在手に持っているアイテム
  getHeldItem() {
    return this.inventory[this.selectedSlot];
  }

  // アイテムの追加
  addItem(itemId, count = 1, durability = null) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return 0;

    let remaining = count;

    // スタック可能な既存スロットを探す
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

    // 空きスロットを探す
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

    // 入り切らなかった個数を差し引いて返却
    return count - remaining;
  }

  // スロットからアイテム消費
  removeItem(slotIdx, count = 1) {
    const slot = this.inventory[slotIdx];
    if (!slot) return;
    slot.count -= count;
    if (slot.count <= 0) {
      this.inventory[slotIdx] = null;
    }
  }

  // 素材の所持チェック
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

  // 素材の消費
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

  // 耐久値減少
  reduceHeldItemDurability() {
    const held = this.getHeldItem();
    if (held && held.durability !== null) {
      held.durability -= 1;
      if (held.durability <= 0) {
        this.inventory[this.selectedSlot] = null;
        sound.playNoise(0.2, 0.3, 2000); // 破壊音
      }
    }
  }

  // ダメージを受ける
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

  // 更新処理
  update(dt, input, world, buildings) {
    if (this.isDead) return;

    // 移動キー入力処理
    let dx = 0;
    let dy = 0;
    if (input.keys['KeyW'] || input.keys['ArrowUp']) dy -= 1;
    if (input.keys['KeyS'] || input.keys['ArrowDown']) dy += 1;
    if (input.keys['KeyA'] || input.keys['ArrowLeft']) dx -= 1;
    if (input.keys['KeyD'] || input.keys['ArrowRight']) dx += 1;

    const isMoving = dx !== 0 || dy !== 0;
    const isSprinting = input.keys['ShiftLeft'] || input.keys['ShiftRight'];

    let currentSpeed = this.baseSpeed;
    if (isMoving && isSprinting && this.stamina > 5) {
      currentSpeed = this.sprintSpeed;
      this.stamina = Math.max(0, this.stamina - 15 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 20 * dt);
    }

    if (isMoving) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      const nextX = this.x + dx * currentSpeed * dt;
      const nextY = this.y + dy * currentSpeed * dt;

      // 建物（壁・閉じたドア）との衝突
      let blockedX = false;
      let blockedY = false;
      for (const b of buildings) {
        if (b.type === 'wall' || (b.type === 'door' && !b.isOpen)) {
          if (Math.hypot(nextX - b.x, this.y - b.y) < this.radius + b.radius) blockedX = true;
          if (Math.hypot(this.x - b.x, nextY - b.y) < this.radius + b.radius) blockedY = true;
        }
      }

      // 水泳速度減少
      const inWater = world.isWater(Math.floor(this.x / 40), Math.floor(this.y / 40));
      const speedMult = inWater ? 0.6 : 1.0;

      if (!blockedX && world.isWalkable(nextX, this.y)) {
        this.x += dx * currentSpeed * speedMult * dt;
      }
      if (!blockedY && world.isWalkable(this.x, nextY)) {
        this.y += dy * currentSpeed * speedMult * dt;
      }
    }

    // 向き（マウス位置）
    this.angle = input.mouseWorldAngle;

    // スイングアニメーション
    if (this.isAttacking) {
      this.swingProgress += dt * 7.5;
      if (this.swingProgress >= 1.0) {
        this.isAttacking = false;
        this.swingProgress = 0;
      }
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    // サバイバルバイタル自然減少
    this.hunger = Math.max(0, this.hunger - (100 / 480) * dt); // 8分で空腹0
    this.thirst = Math.max(0, this.thirst - (100 / 360) * dt); // 6分で渇き0

    // 空腹・渇きによる体力影響
    if (this.hunger <= 0 || this.thirst <= 0) {
      this.takeDamage(2.5 * dt, this.hunger <= 0 ? '飢餓' : '脱水症状');
    } else if (this.hunger > 75 && this.thirst > 75 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + 2.0 * dt); // 自然回復
    }

    // 水辺での給水チェック
    const tileUnder = world.getTile(Math.floor(this.x / 40), Math.floor(this.y / 40));
    if (tileUnder === 1 && input.justPressedWater) { // 淡水
      this.thirst = Math.min(this.maxThirst, this.thirst + 40);
      sound.drink();
      input.justPressedWater = false;
    }
  }

  // アクション（左クリック：攻撃・ツールスイング）
  performAttack(world, entities, popups, particles) {
    if (this.attackCooldown > 0 || this.isDead) return;

    this.isAttacking = true;
    this.swingProgress = 0;
    this.attackCooldown = 0.3;

    const held = this.getHeldItem();
    const itemDef = held ? ITEMS[held.id] : null;

    const reach = 46;
    const hitX = this.x + Math.cos(this.angle) * reach;
    const hitY = this.y + Math.sin(this.angle) * reach;

    // 1. 敵への攻撃判定
    for (let i = entities.enemies.length - 1; i >= 0; i--) {
      const e = entities.enemies[i];
      if (Math.hypot(hitX - e.x, hitY - e.y) < e.radius + 18) {
        const dmg = itemDef ? itemDef.damage || 5 : 5;
        e.hp -= dmg;
        e.hitShake = 1.0;
        sound.hitEnemy();
        popups.push(new PopupText(`-${dmg}`, e.x, e.y - 10, '#ff5252'));

        // ノックバック
        e.x += Math.cos(this.angle) * 16;
        e.y += Math.sin(this.angle) * 16;

        this.reduceHeldItemDurability();

        if (e.hp <= 0) {
          sound.enemyDefeat();
          // ドロップ
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

    // 2. 動物への攻撃判定
    for (let i = entities.animals.length - 1; i >= 0; i--) {
      const a = entities.animals[i];
      if (Math.hypot(hitX - a.x, hitY - a.y) < a.radius + 18) {
        const dmg = itemDef ? itemDef.damage || 5 : 5;
        a.hp -= dmg;
        a.fleeTimer = 3.0;
        sound.hitEnemy();
        popups.push(new PopupText(`-${dmg}`, a.x, a.y - 8, '#ff5252'));

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

    // 3. 自然資源ノードへの採掘・伐採判定
    for (let i = world.resources.length - 1; i >= 0; i--) {
      const res = world.resources[i];
      if (Math.hypot(hitX - res.x, hitY - res.y) < res.radius + 20) {
        let dmg = 2; // 素手
        if (res.type === 'tree') {
          dmg = itemDef && itemDef.toolType === 'axe' ? (itemDef.chopPower * 5) : 3;
          sound.hitWood();
          // 木くずパーティクル
          for (let p = 0; p < 4; p++) {
            particles.push(new Particle(hitX, hitY, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#8d6e63', 0.4));
          }
        } else if (res.type === 'rock' || res.type === 'iron_rock') {
          dmg = itemDef && itemDef.toolType === 'pickaxe' ? (itemDef.minePower * 5) : 2;
          sound.hitStone();
          // 石くずパーティクル
          for (let p = 0; p < 4; p++) {
            particles.push(new Particle(hitX, hitY, (Math.random() - 0.5) * 60, (Math.random() - 0.5) * 60, '#9e9e9e', 0.4));
          }
        } else if (res.type === 'berry_bush') {
          if (res.hasBerries) {
            res.hasBerries = false;
            sound.pickup();
            entities.droppedItems.push(new DroppedItem('berry', 2 + Math.floor(Math.random() * 2), res.x, res.y));
            entities.droppedItems.push(new DroppedItem('fiber', 1, res.x, res.y));
            popups.push(new PopupText('+ベリー', res.x, res.y - 12, '#81c784'));
          }
          return;
        }

        res.hp -= dmg;
        res.shake = 6;
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

    // 4. 空振り音
    sound.playNoise(0.04, 0.08, 1200);
  }

  // 使用（右クリック：飲食、薬品使用、または設置）
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
      popups.push(new PopupText(`+${itemDef.hungerRestore} 満腹度`, this.x, this.y - 12, '#ffb74d'));
      this.removeItem(this.selectedSlot, 1);
    } else if (itemDef.type === 'medical') {
      if (this.hp >= this.maxHp) return;
      this.hp = Math.min(this.maxHp, this.hp + itemDef.healthRestore);
      sound.eat();
      popups.push(new PopupText(`+${itemDef.healthRestore} HP`, this.x, this.y - 12, '#81c784'));
      this.removeItem(this.selectedSlot, 1);
    }
  }

  // プレイヤーの描画
  render(ctx, camera) {
    const sx = this.x - camera.x;
    const sy = this.y - camera.y;

    // 影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 6, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    // 体（探検家ルック）
    ctx.fillStyle = '#3949ab'; // 青い服
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // リュックサック
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(-this.radius - 2, -6, 6, 12);

    // 頭部
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(4, 0, 9, 0, Math.PI * 2);
    ctx.fill();

    // 髪 / 帽子
    ctx.fillStyle = '#8d6e63';
    ctx.beginPath();
    ctx.arc(2, 0, 9, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    // 武器・ツール描画 & スイング
    const held = this.getHeldItem();
    let swingOffset = 0;
    if (this.isAttacking) {
      swingOffset = (Math.sin(this.swingProgress * Math.PI) * 1.2) - 0.3;
    }

    ctx.save();
    ctx.translate(10, 10);
    ctx.rotate(swingOffset);

    // 手
    ctx.fillStyle = '#ffcc80';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // 手に持っているアイテムのアイコン
    if (held) {
      const def = ITEMS[held.id];
      if (def) {
        ctx.font = '16px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(def.icon, 8, -4);
      }
    }
    ctx.restore();

    ctx.restore();
  }
}
