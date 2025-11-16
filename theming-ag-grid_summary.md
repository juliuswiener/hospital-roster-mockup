# AG Grid React Data Grid Theming Documentation

## 1. Overview

This documentation details the Theming API for customizing the appearance of the AG Grid component when used within a React application. The core functionality revolves around applying built-in themes, tuning specific visual parameters via JavaScript objects, mixing parts from different themes, or overriding presentation entirely using custom CSS. Key differentiators include high levels of configurability through structured Theme Parameters, native integration with design tokens, and robust backwards compatibility support via legacy theme options. The primary use case is integrating the grid seamlessly into diverse application design systems or corporate branding guidelines.

## 2. Core Concepts & Terminology

The API heavily relies on structured configuration objects passed to the grid component rather than simple CSS class names, distinguishing itself from older theming methodologies.

- **Theme Object (e.g., `themeQuartz`):** A fundamental JavaScript object representing a complete theme configuration, encompassing parameters and pre-defined selectable parts. Themes are immutable and configured via chaining methods like `withParams()` and `withPart()`.
- **Theme Parameter:** Configuration values that control specific visual aspects (e.g., color, spacing, border style). These map directly to CSS custom properties (prefixed with `--ag-`) in the rendered DOM. Parameters are identified by their suffix (e.g., `*Color`, `*Border`, `*Length`).
- **Theme Part:** A predefined collection of styles that represent a specific grid feature (e.g., icons, checkboxes, buttons). Parts can be mixed and matched across different base themes using the `withPart()` method.
- **Color Scheme:** A specific set of key color parameter definitions (e.g., `colorSchemeDark`, `colorSchemeLight`). Custom color schemes can be added to a theme via `withPart()`.
- **Theme Mode:** A concept allowing the appearance (specifically the applied color scheme) to be dynamically toggled based on an attribute (`data-ag-theme-mode`) applied to a parent DOM element (like `body` or `html`), especially relevant when using the default `colorSchemeVariable`.
- **Length Value:** A theme parameter type representing a measurement (e.g., spacing, width, height). Can accept standard CSS length strings, raw pixels (number assumed to be pixels), or complex reference/calculation objects.
- **Color Value:** A theme parameter type for colors. Supports standard CSS colors, or an extended syntax for referencing and mixing other color parameters.
- **Border Value:** A theme parameter type for borders. Supports standard CSS border strings or an object structure allowing granular definition of width, style, and color, with support for referencing other parameters.
- **iconOverrides Part:** A specialized Theme Part used to replace individual icons using images (URLs/SVGs) or icon font glyphs/emoji instead of the provided internal sets.

## 3. Authentication & Authorization

No specific authentication or authorization methods were documented in the source material, as the documentation concerns client-side styling and theming of a React component library, not server-side API access.

## 4. API Reference

The primary interface discussed is the React component property `theme` and methods on Theme Objects provided by `ag-grid-community`. No raw REST API endpoints were detailed.

### 4.1 REST API Endpoints

Not applicable. (No REST API endpoints documented.)

### 4.2 SDK/Library Interface

The interface is exposed via the `ag-grid-community` package, primarily for use within React applications (`AgGridReact`).

**`### [JS/TS] SDK`** (Assuming JavaScript/TypeScript context based on source examples)

**Installation:**
```javascript
// Installation command inferred from context:
npm install ag-grid-community
```

**Initialization (Applying a Theme):**

The theme object is supplied to the `theme` prop of the `AgGridReact` component.

```javascript
import { themeBalham } from 'ag-grid-community';

<AgGridReact
    theme={themeBalham}
    ...
/>
```

**Theme Object Methods (Applied to an existing Theme Object):**

These methods return a *new* theme object based on the current instance, supporting a fluent, immutable configuration pattern.

**`#### theme.withParams(params, modeName?)`**

- **Purpose:** Returns a new theme object where default values for Theme Parameters are set. Can optionally define a custom mode name.
- **Comparison to REST API:** Sets the default values for CSS custom properties used by the theme, overriding the base theme's defaults.
- **Parameters:**

  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | params | object | Required | A map of Theme Parameter names to their new values (using extended syntax if applicable). |
  | modeName | string | Optional | A string defining a custom mode if setting theme modes for dynamic light/dark switching. |

- **Returns:** A new Theme Object.
- **Raises/Throws:** Not specified in documentation, but implies validation based on parameter types.

**`#### theme.withPart(part)`**

- **Purpose:** Returns a new theme object that incorporates a specific Theme Part, overriding any existing part of the same feature type.
- **Comparison to REST API:** Adds pre-packaged visual styles (like a new icon set or checkbox appearance) to the theme configuration.
- **Parameters:**

  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | part | object | Required | A Theme Part object (e.g., an icon set or color scheme). |

- **Returns:** A new Theme Object.

**`#### theme.withoutPart(featureName)`**

- **Purpose:** Returns a new theme object without the part associated with the specified built-in feature name.
- **Comparison to REST API:** Removes the built-in visual style associated with a feature, allowing it to revert to browser defaults or be styled exclusively via application CSS.
- **Parameters:**

  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | featureName | string | Required | The name of the feature whose part should be removed (e.g., `"checkboxStyle"`). |

- **Returns:** A new Theme Object.

**Utility Functions:**

**`#### createTheme()`**

- **Purpose:** Creates a new theme object from scratch, containing core styles but no predefined parts.
- **Comparison to REST API:** Provides a minimal base for theme creation when overriding most existing parts, potentially reducing bundle size compared to starting from a built-in theme.
- **Parameters:** None.
- **Returns:** A new, minimal Theme Object.

**`#### iconOverrides(config)`**

- **Purpose:** Creates a specialized Theme Part object designed specifically for overriding individual icons.
- **Comparison to REST API:** Generates the configuration object needed for the `iconOverrides` feature.
- **Parameters:**

  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | config | object | Required | Configuration object detailing the override type (`image` or `font`) and icon mappings. |

- **Returns:** A Theme Part object (feature: `iconOverrides`).

**`#### createPart(config)`**

- **Purpose:** Creates a custom, reusable Theme Part object that can bundle parameters and scoped CSS.
- **Comparison to REST API:** Allows creation of organizational design system components that can be inserted via `theme.withPart()`.
- **Parameters:**

  | Parameter | Type | Required | Description |
  |-----------|------|----------|-------------|
  | config | object | Required | Configuration including optional `feature` name, `params`, and scoped `css` string. |

- **Returns:** A custom Theme Part Object.

**Grid Options Related to Theming:**

| Option Name | Type | Context | Description |
|---|---|---|---|
| `theme` | Theme Object or string | Grid Property | The theme object to apply (e.g., `themeQuartz`) or `"legacy"` to revert to v32 styling. Defaults to Quartz if omitted. |
| `loadThemeGoogleFonts` | boolean | Grid Property | If true, the grid will load required Google Fonts from CDN. |
| `domLayout` | string | Grid Property | Controls layout dynamics. Values affecting visual output: `'normal'` or `'autoHeight'`. |
| `themeCssLayer` | string | Grid Property | Specifies the CSS layer name into which grid styles should be loaded, allowing application CSS to override grid CSS more easily. |

## 5. Integration Patterns

### Dynamically Switching Themes (Theme Modes)

- **When to Use:** When integrating the grid into a host application that features a global dark/light mode toggle, and direct JS theme switching is impractical or undesirable.
- **Advantages:** The grid adapts automatically to the parent element's `data-ag-theme-mode` attribute if using the default `colorSchemeVariable` color scheme.
- **Trade-offs:** Requires the theme to use `colorSchemeVariable` or requires explicit definition of modes via `withParams(..., modeName)`.
- **Setup Requirements:** The theme must be configured with modes, and the host application must set attributes like `data-ag-theme-mode="dark"`.

```javascript
// Configuring a theme to handle modes:
const myTheme = themeQuartz
    .withParams(
        {
            backgroundColor: '#FFE8E0',
            foregroundColor: '#361008CC',
            browserColorScheme: 'light',
        },
        'light-red' // Custom mode name
    )
    .withParams(
        {
            backgroundColor: '#201008',
            foregroundColor: '#FFFFFFCC',
            browserColorScheme: 'dark',
        },
        'dark-red' // Custom mode name
    );

// Host application implementation:
// document.body.setAttribute('data-ag-theme-mode', 'dark'); 
```

### Creating Bundled, Reusable Styles via Custom Parts

- **When to Use:** For large organizations sharing a standard visual design across multiple disparate applications, or when needing to package complex CSS changes scoped only to grids using that part.
- **Advantages:** Provides CSS style scoping specific to the part, preventing global CSS conflicts, a benefit over application-wide stylesheet modifications.
- **Trade-offs:** Requires using the `createPart` utility and ensuring parameter naming conventions are followed for type inference and extended syntax support.
- **Setup Requirements:** Requires defining a feature name (or omitting it for a general part) and specifying parameters/scoped CSS.

```javascript
import { createPart } from 'ag-grid-community';

const myCheckboxStyle = createPart({
    feature: 'checkboxStyle',
    params: {
        checkboxCheckedGlowColor: { ref: 'accentColor' },
        checkboxGlowColor: { ref: 'foregroundColor', mix: 0.5 },
        accentColor: 'red',
    },
    css: `
        .ag-checkbox-input-wrapper {
            border-radius: 4px;
            /* Reference to parameter in CSS uses --ag- prefix and kebab-case */
            box-shadow: 0 0 5px 4px var(--ag-checkbox-glow-color);

        ... css implementing the new checkbox style ...
        
        `
});

// Usage:
const myCustomTheme = themeQuartz.withPart(myCheckboxStyle);
```

### Overriding Theme Parameters via CSS Custom Properties

- **When to Use:** To fine-tune already configured parameters, or when CSS modification is preferred over JS object manipulation, especially to leverage application-wide CSS variables.
- **Advantages:** Parameters set via this method override defaults set by the Theming API, and CSS variable settings are inherited naturally by all child elements, including detail grids whose themes are not explicitly specified.
- **Trade-offs:** CSS specificity must be managed carefully to ensure custom property overrides are not masked by more specific default grid rules (though specificity has generally been reduced in the new API). Writing raw CSS carries a higher risk of breaking between minor grid releases compared to using the JS API parameters.
- **Setup Requirements:** Ensure CSS variables are prefixed with `--ag-` and use kebab-case conversion of the parameter name (e.g., `spacing` becomes `--ag-spacing`).

```css
body {
    --ag-background-color: darkred;
    --ag-foreground-color: lightpink;
    --ag-spacing: 4px;
    --ag-browser-color-scheme: dark;
}
```

## 6. Configuration & Advanced Options

This section documents Theme Parameters and related grid options that control visual and physical aspects of the grid layout.

### Layout & Spacing Configuration

**`spacing` Parameter (Length Value)**
- **Type:** Length Value (number, string CSS length, `{ ref: 'spacing' }`, or `{ calc: '...' }`)
- **Purpose:** Controls general padding across the grid, affecting compactness by defining the base unit for white space.
- **Impact:** Increasing this value adds more internal white space, making components larger. Decreasing it tightens packing.
- **Recommended Values:** Base default is determined by the underlying theme. A raw number is assumed to be pixels.
- **Constraints:** Accepts any valid CSS length value. Default unit for raw numbers is pixels.

**`rowVerticalPaddingScale` & `headerVerticalPaddingScale` (Scale Values)**
- **Type:** Scale Value (number)
- **Purpose:** Multiplies the standard padding component of row/header height calculation.
- **Impact:** Adjusts padding relative to font/icon size changes, preserving proportional scaling behavior.
- **Recommended Values:** Numeric values like `0.75` for 3/4 padding.
- **Constraints:** Plain numbers; used as a multiplier.

**`rowHeight`, `headerHeight`, `listItemHeight` (Length Values)**
- **Type:** Length Value (string CSS length)
- **Purpose:** Sets the height of rows, headers, or list items (e.g., in rich select editors) to a fixed value.
- **Impact:** Overrides calculation based on font/icon sizes entirely. Essential for DOM virtualization stability.
- **Recommended Values:** Must include units (e.g., `'30px'`). Unsetting application height on the grid div might be required when using `domLayout='autoHeight'`.
- **Constraints:** Must be CSS length values. Setting the height via these parameters/CSS variables is *required* for reliable DOM virtualization. Setting height directly on `.ag-row` CSS class is not supported.

### Border Configuration

Parameters ending in `*Border`, `*BorderWidth`, `*BorderStyle`, or properties related to resize handles:

**`rowBorder`, `headerRowBorder` (Border/Border Value)**
- **Purpose:** Controls horizontal borders between rows in the data and header areas, respectively.
- **Impact:** Defines structure between horizontal layout elements.
- **Constraints:** Can be `false` (shorthand for 0), `true` (default border), or a Border Value object/string.

**`columnBorder`, `headerColumnBorder` (Border/Border Value)**
- **Purpose:** Controls vertical borders between columns in the data and header areas, respectively.
- **Impact:** Defines structure between vertical layout elements.
- **Constraints:** Supports Border Value object/string. The header version has an associated `headerColumnBorderHeight` parameter.

**`headerColumnBorderHeight` (Length Value)**
- **Purpose:** Specifies the height of the vertical border between header cells, overriding the default height.
- **Impact:** Controls how much of the header cell height the vertical border spans.
- **Constraints:** Accepts CSS length values or raw numbers (assumed pixels).

### Color Configuration

Key color parameters derived from the color scheme:

**`backgroundColor`, `foregroundColor`, `accentColor` (Color Values)**
- **Purpose:** Define the base palette. `backgroundColor` is the main page background color (must be opaque). `foregroundColor` is the primary text color. `accentColor` is used for highlights and selection color (brand color recommended).
- **Impact:** These key colors drive derived defaults for many other color parameters.
- **Constraints:** Accepts CSS color values or extended Color Value syntax (e.g., referencing other colors with `mix`).

**`selectedRowBackgroundColor` (Color Value)**
- **Purpose:** Sets the fill color for rows that are selected.
- **Impact:** Crucial for row selection visibility. Recommended to be set as semi-transparent if alternating row colors are used.
- **Constraints:** Color Value syntax.

### Font Configuration

Parameters ending in `*FontFamily` or `*FontSize`:

**`fontFamily`, `headerFontFamily`, `cellFontFamily` (Font Family Values)**
- **Purpose:** Define the typeface for general grid text, headers, and cells specifically.
- **Impact:** Controls typography rendering.
- **Constraints:** Supports CSS strings, arrays of fallback fonts, or `{ googleFont: 'Name' }` objects.

### Icon Configuration

**`iconSize` (Length Value)**
- **Purpose:** Sets the target pixel size for active icons, especially when using the Material icon set.
- **Impact:** Affects the baseline rendering size of the icons.
- **Constraints:** Length Value syntax.

## 7. Expert-Level Implementation Patterns

### Error Handling & Resilience

No specific API error codes or detailed retry strategies other than general browser/network error handling were documented in the source material. The documentation focuses entirely on styling configuration.

### Rate Limiting & Throughput Optimization

Not applicable. The documentation describes client-side rendering configuration, not server-side data fetching or transactional limits.

### Performance Optimization

**DOM Virtualization Dependency:**
- When using standard layout (`domLayout='normal'`), the grid relies on knowing the correct heights of virtualized elements (rows, headers, list items) for performance.
- To alter these heights, only use the dedicated parameters: `rowHeight`, `headerHeight`, `listItemHeight` (Length Values) or `rowVerticalPaddingScale`/`headerVerticalPaddingScale` (Scale Values).
- Directly setting CSS on elements like `.ag-row { height: 50px; }` is **not supported** because it bypasses the virtualization engine's necessary calculations.

**Bundle Size Reduction via Theme Creation:**
- For minimal footprint, use `createTheme()` instead of deriving from a built-in theme if the majority of parts are being replaced anyway. This reduces CSS injection by omitting unneeded part styles.

### Security & Compliance

**Google Font Loading:**
- The grid will **not** automatically load Google Fonts due to licensing and privacy implications, even if specified by a `{ googleFont: '...' }` value in a font family parameter.
- **Mitigation:** Developers must either:
    1. Set the grid option `loadThemeGoogleFonts` to `true` to load via CDN.
    2. Load the font explicitly using `@import` or `@font-face` in application CSS.

### Production Deployment Patterns

**CSS Layering for Predictable Overrides:**
- To ensure application styles consistently override the grid's default styles, utilize CSS Layers.
- Set the grid option `themeCssLayer` (e.g., to `"grid"`), and ensure the application's overriding styles (e.g., setting header color red) are defined within a layer loaded *after* the grid's layer (e.g., in an `@layer application` definition).

```css
@layer application {
    .ag-header-cell-text {
        background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet, red);
        /* ... other styles using higher specificity or later layer order ... */
    }
}
/* Grid styles are inserted into 'grid' layer by default unless configured otherwise */
```

**Master/Detail Grid Theme Synchronization:**
- For detail grids, omitting the `theme` grid option ensures they inherit the master grid's theme automatically.
- If styling detail grids differently, use CSS targeting specific selectors like `.ag-details-row` and `.ag-details-grid`, as setting an explicit, different `theme` object on a detail grid will result in a console error.
- When overriding an inherited CSS variable on a detail grid (e.g., `--ag-background-color`), remember that abstract relationships (like `--ag-odd-row-background-color` being derived from `--ag-background-color` in the master theme) will not automatically transfer cleanly if the master theme had pre-set overrides. Explicitly redefine the derived variable if necessary:
    ```css
    .ag-details-grid {
        --ag-background-color: #f004;
        /* Must explicitly re-set derived relationship if master defined it */
        --ag-odd-row-background-color: var(--ag-background-color); 
    }
    ```

## 8. High-Value Code Examples

### Applying a Built-in Theme

Context: Demonstrates the standard way to initialize a grid using a specific theme object imported from the core package.
Key Technique: Passing the theme object via the React component property.
Language: JavaScript/JSX
Source Section: Built-in themes

```javascript
import { themeBalham } from 'ag-grid-community';

<AgGridReact
    theme={themeBalham}
    ...
/>
```

### Creating a Theme with Custom Parameters

Context: Showing how to extend a base theme (Quartz) by programmatically setting parameter values using their specific extended syntax for lengths and colors.
Key Technique: Chaining `withParams()` to define parameter overrides.
Language: JavaScript/JSX
Source Section: Setting Theme Parameters

```javascript
const myTheme = themeQuartz.withParams({
    spacing: 12,
    accentColor: 'red',
})
```

### Configuring Color Schemes via Theme Parts

Context: Applying the built-in dark color scheme to a base theme.
Key Technique: Using `withPart()` to inject a predefined color scheme configuration.
Language: JavaScript/JSX
Source Section: Colour Schemes

```javascript
import { colorSchemeDark } from 'ag-grid-community';

const myTheme = themeQuartz
    .withPart(colorSchemeDark);
```

### Using Custom Theme Modes for Dark/Light Toggling

Context: Configuring a theme instance to respond to application-level `data-ag-theme-mode` attributes for dynamic theme switching.
Key Technique: Defining parameters against custom mode identifiers passed to the second argument of `withParams`.
Language: JavaScript/JSX
Source Section: Theme Modes

```javascript
const myTheme = themeQuartz
    .withParams(
        {
            backgroundColor: '#FFE8E0',
            foregroundColor: '#361008CC',
            browserColorScheme: 'light',
        },
        'light-red'
    )
    .withParams(
        {
            backgroundColor: '#201008',
            foregroundColor: '#FFFFFFCC',
            browserColorScheme: 'dark',
        },
        'dark-red'
    );
```

### Customizing Font Families using Google Font Objects

Context: Applying specific fonts, including one loaded via URL, using the Font Family Value extended syntax.
Key Technique: Using the `{ googleFont: '...' }` structure for font definitions.
Language: JavaScript/JSX
Source Section: Loading Google Fonts

```javascript
const myTheme = themeQuartz.withParams({
    
    fontFamily: { googleFont: 'Delius' },
    headerFontFamily: { googleFont: 'Sixtyfour Convergence' },
    cellFontFamily: { googleFont: 'Turret Road' },
    
    fontSize: 20,
    headerFontSize: 25,
})
```

### Customizing Borders with Extended Syntax

Context: Demonstrating setting border properties including style, width, and referencing an existing parameter for color using the Border Value syntax.
Key Technique: Utilizing the `{ style: '...', width: N, color: ... }` structure for border definitions.
Language: JavaScript/JSX
Source Section: Example: row borders

```javascript
const myTheme = themeQuartz.withParams({
    wrapperBorder: false,
    headerRowBorder: false,
    rowBorder: { style: 'dotted', width: 3, color: '#9696C8' },
    columnBorder: { style: 'dashed', color: '#9696C8' },
})
```

### Replacing Icons with Masked SVGs

Context: Demonstrating the creation of an `iconOverrides` part to substitute the default 'filter' and 'group' icons with custom SVG source code, using the `mask: true` option so the SVG inherits the grid's foreground color.
Key Technique: Using `iconOverrides` utility combined with `withPart()`.
Language: JavaScript/JSX
Source Section: Overriding Icons with Images

```javascript
import { themeQuartz, iconOverrides } from 'ag-grid-community';


const mySvgIcons = iconOverrides({
    type: 'image',
    mask: true,
    icons: {
      
      'filter': { url: 'https://examle.com/my-filter-icon.svg' },
      'group': { svg: '<svg> ... svg source ...</svg>' },
    }
})


const myTheme = themeQuartz.withPart(mySvgIcons);
```

### Overriding Grid Spacing with CSS Variables

Context: Overriding the global spacing parameter using its corresponding CSS custom property defined on a parent element (body).
Key Technique: Defining `--ag-spacing` CSS variable directly on a parent selector.
Language: CSS
Source Section: Overriding Theme Parameters with Custom Properties

```css
body {
    
    --ag-background-color: darkred;
    --ag-foreground-color: lightpink;
    --ag-spacing: 4px;
    
    --ag-browser-color-scheme: dark;
}
```

### Dynamic Grid Sizing Management via Events

Context: Implementing logic to hide columns dynamically if they exceed the available horizontal viewport width, preventing horizontal scrolling.
Key Technique: Reacting to the `gridSizeChanged` event to dynamically adjust column visibility based on current grid width.
Language: JavaScript/JSX
Source Section: Dynamic Resizing without Horizontal Scroll
*(Note: The provided source shows the concept but does not include the specific React hook setup for event subscription, only the conceptual demonstration structure)*

### Styling Detail Grids with CSS Variables

Context: Applying targeted style overrides to an embedded detail grid using element class selectors and CSS variables, respecting inheritence limitations.
Key Technique: Setting `.ag-details-grid` specific CSS variables and explicitly restating derived dependencies.
Language: CSS
Source Section: Limitations of CSS variables on detail grids

```css
.ag-details-grid {
    --ag-background-color: #f004;
    --ag-odd-row-background-color: var(--ag-background-color);
}
```

## 9. Response Formats & Data Structures

The API primarily configures behavior via input objects, not responses. Configuration objects follow standard JavaScript object/array structures.

### Theme Parameter Values (General Structure)

Theme parameters are defined via objects whose structure depends on their inferred type suffix:

| Field Path | Type | Always Present | Description |
|------------|------|----------------|-------------|
| **Length Values (e.g., `spacing`, `rowHeight`)** | | | |
| (raw number) | number | Optional | Assumed to be pixels if no unit specified. |
| (string length) | string | Optional | Standard CSS length (e.g., `'10px'`). |
| `{ ref: 'paramName' }` | object | Optional | References the value of another parameter. |
| `{ calc: 'expression' }` | object | Optional | CSS calc expression allowing parameter substitution (e.g., `'4 * spacing - 2px'`). |
| **Color Values (e.g., `accentColor`)** | | | |
| (CSS Color) | string | Optional | Standard CSS color value. |
| `{ ref: 'paramName' }` | object | Optional | References another color parameter value. |
| `{ ref: 'paramName', mix: 0.25 }` | object | Optional | Mixes the referenced color with 25% transparency. |
| `{ ref: 'paramName', mix: 0.25, onto: 'otherColorParam' }` | object | Optional | Mixes the referenced color by 25% onto the color defined by `otherColorParam`.|
| **Border Values (e.g., `columnBorder`)** | | | |
| `true` | boolean | Optional | Default border setting: `{width: 1, style: 'solid', color: { ref: 'borderColor' }}`. |
| `false` | boolean | Optional | Shorthand for zero border. |
| `{ width: N, style: S, color: C }` | object | Optional | Granular border definition. `width` uses Length Value syntax; `color` uses Color Value syntax. |

## 10. Versioning & Compatibility

### Current Version Context

The API described is the **Theming API**, introduced in **v33**.

### Legacy Support (Pre-v33)

Legacy theming (v32 and prior) used imported CSS files and required class names like `ag-theme-quartz` on the grid container.

**Version Selection:**
To opt back into legacy behavior in v33+, set the `theme` grid option to the string `"legacy"`.

```javascript
provideGlobalGridOptions({
    theme: "legacy",
})
```

**Migration Guidance:**
1. Remove all direct CSS imports for AG Grid styles (e.g., `import 'ag-grid-community/styles/ag-grid.css';`).
2. Import Theme Objects (e.g., `themeBalham`) and assign them to the `theme` option.
3. Convert previously set CSS custom properties (e.g., `--ag-grid-size`) to their corresponding Theming API parameters (e.g., `spacing`).
4. Remove `ag-theme-*` class selectors from application CSS rules, as these are no longer required for theme application.

**Key Parameter Changes during Migration:**
- `--ag-grid-size` -> `spacing` (different semantics: spacing controls padding, not base size).
- `--ag-active-color` -> `accentColor`.
- Border parameters were significantly revamped; consult `rowBorder`, `headerRowBorder`, etc.

## 11. Limitations & Constraints

- **Row Height Control:** To preserve DOM virtualization stability, row, header, and list item heights *must* be controlled via the Theme Parameters (`rowHeight`, `headerHeight`, `listItemHeight`) or the corresponding CSS variables (`--ag-row-height`, etc.). Direct CSS height setting on elements like `.ag-row` is unsupported.
- **Google Font Loading:** Fonts specified via `{ googleFont: '...' }` in parameters will not load automatically due to privacy/licensing constraints unless explicitly enabled via `loadThemeGoogleFonts: true` or manual loading via CSS.
- **Detail Grid Theming:** Detail grids must use the same theme lineage as the master grid; setting an explicitly different theme object results in a console error. Styling detail grids must rely on CSS overrides targeting `.ag-details-row` and `.ag-details-grid` selectors.
- **Max Height with Auto Height:** When `domLayout='autoHeight'` is active, setting a maximum height for the grid content area is not possible, as the grid is configured to fully expand vertically to fit content.
- **CSS Rule Maintenance:** Custom CSS rules targeting specific class names (`.ag-header-cell`, etc.) are more susceptible to breaking between minor grid releases than styles applied via Theme Parameters, due to underlying structural DOM changes.

## 12. Additional Resources

- **Theme Builder:** https://www.ag-grid.com/theme-builder/ - Provides a searchable interface to view documentation and values for all available Theme Parameters.
- **Legacy Themes Documentation (v32):** https://www.ag-grid.com/react-data-grid/theming-v32/ - Documentation for deprecated CSS-based theming.
- **AG Grid Design System (Figma):** https://www.figma.com/community/file/1360600846643230092/ag-grid-design-system - Design system mirroring Quartz and Alpine themes for designer-developer handoff, with instructions for Style Dictionary export towards generating theme parameters.
- **Design System GitHub Repo (Style Dictionary instructions):** https://github.com/ag-grid/ag-grid-figma-design-system/ - Repository containing templates for generating AG Grid themes from exported Figma variables.
- **Support (Enterprise Users):** https://ag-grid.zendesk.com/hc/en-us - Support channel for AG Grid Enterprise customers.
- **Bug Reports (Community):** https://github.com/ag-grid/ag-grid-figma-design-system/issues - Issue tracker for the design system component.