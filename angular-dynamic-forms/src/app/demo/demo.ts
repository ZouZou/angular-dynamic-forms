import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DqDynamicForm } from '../dq-dynamic-form/dq-dynamic-form';

@Component({
  selector: 'app-demo',
  imports: [DqDynamicForm, RouterLink],
  templateUrl: './demo.html',
  styleUrl: './demo.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Demo {
}
