# Configurable Form Submission Endpoint

The dynamic form now supports configurable submission endpoints via the `submissionEndpoint` input, providing maximum flexibility for different scenarios.

## Priority Order

1. **Input property** (`submissionEndpoint`) - highest priority
2. **Schema configuration** (`submission.endpoint`) - fallback
3. **No endpoint** - displays data locally

## Usage Examples

### Example 1: Environment-Based Endpoint

```typescript
import { Component, signal } from '@angular/core';
import { DqDynamicForm } from './dq-dynamic-form/dq-dynamic-form';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-contact-form',
  imports: [DqDynamicForm],
  template: `
    <dq-dynamic-form
      [formSchema]="contactSchema()"
      [submissionEndpoint]="apiEndpoint()"
    />
  `
})
export class ContactFormComponent {
  contactSchema = signal({
    title: "Contact Us",
    fields: [
      { name: "name", label: "Name", type: "text", validations: { required: true } },
      { name: "email", label: "Email", type: "email", validations: { required: true } },
      { name: "message", label: "Message", type: "textarea", validations: { required: true } }
    ]
  });

  // Dynamically set endpoint based on environment
  apiEndpoint = signal(
    environment.production
      ? "https://api.example.com/contact"
      : "http://localhost:3000/api/contact"
  );
}
```

### Example 2: User Role-Based Endpoint

```typescript
import { Component, signal, computed, inject } from '@angular/core';
import { DqDynamicForm } from './dq-dynamic-form/dq-dynamic-form';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-report-form',
  imports: [DqDynamicForm],
  template: `
    <dq-dynamic-form
      [formSchema]="reportSchema()"
      [submissionEndpoint]="submissionUrl()"
    />
  `
})
export class ReportFormComponent {
  private authService = inject(AuthService);

  reportSchema = signal({
    title: "Submit Report",
    fields: [
      { name: "title", label: "Title", type: "text", validations: { required: true } },
      { name: "description", label: "Description", type: "textarea" }
    ]
  });

  // Endpoint changes based on user role
  submissionUrl = computed(() => {
    const user = this.authService.currentUser();
    if (user.role === 'admin') {
      return 'https://api.example.com/admin/reports';
    } else if (user.role === 'manager') {
      return 'https://api.example.com/manager/reports';
    } else {
      return 'https://api.example.com/user/reports';
    }
  });
}
```

### Example 3: Form Selection-Based Endpoint

```typescript
import { Component, signal, computed } from '@angular/core';
import { DqDynamicForm } from './dq-dynamic-form/dq-dynamic-form';

@Component({
  selector: 'app-multi-purpose-form',
  imports: [DqDynamicForm],
  template: `
    <div>
      <label>
        <input type="radio" name="formType" value="support"
               (change)="formType.set('support')" checked>
        Support Request
      </label>
      <label>
        <input type="radio" name="formType" value="sales"
               (change)="formType.set('sales')">
        Sales Inquiry
      </label>
      <label>
        <input type="radio" name="formType" value="feedback"
               (change)="formType.set('feedback')">
        Feedback
      </label>
    </div>

    <dq-dynamic-form
      [formSchema]="formSchema()"
      [submissionEndpoint]="endpoint()"
    />
  `
})
export class MultiPurposeFormComponent {
  formType = signal<'support' | 'sales' | 'feedback'>('support');

  formSchema = signal({
    title: "Contact Form",
    fields: [
      { name: "name", label: "Name", type: "text", validations: { required: true } },
      { name: "email", label: "Email", type: "email", validations: { required: true } },
      { name: "message", label: "Message", type: "textarea", validations: { required: true } }
    ]
  });

  // Dynamically select endpoint based on form type
  endpoint = computed(() => {
    switch (this.formType()) {
      case 'support':
        return 'https://api.example.com/support';
      case 'sales':
        return 'https://api.example.com/sales';
      case 'feedback':
        return 'https://api.example.com/feedback';
      default:
        return 'https://api.example.com/general';
    }
  });
}
```

### Example 4: Tenant-Based Endpoint (Multi-Tenancy)

```typescript
import { Component, signal, inject } from '@angular/core';
import { DqDynamicForm } from './dq-dynamic-form/dq-dynamic-form';
import { TenantService } from './tenant.service';

@Component({
  selector: 'app-tenant-form',
  imports: [DqDynamicForm],
  template: `
    <dq-dynamic-form
      [formSchema]="schema()"
      [submissionEndpoint]="tenantEndpoint()"
    />
  `
})
export class TenantFormComponent {
  private tenantService = inject(TenantService);

  schema = signal({
    title: "Application Form",
    fields: [
      { name: "applicantName", label: "Name", type: "text", validations: { required: true } }
    ]
  });

  // Each tenant has their own API endpoint
  tenantEndpoint = signal(
    `https://${this.tenantService.currentTenant()}.api.example.com/applications`
  );
}
```

### Example 5: A/B Testing Different Endpoints

```typescript
import { Component, signal } from '@angular/core';
import { DqDynamicForm } from './dq-dynamic-form/dq-dynamic-form';

@Component({
  selector: 'app-ab-test-form',
  imports: [DqDynamicForm],
  template: `
    <dq-dynamic-form
      [formSchema]="schema()"
      [submissionEndpoint]="testEndpoint()"
    />
  `
})
export class AbTestFormComponent {
  schema = signal({
    title: "Signup Form",
    fields: [
      { name: "email", label: "Email", type: "email", validations: { required: true } }
    ]
  });

  // Randomly assign users to different endpoints for A/B testing
  testEndpoint = signal(
    Math.random() < 0.5
      ? 'https://api.example.com/signup/v1'
      : 'https://api.example.com/signup/v2'
  );
}
```

### Example 6: Override Schema Endpoint

```typescript
import { Component, signal } from '@angular/core';
import { DqDynamicForm } from './dq-dynamic-form/dq-dynamic-form';

@Component({
  selector: 'app-override-form',
  imports: [DqDynamicForm],
  template: `
    <dq-dynamic-form
      [formSchema]="schema()"
      [submissionEndpoint]="customEndpoint()"
    />
  `
})
export class OverrideFormComponent {
  // Schema has a default endpoint
  schema = signal({
    title: "Registration Form",
    fields: [
      { name: "username", label: "Username", type: "text", validations: { required: true } }
    ],
    submission: {
      endpoint: "https://api.example.com/default/register"
    }
  });

  // But we override it with a custom endpoint
  customEndpoint = signal("https://api.example.com/custom/register");

  // The customEndpoint takes priority over schema.submission.endpoint
}
```

## Benefits

1. **Environment Flexibility**: Easy switching between dev/staging/production endpoints
2. **Multi-Tenancy Support**: Different tenants can have different API endpoints
3. **User-Based Routing**: Route submissions based on user roles or permissions
4. **Dynamic Routing**: Change endpoints based on user selections or form state
5. **A/B Testing**: Test different backend implementations
6. **Override Capability**: Override schema-defined endpoints when needed

## Migration from Static Endpoints

### Before (Static in Schema)
```typescript
const schema = {
  title: "Contact Form",
  fields: [...],
  submission: {
    endpoint: "https://api.example.com/contact"  // Hardcoded
  }
};
```

### After (Dynamic Input)
```typescript
const schema = {
  title: "Contact Form",
  fields: [...]
  // No submission config needed
};

const endpoint = signal("https://api.example.com/contact");

// In template:
<dq-dynamic-form [formSchema]="schema" [submissionEndpoint]="endpoint()" />
```

## Notes

- The `submissionEndpoint` input **always takes priority** over `schema.submission.endpoint`
- If neither is provided, the form displays submitted data locally (no API call)
- The endpoint can be changed dynamically at any time (it's a signal)
- Other submission config (method, headers, redirectOnSuccess) still come from the schema
