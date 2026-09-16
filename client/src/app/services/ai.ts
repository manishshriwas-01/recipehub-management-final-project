import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';


interface AiResponse{
  success:Boolean,
  message:string;

}

@Injectable({
  providedIn: 'root',
})
export class Ai {
  private http=inject(HttpClient);
  private apiUrl=`${environment.apiUrl}/ai`;

  chat(message:string):Observable<AiResponse>{
    return this.http.post<AiResponse>(`${this.apiUrl}/chat`,{
      message,
    });
  }
}
