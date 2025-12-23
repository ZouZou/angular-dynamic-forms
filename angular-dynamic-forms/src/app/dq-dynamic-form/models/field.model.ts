export interface FieldOption {
  value: string;
  label: string;
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
  validations?: any;
}
