import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RecipeSimilarityService } from './recipe-similarity.service.ts';

describe('RecipeSimilarityService', () => {
  let service: RecipeSimilarityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(RecipeSimilarityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return embedding for given text', async () => {
    const mockExtractor = vi.fn().mockResolvedValue({
      data: new Float32Array([0.1, 0.2, 0.3, 0.4]),
    });

    (service as any).extractor = mockExtractor;

    const result = await service.generateEmbedding('Paneer butter masala');

    const expected = [0.1, 0.2, 0.3, 0.4];

    expect(result).toHaveLength(expected.length);

    result.forEach((value, index) => {
      expect(value).toBeCloseTo(expected[index], 5);
    });

    expect(mockExtractor).toHaveBeenCalledWith(
      'Paneer butter masala',
      {
        pooling: 'mean',
        normalize: true,
      }
    );
  });

  it('should not reload the model when extractor already exists', async () => {
    const mockExtractor = vi.fn();

    (service as any).extractor = mockExtractor;

    await service.loadModel();

    expect((service as any).extractor).toBe(mockExtractor);
  });
});