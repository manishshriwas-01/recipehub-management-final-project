import { Injectable } from '@angular/core';
import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

@Injectable({
  providedIn: 'root',
})
export class RecipeSimilarityService {

  private extractor?: FeatureExtractionPipeline;

  async loadModel(): Promise<void> {
    if (this.extractor) {
      return;
    }

    this.extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }

  async generateEmbedding(text: string): Promise<number[]> {
    await this.loadModel();

    const output = await this.extractor!(
      text,
      {
        pooling: 'mean',
        normalize: true,
      }
    );

    return Array.from(output.data);
  }
}