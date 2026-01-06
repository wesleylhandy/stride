# Font Setup Guide

## Fonts Used

### Primary Font: **Inter**
- **License**: SIL Open Font License (Free & Open Source)
- **Source**: Google Fonts
- **Usage**: Primary interface font for UI elements, buttons, navigation, body text
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold), 800 (Extrabold)
- **Status**: ✅ Loaded via `next/font/google`

### Monospace Font: **JetBrains Mono**
- **License**: SIL Open Font License (Free & Open Source)
- **Source**: Google Fonts
- **Usage**: Code snippets, IDs, technical identifiers, commit hashes
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold)
- **Status**: ✅ Loaded via `next/font/google`

### Fallback Monospace: **Fira Code**
- **License**: SIL Open Font License (Free & Open Source)
- **Source**: Available via CDN or local files (not on Google Fonts)
- **Usage**: Fallback if JetBrains Mono fails to load
- **Note**: Currently in font stack but not actively loaded (fallback only)

---

## Font Loading Implementation

### Next.js Font Optimization

Both fonts are loaded using Next.js's built-in font optimization (`next/font/google`), which:
- Automatically optimizes font loading
- Self-hosts fonts (no external requests)
- Eliminates layout shift
- Improves performance

### Implementation Locations

**Main Web App** (`apps/web/app/layout.tsx`):
```typescript
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});
```

**Site App** (`apps/site/app/layout.tsx`):
```typescript
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});
```

### CSS Variables

Fonts are exposed as CSS variables:
- `--font-inter`: Primary sans-serif font
- `--font-jetbrains-mono`: Monospace font

These are used in Tailwind config via `var(--font-inter)` and `var(--font-jetbrains-mono)`.

---

## Free Alternatives

All recommended fonts are **100% free and open-source**. Here are alternatives if needed:

### Inter Alternatives (Sans-Serif)

| Font | License | Notes |
|------|---------|-------|
| **Inter** (Current) | SIL OFL | Optimized for screens, excellent legibility |
| **Roboto** | Apache 2.0 | Google's default, widely used |
| **Open Sans** | Apache 2.0 | Very readable, good for UI |
| **Source Sans Pro** | SIL OFL | Adobe's open-source font |
| **Work Sans** | SIL OFL | Modern, geometric |
| **Poppins** | SIL OFL | Geometric, friendly |

### JetBrains Mono Alternatives (Monospace)

| Font | License | Notes |
|------|---------|-------|
| **JetBrains Mono** (Current) | SIL OFL | Designed specifically for developers |
| **Fira Code** | SIL OFL | Ligatures support, very popular |
| **Source Code Pro** | SIL OFL | Adobe's monospace font |
| **Inconsolata** | SIL OFL | Clean, readable monospace |
| **Cascadia Code** | SIL OFL | Microsoft's monospace with ligatures |
| **IBM Plex Mono** | SIL OFL | Professional, corporate-friendly |

### Fira Code (Fallback)

**Fira Code** is in the font stack as a fallback but is **not actively loaded** because:
- It's not available on Google Fonts
- Would require manual installation or CDN
- JetBrains Mono is sufficient as primary

**To use Fira Code as primary**, you would need to:
1. Download from [GitHub](https://github.com/tonsky/FiraCode)
2. Add to `public/fonts/` directory
3. Use `next/font/local` instead

---

## Font Weights Available

### Inter
- 100: Thin
- 200: Extra Light
- 300: Light
- 400: Regular ✅
- 500: Medium ✅
- 600: Semibold ✅
- 700: Bold ✅
- 800: Extrabold ✅
- 900: Black

### JetBrains Mono
- 100: Thin
- 200: Extra Light
- 300: Light
- 400: Regular ✅
- 500: Medium ✅
- 600: Semibold ✅
- 700: Bold
- 800: Extrabold

---

## Usage in Components

### Sans-Serif (Inter)
```tsx
// Default (uses Inter)
<p className="font-sans">Body text</p>

// Explicit
<h1 className="font-display font-bold">Heading</h1>
```

### Monospace (JetBrains Mono)
```tsx
// Code blocks
<code className="font-mono">const example = 'code';</code>

// Technical IDs
<span className="font-mono text-sm">abc123def</span>
```

---

## Performance Considerations

### Font Loading Strategy

1. **`display: "swap"`**: Ensures text is visible immediately with fallback font, then swaps when custom font loads
2. **Subset Loading**: Only Latin subset loaded (add more if needed: `subsets: ["latin", "latin-ext"]`)
3. **Self-Hosting**: Next.js automatically self-hosts fonts (no external CDN requests)

### Optimization Tips

- ✅ Fonts are optimized by Next.js automatically
- ✅ Only load weights you actually use
- ✅ Consider variable fonts for smaller bundle size (Inter Variable is available)
- ✅ Use `font-display: swap` (already configured)

---

## Adding More Font Weights

If you need additional weights, update the font configuration:

```typescript
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"], // Specify weights
});
```

---

## Troubleshooting

### Fonts Not Loading

1. **Check CSS Variables**: Ensure `--font-inter` and `--font-jetbrains-mono` are set
2. **Verify Import**: Check that fonts are imported in layout files
3. **Build Check**: Run `npm run build` to see if fonts are bundled
4. **Network Tab**: Check if font files are being requested

### Fallback Fonts

If custom fonts fail to load, the font stack includes system fonts:
- **Sans**: `-apple-system`, `BlinkMacSystemFont`, `"Segoe UI"`, `Roboto`
- **Mono**: `"SF Mono"`, `Monaco`, `Consolas`, `"Courier New"`

---

## License Compliance

All fonts used are **free and open-source**:

- ✅ **Inter**: SIL Open Font License - Commercial use allowed
- ✅ **JetBrains Mono**: SIL Open Font License - Commercial use allowed
- ✅ **Fira Code** (fallback): SIL Open Font License - Commercial use allowed

**No attribution required** for any of these fonts, but it's appreciated!

---

## Summary

✅ **Inter** - Free, loaded via Google Fonts  
✅ **JetBrains Mono** - Free, loaded via Google Fonts  
✅ **Fira Code** - Free, available as fallback (not actively loaded)  
✅ **All fonts are open-source** - No licensing concerns  
✅ **Optimized loading** - Using Next.js font optimization  

**No paid fonts required** - Everything is free and open-source!

