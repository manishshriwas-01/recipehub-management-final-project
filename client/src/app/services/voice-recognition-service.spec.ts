import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { VoiceRecognitionService } from './voice-recognition-service';

describe('VoiceRecognitionService', () => {
  let service: VoiceRecognitionService;

  let mockRecognition: {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: ((event: any) => void) | null;
    onerror: ((event: any) => void) | null;
    onend: (() => void) | null;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRecognition = {
      lang: '',
      continuous: false,
      interimResults: false,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop: vi.fn(),
    };

    class MockSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      onresult: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;

      start = vi.fn();
      stop = vi.fn();

      constructor() {
        Object.assign(this, mockRecognition);
      }
    }

    (window as any).SpeechRecognition = MockSpeechRecognition;

    TestBed.configureTestingModule({});

    service = TestBed.inject(VoiceRecognitionService);
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should configure speech recognition', () => {
    const recognition = (service as any).recognition;

    expect(recognition).toBeTruthy();
    expect(recognition.lang).toBe('en-US');
    expect(recognition.continuous).toBe(false);
    expect(recognition.interimResults).toBe(false);
  });

  it('should start listening', () => {
    const recognition = (service as any).recognition;

    service.startListening();

    expect(recognition.start).toHaveBeenCalled();
  });

  it('should stop listening', () => {
    const recognition = (service as any).recognition;

    service.stopListening();

    expect(recognition.stop).toHaveBeenCalled();
  });

  it('should emit transcript when speech is recognized', () => {
    const transcriptSpy = vi.fn();

    service.transcript$.subscribe(transcriptSpy);

    const recognition = (service as any).recognition;

    recognition.onresult({
      results: [
        [
          {
            transcript: '  hello world  ',
          },
        ],
      ],
    });

    expect(transcriptSpy).toHaveBeenCalledWith(
      'hello world'
    );
  });

  it('should emit error when speech recognition fails', () => {
    const errorSpy = vi.fn();

    service.error$.subscribe(errorSpy);

    const recognition = (service as any).recognition;

    recognition.onerror({
      error: 'network',
    });

    expect(errorSpy).toHaveBeenCalledWith('network');
  });

  it('should emit when speech recognition ends', () => {
    const endSpy = vi.fn();

    service.end$.subscribe(endSpy);

    const recognition = (service as any).recognition;

    recognition.onend();

    expect(endSpy).toHaveBeenCalled();
  });
});