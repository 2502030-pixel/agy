// モバイル＆タブレット向けタッチコントロールシステム
export class TouchControls {
  constructor(game) {
    this.game = game;
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 900);

    // ジョイスティック状態
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickOrigin = { x: 0, y: 0 };
    this.joystickCurrent = { x: 0, y: 0 };
    this.joystickVector = { x: 0, y: 0 }; // -1.0 〜 1.0
    this.joystickDistance = 0;           // 0.0 〜 1.0
    this.maxRadius = 50;                 // ピクセル

    // カメラ回転タッチ状態
    this.cameraTouchId = null;
    this.lastCameraX = 0;
    this.lastCameraY = 0;

    // ピンチズーム状態
    this.pinchTouchIds = [];
    this.initialPinchDistance = 0;

    // DOM要素参照
    this.mobileControlsContainer = document.getElementById('mobile-controls');
    this.joystickBase = document.getElementById('joystick-base');
    this.joystickStick = document.getElementById('joystick-stick');
    this.btnAttack = document.getElementById('btn-touch-attack');
    this.btnUse = document.getElementById('btn-touch-use');
    this.btnAction = document.getElementById('btn-touch-action');
    this.btnVision = document.getElementById('btn-touch-vision');
    this.btnInventory = document.getElementById('btn-touch-inventory');

    this.init();
  }

  init() {
    // タッチ端末またはモバイルサイズの場合にコントロールを表示
    if (this.mobileControlsContainer) {
      if (this.isTouchDevice || window.innerWidth <= 900) {
        this.mobileControlsContainer.classList.remove('hidden');
        document.body.classList.add('touch-mode');
      } else {
        this.mobileControlsContainer.classList.add('hidden');
      }
    }

    this.setupJoystickEvents();
    this.setupCameraTouchEvents();
    this.setupActionButtons();

    // ウィンドウリサイズ時の再チェック
    window.addEventListener('resize', () => {
      const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.innerWidth <= 900);
      if (this.mobileControlsContainer) {
        if (isMobile) {
          this.mobileControlsContainer.classList.remove('hidden');
          document.body.classList.add('touch-mode');
        } else {
          this.mobileControlsContainer.classList.add('hidden');
          document.body.classList.remove('touch-mode');
        }
      }
    });
  }

  // バーチャルジョイスティックのイベント登録
  setupJoystickEvents() {
    const zone = document.getElementById('joystick-zone');
    if (!zone || !this.joystickBase || !this.joystickStick) return;

    const handleStart = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (this.joystickTouchId === null) {
          this.joystickTouchId = touch.identifier;
          this.joystickActive = true;

          const rect = zone.getBoundingClientRect();
          const baseRect = this.joystickBase.getBoundingClientRect();

          // スティックの基準位置
          this.joystickOrigin = {
            x: baseRect.left + baseRect.width / 2,
            y: baseRect.top + baseRect.height / 2
          };

          this.updateJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleMove = (e) => {
      if (!this.joystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.updateJoystick(touch.clientX, touch.clientY);
          break;
        }
      }
    };

    const handleEnd = (e) => {
      if (!this.joystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickTouchId) {
          this.resetJoystick();
          break;
        }
      }
    };

    zone.addEventListener('touchstart', handleStart, { passive: false });
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd, { passive: false });
    window.addEventListener('touchcancel', handleEnd, { passive: false });
  }

  updateJoystick(clientX, clientY) {
    const dx = clientX - this.joystickOrigin.x;
    const dy = clientY - this.joystickOrigin.y;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, this.maxRadius);
    const angle = Math.atan2(dy, dx);

    const stickX = Math.cos(angle) * clampedDist;
    const stickY = Math.sin(angle) * clampedDist;

    this.joystickStick.style.transform = `translate(${stickX}px, ${stickY}px)`;

    // 正規化ベクトル
    const norm = dist === 0 ? 0 : clampedDist / this.maxRadius;
    this.joystickDistance = norm;
    this.joystickVector = {
      x: (dist === 0 ? 0 : Math.cos(angle)) * norm,
      y: (dist === 0 ? 0 : Math.sin(angle)) * norm
    };
  }

  resetJoystick() {
    this.joystickActive = false;
    this.joystickTouchId = null;
    this.joystickVector = { x: 0, y: 0 };
    this.joystickDistance = 0;
    if (this.joystickStick) {
      this.joystickStick.style.transform = 'translate(0px, 0px)';
    }
  }

  // 画面タッチによるカメラ視点旋回 & ピンチズーム
  setupCameraTouchEvents() {
    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    gameContainer.addEventListener('touchstart', (e) => {
      // ボタンやモーダル上のタッチは無視
      const target = e.target;
      if (target.closest('.hud-panel') || target.closest('.modal') || target.closest('#mobile-controls') || target.closest('#toast-container')) {
        return;
      }

      // 1本指の場合：カメラ回転
      if (e.touches.length === 1 && this.cameraTouchId === null) {
        const touch = e.touches[0];
        // 画面の右半分または中央付近でスワイプ開始
        if (touch.clientX > window.innerWidth * 0.35) {
          this.cameraTouchId = touch.identifier;
          this.lastCameraX = touch.clientX;
          this.lastCameraY = touch.clientY;
        }
      }
      // 2本指の場合：ピンチズーム
      else if (e.touches.length === 2) {
        this.cameraTouchId = null; // 回転をキャンセル
        this.pinchTouchIds = [e.touches[0].identifier, e.touches[1].identifier];
        this.initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    }, { passive: true });

    gameContainer.addEventListener('touchmove', (e) => {
      // 2本指ピンチズーム処理
      if (e.touches.length >= 2 && this.pinchTouchIds.length === 2) {
        const t0 = Array.from(e.touches).find(t => t.identifier === this.pinchTouchIds[0]);
        const t1 = Array.from(e.touches).find(t => t.identifier === this.pinchTouchIds[1]);
        if (t0 && t1) {
          const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
          const diff = this.initialPinchDistance - currentDist;
          if (this.game && this.game.renderer3d) {
            this.game.renderer3d.spiritDistance = Math.max(6.0, Math.min(26.0, this.game.renderer3d.spiritDistance + diff * 0.05));
          }
          this.initialPinchDistance = currentDist;
          return;
        }
      }

      // 1本指カメラ回転処理
      if (this.cameraTouchId !== null) {
        const touch = Array.from(e.touches).find(t => t.identifier === this.cameraTouchId);
        if (touch) {
          const dx = touch.clientX - this.lastCameraX;
          const dy = touch.clientY - this.lastCameraY;

          if (this.game && this.game.renderer3d) {
            this.game.renderer3d.spiritAngle -= dx * 0.008;
            this.game.renderer3d.spiritPitch = Math.max(0.15, Math.min(1.2, this.game.renderer3d.spiritPitch + dy * 0.006));
          }

          this.lastCameraX = touch.clientX;
          this.lastCameraY = touch.clientY;
        }
      }
    }, { passive: true });

    const handleCameraEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === this.cameraTouchId) {
          this.cameraTouchId = null;
        }
        if (this.pinchTouchIds.includes(t.identifier)) {
          this.pinchTouchIds = [];
        }
      }
    };

    window.addEventListener('touchend', handleCameraEnd, { passive: true });
    window.addEventListener('touchcancel', handleCameraEnd, { passive: true });
  }

  // アクションボタンイベント登録
  setupActionButtons() {
    // ⚔️ 攻撃 / 採掘ボタン
    if (this.btnAttack) {
      let isAttacking = false;
      const startAttack = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isAttacking = true;
        this.btnAttack.classList.add('active');
        if (this.game) {
          this.game.triggerAction('attack');
        }
      };
      const endAttack = (e) => {
        isAttacking = false;
        this.btnAttack.classList.remove('active');
      };
      this.btnAttack.addEventListener('touchstart', startAttack, { passive: false });
      this.btnAttack.addEventListener('touchend', endAttack, { passive: false });
      this.btnAttack.addEventListener('mousedown', startAttack);
      this.btnAttack.addEventListener('mouseup', endAttack);
    }

    // 🛠️ 使用 / 建築設置ボタン
    if (this.btnUse) {
      const handleUse = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.btnUse.classList.add('active');
        setTimeout(() => this.btnUse.classList.remove('active'), 150);
        if (this.game) {
          this.game.triggerAction('use');
        }
      };
      this.btnUse.addEventListener('touchstart', handleUse, { passive: false });
      this.btnUse.addEventListener('click', handleUse);
    }

    // 💧 調べる / 水を飲む / 開閉ボタン
    if (this.btnAction) {
      const handleAction = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.btnAction.classList.add('active');
        setTimeout(() => this.btnAction.classList.remove('active'), 150);
        if (this.game) {
          this.game.triggerAction('interact');
        }
      };
      this.btnAction.addEventListener('touchstart', handleAction, { passive: false });
      this.btnAction.addEventListener('click', handleAction);
    }

    // 👁️ 視界ジャック切替ボタン
    if (this.btnVision) {
      const handleVision = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.btnVision.classList.add('active');
        setTimeout(() => this.btnVision.classList.remove('active'), 150);
        if (this.game) {
          this.game.toggleVisionJack();
        }
      };
      this.btnVision.addEventListener('touchstart', handleVision, { passive: false });
      this.btnVision.addEventListener('click', handleVision);
    }

    // 🎒 インベントリボタン
    if (this.btnInventory) {
      const handleInventory = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.game) {
          this.game.toggleInventory();
        }
      };
      this.btnInventory.addEventListener('touchstart', handleInventory, { passive: false });
      this.btnInventory.addEventListener('click', handleInventory);
    }
  }

  // フレームごとの移動入力取得
  getMovement() {
    if (!this.joystickActive) {
      return { dx: 0, dy: 0, isRunning: false };
    }

    const dx = this.joystickVector.x;
    const dy = this.joystickVector.y;
    const isRunning = this.joystickDistance > 0.72; // 大きく倒すとダッシュ

    return { dx, dy, isRunning };
  }
}
