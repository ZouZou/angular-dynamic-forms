# Timeline Field Type

A comprehensive timeline component for Angular Dynamic Forms, designed to display chronological events with rich formatting, multiple layout options, and interactive features.

## Features

- ✅ **Multiple Layouts** - Vertical/horizontal orientation with left/center/right/alternating alignments
- ✅ **Marker Styles** - Dot, icon, number, or no marker with status-based colors
- ✅ **Connector Lines** - Solid, dashed, dotted line styles or none
- ✅ **Card & Simple Layouts** - Rich card-based content or simple minimal display
- ✅ **Status Indicators** - Completed, in-progress, pending, cancelled states with distinct styling
- ✅ **Grouping** - Group items by year, month, or custom field
- ✅ **Interactive** - Clickable, expandable, and hoverable items
- ✅ **Rich Content** - Support for badges, links, metadata, descriptions, and icons
- ✅ **Date Formatting** - Customizable timestamp formats
- ✅ **Sorting** - Ascending or descending chronological order
- ✅ **Responsive Design** - Mobile-friendly with adaptive layouts
- ✅ **Animations** - Smooth transitions and pulse effects
- ✅ **Loading State** - Built-in loading indicator for async data
- ✅ **Empty State** - Customizable message when no items

## Basic Usage

Add a timeline field to your form schema:

```json
{
  "type": "timeline",
  "label": "Order Status",
  "name": "orderTimeline",
  "timelineConfig": {
    "items": [
      {
        "id": 1,
        "title": "Order Received",
        "timestamp": "2025-01-05T18:45:00",
        "status": "completed"
      },
      {
        "id": 2,
        "title": "Preparing Order",
        "timestamp": "2025-01-05T18:50:00",
        "status": "in-progress"
      },
      {
        "id": 3,
        "title": "Delivered",
        "timestamp": "2025-01-05T19:15:00",
        "status": "pending"
      }
    ],
    "style": {
      "layout": "vertical",
      "alignment": "left",
      "markerStyle": "dot"
    },
    "dateFormat": "h:mm A"
  }
}
```

## Configuration

### Timeline Config Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `items` | `TimelineItem[]` | `[]` | Static timeline items |
| `dataEndpoint` | `string` | - | API endpoint to fetch items dynamically |
| `style` | `TimelineStyle` | - | Visual style/layout options |
| `grouping` | `TimelineGrouping` | - | Grouping configuration |
| `interaction` | `TimelineInteraction` | - | Interaction settings |
| `dateFormat` | `string` | `'MMM DD, YYYY'` | Date format for timestamps |
| `showConnector` | `boolean` | `true` | Show connecting line between items |
| `sortOrder` | `'asc' \| 'desc'` | `'asc'` | Sort order by timestamp |
| `maxItems` | `number` | - | Maximum items to display |
| `emptyMessage` | `string` | `'No timeline items'` | Message when no items |

### Timeline Item Configuration

```typescript
{
  id: string | number;                 // Unique item identifier
  title: string;                       // Item title/heading
  description?: string;                // Item description/details
  timestamp?: string | Date;           // Item date/time
  icon?: string;                       // Icon to display (emoji, icon class, or SVG)
  status?: 'completed' | 'in-progress' | 'pending' | 'cancelled';
  badge?: {                            // Optional badge/label
    label: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
    outlined?: boolean;
  };
  link?: {                             // Optional link
    url: string;
    label?: string;
    target?: '_blank' | '_self';
    icon?: string;
  };
  metadata?: Array<{                   // Additional metadata fields
    key: string;
    value: string;
    icon?: string;
  }>;
  position?: 'left' | 'right' | 'center'; // For alternating layouts
  expanded?: boolean;                  // Initial expanded state
}
```

### Style Configuration

```typescript
{
  layout?: 'vertical' | 'horizontal';  // Timeline orientation
  alignment?: 'left' | 'center' | 'right' | 'alternating';
  markerStyle?: 'dot' | 'icon' | 'number' | 'none';
  lineStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  cardStyle?: boolean;                 // Use card/box style for items
  dense?: boolean;                     // Compact spacing
  animated?: boolean;                  // Enable animations
}
```

## Timeline Styles

### Style 1: Order Tracking Timeline

Simple vertical timeline with timestamps on the left - perfect for delivery tracking and progress monitoring.

```json
{
  "type": "timeline",
  "name": "orderTimeline",
  "label": "Order Status",
  "timelineConfig": {
    "items": [
      {
        "id": 1,
        "title": "Order Received",
        "timestamp": "2025-01-05T18:45:00",
        "status": "completed"
      },
      {
        "id": 2,
        "title": "Preparing Order",
        "timestamp": "2025-01-05T18:50:00",
        "status": "completed"
      },
      {
        "id": 3,
        "title": "On The Way",
        "timestamp": "2025-01-05T19:05:00",
        "status": "in-progress"
      },
      {
        "id": 4,
        "title": "Delivered!",
        "timestamp": "2025-01-05T19:15:00",
        "status": "pending"
      }
    ],
    "style": {
      "layout": "vertical",
      "alignment": "left",
      "markerStyle": "dot",
      "lineStyle": "solid",
      "cardStyle": false
    },
    "dateFormat": "h:mm A"
  }
}
```

**Example file:** `timeline-order-tracking.json`

### Style 2: Career Journey Timeline

Alternating card layout with rich content including badges, descriptions, metadata, and links - ideal for resumes, project histories, and achievements.

```json
{
  "type": "timeline",
  "name": "careerTimeline",
  "label": "Career & Achievements",
  "timelineConfig": {
    "items": [
      {
        "id": 1,
        "title": "Published my article site build with Gatsbyjs",
        "description": "Launched a personal blog using modern JAMstack architecture.",
        "timestamp": "2024-05-26",
        "status": "completed",
        "badge": {
          "label": "PROJECT",
          "color": "primary"
        },
        "link": {
          "url": "#",
          "label": "Check it out ▶",
          "target": "_blank"
        }
      },
      {
        "id": 2,
        "title": "Started working as MERN Stack Developer at Acme Lab",
        "description": "Joined a dynamic startup as a full-stack developer.",
        "timestamp": "2020-10-08",
        "status": "completed",
        "badge": {
          "label": "JOB",
          "color": "danger"
        },
        "metadata": [
          {
            "key": "Company",
            "value": "Acme Lab",
            "icon": "🏢"
          },
          {
            "key": "Role",
            "value": "Full Stack Developer",
            "icon": "💼"
          }
        ]
      }
    ],
    "style": {
      "layout": "vertical",
      "alignment": "alternating",
      "markerStyle": "dot",
      "lineStyle": "solid",
      "cardStyle": true,
      "animated": true
    },
    "dateFormat": "MMM DD, YYYY",
    "sortOrder": "desc"
  }
}
```

**Example file:** `timeline-career-journey.json`

### Style 3: Travel History Timeline

Year-grouped timeline with icon markers and expandable items - great for chronological event displays.

```json
{
  "type": "timeline",
  "name": "travelTimeline",
  "label": "Travel Timeline",
  "timelineConfig": {
    "items": [
      {
        "id": 1,
        "title": "United States East Coast Tour",
        "description": "Explored major cities including New York, Boston, and Washington D.C.",
        "timestamp": "2007-02-27",
        "status": "completed",
        "icon": "🗽",
        "badge": {
          "label": "USA",
          "color": "primary"
        },
        "metadata": [
          {
            "key": "Duration",
            "value": "2 weeks",
            "icon": "📅"
          },
          {
            "key": "Cities",
            "value": "3",
            "icon": "🏙️"
          }
        ]
      },
      {
        "id": 2,
        "title": "Barcelona & Tenerife",
        "description": "Mediterranean adventure combining city culture and island relaxation.",
        "timestamp": "2008-05-25",
        "status": "completed",
        "icon": "🏖️",
        "badge": {
          "label": "SPAIN",
          "color": "warning"
        }
      }
    ],
    "style": {
      "layout": "vertical",
      "alignment": "alternating",
      "markerStyle": "icon",
      "lineStyle": "solid",
      "cardStyle": true,
      "animated": true
    },
    "grouping": {
      "enabled": true,
      "groupBy": "year",
      "showGroupLabels": true,
      "groupLabelFormat": "YYYY"
    },
    "interaction": {
      "clickable": true,
      "expandable": true,
      "hoverable": true
    },
    "dateFormat": "MMM DD, YYYY",
    "sortOrder": "asc"
  }
}
```

**Example file:** `timeline-travel-history.json`

## Layout Options

### Vertical Layout (Default)

Timeline flows from top to bottom:

```json
{
  "style": {
    "layout": "vertical"
  }
}
```

### Alignments

**Left Alignment:**
```json
{
  "style": {
    "layout": "vertical",
    "alignment": "left"
  }
}
```
- Timeline marker and line on the left
- Content flows to the right
- Best for simple, chronological displays

**Center Alignment:**
```json
{
  "style": {
    "layout": "vertical",
    "alignment": "center"
  }
}
```
- Timeline marker and line centered
- Content on the right side
- Best for formal presentations

**Alternating Alignment:**
```json
{
  "style": {
    "layout": "vertical",
    "alignment": "alternating"
  }
}
```
- Items alternate left and right
- Timeline marker and line centered
- Best for visual interest and storytelling

## Marker Styles

### Dot Marker (Default)
```json
{
  "style": {
    "markerStyle": "dot"
  }
}
```
Simple circular markers - clean and minimal.

### Icon Marker
```json
{
  "style": {
    "markerStyle": "icon"
  }
}
```
Display icons from the `icon` property - visual and descriptive.

### Number Marker
```json
{
  "style": {
    "markerStyle": "number"
  }
}
```
Sequential numbering (1, 2, 3...) - shows order clearly.

### No Marker
```json
{
  "style": {
    "markerStyle": "none"
  }
}
```
No visible markers - minimal design.

## Status Indicators

Timeline items can have different status states that affect their visual styling:

### Completed
```json
{
  "status": "completed"
}
```
- Green marker
- Indicates finished/past events

### In Progress
```json
{
  "status": "in-progress"
}
```
- Yellow/orange marker with pulse animation
- Indicates current/active events

### Pending
```json
{
  "status": "pending"
}
```
- Gray marker
- Indicates future/upcoming events

### Cancelled
```json
{
  "status": "cancelled"
}
```
- Gray marker with strikethrough
- Indicates cancelled/skipped events

## Grouping

Group timeline items by time period or custom field:

### Year Grouping
```json
{
  "grouping": {
    "enabled": true,
    "groupBy": "year",
    "showGroupLabels": true,
    "groupLabelFormat": "YYYY"
  }
}
```

### Month Grouping
```json
{
  "grouping": {
    "enabled": true,
    "groupBy": "month",
    "showGroupLabels": true,
    "groupLabelFormat": "MMMM YYYY"
  }
}
```

### Custom Field Grouping
```json
{
  "grouping": {
    "enabled": true,
    "groupBy": "custom",
    "customGroupField": "category",
    "showGroupLabels": true
  }
}
```

## Interactions

Control how users can interact with timeline items:

```json
{
  "interaction": {
    "clickable": true,      // Items respond to clicks
    "expandable": true,     // Items can expand to show more details
    "hoverable": true       // Highlight on hover
  }
}
```

## Date Formatting

Customize how timestamps are displayed:

| Format | Example Output | Use Case |
|--------|---------------|----------|
| `'MMM DD, YYYY'` | Jan 05, 2025 | Default format |
| `'YYYY'` | 2025 | Year only |
| `'h:mm A'` | 6:45 PM | Time only |
| `'MMM DD, YYYY h:mm A'` | Jan 05, 2025 6:45 PM | Full datetime |

```json
{
  "dateFormat": "MMM DD, YYYY h:mm A"
}
```

## Card vs Simple Layout

### Card Style
```json
{
  "style": {
    "cardStyle": true
  }
}
```
- Bordered cards with padding
- Headers, body, and footer sections
- Hover effects and shadows
- Best for rich content

### Simple Style
```json
{
  "style": {
    "cardStyle": false
  }
}
```
- Minimal formatting
- No borders or cards
- Inline content
- Best for clean, simple timelines

## Dense Mode

Reduce spacing for compact display:

```json
{
  "style": {
    "dense": true
  }
}
```
- Smaller markers (32px vs 40px)
- Reduced spacing between items
- Smaller fonts
- Best for fitting more items in limited space

## Data Sources

### Static Data
Provide items directly in the configuration:

```json
{
  "items": [
    {
      "id": 1,
      "title": "Event 1",
      "timestamp": "2025-01-01"
    },
    {
      "id": 2,
      "title": "Event 2",
      "timestamp": "2025-01-15"
    }
  ]
}
```

### Dynamic Data (API)
Fetch items from an API endpoint:

```json
{
  "dataEndpoint": "/api/timeline-events"
}
```

The API should return an array of timeline item objects.

## Responsive Design

The timeline is fully responsive:
- Alternating and center layouts collapse to left-aligned on mobile
- Timestamps hidden on small screens
- Reduced padding and marker sizes
- Scrollable on narrow viewports

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Implementation Details

### Files Modified
- `src/app/dq-dynamic-form/models/field.model.ts` - Type definitions (80+ lines)
- `src/app/dq-dynamic-form/dq-dynamic-form.ts` - Component logic (290+ lines)
- `src/app/dq-dynamic-form/dq-dynamic-form.html` - Template (240+ lines)
- `src/app/dq-dynamic-form/dq-dynamic-form.scss` - Styles (590+ lines)
- `src/app/form-builder/form-builder.ts` - Form builder integration

### State Management
The timeline uses Angular signals for reactive state management:
- `timelineData` - Timeline items data
- `timelineExpanded` - Expanded item IDs
- `timelineLoading` - Loading state
- `timelineGroupedData` - Grouped items (when grouping enabled)

## Tips

1. **Status Colors**: Use status indicators to show progress visually
2. **Grouping**: Group long timelines by year or month for better organization
3. **Cards**: Use card style for content-rich items with metadata and links
4. **Dense Mode**: Use dense mode when space is limited
5. **Alternating**: Use alternating layout for visual interest in presentations
6. **Icons**: Use emoji icons for quick visual identification

## Complete Examples

See the example files in `/public/forms/`:
- `timeline-order-tracking.json` - Order delivery tracking
- `timeline-career-journey.json` - Professional achievements and milestones
- `timeline-travel-history.json` - Year-grouped travel history

## Future Enhancements

Potential future additions:
- Horizontal timeline orientation
- Custom marker templates
- Timeline zoom/pan controls
- Print-friendly styles
- Export to image
- Milestone markers
- Timeline branches (parallel events)
- Custom date range filtering
- Timeline playback/animation
- Import from calendar formats

## Support

For issues or questions, please refer to the main project README or create an issue in the repository.
