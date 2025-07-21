interface AudioSettings {
  enabled: boolean;
  volume: number;
  language: string;
}

interface ClickSoundConfig {
  src: string;
  volume: number;
}

class AudioService {
  private synthesis: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private settings: AudioSettings = {
    enabled: true,
    volume: 0.8,
    language: 'fr-FR'
  };
  private repetitionTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private fcBeepTimer: NodeJS.Timeout | null = null;
  private fvAlarmTimer: NodeJS.Timeout | null = null;
  private alarmOscillator: OscillatorNode | null = null;

  // Legacy audio elements for cleanup (even though not actively used for playback)
  private chargingSound: HTMLAudioElement | null = null;
  private alarmSound: HTMLAudioElement | null = null;

  // Simplified click sound management
  private clickSounds: Map<string, HTMLAudioElement[]> = new Map();
  private clickSoundIndex = 0;
  private readonly CLICK_SOUND_POOL_SIZE = 3;

  // Click sound configurations
  private readonly clickSoundConfigs: Record<string, ClickSoundConfig> = {
    soft: { src: '/sounds/click-soft.wav', volume: 0.3 },
    normal: { src: '/sounds/click-normal.wav', volume: 0.5 },
    sharp: { src: '/sounds/click-sharp.wav', volume: 0.7 }
  };

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    this.synthesis = window.speechSynthesis;
    this.initializeClickSounds();

    // Initialize legacy audio elements (for cleanup compatibility)
    this.chargingSound = new Audio();
    this.alarmSound = new Audio();
  }

  /**
   * Initialize click sound pools for each type
   */
  private initializeClickSounds(): void {
    Object.entries(this.clickSoundConfigs).forEach(([type, config]) => {
      const audioPool: HTMLAudioElement[] = [];

      for (let i = 0; i < this.CLICK_SOUND_POOL_SIZE; i++) {
        const audio = new Audio(config.src);
        audio.preload = 'auto';
        audio.volume = config.volume * this.settings.volume;
        audioPool.push(audio);
      }

      this.clickSounds.set(type, audioPool);
    });
  }

  /**
   * Get shared AudioContext (reuse existing one)
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(console.error);
    }

    return this.audioContext;
  }

  public isSuspended(): boolean {
    return this.getAudioContext().state === 'suspended';
  }

  /**
   * Resumes the AudioContext if it is in a suspended state.
   * This must be called as a result of a user interaction (e.g., a click).
   */
  public resume(): Promise<void> {
    return this.getAudioContext().resume();
  }

  /**
   * Update audio settings
   */

  public getSettings(): AudioSettings {
    return this.settings;
  }

  updateSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };


    // Update click sound volumes
    this.clickSounds.forEach((audioPool, type) => {
      const config = this.clickSoundConfigs[type];
      if (config) {
        audioPool.forEach(audio => {
          audio.volume = config.volume * this.settings.volume;
        });
      }
    });
  }

  /**
   * Play click sound using wav files
   */
  playClickSound(type: 'soft' | 'normal' | 'sharp' = 'normal'): void {
    if (!this.settings.enabled) {
      return;
    }

    const audioPool = this.clickSounds.get(type);
    if (!audioPool || audioPool.length === 0) {
      console.warn(`No audio pool found for click sound type: ${type}`);
      return;
    }

    try {
      // Use round-robin to handle rapid clicks
      const audio = audioPool[this.clickSoundIndex % audioPool.length];
      audio.currentTime = 0;

      audio.play().catch(error => {
        console.error(`Error playing ${type} click sound:`, error);
      });

      this.clickSoundIndex++;
    } catch (error) {
      console.error(`Error with ${type} click sound:`, error);
    }
  }

  /**
   * Preload all click sounds
   */
  async preloadClickSounds(): Promise<void> {
    const loadPromises: Promise<void>[] = [];

    this.clickSounds.forEach((audioPool, type) => {
      audioPool.forEach(audio => {
        loadPromises.push(
          new Promise<void>((resolve, reject) => {
            audio.addEventListener('canplaythrough', () => resolve(), { once: true });
            audio.addEventListener('error', reject, { once: true });
            audio.load();
          })
        );
      });
    });

    try {
      await Promise.all(loadPromises);
      console.log('All click sounds preloaded successfully');
    } catch (error) {
      console.error('Error preloading click sounds:', error);
    }
  }

  /**
   * Play text-to-speech message
   */
  playMessage(text: string, options?: { priority?: boolean; repeat?: boolean; repeatInterval?: number }): void {
    if (!this.settings.enabled || !this.synthesis) {
      return;
    }

    // If priority, stop current message
    if (options?.priority && this.currentUtterance) {
      this.synthesis.cancel();
      this.clearRepetition();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.settings.language;
    utterance.volume = this.settings.volume;
    utterance.rate = 0.9;

    utterance.onend = () => {
      this.currentUtterance = null;

      if (options?.repeat && options?.repeatInterval) {
        this.repetitionTimer = setTimeout(() => {
          this.playMessage(text, options);
        }, options.repeatInterval);
      }
    };

    this.currentUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  // DAE-specific messages
  playDAEModeAdulte(): void {
    this.playMessage("Mode adulte", { priority: true });
  }

  playDAEInstructions(): void {
    const message = "Insérez fermement le connecteur et appliquez les électrodes";
    this.playMessage(message, { priority: true });
  }

  playDAEElectrodeReminder(): void {
    const message = "Appliquez les électrodes";
    this.playMessage(message, {
      repeat: true,
      repeatInterval: 10000
    });
  }

  playDAEAnalyse(): void {
    this.playMessage("Analyse en cours", { priority: true });
  }

  playDAEChocRecommande(): void {
    this.playMessage("Choc recommandé", { priority: true });
  }

  playDAEEcartezVousduPatient(): void {
    this.playMessage("Écartez-vous du patient", { priority: true });
  }

  playDAEEcartezVous(): void {
    this.playMessage("Écartez-vous", { priority: true });
  }

  playPasDeChocIndique(): void {
    this.playMessage("Pas de choc indiqué", { priority: true });
  }

  playCommencerRCP(): void {
    this.playMessage("Commencer la réanimation cardio pulmonaire", { priority: true });
  }

  playDAEChoc(): void {
    this.playMessage("délivrer le choc maintenant", { priority: true });
  }

  playDAEboutonOrange(): void {
    this.playMessage("appuyez sur le bouton orange maintenant", { priority: true });
  }

  playDAEChocDelivre(): void {
    this.playMessage("choc délivré", { priority: true });
  }

  /**
   * Play charging sequence with synthetic audio
   */
  playChargingSequence(): void {
    this.stopAll();
    if (!this.settings.enabled) return;

    const audioContext = this.getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(880, audioContext.currentTime + 5);

    gainNode.gain.setValueAtTime(0.1 * this.settings.volume, audioContext.currentTime);


    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 5);

    // After 5 seconds, play alarm and voice messages
    setTimeout(() => {
      // Stop any existing alarm oscillator
      this.stopAlarmOscillator();

      this.alarmOscillator = audioContext.createOscillator();
      const alarmGain = audioContext.createGain();

      this.alarmOscillator.type = 'square';
      this.alarmOscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

      alarmGain.gain.setValueAtTime(0.05 * this.settings.volume, audioContext.currentTime);

      this.alarmOscillator.connect(alarmGain);
      alarmGain.connect(audioContext.destination);

      this.alarmOscillator.start();

      // Clean up oscillator reference when it ends
      this.alarmOscillator.onended = () => {
        this.alarmOscillator = null;
      };

      this.playDAEChoc();
      setTimeout(() => {
        this.playDAEboutonOrange();
      }, 2000);
    }, 5000);
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    if (this.synthesis) this.synthesis.cancel();
    this.clearRepetition();
    this.currentUtterance = null;

    // FIX: Check if the sound is not paused before trying to pause it.
    // This prevents the "interrupted by a call to pause()" error.
    if (this.chargingSound && !this.chargingSound.paused) {
      this.chargingSound.pause();
      this.chargingSound.currentTime = 0;
    }

    if (this.alarmSound && !this.alarmSound.paused) {
      this.alarmSound.pause();
      this.alarmSound.currentTime = 0;
    }

    if (this.alarmOscillator) {
      this.alarmOscillator.stop();
      this.alarmOscillator = null;
    }
    this.stopFCBeepSequence();
    this.stopFVAlarmSequence();
  }


  /**
   * Clear repetition timer
   */
  clearRepetition(): void {
    if (this.repetitionTimer) {
      clearTimeout(this.repetitionTimer);
      this.repetitionTimer = null;
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false || this.currentUtterance !== null;
  }

  /**
   * Play FC beep sound
   */
  playFCBeep(): void {
    if (!this.settings.enabled) {
      return;
    }

    try {
      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.8 * this.settings.volume, audioContext.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * this.settings.volume, audioContext.currentTime + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing FC beep:', error);
    }
  }

  /**
   * Start FC beep sequence
   */
  startFCBeepSequence(): void {
    this.stopFCBeepSequence();
    this.fcBeepTimer = setInterval(() => {
      this.playFCBeep();
    }, 2000);
  }

  /**
   * Stop FC beep sequence
   */
  stopFCBeepSequence(): void {
    if (this.fcBeepTimer) {
      clearInterval(this.fcBeepTimer);
      this.fcBeepTimer = null;
    }
  }

  /**
   * Play FV alarm beep
   */
  playFVAlarmBeep(): void {
    if (!this.settings.enabled) {
      return;
    }

    try {
      const audioContext = this.getAudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(1600, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(1.5 * this.settings.volume, audioContext.currentTime + 0.005);
      gainNode.gain.exponentialRampToValueAtTime(0.1 * this.settings.volume, audioContext.currentTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * this.settings.volume, audioContext.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing FV alarm beep:', error);
    }
  }

  /**
   * Start FV alarm sequence
   */
  startFVAlarmSequence(): void {
    this.stopFVAlarmSequence();
    this.fvAlarmTimer = setInterval(() => {
      this.playFVAlarmBeep();
    }, 1000);
  }

  /**
   * Stop alarm oscillator
   */
  private stopAlarmOscillator(): void {
    if (this.alarmOscillator) {
      try {
        this.alarmOscillator.stop();
      } catch (error) {
        // Oscillator might already be stopped
        console.warn('Alarm oscillator already stopped:', error);
      }
      this.alarmOscillator = null;
    }
  }

  /**
   * Stop legacy alarm sound (for cleanup compatibility)
   */
  private stopAlarmSound(): void {
    if (this.alarmSound) {
      this.alarmSound.pause();
      this.alarmSound.currentTime = 0;
    }
  }

  /**
   * Stop legacy charging sound (for cleanup compatibility)
   */
  private stopChargingSound(): void {
    if (this.chargingSound) {
      this.chargingSound.pause();
      this.chargingSound.currentTime = 0;
    }
  }

  /**
   * Stop FV alarm sequence
   */
  stopFVAlarmSequence(): void {
    if (this.fvAlarmTimer) {
      clearInterval(this.fvAlarmTimer);
      this.fvAlarmTimer = null;
    }
  }
}

export default AudioService;