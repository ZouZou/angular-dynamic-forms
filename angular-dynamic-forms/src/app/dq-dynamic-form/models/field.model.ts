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
}

export interface Field {
  type: string;
  label: string;
  name: string;
  options?: string[] | FieldOption[];
  dependsOn?: string;
  optionsMap?: Record<string, FieldOption[]>;
  optionsEndpoint?: string; // API endpoint to fetch options dynamically
  dependencyType?: 'same' | 'opposite'; // For checkbox dependencies: 'same' = both checked/unchecked together, 'opposite' = inverse relationship
  validations?: FieldValidations;
  visibleWhen?: VisibilityCondition; // Conditional visibility
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

// Form schema with optional multi-step support
export interface FormSchema {
  title: string;
  description?: string;
  fields?: Field[]; // For single-step forms
  sections?: FormSection[]; // For multi-step forms
  multiStep?: boolean; // Enable multi-step mode
  submission?: FormSubmission; // Submission configuration
}
