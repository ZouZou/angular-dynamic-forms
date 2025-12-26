import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DqDynamicForm } from '../dq-dynamic-form/dq-dynamic-form';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [DqDynamicForm, RouterLink],
  templateUrl: './demo.html',
  styleUrl: './demo.scss'
})
export class Demo {
}
