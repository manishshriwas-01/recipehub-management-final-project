import { TestBed } from '@angular/core/testing';

import { Toxicity } from './toxicity';

describe('Toxicity', () => {
  let service: Toxicity;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Toxicity);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
