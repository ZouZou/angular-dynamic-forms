# DataTable Action Buttons Documentation

## Overview

DataTable action buttons provide a flexible way to add interactive controls to each row in your data tables. Actions can be customized at design time through JSON configuration or using the Form Builder UI.

## Features

- **Button Type Actions**: Simple clickable buttons with icons and labels
- **Menu Type Actions**: Dropdown menus with multiple sub-actions
- **Conditional Visibility**: Show/hide buttons based on row data using JavaScript expressions
- **Full Customization**: Configure colors, icons, labels, and event handlers
- **Form Builder Support**: Visual editor for managing action buttons without editing JSON

## Action Types

### 1. Button Actions

Simple action buttons that trigger a single event when clicked.

```json
{
  "label": "Edit",
  "icon": "✏️",
  "type": "button",
  "color": "primary",
  "onClick": "editUser",
  "visibleWhen": "row.status === 'Active'"
}
```

### 2. Menu Actions

Dropdown menus that contain multiple sub-actions. Useful for grouping related actions or reducing visual clutter.

```json
{
  "label": "More",
  "icon": "⚙️",
  "type": "menu",
  "color": "secondary",
  "menuItems": [
    {
      "label": "View Details",
      "icon": "👁️",
      "onClick": "viewDetails"
    },
    {
      "label": "Archive",
      "icon": "📦",
      "onClick": "archiveUser",
      "visibleWhen": "row.status === 'Active'"
    }
  ]
}
```

## Configuration Properties

### DataTableAction Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Button text label |
| `icon` | string | No | Icon/emoji to display |
| `type` | `'button' \| 'menu'` | No | Action type (default: 'button') |
| `color` | `'primary' \| 'secondary' \| 'danger' \| 'warning'` | No | Button color theme |
| `onClick` | string | No | Event handler name or action identifier |
| `visibleWhen` | string | No | JavaScript expression for conditional visibility |
| `menuItems` | DataTableActionMenuItem[] | No | Sub-actions for menu type (required if type='menu') |

### DataTableActionMenuItem Interface

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `label` | string | Yes | Menu item text label |
| `icon` | string | No | Icon/emoji to display |
| `onClick` | string | No | Event handler name or action identifier |
| `visibleWhen` | string | No | JavaScript expression for conditional visibility |

## Color Options

The `color` property supports the following values:

- **`primary`**: Blue theme (ideal for primary actions like "Edit", "View")
- **`secondary`**: Gray theme (ideal for neutral actions like "More", "Settings")
- **`danger`**: Red theme (ideal for destructive actions like "Delete", "Remove")
- **`warning`**: Yellow theme (ideal for cautionary actions like "Archive", "Suspend")

## Conditional Visibility

Use the `visibleWhen` property to show/hide actions based on row data. The property accepts a JavaScript expression that has access to the row data via the `row` variable.

### Examples

```javascript
// Show only for active users
"visibleWhen": "row.status === 'Active'"

// Show only for admin role
"visibleWhen": "row.role === 'Admin'"

// Show for multiple conditions
"visibleWhen": "row.status === 'Active' && row.role !== 'Viewer'"

// Show for users created this year
"visibleWhen": "new Date(row.createdAt).getFullYear() === 2025"

// Show based on numeric comparison
"visibleWhen": "row.quantity > 0"
```

### Important Notes

- The expression is evaluated with the `row` object as context
- If the expression throws an error, the action will be shown by default
- Complex logic is supported, but keep expressions simple for maintainability
- The expression is evaluated on each render, so keep it performant

## Complete Example

Here's a complete example of an actions column with multiple button types and conditional visibility:

```json
{
  "key": "actions",
  "label": "Actions",
  "type": "actions",
  "align": "center",
  "actions": [
    {
      "label": "Edit",
      "icon": "✏️",
      "type": "button",
      "onClick": "editUser",
      "color": "primary"
    },
    {
      "label": "Delete",
      "icon": "🗑️",
      "type": "button",
      "onClick": "deleteUser",
      "color": "danger",
      "visibleWhen": "row.status !== 'Inactive'"
    },
    {
      "label": "More",
      "icon": "⚙️",
      "type": "menu",
      "color": "secondary",
      "menuItems": [
        {
          "label": "View Details",
          "icon": "👁️",
          "onClick": "viewDetails"
        },
        {
          "label": "Export",
          "icon": "📥",
          "onClick": "exportUser"
        },
        {
          "label": "Archive",
          "icon": "📦",
          "onClick": "archiveUser",
          "visibleWhen": "row.status === 'Active'"
        },
        {
          "label": "Restore",
          "icon": "♻️",
          "onClick": "restoreUser",
          "visibleWhen": "row.status === 'Inactive'"
        }
      ]
    }
  ]
}
```

## Using the Form Builder

The Form Builder provides a visual interface for configuring action buttons:

### Adding an Actions Column

1. Create or select a DataTable field
2. Click "➕ Add Column"
3. Set the column type to "Actions"
4. Click "➕ Add Action Button"

### Configuring Button Actions

1. **Label**: Enter the button text
2. **Icon/Emoji**: Add an icon or emoji (optional)
3. **Type**: Select "Button" or "Dropdown Menu"
4. **Color**: Choose Primary, Secondary, Danger, or Warning
5. **onClick Handler**: Enter the event handler name
6. **Visible When**: Add a JavaScript condition (optional)

### Configuring Menu Actions

1. Set Type to "Dropdown Menu"
2. Click "➕ Add Menu Item" to add sub-actions
3. Configure each menu item:
   - Label
   - Icon (optional)
   - onClick handler
   - Visible When condition (optional)

### Managing Actions

- **Reorder**: Actions appear in the order they're defined
- **Delete**: Click the ✕ button next to any action to remove it
- **Edit**: Modify any property inline and changes save automatically

## Event Handling

When an action is clicked, the `handleTableAction` method is called with:
- **action**: The onClick handler name or label
- **row**: The complete row data object

### Example Implementation

```typescript
// In your component
handleTableAction(action: string, row: DataTableRow): void {
  switch(action) {
    case 'editUser':
      this.openEditDialog(row);
      break;
    case 'deleteUser':
      this.confirmDelete(row);
      break;
    case 'viewDetails':
      this.navigateToDetails(row.id);
      break;
    default:
      console.log('Unknown action:', action, row);
  }
}
```

## Best Practices

### Button vs Menu

- **Use buttons** for 1-2 primary actions that are frequently used
- **Use menus** when you have 3+ actions or want to reduce visual clutter
- Combine both: Show primary actions as buttons, group secondary actions in a menu

### Conditional Visibility

- **Keep expressions simple**: Complex logic is harder to debug and maintain
- **Handle null/undefined**: Use optional chaining: `row.data?.property`
- **Test thoroughly**: Verify conditions work for all possible row states
- **Provide fallbacks**: Consider default visibility if data might be incomplete

### Icons and Labels

- **Use emojis** for quick, universal icons: ✏️, 🗑️, 👁️, ⚙️
- **Or use icon classes** if you have an icon library (e.g., Font Awesome)
- **Always provide labels** for accessibility, even with icons
- **Keep labels short**: 1-2 words maximum

### Colors

- **Be consistent**: Use the same colors for similar actions across tables
- **Follow conventions**:
  - Primary (blue) for main actions
  - Danger (red) for destructive actions
  - Warning (yellow) for cautionary actions
  - Secondary (gray) for neutral actions

### Event Handlers

- **Use descriptive names**: `editUser` not `edit`
- **Be consistent**: Use the same handler names across tables
- **Document handlers**: Add comments explaining what each handler does
- **Handle errors**: Always include error handling in your event handlers

## Styling Customization

The action buttons use CSS variables for easy customization:

```scss
// Customize action button appearance
.datatable-action-btn {
  // Override default styles
}

.datatable-action-menu {
  // Customize dropdown menu
}

.datatable-action-dropdown {
  // Customize dropdown panel
}
```

## Accessibility

- All buttons include proper `title` attributes
- Keyboard navigation is supported for dropdown menus
- Screen readers can access button labels
- Color is not the only visual indicator (icons and labels provide context)

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- IE 11 not supported (uses modern JavaScript features)
- Mobile-friendly with touch support

## Troubleshooting

### Action buttons not appearing

- Verify column `type` is set to `"actions"`
- Check that `actions` array is defined and not empty
- Verify row data includes an `id` property (required for menu state tracking)

### Conditional visibility not working

- Check JavaScript syntax in `visibleWhen` expression
- Verify property names match row data keys (case-sensitive)
- Check browser console for evaluation errors
- Test expression in console: `new Function('row', 'return <expression>')(rowData)`

### Menu not closing

- Ensure row has a unique `id` property
- Check that `closeActionMenu` is called on menu item click
- Verify no JavaScript errors in console

### onClick handlers not firing

- Verify `handleTableAction` method exists in component
- Check handler name matches exactly (case-sensitive)
- Ensure method is not being overridden or shadowed

## Migration Guide

If you have existing action columns without the new features:

### Before (basic actions)
```json
{
  "actions": [
    {
      "label": "Edit",
      "onClick": "editUser",
      "color": "primary"
    }
  ]
}
```

### After (with new features)
```json
{
  "actions": [
    {
      "label": "Edit",
      "icon": "✏️",
      "type": "button",
      "onClick": "editUser",
      "color": "primary",
      "visibleWhen": "row.canEdit === true"
    }
  ]
}
```

## Related Documentation

- [DataTable Field Documentation](./DATATABLE_FEATURE.md) - General DataTable features
- [Form Builder Guide](./FORM_BUILDER.md) - Using the visual form builder
- [Field Model Reference](./src/app/dq-dynamic-form/models/field.model.ts) - TypeScript interfaces
