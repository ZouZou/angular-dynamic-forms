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
