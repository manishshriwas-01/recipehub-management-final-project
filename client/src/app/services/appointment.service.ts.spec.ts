import { TestBed } from '@angular/core/testing';

import { AppointmentServiceTs } from './appointment.service.ts';

describe('AppointmentServiceTs', () => {
  let service: AppointmentServiceTs;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppointmentServiceTs);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
