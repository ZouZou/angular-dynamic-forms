import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { Field } from 'dq-dynamic-form';

/**
 * Editor for timeline field configuration
 * Note: Timeline items management is handled in the main editor interface.
 */
@Component({
  selector: 'fb-timeline-config-editor',
  template: `
    @if (field().type === 'timeline' && field().timelineConfig) {
      <div class="timeline-config-section config-section">
        <h4>📅 Timeline Configuration</h4>

        <!-- Timeline Items -->
        <div class="config-subsection">
          <h5>Timeline Items</h5>
          <p class="help-text">Timeline items configuration is handled in the main editor interface.</p>
        </div>

        <!-- Style Configuration -->
        <div class="config-subsection">
          <h5>Style</h5>

          <div class="form-group">
            <label>Layout</label>
            <select
              [value]="field().timelineConfig!.style?.layout || 'vertical'"
              (change)="timelineStyleChanged.emit({property: 'layout', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="vertical">Vertical</option>
              <option value="horizontal">Horizontal</option>
            </select>
          </div>

          <div class="form-group">
            <label>Alignment</label>
            <select
              [value]="field().timelineConfig!.style?.alignment || 'left'"
              (change)="timelineStyleChanged.emit({property: 'alignment', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="alternating">Alternating</option>
              <option value="center">Center</option>
            </select>
          </div>

          <div class="form-group">
            <label>Marker Style</label>
            <select
              [value]="field().timelineConfig!.style?.markerStyle || 'dot'"
              (change)="timelineStyleChanged.emit({property: 'markerStyle', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="dot">Dot</option>
              <option value="circle">Circle</option>
              <option value="icon">Icon</option>
            </select>
          </div>

          <div class="form-group">
            <label>Line Style</label>
            <select
              [value]="field().timelineConfig!.style?.lineStyle || 'solid'"
              (change)="timelineStyleChanged.emit({property: 'lineStyle', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
            </select>
          </div>

          <div class="style-checkboxes">
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="field().timelineConfig!.style?.cardStyle || false"
                  (change)="timelineStyleChanged.emit({property: 'cardStyle', value: $any($event.target).checked})"
                >
                Card Style
              </label>
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="field().timelineConfig!.style?.dense || false"
                  (change)="timelineStyleChanged.emit({property: 'dense', value: $any($event.target).checked})"
                >
                Dense/Compact
              </label>
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="field().timelineConfig!.style?.animated || false"
                  (change)="timelineStyleChanged.emit({property: 'animated', value: $any($event.target).checked})"
                >
                Animated
              </label>
            </div>
          </div>
        </div>

        <!-- Interaction Configuration -->
        <div class="config-subsection">
          <h5>Interaction</h5>

          <div class="interaction-checkboxes">
            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="field().timelineConfig!.interaction?.clickable || false"
                  (change)="timelineInteractionChanged.emit({property: 'clickable', value: $any($event.target).checked})"
                >
                Clickable Items
              </label>
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="field().timelineConfig!.interaction?.expandable || false"
                  (change)="timelineInteractionChanged.emit({property: 'expandable', value: $any($event.target).checked})"
                >
                Expandable Items
              </label>
            </div>

            <div class="form-group">
              <label>
                <input
                  type="checkbox"
                  [checked]="field().timelineConfig!.interaction?.hoverable || false"
                  (change)="timelineInteractionChanged.emit({property: 'hoverable', value: $any($event.target).checked})"
                >
                Hoverable
              </label>
            </div>
          </div>

          @if (field().timelineConfig!.interaction?.clickable) {
            <div class="form-group">
              <label>On Item Click Handler</label>
              <input
                type="text"
                [value]="field().timelineConfig!.interaction?.onItemClick || ''"
                (input)="timelineInteractionChanged.emit({property: 'onItemClick', value: $any($event.target).value})"
                class="form-control"
                placeholder="handleItemClick"
              >
            </div>
          }

          @if (field().timelineConfig!.interaction?.expandable) {
            <div class="form-group">
              <label>On Item Expand Handler</label>
              <input
                type="text"
                [value]="field().timelineConfig!.interaction?.onItemExpand || ''"
                (input)="timelineInteractionChanged.emit({property: 'onItemExpand', value: $any($event.target).value})"
                class="form-control"
                placeholder="handleItemExpand"
              >
            </div>
          }
        </div>

        <!-- General Options -->
        <div class="config-subsection">
          <h5>General Options</h5>

          <div class="form-group">
            <label>Date Format</label>
            <input
              type="text"
              [value]="field().timelineConfig!.dateFormat || 'MMM d, yyyy'"
              (input)="timelineConfigChanged.emit({property: 'dateFormat', value: $any($event.target).value})"
              class="form-control"
              placeholder="MMM d, yyyy"
            >
          </div>

          <div class="form-group">
            <label>Empty Message</label>
            <input
              type="text"
              [value]="field().timelineConfig!.emptyMessage || 'No timeline items'"
              (input)="timelineConfigChanged.emit({property: 'emptyMessage', value: $any($event.target).value})"
              class="form-control"
              placeholder="No timeline items"
            >
          </div>

          <div class="form-group">
            <label>
              <input
                type="checkbox"
                [checked]="field().timelineConfig!.showConnector !== false"
                (change)="timelineConfigChanged.emit({property: 'showConnector', value: $any($event.target).checked})"
              >
              Show Connector Line
            </label>
          </div>

          <div class="form-group">
            <label>Maximum Items</label>
            <input
              type="number"
              [value]="field().timelineConfig!.maxItems || ''"
              (input)="timelineConfigChanged.emit({property: 'maxItems', value: $any($event.target).value ? Number($any($event.target).value) : undefined})"
              class="form-control"
              min="1"
              placeholder="Unlimited"
            >
          </div>

          <div class="form-group">
            <label>Sort Order</label>
            <select
              [value]="field().timelineConfig!.sortOrder || 'desc'"
              (change)="timelineConfigChanged.emit({property: 'sortOrder', value: $any($event.target).value})"
              class="form-control"
            >
              <option value="asc">Ascending (oldest first)</option>
              <option value="desc">Descending (newest first)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Data Endpoint (API URL)</label>
            <input
              type="text"
              [value]="field().timelineConfig!.dataEndpoint || ''"
              (input)="timelineConfigChanged.emit({property: 'dataEndpoint', value: $any($event.target).value})"
              class="form-control"
              placeholder="/api/timeline"
            >
            <small class="text-muted">API endpoint to fetch timeline items dynamically</small>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .timeline-config-section {
      margin-top: var(--spacing-md);
      padding-top: var(--spacing-md);
      border-top: 1px solid #ddd;
    }

    h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-gray-700);
      margin: 0 0 var(--spacing-md) 0;
    }

    h5 {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-gray-600);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .config-subsection {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      background: var(--color-gray-50);
      border-radius: var(--radius-sm);
    }

    .help-text {
      font-size: 0.75rem;
      color: var(--color-gray-500);
      margin: 0;
    }

    .form-group {
      margin-bottom: var(--spacing-sm);

      &:last-child {
        margin-bottom: 0;
      }

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--color-gray-700);
        margin-bottom: var(--spacing-xs);
      }

      .form-control {
        width: 100%;
        padding: var(--spacing-sm);
        font-size: 0.875rem;
        border: 1px solid var(--color-gray-300);
        border-radius: var(--radius-sm);
        background: white;
        color: var(--color-gray-900);
        transition: border-color var(--transition-fast);

        &:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }
      }

      .text-muted {
        display: block;
        font-size: 0.75rem;
        color: var(--color-gray-500);
        margin-top: var(--spacing-xs);
      }

      input[type="checkbox"] {
        width: auto;
        margin-right: var(--spacing-xs);
      }
    }

    .style-checkboxes,
    .interaction-checkboxes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-sm);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineConfigEditorComponent {
  // Inputs
  field = input.required<Field>();

  // Outputs
  timelineConfigChanged = output<{property: string; value: unknown}>();
  timelineStyleChanged = output<{property: string; value: unknown}>();
  timelineInteractionChanged = output<{property: string; value: unknown}>();

  protected readonly Number = Number;
}
