import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AiAssistant } from './ai-assistant';
import { AiService } from '../../services/ai-service';

describe('AiAssistant', () => {
  let component: AiAssistant;
  let fixture: ComponentFixture<AiAssistant>;
  let aiService: {
    chat: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    aiService = {
      chat: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AiAssistant],
      providers: [
        {
          provide: AiService,
          useValue: aiService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AiAssistant);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should send a message and display AI response', () => {
    aiService.chat.mockReturnValue(
      of({
        success: true,
        message: 'Try a simple paneer recipe.',
      })
    );

    component.message = 'What can I cook with paneer?';

    component.sendMessage();

    expect(aiService.chat).toHaveBeenCalledWith(
      'What can I cook with paneer?'
    );

    expect(component.messages()).toEqual([
      {
        role: 'user',
        text: 'What can I cook with paneer?',
      },
      {
        role: 'ai',
        text: 'Try a simple paneer recipe.',
      },
    ]);

    expect(component.loading()).toBe(false);
  });

  it('should not send an empty message', () => {
    component.message = '   ';

    component.sendMessage();

    expect(aiService.chat).not.toHaveBeenCalled();
    expect(component.messages()).toEqual([]);
  });

  it('should not send another message while loading', () => {
    component.message = 'Suggest dinner';

    component.loading.set(true);

    component.sendMessage();

    expect(aiService.chat).not.toHaveBeenCalled();
  });

  it('should show error when AI request fails', () => {
    aiService.chat.mockReturnValue(
      throwError(() => new Error('API error'))
    );

    component.message = 'Suggest dinner';

    component.sendMessage();

    expect(component.loading()).toBe(false);

    expect(component.errorMessage()).toBe(
      'Unable to get a response. Please try again.'
    );
  });
});