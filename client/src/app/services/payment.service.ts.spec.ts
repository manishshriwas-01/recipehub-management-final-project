import { TestBed } from '@angular/core/testing';

import { PaymentServiceTs } from './payment.service.ts';

describe('PaymentServiceTs', () => {
  let service: PaymentServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PaymentServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
