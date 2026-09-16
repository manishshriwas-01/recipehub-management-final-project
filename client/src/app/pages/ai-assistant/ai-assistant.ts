import {
  AfterViewChecked,
  Component,
  ElementRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';

import { AiService } from '../../services/ai-service';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-ai-assistant',
  imports: [FormsModule],
  templateUrl: './ai-assistant.html',
  styleUrl: './ai-assistant.css',
})
export class AiAssistant implements AfterViewChecked {
  private aiService = inject(AiService);

  @ViewChild('chatBox')
  private chatBox!: ElementRef<HTMLDivElement>;

  message = '';

  loading = signal(false);

  errorMessage = signal('');

  messages = signal<ChatMessage[]>([]);

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  sendMessage(): void {
    const message = this.message.trim();

    if (!message || this.loading()) {
      return;
    }

    this.messages.update((messages) => [
      ...messages,
      {
        role: 'user',
        text: message,
      },
    ]);

    this.message = '';
    this.errorMessage.set('');
    this.loading.set(true);

    this.aiService.chat(message).subscribe({
      next: (response) => {
        this.messages.update((messages) => [
          ...messages,
          {
            role: 'ai',
            text: response.message,
          },
        ]);

        this.loading.set(false);
      },

      error: () => {
        this.errorMessage.set(
          'Unable to get a response. Please try again.'
        );

        this.loading.set(false);
      },
    });
  }

  formatAiResponse(text: string): string {
    return marked.parse(text) as string;
  }

  private scrollToBottom(): void {
    if (this.chatBox) {
      this.chatBox.nativeElement.scrollTop =
        this.chatBox.nativeElement.scrollHeight;
    }
  }
}