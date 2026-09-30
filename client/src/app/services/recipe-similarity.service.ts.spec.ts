import { TestBed } from '@angular/core/testing';

import { RecipeSimilarityServiceTs } from './recipe-similarity.service.ts';

describe('RecipeSimilarityServiceTs', () => {
  let service: RecipeSimilarityServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RecipeSimilarityServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
