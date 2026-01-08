import { Component, input, output, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormSection } from '../../models/field.model';

/**
 * Renders multi-step form navigation with progress indicator and nav buttons
 */
@Component({
  selector: 'dq-multi-step-navigation',
  template: `
    <!-- Progress indicator -->
    @if (showProgress()) {
      <div class="multi-step-progress">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="progressPercentage()"></div>
        </div>
        <div class="step-indicators">
          @for (section of sections(); track $index) {
            <div class="step-indicator"
                 [class.active]="$index === currentStep()"
                 [class.completed]="completedSteps().has($index)"
                 (click)="onStepClick($index)">
              <div class="step-number">
                @if (completedSteps().has($index)) {
                  <span class="checkmark">✓</span>
                } @else {
                  {{ $index + 1 }}
                }
              </div>
              <div class="step-label">{{ section.title }}</div>
            </div>
          }
        </div>
      </div>

      <!-- Current step header -->
      <div class="current-step-header">
        <h3 class="step-title">
          @if (currentSection()?.icon) {
            <span class="step-icon">{{ currentSection()?.icon }}</span>
          }
          {{ currentSection()?.title }}
        </h3>
        @if (currentSection()?.description) {
          <p class="step-description">{{ currentSection()?.description }}</p>
        }
      </div>
    }

    <!-- Navigation buttons -->
    @if (showNavigation()) {
      <div class="multi-step-navigation">
        <!-- Previous Button -->
        @if (canGoPrevious()) {
          <button
            type="button"
            class="nav-btn prev-btn"
            (click)="onPreviousClick()"
            aria-label="Go to previous step"
          >
            ← Previous
          </button>
        }

        <!-- Next Button (shown on all steps except last) -->
        @if (canGoNext()) {
          <button
            type="button"
            class="nav-btn next-btn"
            (click)="onNextClick()"
            aria-label="Go to next step"
          >
            Next →
          </button>
        }

        <!-- Submit Button (shown only on last step) -->
        @if (isLastStep() && showSubmitButton()) {
          <button
            class="submit-btn"
            type="submit"
            [disabled]="!isValid() || submitting()"
            [attr.aria-disabled]="!isValid() || submitting()"
            [attr.aria-busy]="submitting()"
            (click)="onSubmitClick()"
            aria-label="Submit form"
          >
            @if (submitting()) {
              <span class="spinner"></span>
              Submitting{{ retryCount() > 0 ? ' (Retry ' + retryCount() + ')' : '' }}...
            } @else {
              Submit
            }
          </button>
        }
      </div>
    }
  `,
  styles: [`
    .multi-step-progress {
      margin: var(--spacing-lg) 0 var(--spacing-xl);
      animation: fadeIn var(--transition-base) ease-out;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--color-gray-200);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: var(--spacing-lg);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      transition: width 0.4s ease-in-out;
      border-radius: 4px;
    }

    .step-indicators {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      flex-wrap: wrap;
    }

    .step-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--spacing-sm);
      cursor: pointer;
      transition: all var(--transition-base);
      padding: var(--spacing-sm);
      border-radius: var(--radius-md);
      flex: 1;
      min-width: 80px;
    }

    .step-indicator:hover {
      background: var(--color-gray-50);
    }

    .step-indicator.active .step-number {
      background: var(--color-primary);
      color: white;
      transform: scale(1.15);
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }

    .step-indicator.active .step-label {
      color: var(--color-primary);
      font-weight: 700;
    }

    .step-indicator.completed .step-number {
      background: var(--color-success);
      color: white;
    }

    .step-indicator.completed .step-number .checkmark {
      font-size: 1rem;
    }

    .step-indicator.completed .step-label {
      color: var(--color-success);
      font-weight: 600;
    }

    .step-indicator:not(.completed):not(.active) {
      opacity: 0.6;
    }

    .step-number {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-gray-300);
      color: var(--color-gray-700);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-sm);
    }

    .step-number .checkmark {
      font-size: 1.25rem;
    }

    .step-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-gray-600);
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      transition: all var(--transition-base);
      line-height: 1.2;
    }

    .current-step-header {
      margin: var(--spacing-xl) 0 var(--spacing-lg);
      padding: var(--spacing-lg);
      background: linear-gradient(135deg, var(--color-gray-50) 0%, white 100%);
      border-radius: var(--radius-lg);
      border-left: 4px solid var(--color-primary);
      animation: slideIn var(--transition-base) ease-out;
    }

    .step-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-gray-900);
      margin: 0 0 var(--spacing-sm);
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .step-icon {
      font-size: 1.75rem;
    }

    .step-description {
      font-size: 0.9375rem;
      color: var(--color-gray-600);
      margin: 0;
      line-height: 1.6;
    }

    .multi-step-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--spacing-md);
      margin-top: var(--spacing-xl);
      padding-top: var(--spacing-lg);
      border-top: 2px solid var(--color-gray-200);
    }

    .nav-btn {
      padding: 12px 24px;
      border: 2px solid var(--color-primary);
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-base);
      background: white;
      color: var(--color-primary);
      letter-spacing: 0.025em;
      text-transform: uppercase;
      box-shadow: var(--shadow-sm);
    }

    .nav-btn:hover {
      background: var(--color-primary);
      color: white;
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .nav-btn:active {
      transform: translateY(0);
      box-shadow: var(--shadow-sm);
    }

    .nav-btn.prev-btn {
      margin-right: auto;
    }

    .nav-btn.next-btn {
      margin-left: auto;
    }

    .submit-btn {
      width: 100%;
      padding: 14px 24px;
      margin-top: var(--spacing-md);
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 600;
      background: var(--color-primary);
      color: white;
      cursor: pointer;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-sm);
      letter-spacing: 0.025em;
      text-transform: uppercase;
    }

    .submit-btn:hover:not(:disabled) {
      background: var(--color-primary-dark);
      transform: translateY(-2px);
      box-shadow: var(--shadow-xl);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: var(--shadow-md);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: var(--color-gray-400);
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MultiStepNavigationComponent {
  // Inputs
  sections = input<FormSection[]>([]);
  currentStep = input<number>(0);
  completedSteps = input<Set<number>>(new Set());
  showProgress = input<boolean>(true);
  showNavigation = input<boolean>(true);
  showSubmitButton = input<boolean>(true);
  isValid = input<boolean>(false);
  submitting = input<boolean>(false);
  retryCount = input<number>(0);

  // Outputs
  stepClick = output<number>();
  nextClick = output<void>();
  previousClick = output<void>();
  submitClick = output<void>();

  // Computed values
  protected readonly progressPercentage = computed(() => {
    const sections = this.sections();
    if (sections.length === 0) return 0;
    return Math.round(((this.currentStep() + 1) / sections.length) * 100);
  });

  protected readonly currentSection = computed(() => {
    const sections = this.sections();
    const current = this.currentStep();
    return sections[current] || null;
  });

  protected readonly canGoNext = computed(() => {
    const sections = this.sections();
    const current = this.currentStep();
    return current < sections.length - 1;
  });

  protected readonly canGoPrevious = computed(() => {
    return this.currentStep() > 0;
  });

  protected readonly isLastStep = computed(() => {
    const sections = this.sections();
    const current = this.currentStep();
    return current === sections.length - 1;
  });

  protected onStepClick(stepIndex: number): void {
    this.stepClick.emit(stepIndex);
  }

  protected onNextClick(): void {
    this.nextClick.emit();
  }

  protected onPreviousClick(): void {
    this.previousClick.emit();
  }

  protected onSubmitClick(): void {
    this.submitClick.emit();
  }
}
