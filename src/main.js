// 二人称（Second-Person）3D サバイバルクラフト メインゲームエンジン
import { World, TILE_SIZE } from './world.js';
import { Player } from './player.js?v=20261027_04';
import { Building, Animal, Enemy, DroppedItem, Particle, PopupText } from './entities.js';
import { ITEMS, RECIPES } from './items.js';
import { sound } from './audio.js';
import { Renderer3D, WORLD_SCALE } from './renderer3d.js?v=20261027_02';
import { TouchControls } from './touchControls.js';
import * as THREE from './vendor/three.module.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    if (this.canvas) this.canvas.style.display = 'none'; // 3D WebGLキャンバスを主画面に

    this.minimapCanvas = document.getElementById('minimapCanvas');

    // 3D レンダリングエンジン初期化
    this.renderer3d = new Renderer3D(document.getElementById('game-container'));

    this.screenShake = 0;

    // 入力
    this.input = {
      keys: {},
      mouseX: window.innerWidth / 2,
      mouseY: window.innerHeight / 2,
      mouseWorldX: 0,
      mouseWorldY: 0,
      mouseWorldAngle: 0,
      moveDx: 0,
      moveDy: 0,
      justPressedWater: false,
      hasMouseMoved: false,
      isTouchActive: false,
      isSprinting: false
    };

    // タッチコントロール初期化
    this.touchControls = new TouchControls(this);

    // マウス視点操作
    this.isRightDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    // ワールドとエンティティ
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

    // 二人称HUD参照
    this.cameraTargetLabel = document.getElementById('camera-target-label');
    this.switchCameraBtn = document.getElementById('switch-camera-btn');
    this.visionJackOverlay = document.getElementById('vision-jack-overlay');

    this.activeChest = null;
    this.selectedCraftCat = 'all';

    this.enemySpawnTimer = 0;
    this.animalSpawnTimer = 0;
    this.hudUpdateTimer = 0;

    this.init();
  }

  init() {
    // ワールド生成
    this.world.generate();

    // 島の 3D メッシュ構築
    this.renderer3d.buildIsland(this.world);

    // プレイヤー初期スポーン位置（平原または森林の陸地）
    let spawnX = (this.world.width * TILE_SIZE) / 2;
    let spawnY = (this.world.height * TILE_SIZE) / 2;
    for (let r = 0; r < 35; r++) {
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

    // 野生動物のスポーン
    for (let i = 0; i < 16; i++) {
      this.spawnAnimal();
    }

    this.setupInputs();
    this.setupUIEvents();
    this.renderHotbarUI();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => {
      sound.init();
      this.input.keys[e.code] = true;

      // 二人称視界ジャック切替 [V]
      if (e.code === 'KeyV') {
        this.toggleVisionJack();
      }

      // インベントリ開閉 [E]
      if (e.code === 'KeyE') {
        if (!this.chestModal.classList.contains('hidden')) {
          this.closeChest();
        } else {
          this.toggleInventory();
        }
      }

      // ホットバースロット [1〜8]
      if (e.code.startsWith('Digit')) {
        const num = parseInt(e.code.replace('Digit', ''));
        if (num >= 1 && num <= 8) {
          this.player.selectedSlot = num - 1;
          this.renderHotbarUI();
        }
      }

      // 水分補給 [Space]
      if (e.code === 'Space') {
        this.input.justPressedWater = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      this.input.hasMouseMoved = true;
      this.input.mouseX = e.clientX;
      this.input.mouseY = e.clientY;

      if (this.isRightDragging) {
        // 右ドラッグで観察者のカメラ視点を旋回
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.renderer3d.spiritAngle -= dx * 0.007;
        this.renderer3d.spiritPitch = Math.max(0.12, Math.min(1.25, this.renderer3d.spiritPitch + dy * 0.005));
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }

      // 3D レイキャスター更新
      this.renderer3d.updateRaycast(e.clientX, e.clientY);

      if (this.renderer3d.hasGroundIntersection) {
        // 3D地上座標から2Dゲーム座標へ変換
        this.input.mouseWorldX = this.renderer3d.groundIntersection.x / WORLD_SCALE;
        this.input.mouseWorldY = this.renderer3d.groundIntersection.z / WORLD_SCALE;
        this.input.mouseWorldAngle = Math.atan2(
          this.input.mouseWorldY - this.player.y,
          this.input.mouseWorldX - this.player.x
        );
      }
    });

    window.addEventListener('wheel', (e) => {
      if (e.shiftKey || e.ctrlKey) {
        // 観察者カメラ距離ズーム
        this.renderer3d.targetDistance = Math.max(8.0, Math.min(26.0, this.renderer3d.targetDistance + (e.deltaY > 0 ? 2.5 : -2.5)));
      } else {
        // ホットバースロット切り替え
        if (e.deltaY > 0) {
          this.player.selectedSlot = (this.player.selectedSlot + 1) % 8;
        } else {
          this.player.selectedSlot = (this.player.selectedSlot + 7) % 8;
        }
        this.renderHotbarUI();
      }
    });

    const domTarget = this.renderer3d.renderer.domElement;

    domTarget.addEventListener('mousedown', (e) => {
      sound.init();
      if (this.player.isDead) return;

      if (e.button === 0) {
        // 左クリック：採掘・伐採・攻撃・操作
        this.handleLeftClick();
      } else if (e.button === 2) {
        // 右クリック：カメラドラッグ開始またはアイテム設置/使用
        this.isRightDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.rightClickDownTime = performance.now();
      }
    });

    domTarget.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        const pressDuration = performance.now() - (this.rightClickDownTime || 0);
        this.isRightDragging = false;

        // 短い右クリックの場合はアイテム設置・使用アクション
        if (pressDuration < 280) {
          this.handleRightClickAction();
        }
      }
    });

    domTarget.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // 二人称（Second-Person）視界ジャック切り替え
  toggleVisionJack() {
    const res = this.renderer3d.toggleCameraMode(this.entities.enemies, this.entities.animals, this.player);
    if (this.cameraTargetLabel) {
      this.cameraTargetLabel.textContent = res.name;
    }

    // 視界エフェクトの更新
    if (this.visionJackOverlay) {
      this.visionJackOverlay.className = '';
      if (res.mode === 'creature') {
        const entType = this.renderer3d.cameraTargetEntity ? this.renderer3d.cameraTargetEntity.type : '';
        if (entType === 'wolf') {
          this.visionJackOverlay.classList.add('wolf-vision');
        } else if (entType === 'zombie') {
          this.visionJackOverlay.classList.add('zombie-vision');
        } else {
          this.visionJackOverlay.classList.add('prey-vision');
        }
      } else {
        this.visionJackOverlay.classList.add('spirit-vision');
      }
    }

    this.showToast(`👁️ 二人称リンク: ${res.name} の視界`);
  }

  // 左クリックによるインタラクション・攻撃
  handleLeftClick() {
    let interacted = false;

    // 3Dレイキャストでホバーされているオブジェクトがあれば優先インタラクト
    const hovered = this.renderer3d.hoveredObject;
    if (hovered && hovered.userData && hovered.userData.entity) {
      const ent = hovered.userData.entity;
      const pDist = Math.hypot(this.player.x - ent.x, this.player.y - ent.y);

      if (ent.type === 'door' && pDist < 120) {
        ent.isOpen = !ent.isOpen;
        sound.build();
        this.showToast(ent.isOpen ? 'ドアを開けました' : 'ドアを閉めました');
        interacted = true;
      } else if (ent.type === 'chest' && pDist < 120) {
        this.openChest(ent);
        interacted = true;
      }
    }

    if (!interacted) {
      // ドアやチェストの近接探索フォールバック
      for (let i = 0; i < this.entities.buildings.length; i++) {
        const b = this.entities.buildings[i];
        const dist = Math.hypot(this.input.mouseWorldX - b.x, this.input.mouseWorldY - b.y);
        const pDist = Math.hypot(this.player.x - b.x, this.player.y - b.y);

        if (dist < b.radius + 28 && pDist < 110) {
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
    }

    if (!interacted) {
      // プレイヤーの攻撃・伐採・採掘アクション実行
      this.player.performAttack(this.world, this.entities, this.entities.popups, this.entities.particles);
      this.triggerScreenShake(3);
      this.renderHotbarUI();
    }
  }

  // 右クリックによるアイテム使用または3D設置
  handleRightClickAction() {
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

      if (dist < 180 && this.world.isWalkable(placeX, placeY)) {
        let blocked = false;
        for (let i = 0; i < this.entities.buildings.length; i++) {
          const b = this.entities.buildings[i];
          if (Math.hypot(placeX - b.x, placeY - b.y) < b.radius + 18) {
            blocked = true;
            break;
          }
        }

        if (!blocked && this.world.resources) {
          for (let i = 0; i < this.world.resources.length; i++) {
            const res = this.world.resources[i];
            if (res.hp <= 0) continue;
            if (res.type === 'tree' || res.type === 'rock' || res.type === 'iron_rock') {
              const resRadius = res.type === 'tree' ? 16 : 18;
              if (Math.hypot(placeX - res.x, placeY - res.y) < resRadius + 18) {
                blocked = true;
                break;
              }
            }
          }
        }

        if (!blocked) {
          this.entities.buildings.push(new Building(def.placeType, placeX, placeY));
          this.player.removeItem(this.player.selectedSlot, 1);
          sound.build();
          this.triggerScreenShake(4);
          this.showToast(`🔨 ${def.name} を設置しました`);
          this.renderHotbarUI();
        } else {
          this.showToast('ここには設置できません');
        }
      }
    }
  }

  triggerScreenShake(amount) {
    this.screenShake = Math.max(this.screenShake, amount);
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

    if (this.switchCameraBtn) {
      this.switchCameraBtn.addEventListener('click', () => this.toggleVisionJack());
    }

    const helpBtn = document.getElementById('help-toggle-btn');
    const helpHint = document.getElementById('help-hint');
    if (helpBtn && helpHint) {
      helpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        helpHint.classList.toggle('hidden-hint');
      });
      document.addEventListener('click', (e) => {
        if (!helpHint.contains(e.target) && e.target !== helpBtn) {
          helpHint.classList.add('hidden-hint');
        }
      });
    }

    this.selectedCraftCat = 'all';
    this.selectedMaterialFilter = null;
    this.filterOnlyCraftable = false;
    this.selectedRecipeId = null;
    this.selectedInventorySlot = null;

    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedCraftCat = tab.getAttribute('data-cat');
        this.renderCraftingUI();
      });
    });

    const craftableBtn = document.getElementById('filter-craftable-btn');
    if (craftableBtn) {
      craftableBtn.addEventListener('click', () => {
        this.filterOnlyCraftable = !this.filterOnlyCraftable;
        craftableBtn.classList.toggle('active', this.filterOnlyCraftable);
        this.renderCraftingUI();
      });
    }

    const clearFilterBtn = document.getElementById('clear-material-filter-btn');
    if (clearFilterBtn) {
      clearFilterBtn.addEventListener('click', () => {
        this.clearMaterialFilter();
      });
    }
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
    building._isOpenedModal = true;
    this.chestModal.classList.remove('hidden');
    this.renderChestModal();
  }

  closeChest() {
    if (this.activeChest) {
      this.activeChest._isOpenedModal = false;
    }
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
      slotDiv.className = `slot ${i === this.player.selectedSlot ? 'active' : ''}`;
      slotDiv.dataset.index = i;

      const numBadge = document.createElement('span');
      numBadge.className = 'slot-num';
      numBadge.textContent = `${i + 1}`;
      slotDiv.appendChild(numBadge);

      if (slot) {
        const itemDef = ITEMS[slot.id];
        const iconDiv = document.createElement('div');
        iconDiv.className = 'slot-icon';
        iconDiv.textContent = itemDef.icon;
        slotDiv.appendChild(iconDiv);

        if (slot.count > 1) {
          const countSpan = document.createElement('span');
          countSpan.className = 'slot-count';
          countSpan.textContent = `${slot.count}`;
          slotDiv.appendChild(countSpan);
        }

        if (slot.durability !== null && itemDef.maxDurability) {
          const durBar = document.createElement('div');
          durBar.className = 'durability-bar';
          const durInner = document.createElement('div');
          durInner.className = 'durability-fill';
          durInner.style.width = `${(slot.durability / itemDef.maxDurability) * 100}%`;
          durBar.appendChild(durInner);
          slotDiv.appendChild(durBar);
        }
      }

      const selectSlot = (e) => {
        if (e) e.stopPropagation();
        this.player.selectedSlot = i;
        this.renderHotbarUI();
      };
      slotDiv.addEventListener('click', selectSlot);
      slotDiv.addEventListener('touchend', (e) => {
        e.preventDefault();
        selectSlot(e);
      });

      hotbarEl.appendChild(slotDiv);
    }
  }

  renderInventoryModal() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    let count = 0;

    this.player.inventory.forEach((slot, idx) => {
      if (slot) count++;
      const slotDiv = document.createElement('div');
      slotDiv.className = `slot ${idx === this.selectedInventorySlot ? 'selected-slot' : ''}`;
      slotDiv.dataset.index = idx;

      if (slot) {
        const itemDef = ITEMS[slot.id];
        slotDiv.innerHTML = `
          <div class="slot-icon">${itemDef.icon}</div>
          ${slot.count > 1 ? `<span class="slot-count">${slot.count}</span>` : ''}
        `;
        slotDiv.addEventListener('click', () => {
          this.selectedInventorySlot = idx;
          grid.querySelectorAll('.slot').forEach(s => s.classList.remove('selected-slot'));
          slotDiv.classList.add('selected-slot');
          this.showItemInfo(itemDef, slot);
          this.setMaterialFilter(itemDef.id);
        });
      } else {
        slotDiv.addEventListener('click', () => {
          this.selectedInventorySlot = null;
          grid.querySelectorAll('.slot').forEach(s => s.classList.remove('selected-slot'));
          this.clearMaterialFilter();
          const infoBox = document.getElementById('selected-item-info');
          infoBox.innerHTML = 'アイテムをクリックすると詳細が表示されます';
        });
      }
      grid.appendChild(slotDiv);
    });

    document.getElementById('inv-count').textContent = `${count}`;
  }

  setMaterialFilter(matId) {
    this.selectedMaterialFilter = matId;
    const banner = document.getElementById('material-filter-banner');
    const textEl = document.getElementById('material-filter-text');
    const itemDef = ITEMS[matId];

    if (banner && textEl && itemDef) {
      // この素材で作れるレシピ数をカウント
      const matchingRecipes = RECIPES.filter(r => r.ingredients && r.ingredients.some(ing => ing.id === matId));
      if (matchingRecipes.length > 0) {
        banner.classList.remove('hidden');
        textEl.innerHTML = `🔍 <strong>${itemDef.icon} [${itemDef.name}]</strong> で作れるレシピ (${matchingRecipes.length}件)`;
      } else {
        banner.classList.remove('hidden');
        textEl.innerHTML = `🔍 <strong>${itemDef.icon} [${itemDef.name}]</strong> を使うレシピはありません`;
      }
    }
    this.renderCraftingUI();
  }

  clearMaterialFilter() {
    this.selectedMaterialFilter = null;
    const banner = document.getElementById('material-filter-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
    this.renderCraftingUI();
  }

  showItemInfo(itemDef, slot) {
    const infoBox = document.getElementById('selected-item-info');
    
    // この素材を材料として使うレシピを全検索
    const usableInRecipes = RECIPES.filter(r => r.ingredients && r.ingredients.some(ing => ing.id === itemDef.id));
    
    let recipesChipsHtml = '';
    if (usableInRecipes.length > 0) {
      recipesChipsHtml = `
        <div class="craftable-products-title">🔨 この素材で作れるアイテム (タップで絞り込み):</div>
        <div class="craftable-products-list">
          ${usableInRecipes.map(r => {
            const resId = typeof r.result === 'string' ? r.result : (r.result && r.result.id);
            const resItem = ITEMS[resId];
            if (!resItem) return '';
            const canCraft = this.player.hasIngredients(r.ingredients);
            return `
              <span class="crafted-from-chip ${canCraft ? 'can-craft' : ''}" data-recipe-id="${r.id}" title="${resItem.name}">
                ${resItem.icon} ${resItem.name}
              </span>
            `;
          }).join('')}
        </div>
      `;
    }

    infoBox.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
        <span style="font-size:24px;">${itemDef.icon}</span>
        <div>
          <strong style="color:#f8fafc; font-size:14px;">${itemDef.name}</strong>
          <span style="font-size:11px; color:#94a3b8; margin-left:8px;">所持数: ${slot ? slot.count : 1} / スタック: ${itemDef.maxStack}</span>
        </div>
      </div>
      <p style="margin:0 0 6px 0; color:#cbd5e1; font-size:11.5px; line-height:1.4;">${itemDef.description || itemDef.desc || ''}</p>
      ${recipesChipsHtml}
    `;

    // チップをクリックしたときにそのレシピにジャンプ＆選択
    infoBox.querySelectorAll('.crafted-from-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const rId = chip.getAttribute('data-recipe-id');
        this.selectRecipe(rId);
      });
    });
  }

  selectRecipe(recipeId) {
    this.selectedRecipeId = recipeId;
    this.renderCraftingUI();
  }

  renderCraftingUI() {
    const listEl = document.getElementById('crafting-list');
    listEl.innerHTML = '';

    const isNearWorkbench = this.entities.buildings.some(b => b.type === 'workbench' && Math.hypot(this.player.x - b.x, this.player.y - b.y) < 130);
    const isNearCampfire = this.entities.buildings.some(b => b.type === 'campfire' && Math.hypot(this.player.x - b.x, this.player.y - b.y) < 130);

    const indicator = document.getElementById('workbench-indicator');
    if (indicator) {
      if (isNearWorkbench) {
        indicator.textContent = '作業台あり';
        indicator.style.background = '#059669';
      } else {
        indicator.textContent = '基本作業';
        indicator.style.background = '#2563eb';
      }
    }

    // フィルタリング処理
    const recipes = RECIPES.filter(r => {
      // 1. 素材フィルター
      if (this.selectedMaterialFilter) {
        const hasMat = r.ingredients && r.ingredients.some(ing => ing.id === this.selectedMaterialFilter);
        if (!hasMat) return false;
      } else {
        // 通常のカテゴリフィルター（素材フィルター適用時は全カテゴリ横断で表示）
        if (this.selectedCraftCat !== 'all' && r.category !== this.selectedCraftCat) return false;
      }

      // 2. 作成可能のみフィルター
      if (this.filterOnlyCraftable) {
        const reqWorkbench = !!(r.requiresWorkbench || r.needWorkbench);
        const reqCampfire = !!(r.requiresCampfire || r.needCampfire);
        const canReq = (!reqWorkbench || isNearWorkbench) && (!reqCampfire || isNearCampfire);
        const hasMats = this.player.hasIngredients(r.ingredients);
        if (!canReq || !hasMats) return false;
      }

      return true;
    });

    if (recipes.length === 0) {
      listEl.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #94a3b8; font-size: 13px;">
          該当するレシピはありません。<br>
          ${this.selectedMaterialFilter ? '<button id="btn-reset-filter" class="clear-filter-btn" style="margin-top:8px;">すべてのレシピを表示する</button>' : ''}
        </div>
      `;
      const resetBtn = document.getElementById('btn-reset-filter');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.clearMaterialFilter());
      }
      this.renderCraftingPreview(null);
      return;
    }

    // デフォルトで現在選択中がなければ先頭レシピを選択
    if (!this.selectedRecipeId || !recipes.some(r => r.id === this.selectedRecipeId)) {
      this.selectedRecipeId = recipes[0].id;
    }

    let activeRecipe = null;

    recipes.forEach(r => {
      const resultId = typeof r.result === 'string' ? r.result : (r.result && r.result.id);
      const resultCount = typeof r.result === 'object' && r.result.count ? r.result.count : (r.count || 1);
      const targetItem = ITEMS[resultId];
      if (!targetItem) return;

      const reqWorkbench = !!(r.requiresWorkbench || r.needWorkbench);
      const reqCampfire = !!(r.requiresCampfire || r.needCampfire);
      const canMakeRequirement = (!reqWorkbench || isNearWorkbench) && (!reqCampfire || isNearCampfire);
      const hasMats = this.player.hasIngredients(r.ingredients);
      const canCraft = canMakeRequirement && hasMats;
      const isSelected = r.id === this.selectedRecipeId;

      if (isSelected) {
        activeRecipe = { ...r, resultId, resultCount, targetItem, canMakeRequirement, hasMats, canCraft, reqWorkbench, reqCampfire };
      }

      const card = document.createElement('div');
      card.className = `craft-card ${canCraft ? 'can-craft' : 'cannot-craft'} ${isSelected ? 'selected-recipe' : ''}`;

      let ingHtml = r.ingredients.map(ing => {
        const item = ITEMS[ing.id];
        const has = this.countPlayerItem(ing.id);
        const ok = has >= ing.count;
        return `<span class="mat-chip ${ok ? 'ok' : 'lack'}">${item ? item.icon : ''} ${item ? item.name : ing.id} ${has}/${ing.count}</span>`;
      }).join('');

      let statusBadge = '';
      if (canCraft) {
        statusBadge = '<span style="font-size:10px; color:#34d399; font-weight:700;">✨作成可</span>';
      } else if (!canMakeRequirement) {
        statusBadge = `<span style="font-size:10px; color:#fbbf24; font-weight:700;">⚠️${reqWorkbench ? '要:作業台' : '要:焚き火'}</span>`;
      } else {
        statusBadge = '<span style="font-size:10px; color:#f87171;">❌素材不足</span>';
      }

      card.innerHTML = `
        <div class="craft-card-icon">${targetItem.icon}</div>
        <div class="craft-details">
          <div class="craft-name">
            <span>${targetItem.name}${resultCount > 1 ? ` x${resultCount}` : ''}</span>
            ${statusBadge}
          </div>
          <div class="craft-mats">${ingHtml}</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectedRecipeId = r.id;
        this.renderCraftingUI();
      });

      listEl.appendChild(card);
    });

    this.renderCraftingPreview(activeRecipe);
  }

  renderCraftingPreview(recipeData) {
    const previewEl = document.getElementById('crafting-preview');
    if (!previewEl) return;

    if (!recipeData) {
      previewEl.innerHTML = '<div style="color:#64748b; font-size:12px; text-align:center; padding:12px;">レシピを選択してください</div>';
      return;
    }

    const { r, targetItem, resultCount, canMakeRequirement, hasMats, canCraft, reqWorkbench, reqCampfire } = recipeData;

    let reqLabel = '<span style="color:#38bdf8;">手元で作成可能</span>';
    if (reqWorkbench) reqLabel = canMakeRequirement ? '<span style="color:#34d399;">✅ 作業台の設備あり</span>' : '<span style="color:#fbbf24;">⚠️ 作業台の近くが必要です</span>';
    if (reqCampfire) reqLabel = canMakeRequirement ? '<span style="color:#34d399;">✅ 焚き火の設備あり</span>' : '<span style="color:#fbbf24;">⚠️ 焚き火の近くが必要です</span>';

    const matsListHtml = recipeData.ingredients.map(ing => {
      const item = ITEMS[ing.id];
      const has = this.countPlayerItem(ing.id);
      const ok = has >= ing.count;
      return `
        <span class="mat-chip ${ok ? 'ok' : 'lack'}" style="font-size:11.5px; padding:2px 8px; cursor:pointer;" data-mat-id="${ing.id}" title="クリックしてこの素材で作れるものを表示">
          ${item ? item.icon : ''} ${item ? item.name : ing.id}: <strong>${has}/${ing.count}</strong>
        </span>
      `;
    }).join('');

    previewEl.innerHTML = `
      <div class="preview-header">
        <span class="preview-icon">${targetItem.icon}</span>
        <div class="preview-title-col">
          <div class="preview-name">${targetItem.name}${resultCount > 1 ? ` x${resultCount}` : ''} <span style="font-size:11px; margin-left:8px;">${reqLabel}</span></div>
          <div class="preview-desc">${targetItem.description || targetItem.desc || ''}</div>
        </div>
      </div>
      <div class="preview-action-row">
        <div class="preview-mats-list">
          ${matsListHtml}
        </div>
        <button id="btn-do-craft" class="btn-craft-action" ${canCraft ? '' : 'disabled'}>
          🔨 クラフトする
        </button>
      </div>
    `;

    // プレビューの素材チップをクリックしたときも素材フィルターを起動
    previewEl.querySelectorAll('.mat-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const matId = chip.getAttribute('data-mat-id');
        if (matId && ITEMS[matId]) {
          this.setMaterialFilter(matId);
        }
      });
    });

    const craftBtn = document.getElementById('btn-do-craft');
    if (craftBtn && canCraft) {
      craftBtn.addEventListener('click', () => {
        this.executeCraft(recipeData);
      });
    }
  }

  executeCraft(recipeData) {
    const { targetItem, resultId, resultCount, ingredients, canMakeRequirement, hasMats } = recipeData;

    if (!canMakeRequirement) {
      this.showToast(recipeData.reqWorkbench ? '作業台の近くで作成してください' : '焚き火の近くで作成してください');
      return;
    }
    if (!hasMats) {
      this.showToast('素材が足りません');
      return;
    }

    ingredients.forEach(req => {
      let toRemove = req.count;
      for (let i = 0; i < this.player.inventory.length; i++) {
        const slot = this.player.inventory[i];
        if (slot && slot.id === req.id) {
          const take = Math.min(toRemove, slot.count);
          this.player.removeItem(i, take);
          toRemove -= take;
          if (toRemove <= 0) break;
        }
      }
    });

    this.player.addItem(resultId, resultCount);
    sound.craft();
    this.showToast(`🔨 ${targetItem.name} をクラフトしました！`);
    this.renderCraftingUI();
    this.renderInventoryModal();
    this.renderHotbarUI();
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
    this.showToast('新たな命で島に目覚めました！');
  }

  // 二人称（カメラ視点）相対の移動方向計算（PCキーボード & スマホジョイスティック両対応）
  calculateCameraRelativeMovement() {
    let inputFwd = 0;  // W (+1), S (-1)
    let inputRight = 0; // D (+1), A (-1)

    if (this.input.keys['KeyW'] || this.input.keys['ArrowUp']) inputFwd += 1;
    if (this.input.keys['KeyS'] || this.input.keys['ArrowDown']) inputFwd -= 1;
    if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) inputRight += 1;
    if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft']) inputRight -= 1;

    // タッチジョイスティック入力の取得
    const touchMove = this.touchControls ? this.touchControls.getMovement() : { dx: 0, dy: 0, isRunning: false };
    this.input.isTouchActive = this.touchControls && this.touchControls.joystickActive;
    this.input.isSprinting = touchMove.isRunning;

    const hasKeyInput = (inputFwd !== 0 || inputRight !== 0);
    const hasTouchInput = (touchMove.dx !== 0 || touchMove.dy !== 0);

    if (!hasKeyInput && !hasTouchInput) {
      this.input.moveDx = 0;
      this.input.moveDy = 0;
      return;
    }

    // カメラのワールド方向ベクトル（XZ平面）
    const cam = this.renderer3d.camera;
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();

    // 右ベクトル
    const right = new THREE.Vector3();
    right.crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();

    // 合成ベクトル (3Dワールド空間)
    const move = new THREE.Vector3();

    if (hasKeyInput) {
      move.addScaledVector(fwd, inputFwd);
      move.addScaledVector(right, inputRight);
    }
    if (hasTouchInput) {
      // ジョイスティック: 上倒し(-dy)で前進(fwd)、右倒し(+dx)で右移動(right)
      move.addScaledVector(fwd, -touchMove.dy);
      move.addScaledVector(right, touchMove.dx);
    }

    move.normalize();

    // 2Dゲーム空間 (x, y) へのマッピング: 3D X -> 2D X, 3D Z -> 2D Y
    this.input.moveDx = move.x;
    this.input.moveDy = move.z;
  }

  // スマホ・タッチ用アクション実行
  triggerAction(type) {
    sound.init();
    if (this.player.isDead) return;

    if (type === 'attack') {
      // 照準がない場合でも、プレイヤーの前方をターゲットに設定
      if (!this.renderer3d.hasGroundIntersection) {
        const dist = 75;
        this.input.mouseWorldX = this.player.x + Math.cos(this.player.angle) * dist;
        this.input.mouseWorldY = this.player.y + Math.sin(this.player.angle) * dist;
      }
      this.handleLeftClick();
    } else if (type === 'use') {
      // アイテム使用または3D建築設置
      if (!this.renderer3d.hasGroundIntersection) {
        const dist = 85;
        this.input.mouseWorldX = this.player.x + Math.cos(this.player.angle) * dist;
        this.input.mouseWorldY = this.player.y + Math.sin(this.player.angle) * dist;
      }
      this.handleRightClickAction();
    } else if (type === 'interact') {
      // ドア・チェストの開閉または水分補給
      let interacted = false;

      // 近くのドア・チェストを検索
      for (let i = 0; i < this.entities.buildings.length; i++) {
        const b = this.entities.buildings[i];
        const dist = Math.hypot(this.player.x - b.x, this.player.y - b.y);
        if (dist < 115) {
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
        // 水分補給を試みる
        const tx = Math.floor(this.player.x / 52);
        const ty = Math.floor(this.player.y / 52);
        let nearWater = this.world.isWater(tx, ty);
        if (!nearWater) {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (this.world.isWater(tx + dx, ty + dy)) {
                nearWater = true;
                break;
              }
            }
          }
        }

        if (nearWater) {
          if (this.player.thirst < this.player.maxThirst) {
            this.player.thirst = Math.min(this.player.maxThirst, this.player.thirst + 25);
            sound.drink();
            this.showToast('💧 水を飲んで喉を潤しました');
          } else {
            this.showToast('喉は渇いていません');
          }
        } else {
          this.showToast('周囲に水場や操作可能な設備がありません');
        }
      }
    }
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

    // 二人称カメラ相対の移動ベクトルを算出
    this.calculateCameraRelativeMovement();

    this.world.update(dt);
    this.player.update(dt, this.input, this.world, this.entities.buildings);

    // ドロップアイテム処理
    for (let i = this.entities.droppedItems.length - 1; i >= 0; i--) {
      const item = this.entities.droppedItems[i];
      item.update(dt, this.player.x, this.player.y);

      if (Math.hypot(this.player.x - item.x, this.player.y - item.y) < 28 && item.pickupDelay <= 0) {
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

    // 建築物の更新
    for (let i = this.entities.buildings.length - 1; i >= 0; i--) {
      const b = this.entities.buildings[i];
      b.update(dt, this.entities.particles);
      if (b.hp <= 0) {
        sound.breakResource();
        this.triggerScreenShake(5);
        this.entities.buildings.splice(i, 1);
      }
    }

    // 動物の更新
    for (let i = 0; i < this.entities.animals.length; i++) {
      this.entities.animals[i].update(dt, this.player.x, this.player.y, this.world);
    }

    // 敵モンスターの更新
    for (let i = this.entities.enemies.length - 1; i >= 0; i--) {
      this.entities.enemies[i].update(dt, this.player, this.entities.buildings, this.world);
    }

    // パーティクル＆ポップアップ
    for (let i = this.entities.particles.length - 1; i >= 0; i--) {
      this.entities.particles[i].update(dt);
      if (this.entities.particles[i].life <= 0) this.entities.particles.splice(i, 1);
    }
    for (let i = this.entities.popups.length - 1; i >= 0; i--) {
      this.entities.popups[i].update(dt);
      if (this.entities.popups[i].life <= 0) this.entities.popups.splice(i, 1);
    }

    // スポナー
    this.enemySpawnTimer += dt;
    if (this.world.isNight() && this.entities.enemies.length < 8 && this.enemySpawnTimer > 6.0) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }

    this.animalSpawnTimer += dt;
    if (!this.world.isNight() && this.entities.animals.length < 18 && this.animalSpawnTimer > 8.0) {
      this.spawnAnimal();
      this.animalSpawnTimer = 0;
    }

    // クエスト進行度チェック
    const currentQuest = this.quests[this.currentQuestIdx];
    if (currentQuest && currentQuest.check()) {
      sound.questComplete();
      this.showToast(`🎯 目標達成: ${currentQuest.text}`);
      this.currentQuestIdx++;
    }

    // HUD更新のスロットリング
    this.hudUpdateTimer += dt;
    if (this.hudUpdateTimer >= 0.1) {
      this.updateHUD();
      this.hudUpdateTimer = 0;
    }
  }

  updateHUD() {
    this.healthBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
    this.healthText.textContent = `${Math.ceil(this.player.hp)}`;

    this.hungerBar.style.width = `${(this.player.hunger / this.player.maxHunger) * 100}%`;
    this.hungerText.textContent = `${Math.ceil(this.player.hunger)}`;

    this.thirstBar.style.width = `${(this.player.thirst / this.player.maxThirst) * 100}%`;
    this.thirstText.textContent = `${Math.ceil(this.player.thirst)}`;

    this.staminaBar.style.width = `${(this.player.stamina / this.player.maxStamina) * 100}%`;
    this.staminaText.textContent = `${Math.ceil(this.player.stamina)}`;

    this.dayCounter.textContent = `Day ${this.world.dayCount}`;
    this.clockDisplay.textContent = this.world.getTimeFormatted();
    this.sunMoonIcon.textContent = this.world.isNight() ? '🌙' : '☀️';

    const q = this.quests[this.currentQuestIdx];
    this.questText.textContent = q ? q.text : '全目標クリア！自由な開拓を楽しもう！';

    // ミニマップ描画
    this.world.renderMinimap(this.minimapCanvas, this.player.x, this.player.y);
  }

  // 3D レンダリング
  render(dt) {
    // 昼夜ライティング
    this.renderer3d.updateLighting(this.world, dt);

    // 二人称カメラ更新（観察者の目線からプレイヤーを見つめる）
    this.renderer3d.updateSecondPersonCamera(this.player, this.entities.enemies, this.entities.animals, dt);

    // プレイヤー3Dモデルのアニメーション
    this.renderer3d.updatePlayer(this.player, this.world, dt);

    // 自然リソース（木・岩・茂み）の同期
    this.renderer3d.syncResources(this.world.resources, this.world, dt);

    // 建築物（焚き火・松明・壁・ドア・チェスト）の同期
    this.renderer3d.syncBuildings(this.entities.buildings, this.world, dt);

    // 野生動物の同期
    this.renderer3d.syncAnimals(this.entities.animals, this.world, dt);

    // 敵モンスターの同期
    this.renderer3d.syncEnemies(this.entities.enemies, this.world, dt);

    // ドロップアイテムの同期
    this.renderer3d.syncDroppedItems(this.entities.droppedItems, this.world, dt);

    // 建築物設置の3Dプレビュー
    const held = this.player.getHeldItem();
    const heldDef = held ? ITEMS[held.id] : null;
    this.renderer3d.updatePlacementPreview(heldDef, true);

    // Three.js レンダリング実行
    this.renderer3d.render();
  }

  gameLoop(time) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.render(dt);

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
