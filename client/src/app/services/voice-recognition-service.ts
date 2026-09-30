import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VoiceRecognitionService {

  private recognition: any;

  private transcriptSubject =new Subject<string>();

  transcript$ =this.transcriptSubject.asObservable();

  private errorSubject = new Subject<string>();
error$ = this.errorSubject.asObservable();

private endSubject = new Subject<void>();
end$ = this.endSubject.asObservable();

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.recognition =
        new SpeechRecognition();

      this.recognition.lang = 'en-US';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult =
        (event: any) => {

          const transcript =
            event.results[0][0]
              .transcript
              .trim();

          console.log(
            'Recognized text:',
            transcript
          );

          this.transcriptSubject.next(
            transcript
          );
        };
    }
  this.recognition.onerror = (event: any) => {
  console.error('Speech recognition error:', event.error);

  this.errorSubject.next(event.error);
};
   this.recognition.onend = () => {
  console.log('Speech recognition ended');

  this.endSubject.next();
};
  }

  startListening(): void {
    if (!this.recognition) {
      console.error(
        'Speech recognition is not supported'
      );
      return;
    }

    this.recognition.start();
  }

  stopListening(): void {
    if (!this.recognition) {
      return;
    }

    this.recognition.stop();
  }
}