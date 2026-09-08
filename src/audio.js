// Web Audio API によるシンセサイズ効果音マネージャー
// 外部音声ファイルへの依存がなく、確実に即座に音が鳴ります。

class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 汎用ビープ・トーン生成
  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15, freqEnd = null) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (freqEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(10, freqEnd), this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Audio error fallback
    }
  }

  // ノイズ（打撃・破片音用）
  playNoise(duration = 0.1, gainVal = 0.2, filterFreq = 1000) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const bufferSize = this.ctx.sampleRate * duration;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start();
    } catch (e) {}
  }

  // 木を叩く
  hitWood() {
    this.playNoise(0.08, 0.25, 600);
    this.playTone(180, 'triangle', 0.08, 0.15, 80);
  }

  // 石を叩く
  hitStone() {
    this.playNoise(0.06, 0.2, 2200);
    this.playTone(450, 'square', 0.05, 0.08, 200);
  }

  // 資源破壊・採取完了音
  breakResource() {
    this.playNoise(0.18, 0.3, 1400);
    this.playTone(280, 'sine', 0.15, 0.2, 520);
  }

  // アイテム回収音
  pickup() {
    this.playTone(480, 'sine', 0.06, 0.12, 720);
  }

  // クラフト完了
  craft() {
    this.playTone(330, 'triangle', 0.08, 0.15, 440);
    setTimeout(() => {
      this.playTone(550, 'sine', 0.15, 0.15, 660);
    }, 90);
  }

  // 建築物設置
  build() {
    this.playNoise(0.1, 0.2, 800);
    this.playTone(200, 'triangle', 0.1, 0.15, 120);
  }

  // 飲食
  eat() {
    this.playTone(220, 'sine', 0.07, 0.1, 280);
    setTimeout(() => this.playTone(260, 'sine', 0.08, 0.1, 320), 100);
  }

  // 飲む
  drink() {
    this.playNoise(0.15, 0.15, 1500);
    this.playTone(400, 'sine', 0.1, 0.1, 300);
  }

  // プレイヤーダメージ
  playerHurt() {
    this.playTone(180, 'sawtooth', 0.2, 0.25, 90);
    this.playNoise(0.15, 0.2, 800);
  }

  // 敵攻撃ヒット
  hitEnemy() {
    this.playNoise(0.1, 0.25, 1800);
    this.playTone(320, 'sawtooth', 0.1, 0.15, 140);
  }

  // 敵撃破
  enemyDefeat() {
    this.playTone(200, 'square', 0.2, 0.2, 80);
    setTimeout(() => this.playTone(120, 'square', 0.3, 0.2, 40), 150);
  }

  // クエスト完了ファンファーレ
  questComplete() {
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.2, 0.18);
      }, idx * 100);
    });
  }

  // ゲームオーバー
  gameOver() {
    const notes = [300, 270, 240, 180];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.35, 0.25);
      }, idx * 160);
    });
  }
}

export const sound = new SoundManager();
