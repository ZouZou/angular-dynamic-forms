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
