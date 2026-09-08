// 超高速化されたメインゲームループ、最適化ライティングバッファ、HUDスロットリング、三人称カメラ

import { World, TILE_SIZE, PITCH_RATIO } from './world.js';
import { Player } from './player.js';
import { Building, Animal, Enemy, DroppedItem, Particle, PopupText } from './entities.js';
import { ITEMS, RECIPES } from './items.js';
import { sound } from './audio.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimapCanvas');

    // 三人称カメラ
    this.camera = {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    };

    this.screenShake = 0;

    // 入力
    this.input = {
      keys: {},
      mouseX: 0,
      mouseY: 0,
      mouseWorldX: 0,
      mouseWorldY: 0,
      mouseWorldAngle: 0,
      justPressedWater: false
    };

    // 暗闇レンダリング用の再利用オフスクリーンキャンバス（毎フレーム生成を完全撤廃）
    this.darkCanvas = document.createElement('canvas');
    this.darkCtx = this.darkCanvas.getContext('2d');

    // エンティティ
    this.world = new World();
    this.entities = {
      buildings: [],
      animals: [],
      enemies: [],
      droppedItems: [],
      particles: [],
      popups: [],
      ambientParticles: []
    };

    // クエストシステム
    this.quests = [
      { id: 'wood', text: '木を伐採して木材を4個集めよう', check: () => this.countPlayerItem('wood') >= 4 },
      { id: 'workbench', text: 'インベントリ[E]から作業台を作成・設置しよう', check: () => this.entities.buildings.some(b => b.type === 'workbench') },
      { id: 'tools', text: '作業台の近くで木の斧かツルハシを作ろう', check: () => this.countPlayerItem('wooden_axe') >= 1 || this.countPlayerItem('wooden_pickaxe') >= 1 },
      { id: 'campfire', text: '夜に備えて焚き火を作って設置しよう', check: () => this.entities.buildings.some(b => b.type === 'campfire') },
      { id: 'stone', text: '石を採掘して石の斧やツルハシを作ろう', check: () => this.countPlayerItem('stone_axe') >= 1 || this.countPlayerItem('stone_pickaxe') >= 1 },
      { id: 'survive_night', text: '夜のモンスターから生き延びよう (Day 2を迎える)', check: () => this.world.dayCount >= 2 },
      { id: 'iron', text: '山岳地帯から鉄鉱石を採掘し、鉄の剣を作ろう', check: () => this.countPlayerItem('iron_sword') >= 1 },
      { id: 'master', text: '木箱(チェスト)と防壁を作って拠点を完成させよう！', check: () => this.entities.buildings.some(b => b.type === 'chest') }
    ];
    this.currentQuestIdx = 0;

    // UI参照キャッシュ
    this.inventoryModal = document.getElementById('inventory-modal');
    this.chestModal = document.getElementById('chest-modal');
    this.gameoverModal = document.getElementById('gameover-modal');
    this.healthBar = document.getElementById('health-bar');
    this.healthText = document.getElementById('health-text');
    this.hungerBar = document.getElementById('hunger-bar');
    this.hungerText = document.getElementById('hunger-text');
    this.thirstBar = document.getElementById('thirst-bar');
    this.thirstText = document.getElementById('thirst-text');
    this.staminaBar = document.getElementById('stamina-bar');
    this.staminaText = document.getElementById('stamina-text');
    this.dayCounter = document.getElementById('day-counter');
    this.clockDisplay = document.getElementById('clock-display');
    this.sunMoonIcon = document.getElementById('sun-moon-icon');
    this.questText = document.getElementById('quest-text');

    this.activeChest = null;
    this.selectedCraftCat = 'all';

    this.enemySpawnTimer = 0;
    this.animalSpawnTimer = 0;
    this.hudUpdateTimer = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // ワールド生成
    this.world.generate();

    // プレイヤー初期位置
    let spawnX = (this.world.width * TILE_SIZE) / 2;
    let spawnY = (this.world.height * TILE_SIZE) / 2;
    for (let r = 0; r < 30; r++) {
      let found = false;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const tx = Math.floor(this.world.width / 2) + dx;
          const ty = Math.floor(this.world.height / 2) + dy;
          const tile = this.world.getTile(tx, ty);
          if (tile === 2 || tile === 3 || tile === 4) {
            spawnX = tx * TILE_SIZE + TILE_SIZE / 2;
            spawnY = ty * TILE_SIZE + TILE_SIZE / 2;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    this.player = new Player(spawnX, spawnY);

    for (let i = 0; i < 15; i++) {
      this.spawnAnimal();
    }

    for (let i = 0; i < 28; i++) {
      this.entities.ambientParticles.push({
        x: Math.random() * (this.world.width * TILE_SIZE),
        y: Math.random() * (this.world.height * TILE_SIZE),
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        radius: 1.5 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2
      });
    }

    this.setupInputs();
    this.setupUIEvents();
    this.renderHotbarUI();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // キャンバスリサイズ時に暗闇バッファも同期
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.width = this.canvas.width;
    this.camera.height = this.canvas.height;

    this.darkCanvas.width = this.canvas.width;
    this.darkCanvas.height = this.canvas.height;
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      sound.init();
      this.input.keys[e.code] = true;

      if (e.code === 'KeyE') {
        if (!this.chestModal.classList.contains('hidden')) {
          this.closeChest();
        } else {
          this.toggleInventory();
        }
      }

      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''));
        if (num >= 1 && num <= 8) {
          this.player.selectedSlot = num - 1;
          this.renderHotbarUI();
        }
      }

      if (e.code === 'Space') {
        this.input.justPressedWater = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;
      this.updateMouseWorld();
    });

    window.addEventListener('wheel', (e) => {
      if (e.deltaY > 0) {
        this.player.selectedSlot = (this.player.selectedSlot + 1) % 8;
      } else {
        this.player.selectedSlot = (this.player.selectedSlot + 7) % 8;
      }
      this.renderHotbarUI();
    });

    this.canvas.addEventListener('mousedown', (e) => {
      sound.init();
      if (this.player.isDead) return;

      if (e.button === 0) {
        this.updateMouseWorld();
        let interacted = false;
        for (let i = 0; i < this.entities.buildings.length; i++) {
          const b = this.entities.buildings[i];
          const dist = Math.hypot(this.input.mouseWorldX - b.x, this.input.mouseWorldY - b.y);
          const pDist = Math.hypot(this.player.x - b.x, this.player.y - b.y);

          if (dist < b.radius + 18 && pDist < 95) {
            if (b.type === 'door') {
              b.isOpen = !b.isOpen;
              sound.build();
              this.showToast(b.isOpen ? 'ドアを開けました' : 'ドアを閉めました');
              interacted = true;
              break;
            } else if (b.type === 'chest') {
              this.openChest(b);
              interacted = true;
              break;
            }
          }
        }

        if (!interacted) {
          this.player.performAttack(this.world, this.entities, this.entities.popups, this.entities.particles);
          this.triggerScreenShake(3);
          this.renderHotbarUI();
        }
      } else if (e.button === 2) {
        e.preventDefault();
        this.handleRightClick();
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  triggerScreenShake(amount) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  updateMouseWorld() {
    this.input.mouseWorldX = this.input.mouseX + this.camera.x;
    this.input.mouseWorldY = (this.input.mouseY + this.camera.y) / PITCH_RATIO;
    this.input.mouseWorldAngle = Math.atan2(
      this.input.mouseWorldY - this.player.y,
      this.input.mouseWorldX - this.player.x
    );
  }

  handleRightClick() {
    const held = this.player.getHeldItem();
    if (!held) return;
    const def = ITEMS[held.id];
    if (!def) return;

    if (def.type === 'food' || def.type === 'medical') {
      this.player.useHeldItem(this.world, this.entities, this.entities.popups);
      this.renderHotbarUI();
    } else if (def.type === 'placeable') {
      const placeX = this.input.mouseWorldX;
      const placeY = this.input.mouseWorldY;
      const dist = Math.hypot(placeX - this.player.x, placeY - this.player.y);

      if (dist < 150 && this.world.isWalkable(placeX, placeY)) {
        let blocked = false;
        for (let i = 0; i < this.entities.buildings.length; i++) {
          const b = this.entities.buildings[i];
          if (Math.hypot(placeX - b.x, placeY - b.y) < b.radius + 18) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          this.entities.buildings.push(new Building(def.placeType, placeX, placeY));
          this.player.removeItem(this.player.selectedSlot, 1);
          sound.build();
          this.triggerScreenShake(4);
          this.showToast(`${def.name}を設置しました`);
          this.renderHotbarUI();
        } else {
          this.showToast('ここには設置できません');
        }
      }
    }
  }

  spawnAnimal() {
    const tx = Math.floor(Math.random() * this.world.width);
    const ty = Math.floor(Math.random() * this.world.height);
    const tile = this.world.getTile(tx, ty);

    if (tile === 3 || tile === 4) {
      const x = tx * TILE_SIZE + 24;
      const y = ty * TILE_SIZE + 24;
      const type = Math.random() < 0.6 ? 'rabbit' : 'deer';
      this.entities.animals.push(new Animal(type, x, y));
    }
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const dist = 420 + Math.random() * 200;
    const x = this.player.x + Math.cos(angle) * dist;
    const y = this.player.y + Math.sin(angle) * dist;

    if (this.world.isWalkable(x, y)) {
      const type = Math.random() < 0.6 ? 'zombie' : 'wolf';
      this.entities.enemies.push(new Enemy(type, x, y));
    }
  }

  countPlayerItem(itemId) {
    let count = 0;
    for (let i = 0; i < this.player.inventory.length; i++) {
      const slot = this.player.inventory[i];
      if (slot && slot.id === itemId) count += slot.count;
    }
    return count;
  }

  setupUIEvents() {
    document.getElementById('close-inventory-btn').addEventListener('click', () => this.toggleInventory(false));
    document.getElementById('close-chest-btn').addEventListener('click', () => this.closeChest());
    document.getElementById('respawn-btn').addEventListener('click', () => this.respawn());

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedCraftCat = tab.getAttribute('data-cat');
        this.renderCraftingUI();
      });
    });
  }

  toggleInventory(forced = null) {
    const isHidden = this.inventoryModal.classList.contains('hidden');
    const show = forced !== null ? forced : isHidden;

    if (show) {
      this.inventoryModal.classList.remove('hidden');
      this.renderInventoryModal();
      this.renderCraftingUI();
    } else {
      this.inventoryModal.classList.add('hidden');
    }
  }

  openChest(building) {
    this.activeChest = building;
    this.chestModal.classList.remove('hidden');
    this.renderChestModal();
  }

  closeChest() {
    this.activeChest = null;
    this.chestModal.classList.add('hidden');
  }

  showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
  }

  renderHotbarUI() {
    const hotbarEl = document.getElementById('hotbar');
    hotbarEl.innerHTML = '';

    for (let i = 0; i < 8; i++) {
      const slot = this.player.inventory[i];
      const slotDiv = document.createElement('div');
      slotDiv.className = `slot ${this.player.selectedSlot === i ? 'active' : ''}`;
      slotDiv.innerHTML = `<span class="slot-key">${i + 1}</span>`;

      if (slot) {
        const itemDef = ITEMS[slot.id];
        if (itemDef) {
          slotDiv.innerHTML += `
            <div class="slot-icon">${itemDef.icon}</div>
            ${slot.count > 1 ? `<span class="slot-count">${slot.count}</span>` : ''}
            ${slot.durability !== null ? `<div class="slot-durability" style="width: ${(slot.durability / (itemDef.maxDurability || 1)) * 100}%"></div>` : ''}
          `;
        }
      }

      slotDiv.addEventListener('click', () => {
        this.player.selectedSlot = i;
        this.renderHotbarUI();
      });

      hotbarEl.appendChild(slotDiv);
    }
  }

  renderInventoryModal() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';

    let totalUsed = 0;
    this.player.inventory.forEach((slot, idx) => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'slot';

      if (slot) {
        totalUsed++;
        const itemDef = ITEMS[slot.id];
        slotDiv.innerHTML = `
          <div class="slot-icon">${itemDef ? itemDef.icon : ''}</div>
          ${slot.count > 1 ? `<span class="slot-count">${slot.count}</span>` : ''}
        `;

        slotDiv.addEventListener('click', () => {
          document.getElementById('selected-item-info').innerHTML = `
            <strong>${itemDef.icon} ${itemDef.name}</strong><br>
            <span style="color:#aaa;">${itemDef.description}</span><br>
            <small>所持数: ${slot.count}個</small>
          `;
        });
      }

      grid.appendChild(slotDiv);
    });

    document.getElementById('inv-count').textContent = totalUsed;
  }

  renderCraftingUI() {
    const listEl = document.getElementById('crafting-list');
    listEl.innerHTML = '';

    const nearWorkbench = this.entities.buildings.some(b => b.type === 'workbench' && Math.hypot(this.player.x - b.x, this.player.y - b.y) < 150);
    const nearCampfire = this.entities.buildings.some(b => b.type === 'campfire' && Math.hypot(this.player.x - b.x, this.player.y - b.y) < 150);

    const indicator = document.getElementById('workbench-indicator');
    if (nearWorkbench) {
      indicator.textContent = '作業台利用中 🔨';
      indicator.style.background = '#2e7d32';
    } else {
      indicator.textContent = '基本作業 🪚';
      indicator.style.background = '#1565c0';
    }

    const filteredRecipes = RECIPES.filter(r => {
      if (this.selectedCraftCat !== 'all' && r.category !== this.selectedCraftCat) return false;
      return true;
    });

    filteredRecipes.forEach(recipe => {
      const itemDef = ITEMS[recipe.result];
      if (!itemDef) return;

      const canCraftStation = (!recipe.requiresWorkbench || nearWorkbench) && (!recipe.requiresCampfire || nearCampfire);
      const hasMats = this.player.hasIngredients(recipe.ingredients);
      const isAvailable = canCraftStation && hasMats;

      const card = document.createElement('div');
      card.className = `craft-item-card ${isAvailable ? '' : 'disabled'}`;

      const ingText = recipe.ingredients.map(ing => {
        const d = ITEMS[ing.id];
        return `${d ? d.name : ing.id}x${ing.count}`;
      }).join(', ');

      card.innerHTML = `
        <div class="craft-card-icon">${itemDef.icon}</div>
        <div class="craft-card-info">
          <div class="craft-card-name">${itemDef.name} ${recipe.count > 1 ? `x${recipe.count}` : ''}</div>
          <div class="craft-card-cost">必要: ${ingText}</div>
          ${recipe.requiresWorkbench && !nearWorkbench ? '<small style="color:#ef5350">※作業台が必要</small>' : ''}
          ${recipe.requiresCampfire && !nearCampfire ? '<small style="color:#ef5350">※焚き火が必要</small>' : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        if (isAvailable) {
          this.player.consumeIngredients(recipe.ingredients);
          this.player.addItem(recipe.result, recipe.count);
          sound.craft();
          this.showToast(`${itemDef.name}をクラフトしました！`);
          this.renderInventoryModal();
          this.renderCraftingUI();
          this.renderHotbarUI();
        } else {
          sound.playTone(150, 'sawtooth', 0.1, 0.1);
        }
      });

      listEl.appendChild(card);
    });
  }

  renderChestModal() {
    if (!this.activeChest) return;
    const cGrid = document.getElementById('chest-grid');
    const pGrid = document.getElementById('chest-player-grid');
    cGrid.innerHTML = '';
    pGrid.innerHTML = '';

    this.activeChest.chestItems.forEach((slot, idx) => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'slot';
      if (slot) {
        const itemDef = ITEMS[slot.id];
        slotDiv.innerHTML = `
          <div class="slot-icon">${itemDef.icon}</div>
          ${slot.count > 1 ? `<span class="slot-count">${slot.count}</span>` : ''}
        `;
        slotDiv.addEventListener('click', () => {
          const added = this.player.addItem(slot.id, slot.count, slot.durability);
          if (added > 0) {
            slot.count -= added;
            if (slot.count <= 0) this.activeChest.chestItems[idx] = null;
            sound.pickup();
            this.renderChestModal();
            this.renderHotbarUI();
          }
        });
      }
      cGrid.appendChild(slotDiv);
    });

    this.player.inventory.forEach((slot, idx) => {
      const slotDiv = document.createElement('div');
      slotDiv.className = 'slot';
      if (slot) {
        const itemDef = ITEMS[slot.id];
        slotDiv.innerHTML = `
          <div class="slot-icon">${itemDef.icon}</div>
          ${slot.count > 1 ? `<span class="slot-count">${slot.count}</span>` : ''}
        `;
        slotDiv.addEventListener('click', () => {
          for (let c = 0; c < this.activeChest.chestItems.length; c++) {
            if (!this.activeChest.chestItems[c]) {
              this.activeChest.chestItems[c] = { ...slot };
              this.player.inventory[idx] = null;
              sound.pickup();
              this.renderChestModal();
              this.renderHotbarUI();
              break;
            }
          }
        });
      }
      pGrid.appendChild(slotDiv);
    });
  }

  respawn() {
    this.player.hp = 100;
    this.player.hunger = 100;
    this.player.thirst = 100;
    this.player.stamina = 100;
    this.player.isDead = false;
    this.gameoverModal.classList.add('hidden');
    this.showToast('新たな命で目覚めました！');
  }

  update(dt) {
    if (this.player.isDead) {
      if (this.gameoverModal.classList.contains('hidden')) {
        this.gameoverModal.classList.remove('hidden');
        document.getElementById('gameover-reason').textContent = this.player.deathReason;
        document.getElementById('survival-record').textContent = `生存日数: ${this.world.dayCount}日`;
      }
      return;
    }

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 15);
    }

    // カメラ追従
    this.camera.x = this.player.x - this.camera.width / 2;
    this.camera.y = (this.player.y * PITCH_RATIO) - (this.camera.height * 0.58);
    this.updateMouseWorld();

    this.world.update(dt);
    this.player.update(dt, this.input, this.world, this.entities.buildings);

    // ドロップ品
    for (let i = this.entities.droppedItems.length - 1; i >= 0; i--) {
      const item = this.entities.droppedItems[i];
      item.update(dt, this.player.x, this.player.y);

      if (Math.hypot(this.player.x - item.x, this.player.y - item.y) < 26 && item.pickupDelay <= 0) {
        const added = this.player.addItem(item.itemId, item.count);
        if (added > 0) {
          sound.pickup();
          const def = ITEMS[item.itemId];
          this.entities.popups.push(new PopupText(`+${item.count} ${def ? def.name : item.itemId}`, this.player.x, this.player.y, '#81c784'));
          this.entities.droppedItems.splice(i, 1);
          this.renderHotbarUI();
        }
      }
    }

    // 建築物
    for (let i = this.entities.buildings.length - 1; i >= 0; i--) {
      const b = this.entities.buildings[i];
      b.update(dt, this.entities.particles);
      if (b.hp <= 0) {
        sound.breakResource();
        this.triggerScreenShake(5);
        this.entities.buildings.splice(i, 1);
      }
    }

    for (let i = 0; i < this.entities.animals.length; i++) {
      this.entities.animals[i].update(dt, this.player.x, this.player.y, this.world);
    }

    for (let i = this.entities.enemies.length - 1; i >= 0; i--) {
      this.entities.enemies[i].update(dt, this.player, this.entities.buildings, this.world);
    }

    for (let i = this.entities.particles.length - 1; i >= 0; i--) {
      this.entities.particles[i].update(dt);
      if (this.entities.particles[i].life <= 0) this.entities.particles.splice(i, 1);
    }
    for (let i = this.entities.popups.length - 1; i >= 0; i--) {
      this.entities.popups[i].update(dt);
      if (this.entities.popups[i].life <= 0) this.entities.popups.splice(i, 1);
    }

    // 大気浮遊ダスト
    for (let i = 0; i < this.entities.ambientParticles.length; i++) {
      const ap = this.entities.ambientParticles[i];
      ap.x += ap.vx * dt;
      ap.y += ap.vy * dt;
      ap.phase += dt * 2.5;

      if (ap.x < 0) ap.x = this.world.width * TILE_SIZE;
      if (ap.x > this.world.width * TILE_SIZE) ap.x = 0;
      if (ap.y < 0) ap.y = this.world.height * TILE_SIZE;
      if (ap.y > this.world.height * TILE_SIZE) ap.y = 0;
    }

    this.enemySpawnTimer += dt;
    if (this.world.isNight() && this.entities.enemies.length < 7 && this.enemySpawnTimer > 6.0) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }

    this.animalSpawnTimer += dt;
    if (!this.world.isNight() && this.entities.animals.length < 18 && this.animalSpawnTimer > 8.0) {
      this.spawnAnimal();
      this.animalSpawnTimer = 0;
    }

    const currentQuest = this.quests[this.currentQuestIdx];
    if (currentQuest && currentQuest.check()) {
      sound.questComplete();
      this.showToast(`🎯 目標達成: ${currentQuest.text}`);
      this.currentQuestIdx++;
    }

    // HUD更新のスロットリング（毎フレームのDOM書き換えを防止し、0.1秒ごとに更新）
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= 0.1) {
      this.updateHUD();
      this.hudUpdateTimer = 0;
    }
  }

  // スロットル化されたHUD更新
  updateHUD() {
    this.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    this.healthText.textContent = `${Math.ceil(this.player.hp)} / ${this.player.maxHp}`;

    this.hungerBar.style.width = `${(this.player.hunger / this.player.maxHunger) * 100}%`;
    this.hungerText.textContent = `${Math.ceil(this.player.hunger)} / ${this.player.maxHunger}`;

    this.thirstBar.style.width = `${(this.player.thirst / this.player.maxThirst) * 100}%`;
    this.thirstText.textContent = `${Math.ceil(this.player.thirst)} / ${this.player.maxThirst}`;

    this.staminaBar.style.width = `${(this.player.stamina / this.player.maxStamina) * 100}%`;
    this.staminaText.textContent = `${Math.ceil(this.player.stamina)} / ${this.player.maxStamina}`;

    this.dayCounter.textContent = `Day ${this.world.dayCount}`;
    this.clockDisplay.textContent = this.world.getTimeFormatted();
    this.sunMoonIcon.textContent = this.world.isNight() ? '🌙' : '☀️';

    const q = this.quests[this.currentQuestIdx];
    this.questText.textContent = q ? q.text : '全目標クリア！自由な開拓を楽しもう！';

    // ミニマップ描画（事前レンダリング済みなので一瞬で完了）
    this.world.renderMinimap(this.minimapCanvas, this.player.x, this.player.y);
  }

  // 高速レンダリング
  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(shakeX, shakeY);
    }

    // 1. 地面タイル
    this.world.renderTiles(this.ctx, this.camera);

    // 2. ドロップアイテム
    for (let i = 0; i < this.entities.droppedItems.length; i++) {
      this.entities.droppedItems[i].render(this.ctx, this.camera);
    }

    // 3. 自然リソース描画
    this.world.renderResources(this.ctx, this.camera);

    // 4. 動的オブジェクトのYソート描画
    const renderQueue = [];
    for (let i = 0; i < this.entities.buildings.length; i++) {
      const b = this.entities.buildings[i];
      renderQueue.push({ y: b.y, obj: b });
    }
    for (let i = 0; i < this.entities.animals.length; i++) {
      const a = this.entities.animals[i];
      renderQueue.push({ y: a.y, obj: a });
    }
    for (let i = 0; i < this.entities.enemies.length; i++) {
      const e = this.entities.enemies[i];
      renderQueue.push({ y: e.y, obj: e });
    }
    renderQueue.push({ y: this.player.y, obj: this.player });

    renderQueue.sort((a, b) => a.y - b.y);
    for (let i = 0; i < renderQueue.length; i++) {
      renderQueue[i].obj.render(this.ctx, this.camera);
    }

    // 5. パーティクル
    for (let i = 0; i < this.entities.particles.length; i++) {
      this.entities.particles[i].render(this.ctx, this.camera);
    }

    // 6. 大気ホタル（画面内のみ）
    const isNight = this.world.isNight();
    for (let i = 0; i < this.entities.ambientParticles.length; i++) {
      const ap = this.entities.ambientParticles[i];
      const sx = ap.x - this.camera.x;
      const sy = (ap.y * PITCH_RATIO) - this.camera.y;

      if (sx >= 0 && sx <= this.camera.width && sy >= 0 && sy <= this.camera.height) {
        const glow = (Math.sin(ap.phase) + 1) * 0.5;
        this.ctx.fillStyle = isNight ? `rgba(220, 255, 100, ${glow * 0.8})` : `rgba(255, 255, 255, ${glow * 0.35})`;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, ap.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // 7. 高速化された動的ライティング
    this.renderLighting();

    // 8. ポップアップ
    for (let i = 0; i < this.entities.popups.length; i++) {
      this.entities.popups[i].render(this.ctx, this.camera);
    }

    this.ctx.restore();
  }

  // 事前確保バッファを用いた超高速ライティング
  renderLighting() {
    const ambient = this.world.getAmbientLight();
    const sky = this.world.getSkyColor();

    if (sky) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(${sky.r}, ${sky.g}, ${sky.b}, ${sky.a})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    if (ambient >= 0.98) return;

    this.ctx.save();

    const darkness = 1.0 - ambient;
    const dCtx = this.darkCtx;

    // 既存のオフスクリーンキャンバスをクリア＆再利用（メモリ再確保ゼロ！）
    dCtx.globalCompositeOperation = 'source-over';
    dCtx.fillStyle = `rgba(6, 10, 20, ${Math.min(0.92, darkness * 0.95)})`;
    dCtx.fillRect(0, 0, this.darkCanvas.width, this.darkCanvas.height);

    // 光源のくり抜き
    dCtx.globalCompositeOperation = 'destination-out';

    const held = this.player.getHeldItem();
    const pRadius = held && held.id === 'torch' ? 260 : 110;
    const pScreenX = this.player.x - this.camera.x;
    const pScreenY = (this.player.y * PITCH_RATIO) - this.camera.y - 12;

    const pGrad = dCtx.createRadialGradient(pScreenX, pScreenY, 15, pScreenX, pScreenY, pRadius);
    pGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    pGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.7)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    dCtx.fillStyle = pGrad;
    dCtx.beginPath();
    dCtx.arc(pScreenX, pScreenY, pRadius, 0, Math.PI * 2);
    dCtx.fill();

    for (let i = 0; i < this.entities.buildings.length; i++) {
      const b = this.entities.buildings[i];
      if (b.type === 'campfire' || b.type === 'torch') {
        const bRadius = b.type === 'campfire' ? 270 : 185;
        const bScreenX = b.x - this.camera.x;
        const bScreenY = (b.y * PITCH_RATIO) - this.camera.y;

        // 画面外の光源はスキップ
        if (
          bScreenX + bRadius < 0 ||
          bScreenX - bRadius > this.camera.width ||
          bScreenY + bRadius < 0 ||
          bScreenY - bRadius > this.camera.height
        ) {
          continue;
        }

        const bGrad = dCtx.createRadialGradient(bScreenX, bScreenY, 20, bScreenX, bScreenY, bRadius);
        bGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        bGrad.addColorStop(0.65, 'rgba(0, 0, 0, 0.65)');
        bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        dCtx.fillStyle = bGrad;
        dCtx.beginPath();
        dCtx.arc(bScreenX, bScreenY, bRadius, 0, Math.PI * 2);
        dCtx.fill();
      }
    }

    // メインキャンバスに高速貼り付け
    this.ctx.drawImage(this.darkCanvas, 0, 0);

    // 暖色ブルーム
    this.ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < this.entities.buildings.length; i++) {
      const b = this.entities.buildings[i];
      if (b.type === 'campfire' || b.type === 'torch') {
        const bScreenX = b.x - this.camera.x;
        const bScreenY = (b.y * PITCH_RATIO) - this.camera.y;
        const glowRadius = b.type === 'campfire' ? 130 : 75;

        if (
          bScreenX + glowRadius < 0 ||
          bScreenX - glowRadius > this.camera.width ||
          bScreenY + glowRadius < 0 ||
          bScreenY - glowRadius > this.camera.height
        ) {
          continue;
        }

        const warmGlow = this.ctx.createRadialGradient(bScreenX, bScreenY, 5, bScreenX, bScreenY, glowRadius);
        warmGlow.addColorStop(0, 'rgba(255, 160, 40, 0.3)');
        warmGlow.addColorStop(1, 'rgba(255, 100, 20, 0)');
        this.ctx.fillStyle = warmGlow;
        this.ctx.beginPath();
        this.ctx.arc(bScreenX, bScreenY, glowRadius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    this.ctx.restore();
  }

  gameLoop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

window.addEventListener('load', () => {
  new Game();
});
