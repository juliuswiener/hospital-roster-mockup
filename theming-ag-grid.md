# Extracted Content

Generated on: 11/16/2025, 1:38:52 PM

---

## 1. React Grid: Theming | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming/](https://www.ag-grid.com/react-data-grid/theming/)

Theming refers to the process of adjusting design elements such as colours, borders and spacing to match your applications' design.

We provide a range of methods for customising the appearance of the grid so that you can create any look that your designer can imagine. From the quick and easy to the most advanced, they are:

- Select a [Built-in Theme](/react-data-grid/themes/) as a starting point.
- Choose a different [Color Scheme](/react-data-grid/theming-colors/#colour-schemes) if required.
- Use [Theme Parameters](/react-data-grid/theming-parameters/) to customise borders, compactness, fonts and more.
- Use [Theme Parts](/react-data-grid/theming-parts/) to change the appearance of components like the icon set and text inputs.
- [Write your own CSS](/react-data-grid/theming-css/) for unlimited control over grid appearance.

The grid is styled using CSS. It ships with built-in styles that can create a range of designs. You can then use CSS to create more advanced customisations.

##  Programmatically changing row and cell appearance [Copy Link](#programmatically-changing-row-and-cell-appearance) 

Separately from theming, the grid supports using code to customise the appearance of individual columns, headers or cells by using [row styles](/react-data-grid/row-styles/), [cell styles](/react-data-grid/cell-styles/) or [custom renderers](/react-data-grid/components/). Unlike theming, these methods allow you to change the appearance of elements depending on the data that they contain.

##  Legacy Themes [Copy Link](#legacy-themes) 

Before v33, themes were applied by importing CSS files from our NPM packages, see [Legacy Themes](/react-data-grid/theming-v32/) for more information.

---

## 2. React Grid: Built-in themes | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/themes/](https://www.ag-grid.com/react-data-grid/themes/)

Built-in themes provide a starting point for theming your application.

Themes are objects imported from the `ag-grid-community` package and provided to grid instances using the `theme` grid option.

```
import { themeBalham } from 'ag-grid-community';

<AgGridReact
    theme={themeBalham}
    ...
/>

```

##  Built-in Themes [Copy Link](#built-in-themes) 

- Quartz - Our default theme, with high contrast and generous padding. Will use the IBM Plex Sans font if available**⁺**.
- Balham - A more traditional theme modelled after a spreadsheet application.
- Material - A theme designed according to Google's [Material v2](https://m2.material.io/) design system. This theme looks great for simple applications with lots of white space, and is the obvious choice if the rest of your application uses Material Design. Will use the Google Roboto font if available**⁺**.
- Alpine - The default theme before Quartz. We recommend quartz for new projects; this theme is intended to ease migration to the Theming API for applications already using Alpine.

**⁺** You can load these fonts yourself or pass the `loadThemeGoogleFonts` grid option to load them from Google's CDN. See [Customising Fonts](/react-data-grid/theming-fonts/) for more information.

 
  
 ##  Customising Built-in Themes [Copy Link](#customising-built-in-themes) 

Themes are simply preset configurations of parts and parameters. After choosing a theme as a starting point, you can:

- Choose a different [Color Scheme](/react-data-grid/theming-colors/#colour-schemes) if required.
- Use [Theme Parameters](/react-data-grid/theming-parameters/) to customise borders, compactness, fonts and more.
- Use [Theme Parts](/react-data-grid/theming-parts/) mix and match elements from different themes, for example the icons from Quartz with the text inputs from Material.
- [Write your own CSS](/react-data-grid/theming-css/) for unlimited control over grid appearance.

---

## 3. React Grid: Theme Parameters | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-parameters/](https://www.ag-grid.com/react-data-grid/theming-parameters/)

Parameters are configuration values that affect the appearance of the grid.

Some parameters such as `headerTextColor` affect a single aspect of grid appearance. Others have a wider effect, such as `spacing` which adjusts padding across the whole grid.

##  Setting Theme Parameters [Copy Link](#setting-theme-parameters) 

To set parameters on a theme, call the `theme.withParams(...)` method which returns a new theme with different default values for its parameters.

```
const myTheme = themeQuartz.withParams({
    spacing: 12,
    accentColor: 'red',
});

```

 
  
 Under the hood, theme parameters are implemented using CSS custom properties (variables), and `withParams()` sets *default* values for these, so you can override them in your application style sheets (see [Customising the grid with CSS](/react-data-grid/theming-css/)). However using the API provides validation, typescript autocompletion, and an extended syntax for defining CSS values (see below).

##  Finding Theme Parameters [Copy Link](#finding-theme-parameters) 

There are many parameters available, and several ways of finding the right one to use:

- **[Theme Builder](/theme-builder/)** - In the "All Parameters" section of the Theme Builder you can search for parameters and view documentation.
- **TypeScript auto-complete** - When using an editor with TypeScript language support, you can see all available parameters with inline documentation.
- **Dev tools** - When inspecting an element in the grid, the styles panel shows the CSS custom properties that are being used. A custom property `var(--ag-column-border)` corresponds to the theme parameter `columnBorder`.

##  Parameter Types [Copy Link](#parameter-types) 

The type of a parameter is determined by the suffix of it name, for example `Color`, `Border` or `Shadow`.

Every type can accept a string, which is passed to CSS without processing so must be valid CSS syntax for the type of parameter, e.g. `red` is a valid CSS color.

Some parameter types also support an extended syntax. This syntax is only available when using the API to set parameters, when [setting parameters with CSS](/react-data-grid/theming-css/) you must always use CSS syntax.

###  Length Values [Copy Link](#length-values) 

Parameters that refer to on-screen measurements are length values. These will have suffixes like Width, Height, Padding, Spacing etc - in fact, any parameter that does not have one of the more specific suffixes documented below is a length. They can accept any [valid CSS length value](https://developer.mozilla.org/en-US/docs/Web/CSS/length), including pixels (`10px`) and variable expressions (`var(--myLengthVar)`). In addition, the following syntax is supported:

SyntaxDescription`4`A number without units is assumed to be pixels`{ ref: 'spacing' }`Use the same value as the `spacing` parameter`{ calc: '4 * spacing - 2px' }`A CSS [calc expression](https://developer.mozilla.org/en-US/docs/Web/CSS/calc), except that parameter names are allowed and will be converted to the appropriate CSS custom property. This expression would map to the CSS string  `"calc(4 * var(--ag-spacing) - 2px)"`. Note that `-` is a valid character in CSS identifiers, so if you use it for subtraction then spaces are required around it.###  Color Values [Copy Link](#color-values) 

All parameters ending "Color" are color values. These can accept any [valid CSS color value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value), including named colors (`red`), hex values (`#FF0000`) CSS functions (`rgb(255, 0, 0)`) and variable expressions (`var(--myColorVar)`). In addition, the following syntax is supported:

SyntaxDescription`{ ref: 'accentColor' }`Use the same value as the `accentColor` parameter`{ ref: 'accentColor', mix: 0.25 }`A mix of 25%, `accentColor` 75% transparent`{ ref: 'accentColor', mix: 0.25, onto: 'backgroundColor' }`A mix of 25%, `accentColor` 75% `backgroundColor`###  Border Values [Copy Link](#border-values) 

All parameters ending "Border" are border values. These can accept any [valid CSS border value](https://developer.mozilla.org/en-US/docs/Web/CSS/border), such as `1px solid red` and variable expressions (`var(--myBorderVar)`). In addition, the following syntax is supported:

SyntaxDescription`{ width: 2, style: 'dashed', color: 'blue' }`An object with 3 optional properties. `width` can take any [length value](#length-values) and defaults to 1. `style` takes a [CSS border-style](https://developer.mozilla.org/en-US/docs/Web/CSS/border-style) string and defaults to "solid". `color` takes any [color value](#color-values) and defaults to `{ ref: 'borderColor' }``true`The default border: `{width: 1, style: 'solid' { ref: 'borderColor' }``false`A shorthand for `0`###  Border Style Values [Copy Link](#border-style-values) 

All parameters ending "BorderStyle" are border style values. These can accept any [valid CSS border-style value](https://developer.mozilla.org/en-US/docs/Web/CSS/border-style), such as `dashed`, `solid` and variable expressions (`var(--myBorderStyleVar)`).

###  Font Family Values [Copy Link](#font-family-values) 

All parameters ending "FontFamily" are font family values. These can accept any [valid CSS font-family value](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family), such as `Arial, sans-serif` and variable expressions (`var(--myFontFamilyVar)`). In addition, the following syntax is supported:

SyntaxDescription`{ googleFont: 'IBM Plex Sans' }`A font available from Google Fonts. To prevent potential licensing and privacy implications of automatically loading Google fonts, you must either load the font yourself or set the `loadThemeGoogleFonts` grid option to true.`['Arial', 'sans-serif']`An array of fonts. Each item can be a string font name or a `{ googleFont: "..." }` object. The browser will attempt to use the first font and fall back to later fonts if the first one fails to load or is not available on the host system.###  Font Weight Values [Copy Link](#font-weight-values) 

All parameters ending "FontWeight" are font weight values. These can accept any [valid CSS font-weight value](https://developer.mozilla.org/en-US/docs/Web/CSS/font-weight), such as `bold`, `700` and variable expressions (`var(--myFontWeightVar)`).

###  Scale Values [Copy Link](#scale-values) 

All parameters ending "Scale" are scale values, which are multiplied by other values to create a final size. They accept a number with optional decimal point. `1` means "no change", `0.5` means "half size", `2` means "double size".

###  Shadow Values [Copy Link](#shadow-values) 

All parameters ending "Shadow" are shadow values. These can accept any [valid CSS box-shadow value](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow), such as `2px 2px 4px 2px rgba(0, 0, 0, 0.5)` and variable expressions (`var(--myShadowVar)`). In addition, the following syntax is supported:

SyntaxDescription`{ offsetX: 2, offsetY: 2, radius: 4, spread: 2, color: 'rgba(0, 0, 0, 0.5)' }`An object with 5 optional properties. `offsetX`, `offsetY`, `radius` and `spread` take any [length value](#length-values) and default to 0. `color` takes any [color value](#color-values) and defaults to `{ ref: 'foregroundColor' }`###  Image Values [Copy Link](#image-values) 

All parameters ending "Image" are image values. These can accept any [valid CSS image value](https://developer.mozilla.org/en-US/docs/Web/CSS/image), such as `url('https://example.com/my-image.png')` and variable expressions (`var(--myImageVar)`). In addition, the following syntax is supported:

SyntaxDescription`{ url: 'https://example.com/my-image.png' }`Load an image from a URL. You can use this to embed a PNG image by converting it to a data: URL`{ svg: '<svg> ... SVG string ... </svg>' }`Embed an SVG source code string###  Color Scheme Values [Copy Link](#color-scheme-values) 

All parameters ending "ColorScheme" (and there is only one: `browserColorScheme`) are color scheme values. These can accept any [valid CSS color-scheme value](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme), including`dark`, `light`, `normal`, `inherit` and variable expressions (`var(--myColorScheme)`).

###  Duration Values [Copy Link](#duration-values) 

All parameters ending "Duration" are duration values. These can accept any [valid CSS time value](https://developer.mozilla.org/en-US/docs/Web/CSS/time), such as `1s`, `500ms` and variable expressions (`var(--myAnimationDelayTime)`).

---

## 4. React Grid: Theme Parts | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-parts/](https://www.ag-grid.com/react-data-grid/theming-parts/)

Parts contain the CSS styles for a single feature like icons or text inputs.

Using parts you can, for example, select a text input style that matches you application, or disable our provided text input styles so that you can write your own.

##  Configuring Theme Parts [Copy Link](#configuring-theme-parts) 

To add a part to a theme, call the `theme.withPart(...)` method which returns a new theme using that part. A theme can only have one part for a given feature, so for example because all color scheme parts have `feature: "colorScheme"`, adding a new color scheme to a theme will remove any existing part.

```
import { themeQuartz, colorSchemeDark, iconSetMaterial } from 'ag-grid-community';

const myTheme = themeQuartz
    .withPart(iconSetMaterial)
    .withPart(colorSchemeDark);

```

This example demonstrates mixing and matching any built-in theme, icon set, and color scheme:

 
  
 ##  Parts Reference [Copy Link](#parts-reference) 

The following parts are available:

- `colorScheme` feature:
`colorSchemeVariable` - the default color scheme for all our [built-in themes](/react-data-grid/themes/#built-in-themes). By default it appears light, but can be adjusted using [theme modes](/react-data-grid/theming-colors/#theme-modes).
- `colorSchemeLight` - neutral light scheme
- `colorSchemeLightCold` - light scheme with subtle cold tint used by Balham theme
- `colorSchemeLightWarm` - light scheme with subtle warm tint
- `colorSchemeDark` - neutral dark scheme
- `colorSchemeDarkBlue` - our preferred dark scheme used on this website
- `colorSchemeDarkWarm` - dark scheme with subtle warm tint
- `colorSchemeDarkWarm` - dark scheme with subtle warm tint

- `iconSet` feature:
`iconSetQuartz` - our default icon set
`iconSetQuartz({strokeWidth: number})` you can call iconSetQuartz as a function to provide a custom stroke width in pixels (the default is 1.5)
- `iconSetQuartzLight` and `iconSetQuartzBold` preset lighter and bolder versions of the Quartz icons with 1px and 2px stroke widths respectively.

- `iconSetMaterial` - the Material Design icon set
- `iconSetAlpine` - the icon set used by the Alpine theme
- `iconSetBalham` - the icon set used by the Balham theme

- `buttonStyle` feature:
`buttonStyleBase` - unstyled buttons with many parameters to configure their appearance
- `buttonStyleQuartz` - buttons styled as per the Quartz theme
- `buttonStyleAlpine` - buttons styled as per the Alpine theme
- `buttonStyleBalham` - buttons styled as per the Balham theme

- `columnDropStyle` feature - controls the styling of column drop zone in the [columns tool panel](/react-data-grid/tool-panel-columns/):
`columnDropStylePlain` - undecorated drop zone as used by Balham and Material themes
- `columnDropStyleBordered` - drop zone with a dashed border around it as used by the Quartz and Alpine themes.

- `checkboxStyle` feature:
`checkboxStyleDefault` - checkbox style used by our themes. There is only one style provided which is configurable through parameters. It being a part allows you to replace it with your own checkbox styles if desired.

- `inputStyle` feature:
`inputStyleBase` - unstyled inputs with many parameters to configure their appearance
- `inputStyleBordered` - inputs with a border around them
- `inputStyleUnderlined` - inputs with a line underneath them as used in Material Design

- `tabStyle` feature:
`tabStyleBase` - unstyled tabs with many parameters to configure their appearance
- `tabStyleQuartz` - tabs styled as per the Quartz theme
- `tabStyleMaterial` - tabs styled as per the Material theme
- `tabStyleAlpine` - tabs styled as per the Alpine theme
- `tabStyleRolodex` - tabs designed to imitate paper cards, as used by the Balham theme

- `styleMaterial` feature (used by the Material theme):
`styleMaterial` - Adds the `primaryColor` parameter defined by [Material Design v2](https://m2.material.io/) and uses this color instead of the `accentColor` for most colored elements. `accentColor` is still used for checked checkboxes and to highlight active filters. This part also applies some adjustments to appearance of elements to match the Material Design specification, e.g. making all button text uppercase.

##  Removing a Part [Copy Link](#removing-a-part) 

To remove a part from a theme, call `theme.withoutPart(featureName)`, which returns a new theme without the specified part:

```
const myCustomTheme = themeQuartz.withoutPart('checkboxStyle');

```

After removing the built-in part, this example uses CSS in a separate style sheet to style the checkboxes:

 
  
 The above example uses `theme.withoutPart("checkboxStyle")` to disable the default checkbox styles and adds its own checkbox styles in the application style sheet. This is the simplest way of changing the appearance of the grid when you are working on a single application.

##  Creating Your Own Parts [Copy Link](#creating-your-own-parts) 

You can create your own theme parts to use in your application. This is useful for organisations with multiple apps that share common styles or a design system, see [Distributing Shared Themes & Parts](/react-data-grid/theming-distribution/#creating-your-own-parts).

---

## 5. React Grid: Theming: Colours & Dark Mode | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-colors/](https://www.ag-grid.com/react-data-grid/theming-colors/)

Control the overall colour scheme and colour of individual elements

##  Overview [Copy Link](#overview) 

- Change individual [colour parameters](#color-parameters)
- Switch between [light and dark colour schemes](#colour-schemes) using parts
- Integrate with a website that has a dark mode toggle using [theme modes](#theme-modes)
- Make unrestricted [customisations using CSS](/react-data-grid/theming-css/#custom-css-rules)

##  Colour Parameters [Copy Link](#colour-parameters) 

The grid has a few key colour parameters that most applications will set custom values for, and many more specific colour parameters that can be used for fine tuning. Appropriate default values for many parameters are automatically generated based on the key parameters:

- `backgroundColor` - typically your application page background (must be opaque)
- `foregroundColor` - typically your application text colour
- `accentColor` - the colour used for highlights and selection; your organisation's primary brand colour often works well.

Key colours are mixed together to make default values for all other colours that you can override to fine tune the colour scheme. For example, the default border colour is generated by mixing the background and foreground colours at a ratio of 85% background to 15% foreground. This can be overridden by setting the `borderColor` parameter.

Some commonly overridden colour parameters are:

- `borderColor` - the colour of all borders, see also [Customising Borders](/react-data-grid/theming-borders/)
- `dataBackgroundColor` - the background colour of the grid data area
- `headerBackgroundColor` - the background colour of the header rows
- `chromeBackgroundColor` - the background colour of the grid's chrome (header, tool panel, etc)
- `textColor`, `headerTextColor`, `cellTextColor` - override text colours for UI, for headers and cells respectively

Many more parameters are available, search the "All Parameters" section of the [theme builder](/theme-builder/) for a full list.

For example:

```
const myTheme = themeQuartz.withParams({
    backgroundColor: 'rgb(249, 245, 227)',
    foregroundColor: 'rgb(126, 46, 132)',
    headerTextColor: 'rgb(204, 245, 172)',
    headerBackgroundColor: 'rgb(209, 64, 129)',
    oddRowBackgroundColor: 'rgb(0, 0, 0, 0.03)',
    headerColumnResizeHandleColor: 'rgb(126, 46, 132)',
});

```

 
  
 ##  Extended Syntax for Colour Values [Copy Link](#extended-syntax-for-colour-values) 

All theme parameters with the suffix `Color` are colour values, and can accept the following values:

SyntaxDescription`string`A [CSS colour value](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value), such as `'red'`, `'rgb(255, 0, 0)'`, or variable expression `'var(--myColorVar)'`.`{ ref: 'accentColor' }`Use the same value as the `accentColor` parameter`{ ref: 'accentColor', mix: 0.25 }`A mix of 25%, `accentColor` 75% transparent`{ ref: 'accentColor', mix: 0.25, onto: 'backgroundColor' }`A mix of 25%, `accentColor` 75% `backgroundColor`##  Colour Schemes [Copy Link](#colour-schemes) 

The grid defines a number of dark and light colour schemes that you can apply.

- `colorSchemeVariable` - the default colour scheme for all our [built-in themes](/react-data-grid/themes/#built-in-themes). By default it appears light, but can be adjusted using [theme modes](#theme-modes) (see below).
- `colorSchemeLight` - a neutral light colour scheme
- `colorSchemeLightWarm`, `colorSchemeLightCold` - light colour schemes with subtle warm and cold tints
- `colorSchemeDark` - a neutral dark colour scheme
- `colorSchemeDarkWarm` - dark colour scheme with subtle warm tint
- `colorSchemeDarkBlue` - blue tinted colour scheme as used in dark mode on this website

Colour schemes are applied to themes using `withPart()`:

```
import { colorSchemeDark } from 'ag-grid-community';

const myTheme = themeQuartz.withPart(colorSchemeDark);

```

 
  
 A colour scheme is simply a theme part with values defined for the key colour parameters, so if none of the built-in schemes suit, choose the one that is closest to your needs and override parameters as required:

```
const myTheme = themeQuartz
    .withPart(colorSchemeDarkBlue)
    .withParams({
        
        
        
        backgroundColor: 'darkred',
        accentColor: 'red',
    });

```

##  Theme Modes [Copy Link](#theme-modes) 

The standard way of changing a grid's appearance after initialisation is to update the value of the `theme` grid option. You might implement a dark mode toggle by preparing light and dark versions of a theme and switching between them in response to a button press.

Often however, a grid application is embedded within a website, and the website and grid application have different codebases. It may not be easy to update the theme grid option in response to the website's dark mode changing.

For this use case we provide theme modes. When a theme uses the `colorSchemeVariable` colour scheme, which is the default for our [built-in themes](/react-data-grid/themes/#built-in-themes), the colour scheme can be controlled by setting the `data-ag-theme-mode="mode"` attribute on any parent element of the grid, commonly the `html` or `body` elements, where `mode` is any of:

- `light`
- `dark`
- `dark-blue`

It is also possible to define your own colour modes, by passing the mode name to the second parameter of `withParams`. This example defines custom colour schemes for light and dark mode and switches between them by setting the `data-ag-theme-mode` attribute on the `body` element:

```

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

---

## 6. React Grid: Theming: Customising Fonts | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-fonts/](https://www.ag-grid.com/react-data-grid/theming-fonts/)

Altering typography within the grid

##  Font Family Parameters [Copy Link](#font-family-parameters) 

The grid provides the following [Theme Parameters](/react-data-grid/theming-parameters/) to control fonts:

- `fontFamily` sets a default font for all text in the grid
- `headerFontFamily` optionally overrides the font used in the header
- `cellFontFamily` optionally overrides the font used in the data Cells

```
const myTheme = themeQuartz.withParams({
    fontFamily: 'serif',
    headerFontFamily: 'Brush Script MT',
    cellFontFamily: 'monospace',
});

```

To customise specific elements, [use CSS rules](/react-data-grid/theming-css/):

```

.ag-column-drop-title {
    font-family: 'Brush Script MT';
    font-size: 1.5em;
}

```

 
  
 ##  Extended Syntax for Font Family Parameters [Copy Link](#extended-syntax-for-font-family-parameters) 

Font family parameters can accept the following value types:

SyntaxDescription`string`A [CSS font-family value](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family), such as `'Arial, sans-serif'` or variable expression `'var(--myFontFamilyVar)'`.`{ googleFont: 'IBM Plex Sans' }`A font available from Google Fonts. You must load the font or ask the grid to load it for you, see [Loading Google Fonts](#loading-google-fonts) below.`['Arial', 'sans-serif']`An array of fonts. Each item can be a string font name or a `{ googleFont: "..." }` object. The browser will attempt to use the first font and fall back to later fonts if the first one fails to load or is not available on the host system.##  Loading Google Fonts [Copy Link](#loading-google-fonts) 

To prevent potential licensing and privacy implications, the grid will not load Google fonts unless requested to. If your theme uses Google fonts you should either:

- set the `loadThemeGoogleFonts` grid option to `true`, and the grid will load the font from Google's CDN
- load the font yourself using a `@font-face` rule in your application's CSS

If the font has not been loaded through either of the above methods, the theme will fall back to the most appropriate font available on the system.

This example demonstrates fonts loaded by the grid and by the application's style sheets:

```
const myTheme = themeQuartz.withParams({
    
    fontFamily: { googleFont: 'Delius' },
    headerFontFamily: { googleFont: 'Sixtyfour Convergence' },
    cellFontFamily: { googleFont: 'Turret Road' },
    
    fontSize: 20,
    headerFontSize: 25,
});

```

```

@import url('https://fonts.googleapis.com/css2?family=Kablammo&display=swap');

.ag-column-drop-title {
    font-family: 'Kablammo';
    font-size: 1.5em;
    color: green;
}

```

---

## 7. React Grid: Theming API: Customising Borders | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-borders/](https://www.ag-grid.com/react-data-grid/theming-borders/)

Control the borders around rows, cells and UI elements.

Borders are controlled using theme parameters ending `Border`. There are many such parameters, you can find a full list by searching for "border" in the [Theme Builder](/theme-builder/) "All Parameters" section.

The most important parameters relating to borders are:

- `borderColor` and `borderWidth` - sets the default color and width for all borders, which can be overridden for individual borders using the parameters below
- `rowBorder` and `headerRowBorder` - sets the horizontal borders between rows in the grid and header
- `columnBorder` and `headerColumnBorder` - sets the vertical borders between columns in the grid and header
- `wrapperBorder` - sets the border around the grid itself

##  Example: row borders [Copy Link](#example-row-borders) 

```
const myTheme = themeQuartz.withParams({
    wrapperBorder: false,
    headerRowBorder: false,
    rowBorder: { style: 'dotted', width: 3, color: '#9696C8' },
    columnBorder: { style: 'dashed', color: '#9696C8' },
});

```

 
  
 ###  Borders between header cells [Copy Link](#borders-between-header-cells) 

Column borders between header cells have adjustable height, and there is also the option of styling the resize handle which is only present on resizable columns. See [Customising Headers](/react-data-grid/theming-headers/) for more information.

---

## 8. React Grid: Theming: Compactness & Row Height | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-compactness/](https://www.ag-grid.com/react-data-grid/theming-compactness/)

Add more white space or pack more data into the UI.

`spacing` is the main theme parameter that controls how tightly data and UI elements are packed together. All padding in the grid is defined as a multiple of this value, so increasing it will make most components larger by increasing their internal white space while leaving the size of text and icons unchanged.

In the following example, classes are applied to the grid container that change compactness dynamically:

 
  
 ##  Row Height [Copy Link](#row-height) 

By default, row height is determined by the content height plus padding. Content height is `max(iconSize, dataFontSize)`. Padding is a multiple of `spacing`. This means that your rows can change size if you change any of the icon size, font size, or spacing.

The grid provides two ways of customising row height:

`rowVerticalPaddingScale` and `headerVerticalPaddingScale` are plain numbers without units. The padding is multiplied by this number, so `0.75` would mean 3/4 of the usual padding. Using these scale parameters preserves the behaviour that row size adjusts when font size changes, which is useful if font size is not known in advance.

`rowHeight` and `headerHeight` are CSS length values - numbers with units. They set the height of the row or header to a fixed value, regardless of the font size or icon size.

`listItemHeight` sets the height of rows in lists such as the [rich select editor](/react-data-grid/provided-cell-editors-rich-select/) and [set filter](/react-data-grid/filter-set/).

##  More Compactness Parameters [Copy Link](#more-compactness-parameters) 

To find compactness parameters relating to a feature, search for the feature name in the "All Parameters" section of the [Theme Builder](/theme-builder/).

##  Extended Syntax For Length Parameters [Copy Link](#extended-syntax-for-length-parameters) 

All compactness parameters except `rowVerticalPaddingScale` and `headerVerticalPaddingScale` are length parameters - numbers with units like `10px`. Length parameters do not have a common suffix - any parameter that does not have a special suffix like `Color` or `FontFamily` is a length value.

Length parameters can accept the following values:

SyntaxDescription`string`A [CSS length value](https://developer.mozilla.org/en-US/docs/Web/CSS/length), such as `'10px'` or variable expression `'var(--myAppHeaderSize)'`.`4`A number without units is assumed to be pixels`{ ref: 'spacing' }`Use the same value as the `spacing` parameter`{ calc: '4 * spacing - 2px' }`A CSS [calc expression](https://developer.mozilla.org/en-US/docs/Web/CSS/calc), except that parameter names are allowed and will be converted to the appropriate CSS custom property. This expression would map to the CSS string  `"calc(4 * var(--ag-spacing) - 2px)"`. Note that `-` is a valid character in CSS identifiers, so if you use it for subtraction then spaces are required around it.##  Using CSS rules to customise compactness [Copy Link](#using-css-rules-to-customise-compactness) 

The grid contains thousands of elements. Most of them respond to the `spacing` parameter, by having their default padding defined as a multiple of it. But many of them don't have their own specific parameters to customise size. For all elements except rows, headers and list items (see note below), you can set their height, margin or paddings using CSS rules that target a class name, e.g.

```
.ag-panel-title-bar {
    height: 80px;
}

```

###  Setting the height of rows, headers and list items [Copy Link](#setting-the-height-of-rows-headers-and-list-items) 

To change the height of rows, headers and list item heights, you *must* use the provided parameters `rowHeight`, `headerHeight` and `listItemHeight`, or the equivalent CSS custom properties `--ag-row-height`, `--ag-header-height` and `--ag-list-item-height`. The grid uses [DOM virtualisation](/react-data-grid/dom-virtualisation/) for rendering large amounts of data, and needs to know the height of virtualised elements in order to calculate their layout. It does this by measuring the values of CSS variables such as `--ag-row-height`.

Using CSS to set a height on a row element itself e.g. `.ag-row { height: 50px; }` is not supported.

---

## 9. React Grid: Theming: Customising Selections | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-selections/](https://www.ag-grid.com/react-data-grid/theming-selections/)

Control how selected rows and cells appear.

##  Row Selections [Copy Link](#row-selections) 

When [row selection](/react-data-grid/row-selection/) is enabled, you can set the color of selected rows using the `selectedRowBackgroundColor` parameter. If your grid uses alternating row colours we recommend setting this to a semi-transparent colour so that the alternating row colours are visible below it.

```
const myTheme = themeQuartz.withParams({
    
    selectedRowBackgroundColor: 'rgba(0, 255, 0, 0.1)',

    
    
    oddRowBackgroundColor: '#8881',
});

```

 
  
 ##  Cell Selections [Copy Link](#cell-selections) 

[Cell selections](/react-data-grid/cell-selection/) can be created by clicking and dragging on the grid. Copying from a selection will briefly highlight the range of cells (Ctrl + C). There are several parameters to control the selection and highlight style:

```
const myTheme = themeQuartz.withParams({
    
    rangeSelectionBorderColor: 'rgb(193, 0, 97)',
    rangeSelectionBorderStyle: 'dashed',
    
    
    rangeSelectionBackgroundColor: 'rgb(255, 0, 128, 0.1)',
    
    rangeSelectionHighlightColor: 'rgb(60, 188, 0, 0.3)',

    
    
    oddRowBackgroundColor: '#8881',
});

```

 
  
 ###  Cell Selection for Integrated Charts [Copy Link](#cell-selection-for-integrated-charts) 

When using [integrated charts](/react-data-grid/integrated-charts/) with cell selections, the grid uses different colors to indicate the purpose of the cell ranges:

- `rangeSelectionChartBackgroundColor` - background color for cells used as chart data
- `rangeSelectionChartCategoryBackgroundColor` - background color for cells used as categories / axis labels

---

## 10. React Grid: Theming: Customising Headers | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-headers/](https://www.ag-grid.com/react-data-grid/theming-headers/)

Style grid header cells and column groups.

The grid exposes many theme parameters starting `header*` for customising header appearance:

```
const myTheme = themeQuartz.withParams({
    headerHeight: '30px',
    headerTextColor: 'white',
    headerBackgroundColor: 'black',
    headerCellHoverBackgroundColor: 'rgba(80, 40, 140, 0.66)',
    headerCellMovingBackgroundColor: 'rgb(80, 40, 140)',
});

```

For a full list of relevant parameters, search "header" in the "All Parameters" section of the [Theme Builder](/theme-builder/) or use typescript autocompletion in your IDE.

When the theme parameters are not enough you can use CSS classes, in particular `ag-header`, `ag-header-cell`, and `ag-header-group-cell`:

```
.ag-theme-quartz .ag-header {
    font-family: cursive;
}
.ag-theme-quartz .ag-header-group-cell {
    font-weight: normal;
    font-size: 22px;
}
.ag-theme-quartz .ag-header-cell {
    font-size: 18px;
}

```

 
  
 ##  Header Column Borders and Resize Handles [Copy Link](#header-column-borders-and-resize-handles) 

Header Column Borders appear between every column, whereas Resize Handles only appear on resizeable columns (Group 1 in the example below).

```
const myTheme = themeQuartz.withParams({
    headerColumnBorder: { color: 'purple' },
    headerColumnBorderHeight: '80%',

    headerColumnResizeHandleColor: 'orange',
    headerColumnResizeHandleHeight: '25%',
    headerColumnResizeHandleWidth: '5px',
});

```

 
  
 ##  Style Header on Filter [Copy Link](#style-header-on-filter) 

Each time a [Column Filter](/react-data-grid/filtering/) is applied to a column, the CSS class `ag-header-cell-filtered` is added to the header. This can be used for adding style to headers that are filtered.

The example below adds some styling to `ag-header-cell-filtered`, so when you filter a column you will notice the column header change.

 
  
 ##  Styling the First and Last Columns [Copy Link](#styling-the-first-and-last-columns) 

It's possible to style the all first and last column header (Grouped, Non-Grouped and Floating Filters) using CSS by targeting the `.ag-column-first` and `.ag-column-last` selectors as follows:

```
.ag-header-group-cell.ag-column-first {
    background-color: #2244CC66; 
}
.ag-header-cell.ag-column-first {
    background-color: #2244CC44; 
}
.ag-floating-filter.ag-column-first {
    background-color: #2244CC22; 
}

.ag-header-group-cell.ag-column-last {
    background-color: #33CC3366; 
}
.ag-header-cell.ag-column-last {
    background-color: #33CC3344; 
}
.ag-floating-filter.ag-column-last {
    background-color: #33CC3322; 
}

```

---

## 11. React Grid: Custom Icons | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/custom-icons/](https://www.ag-grid.com/react-data-grid/custom-icons/)

This section details how to provide your own icons for the grid and style grid icons for your application requirements

##  Swapping the Provided Icon Set [Copy Link](#swapping-the-provided-icon-set) 

The grid provides several icon sets as [theme parts](/react-data-grid/theming-parts/). You can change the icon set on a theme using `theme.withPart(iconSet)`.

Available icon sets are:

- `iconSetQuartz` - our default icon set
`iconSetQuartz({strokeWidth: number})` you can call iconSetQuartz as a function to provide a custom stroke width in pixels (the default is 1.5)
- `iconSetQuartzLight` and `iconSetQuartzBold` preset lighter and bolder versions of the Quartz icons with 1px and 2px stroke widths respectively.

- `iconSetAlpine` - the icon set used by the Alpine theme
- `iconSetMaterial` - the Material Design icon set (these are designed to be displayed at look best at 18, 24, 36 or 48px)

This example shows the Quartz theme with the Material icon set

```
import { iconSetMaterial, themeQuartz } from 'ag-grid-community';

const myTheme = themeQuartz
    .withPart(iconSetMaterial)
    
    .withParams({
        iconSize: 18,
    });

```

 
  
 ##  Styling Provided Icons [Copy Link](#styling-provided-icons) 

You can change the colour of the provided icons using CSS, and add other CSS styles such as borders and backgrounds. Icons have CSS class names in the format `ag-icon-{iconName}`. Use browser developer tools to find the appropriate class.

Provided icons inherit the current text colour, so use the CSS `color` property to change their colour:

```

.ag-icon-menu-alt {
    color: red;
}

.ag-icon-tree-closed,
.ag-icon-tree-open {
    border-radius: 4px;
    background-image: linear-gradient(to bottom, #66aec8, #aa74c6);
}

```

 
  
 ##  Replacing Individual Icons [Copy Link](#replacing-individual-icons) 

The `iconOverrides` part can be used to change individual icons to an image, solid colour with image mask, or icon font character. It can be used multiple times in the same theme to mix different types of icon.

###  Overriding Icons with Images [Copy Link](#overriding-icons-with-images) 

`iconOverrides` can replace icons with images using the following arguments:

ParameterDescription`type``image``mask`If `true`, the icon shape is taken from the image and the colour from the grid `foregroundColor` parameter. This allows one icon to serve in both light and dark modes`icons`A map of [icon name](#provided-icons) to images. Values use [image parameter syntax](/react-data-grid/theming-parameters/#image-values) to accept image urls or svg source code.```
import { themeQuartz, iconOverrides } from 'ag-grid-community';

const mySvgIcons = iconOverrides({
    type: 'image',
    mask: true,
    icons: {
      
      'filter': { url: 'https://examle.com/my-filter-icon.svg' },
      'group': { svg: '<svg> ... svg source ...</svg>' },
    }
});

const myTheme = themeQuartz.withPart(mySvgIcons);

```

###  Replacing Icons with Icon Font Characters [Copy Link](#replacing-icons-with-icon-font-characters) 

`iconOverrides` can replace icons with icon font glyphs or emoji using the following arguments:

ParameterDescription`type``font``family`Optional, the name of the icon font family to use`cssImports`Optional, an array CSS file URLs to import, can be used to load the CSS file that defines the icon font`weight`Optional, e.g. `bold`. Some icon fonts such as fontawesome require a bold font weight.`color`Optional CSS colour e.g. `red`. Can use [colour parameter syntax](/react-data-grid/theming-parameters/#color-values) to reference and mix other colour parameters.`icons`A map of [icon name](#icon-names) to text data. If you're using an icon font, the correct character for each icon will be documented by your font. But you can use any text or emoji.```
import { themeQuartz, iconOverrides } from 'ag-grid-community';

const fontAwesomeIcons = iconOverrides({
    type: 'font',
    family: 'Font Awesome 5 Free',
    cssImports: ['https://use.fontawesome.com/releases/v5.6.3/css/all.css'],
    weight: 'bold', 
    icons: {
        
        asc: '\u{f062}',
        desc: '\u{f063}',
    },
})

const myTheme = themeQuartz.withPart(fontAwesomeIcons);

```

###  Replacing Icons Example [Copy Link](#replacing-icons-example) 

The following example combines the various ways of overriding icons:

- Sorting and grouping icons (coloured green) are replaced with characters from FontAwesome
- Group and Aggregation icons (coloured red) are replaced with characters from the Material Design Icons font
- The Columns icon (🏛️) is replaced with an emoji
- The filter icon is replaced with a blue-coloured SVG image
- The column menu icon is replaced with an SVG image in mask mode. Although the image is blue, the icon uses the grid foreground colour and will change colour as appropriate for light or dark mode.

 
  
 ##  Styling Icons Using CSS [Copy Link](#styling-icons-using-css) 

If you prefer to style your application using pure CSS, you can still change icons.

```
.ag-icon-group {
    
    background: url('https://www.ag-grid.com/example-assets/svg-icons/group.svg');
    
    color: transparent;
}

```

 
  
 ##  Provided Icons [Copy Link](#provided-icons) 

Below you can see a list with all available icons for each provided theme. The name next to each icon is the CSS name, e.g. the `pin` icon will have the CSS class `ag-icon-pin`.

![aggregation](/theme-icons/quartz/aggregation.svg)aggregation

![arrows](/theme-icons/quartz/arrows.svg)arrows

![asc](/theme-icons/quartz/asc.svg)asc

![cancel](/theme-icons/quartz/cancel.svg)cancel

![chart](/theme-icons/quartz/chart.svg)chart

![chevron-up](/theme-icons/quartz/chevron-up.svg)chevron-up

![chevron-down](/theme-icons/quartz/chevron-down.svg)chevron-down

![chevron-left](/theme-icons/quartz/chevron-left.svg)chevron-left

![chevron-right](/theme-icons/quartz/chevron-right.svg)chevron-right

![color-picker](/theme-icons/quartz/color-picker.svg)color-picker

![columns](/theme-icons/quartz/columns.svg)columns

![contracted](/theme-icons/quartz/contracted.svg)contracted

![copy](/theme-icons/quartz/copy.svg)copy

![cut](/theme-icons/quartz/cut.svg)cut

![cross](/theme-icons/quartz/cross.svg)cross

![csv](/theme-icons/quartz/csv.svg)csv

![desc](/theme-icons/quartz/desc.svg)desc

![down](/theme-icons/quartz/down.svg)down

![edit](/theme-icons/quartz/edit.svg)edit

![excel](/theme-icons/quartz/excel.svg)excel

![expanded](/theme-icons/quartz/expanded.svg)expanded

![eye-slash](/theme-icons/quartz/eye-slash.svg)eye-slash

![eye](/theme-icons/quartz/eye.svg)eye

![filter](/theme-icons/quartz/filter.svg)filter

![filter-add](/theme-icons/quartz/filter-add.svg)filter-add

![first](/theme-icons/quartz/first.svg)first

![grip](/theme-icons/quartz/grip.svg)grip

![group](/theme-icons/quartz/group.svg)group

![last](/theme-icons/quartz/last.svg)last

![left](/theme-icons/quartz/left.svg)left

![linked](/theme-icons/quartz/linked.svg)linked

![loading](/theme-icons/quartz/loading.svg)loading

![maximize](/theme-icons/quartz/maximize.svg)maximize

![menu](/theme-icons/quartz/menu.svg)menu

![menu-alt](/theme-icons/quartz/menu-alt.svg)menu-alt

![minimize](/theme-icons/quartz/minimize.svg)minimize

![minus](/theme-icons/quartz/minus.svg)minus

![next](/theme-icons/quartz/next.svg)next

![none](/theme-icons/quartz/none.svg)none

![not-allowed](/theme-icons/quartz/not-allowed.svg)not-allowed

![paste](/theme-icons/quartz/paste.svg)paste

![pin](/theme-icons/quartz/pin.svg)pin

![pinned-bottom](/theme-icons/quartz/pinned-bottom.svg)pinned-bottom

![pinned-top](/theme-icons/quartz/pinned-top.svg)pinned-top

![pivot](/theme-icons/quartz/pivot.svg)pivot

![plus](/theme-icons/quartz/plus.svg)plus

![previous](/theme-icons/quartz/previous.svg)previous

![right](/theme-icons/quartz/right.svg)right

![save](/theme-icons/quartz/save.svg)save

![small-down](/theme-icons/quartz/small-down.svg)small-down

![small-left](/theme-icons/quartz/small-left.svg)small-left

![small-right](/theme-icons/quartz/small-right.svg)small-right

![small-up](/theme-icons/quartz/small-up.svg)small-up

![tick](/theme-icons/quartz/tick.svg)tick

![tree-closed](/theme-icons/quartz/tree-closed.svg)tree-closed

![tree-indeterminate](/theme-icons/quartz/tree-indeterminate.svg)tree-indeterminate

![tree-open](/theme-icons/quartz/tree-open.svg)tree-open

![unlinked](/theme-icons/quartz/unlinked.svg)unlinked

![up](/theme-icons/quartz/up.svg)up

##  Set the Icons Through gridOptions (JavaScript) [Copy Link](#set-the-icons-through-gridoptions-javascript) 

You can pass an `icons` property either on the [Grid Options](/react-data-grid/grid-options/) to apply across the whole grid, or the [Column Definition](/react-data-grid/column-properties/). If both are provided, icons specified at the column level will take priority.

The `icons` property takes an object of name/value pairs where the name is one of the icon names below (note that these are different from the CSS names above) and the value is one of:

- An HTML string to be inserted in place of the usual DOM element for an icon
- A function that returns either an HTML string or a DOM node

 
  
 In the following list, the name to use in the grid options is to the left, and on the right is default value CSS icon name as listed in the [Provided Icons](#provided-icons) table below.

##  Icon Names [Copy Link](#icon-names) 

This is a mapping of javascript name to CSS name for icons. When overriding icons using grid options, use the names on the left. When overriding icons in CSS or with `iconOverrides`, use the names on the right.

```

columnGroupOpened: 'expanded'

columnGroupClosed: 'contracted'

columnSelectClosed: 'tree-closed',

columnSelectOpen: 'tree-open',

columnSelectIndeterminate: 'tree-indeterminate',

accordionOpen: 'tree-open',

accordionClosed: 'tree-closed',

accordionIndeterminate: 'tree-indeterminate',

columnMovePin: 'pin'

columnMoveHide: 'eye-slash'

columnMoveMove: 'arrows'

columnMoveLeft: 'left'

columnMoveRight: 'right'

columnMoveGroup: 'group'

columnMoveValue: 'aggregation'

columnMovePivot: 'pivot'

dropNotAllowed: 'not-allowed'

groupContracted: 'tree-closed'

groupExpanded: 'tree-open'

setFilterGroupClosed: 'tree-closed',

setFilterGroupOpen: 'tree-open',

setFilterGroupIndeterminate: 'tree-indeterminate',

setFilterLoading: 'loading'

chart: 'chart'

close: 'cross'

cancel: 'cancel'

check: 'tick'

first: 'first'

previous: 'previous'

next: 'next'

last: 'last'

linked: 'linked'

unlinked: 'unlinked'

groupLoading: 'loading'

menu: 'menu',

menuAlt: 'menu-alt',

legacyMenu: 'menu'

filter: 'filter',

filterActive: 'filter'

filterAdd: 'filterAdd'

filterCardCollapse: 'chevron-up',

filterCardExpand: 'chevron-down',

filterCardEditing: 'edit',

filterTab: 'filter',

filtersToolPanel: 'filter'

columns: 'columns'

columnsToolPanel: 'columns'

maximize: 'maximize'

minimize: 'minimize'

menuPin: 'pin'

menuValue: 'aggregation'

menuAddRowGroup: 'group'

menuRemoveRowGroup: 'group'

clipboardCopy: 'copy'

clipboardCut: 'cut'

clipboardPaste: 'paste'

pivotPanel: 'pivot'

rowGroupPanel: 'group'

valuePanel: 'aggregation'

columnDrag: 'grip'

rowDrag: 'grip'

save: 'save'

csvExport: 'csv'

excelExport: 'excel'

selectOpen: 'small-down',

richSelectOpen: 'small-down',

richSelectRemove: 'cancel',

subMenuOpen: 'small-right',

subMenuOpenRtl: 'small-left',

panelDelimiter: 'small-right',

panelDelimiterRtl: 'small-left',

sortAscending: 'asc'

sortDescending: 'desc'

sortUnSort: 'none',

advancedFilterBuilder: 'group',

advancedFilterBuilderDrag: 'grip',

advancedFilterBuilderInvalid: 'not-allowed',

advancedFilterBuilderMoveUp: 'up',

advancedFilterBuilderMoveDown: 'down',

advancedFilterBuilderAdd: 'plus',

advancedFilterBuilderRemove: 'minus',

advancedFilterBuilderSelect: 'small-down',

chartsMenu: 'menu-alt',

chartsMenuEdit: 'chart',

chartsMenuAdvancedSettings: 'settings',

chartsMenuAdd: 'plus',

chartsColorPicker: 'small-down'

chartsThemePrevious: 'previous',

chartsThemeNext: 'next',

chartsDownload: 'save',

```

---

## 12. React Grid: Theming: Master / Detail Styling | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-master-detail/](https://www.ag-grid.com/react-data-grid/theming-master-detail/)

This section shows how the detail grid can be styled.

##  Styling Detail Grids [Copy Link](#styling-detail-grids) 

Detail grids must have the same theme as their master grid. If you omit the `theme` grid option in a detail grid it will default to the same theme as the master grid. If you attempt to set a different theme you'll get an error message in your console.

Instead, use CSS to change the style of the detail grid.

```

.ag-details-row {
    background: #f442;
    padding: 5px 5px 5px 40px;
}

.ag-details-grid {
    --ag-row-height: 20px;

    .ag-header-cell {
        color: #f80;
        font-weight: bold;
    }

    .ag-details-grid {
        
    }
}

```

 
  
 See [Customising the grid with CSS](/react-data-grid/theming-css/) for more details on CSS use.

###  Limitations of CSS variables on detail grids [Copy Link](#limitations-of-css-variables-on-detail-grids) 

You can set CSS variables on detail grids, but be aware of a difference in how they work compared to setting them on a master grid.

Some high-level variables control the behaviour of many lower-level variables by providing default values. This is the case for general colors like --ag-background-color and for --ag-spacing.

In this example we set the background color to red. Normally this would cause the odd row background color to be red too, because the value of --ag-odd-row-background-color defaults to the background color. But the master grid has already set a default value for --ag-odd-row-background-color, and this is inherited by the detail grid.

```
.ag-details-grid {
    --ag-background-color: #f004;
}

```

 
  
 In order to avoid this, you need to set the lower-level variable explicitly too:

```
.ag-details-grid {
    --ag-background-color: #f004;
    --ag-odd-row-background-color: var(--ag-background-color);
}

```

---

## 13. React Grid: Theming: Customising Tool Panels | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-tool-panels/](https://www.ag-grid.com/react-data-grid/theming-tool-panels/)

Style the Filters [Tool Panel](/react-data-grid/component-tool-panel/) and [Columns Tool Panel](/react-data-grid/tool-panel-columns/).

##  Styling the Sidebar Area [Copy Link](#styling-the-sidebar-area) 

The sidebar is a tabbed container for opening and switching between tool panels. The grid exposes many theme parameters for customising the sidebar and tabbed buttons. Search "side" in the "All Parameters" section of the [Theme Builder](/theme-builder/) or use typescript autocompletion in your IDE.

```
const myTheme = themeQuartz.withParams({
    sideBarBackgroundColor: '#08f3',
    sideButtonBarBackgroundColor: '#fff6',
    sideButtonBarTopPadding: 20,
    sideButtonSelectedUnderlineColor: 'orange',
    sideButtonTextColor: '#0009',
    sideButtonHoverBackgroundColor: '#fffa',
    sideButtonSelectedBackgroundColor: '#08f1',
    sideButtonHoverTextColor: '#000c',
    sideButtonSelectedTextColor: '#000e',
    sideButtonSelectedBorder: false,
});

```

To create effects beyond what is possible with theme parameters, use CSS selectors:

```
.ag-side-button.ag-selected {
    text-shadow: 0 0 8px #039;
    font-weight: 500;
}

```

 
  
 ##  Styling the Columns Tool Panel [Copy Link](#styling-the-columns-tool-panel) 

The `--ag-column-select-indent-size` CSS Variable sets the indent of each column group within the columns tool panel. For further customisation, use CSS selectors.

This example demonstrates changing the child indent for grouped columns and the style of the column drop component in the Row Groups area:

```
const myTheme = themeQuartz.withParams({
    columnSelectIndentSize: 40,
    columnDropCellBackgroundColor: 'purple',
    columnDropCellTextColor: 'white',
    columnDropCellDragHandleColor: 'white',
    columnDropCellBorder: { color: 'yellow', style: 'dashed', width: 2 },
});

```

```
.ag-column-drop-cell {
    box-shadow: 0 0 4px purple;
}

.ag-column-drop-vertical-rowgroup {
    min-height: 120px;
}
.ag-column-drop-vertical-aggregation {
    min-height: 90px;
}

```

---

## 14. React Grid: Customising Inputs & Widgets | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-widgets/](https://www.ag-grid.com/react-data-grid/theming-widgets/)

Style text inputs, checkboxes, toggle buttons and range sliders.

##  Styling Text Inputs [Copy Link](#styling-text-inputs) 

The grid exposes many theme parameters beginning `input*` for customising text input appearance. Search "input" in the "All Parameters" section of the [Theme Builder](/theme-builder/) or use typescript autocompletion in your IDE.

```
const myTheme = themeQuartz.withParams({
    inputBorder: { color: 'orange', style: 'dotted', width: 3 },
    inputBackgroundColor: 'rgb(255, 209, 123)',
    inputPlaceholderTextColor: 'rgb(155, 101, 1)',
    inputIconColor: 'purple', 
    inputTextColor: 'black',
    
    inputInvalidBackgroundColor: 'purple',
    inputInvalidBorder: 'darkred',
    inputInvalidTextColor: 'white'
});

```

If there is no parameter for the effect that you want to achieve, you can use CSS selectors:

```
.ag-text-field-input {
    box-shadow: 0 0 10px orange;
}

```

 
  
 ###  Underlined Text Inputs [Copy Link](#underlined-text-inputs) 

The default text input style is `inputStyleBordered`. The other provided input style is `inputStyleUnderlined` which produces a Material Design style underlined input. These are [theme parts](/react-data-grid/theming-parts/) so you can swap them using `theme.usePart()` or create your own:

```
const myTheme = themeQuartz.withPart(inputStyleUnderlined);

```

 
  
 `inputStyleUnderlined` supports all the same theme parameters but only applies border parameters to the bottom border so use for example `inputBorder` and `inputFocusBorder` to style the underline in default and focus states.

###  Creating Your Own Text Input Styles [Copy Link](#creating-your-own-text-input-styles) 

If you'd like to create your own input styles from scratch you can remove the existing `inputStyle` part, see [Removing a Part](/react-data-grid/theming-parts/#removing-a-part).

##  Styling Checkboxes [Copy Link](#styling-checkboxes) 

The grid exposes many theme parameters beginning `checkbox*` for customising checkbox appearance. Search "checkbox" in the "All Parameters" section of the [Theme Builder](/theme-builder/) or use typescript autocompletion in your IDE.

```
const myTheme = themeQuartz.withParams({
    checkboxUncheckedBackgroundColor: 'yellow',
    checkboxUncheckedBorderColor: 'darkred',
    checkboxCheckedBackgroundColor: 'red',
    checkboxCheckedBorderColor: 'darkred',
    checkboxCheckedShapeColor: 'yellow',
    checkboxCheckedShapeImage: {
        svg: '<svg>... svg source code...</svg>',
    },
    checkboxIndeterminateBorderColor: 'darkred',
});

```

If there is no parameter for the effect that you want to achieve, you can use CSS selectors:

```
.ag-checkbox-input-wrapper {
    ... default styles ...
}
.ag-checkbox-input-wrapper.ag-checked {
    ... override default styles for 'checked' state ...
}
.ag-checkbox-input-wrapper.ag-indeterminate {
    ... override default styles for 'indeterminate' state ...
}

```

 
  
 ###  Changing Checkbox Icons [Copy Link](#changing-checkbox-icons) 

The example above uses `checkboxCheckedShapeImage` to replace the default check mark with a X symbol. By default, `checkboxCheckedShapeImage` provides only the shape of the check mark, and the color is replaced using the `checkboxCheckedShapeColor` parameter.

If you have SVG images containing their own color, this example demonstrates how to create a checkbox style with coloured SVG images. It removes the existing checkbox styles using `theme.removePart()` and adds new styles with CSS:

 
  
 ###  Creating Your Own Checkbox Styles [Copy Link](#creating-your-own-checkbox-styles) 

If you'd like to create your own checkbox styles from scratch you can remove the existing `checkboxStyle` part, see [Removing a Part](/react-data-grid/theming-parts/#removing-a-part).

###  Styling Radio Buttons [Copy Link](#styling-radio-buttons) 

Radio Buttons, such as those in the chart settings UI, are specialised checkboxes. They have their corner radius overridden to be 100% to create a round shape, and get their checked shape from the `radioCheckedShapeImage` theme parameter.

##  Styling Toggle Buttons [Copy Link](#styling-toggle-buttons) 

Toggle Buttons, such as the "Pivot Mode" toggle in the example below, are styled using theme parameters beginning `toggleButton*`.

```
const myTheme = themeQuartz.withParams({
    toggleButtonWidth: 50,
    toggleButtonHeight: 30,
    toggleButtonSwitchInset: 10,
    toggleButtonOffBackgroundColor: 'darkred',
    toggleButtonOnBackgroundColor: 'darkgreen',
    toggleButtonSwitchBackgroundColor: 'yellow',
});

```

 
  
 If there is no parameter that achieves the effect you want, you can use CSS selectors:

```
.ag-toggle-button-input-wrapper {
    ... background styles ...
}
.ag-toggle-button-input-wrapper.ag-checked {
    ... override background styles for 'checked' state ...
}
.ag-toggle-button-input-wrapper::before {
    ... sliding switch styles ...
}
.ag-toggle-button-input-wrapper.ag-checked::before {
    ... override sliding switch styles for 'checked' state ...
}

```

---

## 15. React Grid: Theming: Customising Menus & Popups | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-popups/](https://www.ag-grid.com/react-data-grid/theming-popups/)

Style UI elements that float above the main UI, including menus.

##  Rounding corners [Copy Link](#rounding-corners) 

- `borderRadius` sets the radius of most rectangular elements within the grid, including the grid itself.
- `wrapperBorderRadius` sets the radius of the grid wrapper, if you want it to be different from `borderRadius`.
- Radius on other elements can be set using css selectors, e.g. `.ag-menu { border-radius: 2px }` will set the radius of popup menus like the right-click context menu.

##  Drop shadows [Copy Link](#drop-shadows) 

The grid exposes several theme parameters for controlling shadows. Two master parameters control many shadows at once:

- `popupShadow` - a large shadow used on elements that are supposed to appear floating above the grid and separate from it, e.g. drag/drop images and dialogs
- `cardShadow` - a small shadow for for elements that are supposed to appear above the grid but connected to it, like dropdowns and cell editors

And you can override shadows for individual elements using more specific parameters:

- `menuShadow` - Shadow for menus e.g. column menu and right-click context menu
- `dialogShadow` - Shadow for popup dialogs such as integrated charts and the advanced filter builder
- `cellEditingShadow` - Shadow for cells being edited
- `dragAndDropImageShadow` - Shadow for the drag and drop image component element when dragging columns
- and more - search "shadow" in the "All Parameters" section of the [Theme Builder](/theme-builder/) or use typescript autocompletion in your IDE.

Shadows can use the [extended syntax for shadow values](/react-data-grid/theming-parameters/#shadow-values):

```
const myTheme = themeQuartz.withParams({
    menuShadow: { radius: 10, spread: 5, color: 'red' },
});

```

##  Styling menus [Copy Link](#styling-menus) 

In order of preference, these techniques can be used to style menus:

- Use the  `menuBorder`, `menuSeparatorColor`, `menuShadow` and `menuTextColor` parameters.
- Use CSS rules targeting `.ag-menu` to provide default styles that apply to all menus - column menus, filter menus and right-click context menus.
- Some menus have specific classes, e.g. `.ag-column-menu` and `.ag-filter-menu` that can be used to override their styles. Check the browser developer tools to find the menu class.
- Sometimes you want to be more specific, for example to style the set filter menu but not other filter menus. For this you can use the CSS `:has()` selector to select menus containing a specific component, e.g. `.ag-menu:has(.ag-set-filter)`. Use the browser developer tools to find the component class.

##  Example [Copy Link](#example) 

This example combines all of the above techniques to style the context, column and set filter menus. Click on the column menu and filter menu icons in the column header, or right click on the grid to show a context menu:

```

const myTheme = themeQuartz.withParams({
    menuBackgroundColor: 'cornflowerblue',
    menuShadow: { radius: 10, spread: 5, color: 'red' },
});

```

```

.ag-menu:has(.ag-set-filter) {
    box-shadow: 0 0 10px 5px green;
}

.ag-menu.ag-column-menu {
    box-shadow: 0 0 10px 5px blue;
}

```

---

## 16. React Grid: Theming: Customising the grid with CSS | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-css/](https://www.ag-grid.com/react-data-grid/theming-css/)

Customising the grid with CSS

While the grid provides [parameters](/react-data-grid/theming-parameters/) and [parts](/react-data-grid/theming-parts/) for the most common customisations, it's not practical to provide a parameter for every possible customisation. Most grid applications, especially those with precise design requirements, use CSS to fine-tune the look of the grid.

##  Custom CSS Rules [Copy Link](#custom-css-rules) 

A running grid instance contains thousands of DOM elements, and each of them has class names like `ag-header` and `ag-row`. You can target these class names with your own CSS rules, allowing limitless customisation.

If your designer has specified, for example, animated rainbow text on the header, that's achievable:

```
.ag-header-cell-text {
    background: linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet, red);
    font-weight: 600;
    font-size: 20px;
    animation: animatedTextGradient 2.5s linear infinite;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    background-size: 200% auto;
}

@keyframes animatedTextGradient {
    to {
        background-position: -200% center;
    }
}

```

 
  
 The best way to find the right class name to use in a CSS rule is using the browser's developer tools. You will notice that components often have multiple class names, some more general than others. For example, the Column Drop component is an area into which you can drag columns. There are two kinds - a horizontal one in the [row group panel](/react-data-grid/grouping-group-panel/) and a vertical one in the [columns tool panel](/react-data-grid/tool-panel-columns/#example). You can use the class name `ag-column-drop` to target either kind, or `ag-column-drop-vertical` / `ag-column-drop-horizontal` to target one only.

##  Overriding Theme Parameters with Custom Properties [Copy Link](#overriding-theme-parameters-with-custom-properties) 

Themes created by the Theming API support over a hundred [Theme Parameters](/react-data-grid/theming-parameters/#finding-theme-parameters). The values provided through the Theming API are default values, and can be overridden using CSS, meaning that many grids can share the same theme and CSS can be used to create differences between the grids.

The names of the CSS custom properties are prefixed with `--ag-` to avoid conflicts with other custom properties in your application, and use kebab-case:

```
body {
    
    --ag-background-color: darkred;
    --ag-foreground-color: lightpink;
    --ag-spacing: 4px;
    
    --ag-browser-color-scheme: dark;
}

```

 
  
 Values for CSS custom properties are inherited by child elements. The above example sets the custom property on the `body` element, so will affect every grid on the page. You can use different selectors to target individual grids or groups of grids.

###  Using Your App's Existing Custom Properties [Copy Link](#using-your-apps-existing-custom-properties) 

If your app already defines a colour scheme using CSS custom properties and you want to use those values within the grid, you can use `var()` expressions as parameter values:

```
body {
    
    --ag-foreground-color: var(--appMainTextColor);
}

```

###  Understanding CSS rule maintenance and breaking changes [Copy Link](#understanding-css-rule-maintenance-and-breaking-changes) 

With each release of the grid we add features and improve existing ones, and as a result the DOM structure changes with every release - even minor releases. Of course we test and update the CSS rules in our themes to make sure they still work, and this includes ensuring that customisations made via CSS custom properties do not break between releases. But if you have written your own CSS rules, you will need to test and update them.

The simpler your CSS rules are, the less likely they are to break between releases. Prefer selectors that target a single class name where possible.

###  Avoiding Breaking the Grid with CSS Rules [Copy Link](#avoiding-breaking-the-grid-with-css-rules) 

Browsers use the same mechanism - CSS - for controlling how elements work (e.g. scrolling and whether they respond to mouse events), where elements appear, and how elements look. Some of the styles applied by our CSS are essential to how the grid works, and the grid depends on those rules not being overridden. There is nothing that we can do to prevent themes overriding critical rules, so as a theme author you need to be careful not to break the grid. Here's a guide:

- Visual styles including margins, paddings, sizes, colours, fonts, borders etc are all fine to change in a theme.

- Setting a component to `display: flex` and changing flex child layout properties like `align-items`, `align-self` and `flex-direction` is probably OK if you're trying to change how something looks on a small scale, e.g. to change the alignment of some text or icons within a container; but if you're trying to change the layout of the grid on a larger scale e.g. turning a vertical scrolling list into a horizontal one, you are likely to break Grid features.

- The style properties `position`, `overflow` and `pointer-events` are intrinsic to how the grid works. Changing these values will change how the grid operates, and may break functionality now or in future minor releases.

##  CSS Layers [Copy Link](#css-layers) 

[Layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) are a CSS feature that allow you to split your CSS into ordered layers so that rules in later layers always override rules in earlier layers, even if the selectors in earlier layers are more [specific](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity).

By default the grid loads its styles without a layer, meaning that they will override all styles defined in a layer. If your application loads its styles into a CSS layer, you can load the grid styles into an earlier layer so that application styles can override grid styles.

To set the layer that the grid styles are loaded into, use the `themeCssLayer` grid option. You may want to use [global grid options](/react-data-grid/grid-interface/#global-grid-options) to set this on all grids in your app.

In the following example, the header is colored red using styles in the `application` layer. The `themeCssLayer` option is used to load grid styles into an earlier layer called `grid`:

---

## 17. React Grid: Theming: Distributing Shared Themes & Parts | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-distribution/](https://www.ag-grid.com/react-data-grid/theming-distribution/)

For organisations with multiple applications, you can create your own themes and parts to share styles between applications.

###  Creating Themes From Scratch [Copy Link](#creating-themes-from-scratch) 

Most applications create themes by starting with a built-in theme like `themeQuartz` and using the `withParams` and `withPart` method to generate a customised version.

The `createTheme` function creates a new theme containing core styles but no parts. If you're going to change most of the parts anyway, starting from a new theme will reduce the bundle size compared to starting with a built-in theme.

```
import { createTheme, iconSetMaterial } from 'ag-grid-community';

const myCustomTheme = createTheme()
    
    .withPart(iconSetMaterial)
    .withPart(colorSchemeVariable)
    
    .withParams({
        accentColor: 'red',
        iconSize: 18,
    });

```

Note that the checkboxes in the example below are using the default styles from your web browser, because the parts containing their styles have not been added. This is useful if your application does not contain these features, or if you want a clean base upon which to apply your own checkbox styles.

 
  
 ###  Creating Your Own Parts [Copy Link](#creating-your-own-parts) 

For organisations that create a library of reusable styles and share them among many applications, parts can be a convenient way to package up styles and parameters so that each application can use a subset of the whole library.

The benefit of using parts rather than adding CSS in your application stylesheets is that the CSS is scoped: the CSS you provide will only apply to grids with your theme applied, whereas by default CSS in your application stylesheets will apply to all grids unless you add rules to prevent it.

The `createPart` function creates an empty part and takes the following arguments:

```
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
            /* Here we're referencing the checkboxGlowColor parameter in CSS, we need
               to add the --ag- prefix and use kebab-case */
            box-shadow: 0 0 5px 4px var(--ag-checkbox-glow-color);

        ... css implementing the new checkbox style ...
        
        `,
});

```

 
  
 ####  Choosing A Feature For Your Part [Copy Link](#choosing-a-feature-for-your-part) 

You have three options for `feature`:

- `undefined`, or omit the feature property. In this case once added to a theme the part can not be removed. Many applications choose to bundle all the CSS for a custom theme in one part with no feature set. This is the simplest way of getting the CSS scoping benefits of using parts.
- One of the built-in part features, like `checkboxStyle` or `iconSet`. See the [Parts](/react-data-grid/theming-parts/) page for a full list. Adding the part to any theme will replace the built-in part with the same feature.
- A string of your choice, in order to use the same part replacement semantics in your own design system. We recommend prefixing the part name with your organisation to prevent name clashes in future grid versions. For example, Acme Corp might have several typography styles, represented as parts with the feature `acmeCorpTypographyStyle`. Your custom theme can bundle a default typography style, and applications can replace it with a different one if they wish.

####  Naming Of Parameters In Custom Parts [Copy Link](#naming-of-parameters-in-custom-parts) 

Parameters must use a naming convention based on their type, so for example all colour parameters must end with `Color`. The full list of types and suffixes is on the [Parameters](/react-data-grid/theming-parameters/) page. Any variable without a recognised suffix is considered to be a length.

Using the correct type suffix ensures that values will be interpreted correctly, allowing you to use the extended syntax, e.g. `{ref: "accentColor", mix: 0.5}` to create a semi-transparent colour.

Additionally, the suffix is used by Typescript to infer the correct type for the parameter, ensuring that applications using the part and overriding the default value in their theme will get appropriate type checking.

###  Multiple Grids [Copy Link](#multiple-grids) 

Each grid on the page can have its own theme. In the example below, 3 themes are used by 4 grids. The bottom two grids share a theme (Balham) and use CSS custom properties to achieve different header colours:

---

## 18. React Grid: Migrating to the Theming API | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-migration/](https://www.ag-grid.com/react-data-grid/theming-migration/)

Migrating to the Theming API

Before v33, themes were imported as CSS files in our NPM modules, and applied by setting a class name on the grid's container element, e.g. `class="ag-theme-quartz"`. In v33, the default method of styling the grid is the Theming API, in which themes are imported as JavaScript objects and passed to the grid as a grid option. The old method of styling (now called legacy themes) is still supported, but is deprecated and will be removed in a future major version.

To understand the technical context of this change, see [Understanding the Theming API](#understanding-the-theming-api) below.

##  Updating your app for v33 [Copy Link](#updating-your-app-for-v33) 

In v33, the `theme` grid option has a default value, and if no value is provided the quartz theme will be used.

###  Continue with legacy themes [Copy Link](#continue-with-legacy-themes) 

If you want to upgrade to v33 without immediately adopting the Theming API, you can opt back in to the v32 style of themes by passing the string `"legacy"` to the `theme` grid option. You can then continue to use legacy themes.

If you have multiple grids you may find using a [Global Grid Option](/react-data-grid/grid-interface/#global-grid-options) to be a convenient way to set the theme to `"legacy"` for all grids in your application.

```
import { provideGlobalGridOptions } from 'ag-grid-community';

provideGlobalGridOptions({
    theme: "legacy",
});

```

###  Adopt the Theming API [Copy Link](#adopt-the-theming-api) 

To adopt the v33 themes, follow these steps:

###  1. Remove CSS imports [Copy Link](#1-remove-css-imports) 

Applications import the legacy CSS files either through JS (`import 'ag-grid-community/styles/ag-grid.css';`) or by copying the CSS files from the NPM package to the application. Any such CSS imports should be removed.

###  2. Import and use your theme [Copy Link](#2-import-and-use-your-theme) 

Themes can be imported from `ag-grid-community` and passed to the `theme` grid option:

```
import { themeBalham } from 'ag-grid-community';

```

Once imported, you can optionally add default values for any custom properties you want to set using the TypeScript API:

```
const myTheme = themeBalham.withParams({ accentColor: 'red' });

```

You can then pass your theme to the `theme` grid option:

```
<AgGridReact
    theme={myTheme}
    ...
/>

```

###  3. Convert any css custom properties you are using to the new names [Copy Link](#3-convert-any-css-custom-properties-you-are-using-to-the-new-names) 

In legacy themes, custom properties had to be set in CSS. When migrating custom properties to the Theming API you may choose whether to specify them in JavaScript in order to get Typescript validation of property names and values, or to continue to set them in CSS. The list below provides the JS API names, to convert them to CSS use kebab-case and add the `--ag-` prefix (`tooltipTextColor` -> `--ag-tooltip-text-color`).

####  Key changes [Copy Link](#key-changes) 

- `--ag-grid-size` -> `spacing` spacing works a little bit differently from the old "grid size". It controls the padding around elements, whereas grid size controlled their size. So setting spacing to `0` will result in a grid with no padding, whereas setting grid size to `0` would have resulted in zero-height rows.
- `--ag-active-color`, `--ag-alpine-active-color`, `--ag-balham-active-color`, `--ag-material-accent-color` -> use `accentColor`
- `--ag-borders*` -> there has been a reworking of border parameters, see [Customising Borders](/react-data-grid/theming-borders/) for the new list of border parameters.
- `--ag-row-border-color`, `--ag-row-border-style`, `--ag-row-border-width` -> replaced with `rowBorder`
- `--ag-icon-font-*` and `--ag-icon-image-*` -> use [the iconOverrides part](/react-data-grid/custom-icons/#replacing-individual-icons) or use [CSS rules](/react-data-grid/custom-icons/#styling-icons-using-css).

####  Properties with a direct replacement [Copy Link](#properties-with-a-direct-replacement) 

While developing the Theming API we took the opportunity to rename many of our parameters to use a consistent naming scheme and semantics.

Note: the replacement parameter is given as name for use in the TypeScript Theming API, e.g. `chromeBackgroundColor`. To use this in CSS, convert it to kebab-case and add the `--ag-` prefix, e.g. `--ag-chrome-background-color`.

- `--ag-secondary-foreground-color` -> `chromeBackgroundColor`
- `--ag-selected-tab-underline-color` -> `tabSelectedUnderlineColor`
- `--ag-selected-tab-underline-transition-speed` -> `tabSelectedUnderlineTransitionDuration`
- `--ag-selected-tab-underline-width` -> `tabSelectedUnderlineWidth`
- `--ag-advanced-filter-column-pill-color` -> `advancedFilterBuilderColumnPillColor`
- `--ag-advanced-filter-join-pill-color` -> `advancedFilterBuilderJoinPillColor`
- `--ag-advanced-filter-option-pill-color` -> `advancedFilterBuilderOptionPillColor`
- `--ag-advanced-filter-value-pill-color` -> `advancedFilterBuilderValuePillColor`
- `--ag-borders-input` -> `inputBorder`
- `--ag-borders-input-invalid` -> `inputInvalidBorder`
- `--ag-card-radius` -> `borderRadius`
- `--ag-cell-horizontal-border` -> `columnBorder`
- `--ag-chip-background-color` -> `columnDropCellBackgroundColor`
- `--ag-chip-border-color` -> `columnDropCellBorder`
- `--ag-control-panel-background-color` -> `chromeBackgroundColor`
- `--ag-data-color` -> `cellTextColor`
- `--ag-header-column-resize-handle-display` -> removed, use a transparent `headerColumnResizeHandleColor` to hide the resize handle
- `--ag-header-column-separator-color`, `--ag-header-column-separator-width`, `--ag-header-column-separator-display` -> `headerColumnBorder`
- `--ag-header-column-separator-height` -> `headerColumnBorderHeight`
- `--ag-header-foreground-color` -> `headerTextColor`
- `--ag-input-border-color` -> `inputBorder`
- `--ag-input-border-color-invalid` -> `inputInvalidBorder`
- `--ag-input-disabled-border-color` -> `inputDisabledBorder`
- `--ag-input-focus-border-color` -> `inputFocusBorder`
- `--ag-input-focus-box-shadow` -> `inputFocusShadow`
- `--ag-menu-border-color` -> `menuBorderColor`
- `--ag-panel-border-color` -> `dialogBorder`
- `--ag-quartz-icon-active-color` -> this was used to apply an outline to focussed icons, now all focussed elements throughout the grid use `focusShadow`
- `--ag-quartz-icon-hover-color` -> `iconButtonHoverColor`

####  Components with significantly different theming parameters [Copy Link](#components-with-significantly-different-theming-parameters) 

- The [Sidebar](/react-data-grid/side-bar/). Sidebar styling has been overhauled. Custom CSS rules you have written are likely still valid, but custom property names have changed. See [Customising Tool Panels](/react-data-grid/theming-tool-panels/). In particular, in legacy themes the sidebar tabs shared the same custom properties as horizontal tabs. Now they have their own set of parameters beginning "sideBar" or "sideButton".
- `--ag-checkbox-*` -> there has been a significant overhaul of checkbox parameters giving greater control over the appearance of checkboxes. See the Theming API docs. In v32, checkboxes used icons. Now they use their own set of CSS custom properties.
- `--ag-toggle-button-border-width`, `--ag-toggle-button-off-border-color`, `--ag-toggle-button-on-border-color`, and `--ag-toggle-button-switch-border-color` have been removed. In most use cases they can be replaced with the new `toggleButtonSwitchInset` parameter. Other use cases can use CSS. See [Styling Toggle Buttons](/react-data-grid/theming-widgets/#styling-toggle-buttons) for an example.

####  Properties removed with no replacement, use CSS rules to achieve the same effect [Copy Link](#properties-removed-with-no-replacement-use-css-rules-to-achieve-the-same-effect) 

These properties were either outdated, confusing to use, or provided no benefit over using CSS rules.

- `--ag-secondary-border-color` -> there is no longer a concept of "secondary" borders use `borderColor` or CSS rules to target specific borders
- `--ag-borders-side-button`
- `--ag-tab-min-width`
- `--ag-menu-min-width`
- `--ag-subheader-toolbar-background-color`
- `--ag-subheader-background-color`
- `--ag-side-button-selected-background-color`
- `--ag-spectrum-alpha-background-checked`
- `--ag-chart-menu-pill-select-button-color`
- `--ag-disabled-foreground-color`
- `--ag-filter-tool-panel-sub-level-row-height`
- `--ag-minichart-selected-chart-color`
- `--ag-minichart-selected-page-color`

###  4. [optional] Remove ag-theme-* classes and update CSS rules that target them [Copy Link](#4-optional-remove-ag-theme--classes-and-update-css-rules-that-target-them) 

Legacy themes were applied by adding a class name e.g. `ag-theme-quartz` to the wrapper element of the grid. Any CSS custom rules had to include this class name in order to override the styles defined in the theme. This is no longer required.

It is not required to remove the theme classname from your grid container, but if you do, you should also remove the class name from any CSS rules that target it:

Before:

```
<div id="myGrid" class="ag-theme-quartz"></div>

```

```
.ag-theme-quartz {
    --ag-foreground-color: red;
}
.ag-theme-quartz .ag-header-cell {
    font-style: italic;
}

```

After:

```
<div id="myGrid"></div>

```

```
body {
    
    --ag-foreground-color: red;
}
.ag-header-cell {
    font-style: italic;
}

```

###  4. [Sass users only] Remove use of the Sass API [Copy Link](#4-sass-users-only-remove-use-of-the-sass-api) 

The Theming API achieves in JavaScript what the old Sass API did in Sass.

##  Incremental migration [Copy Link](#incremental-migration) 

If your application is split between multiple pages, it can be migrated one page at a time.

If a single HTML document contains multiple grids, we recommend migrating all the grids at the same time if possible - this is the most straightforward way of avoiding conflicts between the v32 styles and the Theming API.

In order to migrate one grid on a page that contains multiple grids, you can use shadow DOM to isolate grids using v32 styles from grids using the Theming API. Be aware however that this is an advanced technique and requires you to understand how shadow DOM works, and how it interacts with your framework and your application structure. Shadow DOM has other effects than simply isolating styles, and using it it may require code changes in your application.

At AG Grid we have had success using the `react-shadow` package to migrate our website.

```
import root from 'react-shadow';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

<div className="ag-theme-quartz" style={{height: '100%'}}>
    <AgGridReact
        theme='legacy'
        ... grid options ...
    />
</div>

<root.div style={{ height: '100%' }}>
    <AgGridReact
        theme={themeQuartz}
        ... grid options ...
    />
</root.div>

```

##  Understanding the Theming API [Copy Link](#understanding-the-theming-api) 

If you are familiar with the method of theming applications used in v32 and earlier, the following technical context will help you understand what is changing and what remains the same.

The grid is styled using CSS. A running grid instance contains thousands of DOM elements, and each of them has class names like `ag-header` and `ag-row` that can be used in CSS rules that change the style of that element. The grid package from NPM contains CSS that set up a default grid style and expose CSS custom properties (variables) that allow configuration of colors, borders, padding, fonts etc. When you want to go beyond what is possible with the custom properties, you write your own CSS rules targeting the grid's class names.

None of this is changing - the grid is still styled with CSS and CSS custom properties, and you can still extend it with your own CSS rules. What the Theming API changes is the following:

- Instead of importing CSS files yourself, the grid is now responsible for inserting the correct CSS into the document head, at the correct position and in the correct order. This eliminates a class of bugs around incorrectly loading CSS files. The Theming API is integrated with the grid's module system so you only load CSS for features you're using, leading to a significant reduction in your app's size.
- There is a TypeScript API for setting CSS custom properties (`theme.withParams(...)`). This provides autocompletion and inline documentation making it easier to find the property you're looking for. You can still set custom properties in CSS if you prefer.
- It is now possible to mix and match elements of different themes. Previously, if you wanted the text inputs from Material and the buttons from Quartz, you would have to write your own styles. Now you can compose your own themes using parts from different built in themes (`theme.withPart(...)`).
- It is a significant rewrite of the CSS we provide to style the grid, containing many improvements and resolving long-standing issues. It contains all the learnings from 10 years of maintaining the old CSS themes. Some examples of changes we've made:
Compactness and spacing has been completely overhauled. In legacy themes the size of many elements was set as a multiple of `--ag-grid-size`, so lower values produced a more compact grid. However in practice after changing the value, many further tweaks were required to get things looking right. In the Theming API this is replaced by `--ag-spacing` which is designed to "just work" at any value.
- Focus styles look and work better, with focus styles on elements like header cells looking more like the focus styles on form inputs.
- CSS custom properties now inherit as expected - if you set `--ag-foreground-color` on the `body` element, it will be inherited by all grids on the page. In legacy themes, the custom property had to be set on the same element as the theme class.
- [Selector specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) has been reduced across the board, making it easier to override in your own style sheets. For example, in legacy themes if you added the following code to your application's style sheet - `.ag-cell-inline-editing { box-shadow: none; }` - it would not have the intended effect of removing the shadow from cells being edited. This was because our CSS that added the shadow had a more specific selector. In the Theming API this code works as expected.
- Custom properties have been added, removed and renamed to make a more consistent and logical set. See [the migration instructions](/react-data-grid/theming-migration/#3-convert-any-css-custom-properties-you-are-using-to-the-new-names) above for a list.

---

## 19. React Grid: Legacy Themes | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/theming-v32/](https://www.ag-grid.com/react-data-grid/theming-v32/)

Transitional support for applications created before v33

This page describes the grid's legacy theming system that was the default in v32 and before, for the benefit of applications that have not yet migrated to the Theming API. These themes are deprecated and will be removed in a future major version. You may want to visit the [Theming API docs](/react-data-grid/theming/) or check out the [migration guide](/react-data-grid/theming-migration/).

##  v32 Theming Topics [Copy Link](#v32-theming-topics) 

- [Themes](/react-data-grid/theming-v32-themes/)
- [Customisation](/react-data-grid/theming-v32-customisation/)
[Variable Reference](/react-data-grid/theming-v32-customisation-variables/)
- [Colours & Fonts](/react-data-grid/theming-v32-customisation-colours/)
- [Compactness & Row Height](/react-data-grid/theming-v32-customisation-compactness/)
- [Selections](/react-data-grid/theming-v32-customisation-selections/)
- [Headers](/react-data-grid/theming-v32-customisation-headers/)
- [Borders](/react-data-grid/theming-v32-customisation-borders/)
- [Icons](/react-data-grid/theming-v32-custom-icons/)
- [Tool Panels](/react-data-grid/theming-v32-customisation-tool-panels/)
- [Inputs & Widgets](/react-data-grid/theming-v32-customisation-widgets/)
- [Menus & Popups](/react-data-grid/theming-v32-customisation-popups/)
- [Advanced CSS](/react-data-grid/theming-v32-customisation-css/)

- [Sass](/react-data-grid/theming-v32-customisation-sass/)

---

## 20. React Grid: AG Grid Design System | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/ag-grid-design-system/](https://www.ag-grid.com/react-data-grid/ag-grid-design-system/)

Our Figma design system allows designers to prototype & customise AG Grid applications with ease.

 ![AG Grid Figma Design System](/_astro/AG-Grid-Figma-Design-System.ClSUunit.png)   
 
 The [AG Grid design system](https://www.figma.com/community/file/1360600846643230092) replicates the [Quartz](/example?theme=quartz) and [Alpine](/example?theme=alpine) AG Grid themes within Figma. These default themes can be extended with Figma variables to match any existing visual design or create entirely new AG Grid themes.

The design system has been built from the ground up to be consistent with the javascript library, aiding in the designer - developer handoff process.

##  Getting Started [Copy Link](#getting-started) 

To start working with the AG Grid Figma design system, visit our [Figma community page](https://www.figma.com/community/file/1360600846643230092) and click "Open in Figma". The AG Grid design system will open directly in Figma and you're ready to start designing for AG Grid applications.

We supply the AG Grid design system as a [Figma community file](https://www.figma.com/community/file/1360600846643230092). You will use the file by duplicating it to your Figma workspace. Whilst we regularly update the AG Grid design system, your duplicated files will not receive any updates automatically.

For more information about how Figma community files function, please review the [Figma help pages on community files](https://help.figma.com/hc/en-us/articles/360038510873-Duplicate-Community-files).

 [ AG Grid Design System - Figma Community  ](https://www.figma.com/community/file/1360600846643230092/ag-grid-design-system) 
##  Video Introduction & Figma Documentation [Copy Link](#video-introduction--figma-documentation) 

You’ll find comprehensive documentation for the design system right within the Figma file. We have guides for getting started and premade grid templates. Further detailed information around how each grid component works is also within the Figma file.

 Watch our [short introduction video](https://youtu.be/Ymmm7wxLy7Y) to the design system on Youtube. You'll learn how to get started with the design system, where to find complete grid templates, and how to build your own grids from scratch. After you've absorbed the basics we also have a [playlist of in-depth videos](https://www.youtube.com/watch?v=Ymmm7wxLy7Y&list=PLsZlhayVgqNzE9G1yLLHQCRYSgDvx7Zo1&pp=gAQB) diving deeper into working with the AG Grid design system.

 [  ![Introducing the AG Grid Figma Design System thumbnail](https://img.youtube.com/vi/Ymmm7wxLy7Y/0.jpg)  
 ](https://www.youtube.com/watch?v=Ymmm7wxLy7Y) 
##  Customising the Design System [Copy Link](#customising-the-design-system) 

The AG Grid design system utilises [Figma's native variables feature](https://help.figma.com/hc/en-us/articles/15339657135383-Guide-to-variables-in-Figma) for all of its customisable attributes. The majority of the [Theme parameters](/react-data-grid/theming-parameters/) used by the Quartz and Alpine themes are referenced within Figma and can be extended to your own theme.

You can find more information about how to create and manage themes within the Figma file under the **Create your own theme** page in the Figma file.

 ![Figma Variable Theming](/_astro/FDS-themes.BgmsE4Qh.png)   
 
 ##  Generating AG Grid Themes From Figma Variables [Copy Link](#generating-ag-grid-themes-from-figma-variables) 

If you have created your own theme in Figma using the variables feature, you can export those variables and use the [Style Dictionary](https://styledictionary.com/) NPM package to create an [AG Grid theme](/react-data-grid/theming-parameters/#setting-theme-parameters). An example Style Dictionary project and full instructions are included in our [design systems GitHub repo](https://github.com/ag-grid/ag-grid-figma-design-system/).

To export your Figma Variables as JSON...

- In the Resources panel go to the Plugins tab.
- Search for the [Design Tokens](https://www.figma.com/community/plugin/888356646278934516/design-tokens) Figma plugin.
- In the [Design Tokens](https://www.figma.com/community/plugin/888356646278934516/design-tokens) plugin settings enable the options "**Add mode to design token name (if 2 or more modes)**" and "**Add mode to design token value**".
- Click run for the [Design Tokens](https://www.figma.com/community/plugin/888356646278934516/design-tokens) and select the 'Export Design Tokens File' option.
- Deselect all ‘include types...’ except for "Figma Variables"
- Click the 'Save & Export' button and save the json file.

 ![Export Figma Variables](/_astro/FDS-export-variables.BQ8x2jGC.png)   
 
 ##  Support [Copy Link](#support) 

AG Grid Enterprise customers can request support or suggest features and improvements via [Zendesk](https://ag-grid.zendesk.com/hc/en-us). Community users can file bug reports via our design system [GitHub repo issues](https://github.com/ag-grid/ag-grid-figma-design-system/issues).

 [ AG Grid Design System - Figma Community  ](https://www.figma.com/community/file/1360600846643230092/ag-grid-design-system)

---

## 21. React Grid: Grid Layout | AG Grid

**Source:** [https://www.ag-grid.com/react-data-grid/grid-size/](https://www.ag-grid.com/react-data-grid/grid-size/)

Under normal usage, your application should set the width and height of the grid using CSS styles. The grid will then fit the width you provide and use scrolling inside the grid to allow all rows and columns to be viewed.

```

<AgGridReact style={{ width: '100%', height: '100%' }} />

<AgGridReact style={{ width: 500, height: 200 }} />

```

If using % for your height, then make sure the container you are putting the grid into also has height specified, as the browser will fit the div according to a percentage of the parent's height, and if the parent has no height, then this % will always be zero.

If your grid is not the size you think it should be then put a border on the grid's div and see if that's the size you want (the grid will fill this div). If it is not the size you want, then you have a CSS layout issue in your application.

##  DOM Layout [Copy Link](#dom-layout) 

There are three DOM Layout values the grid can have 'normal', 'autoHeight' and 'print'. They are used as follows:

- **normal**: This is the default if nothing is specified. The grid fits the width and height of the div you provide and scrolls in both directions.
- **autoHeight**: The grid's height is set to fit the number of rows so no vertical scrollbar is provided by the grid. The grid scrolls horizontally as normal. Note that if using this with the SSRM the grid will attempt to load every row and may cause undesired side-effects (such as excessive datasource requests or too many loaded rows).
- **print**: No scroll bars are used and the grid renders all rows and columns. This layout is explained in [Printing](/react-data-grid/printing/).

##  Normal Layout [Copy Link](#normal-layout) 

If the width and / or height change after the grid is initialised, the grid will automatically resize to fill the new area.

The example below shows setting the grid size and then changing it as the user selects the buttons.

 
  
 ###  Dynamic Resizing without Horizontal Scroll [Copy Link](#dynamic-resizing-without-horizontal-scroll) 

Sometimes you want to have columns that don't fit in the current viewport to simply be hidden altogether with no horizontal scrollbar.

To achieve this determine the width of the grid and work out how many columns could fit in that space, hiding any that don't fit, constantly updating based on the `gridSizeChanged` event firing, like the next example shows.

This example is best seen when opened in a new tab - then change the horizontal size of the browser and watch as columns hide/show based on the current grid size.

 
  
 ###  Dynamic Vertical Resizing [Copy Link](#dynamic-vertical-resizing) 

Sometimes the vertical height of the grid is greater than the number of rows you have it in.  You can dynamically set the row heights to fill the available height as the following example shows:

 
  
 ##  Auto Height Layout [Copy Link](#auto-height-layout) 

Depending on your scenario, you may wish for the grid to auto-size it's height to the number of rows displayed inside the grid. This is useful if you have relatively few rows and don't want empty space between the last row and the bottom of the grid.

To allow the grid to auto-size its height to fit rows, set grid property `domLayout='autoHeight'`.

When `domLayout='autoHeight'` then your application **should not** set height on the grid div, as the div should be allowed flow naturally to fit the grid contents. When auto height is off then your application **should** set height on the grid div, as the grid will fill the div you provide it.

If using Grid Auto Height, then the grid will render all rows into the DOM. This is different to normal operation where the grid will only render rows that are visible inside the grid's scrollable viewport. For large grids (eg >1,000 rows) the draw time of the grid will be slow, or for very large grids, your application can freeze. This is not a problem with the grid, it is a limitation on browsers on how much data they can easily display on one web page. For this reason, if showing large amounts of data, it is not advisable to use Grid Auto Height. Instead use the grid as normal and the grid's row virtualisation will take care of this problem for you.

The example below demonstrates the autoHeight feature. Notice the following:

- As you set different numbers of rows into the grid, the grid will resize its height to just fit the rows.
- As the grid height exceeds the height of the browser, you will need to use the browser vertical scroll to view data (or the iFrames scroll if you are looking at the example embedded below).
- The height will also adjust as you filter, to add and remove rows.
- If you have pinned rows, the grid will size to accommodate the pinned rows.
- Vertical scrolling will not happen, however horizontal scrolling, including pinned columns, will work as normal.
- It is possible to move the grid into and out of 'full height' mode by using the `api.setGridOption('domLayout', layout)` or by changing the bound property `domLayout`.

The following test is best viewed if you open it in a new tab, so it is obvious that there are no scroll bars. Note that if you use the example inlined the scroll bars shown are for the containing `iframe`, not the grid.

 
  
 ###  Min Height with Auto Height [Copy Link](#min-height-with-auto-height) 

When using Auto Height, there is a minimum of 150px set to the grid rows section. This is to avoid an empty grid which would look weird. To remove this minimum height, add the following CSS:

```
.ag-center-cols-viewport {
    min-height: unset !important;
}

```

It is not possible to specify a max height when using auto-height.

Users ask is it possible to set a max height when using auto-height? The answer is no. If using auto-height, the grid is set up to work in a different way. It is not possible to switch. If you do need to switch, you will need to turn auto-height off.

##  Print Layout [Copy Link](#print-layout) 

For details on displaying the grid in a printer friendly layout see the [Print Layout](/react-data-grid/printing/) page.

---

