import { TestBed } from '@angular/core/testing';

import { Sentiment } from './sentiment';

describe('Sentiment', () => {
  let service: Sentiment;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Sentiment);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
