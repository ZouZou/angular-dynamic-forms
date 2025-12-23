# Forms with signals • Angular
**IMPORTANT:** Signal Forms are [experimental](about:/reference/releases#experimental). The API may change in future releases. Avoid using experimental APIs in production applications without understanding the risks.

Signal Forms manage form state using Angular signals to provide automatic synchronization between your data model and the UI with Angular Signals.

This guide walks you through the core concepts to create forms with Signal Forms. Here's how it works:

[Creating your first form](#creating-your-first-form)
-----------------------------------------------------

### [1\. Create a form model with `signal()`](#1-create-a-form-model-with-signal)

Every form starts by creating a signal that holds your form's data model:

```
interface LoginData {  email: string;  password: string;}const loginModel = signal<LoginData>({  email: '',  password: '',});
```


### [2\. Pass the form model to `form()` to create a `FieldTree`](#2-pass-the-form-model-to-form-to-create-a-fieldtree)

Then, you pass your form model into the [`form()`](https://angular.dev/api/forms/signals/form) function to create a **field tree** - an object structure that mirrors your model's shape, allowing you to access fields with dot notation:

```
const loginForm = form(loginModel);// Access fields directly by property nameloginForm.email;loginForm.password;
```


### [3\. Bind HTML inputs with `[field]` directive](#3-bind-html-inputs-with-field-directive)

Next, you bind your HTML inputs to the form using the `[field]` directive, which creates two-way binding between them:

```
<input type="email" [field]="loginForm.email" /><input type="password" [field]="loginForm.password" />
```


As a result, user changes (such as typing in the field) automatically updates the form.

**NOTE:** The `[field]` directive also syncs field state for attributes like [`required`](https://angular.dev/api/forms/signals/required), `disabled`, and `readonly` when appropriate.

### [4\. Read field values with `value()`](#4-read-field-values-with-value)

You can access field state by calling the field as a function. This returns a [`FieldState`](https://angular.dev/api/forms/signals/FieldState) object containing reactive signals for the field's value, validation status, and interaction state:

```
loginForm.email(); // Returns FieldState with value(), valid(), touched(), etc.
```


To read the field's current value, access the `value()` signal:

```
<!-- Render form value that updates automatically as user types --><p>Email: {{ loginForm.email().value() }}</p>
```


```
// Get the current valueconst currentEmail = loginForm.email().value();
```


### [5\. Update field values with `set()`](#5-update-field-values-with-set)

You can programmatically update a field's value using the `value.set()` method. This updates both the field and the underlying model signal:

```
// Update the value programmaticallyloginForm.email().value.set('alice@wonderland.com');
```


As a result, both the field value and the model signal are updated automatically:

```
// The model signal is also updatedconsole.log(loginModel().email); // 'alice@wonderland.com'
```


Here's a complete example:

[Basic usage](#basic-usage)
---------------------------

The `[field]` directive works with all standard HTML input types. Here are the most common patterns:

### [Text inputs](#text-inputs)

Text inputs work with various `type` attributes and textareas:

#### [Numbers](#numbers)

Number inputs automatically convert between strings and numbers:

```
<!-- Number - automatically converts to number type --><input type="number" [field]="form.age" />
```


#### [Date and time](#date-and-time)

Date inputs store values as `YYYY-MM-DD` strings, and time inputs use `HH:mm` format:

```
<!-- Date and time - stores as ISO format strings --><input type="date" [field]="form.eventDate" /><input type="time" [field]="form.eventTime" />
```


If you need to convert date strings to Date objects, you can do so by passing the field value into `Date()`:

```
const dateObject = new Date(form.eventDate().value());
```


#### [Multiline text](#multiline-text)

Textareas work the same way as text inputs:

```
<!-- Textarea --><textarea [field]="form.message" rows="4"></textarea>
```


### [Checkboxes](#checkboxes)

Checkboxes bind to boolean values:

```
<!-- Single checkbox --><label>  <input type="checkbox" [field]="form.agreeToTerms" />  I agree to the terms</label>
```


#### [Multiple checkboxes](#multiple-checkboxes)

For multiple options, create a separate boolean `field` for each:

```
<label>  <input type="checkbox" [field]="form.emailNotifications" />  Email notifications</label><label>  <input type="checkbox" [field]="form.smsNotifications" />  SMS notifications</label>
```


### [Radio buttons](#radio-buttons)

Radio buttons work similarly to checkboxes. As long as the radio buttons use the same `[field]` value, Signal Forms will automatically bind the same `name` attribute to all of them:

```
<label>  <input type="radio" value="free" [field]="form.plan" />  Free</label><label>  <input type="radio" value="premium" [field]="form.plan" />  Premium</label>
```


When a user selects a radio button, the form `field` stores the value from that radio button's `value` attribute. For example, selecting "Premium" sets `form.plan().value()` to `"premium"`.

### [Select dropdowns](#select-dropdowns)

Select elements work with both static and dynamic options:

```
<!-- Static options --><select [field]="form.country">  <option value="">Select a country</option>  <option value="us">United States</option>  <option value="ca">Canada</option></select><!-- Dynamic options with @for --><select [field]="form.productId">  <option value="">Select a product</option>  @for (product of products; track product.id) {    <option [value]="product.id">{{ product.name }}</option>  }</select>
```


**NOTE:** Multiple select (`<select multiple>`) is not supported by the `[field]` directive at this time.

[Validation and state](#validation-and-state)
---------------------------------------------

Signal Forms provides built-in validators that you can apply to your form fields. To add validation, pass a schema function as the second argument to [`form()`](https://angular.dev/api/forms/signals/form):

```
const loginForm = form(loginModel, (schemaPath) => {  debounce(schemaPath.email, 500);  required(schemaPath.email);  email(schemaPath.email);});
```


The schema function receives a **schema path** parameter that provides paths to your fields for configuring validation rules.

Common validators include:

*   **[`required()`](https://angular.dev/api/forms/signals/required)** - Ensures the field has a value
*   **[`email()`](https://angular.dev/api/forms/signals/email)** - Validates email format
*   **[`min()`](https://angular.dev/api/forms/signals/min)** / **[`max()`](https://angular.dev/api/forms/signals/max)** - Validates number ranges
*   **[`minLength()`](https://angular.dev/api/forms/signals/minLength)** / **[`maxLength()`](https://angular.dev/api/forms/signals/maxLength)** - Validates string or collection length
*   **[`pattern()`](https://angular.dev/api/forms/signals/pattern)** - Validates against a regex pattern

You can also customize error messages by passing an options object as the second argument to the validator:

```
required(schemaPath.email, {message: 'Email is required'});email(schemaPath.email, {message: 'Please enter a valid email address'});
```


Each form field exposes its validation state through signals. For example, you can check `field().valid()` to see if validation passes, `field().touched()` to see if the user has interacted with it, and `field().errors()` to get the list of validation errors.

Here's a complete example:

### [Field State Signals](#field-state-signals)

Every `field()` provides these state signals:

[Next steps](#next-steps)
-------------------------

To learn more about Signal Forms and how it works, check out the in-depth guides:

*   [Overview](guide/forms/signals/overview) - Introduction to Signal Forms and when to use them
*   [Form models](guide/forms/signals/models) - Creating and managing form data with signals
*   [Field state management](guide/forms/signals/field-state-management) - Working with validation state, interaction tracking, and field visibility
*   [Validation](guide/forms/signals/validation) - Built-in validators, custom validation rules, and async validation