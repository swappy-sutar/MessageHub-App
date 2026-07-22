// Web Audio API Ringtone & Unique Message Tone Synthesizer for MessageHub

class RingtoneManager {
  constructor() {
    this.audioCtx = null;
    this.timer = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  // Unique Crystal Glass Pop Chime for Incoming Messages
  playIncomingMessageTone() {
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;

      // Note 1: High E6 (1318.51Hz) Glass Pluck
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1318.51, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2: Bright B6 (1975.53Hz) Bell Accent (delayed 0.06s)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1975.53, now + 0.06);
      gain2.gain.setValueAtTime(0.1, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.25);
    } catch (e) {
      console.warn("Incoming message tone error:", e);
    }
  }

  // WhatsApp-Style Soft Tactile Pop Sound for Sent Messages
  playSentMessageTone() {
    this.init();
    if (!this.audioCtx) return;
    try {
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1046.5, now); // C6
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.05); // C5

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn("Sent message tone error:", e);
    }
  }

  // Notification Sound alias
  playNotificationSound() {
    this.playIncomingMessageTone();
  }

  // Ringback tone for Outgoing Call (Caller)
  playCallingTone() {
    this.stop();
    this.init();

    const playPulse = () => {
      if (!this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        // Standard phone ringback frequencies
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.8);
        osc2.stop(now + 1.8);
      } catch (e) {
        console.warn("Ringtone playback error:", e);
      }
    };

    playPulse();
    this.timer = setInterval(playPulse, 3000);
  }

  // Electronic Chime melody for Incoming Call (Receiver)
  playIncomingTone() {
    this.stop();
    this.init();

    const playMelody = () => {
      if (!this.audioCtx) return;
      try {
        const now = this.audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

        notes.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);

          gain.gain.setValueAtTime(0.08, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.3);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.3);
        });
      } catch (e) {
        console.warn("Incoming ringtone error:", e);
      }
    };

    playMelody();
    this.timer = setInterval(playMelody, 2000);
  }

  // Stop ringtone
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const ringtone = new RingtoneManager();
