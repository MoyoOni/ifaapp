# Ìlú Àṣẹ Theme System - Orisha-Based Color Guide

## Overview

The Ìlú Àṣẹ application implements a culturally significant theme system based on traditional Yoruba Orisha colors. This system creates a consistent, meaningful visual experience that connects users with the cultural heritage represented in the application.

## Core Orisha Themes

### Osun Theme (`osun`)
- **Primary Color**: Osun Gold (#DAA520 equivalent: `hsl(38 92% 50%)`)
- **Symbolism**: River goddess, abundance, fertility, prosperity
- **Usage**: Primary actions, important highlights, prosperity features
- **Characteristics**: Warm golden yellow tones

### Ogun Theme (`ogun`)
- **Primary Color**: Ogun Iron (`hsl(350 90% 45%)`) - Deep red
- **Secondary Color**: Ogun Rust (`hsl(15 70% 45%)`) - Rust brown
- **Symbolism**: War god, strength, iron, justice
- **Usage**: Secondary actions, strength indicators, protective features
- **Characteristics**: Strong, powerful reds and earth tones

### Shango Theme (`shango`)
- **Primary Color**: Shango Thunder (`hsl(0 85% 55%)`) - Bright red
- **Accent Color**: Shango White (`hsl(0 0% 100%)`) - Pure white
- **Symbolism**: God of thunder and lightning, power, energy
- **Usage**: High energy elements, attention-grabbing features
- **Characteristics**: Bold, energetic reds with clean contrasts

### Yemoja Theme (`yemoja`)
- **Primary Color**: Yemoja Ocean (`hsl(200 60% 35%)`) - Deep blue-green
- **Secondary Color**: Yemoja Wave (`hsl(190 50% 65%)`) - Light blue-green
- **Symbolism**: Goddess of oceans, motherhood, healing
- **Usage**: Calming features, water-themed elements, healing content
- **Characteristics**: Cool blues and greens representing water

### Oshun Theme (`oshun`)
- **Primary Color**: Oshun Forest (`hsl(142 86% 28%)`) - Emerald green
- **Symbolism**: River goddess, love, beauty, diplomacy
- **Usage**: Growth elements, nature features, fertility content
- **Characteristics**: Rich, fertile greens

## Implementation Guidelines

### Semantic Color Tokens

The system maps Orisha colors to semantic tokens:

- `--primary`: Uses Osun Gold for primary actions
- `--secondary`: Uses Ogun Iron for secondary actions
- `--accent`: Uses Ogun Rust for accent elements
- `--highlight`: Uses Shango Thunder for highlights
- `--success`: Uses Oshun Forest for positive feedback
- `--warning`: Uses Ogun Rust for warnings
- `--error`: Uses Shango Thunder for errors
- `--background`, `--foreground`: Sacred Ivory and Deep Sacred for base colors

### Theme Switching

Users can switch between themes using the theme selector in the header:

1. Default theme maintains standard colors
2. Orisha-specific themes adjust accent colors accordingly
3. System automatically respects OS-level light/dark preferences

### Accessibility Considerations

- All color combinations meet WCAG AA contrast ratios
- Dark mode versions maintain cultural color significance while ensuring readability
- Text colors automatically adjust for optimal legibility
- Interactive elements maintain visibility regardless of theme

## Using the Theme System

### In Components

```tsx
// Use semantic tokens rather than hardcoded colors
<div className="bg-primary text-primary-foreground">Primary background</div>
<button className="bg-secondary hover:bg-secondary/90">Secondary button</button>
<span className="text-destructive">Error text</span>
```

### Adding Orisha-Themed Sections

Components can incorporate specific Orisha themes:

```tsx
// For Osun-themed sections
<div className="bg-osun-primary/10 border-l-4 border-osun-primary">
  Osun-themed content
</div>

// For Yemoja-themed sections
<div className="bg-yemoja-secondary/20">
  Water-themed content
</div>
```

## Cultural Sensitivity

This theme system honors Yoruba traditions while providing a modern, functional interface. The colors selected are respectful interpretations that connect the digital space with the cultural heritage of Ifá and Yoruba traditions.

## Maintenance

- Update the [src/lib/tailwind/orisha-colors.ts](file://c:\Users\Test\ifa_app\frontend\src\lib\tailwind\orisha-colors.ts) file to modify color definitions
- The CSS variables are automatically generated from these definitions
- All components use semantic tokens, so changing the base definitions updates the entire application