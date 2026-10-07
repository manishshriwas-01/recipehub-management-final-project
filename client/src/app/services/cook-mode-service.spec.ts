import { TestBed } from '@angular/core/testing';

import { CookModeService } from './cook-mode-service';

describe('CookModeService', () => {
  let service: CookModeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CookModeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
