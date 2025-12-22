import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DqDynamicForm } from './dq-dynamic-form/dq-dynamic-form';

@Component({
  selector: 'app-root',
  imports: [DqDynamicForm],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('angular-dynamic-forms');
}
