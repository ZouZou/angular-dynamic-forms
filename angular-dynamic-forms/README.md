# AngularDynamicForms

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.3.

## Overview

A flexible, JSON-driven dynamic form generator for Angular 21+ with support for dependent dropdowns and API-driven options. Built using Angular Signals for reactive state management.

### Key Features

- **JSON-Driven Forms**: Define entire forms in JSON configuration
- **Dependent Dropdowns**: Cascading dropdowns where one field's options depend on another
- **Dependent Checkboxes**: Bidirectional checkbox relationships with 'same' and 'opposite' modes
- **API-Driven Options**: Fetch dropdown options dynamically from APIs with intelligent caching
- **Smart Caching**: 5-minute TTL cache to reduce server load
- **Loading States**: Per-field loading indicators for better UX
- **Error Handling**: Graceful error handling with user-friendly messages
- **Angular Signals**: Reactive state management using Angular's latest signals API
- **TypeScript**: Fully typed with interfaces for type safety
- **Backward Compatible**: Supports static options, dependent options, and API-driven options

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

## Dependent Checkboxes

### Basic Concept

Dependent checkboxes allow two checkboxes to maintain a relationship where one automatically updates based on the other's state. This feature supports bidirectional relationships with two modes:

- **Same**: Both checkboxes stay in sync (both checked or both unchecked)
- **Opposite**: Checkboxes maintain inverse states (when one is checked, the other is unchecked)

### Use Cases

**Same Relationship:**
- "Subscribe to Newsletter" ↔ "Send me product updates"
- "Enable notifications" ↔ "Enable email alerts"
- "Agree to terms" ↔ "Acknowledge privacy policy"

**Opposite Relationship:**
- "Enable email notifications" ↔ "Disable all notifications"
- "Show advanced options" ↔ "Use simple mode"
- "Auto-save enabled" ↔ "Manual save mode"

### Configuration

```json
{
  "type": "checkbox",
  "label": "Subscribe to Newsletter",
  "name": "newsletter",
  "validations": { "required": false }
},
{
  "type": "checkbox",
  "label": "Send me product updates",
  "name": "productUpdates",
  "dependsOn": "newsletter",
  "dependencyType": "same",
  "validations": { "required": false }
}
```

### Dependency Types

| Type | Behavior | Example |
|------|----------|---------|
| `same` | Both checkboxes mirror each other | Checking newsletter also checks productUpdates |
| `opposite` | Checkboxes maintain inverse states | Checking emailNotifications unchecks disableNotifications |

### Technical Details

**Bidirectional Updates:**
- Changes to either checkbox trigger the dependency logic
- Automatic loop prevention to avoid infinite updates
- Works seamlessly with dirty tracking and validation

**Implementation:**
```typescript
// Automatically handled by Angular effects in component
// No manual event handling required
// Loop prevention using programmatic update tracking
```

**Example JSON:**
```json
{
  "type": "checkbox",
  "label": "Enable email notifications",
  "name": "emailNotifications"
},
{
  "type": "checkbox",
  "label": "Disable all notifications",
  "name": "disableNotifications",
  "dependsOn": "emailNotifications",
  "dependencyType": "opposite"
}
```

When user checks "Enable email notifications", "Disable all notifications" automatically unchecks (and vice versa).

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
  type: string;                             // 'text', 'email', 'select', 'checkbox'
  label: string;                            // Display label
  name: string;                             // Unique field identifier
  options?: string[] | FieldOption[];       // Static options (string array or objects)
  dependsOn?: string;                       // Parent field name for dependent fields
  optionsMap?: Record<string, FieldOption[]>; // Static dependent options mapping
  optionsEndpoint?: string;                 // API endpoint for dynamic options
  dependencyType?: 'same' | 'opposite';     // For checkbox dependencies: 'same' = mirror, 'opposite' = inverse
  validations?: {                           // Validation rules
    required?: boolean;
    minLength?: number;
    requiredTrue?: boolean;  // For checkboxes
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

| Type | Description | Example |
|------|-------------|---------|
| `text` | Text input | Name, address |
| `email` | Email input with validation | user@example.com |
| `select` | Dropdown (single select) | Country, state, category |
| `checkbox` | Boolean checkbox | Accept terms |

---

## Examples

### Example 1: Simple Form with Static Options

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

## Form Builder (Visual Editor)

A comprehensive visual form builder application with real-time preview and validation. Access it at `/builder` route.

### Overview

The Form Builder provides a unified interface with three synchronized panels:
- **Visual Editor**: Drag-and-drop field palette and property editor
- **Live Preview**: Real-time rendered form preview
- **JSON Editor**: Live JSON schema with validation feedback

### Features

**Visual Editor Panel:**
- Field palette with 9 field types (text, email, password, number, textarea, select, radio, checkbox, date)
- Click-to-add field creation
- Visual field tree showing all form fields
- Reorder fields (move up/down)
- Delete fields
- Select field to edit properties
- Property editor:
  - Field name
  - Label
  - Placeholder
  - Required checkbox
  - Read-only checkbox
  - Disabled checkbox

**Live Preview Panel:**
- Real-time rendered form using DqDynamicForm component
- Updates instantly as you modify fields
- Shows exact output users will see
- Empty state when no fields added

**JSON Editor & Validation Panel:**
- Live JSON schema editor
- Bidirectional sync: edit JSON → updates visual editor
- Real-time validation using DevToolsService
- Validation display:
  - ✅ Valid/❌ Invalid indicator
  - Summary statistics (total fields, required fields, errors, warnings)
  - Detailed error messages
  - Warning messages
  - Field type breakdown

### Actions

**Header Actions:**
- 🗑️ **Clear**: Clear entire form (with confirmation)
- 📥 **Import**: Import JSON schema from file
- 📤 **Export**: Export schema to JSON file
- ⚡ **Generate TS**: Generate TypeScript interface and copy to clipboard

### Usage

#### Accessing the Form Builder

Navigate to `/builder` in your application, or click "🛠️ Open Form Builder" from the demo page.

```typescript
// Routes are already configured
// / → Demo page with sample form
// /builder → Form builder application
```

#### Building a Form

1. **Add Fields**: Click field types in the palette to add them
2. **Configure**: Click a field to edit its properties
3. **Reorder**: Use ⬆️⬇️ buttons to change field order
4. **Preview**: See live preview in the center panel
5. **Validate**: Check JSON panel for validation errors
6. **Export**: Download JSON when ready

#### Example Workflow

```
1. Click "Text Input" → Field added
2. Select the field → Properties appear
3. Change name to "username"
4. Change label to "Username"
5. Check "Required" checkbox
6. See updates in all three panels simultaneously
7. Click "Generate TS" → TypeScript interface copied
8. Click "Export" → Download form-schema.json
```

### Keyboard & Mouse

- **Click field** in tree → Select for editing
- **Click field type** in palette → Add new field
- **⬆️⬇️ buttons** → Reorder fields
- **🗑️ button** → Delete field
- **Edit JSON** → Type directly in JSON editor
- **Import JSON** → Click Import and select file

### Validation

The form builder performs real-time validation:

**Errors (must fix):**
- Missing required properties (name, label, type)
- Duplicate field names
- Invalid field types
- Circular dependencies
- Non-existent dependency references

**Warnings (review):**
- Unknown field types
- Missing options for select/radio
- Misused validations
- Computed fields without readonly

### TypeScript Generation

Click "⚡ Generate TS" to generate a TypeScript interface from your form schema:

**Input (JSON):**
```json
{
  "title": "User Form",
  "fields": [
    { "type": "text", "name": "username", "label": "Username", "validations": { "required": true } },
    { "type": "email", "name": "email", "label": "Email", "validations": { "required": true } },
    { "type": "number", "name": "age", "label": "Age" }
  ]
}
```

**Output (TypeScript):**
```typescript
export interface FormData {
  username: string;
  email: string;
  age?: number;
}
```

The interface is automatically copied to your clipboard.

### Export/Import

**Export:**
- Generates formatted JSON (2-space indentation)
- Downloads as `form-schema.json`
- Can be imported back or used directly

**Import:**
- Select any valid JSON schema file
- Automatic validation on import
- Shows error if schema is invalid
- Replaces current schema (with confirmation)

### Integration

The Form Builder is a standalone application built with:
- **FormBuilder component** (`/src/app/form-builder/form-builder.ts`)
- **DevToolsService** for validation
- **DqDynamicForm** for live preview
- **Angular Signals** for reactive state

### Responsive Design

The Form Builder adapts to different screen sizes:
- **Desktop (>1400px)**: Full three-panel layout
- **Laptop (1200-1400px)**: Narrower panels
- **Tablet (<1200px)**: Stacked single-column layout

### Best Practices

1. **Start Small**: Begin with a few fields, test, then expand
2. **Validate Often**: Check validation panel frequently
3. **Use Properties**: Configure all field properties before exporting
4. **Test Preview**: Interact with the live preview to verify behavior
5. **Export Regularly**: Save your work by exporting JSON
6. **Generate Types**: Create TypeScript interfaces for type safety

### Advanced Tips

**Bidirectional Editing:**
- Edit visually OR in JSON - both stay synchronized
- JSON edits trigger visual updates
- Visual edits regenerate JSON

**Field Naming:**
- Auto-generated names: `textField1`, `emailField2`, etc.
- Rename in properties panel for semantic names
- Use camelCase (e.g., `firstName`, `emailAddress`)

**Quick Testing:**
- Add fields quickly with palette
- Configure in properties panel
- Test in live preview immediately
- No build step needed

### Limitations

- No drag-and-drop reordering (use ⬆️⬇️ buttons instead)
- Limited property editor (name, label, placeholder, required, readonly, disabled)
- For advanced features (validations, dependencies, etc.), edit JSON directly
- No undo/redo (export regularly to save progress)

### Future Enhancements

Planned improvements:
- Drag-and-drop field reordering
- Expanded property editor (all field options)
- Template library (common field patterns)
- Multi-step form builder
- Validation rule editor
- Dependency configuration UI
- Section/group management
- Collaborative editing

---

## Getting Started

### Development Server

Run `ng serve` for a dev server. Navigate to:
- `http://localhost:4200/` for the demo
- `http://localhost:4200/builder` for the form builder

The application will automatically reload if you change any of the source files.

### Building

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

