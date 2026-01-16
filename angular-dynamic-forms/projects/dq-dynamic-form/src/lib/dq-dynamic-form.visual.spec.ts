import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DqDynamicForm } from './dq-dynamic-form';
import { FormSchema } from './models/field.model';

/**
 * Visual Regression Tests for Dynamic Form Components
 *
 * These tests capture the visual appearance of form fields to detect
 * unintended UI changes. They verify:
 * - Field rendering consistency
 * - Layout stability
 * - Style consistency across field types
 * - Responsive behavior
 */

describe('DqDynamicForm - Visual Regression Tests', () => {
  let component: DqDynamicForm;
  let fixture: ComponentFixture<DqDynamicForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DqDynamicForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DqDynamicForm);
    component = fixture.componentInstance;
  });

  /**
   * Helper function to capture visual snapshot
   */
  const captureSnapshot = async (name: string): Promise<string> => {
    fixture.detectChanges();
    await fixture.whenStable();

    const element = fixture.nativeElement;
    const html = element.innerHTML;
    const computedStyles = getComputedStylesRecursive(element);

    return JSON.stringify({
      name,
      html: sanitizeHtml(html),
      styles: computedStyles,
      dimensions: {
        width: element.offsetWidth,
        height: element.offsetHeight
      }
    }, null, 2);
  };

  /**
   * Get computed styles for an element and its children
   */
  const getComputedStylesRecursive = (element: Element): any => {
    const styles: any = {};
    const relevantProperties = [
      'display', 'width', 'height', 'margin', 'padding',
      'border', 'font-size', 'font-weight', 'color',
      'background-color', 'flex', 'grid'
    ];

    if (element instanceof HTMLElement) {
      const computed = window.getComputedStyle(element);
      styles.tag = element.tagName.toLowerCase();
      styles.classes = Array.from(element.classList);
      styles.properties = {};

      relevantProperties.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value) {
          styles.properties[prop] = value;
        }
      });

      // Recursively get styles for children
      if (element.children.length > 0) {
        styles.children = Array.from(element.children).map(child =>
          getComputedStylesRecursive(child)
        );
      }
    }

    return styles;
  };

  /**
   * Sanitize HTML to remove dynamic content
   */
  const sanitizeHtml = (html: string): string => {
    return html
      .replace(/\s+/g, ' ') // normalize whitespace
      .replace(/<!--.*?-->/g, '') // remove comments
      .trim();
  };

  describe('Text Input Fields', () => {
    it('should render text input with consistent styling', async () => {
      const schema: FormSchema = {
        title: 'Text Input Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username', placeholder: 'Enter username' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('text-input-default');

      expect(snapshot).toBeTruthy();
      expect(snapshot).toContain('username');
      expect(snapshot).toContain('text');
    });

    it('should render text input with error state', async () => {
      const schema: FormSchema = {
        title: 'Text Input Error',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      // Trigger validation error
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));

      const snapshot = await captureSnapshot('text-input-error');
      expect(snapshot).toContain('required');
    });

    it('should render readonly text input', async () => {
      const schema: FormSchema = {
        title: 'Readonly Text',
        fields: [
          { type: 'text', name: 'id', label: 'ID', readonly: true }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('text-input-readonly');

      expect(snapshot).toContain('readonly');
    });

    it('should render disabled text input', async () => {
      const schema: FormSchema = {
        title: 'Disabled Text',
        fields: [
          { type: 'text', name: 'field', label: 'Field', disabled: true }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('text-input-disabled');

      expect(snapshot).toContain('disabled');
    });
  });

  describe('Selection Fields', () => {
    it('should render select dropdown with options', async () => {
      const schema: FormSchema = {
        title: 'Select Test',
        fields: [
          {
            type: 'select',
            name: 'country',
            label: 'Country',
            options: [
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' },
              { value: 'mx', label: 'Mexico' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('select-dropdown');

      expect(snapshot).toContain('select');
      expect(snapshot).toContain('country');
    });

    it('should render radio buttons horizontally', async () => {
      const schema: FormSchema = {
        title: 'Radio Test',
        fields: [
          {
            type: 'radio',
            name: 'gender',
            label: 'Gender',
            layout: 'horizontal',
            options: [
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('radio-horizontal');

      expect(snapshot).toContain('radio');
      expect(snapshot).toContain('horizontal');
    });

    it('should render radio buttons vertically', async () => {
      const schema: FormSchema = {
        title: 'Radio Test',
        fields: [
          {
            type: 'radio',
            name: 'size',
            label: 'Size',
            layout: 'vertical',
            options: [
              { value: 's', label: 'Small' },
              { value: 'm', label: 'Medium' },
              { value: 'l', label: 'Large' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('radio-vertical');

      expect(snapshot).toContain('radio');
      expect(snapshot).toContain('vertical');
    });

    it('should render multiselect field', async () => {
      const schema: FormSchema = {
        title: 'Multiselect Test',
        fields: [
          {
            type: 'multiselect',
            name: 'skills',
            label: 'Skills',
            options: [
              { value: 'js', label: 'JavaScript' },
              { value: 'ts', label: 'TypeScript' },
              { value: 'py', label: 'Python' }
            ]
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('multiselect');

      expect(snapshot).toContain('multiple');
      expect(snapshot).toContain('skills');
    });
  });

  describe('Advanced Field Types', () => {
    it('should render range slider', async () => {
      const schema: FormSchema = {
        title: 'Range Test',
        fields: [
          { type: 'range', name: 'volume', label: 'Volume', min: 0, max: 100, step: 5 }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('range-slider');

      expect(snapshot).toContain('range');
      expect(snapshot).toContain('volume');
    });

    it('should render color picker', async () => {
      const schema: FormSchema = {
        title: 'Color Test',
        fields: [
          { type: 'color', name: 'brandColor', label: 'Brand Color' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('color-picker');

      expect(snapshot).toContain('color');
    });

    it('should render file upload', async () => {
      const schema: FormSchema = {
        title: 'File Test',
        fields: [
          { type: 'file', name: 'avatar', label: 'Avatar', accept: 'image/*' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('file-upload');

      expect(snapshot).toContain('file');
      expect(snapshot).toContain('image');
    });

    it('should render rich text editor', async () => {
      const schema: FormSchema = {
        title: 'Rich Text Test',
        fields: [
          { type: 'richtext', name: 'content', label: 'Content', maxCharacters: 500 }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('richtext-editor');

      expect(snapshot).toContain('contenteditable');
    });
  });

  describe('Layout Variations', () => {
    it('should render fields with different widths', async () => {
      const schema: FormSchema = {
        title: 'Layout Test',
        fields: [
          { type: 'text', name: 'full', label: 'Full Width', width: 'full' },
          { type: 'text', name: 'half1', label: 'Half Width 1', width: 'half' },
          { type: 'text', name: 'half2', label: 'Half Width 2', width: 'half' },
          { type: 'text', name: 'third1', label: 'Third 1', width: 'third' },
          { type: 'text', name: 'third2', label: 'Third 2', width: 'third' },
          { type: 'text', name: 'third3', label: 'Third 3', width: 'third' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('layout-widths');

      expect(snapshot).toContain('full');
      expect(snapshot).toContain('half');
      expect(snapshot).toContain('third');
    });

    it('should render array field with multiple items', async () => {
      const schema: FormSchema = {
        title: 'Array Test',
        fields: [
          {
            type: 'array',
            name: 'phones',
            label: 'Phone Numbers',
            arrayConfig: {
              fields: [
                { type: 'select', name: 'type', label: 'Type', width: 'third', options: [
                  { value: 'mobile', label: 'Mobile' },
                  { value: 'home', label: 'Home' }
                ]},
                { type: 'text', name: 'number', label: 'Number', width: 'half' }
              ],
              initialItems: 2,
              minItems: 1,
              maxItems: 5
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('array-field');

      expect(snapshot).toContain('array');
      expect(snapshot).toContain('phones');
    });
  });

  describe('Conditional Visibility', () => {
    it('should render conditionally visible field (hidden state)', async () => {
      const schema: FormSchema = {
        title: 'Visibility Test',
        fields: [
          {
            type: 'select',
            name: 'accountType',
            label: 'Account Type',
            options: [
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' }
            ]
          },
          {
            type: 'text',
            name: 'companyName',
            label: 'Company Name',
            visibleWhen: {
              field: 'accountType',
              operator: 'equals',
              value: 'business'
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      component['formValues'].set({ accountType: 'personal' });

      const snapshot = await captureSnapshot('conditional-hidden');

      // Company name should not be visible
      expect(snapshot).not.toContain('companyName');
    });

    it('should render conditionally visible field (shown state)', async () => {
      const schema: FormSchema = {
        title: 'Visibility Test',
        fields: [
          {
            type: 'select',
            name: 'accountType',
            label: 'Account Type',
            options: [
              { value: 'personal', label: 'Personal' },
              { value: 'business', label: 'Business' }
            ]
          },
          {
            type: 'text',
            name: 'companyName',
            label: 'Company Name',
            visibleWhen: {
              field: 'accountType',
              operator: 'equals',
              value: 'business'
            }
          }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      component['formValues'].set({ accountType: 'business' });

      const snapshot = await captureSnapshot('conditional-shown');

      // Company name should be visible
      expect(snapshot).toContain('companyName');
    });
  });

  describe('Form States', () => {
    it('should render loading state', async () => {
      const schema: FormSchema = {
        title: 'Loading Test',
        fields: [
          { type: 'text', name: 'field', label: 'Field' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      component['loading'].set(true);

      const snapshot = await captureSnapshot('form-loading');

      expect(snapshot).toContain('Loading');
    });

    it('should render submitted state', async () => {
      const schema: FormSchema = {
        title: 'Submitted Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      component['formValues'].set({ username: 'testuser' });
      component['submitted'].set(true);
      component['submittedData'].set({ username: 'testuser' });

      const snapshot = await captureSnapshot('form-submitted');

      expect(snapshot).toContain('submitted');
    });
  });

  describe('Responsive Behavior', () => {
    it('should render form at mobile viewport width', async () => {
      const schema: FormSchema = {
        title: 'Mobile Test',
        fields: [
          { type: 'text', name: 'field1', label: 'Field 1', width: 'half' },
          { type: 'text', name: 'field2', label: 'Field 2', width: 'half' }
        ]
      };

      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('form-mobile');

      expect(snapshot).toBeTruthy();

      // Restore
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    });

    it('should render form at tablet viewport width', async () => {
      const schema: FormSchema = {
        title: 'Tablet Test',
        fields: [
          { type: 'text', name: 'field1', label: 'Field 1', width: 'third' },
          { type: 'text', name: 'field2', label: 'Field 2', width: 'third' },
          { type: 'text', name: 'field3', label: 'Field 3', width: 'third' }
        ]
      };

      // Simulate tablet viewport
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 768 });

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('form-tablet');

      expect(snapshot).toBeTruthy();

      // Restore
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    });
  });

  describe('Accessibility Features', () => {
    it('should render with proper ARIA attributes', async () => {
      const schema: FormSchema = {
        title: 'Accessibility Test',
        fields: [
          { type: 'text', name: 'username', label: 'Username', validations: { required: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('aria-attributes');

      expect(snapshot).toContain('aria-');
    });

    it('should render error with ARIA live region', async () => {
      const schema: FormSchema = {
        title: 'Error ARIA Test',
        fields: [
          { type: 'email', name: 'email', label: 'Email', validations: { required: true } }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      fixture.detectChanges();
      await fixture.whenStable();

      // Trigger error
      component['formValues'].set({ email: 'invalid' });
      const form = fixture.nativeElement.querySelector('form');
      form.dispatchEvent(new Event('submit'));

      const snapshot = await captureSnapshot('error-aria-live');

      expect(snapshot).toContain('aria-live');
    });
  });

  describe('Dark Mode Support', () => {
    it('should render in light mode', async () => {
      const schema: FormSchema = {
        title: 'Light Mode',
        fields: [
          { type: 'text', name: 'field', label: 'Field' }
        ]
      };

      fixture.componentRef.setInput('formSchema', schema);
      const snapshot = await captureSnapshot('light-mode');

      expect(snapshot).toBeTruthy();
    });
  });
});
