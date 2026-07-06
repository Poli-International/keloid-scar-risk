# Keloid & Hypertrophic Scar Risk Assessor - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Schemas](#data-schemas)
3. [Calculation / Logic Algorithms](#calculation--logic-algorithms)
4. [API Reference](#api-reference)
5. [Integration Guide](#integration-guide)
6. [Customization](#customization)
7. [Performance](#performance)
8. [Browser Compatibility](#browser-compatibility)
9. [Security](#security)
10. [Version History](#version-history)
11. [Support / Contact](#support--contact)

## Architecture Overview

### Technology Stack

The tool is a dependency-free, static single-page application built with:

- **HTML5**, Semantic markup with no external frameworks
- **CSS3**, Single stylesheet (`/tools/keloid-scar-risk/css/style.css`)
- **Vanilla JavaScript (ES6)**, No libraries, no build tools, no runtime dependencies

### File Structure

```
/tools/keloid-scar-risk/
├── index.html          # Entry point, form container, result area
├── css/
│   └── style.css       # All visual styling (referenced but not provided in source)
└── js/
    └── app.js          # All application logic, data, and event handlers
```

### Component / Logic Breakdown

| Component | File | Responsibility |
|-----------|------|----------------|
| HTML Shell | `index.html` | Page structure, meta tags, iframe detection, form container |
| Styles | `style.css` | Visual presentation (external file, not analyzed here) |
| Application Logic | `app.js` | Factor definitions, form rendering, validation, scoring, result generation |

The application follows a simple procedural pattern:

1. **Data definition**, The `FACTORS` array defines all six clinical factors with their options and scores
2. **Form rendering**, DOM elements are created dynamically from the `FACTORS` data
3. **Validation**, The Calculate button enables only when all six factors have a selected radio option
4. **Calculation**, On click, scores are summed and mapped to a risk tier
5. **Result display**, A result card with tier, score bar, recommendations, and warning signs is rendered

## Data Schemas

### `FACTORS` Array (Constant)

The core data structure is an array of six factor objects. Each object has the following schema:

```javascript
{
  id: String,           // Unique identifier (e.g., "personal", "family")
  label: String,        // Human-readable factor name
  help: String,         // Explanatory tooltip/help text
  options: [            // Array of selectable answers
    {
      text: String,     // Display text for the radio option
      score: Number     // Integer weight (0, 2, 3, 4, 6, or 10)
    }
  ]
}
```

### Factor Definitions (Real Values)

| id | label | options (text → score) |
|----|-------|------------------------|
| `personal` | Personal history of raised scars | "No history of raised scars" → 0, "One raised scar that flattened over time (hypertrophic)" → 4, "Persistent or growing keloid at any prior site" → 10 |
| `family` | Family history of keloids | "No known family history" → 0, "One parent or sibling with keloids" → 3, "Multiple relatives affected" → 6 |
| `skin` | Skin phototype (Fitzpatrick scale) | "Type I–II (very fair / fair)" → 0, "Type III–IV (medium / olive)" → 2, "Type V–VI (brown / dark brown)" → 4 |
| `location` | Intended procedure location | "Earlobe, nose, eyebrow, lip, or other facial site" → 0, "Ear cartilage, navel, tongue, or upper arm" → 3, "Chest, upper back, shoulder, or jawline" → 6 |
| `age` | Current age | "Under 25" → 3, "25–40" → 2, "Over 40" → 0 |
| `prior` | Reaction at any previous piercing or tattoo site | "No prior procedure, or healed with no raised tissue" → 0, "Had a bump that resolved over several months" → 3, "Persistent raised scar or still-present bump" → 6 |

### Risk Tier Object (Returned by `getTier()`)

```javascript
{
  tier: String,    // "Low", "Moderate", "Elevated", or "High"
  cls: String,     // CSS class: "tier-low", "tier-mod", "tier-high", "tier-vhigh"
  icon: String,    // Emoji: "🟢", "🟡", "🟠", "🔴"
  msg: String      // Full advisory message text
}
```

### Result Card HTML Structure (Generated)

The result card contains:

- Header with icon, tier label, and numeric score (e.g., "Score: 14 / 29")
- Risk bar with percentage fill (score / 29 × 100)
- Advisory message
- Material recommendation section (with BioFlex® link)
- Warning signs list (four bullet points)

## Calculation / Logic Algorithms

### `calculate()` Function

This is the main event handler triggered when the user clicks "Calculate My Risk →".

**Step-by-step execution:**

1. **Initialize score**, `let score = 0`
2. **Iterate over all factors**, For each factor in the `FACTORS` array:
   - Find the checked radio input by factor `id`
   - If found, parse its `value` attribute as an integer and add to `score`
3. **Call `getTier(score)`** to determine the risk tier
4. **Calculate percentage**, `Math.min(100, Math.round(score / 29 * 100))`
   - Maximum possible score is 29 (10 + 6 + 4 + 6 + 3 + 6)
   - Percentage is capped at 100
5. **Render result card**, Build and inject HTML into the `#result` div
6. **Scroll to result**, `resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`

### `getTier(score)` Function

Maps a numeric score to a risk tier using these thresholds:

| Score Range | Tier | CSS Class | Icon |
|-------------|------|-----------|------|
| 0–5 | Low | `tier-low` | 🟢 |
| 6–12 | Moderate | `tier-mod` | 🟡 |
| 13–20 | Elevated | `tier-high` | 🟠 |
| 21–29 | High | `tier-vhigh` | 🔴 |

### `escHtml(s)` Helper Function

Sanitizes user-facing strings by escaping HTML special characters:

```javascript
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

Applied to all dynamic text content inserted into the DOM (factor labels, help text, option text, result messages).

### Form Validation Logic

```javascript
form.addEventListener('change', () => {
  btn.disabled = !FACTORS.every(f => form.querySelector(`input[name="${f.id}"]:checked`));
});
```

The Calculate button remains disabled until every factor group has exactly one selected radio input. Validation runs on every `change` event within the form.

## API Reference

### Public Functions

| Function | Parameters | Returns | Description |
|----------|------------|---------|-------------|
| `escHtml(s)` | `s`: String (any value) | Sanitized String | Escapes `&`, `<`, `>`, `"` for safe HTML insertion |
| `getTier(score)` | `score`: Number (0–29) | Object `{ tier, cls, icon, msg }` | Maps numeric score to risk tier with display properties |
| `calculate()` | None | `undefined` (renders DOM) | Main handler: sums scores, generates result card, scrolls into view |

### Event Handlers

| Element | Event | Handler | Behavior |
|---------|-------|---------|----------|
| `#risk-form` | `change` | Inline arrow function | Enables/disables Calculate button based on all-factors-checked condition |
| `#calc-btn` | `click` | `calculate` | Triggers scoring and result display |

### Global Variables

| Variable | Type | Description |
|----------|------|-------------|
| `FACTORS` | Array (constant) | Six factor definitions with labels, help text, and scoring options |
| `form` | DOM Element | Reference to `#risk-form` |
| `btn` | DOM Element | Reference to `#calc-btn` |
| `resultDiv` | DOM Element | Reference to `#result` |

## Integration Guide

### Standalone Embedding

The tool is fully self-contained and can be embedded via iframe:

```html
<iframe
  src="https://poliinternational.com/tools/keloid-scar-risk/"
  width="100%"
  height="800"
  frameborder="0"
  title="Keloid & Hypertrophic Scar Risk Assessor"
></iframe>
```

### Iframe Communication

The tool includes automatic iframe detection:

```javascript
if (window.self !== window.top) {
  document.documentElement.setAttribute('data-theme', 'dark');
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'poli-theme') {
      document.documentElement.setAttribute('data-theme', e.data.light ? 'light' : 'dark');
    }
  });
}
```

When embedded:
- Default theme is **dark**
- Parent page can send a `postMessage` with `{ type: 'poli-theme', light: true/false }` to toggle between light and dark themes
- The `data-theme` attribute is set on `<html>` for CSS targeting

### Dependencies

Zero external dependencies. No jQuery, no React, no CSS frameworks, no CDN resources.

## Customization

### Modifying Factor Options

Edit the `FACTORS` array in `js/app.js`:

- Add new factors by appending objects with `id`, `label`, `help`, and `options` array
- Adjust scores by changing the `score` values in any option object
- Change option text by editing the `text` property

### Adjusting Risk Thresholds

Modify the score ranges in the `getTier()` function:

```javascript
// Current thresholds
if (score <= 5)  return { tier:'Low', ... };
if (score <= 12) return { tier:'Moderate', ... };
if (score <= 20) return { tier:'Elevated', ... };
return { tier:'High', ... };
```

### Changing Result Content

Edit the template literal inside `calculate()` to modify:

- Advisory messages
- Material recommendation text
- Warning signs list items
- BioFlex® link URL

## Performance

- **Total payload**: ~5 KB (HTML + JS, excluding CSS)
- **DOM operations**: Minimal, form rendered once, result card replaced on each calculation
- **No network requests**: All logic runs client-side with zero API calls
- **No animations or timers**: No `setInterval`, `requestAnimationFrame`, or CSS transitions that impact performance
- **Event listeners**: Two total (form change, button click)

## Browser Compatibility

The tool uses standard ES6 features:

- `const` / `let` (ES6)
- Arrow functions (ES6)
- Template literals (ES6)
- `Array.forEach()` (ES5)
- `Array.every()` (ES5)
- `String.replace()` with regex (ES3)
- `Element.scrollIntoView()` (ES6, widely supported)

Compatible with all modern browsers:

- Chrome 49+
- Firefox 52+
- Safari 10+
- Edge 14+
- Opera 36+

Internet Explorer is not supported due to ES6 syntax.

## Security

### XSS Prevention

All user-facing text is sanitized through the `escHtml()` function before DOM insertion. This function escapes four HTML-sensitive characters:

- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;`

Applied to:
- Factor labels and help text
- Radio option text
- Result tier names and messages
- Score display values

### Input Handling

- No user text input fields exist, all input is via controlled radio buttons
- Radio button values are hardcoded integers (0, 2, 3, 4, 6, 10)
- Values are parsed with `parseInt()` with explicit radix 10
- No form submission occurs, all processing is client-side

### Iframe Security

- The tool sets `noindex, nofollow` meta robots tag to prevent search indexing of the iframe content
- Parent page communication is restricted to a single message type (`poli-theme`)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | Initial release | Six-factor keloid/hypertrophic scar risk assessment with tiered results |

## Support / Contact

For technical issues or integration questions:

- **Email**: support@poliinternational.com
- **Website**: https://poliinternational.com/
- **Tool URL**: https://poliinternational.com/tools/keloid-scar-risk/
