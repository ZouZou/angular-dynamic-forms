# DataTable Field Type

A powerful and flexible datatable field type for Angular Dynamic Forms, designed to display tabular data with features like sorting, filtering, pagination, row selection, and more.

## Features

- ✅ **Sortable Columns** - Click column headers to sort data
- ✅ **Filtering/Search** - Global search across specified columns
- ✅ **Pagination** - Navigate through large datasets with customizable page sizes
- ✅ **Row Selection** - Single or multiple row selection with checkboxes
- ✅ **Column Types** - Support for text, numbers, currency, dates, badges, avatars, links, and action buttons
- ✅ **Responsive Design** - Mobile-friendly with horizontal scrolling
- ✅ **Custom Styling** - Striped rows, bordered table, hover effects, dense mode
- ✅ **Empty State** - Customizable message when no data is available
- ✅ **Loading State** - Built-in loading indicator for async data
- ✅ **Avatar Support** - Display user avatars with fallback initials
- ✅ **Badge Support** - Colored badges for status indicators
- ✅ **Action Buttons** - Customizable action buttons per row

## Basic Usage

Add a datatable field to your form schema:

```json
{
  "type": "datatable",
  "label": "Users",
  "name": "usersTable",
  "tableConfig": {
    "columns": [
      {
        "key": "id",
        "label": "ID",
        "type": "text",
        "sortable": true
      },
      {
        "key": "name",
        "label": "Name",
        "type": "text",
        "sortable": true
      },
      {
        "key": "email",
        "label": "Email",
        "type": "text"
      }
    ],
    "rows": [
      { "id": 1, "name": "John Doe", "email": "john@example.com" },
      { "id": 2, "name": "Jane Smith", "email": "jane@example.com" }
    ]
  }
}
```

## Configuration

### Table Config Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `columns` | `DataTableColumn[]` | **Required** | Column definitions |
| `rows` | `DataTableRow[]` | `[]` | Static row data |
| `dataEndpoint` | `string` | - | API endpoint to fetch data dynamically |
| `pagination` | `DataTablePagination` | - | Pagination settings |
| `filter` | `DataTableFilter` | - | Filter/search settings |
| `selection` | `DataTableSelection` | - | Row selection settings |
| `striped` | `boolean` | `false` | Alternate row colors |
| `bordered` | `boolean` | `true` | Show table borders |
| `hoverable` | `boolean` | `true` | Highlight row on hover |
| `dense` | `boolean` | `false` | Compact row height |
| `defaultSort` | `object` | - | Default sort configuration |
| `emptyMessage` | `string` | `'No data available'` | Message when no data |

### Column Configuration

```typescript
{
  key: string;                         // Property key in row data
  label: string;                       // Column header label
  width?: string;                      // Column width (e.g., '100px', '20%')
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'avatar' | 'link' | 'actions';
  sortable?: boolean;                  // Enable sorting
  align?: 'left' | 'center' | 'right'; // Text alignment

  // For 'badge' type
  badgeColorMap?: Record<string, string>; // Map values to colors

  // For 'avatar' type
  avatarKey?: string;                  // Property key for avatar image URL

  // For 'link' type
  linkTemplate?: string;               // URL template with {{placeholders}}
  linkTarget?: '_blank' | '_self';

  // For 'actions' type
  actions?: DataTableAction[];         // Array of action buttons
}
```

## Column Types

### 1. Text Column
Basic text display:
```json
{
  "key": "name",
  "label": "Name",
  "type": "text",
  "sortable": true
}
```

### 2. Number Column
Formatted numbers:
```json
{
  "key": "quantity",
  "label": "Quantity",
  "type": "number",
  "sortable": true,
  "align": "right"
}
```

### 3. Currency Column
Formatted currency values:
```json
{
  "key": "price",
  "label": "Price",
  "type": "currency",
  "sortable": true,
  "align": "right"
}
```

### 4. Date Column
Formatted dates:
```json
{
  "key": "createdAt",
  "label": "Created",
  "type": "date",
  "sortable": true
}
```

### 5. Badge Column
Colored status badges:
```json
{
  "key": "status",
  "label": "Status",
  "type": "badge",
  "sortable": true,
  "badgeColorMap": {
    "Active": "success",
    "Pending": "warning",
    "Inactive": "secondary",
    "Error": "danger"
  }
}
```

**Available badge colors:**
- `primary` - Blue
- `success` - Green
- `warning` - Yellow/Orange
- `danger` - Red
- `secondary` - Gray

### 6. Avatar Column
User avatars with names:
```json
{
  "key": "userName",
  "label": "User",
  "type": "avatar",
  "avatarKey": "userAvatar"
}
```

Row data should include:
```json
{
  "userName": "John Doe",
  "userAvatar": "https://example.com/avatar.jpg"
}
```

If no avatar URL is provided, initials will be displayed.

### 7. Link Column
Clickable links:
```json
{
  "key": "claimNo",
  "label": "Claim Number",
  "type": "link",
  "linkTemplate": "/claims/{{id}}",
  "linkTarget": "_blank"
}
```

### 8. Actions Column
Action buttons:
```json
{
  "key": "actions",
  "label": "Actions",
  "type": "actions",
  "actions": [
    {
      "label": "View",
      "icon": "👁",
      "onClick": "viewRow",
      "color": "primary"
    },
    {
      "label": "Edit",
      "icon": "✏",
      "onClick": "editRow",
      "color": "secondary"
    },
    {
      "label": "Delete",
      "icon": "🗑",
      "onClick": "deleteRow",
      "color": "danger"
    }
  ]
}
```

## Pagination

Enable pagination with customizable settings:

```json
{
  "pagination": {
    "enabled": true,
    "rowsPerPage": 10,
    "rowsPerPageOptions": [10, 25, 50, 100],
    "showPageInfo": true
  }
}
```

## Filtering/Search

Enable global search across specified columns:

```json
{
  "filter": {
    "enabled": true,
    "placeholder": "Search...",
    "searchColumns": ["name", "email", "status"]
  }
}
```

If `searchColumns` is not specified, all text columns will be searchable.

## Row Selection

Enable row selection with checkboxes:

```json
{
  "selection": {
    "enabled": true,
    "mode": "multiple",
    "showSelectAll": true
  }
}
```

- `mode`: `'single'` or `'multiple'`
- Selected row IDs will be stored in the form value

## Sorting

Enable default sorting:

```json
{
  "defaultSort": {
    "column": "createdAt",
    "direction": "desc"
  }
}
```

Mark columns as sortable:
```json
{
  "key": "name",
  "label": "Name",
  "sortable": true
}
```

## Styling Options

### Striped Rows
```json
{ "striped": true }
```

### Bordered Table
```json
{ "bordered": true }
```

### Hoverable Rows
```json
{ "hoverable": true }
```

### Dense/Compact Mode
```json
{ "dense": true }
```

## Complete Example

See the example files:
- `/public/forms/claims-management-form.json` - Insurance claims table (matches the reference design)
- `/public/forms/datatable-example.json` - Multiple datatable examples

## Data Sources

### Static Data
Provide rows directly in the configuration:
```json
{
  "rows": [
    { "id": 1, "name": "John" },
    { "id": 2, "name": "Jane" }
  ]
}
```

### Dynamic Data (API)
Fetch data from an API endpoint:
```json
{
  "dataEndpoint": "/api/users"
}
```

The API should return an array of row objects.

## Responsive Design

The datatable is fully responsive:
- Horizontal scrolling on mobile devices
- Adjusted padding and font sizes for smaller screens
- Stacked pagination controls on mobile
- Custom scrollbar styling

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Implementation Details

### Files Modified
- `src/app/dq-dynamic-form/models/field.model.ts` - Type definitions
- `src/app/dq-dynamic-form/dq-dynamic-form.ts` - Component logic
- `src/app/dq-dynamic-form/dq-dynamic-form.html` - Template
- `src/app/dq-dynamic-form/dq-dynamic-form.scss` - Styles

### State Management
The datatable uses Angular signals for reactive state management:
- `tableData` - Original row data
- `tableCurrentPage` - Current page number
- `tableRowsPerPage` - Rows per page
- `tableSortConfig` - Sort configuration
- `tableFilterTerm` - Search term
- `tableSelection` - Selected row IDs
- `tableLoading` - Loading state

## Tips

1. **Performance**: For large datasets (1000+ rows), use pagination and filtering
2. **Accessibility**: All interactive elements have proper ARIA labels
3. **Selection**: Selected row IDs are automatically stored in the form value
4. **Styling**: Use CSS variables to customize colors and spacing
5. **Actions**: Action button clicks are logged to console (extend `handleTableAction` method for custom behavior)

## Future Enhancements

Potential future additions:
- Column resizing
- Column reordering (drag & drop)
- Export to CSV/Excel
- Virtual scrolling for very large datasets
- Inline row editing
- Expandable rows
- Column filtering (per-column filters)
- Advanced search with operators
- Custom cell templates

## Support

For issues or questions, please refer to the main project README or create an issue in the repository.
