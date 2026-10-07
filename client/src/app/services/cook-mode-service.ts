import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CookModeService {

  private speech = window.speechSynthesis;

  private currentUtterance: SpeechSynthesisUtterance | null = null;

  speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void
  ): void {

    // Agar pehle se kuch bol raha hai to stop karo
    this.stop();

    if (!text || !text.trim()) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = () => {
      onEnd?.();
    };

    this.currentUtterance = utterance;

    this.speech.speak(utterance);
  }

  pause(): void {
    if (this.speech.speaking && !this.speech.paused) {
      this.speech.pause();
    }
  }

  resume(): void {
    if (this.speech.paused) {
      this.speech.resume();
    }
  }

  stop(): void {
    this.speech.cancel();
    this.currentUtterance = null;
  }

  isSpeaking(): boolean {
    return this.speech.speaking;
  }

  isPaused(): boolean {
    return this.speech.paused;
  }
}