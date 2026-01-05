export interface FieldOption {
  value: string;
  label: string;
}

// Conditional visibility operators
export type VisibilityOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

// Simple visibility condition
export interface SimpleVisibilityCondition {
  field: string;
  operator: VisibilityOperator;
  value?: any;
}

// Complex visibility condition with AND/OR logic
export interface ComplexVisibilityCondition {
  operator: 'and' | 'or';
  conditions: (SimpleVisibilityCondition | ComplexVisibilityCondition)[];
}

export type VisibilityCondition = SimpleVisibilityCondition | ComplexVisibilityCondition;

// Cross-field validation rules
export interface FieldValidations {
  required?: boolean;                      // Field is required
  minLength?: number;                      // Minimum string length
  maxLength?: number;                      // Maximum string length
  requiredTrue?: boolean;                  // Checkbox must be checked
  matchesField?: string;                   // Value must match another field (e.g., password confirmation)
  requiredIf?: {                           // Field is required if condition is met
    field: string;
    operator: VisibilityOperator;
    value?: any;
  };
  greaterThanField?: string;               // Value must be greater than another field (for dates/numbers)
  lessThanField?: string;                  // Value must be less than another field (for dates/numbers)
  pattern?: string | RegExp;               // Custom regex pattern
  customMessage?: string;                  // Custom error message
  asyncValidator?: AsyncValidator;         // Async validation via API
}

// Async validation configuration
export interface AsyncValidator {
  endpoint: string;                        // API endpoint to validate against
  method?: 'GET' | 'POST';                 // HTTP method (default: POST)
  debounceMs?: number;                     // Debounce delay in milliseconds (default: 300)
  errorMessage?: string;                   // Custom error message for validation failure
  validWhen?: 'exists' | 'notExists' | 'custom'; // Validation condition (default: 'custom')
  // For 'custom' validWhen, the API should return { valid: boolean, message?: string }
}

// Value transformation configuration
export interface ValueTransform {
  dependsOn: string;                       // Parent field to watch
  mappings: Record<string, any>;           // Map parent values to this field's values
  default?: any;                           // Default value if parent value not in mappings
  clearOnEmpty?: boolean;                  // Clear this field when parent is empty (default: true)
}

export interface Field {
  type: string;
  label: string;
  name: string;
  options?: string[] | FieldOption[];
  dependsOn?: string | string[]; // Single parent or multiple parent dependencies
  optionsMap?: Record<string, FieldOption[]>;
  optionsEndpoint?: string; // API endpoint to fetch options dynamically
  dependencyType?: 'same' | 'opposite'; // For checkbox dependencies: 'same' = both checked/unchecked together, 'opposite' = inverse relationship
  validations?: FieldValidations;
  visibleWhen?: VisibilityCondition; // Conditional visibility
  hideUntilDependenciesMet?: boolean; // Auto-hide field until all dependencies have values (default: false)
  valueTransform?: ValueTransform; // Automatic value transformation based on parent field
  placeholder?: string; // Custom placeholder text
  rows?: number; // For textarea
  min?: number; // For number and date inputs
  max?: number; // For number and date inputs
  step?: number; // For number inputs
  layout?: 'horizontal' | 'vertical'; // For radio buttons
  readonly?: boolean; // Field is read-only
  disabled?: boolean; // Field is disabled
  cssClass?: string; // Custom CSS class
  width?: 'full' | 'half' | 'third' | 'quarter'; // Field width
  // Dynamic field array (repeater) configuration
  arrayConfig?: ArrayFieldConfig; // For type 'array' - repeatable field groups
  // Field masking and formatting
  mask?: FieldMask; // Input mask configuration
  // Computed/calculated field
  computed?: ComputedFieldConfig; // Auto-calculate value based on other fields

  // File upload specific (for type 'file')
  accept?: string; // MIME types or file extensions (e.g., "image/*", ".pdf,.doc")
  multiple?: boolean; // Allow multiple file uploads
  maxFileSize?: number; // Max file size in bytes

  // Multi-select specific (for type 'multiselect')
  minSelections?: number; // Minimum number of selections
  maxSelections?: number; // Maximum number of selections

  // Select specific (for type 'select' and 'multiselect')
  searchable?: boolean; // Enable search/filter for select fields with many options

  // DateTime specific (for type 'datetime')
  includeTime?: boolean; // For datetime vs date
  timezone?: string; // IANA timezone (e.g., "America/New_York")

  // Rich text editor specific (for type 'richtext')
  allowedFormats?: string[]; // e.g., ['bold', 'italic', 'underline', 'link']
  maxCharacters?: number; // Maximum character count

  // DataTable specific (for type 'datatable')
  tableConfig?: DataTableConfig; // DataTable configuration

  // Timeline specific (for type 'timeline')
  timelineConfig?: TimelineConfig; // Timeline configuration
}

// Field mask configuration
export type FieldMask =
  | 'phone'           // (123) 456-7890
  | 'phone-intl'      // +1 (123) 456-7890
  | 'credit-card'     // 1234 5678 9012 3456
  | 'ssn'             // 123-45-6789
  | 'zip'             // 12345
  | 'zip-plus4'       // 12345-6789
  | 'currency'        // $1,234.56
  | 'date-us'         // MM/DD/YYYY
  | 'time'            // HH:MM
  | FieldMaskConfig;  // Custom configuration

// Custom mask configuration
export interface FieldMaskConfig {
  type: 'custom';
  pattern: string;              // Mask pattern (0=digit, A=letter, *=alphanumeric, \=escape)
  placeholder?: string;         // Placeholder character (default: _)
  prefix?: string;              // Prefix to add (e.g., $, +1)
  suffix?: string;              // Suffix to add (e.g., %, kg)
  showMaskOnHover?: boolean;    // Show mask pattern on hover (default: true)
  showMaskOnFocus?: boolean;    // Show mask pattern on focus (default: true)
}

// Configuration for dynamic field arrays (repeaters)
export interface ArrayFieldConfig {
  fields: Field[]; // Template fields for each array item
  minItems?: number; // Minimum number of items (default: 0)
  maxItems?: number; // Maximum number of items (default: unlimited)
  initialItems?: number; // Number of items to show initially (default: 1)
  addButtonText?: string; // Custom text for add button (default: "Add {label}")
  removeButtonText?: string; // Custom text for remove button (default: "Remove")
  itemLabel?: string; // Label for each item (default: "{label} {index}")
}

// Form section/step for multi-step forms
export interface FormSection {
  title: string;
  description?: string;
  fields: Field[];
  icon?: string; // Optional icon name
}

// Form submission configuration
export interface FormSubmission {
  endpoint?: string;                       // API endpoint to submit form data
  method?: 'POST' | 'PUT' | 'PATCH';      // HTTP method (default: POST)
  headers?: Record<string, string>;        // Custom headers
  successMessage?: string;                 // Success message to display
  errorMessage?: string;                   // Error message to display
  redirectOnSuccess?: string;              // URL to redirect after success
  showDataOnSuccess?: boolean;             // Show submitted data (default: true)
}

// Autosave configuration
export interface AutosaveConfig {
  enabled: boolean;                        // Enable autosave
  intervalSeconds?: number;                // Save interval in seconds (default: 30)
  storage?: 'localStorage' | 'sessionStorage'; // Storage type (default: localStorage)
  key?: string;                            // Custom storage key (default: formDraft_{formTitle})
  expirationDays?: number;                 // Days until draft expires (default: 7)
  showIndicator?: boolean;                 // Show "Last saved" indicator (default: true)
}

// Computed/calculated field configuration
export interface ComputedFieldConfig {
  formula: string;                  // Formula to calculate (e.g., "price * quantity", "firstName + ' ' + lastName")
  dependencies: string[];           // Field names this computation depends on
  decimal?: number;                 // Decimal places for numbers (default: 2)
  prefix?: string;                  // Prefix (e.g., "$", "Total: ")
  suffix?: string;                  // Suffix (e.g., "%", " kg")
  formatAs?: 'number' | 'currency' | 'text'; // Output format (default: based on result type)
}

// Form schema with optional multi-step support
export interface FormSchema {
  title: string;
  description?: string;
  fields?: Field[]; // For single-step forms
  sections?: FormSection[]; // For multi-step forms
  multiStep?: boolean; // Enable multi-step mode
  submission?: FormSubmission; // Submission configuration
  autosave?: AutosaveConfig; // Autosave configuration
  i18n?: I18nConfig; // Internationalization configuration
}

// Internationalization configuration
export interface I18nConfig {
  enabled: boolean;                    // Enable i18n support
  defaultLocale: string;               // Default locale (e.g., 'en-US')
  availableLocales: string[];          // List of available locales
  translations: Record<string, any>;   // Translation objects keyed by locale
  dateFormat?: string;                 // Date format per locale (e.g., 'MM/DD/YYYY')
  direction?: 'ltr' | 'rtl';          // Text direction (auto-detected from locale)
}

// DataTable column configuration
export interface DataTableColumn {
  key: string;                         // Property key in row data
  label: string;                       // Column header label
  width?: string;                      // Column width (e.g., '100px', '20%')
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'avatar' | 'link' | 'actions'; // Column data type
  sortable?: boolean;                  // Enable sorting for this column (default: false)
  filterable?: boolean;                // Enable filtering for this column (default: false)
  align?: 'left' | 'center' | 'right'; // Text alignment (default: 'left')
  format?: string;                     // Format string for dates/numbers (e.g., 'MM/DD/YYYY', '$0,0.00')
  // For 'badge' type
  badgeColorMap?: Record<string, string>; // Map values to badge colors (e.g., { 'Pending': 'warning', 'Settled': 'success', 'Closed': 'secondary' })
  // For 'avatar' type
  avatarKey?: string;                  // Property key for avatar image URL (separate from text)
  avatarFallback?: string;             // Fallback text/initials if no image
  // For 'link' type
  linkTemplate?: string;               // URL template with {{placeholders}} (e.g., '/claims/{{id}}')
  linkTarget?: '_blank' | '_self';     // Link target (default: '_self')
  // For 'actions' type
  actions?: DataTableAction[];         // Array of action buttons/menus
}

// DataTable action configuration
export interface DataTableAction {
  label: string;                       // Action label
  icon?: string;                       // Icon class/name (optional)
  type?: 'button' | 'menu';           // Action type (default: 'button')
  color?: 'primary' | 'secondary' | 'danger' | 'warning'; // Action color
  onClick?: string;                    // Event handler name or action identifier
  visibleWhen?: string;                // Condition for visibility (evaluated with row context)
  menuItems?: DataTableActionMenuItem[]; // Sub-actions for menu type
}

// DataTable action menu item
export interface DataTableActionMenuItem {
  label: string;                       // Menu item label
  icon?: string;                       // Icon class/name (optional)
  onClick?: string;                    // Event handler name or action identifier
  visibleWhen?: string;                // Condition for visibility (evaluated with row context)
}

// DataTable row data
export interface DataTableRow {
  id?: string | number;                // Unique row identifier (for selection/tracking)
  [key: string]: any;                  // Dynamic properties matching column keys
}

// DataTable pagination configuration
export interface DataTablePagination {
  enabled: boolean;                    // Enable pagination (default: true)
  rowsPerPage?: number;                // Rows per page (default: 10)
  rowsPerPageOptions?: number[];       // Available rows per page options (default: [10, 25, 50, 100])
  showPageInfo?: boolean;              // Show "1-10 of 100" info (default: true)
}

// DataTable filter configuration
export interface DataTableFilter {
  enabled: boolean;                    // Enable global search/filter (default: false)
  placeholder?: string;                // Search input placeholder (default: 'Search...')
  searchColumns?: string[];            // Columns to search (default: all text columns)
  debounceMs?: number;                 // Debounce delay in milliseconds (default: 300)
}

// DataTable selection configuration
export interface DataTableSelection {
  enabled: boolean;                    // Enable row selection (default: false)
  mode?: 'single' | 'multiple';       // Selection mode (default: 'multiple')
  showSelectAll?: boolean;             // Show select all checkbox (default: true for multiple mode)
}

// Complete DataTable configuration
export interface DataTableConfig {
  columns: DataTableColumn[];          // Column definitions
  rows?: DataTableRow[];               // Static row data (can also be loaded via API)
  dataEndpoint?: string;               // API endpoint to fetch data dynamically
  pagination?: DataTablePagination;    // Pagination settings
  filter?: DataTableFilter;            // Filter/search settings
  selection?: DataTableSelection;      // Row selection settings
  // Styling options
  striped?: boolean;                   // Alternate row colors (default: false)
  bordered?: boolean;                  // Show table borders (default: true)
  hoverable?: boolean;                 // Highlight row on hover (default: true)
  dense?: boolean;                     // Compact row height (default: false)
  // Sorting
  defaultSort?: {                      // Default sort configuration
    column: string;                    // Column key to sort by
    direction: 'asc' | 'desc';        // Sort direction
  };
  // Empty state
  emptyMessage?: string;               // Message when no data (default: 'No data available')
  // Actions
  onRowClick?: string;                 // Event handler for row click
  onSelectionChange?: string;          // Event handler for selection change
}

// Timeline item status types
export type TimelineItemStatus = 'completed' | 'in-progress' | 'pending' | 'cancelled';

// Timeline item configuration
export interface TimelineItem {
  id: string | number;                 // Unique item identifier
  title: string;                       // Item title/heading
  description?: string;                // Item description/details
  timestamp?: string | Date;           // Item date/time
  icon?: string;                       // Icon to display (emoji, icon class, or SVG)
  status?: TimelineItemStatus;         // Item status (affects styling)
  badge?: TimelineBadge;               // Optional badge/label
  link?: TimelineLink;                 // Optional link
  metadata?: TimelineMetadata[];       // Additional metadata fields
  position?: 'left' | 'right' | 'center'; // For alternating layouts (auto if not specified)
  expanded?: boolean;                  // Initial expanded state (for expandable items)
}

// Timeline badge configuration
export interface TimelineBadge {
  label: string;                       // Badge text
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'; // Badge color
  outlined?: boolean;                  // Use outlined style (default: false)
}

// Timeline link configuration
export interface TimelineLink {
  url: string;                         // Link URL
  label?: string;                      // Link text (default: 'View details')
  target?: '_blank' | '_self';         // Link target (default: '_self')
  icon?: string;                       // Optional icon for link
}

// Timeline metadata field
export interface TimelineMetadata {
  key: string;                         // Metadata key/label
  value: string;                       // Metadata value
  icon?: string;                       // Optional icon
}

// Timeline grouping configuration
export interface TimelineGrouping {
  enabled: boolean;                    // Enable grouping (default: false)
  groupBy: 'year' | 'month' | 'custom'; // Grouping strategy
  customGroupField?: string;           // Custom field to group by (for 'custom' groupBy)
  showGroupLabels?: boolean;           // Show group labels (default: true)
  groupLabelFormat?: string;           // Format for group labels (e.g., 'YYYY', 'MMMM YYYY')
}

// Timeline style/layout configuration
export interface TimelineStyle {
  layout?: 'vertical' | 'horizontal';  // Timeline orientation (default: 'vertical')
  alignment?: 'left' | 'center' | 'right' | 'alternating'; // Item alignment (default: 'left')
  markerStyle?: 'dot' | 'icon' | 'number' | 'none'; // Marker/connector style (default: 'dot')
  lineStyle?: 'solid' | 'dashed' | 'dotted' | 'none'; // Connecting line style (default: 'solid')
  cardStyle?: boolean;                 // Use card/box style for items (default: false)
  dense?: boolean;                     // Compact spacing (default: false)
  animated?: boolean;                  // Enable animations (default: true)
}

// Timeline interaction configuration
export interface TimelineInteraction {
  clickable?: boolean;                 // Items are clickable (default: false)
  expandable?: boolean;                // Items can be expanded/collapsed (default: false)
  hoverable?: boolean;                 // Highlight on hover (default: true)
  onItemClick?: string;                // Event handler for item click
  onItemExpand?: string;               // Event handler for item expand/collapse
}

// Complete Timeline configuration
export interface TimelineConfig {
  items?: TimelineItem[];              // Static timeline items
  dataEndpoint?: string;               // API endpoint to fetch items dynamically
  style?: TimelineStyle;               // Visual style/layout options
  grouping?: TimelineGrouping;         // Grouping configuration
  interaction?: TimelineInteraction;   // Interaction settings
  emptyMessage?: string;               // Message when no items (default: 'No timeline items')
  dateFormat?: string;                 // Date format for timestamps (default: 'MMM DD, YYYY')
  showConnector?: boolean;             // Show connecting line between items (default: true)
  maxItems?: number;                   // Maximum items to display (with load more option)
  sortOrder?: 'asc' | 'desc';          // Sort order by timestamp (default: 'asc')
}
