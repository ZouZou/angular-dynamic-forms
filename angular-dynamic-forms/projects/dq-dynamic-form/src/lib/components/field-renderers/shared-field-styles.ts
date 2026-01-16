/**
 * Shared styles for all field renderer components
 * These styles need to be included in each component due to view encapsulation
 */
export const SHARED_FIELD_STYLES = `
  .form-label {
    font-weight: 600;
    font-size: 0.875rem;
    color: var(--color-gray-700);
    margin-bottom: var(--spacing-sm);
    display: flex;
    align-items: center;
    letter-spacing: 0.025em;
    text-transform: uppercase;
  }

  .required {
    color: var(--color-error);
    margin-left: var(--spacing-xs);
    font-size: 1rem;
  }

  .form-control,
  .form-select {
    padding: 12px 16px;
    border: 2px solid var(--color-gray-300);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-family: inherit;
    color: var(--color-gray-800);
    background: white;
    transition: all var(--transition-base);
    width: 100%;
  }

  .form-control:hover,
  .form-select:hover {
    border-color: var(--color-gray-400);
  }

  .form-control:focus,
  .form-control:focus-visible,
  .form-select:focus,
  .form-select:focus-visible {
    border-color: var(--color-primary);
    outline: 3px solid var(--color-primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }

  .form-control:disabled,
  .form-select:disabled {
    background-color: var(--color-gray-100);
    color: var(--color-gray-400);
    cursor: not-allowed;
    border-color: var(--color-gray-300);
  }

  .form-control:disabled:hover,
  .form-select:disabled:hover {
    border-color: var(--color-gray-300);
  }

  .form-control::placeholder {
    color: var(--color-gray-400);
  }

  textarea.form-control {
    resize: vertical;
    min-height: 100px;
    line-height: 1.5;
    font-family: inherit;
  }

  .form-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
    background-position: right 12px center;
    background-repeat: no-repeat;
    background-size: 20px;
    padding-right: 40px;
  }
`;
