import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DqDynamicForm } from './dq-dynamic-form';

describe('DqDynamicForm', () => {
  let component: DqDynamicForm;
  let fixture: ComponentFixture<DqDynamicForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DqDynamicForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DqDynamicForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
