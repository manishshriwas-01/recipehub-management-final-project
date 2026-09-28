import { Injectable } from '@angular/core';
import { pipeline, TextClassificationPipeline } from '@huggingface/transformers';

@Injectable({
  providedIn: 'root'
})
export class SentimentService {
  private classifier?: TextClassificationPipeline;
  private readonly modelName =
    'Xenova/distilbert-base-uncased-finetuned-sst-2-english';

  async analyzeSentiment(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    if (!this.classifier) {
      this.classifier = await pipeline('sentiment-analysis', this.modelName);
    }

    const result = await this.classifier(text);
    const prediction = result[0];

    if (prediction.score < 0.65) {
      return 'neutral';
    }

    return prediction.label === 'POSITIVE' ? 'positive' : 'negative';
  }
}