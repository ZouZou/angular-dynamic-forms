# angular-dynamic-forms
Angular Dynamic Forms - based of the work of https://angular.love/building-dynamic-forms-in-angular-using-json-schema-and-signals

# AngularDynamicForms

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.3.

## Overview

A flexible, JSON-driven dynamic form generator for Angular 21+ with support for dependent dropdowns and API-driven options. Built using Angular Signals for reactive state management.

### Key Features

- **JSON-Driven Forms**: Define entire forms in JSON configuration
- **Conditional Visibility**: Show/hide fields based on other field values with complex logic
- **Multiple Field Types**: Text, email, textarea, number, date, radio buttons, checkboxes, and select dropdowns
- **Dependent Dropdowns**: Cascading dropdowns where one field's options depend on another
- **Dependent Checkboxes**: Checkboxes with same/opposite relationships
- **API-Driven Options**: Fetch dropdown options dynamically from APIs with intelligent caching
- **Smart Caching**: 5-minute TTL cache to reduce server load
- **Loading States**: Per-field loading indicators for better UX
- **Error Handling**: Graceful error handling with user-friendly messages
- **Angular Signals**: Reactive state management using Angular's latest signals API
- **TypeScript**: Fully typed with interfaces for type safety
- **Backward Compatible**: Supports static options, dependent options, and API-driven options

---

## Conditional Visibility

Show or hide fields dynamically based on other field values. Supports both simple conditions and complex logical expressions.

### Simple Conditions

```json
{
  "type": "text",
  "label": "Company Name",
  "name": "companyName",
  "visibleWhen": {
    "field": "accountType",
    "operator": "equals",
    "value": "business"
  }
}
```

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Field value equals specific value | Age equals 18 |
| `notEquals` | Field value does not equal value | Status not equals "inactive" |
| `contains` | String contains substring | Name contains "John" |
| `notContains` | String does not contain substring | Email not contains "temp" |
| `greaterThan` | Numeric value greater than | Age greater than 18 |
| `lessThan` | Numeric value less than | Price less than 100 |
| `greaterThanOrEqual` | Numeric value >= | Score >= 90 |
| `lessThanOrEqual` | Numeric value <= | Quantity <= 10 |
| `in` | Value in array | Color in ["red", "blue"] |
| `notIn` | Value not in array | Size not in ["XS", "S"] |
| `isEmpty` | Field is empty/null/undefined | Description is empty |
| `isNotEmpty` | Field has value | Comments is not empty |

### Complex Conditions (AND/OR Logic)

```json
{
  "type": "text",
  "label": "Student ID",
  "name": "studentId",
  "visibleWhen": {
    "operator": "and",
    "conditions": [
      { "field": "age", "operator": "lessThan", "value": 25 },
      { "field": "accountType", "operator": "equals", "value": "student" }
    ]
  }
}
```

**Nested Conditions:**
```json
{
  "visibleWhen": {
    "operator": "or",
    "conditions": [
      {
        "operator": "and",
        "conditions": [
          { "field": "age", "operator": "greaterThan", "value": 18 },
          { "field": "country", "operator": "equals", "value": "USA" }
        ]
      },
      { "field": "hasParentConsent", "operator": "equals", "value": true }
    ]
  }
}
```

---

## Cross-Field Validation

Validate fields based on the values of other fields. Supports password confirmation, date ranges, conditional required fields, and custom comparisons.

### Password Confirmation

```json
{
  "type": "password",
  "label": "Password",
  "name": "password",
  "validations": { "required": true, "minLength": 8 }
},
{
  "type": "password",
  "label": "Confirm Password",
  "name": "confirmPassword",
  "validations": {
    "required": true,
    "matchesField": "password",
    "customMessage": "Passwords do not match"
  }
}
```

### Date Range Validation

```json
{
  "type": "date",
  "label": "Start Date",
  "name": "startDate",
  "validations": { "required": true }
},
{
  "type": "date",
  "label": "End Date",
  "name": "endDate",
  "validations": {
    "required": true,
    "greaterThanField": "startDate",
    "customMessage": "End date must be after start date"
  }
}
```

### Conditional Required

```json
{
  "type": "checkbox",
  "label": "I have a referral code",
  "name": "hasReferralCode"
},
{
  "type": "text",
  "label": "Referral Code",
  "name": "referralCode",
  "validations": {
    "requiredIf": {
      "field": "hasReferralCode",
      "operator": "equals",
      "value": true
    }
  }
}
```

### Supported Cross-Field Validators

| Validator | Description | Example |
|-----------|-------------|---------|
| `matchesField` | Value must match another field | Password confirmation |
| `requiredIf` | Required when condition is met | Conditional required fields |
| `greaterThanField` | Value > another field | End date > Start date |
| `lessThanField` | Value < another field | Min budget < Max budget |
| `pattern` | Custom regex pattern | Phone number, SSN, etc. |
| `customMessage` | Override default error message | Any validator |

---

## Layout & Styling Options

Control field width, appearance, and behavior with layout options.

### Field Width

Fields can span full width or be arranged side-by-side:

```json
{
  "type": "text",
  "label": "Street Address",
  "name": "street",
  "width": "full"
},
{
  "type": "text",
  "label": "City",
  "name": "city",
  "width": "half"
},
{
  "type": "text",
  "label": "ZIP Code",
  "name": "zip",
  "width": "half"
}
```

**Width Options:**
- `full` - 100% width (default)
- `half` - 50% width (2 fields per row)
- `third` - 33.33% width (3 fields per row)
- `quarter` - 25% width (4 fields per row)

### Read-only and Disabled Fields

```json
{
  "type": "text",
  "label": "User ID",
  "name": "userId",
  "readonly": true,
  "value": "12345"
},
{
  "type": "email",
  "label": "Email",
  "name": "email",
  "disabled": true
}
```

### Custom CSS Classes

```json
{
  "type": "text",
  "label": "Premium Field",
  "name": "premium",
  "cssClass": "highlight-field"
}
```

---

## Dependent Dropdowns

### Basic Concept

Dependent dropdowns (also called cascading dropdowns) allow one dropdown's options to depend on the value selected in another dropdown. For example:
- **Country** → **State/Province** → **City**
- **Category** → **Subcategory** → **Product**

### Implementation Options

#### 1. **Static Dependent Dropdowns** (using `optionsMap`)

Define all options in JSON with a mapping from parent values to child options.

```json
{
  "type": "select",
  "label": "Country",
  "name": "country",
  "options": [
    { "value": "usa", "label": "United States" },
    { "value": "canada", "label": "Canada" }
  ],
  "validations": { "required": true }
},
{
  "type": "select",
  "label": "State/Province",
  "name": "state",
  "dependsOn": "country",
  "optionsMap": {
    "usa": [
      { "value": "ca", "label": "California" },
      { "value": "ny", "label": "New York" }
    ],
    "canada": [
      { "value": "on", "label": "Ontario" },
      { "value": "qc", "label": "Quebec" }
    ]
  },
  "validations": { "required": true }
}
```

**Features:**
- All options embedded in JSON
- Fast (no API calls)
- Works offline
- Best for small to medium option sets (< 100 options per field)

#### 2. **API-Driven Dependent Dropdowns** (using `optionsEndpoint`)

Fetch options dynamically from API endpoints with template variable support.

```json
{
  "type": "select",
  "label": "Country",
  "name": "country",
  "optionsEndpoint": "/api/countries",
  "validations": { "required": true }
},
{
  "type": "select",
  "label": "State/Province",
  "name": "state",
  "dependsOn": "country",
  "optionsEndpoint": "/api/states?country={{country}}",
  "validations": { "required": true }
}
```

**Template Variables:**
- Use `{{fieldName}}` in endpoint URLs
- Automatically replaced with actual field values
- Example: `/api/cities?state={{state}}` becomes `/api/cities?state=ca`

**Features:**
- Supports thousands of options without JSON bloat
- Real-time data from backend
- Intelligent caching (5-minute TTL)
- Loading indicators during fetch
- Error handling with user feedback
- Best for large option sets (100s or 1000s of options)

---

## API-Driven Options Architecture

### Caching Strategy

**Type**: In-memory Map-based cache
**TTL**: 5 minutes (configurable)
**Scope**: Service-level (shared across components)
**Invalidation**: Automatic expiration + manual methods

```typescript
// Cache configuration in dq-dynamic-form.service.ts
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Manual cache management
clearCache(): void                     // Clear all cached options
clearCacheForEndpoint(endpoint): void  // Clear specific endpoint
```

**Why 5 minutes?**
- Short enough for reasonable data freshness
- Long enough to prevent redundant API calls during form filling
- Configurable for your needs

### Flow Diagram

```
User selects Country
    ↓
Component detects change (Angular effect)
    ↓
Checks if State field has optionsEndpoint
    ↓
Service resolves template: /api/states?country={{country}} → /api/states?country=usa
    ↓
Service checks cache
    ├─ Cache HIT → Return cached options immediately
    └─ Cache MISS → Fetch from API
           ↓
       Store in cache (with timestamp)
           ↓
       Return options to component
           ↓
       Update dropdown options
```

### Mock API Service

Included mock API service for testing and development:

```typescript
// Simulates realistic backend behavior
- Network delay: 500-1500ms
- Large datasets: 50+ cities per state
- Error simulation: 5% random failure rate
- Query parameter parsing
- Dependent dropdown support
```

**Mock API Endpoints:**
- `/api/countries` - Returns 10 countries
- `/api/states?country={{country}}` - Returns 5-10 states per country
- `/api/cities?state={{state}}` - Returns 40-50 cities per state

### Switching to Real API

To use real APIs instead of mock:

```typescript
// In dq-dynamic-form.service.ts, line 53
// Replace:
return this.mockApi.fetchOptions(resolvedEndpoint)

// With:
return this.http.get<FieldOption[]>(resolvedEndpoint)
```

All caching, error handling, and loading states work automatically!

---

## Field Configuration Reference

### Field Interface

```typescript
interface Field {
  type: string;                             // Field type (see Supported Field Types)
  label: string;                            // Display label
  name: string;                             // Unique field identifier
  options?: string[] | FieldOption[];       // Static options (for select/radio)
  dependsOn?: string;                       // Parent field name for dependent fields
  optionsMap?: Record<string, FieldOption[]>; // Static dependent options mapping
  optionsEndpoint?: string;                 // API endpoint for dynamic options
  dependencyType?: 'same' | 'opposite';     // For checkbox dependencies
  visibleWhen?: VisibilityCondition;        // Conditional visibility
  placeholder?: string;                     // Custom placeholder text
  rows?: number;                            // Number of rows (textarea)
  min?: number;                             // Minimum value (number/date)
  max?: number;                             // Maximum value (number/date)
  step?: number;                            // Step increment (number)
  layout?: 'horizontal' | 'vertical';       // Layout for radio buttons
  readonly?: boolean;                       // Field is read-only
  disabled?: boolean;                       // Field is disabled
  cssClass?: string;                        // Custom CSS class
  width?: 'full' | 'half' | 'third' | 'quarter'; // Field width
  validations?: {                           // Validation rules
    required?: boolean;                     // Field is required
    minLength?: number;                     // Minimum string length
    maxLength?: number;                     // Maximum string length
    requiredTrue?: boolean;                 // Checkbox must be checked
    matchesField?: string;                  // Must match another field
    requiredIf?: {...};                     // Conditionally required
    greaterThanField?: string;              // Must be > another field
    lessThanField?: string;                 // Must be < another field
    pattern?: string | RegExp;              // Custom regex pattern
    customMessage?: string;                 // Custom error message
  };
}

interface FieldOption {
  value: string;  // Actual value stored
  label: string;  // Display text
}
```

### Priority System

When multiple option sources are defined, the system uses this priority:

1. **API-driven** (`optionsEndpoint`) - Highest priority
2. **Static dependent** (`optionsMap`) - Medium priority
3. **Static simple** (`options`) - Lowest priority

### Supported Field Types

| Type | Description | Attributes | Example Use Cases |
|------|-------------|------------|-------------------|
| `text` | Single-line text input | `placeholder`, `minLength`, `maxLength` | Name, address, username |
| `email` | Email input with validation | `placeholder` | Email address |
| `password` | Password input (masked) | `placeholder`, `minLength`, `matchesField` | Password, confirm password |
| `textarea` | Multi-line text input | `rows`, `placeholder`, `maxLength` | Bio, comments, description |
| `number` | Numeric input with spinners | `min`, `max`, `step`, `placeholder` | Age, quantity, price |
| `date` | Date picker | `min`, `max`, `greaterThanField`, `lessThanField` | Birth date, start date, deadline |
| `select` | Dropdown (single select) | `options`, `optionsMap`, `optionsEndpoint` | Country, state, category |
| `radio` | Radio buttons (mutually exclusive) | `options`, `layout` | Gender, account type, size |
| `checkbox` | Boolean checkbox | `dependencyType` | Accept terms, preferences |

---

## Examples

### Example 1: All Field Types Showcase

```json
{
  "title": "Comprehensive Form",
  "fields": [
    {
      "type": "text",
      "label": "Full Name",
      "name": "fullName",
      "placeholder": "Enter your full name",
      "validations": { "required": true, "minLength": 3 }
    },
    {
      "type": "email",
      "label": "Email",
      "name": "email",
      "placeholder": "your.email@example.com",
      "validations": { "required": true }
    },
    {
      "type": "number",
      "label": "Age",
      "name": "age",
      "min": 13,
      "max": 120,
      "step": 1,
      "validations": { "required": true }
    },
    {
      "type": "date",
      "label": "Birth Date",
      "name": "birthDate",
      "min": "1900-01-01",
      "max": "2010-12-31",
      "validations": { "required": true }
    },
    {
      "type": "radio",
      "label": "Gender",
      "name": "gender",
      "layout": "horizontal",
      "options": [
        { "value": "male", "label": "Male" },
        { "value": "female", "label": "Female" },
        { "value": "other", "label": "Other" }
      ],
      "validations": { "required": true }
    },
    {
      "type": "textarea",
      "label": "Bio",
      "name": "bio",
      "rows": 4,
      "placeholder": "Tell us about yourself...",
      "validations": { "maxLength": 500 }
    },
    {
      "type": "checkbox",
      "label": "Accept Terms",
      "name": "terms",
      "validations": { "requiredTrue": true }
    }
  ]
}
```

### Example 2: Conditional Visibility

```json
{
  "title": "User Registration",
  "fields": [
    {
      "type": "radio",
      "label": "Account Type",
      "name": "accountType",
      "options": [
        { "value": "personal", "label": "Personal" },
        { "value": "business", "label": "Business" }
      ],
      "validations": { "required": true }
    },
    {
      "type": "text",
      "label": "Company Name",
      "name": "companyName",
      "visibleWhen": {
        "field": "accountType",
        "operator": "equals",
        "value": "business"
      },
      "validations": { "required": true }
    },
    {
      "type": "number",
      "label": "Age",
      "name": "age",
      "min": 13,
      "max": 120,
      "validations": { "required": true }
    },
    {
      "type": "checkbox",
      "label": "I am over 18 years old",
      "name": "ageConfirmation",
      "visibleWhen": {
        "field": "age",
        "operator": "greaterThanOrEqual",
        "value": 18
      },
      "validations": { "requiredTrue": true }
    }
  ]
}
```

### Example 3: Simple Form with Static Options

```json
{
  "title": "Contact Form",
  "fields": [
    {
      "type": "text",
      "label": "Name",
      "name": "name",
      "validations": { "required": true, "minLength": 3 }
    },
    {
      "type": "select",
      "label": "Country",
      "name": "country",
      "options": ["USA", "Canada", "Mexico"],
      "validations": { "required": true }
    }
  ]
}
```

### Example 2: Static Dependent Dropdowns

```json
{
  "title": "Location Form",
  "fields": [
    {
      "type": "select",
      "label": "Department",
      "name": "department",
      "options": [
        { "value": "eng", "label": "Engineering" },
        { "value": "sales", "label": "Sales" }
      ]
    },
    {
      "type": "select",
      "label": "Team",
      "name": "team",
      "dependsOn": "department",
      "optionsMap": {
        "eng": [
          { "value": "frontend", "label": "Frontend" },
          { "value": "backend", "label": "Backend" }
        ],
        "sales": [
          { "value": "inside", "label": "Inside Sales" },
          { "value": "field", "label": "Field Sales" }
        ]
      }
    }
  ]
}
```

### Example 3: API-Driven 3-Level Cascade

```json
{
  "title": "Address Form",
  "fields": [
    {
      "type": "select",
      "label": "Country",
      "name": "country",
      "optionsEndpoint": "/api/countries"
    },
    {
      "type": "select",
      "label": "State",
      "name": "state",
      "dependsOn": "country",
      "optionsEndpoint": "/api/states?country={{country}}"
    },
    {
      "type": "select",
      "label": "City",
      "name": "city",
      "dependsOn": "state",
      "optionsEndpoint": "/api/cities?state={{state}}"
    }
  ]
}
```

---

## UI/UX Features

### Loading States

When fetching options from API:
- **Loading indicator** in field label: "Country Loading..."
- **Disabled dropdown** during fetch
- **Loading text** in placeholder: "Loading options..."

### Error Handling

On API failure:
- **Error message** below field: "Failed to load options"
- **Console logging** for debugging
- **Graceful fallback** to empty options array
- **Retry** by selecting parent field again

### Dependent Field Behavior

- **Disabled** until parent field has value
- **Helper text**: "Please select country first"
- **Auto-reset** when parent value changes
- **Validation** respects dependencies

---

## Technical Implementation

### Component Architecture

```
dq-dynamic-form.component
├─ Signals (Reactive State)
│  ├─ fields (Field[])
│  ├─ formValues (Record<string, unknown>)
│  ├─ dynamicOptions (Record<string, FieldOption[]>)
│  ├─ fieldLoading (Record<string, boolean>)
│  └─ fieldErrors (Record<string, string>)
├─ Effects (Watchers)
│  ├─ Reset dependent fields on parent change
│  └─ Fetch API options on field/parent change
└─ Methods
   ├─ getAvailableOptions() - Get options for field
   ├─ fetchOptionsForField() - Fetch from API
   ├─ normalizeOptions() - Convert string[] to FieldOption[]
   └─ isFieldDisabled() - Check if field should be disabled
```

### Service Layer

```typescript
DynamicFormsService
├─ Cache Management
│  ├─ optionsCache: Map<string, CacheEntry>
│  ├─ CACHE_TTL: 5 minutes
│  └─ Methods: getCached, setCached, clearCache
├─ API Integration
│  ├─ fetchOptionsFromEndpoint()
│  ├─ resolveEndpoint() - Template variable replacement
│  └─ MockApiService integration
└─ HTTP Client (for real APIs)
```

---

## Performance Considerations

### Caching Benefits

- **Reduced Server Load**: Cached options prevent redundant API calls
- **Faster UX**: Cache hits return instantly (no network delay)
- **Cost Savings**: Fewer API calls = lower cloud costs
- **Offline Resilience**: Recent data available even during brief outages

### Best Practices

1. **Small Static Sets** (< 50 options): Use `options` array
2. **Medium Static Sets** (50-500 options): Use `optionsMap` for dependent, `options` for independent
3. **Large Sets** (500+ options): Always use `optionsEndpoint`
4. **Real-Time Data**: Always use `optionsEndpoint`
5. **Cache TTL**: Adjust `CACHE_TTL` based on data volatility

### Bundle Size

- Mock API service: ~3KB
- Component logic: ~5KB
- Total overhead: ~8KB (minified + gzipped)

---

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

## Autosave and Draft Persistence (Phase 3)

Automatically save form progress to browser storage and restore it when the user returns. Perfect for long forms to prevent data loss.

### Configuration

Add the `autosave` object to your form schema:

```json
{
  "title": "User Registration",
  "autosave": {
    "enabled": true,
    "intervalSeconds": 30,
    "storage": "localStorage",
    "expirationDays": 7,
    "showIndicator": true
  },
  "fields": [...]
}
```

### Autosave Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable/disable autosave |
| `intervalSeconds` | number | 30 | Periodic save interval in seconds |
| `storage` | string | "localStorage" | Storage type: "localStorage" or "sessionStorage" |
| `expirationDays` | number | 7 | Days until draft expires |
| `showIndicator` | boolean | true | Show "last saved" indicator |
| `key` | string | formDraft_{title} | Custom storage key |

### How It Works

1. **Auto-save on change**: Draft is saved 1 second after the last field change (debounced)
2. **Periodic save**: Additional saves occur at specified intervals
3. **Auto-restore**: Draft is automatically loaded when form initializes
4. **Expiration**: Old drafts are automatically cleaned up
5. **Clear on submit**: Draft is removed after successful submission

The autosave indicator shows:
- "Saved just now" (< 1 minute)
- "Saved X minutes ago" (< 1 hour)
- "Saved X hours ago" (< 1 day)
- "Saved on [date]" (> 1 day)

---

## Dynamic Field Arrays (Repeaters) (Phase 3)

Allow users to add/remove repeating groups of fields dynamically. Perfect for collecting multiple phone numbers, addresses, or emergency contacts.

### Basic Example

```json
{
  "type": "array",
  "label": "Phone Number",
  "name": "phoneNumbers",
  "arrayConfig": {
    "fields": [
      {
        "type": "select",
        "label": "Type",
        "name": "type",
        "width": "third",
        "options": [
          { "value": "mobile", "label": "Mobile" },
          { "value": "home", "label": "Home" },
          { "value": "work", "label": "Work" }
        ],
        "validations": { "required": true }
      },
      {
        "type": "text",
        "label": "Number",
        "name": "number",
        "width": "half",
        "placeholder": "+1 (555) 123-4567",
        "validations": { "required": true }
      }
    ],
    "minItems": 1,
    "maxItems": 5,
    "initialItems": 1,
    "addButtonText": "+ Add Phone Number",
    "removeButtonText": "Remove",
    "itemLabel": "Phone {index}"
  }
}
```

### Array Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fields` | Field[] | required | Template fields for each array item |
| `minItems` | number | 0 | Minimum number of items (cannot remove below this) |
| `maxItems` | number | unlimited | Maximum number of items (cannot add above this) |
| `initialItems` | number | 1 | Number of items to show initially |
| `addButtonText` | string | "+ Add {label}" | Custom text for add button |
| `removeButtonText` | string | "Remove" | Custom text for remove button |
| `itemLabel` | string | "{label} {index}" | Label template for each item |

### Field Naming

Array field values are stored with keys like `phoneNumbers[0].type` and `phoneNumbers[0].number`. The component automatically manages these keys when adding/removing items.

### Features

- **Add/Remove Controls**: Buttons to add new items or remove existing ones
- **Min/Max Validation**: Enforce minimum and maximum number of items
- **Nested Field Support**: Array items can contain any field types
- **Field Widths**: Control layout with width utilities
- **Auto-reindexing**: Array indices automatically update when items are removed

---

## Async Validators (Phase 3)

Validate fields asynchronously via API calls. Perfect for checking username availability, email verification, or any server-side validation.

### Basic Example

```json
{
  "type": "text",
  "label": "Username",
  "name": "username",
  "placeholder": "Choose a unique username",
  "validations": {
    "required": true,
    "minLength": 3,
    "asyncValidator": {
      "endpoint": "/api/validate/username",
      "method": "POST",
      "debounceMs": 500,
      "errorMessage": "Username is already taken",
      "validWhen": "custom"
    }
  }
}
```

### Async Validator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | string | required | API endpoint for validation |
| `method` | string | "POST" | HTTP method: "GET" or "POST" |
| `debounceMs` | number | 300 | Debounce delay in milliseconds |
| `errorMessage` | string | "Invalid value" | Error message to show on validation failure |
| `validWhen` | string | "custom" | Validation condition: "exists", "notExists", or "custom" |

### Validation Conditions

**custom** (default): API returns `{ valid: boolean, message?: string }`
```json
{
  "valid": true
}
// or
{
  "valid": false,
  "message": "Username is already taken"
}
```

**exists**: Field is valid if API returns `{ exists: true }`
```json
{
  "exists": true  // Valid
}
```

**notExists**: Field is valid if API returns `{ exists: false }`
```json
{
  "exists": false  // Valid
}
```

### UI States

The async validator displays real-time feedback:
- **⏳ Validating...** - While API call is in progress
- **✓ Valid** - When validation passes
- **Error message** - When validation fails

### Features

- **Debouncing**: Prevents excessive API calls as user types
- **Loading State**: Shows validation in progress
- **Form Blocking**: Form cannot be submitted while validation is pending
- **Error Handling**: Gracefully handles API failures
- **Visual Feedback**: Clear indicators for all validation states

---

## Accessibility Features (Phase 3)

Comprehensive accessibility enhancements ensure the forms are usable by everyone, including users with disabilities.

### ARIA Attributes

All form elements include proper ARIA attributes:

```html
<!-- Form -->
<form role="form" aria-label="User Registration">
  
  <!-- Field Group -->
  <div role="group" aria-labelledby="label-firstName">
    
    <!-- Label -->
    <label id="label-firstName" for="firstName">
      First Name
      <span class="required" aria-label="required">*</span>
    </label>
    
    <!-- Input -->
    <input
      id="firstName"
      name="firstName"
      type="text"
      aria-required="true"
      aria-invalid="false"
      aria-describedby="error-firstName"
    />
    
    <!-- Error -->
    <div id="error-firstName" role="alert" aria-live="assertive">
      First Name is required
    </div>
  </div>
</form>
```

### Keyboard Navigation

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Focus Indicators**: Enhanced focus outlines (3px solid, high contrast)
- **Error Focus**: Automatically focuses first field with error on submit attempt
- **Smooth Scrolling**: Scrolls to focused field for better visibility

### Screen Reader Support

- **Form Labels**: Proper association between labels and inputs
- **Required Fields**: Announced via `aria-required` and visual indicators
- **Error Messages**: Live announcements via `aria-live="assertive"`
- **Validation States**: Async validation states announced in real-time
- **Descriptive Text**: Helper text properly associated with `aria-describedby`

### Focus Management

```typescript
// Automatically implemented in component
private focusFirstError(): void {
  const errors = this.errors();
  const firstErrorField = Object.keys(errors)[0];
  
  if (firstErrorField) {
    const element = document.getElementById(firstErrorField);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
}
```

### Features

- **Semantic HTML**: Proper use of form, label, input, and button elements
- **Role Attributes**: Clear roles for screen readers
- **Live Regions**: Dynamic content updates announced to screen readers
- **Focus Visible**: Enhanced focus styles only for keyboard navigation
- **Error Announcements**: Validation errors announced immediately
- **Loading States**: Async operations announced with `aria-live="polite"`

### WCAG Compliance

These features help achieve WCAG 2.1 Level AA compliance:
- Perceivable: Clear labels, error messages, and visual indicators
- Operable: Full keyboard navigation and sufficient focus indicators
- Understandable: Clear instructions and error messages
- Robust: Semantic HTML and proper ARIA attributes

---

## Field Masking & Formatting (Phase 4)

Automatic formatting of user input with predefined or custom mask patterns. Prevents invalid input and provides visual guidance for expected formats.

### Predefined Masks

```json
{
  "type": "text",
  "label": "Phone Number",
  "name": "phone",
  "mask": "phone"
}
```

**Available Predefined Masks:**

| Mask Type | Pattern | Example Output |
|-----------|---------|----------------|
| `phone` | `(000) 000-0000` | (555) 123-4567 |
| `phone-intl` | `+1 (000) 000-0000` | +1 (555) 123-4567 |
| `ssn` | `000-00-0000` | 123-45-6789 |
| `credit-card` | `0000 0000 0000 0000` | 1234 5678 9012 3456 |
| `zip` | `00000` | 12345 |
| `zip-plus4` | `00000-0000` | 12345-6789 |
| `date-us` | `00/00/0000` | 12/31/2025 |
| `time` | `00:00` | 14:30 |
| `currency` | `$0,000.00` | $1,234.56 |

### Custom Mask Patterns

Create your own mask patterns using these characters:

- `0` = Digit (0-9)
- `A` = Letter (a-zA-Z)
- `*` = Alphanumeric (0-9, a-zA-Z)
- `\` = Escape next character (literal)
- Any other character = Literal (shown as-is)

```json
{
  "type": "text",
  "label": "License Plate",
  "name": "licensePlate",
  "mask": {
    "type": "custom",
    "pattern": "AAA-0000",
    "placeholder": "ABC-1234",
    "prefix": "",
    "suffix": "",
    "showMaskOnHover": true
  }
}
```

### Mask Features

**Automatic Formatting:**
- User types "5551234567" → Displays as "(555) 123-4567"
- User types "123456789" → Displays as "123-45-6789" (SSN)
- Input is formatted in real-time as user types

**Validation:**
- Incomplete values show error messages
- Error: "Please enter a complete value in the format: (000) 000-0000"
- Validation checks both too-short and too-long inputs

**Max Length Enforcement:**
- Browser prevents typing beyond mask length
- Phone: max 14 characters for "(555) 123-4567"
- Paste operations automatically truncated to max length

**Visual Hints:**
- Mask pattern shown next to label: `Phone Number ((000) 000-0000)`
- Monospace font for better alignment
- Placeholder shows expected format

### Example Configuration

```json
{
  "type": "text",
  "label": "Social Security Number",
  "name": "ssn",
  "mask": "ssn",
  "placeholder": "Enter your SSN",
  "validations": {
    "required": true
  }
}
```

---

## Computed/Calculated Fields (Phase 4)

Fields that automatically calculate their value based on other fields using formulas. Updates in real-time when dependencies change.

### Basic Computation

```json
{
  "type": "text",
  "label": "Total Price",
  "name": "total",
  "readonly": true,
  "computed": {
    "formula": "price * quantity",
    "dependencies": ["price", "quantity"],
    "formatAs": "currency",
    "prefix": "$",
    "decimal": 2
  }
}
```

### String Concatenation

```json
{
  "type": "text",
  "label": "Full Name",
  "name": "fullName",
  "readonly": true,
  "computed": {
    "formula": "firstName + ' ' + lastName",
    "dependencies": ["firstName", "lastName"],
    "formatAs": "text"
  }
}
```

### Computed Field Configuration

```typescript
interface ComputedFieldConfig {
  formula: string;              // JavaScript expression
  dependencies: string[];       // Field names to watch
  formatAs?: 'number' | 'currency' | 'text';
  decimal?: number;            // Decimal places (default: 2)
  prefix?: string;             // e.g., "$", "Total: "
  suffix?: string;             // e.g., "%", " kg"
}
```

### Supported Formula Operations

**Arithmetic:**
```javascript
"price * quantity"           // Multiplication
"subtotal + tax"             // Addition
"total - discount"           // Subtraction
"amount / count"             // Division
"(price * quantity) * 1.08"  // Complex expressions
```

**String Operations:**
```javascript
"firstName + ' ' + lastName"              // Concatenation
"'Dr. ' + lastName"                       // Prefix
"city + ', ' + state + ' ' + zipCode"    // Multiple fields
```

**Mathematical Functions:**
```javascript
"Math.round(price * quantity)"           // Rounding
"Math.max(price1, price2, price3)"       // Maximum
"Math.min(discount1, discount2)"          // Minimum
```

### Format Options

**Currency:**
```json
{
  "formatAs": "currency",
  "prefix": "$",
  "decimal": 2
}
// Output: $1,234.56
```

**Number:**
```json
{
  "formatAs": "number",
  "decimal": 3,
  "suffix": " kg"
}
// Output: 123.456 kg
```

**Text:**
```json
{
  "formatAs": "text",
  "prefix": "Welcome, "
}
// Output: Welcome, John Doe
```

### Real-Time Updates

Computed fields automatically recalculate when any dependency changes:

1. User enters `price = 10` → Total shows: `$0.00`
2. User enters `quantity = 5` → Total shows: `$50.00`
3. User changes `price = 15` → Total shows: `$75.00`

### Advanced Examples

**Tax Calculation:**
```json
{
  "type": "text",
  "label": "Tax Amount (8%)",
  "name": "taxAmount",
  "readonly": true,
  "computed": {
    "formula": "subtotal * 0.08",
    "dependencies": ["subtotal"],
    "formatAs": "currency",
    "prefix": "$",
    "decimal": 2
  }
}
```

**Grand Total:**
```json
{
  "type": "text",
  "label": "Grand Total",
  "name": "grandTotal",
  "readonly": true,
  "computed": {
    "formula": "subtotal + (subtotal * 0.08)",
    "dependencies": ["subtotal"],
    "formatAs": "currency",
    "prefix": "$",
    "decimal": 2
  }
}
```

**Percentage:**
```json
{
  "type": "text",
  "label": "Completion Rate",
  "name": "completionRate",
  "readonly": true,
  "computed": {
    "formula": "(completed / total) * 100",
    "dependencies": ["completed", "total"],
    "formatAs": "number",
    "decimal": 1,
    "suffix": "%"
  }
}
```

### Important Notes

- **Read-only**: Computed fields are automatically read-only
- **Null/Empty Handling**: Empty dependencies default to 0 in numeric formulas
- **String Values**: Strings are automatically quoted in formulas
- **Dependency Order**: Dependencies sorted by length to avoid partial replacements
- **Error Handling**: Formula errors show empty value with console warning

