import { TestBed } from '@angular/core/testing';

import { ToxicityService } from './toxicity';

describe('ToxicityService', () => {
  let service: ToxicityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    service = TestBed.inject(ToxicityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return true when text is toxic', async () => {
    const mockModel = {
      classify: async () => [
        {
          label: 'toxicity',
          results: [
            {
              match: true,
              probabilities: [0.1, 0.9],
            },
          ],
        },
      ],
    };

    (service as any).model = mockModel;

    const result = await service.isToxic(
      'toxic text'
    );

    expect(result).toBe(true);
  });

  it('should return false when text is not toxic', async () => {
    const mockModel = {
      classify: async () => [
        {
          label: 'toxicity',
          results: [
            {
              match: false,
              probabilities: [0.9, 0.1],
            },
          ],
        },
      ],
    };

    (service as any).model = mockModel;

    const result = await service.isToxic(
      'nice recipe'
    );

    expect(result).toBe(false);
  });

  it('should return true if any prediction is toxic', async () => {
    const mockModel = {
      classify: async () => [
        {
          label: 'toxicity',
          results: [
            {
              match: false,
              probabilities: [0.9, 0.1],
            },
          ],
        },
        {
          label: 'insult',
          results: [
            {
              match: true,
              probabilities: [0.1, 0.9],
            },
          ],
        },
      ],
    };

    (service as any).model = mockModel;

    const result = await service.isToxic(
      'some text'
    );

    expect(result).toBe(true);
  });
});