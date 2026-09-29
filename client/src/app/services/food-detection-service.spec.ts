import { TestBed } from '@angular/core/testing';

import { FoodDetectionService } from './food-detection-service';

describe('FoodDetectionService', () => {
  let service: FoodDetectionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FoodDetectionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
