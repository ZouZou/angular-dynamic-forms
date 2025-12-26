# angular-dynamic-forms
Angular Dynamic Forms - based of the work of https://angular.love/building-dynamic-forms-in-angular-using-json-schema-and-signals

# AngularDynamicForms

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.3.

## Overview

A flexible, JSON-driven dynamic form generator for Angular 21+ with support for dependent dropdowns and API-driven options. Built using Angular Signals for reactive state management.

### Key Features

- **JSON-Driven Forms**: Define entire forms in JSON configuration
- **Dependent Dropdowns**: Cascading dropdowns where one field's options depend on another
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

## Additional Field Types

### Range Slider

Numeric input with visual slider control for selecting values within a range.

```json
{
  "type": "range",
  "label": "Volume",
  "name": "volume",
  "min": 0,
  "max": 100,
  "step": 5,
  "validations": { "required": true }
}
```

**Features:**
- Min/max bounds
- Step increments
- Real-time value display
- Visual feedback
- Touch-friendly slider

**Use Cases:**
- Volume/brightness controls
- Price ranges
- Rating systems
- Quantity selectors

---

### Color Picker

Native HTML5 color input for selecting colors with hex code display.

```json
{
  "type": "color",
  "label": "Brand Color",
  "name": "brandColor",
  "validations": { "required": true }
}
```

**Features:**
- Native color picker UI
- Hex color code display
- Visual color preview
- Cross-browser support
- Default value (#000000)

**Use Cases:**
- Theme customization
- Design tools
- Branding settings
- UI preferences

---

### Multi-Select

Dropdown that allows selecting multiple options simultaneously.

```json
{
  "type": "multiselect",
  "label": "Skills",
  "name": "skills",
  "options": [
    { "value": "js", "label": "JavaScript" },
    { "value": "ts", "label": "TypeScript" },
    { "value": "py", "label": "Python" }
  ],
  "minSelections": 1,
  "maxSelections": 5,
  "validations": { "required": true }
}
```

**Features:**
- Multiple selection support
- Min/max selections validation
- Visual selection feedback
- Keyboard navigation (Ctrl/Cmd + Click)
- Dynamic option sizing

**Use Cases:**
- Skill selection
- Category tagging
- Feature preferences
- Multiple choice questions

---

### DateTime Picker

Native HTML5 datetime input for selecting date and time together.

```json
{
  "type": "datetime",
  "label": "Appointment Time",
  "name": "appointmentTime",
  "min": "2025-01-01T00:00",
  "max": "2025-12-31T23:59",
  "timezone": "America/New_York",
  "validations": { "required": true }
}
```

**Features:**
- Combined date and time selection
- Native datetime picker
- Min/max constraints
- Timezone support
- Cross-browser compatibility

**Use Cases:**
- Appointment scheduling
- Event registration
- Deadline setting
- Timestamp collection

---

### File Upload

File input with validation, size restrictions, and image preview.

```json
{
  "type": "file",
  "label": "Profile Picture",
  "name": "profilePicture",
  "accept": "image/*",
  "maxFileSize": 5242880,
  "multiple": false,
  "validations": { "required": true }
}
```

**Features:**
- File type restrictions (MIME types)
- File size validation
- Image preview for supported formats
- Multiple file upload support
- File information display (name, size)
- Base64 encoding for submission

**Attributes:**
- `accept`: File types (e.g., "image/*", ".pdf,.doc")
- `maxFileSize`: Maximum file size in bytes
- `multiple`: Allow multiple files

**Use Cases:**
- Profile pictures
- Document uploads
- Resume submission
- Image galleries

---

### Rich Text Editor

Basic WYSIWYG editor with formatting toolbar.

```json
{
  "type": "richtext",
  "label": "Description",
  "name": "description",
  "maxCharacters": 1000,
  "validations": { "required": true }
}
```

**Features:**
- Basic formatting toolbar (Bold, Italic, Underline)
- Bullet and numbered lists
- Character count with limit
- HTML output
- ContentEditable-based
- Clean, modern UI

**Toolbar Commands:**
- **B** - Bold text
- **I** - Italic text
- **U** - Underline text
- **•** - Bullet list
- **1.** - Numbered list

**Use Cases:**
- Blog post content
- Product descriptions
- Comments and feedback
- Email composition

**Note:** For advanced WYSIWYG features, consider integrating a third-party library like TinyMCE or Quill.

---

## Form Builder 🎨

Visual tool for creating and configuring dynamic forms without writing JSON manually.

### Features

**Visual Form Creation:**
- Drag-and-drop field ordering
- Click-to-add field types
- Real-time form preview
- Field property editor

**Field Management:**
- 10 field types available
- Configure all field properties
- Set validations visually
- Add/remove options for select fields

**JSON Configuration:**
- Live JSON preview
- Copy JSON to clipboard
- Export configuration as JSON file
- Import existing configurations

**Developer-Friendly:**
- Clean, intuitive UI
- Responsive design
- Full keyboard navigation
- Undo/redo support (coming soon)

### Using the Form Builder

1. **Add Fields:** Click on any field type in the left panel to add it to your form
2. **Configure Properties:** Select a field to edit its properties in the right panel
3. **Reorder Fields:** Drag and drop fields in the preview panel to reorder
4. **Preview JSON:** View the generated JSON configuration in real-time
5. **Export:** Click "Export" to download your form configuration
6. **Import:** Click "Import" to load an existing configuration

### Accessing the Form Builder

Add the form builder component to your Angular app:

```typescript
import { FormBuilderComponent } from './form-builder/form-builder.component';

// In your component or routes
{
  path: 'builder',
  component: FormBuilderComponent
}
```

### Example Workflow

1. Open the Form Builder
2. Add "Text Input" for name
3. Add "Email" for email address
4. Add "Multi-Select" for skills
5. Configure validations (required, min length, etc.)
6. Export JSON configuration
7. Use the JSON with `DqDynamicForm` component

---

## Updated Field Types Summary

| Type | Description | Key Features |
|------|-------------|--------------|
| `text` | Single-line text | minLength, maxLength, placeholder |
| `email` | Email with validation | Auto email validation |
| `select` | Single dropdown | Static/dynamic options, dependencies |
| `multiselect` | Multiple selection | Min/max selections, Ctrl+Click |
| `checkbox` | Boolean toggle | requiredTrue, dependencies |
| `range` | Slider control | Min/max/step values |
| `color` | Color picker | Hex output, visual preview |
| `datetime` | Date & time | Min/max, timezone support |
| `file` | File upload | Size/type validation, preview |
| `richtext` | WYSIWYG editor | Formatting toolbar, char limit |

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
