# Brancher - Design System & UI/UX Guidelines

**Version**: 1.0  
**Status**: Production Ready  
**Last Updated**: 2026-09-30

---

## 1. Design Philosophy

### Core Principles
1. **Clarity**: Informasi harus jelas dan mudah dipahami
2. **Consistency**: Komponen dan pola harus konsisten across platform
3. **Accessibility**: Desain untuk semua (WCAG 2.1 AA standard)
4. **Performance**: Visual feedback cepat, load time optimal
5. **Inclusivity**: Support untuk berbagai kemampuan dan preferensi
6. **Delight**: Microinteractions yang memberikan joy tanpa mengganggu

---

## 2. Color System

### Primary Brand Colors
```
Brand Blue:
├── Primary: #2563EB
├── Dark: #1E40AF
├── Light: #3B82F6
├── Lighter: #60A5FA
└── Lightest: #DBEAFE

Accent Purple:
├── Primary: #7C3AED
├── Dark: #6D28D9
├── Light: #A78BFA
└── Lightest: #EDE9FE
```

### Semantic Colors
```
Success (Green):
├── #10B981 (Primary)
├── #D1FAE5 (Light background)
├── #059669 (Dark)
└── #ECF5F0 (Lightest)

Error (Red):
├── #EF4444 (Primary)
├── #FEE2E2 (Light background)
├── #DC2626 (Dark)
└── #FCE7E7 (Lightest)

Warning (Amber):
├── #F59E0B (Primary)
├── #FEF3C7 (Light background)
├── #D97706 (Dark)
└── #FEF9E7 (Lightest)

Info (Blue):
├── #3B82F6 (Primary)
├── #DBEAFE (Light background)
├── #1E40AF (Dark)
└── #F0F9FF (Lightest)
```

### Neutral Colors (Grayscale)
```
├── #FFFFFF (White)
├── #F9FAFB (Gray-50)
├── #F3F4F6 (Gray-100)
├── #E5E7EB (Gray-200)
├── #D1D5DB (Gray-300)
├── #9CA3AF (Gray-400)
├── #6B7280 (Gray-500)
├── #4B5563 (Gray-600)
├── #374151 (Gray-700)
├── #1F2937 (Gray-800)
├── #111827 (Gray-900)
└── #000000 (Black)
```

### Dark Mode (Future)
```
When implementing dark mode:
├── Dark background: #0F172A (slate-900)
├── Surface: #1E293B (slate-800)
├── Muted: #475569 (slate-600)
├── Text primary: #F1F5F9 (slate-100)
└── Text secondary: #CBD5E1 (slate-300)
```

---

## 3. Typography System

### Font Stack
```css
/* Primary font for UI */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;

/* Monospace for code */
font-family: 'Monaco', 'Courier New', Courier, monospace;

/* Fallback */
font-family: system-ui, sans-serif;
```

### Type Scale
```
Display Large:
├── Size: 48px (3rem)
├── Weight: 700 (Bold)
├── Line-height: 1.2 (57.6px)
├── Letter-spacing: -0.02em
└── Usage: Page titles, major headers

Display Small:
├── Size: 36px (2.25rem)
├── Weight: 700 (Bold)
├── Line-height: 1.3 (46.8px)
└── Usage: Section headers

Heading Large:
├── Size: 28px (1.75rem)
├── Weight: 700 (Bold)
├── Line-height: 1.4 (39.2px)
└── Usage: Channel names, modal titles

Heading Medium:
├── Size: 20px (1.25rem)
├── Weight: 600 (SemiBold)
├── Line-height: 1.5 (30px)
└── Usage: Component headers

Heading Small:
├── Size: 16px (1rem)
├── Weight: 600 (SemiBold)
├── Line-height: 1.5 (24px)
└── Usage: Labels, secondary headers

Body Large:
├── Size: 16px (1rem)
├── Weight: 400 (Regular)
├── Line-height: 1.5 (24px)
└── Usage: Main body text, descriptions

Body Medium:
├── Size: 14px (0.875rem)
├── Weight: 400 (Regular)
├── Line-height: 1.43 (20px)
└── Usage: Secondary text, captions

Body Small:
├── Size: 12px (0.75rem)
├── Weight: 400 (Regular)
├── Line-height: 1.33 (16px)
└── Usage: Timestamp, metadata

Label:
├── Size: 12px (0.75rem)
├── Weight: 500 (Medium)
├── Line-height: 1.66 (20px)
└── Usage: Form labels, badges
```

### Font Weights
```
Light: 300
Regular: 400
Medium: 500
SemiBold: 600
Bold: 700
```

---

## 4. Spacing & Layout System

### Spacing Scale (8px base)
```
0px - xs0
4px - xs  (px-1 in Tailwind)
8px - sm  (px-2 in Tailwind)
12px - md  (px-3)
16px - lg  (px-4) ← Most common
24px - xl  (px-6)
32px - 2xl (px-8)
40px - 3xl (px-10)
48px - 4xl (px-12)
56px - 5xl (px-14)
64px - 6xl (px-16)
80px - 7xl (px-20)
96px - 8xl (px-24)
```

### Layout Grid
```
Base grid: 8px
Container width: 1200px (max)
Columns: 12

Breakpoints:
├── Mobile: < 640px (1 column)
├── Tablet: 640px - 1024px (2-4 columns)
├── Desktop: > 1024px (12 columns)
└── Wide: > 1440px (full width + padding)
```

### Padding & Margin Conventions
```
Component padding:
├── Compact: 12px (mobile)
├── Default: 16px (standard)
├── Spacious: 24px (desktop)

Section margins:
├── Between sections: 32px
├── Between blocks: 24px
├── Between items: 16px
├── Between sub-items: 8px
```

---

## 5. Component Library

### Button Component

**Variants**:
```jsx
// Primary (CTA)
<button className="btn btn-primary">Primary Action</button>
// ✅ #2563EB background, white text

// Secondary (Alternative)
<button className="btn btn-secondary">Secondary</button>
// ✅ #E5E7EB background, gray text

// Ghost (Minimal)
<button className="btn btn-ghost">Dismiss</button>
// ✅ Transparent, hover highlight

// Danger (Destructive)
<button className="btn btn-danger">Delete</button>
// ✅ #EF4444 background, white text
```

**Sizes**:
```
Small: 8px vertical, 16px horizontal, 14px font
Medium: 12px vertical, 20px horizontal, 16px font (default)
Large: 16px vertical, 24px horizontal, 18px font
```

**States**:
```
Enabled → Hover → Active → Disabled
└── Disabled: opacity 0.5, cursor not-allowed
```

### Form Inputs

**Guidelines**:
```
Text Input:
├── Height: 40px
├── Padding: 12px 16px
├── Border: 1px solid #E5E7EB
├── Border-radius: 6px
├── Font: 14px
└── Focus: Border #2563EB, shadow outline

Textarea:
├── Min height: 120px
├── Max height: 400px
├── Resize: Vertical only
└── Same styling as text input

Select/Dropdown:
├── Behavior: Click to open
├── Options styled: 40px height each
├── Highlight on hover: #F3F4F6 background
└── Icon: ▼ chevron 12px

Checkbox:
├── Size: 16px × 16px
├── Border-radius: 4px
├── Checked: #2563EB background + white checkmark
└── Focus: Box shadow outline

Radio:
├── Size: 16px × 16px
├── Circle shape
├── Filled circle inside when checked
└── Same focus handling as checkbox

Toggle Switch:
├── Width: 48px
├── Height: 24px
├── Unchecked: #D1D5DB background
├── Checked: #2563EB background
└── Knob: White, 20px × 20px, smooth animation

Label:
├── Font-weight: 500
├── Font-size: 14px
├── Color: #374151 (gray-700)
├── Margin-bottom: 8px
└── Required: Add red asterisk (*)
```

### Card Component
```
Default card:
├── Background: #FFFFFF
├── Border: 1px solid #E5E7EB
├── Border-radius: 8px
├── Padding: 16px
├── Box-shadow: 0 1px 3px rgba(0,0,0,0.1)

Hover state:
├── Box-shadow: 0 4px 6px rgba(0,0,0,0.1)
├── Border-color: #D1D5DB
└── Transition: smooth 200ms

Elevated variant:
├── Box-shadow: 0 10px 25px rgba(0,0,0,0.1)
└── Border: none
```

### Message Bubble
```
User message:
├── Background: #2563EB
├── Text color: White
├── Border-radius: 16px (rounded corners)
├── Max-width: 70% of container
├── Padding: 12px 16px
├── Margin: 8px between messages

Other user message:
├── Background: #F3F4F6
├── Text color: #111827
├── Same styling as user message

Timestamp:
├── Font-size: 12px
├── Color: #9CA3AF
├── Position: Below/beside message
└── Format: HH:MM (12-hour) or HH:MM (24-hour)
```

### Sidebar & Navigation
```
Branch/Channel item:
├── Height: 40px
├── Padding: 12px 16px
├── Hover: #F3F4F6 background
├── Active: #E0E7FF background (light blue)
├── Font-weight: 500
└── Icon: 16px × 16px

Unread badge:
├── Size: 20px
├── Background: #EF4444 (red)
├── Text: white, bold
├── Border-radius: 50% (circle)
├── Position: Top-right

Online indicator:
├── Size: 8px
├── Background: #10B981 (green)
├── Border-radius: 50% (circle)
├── Position: Bottom-right of avatar
└── Border: 2px white
```

### Avatar Component
```
Sizes:
├── XS: 24px
├── SM: 32px
├── MD: 40px (default)
├── LG: 56px
└── XL: 72px

Styling:
├── Border-radius: 50% (circle)
├── Background: Color based on user ID
├── Fallback: User initials (if no image)
├── Border: 2px white (when stacked)

Colors (deterministic based on user ID):
├── Palette: 8 colors (blue, purple, pink, red, orange, green, teal, indigo)
└── Hash user ID to select color
```

### Modal/Dialog
```
Overlay:
├── Background: rgba(0, 0, 0, 0.5)
├── Backdrop-filter: blur(4px) (optional)
└── Click outside to close

Modal container:
├── Max-width: 500px (medium), 700px (large)
├── Background: #FFFFFF
├── Border-radius: 12px
├── Box-shadow: 0 20px 25px rgba(0,0,0,0.1)
└── Padding: 24px

Title:
├── Font-size: 20px
├── Font-weight: 600
├── Color: #111827
└── Margin-bottom: 16px

Body:
├── Font-size: 14px
├── Color: #374151
├── Line-height: 1.5
└── Margin-bottom: 24px

Actions (footer):
├── Display: flex, justify-end
├── Gap: 12px
├── Buttons: Primary + Secondary
└── Example: Cancel + Confirm
```

### Toast/Notification
```
Position: Top-right (default), or customizable

Styles by type:
├── Success: #10B981 background, white text, ✓ icon
├── Error: #EF4444 background, white text, ✗ icon
├── Warning: #F59E0B background, white text, ⚠ icon
└── Info: #3B82F6 background, white text, ℹ icon

Dimensions:
├── Max-width: 400px
├── Padding: 16px
├── Border-radius: 8px
└── Box-shadow: 0 10px 25px rgba(0,0,0,0.2)

Animation:
├── Entry: Slide in from top-right (300ms)
├── Exit: Fade out (200ms)
├── Auto-dismiss: 4 seconds (or manual close)
└── Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

---

## 6. Interactive Patterns

### Loading States
```
Skeleton Loading:
├── Placeholder: #F3F4F6 background
├── Animation: Shimmer effect (left to right)
├── Duration: 1s, loop
└── Use for: Message list, user list, etc.

Spinner:
├── Size: 24px, 32px, 40px
├── Color: #2563EB
├── Animation: Rotate 360° in 1s
└── Use for: Full page load, async operations

Progress Bar:
├── Height: 4px
├── Background: #E5E7EB
├── Fill: #2563EB
├── Border-radius: 2px
└── Use for: File uploads, page navigation

Lazy Loading:
├── Trigger: Infinite scroll (scroll near bottom)
├── Show: Spinner at bottom
├── Load: 50 items per request
└── Behavior: Smooth append to list
```

### Transition & Animation
```
Default animations:
├── Quick: 100-200ms (button hover, icon change)
├── Standard: 200-300ms (modal open, sidebar slide)
└── Slow: 400-600ms (page transition, complex animation)

Easing functions:
├── ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) - default
├── ease-out: cubic-bezier(0, 0, 0.2, 1) - exit
└── ease-in: cubic-bezier(0.4, 0, 1, 1) - enter

Micro-interactions:
├── Button: Slight scale on press (0.95x)
├── Form focus: Border color + shadow transition
├── Hover: Color change + slight lift (shadow increase)
└── Click: Ripple effect (optional, modern feel)
```

### Drag & Drop
```
Drag states:
├── Dragging: Opacity 0.7, cursor grabbing
├── Hover target: Dashed border + highlight
├── Drop zone: Highlight when file over
└── Invalid: Red border + error message

File upload:
├── Drag & drop zone: 200px height
├── Accept: Images, documents, files (configured)
├── Max size: 10MB per file
├── Feedback: Upload progress
└── Result: Success/error message
```

---

## 7. Accessibility (WCAG 2.1 AA)

### Color Contrast
```
Minimum ratios:
├── Normal text: 4.5:1
├── Large text (18px+): 3:1
├── UI components: 3:1
└── Graphical elements: 3:1

Avoid:
├── ❌ Red-green color only (colorblind)
├── ❌ Gray text on white (low contrast)
└── ❌ Small text with low contrast
```

### Keyboard Navigation
```
Required:
├── Tab order: Logical, left-to-right, top-to-bottom
├── Tab key: Move forward
├── Shift+Tab: Move backward
├── Enter: Activate button, submit form
├── Space: Toggle checkbox, expand menu
├── Escape: Close modal, cancel action
├── Arrow keys: Navigate menu, select option

Focus indicator:
├── Visible outline: 2px solid #2563EB
├── Offset: 2px from element
└── No removal of browser default (style only)
```

### Screen Reader Support
```
ARIA attributes:
├── aria-label: Describe icon buttons
├── aria-expanded: Expanded/collapsed state
├── aria-disabled: Disabled state
├── aria-live: Announce changes (messages, notifications)
├── role="alert": Important announcements
└── role="dialog": Modal dialogs

Semantic HTML:
├── Use <button>, not <div> for buttons
├── Use <form>, <input>, <label>
├── Use <nav>, <header>, <footer>
├── Use <img alt="description">
└── Use heading hierarchy (h1 → h2 → h3)
```

### Motion & Animation
```
Respect motion preferences:
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

Seizure prevention:
├── No flashing > 3 per second
├── No red flashing (risk of seizure)
└── No large areas of bright contrast
```

---

## 8. Responsive Design

### Mobile-First Approach
```
Layout:
├── Single column on mobile
├── Stack navigation vertically
├── Full-width content
└── Touch targets: 44px minimum

Breakpoints:
├── Mobile (360px - 639px): Single column
├── Tablet (640px - 1023px): 2-4 columns
├── Desktop (1024px+): Full layout
└── Wide (1440px+): Max-width container
```

### Touch Interactions
```
Button/Link size: 44px × 44px minimum
Gap between targets: 8px minimum
Touch feedback: Color change + haptic
Swipe gestures: Left/right for navigation

Mobile optimization:
├── Large thumbs-friendly buttons
├── Reduced text (prioritize important)
├── Minimize scrolling
├── Native select instead of dropdown
└── Full-width inputs
```

---

## 9. Dark Mode (Future Implementation)

### Color Mapping
```
Light → Dark:
├── #FFFFFF → #0F172A
├── #F9FAFB → #1E293B
├── #F3F4F6 → #334155
├── #2563EB → #60A5FA
├── #111827 → #F1F5F9

Implementation:
├── CSS variables with media query
├── localStorage preference
├── System preference detection
└── Toggle in settings

Approach:
```css
:root {
  --color-bg: #FFFFFF;
  --color-text: #111827;
  --color-primary: #2563EB;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #0F172A;
    --color-text: #F1F5F9;
    --color-primary: #60A5FA;
  }
}
```

---

## 10. UX Improvements Roadmap

### Phase 1: Current (v0.1.0)
✅ Implemented:
- Basic message input/display
- Channel navigation
- User online status
- Message reactions (emoji)

### Phase 2: Polish (v0.2.0)
- [ ] Message search enhancement
- [ ] Rich text editing (bold, italic, code blocks)
- [ ] Markdown preview
- [ ] Emoji picker component
- [ ] User profile cards with bio
- [ ] Settings panel (notifications, preferences)
- [ ] Better message grouping by day

### Phase 3: Advanced (v0.3.0)
- [ ] Voice message support
- [ ] File preview (images, PDFs)
- [ ] Link preview (OpenGraph)
- [ ] Typing indicator improvements
- [ ] Read receipts
- [ ] Message threading/replies
- [ ] Custom user themes

### Phase 4: Delight (v0.4.0)
- [ ] Animations & transitions
- [ ] Dark mode
- [ ] Customizable themes
- [ ] User presence better visualized
- [ ] Easter eggs & surprises
- [ ] Achievement/badge system
- [ ] Sound notifications

---

## 11. Implementation Guidelines

### CSS Architecture
```
File structure:
├── styles.css (global)
├── components/
│   ├── Button.css
│   ├── Card.css
│   ├── Modal.css
│   └── ... (per component)
└── utils.css (utility classes)

Naming convention:
├── Classes: BEM or utility-first (Tailwind)
├── Colors: Use CSS variables
├── Sizing: Use spacing scale
└── Breakpoints: Mobile-first media queries

Example:
.btn {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  transition: all 200ms var(--easing-out);
}

.btn:hover {
  box-shadow: var(--shadow-md);
}

@media (max-width: 640px) {
  .btn {
    padding: var(--spacing-sm) var(--spacing-md);
  }
}
```

### React Component Patterns
```jsx
// Example: Button component with design system
const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  children,
  ...props 
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${disabled ? 'disabled' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};

// Example: Card component
const Card = ({ title, children, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {title && <h3 className="card-title">{title}</h3>}
      <div className="card-body">{children}</div>
    </div>
  );
};
```

---

## 12. Design Assets & Resources

### Tools
- **Design**: Figma (cloud-based, collaboration)
- **Prototyping**: Figma or Framer
- **Color**: https://www.colorhexa.com/
- **Font**: Google Fonts (system fonts preferred for performance)
- **Icons**: Heroicons (MIT licensed)
- **Accessibility checker**: WAVE, Axe, Lighthouse

### Design Token Export
```json
{
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px",
    "lg": "24px"
  },
  "colors": {
    "primary": "#2563EB",
    "success": "#10B981"
  },
  "typography": {
    "heading": {
      "size": "20px",
      "weight": 600
    }
  }
}
```

---

## 13. Performance Considerations

### Image Optimization
```
Avatar images:
├── Format: WebP (fallback: PNG)
├── Size: 40px - 96px
├── File size: < 10KB per image
└── Lazy load: Yes

Message attachments:
├── Preview: Compressed thumbnail
├── Original: Store in S3/CDN
├── Max size: 10MB
└── Formats: JPEG, PNG, WebP, PDF

Recommendations:
- Use srcset for responsive images
- Implement lazy loading with Intersection Observer
- Compress images before upload
- Serve from CDN
```

### Bundle Size
```
Current: ~68KB (gzipped)
Target: < 50KB

Optimizations:
├── Code splitting: Lazy load routes
├── Tree-shaking: Remove unused code
├── Minification: Production builds
├── Compression: gzip/brotli
└── CDN delivery: Geographic distribution

Monitor:
- Use Bundle Analyzer (webpack-bundle-analyzer)
- Set size budget: 50KB threshold
- CI check: Fail if exceeds budget
```

---

## 14. User Testing & Feedback

### Metrics to Track
```
Engagement:
├── Message send rate
├── DAU (Daily Active Users)
├── Session duration
└── Feature usage

UX Metrics:
├── Page load time (< 3s target)
├── Time to send message (< 100ms target)
├── Error rate (< 1% target)
└── Crash rate (0% target)

Satisfaction:
├── NPS (Net Promoter Score)
├── CSAT (Customer Satisfaction)
├── Feature request frequency
└── Bug report frequency
```

### User Testing Plan
```
Research methods:
├── User interviews (monthly, 5 users)
├── Usability testing (per release)
├── A/B testing (for UI changes)
├── Analytics review (weekly)
└── Feedback collection (in-app surveys)

Frequency:
├── Pre-launch: Weekly
├── Early release: Bi-weekly
├── Mature product: Monthly
└── Major changes: As needed
```

---

## Conclusion

Design System ini menyediakan foundation yang solid untuk menciptakan pengalaman user yang konsisten, accessible, dan delightful di Brancher.

**Immediate Implementation**:
1. ✅ Document current design (done)
2. ⏳ Create Figma component library
3. ⏳ Export design tokens to CSS variables
4. ⏳ Audit current UI against this system
5. ⏳ Create component storybook

**Success Criteria**:
- All components documented dan reusable
- 95% WCAG 2.1 AA compliance
- < 50KB gzipped bundle size
- < 1.5s Time to Interactive

---

*Design System v1.0*  
*Last Updated: 2026-09-30*  
*Maintained by: Design & Frontend Team*  
*Review Schedule: Quarterly*
