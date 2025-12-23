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

export interface Field {
  type: string;
  label: string;
  name: string;
  options?: string[] | FieldOption[];
  dependsOn?: string;
  optionsMap?: Record<string, FieldOption[]>;
  optionsEndpoint?: string; // API endpoint to fetch options dynamically
  dependencyType?: 'same' | 'opposite'; // For checkbox dependencies: 'same' = both checked/unchecked together, 'opposite' = inverse relationship
  validations?: any;
  visibleWhen?: VisibilityCondition; // Conditional visibility
  placeholder?: string; // Custom placeholder text
  rows?: number; // For textarea
  min?: number; // For number and date inputs
  max?: number; // For number and date inputs
  step?: number; // For number inputs
  layout?: 'horizontal' | 'vertical'; // For radio buttons
}
