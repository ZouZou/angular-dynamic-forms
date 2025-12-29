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
