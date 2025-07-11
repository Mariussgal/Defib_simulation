interface AudioSettings {
  enabled: boolean;
  volume: number;
  language: string;
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
  private chargingSound: HTMLAudioElement | null = null;
  private alarmSound: HTMLAudioElement | null = null;
  private alarmOscillator: OscillatorNode | null = null;
  private audioContext: AudioContext | null = null;
  private fcBeepTimer: NodeJS.Timeout | null = null;
  private fcBeepOscillator: OscillatorNode | null = null;
  private fvAlarmTimer: NodeJS.Timeout | null = null;
  private fcBeepTimer: NodeJS.Timeout | null = null;
  private fcBeepOscillator: OscillatorNode | null = null;
  private fvAlarmTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    this.synthesis = window.speechSynthesis;
    if (!this.synthesis) {
      return;
    }

    const voices = this.synthesis.getVoices();
    const frenchVoice = voices.find(voice => voice.lang.includes('fr'));

    this.chargingSound = new Audio();
    this.chargingSound.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU';

    this.alarmSound = new Audio();
    this.alarmSound.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU';
    this.alarmSound.loop = true;
  }

  // Configuration des paramètres audio
  updateSettings(settings: Partial<AudioSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  playMessage(text: string, options?: { priority?: boolean; repeat?: boolean; repeatInterval?: number }): void {
    if (!this.settings.enabled) {
      return;
    }

    if (!this.synthesis) {
      return;
    }

    // Si priorité, arrêter le message actuel
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

  // Messages spécifiques du DAE
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
      repeatInterval: 10000 // 10 secondes
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

  // Méthode pour jouer le son de charge
  playChargingSound(): void {
    if (this.chargingSound) {
      this.chargingSound.currentTime = 0;
      this.chargingSound.play().catch(error => {
        console.error('Error playing charging sound:', error);
      });
    }
  }

  // Méthode pour jouer l'alarme
  playAlarmSound(): void {
    if (this.alarmSound) {
      this.alarmSound.currentTime = 0;
      this.alarmSound.play().catch(error => {
        console.error('Error playing alarm sound:', error);
      });
    }
  }

  // Méthode pour arrêter l'alarme
  stopAlarmSound(): void {
    if (this.alarmSound) {
      this.alarmSound.pause();
      this.alarmSound.currentTime = 0;
    }
  }

  // Méthode pour arrêter l'alarme
  stopAlarm(): void {
    if (this.alarmOscillator) {
      this.alarmOscillator.stop();
      this.alarmOscillator = null;
    }
  }

  playChargingSequence(): void {
    this.stopAll();

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(880, this.audioContext.currentTime + 5);

    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 5);

    // Après 5 secondes
    setTimeout(() => {
      // Générer une alarme aiguë
      this.alarmOscillator = this.audioContext!.createOscillator();
      const alarmGain = this.audioContext!.createGain();

      this.alarmOscillator.type = 'square';
      this.alarmOscillator.frequency.setValueAtTime(1000, this.audioContext!.currentTime);

      alarmGain.gain.setValueAtTime(0.05, this.audioContext!.currentTime);

      this.alarmOscillator.connect(alarmGain);
      alarmGain.connect(this.audioContext!.destination);

      this.alarmOscillator.start();

      // Jouer les messages vocaux
      this.playDAEChoc();
      setTimeout(() => {
        this.playDAEboutonOrange();
      }, 2000);
    }, 5000);
  }

  stopAll(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.clearRepetition();
    this.currentUtterance = null;
    this.stopAlarmSound();
    if (this.chargingSound) {
      this.chargingSound.pause();
      this.chargingSound.currentTime = 0;
    }
    this.stopAlarm();
    this.stopFCBeepSequence();
    this.stopFVAlarmSequence();
  }

  // Arrêter uniquement les répétitions
  clearRepetition(): void {
    if (this.repetitionTimer) {
      clearTimeout(this.repetitionTimer);
      this.repetitionTimer = null;
    }
  }

  // Vérifier si un message est en cours
  isSpeaking(): boolean {
    return this.synthesis ? this.synthesis.speaking : false || this.currentUtterance !== null;
  }

  // bip quand FC pas cliquée 
  playFCBeep(): void {
    if (!this.settings.enabled) {
      return;
    }

    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Réactive l'AudioContext si suspendu (iOS)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.playFCBeepSound();
        }).catch(error => {
          console.error('Error resuming audio context:', error);
        });
      } else {
        this.playFCBeepSound();
      }
    } catch (error) {
      console.error('Error playing FC beep:', error);
    }
  }

  private playFCBeepSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.8 * this.settings.volume, this.audioContext.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  // Démare les bips répétitifs pour la FC
  startFCBeepSequence(): void {
    // Arrêter toute séquence existante
    this.stopFCBeepSequence();

    // bips toutes les 2 secondes
    this.fcBeepTimer = setInterval(() => {
      this.playFCBeep();
    }, 2000);
  }

  // Arrête bips répétitifs pour la FC
  stopFCBeepSequence(): void {
    if (this.fcBeepTimer) {
      clearInterval(this.fcBeepTimer);
      this.fcBeepTimer = null;
    }

    if (this.fcBeepOscillator) {
      this.fcBeepOscillator.stop();
      this.fcBeepOscillator = null;
    }
  }

  // Bip d'alarme pour fibrillation ventriculaire 
  playFVAlarmBeep(): void {
    if (!this.settings.enabled) {
      return;
    }

    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          this.playFVAlarmSound();
        }).catch(error => {
          console.error('Error resuming audio context for FV alarm:', error);
        });
      } else {
        this.playFVAlarmSound();
      }
    } catch (error) {
      console.error('Error playing FV alarm beep:', error);
    }
  }

  private playFVAlarmSound(): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(1600, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(1.5 * this.settings.volume, this.audioContext.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.1, this.audioContext.currentTime + 0.3); // Maintient le son plus longtemps
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5); // Decay plus long = bip long

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.5); // Bip 500ms 
  }

  startFVAlarmSequence(): void {
    this.stopFVAlarmSequence();

    this.fvAlarmTimer = setInterval(() => {
      this.playFVAlarmBeep();
    }, 1000);
  }

  stopFVAlarmSequence(): void {
    if (this.fvAlarmTimer) {
      clearInterval(this.fvAlarmTimer);
      this.fvAlarmTimer = null;
    }
  }

  //  son de clic bouton rotatif)
  playClickSound(): void {
    if (!this.settings.enabled) {
      return;
    }

    //  Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.08);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15 * this.settings.volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.08);
    } catch (error) {
      console.error('Error playing click sound:', error);
    }
  }
}

export default AudioService;