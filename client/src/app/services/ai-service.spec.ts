import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { AiService } from './ai-service';
import { environment } from '../../environments/environment';

describe('AiService', () => {
  let service: AiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(AiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send a message to the AI API', () => {
    const message = 'Suggest a vegetarian dinner';

    service.chat(message).subscribe((response) => {
      expect(response.success).toBe(true);
      expect(response.message).toBe(
        'Try paneer butter masala.'
      );
    });

    const req = httpMock.expectOne(
      `${environment.apiUrl}/ai/chat`
    );

    expect(req.request.method).toBe('POST');

    expect(req.request.body).toEqual({
      message,
    });

    req.flush({
      success: true,
      message: 'Try paneer butter masala.',
    });
  });
});