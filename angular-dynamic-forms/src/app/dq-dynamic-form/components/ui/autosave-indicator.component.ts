import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';

/**
 * Renders autosave indicator showing last saved time
 */
@Component({
  selector: 'dq-autosave-indicator',
  template: `
    @if (enabled() && lastSaved()) {
      <div class="autosave-indicator">
        <span class="autosave-icon">💾</span>
        <span class="autosave-text">{{ displayText() }}</span>
      </div>
    }
  `,
  styles: [`
    .autosave-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-sm);
      background: var(--color-gray-50);
      border-radius: var(--radius-md);
      font-size: 0.8125rem;
      color: var(--color-gray-600);
      animation: fadeIn var(--transition-base) ease-out;
    }

    .autosave-icon {
      font-size: 1rem;
      opacity: 0.7;
    }

    .autosave-text {
      font-weight: 500;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutosaveIndicatorComponent {
  // Inputs
  enabled = input<boolean>(false);
  lastSaved = input<Date | null>(null);

  // Computed display text
  protected readonly displayText = computed<string>(() => {
    const saved = this.lastSaved();
    if (!saved) return '';

    const now = new Date();
    const diff = Math.floor((now.getTime() - saved.getTime()) / 1000); // seconds

    if (diff < 60) return 'Saved just now';
    if (diff < 3600) return `Saved ${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `Saved ${Math.floor(diff / 3600)} hours ago`;
    return `Saved on ${saved.toLocaleDateString()}`;
  });
}
