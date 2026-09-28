import { Injectable } from '@angular/core';
import * as toxicity from '@tensorflow-models/toxicity';

@Injectable({
  providedIn: 'root'
})
export class ToxicityService {
  private model?: toxicity.ToxicityClassifier;
  private readonly threshold = 0.8;

  async isToxic(text: string): Promise<boolean> {
    if (!this.model) {
      this.model = await toxicity.load(this.threshold, [
        'toxicity',
        'severe_toxicity',
        'identity_attack',
        'insult',
        'obscene',
        'sexual_explicit',
        'threat',
      ]);
    }

    const predictions = await this.model.classify([text]);

    return predictions.some(
      prediction => prediction.results[0].match === true
    );
  }
}