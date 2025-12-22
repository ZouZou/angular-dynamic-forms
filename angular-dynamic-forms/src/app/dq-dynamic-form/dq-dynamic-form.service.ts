import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Field } from './models/field.model';

@Injectable()
export class DynamicFormsService {
  constructor(private http: HttpClient) {}

  getFormSchema(): Observable<{ title: string; fields: Field[] }> {
    return this.http.get<{ title: string; fields: Field[] }>(
      'forms/sample-form.json'
    );
  }
}
