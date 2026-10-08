import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { SentimentService } from './sentiment';

describe('SentimentService', () => {
  let service: SentimentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(
      SentimentService
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return positive for a positive prediction', async () => {
    const mockClassifier = vi
      .fn()
      .mockResolvedValue([
        {
          label: 'POSITIVE',
          score: 0.95,
        },
      ]);

    (service as any).classifier = mockClassifier;

    const result =
      await service.analyzeSentiment(
        'I love this recipe'
      );

    expect(result).toBe('positive');

    expect(mockClassifier).toHaveBeenCalledWith(
      'I love this recipe'
    );
  });

  it('should return negative for a negative prediction', async () => {
    const mockClassifier = vi
      .fn()
      .mockResolvedValue([
        {
          label: 'NEGATIVE',
          score: 0.90,
        },
      ]);

    (service as any).classifier = mockClassifier;

    const result =
      await service.analyzeSentiment(
        'This recipe is terrible'
      );

    expect(result).toBe('negative');

    expect(mockClassifier).toHaveBeenCalledWith(
      'This recipe is terrible'
    );
  });

  it('should return neutral when score is below 0.65', async () => {
    const mockClassifier = vi
      .fn()
      .mockResolvedValue([
        {
          label: 'POSITIVE',
          score: 0.50,
        },
      ]);

    (service as any).classifier = mockClassifier;

    const result =
      await service.analyzeSentiment(
        'This recipe is okay'
      );

    expect(result).toBe('neutral');
  });

  it('should reuse the existing classifier', async () => {
    const mockClassifier = vi
      .fn()
      .mockResolvedValue([
        {
          label: 'POSITIVE',
          score: 0.90,
        },
      ]);

    (service as any).classifier = mockClassifier;

    await service.analyzeSentiment('Great recipe');
    await service.analyzeSentiment('Amazing recipe');

    expect(mockClassifier).toHaveBeenCalledTimes(2);
  });
});