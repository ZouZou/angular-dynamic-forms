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

  // Common attributes
  placeholder?: string;
  readonly?: boolean;
  disabled?: boolean;

  // Number/Range specific
  min?: number;
  max?: number;
  step?: number;

  // File upload specific
  accept?: string; // MIME types or file extensions (e.g., "image/*", ".pdf,.doc")
  multiple?: boolean; // Allow multiple file uploads
  maxFileSize?: number; // Max file size in bytes

  // Multi-select specific
  minSelections?: number;
  maxSelections?: number;

  // DateTime specific
  includeTime?: boolean; // For datetime vs date
  timezone?: string; // IANA timezone (e.g., "America/New_York")

  // Rich text editor specific
  allowedFormats?: string[]; // e.g., ['bold', 'italic', 'underline', 'link']
  maxCharacters?: number;

  validations?: any;
}
