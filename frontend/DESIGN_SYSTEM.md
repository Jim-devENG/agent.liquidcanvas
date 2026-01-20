# Liquid Canvas Design System

## Brand Colors - Liquid Canvas (liquidcanvas.art)

### Primary Brand Color
- **Olive Green (Primary)**: `#5f7047` (`olive-600`) - Main brand color for primary actions and accents
- **Olive Shades**: Use `olive-50` through `olive-900` for various UI elements
- **Olive-600**: Primary buttons, active states, logo backgrounds
- **Olive-700**: Hover states, darker accents
- **Olive-100/50**: Light backgrounds, hover states

### Usage
- Always use `olive-*` classes for brand consistency
- Primary buttons: `bg-olive-600 hover:bg-olive-700`
- Active states: `bg-olive-600 text-white`
- Hover states: `hover:bg-olive-50 hover:text-olive-700`
- Focus rings: `focus:ring-olive-500 focus:border-olive-500`

### Neutral Colors
- **Gray Scale**: Standard Tailwind gray scale (50-900)
- **White**: `#ffffff` with opacity variations for glassmorphism

## Typography

### Font Family
- **Primary**: Inter (Google Fonts)
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Headings
- **H1**: `text-2xl font-bold liquid-gradient-text`
- **H2**: `text-lg font-bold liquid-gradient-text`
- **H3**: `text-base font-semibold text-gray-900`
- **Body**: `text-sm text-gray-700`
- **Small**: `text-xs text-gray-500`

## Components

### Buttons

#### Primary Button
```tsx
className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 hover:shadow-lg transition-all"
```

#### Secondary Button
```tsx
className="px-4 py-2 bg-white border border-olive-200 text-olive-700 rounded-lg hover:bg-olive-50 transition-all"
```

#### Accent Button (Purple)
```tsx
className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-md"
```

### Cards

#### Glass Card
```tsx
className="glass rounded-xl shadow-lg border border-white/20 p-4"
```

#### Gradient Card
```tsx
className="rounded-xl shadow-lg bg-gradient-to-br from-olive-50 to-white border border-olive-100 p-4"
```

### Sidebar

- **Background**: Glass effect with subtle gradient
- **Active Item**: Olive background (`bg-olive-600`)
- **Hover**: Light olive background (`hover:bg-olive-50`)
- **Logo**: Olive background (`bg-olive-600`) with LC initials

## Spacing

- **Container Padding**: `p-4` (16px)
- **Card Padding**: `p-3` to `p-6`
- **Button Padding**: `px-3 py-1.5` (small), `px-4 py-2` (medium)
- **Gap**: `gap-2` (8px) for small, `gap-4` (16px) for medium

## Shadows

- **Small**: `shadow-sm`
- **Medium**: `shadow-md`
- **Large**: `shadow-lg`
- **Glow**: `hover-glow` (custom class with indigo glow)

## Animations

- **Fade In**: `animate-fade-in` (0.5s ease-in-out)
- **Slide Up**: `animate-slide-up` (0.5s ease-out)
- **Scale In**: `animate-scale-in` (0.3s ease-out)
- **Hover Glow**: `hover-glow` (box-shadow transition)

## Best Practices

1. **Use Olive Green** (`olive-600` for primary, `olive-700` for hover) for all brand elements
2. **Glassmorphism** for cards and overlays
3. **Consistent spacing** using Tailwind's spacing scale
4. **Smooth transitions** on all interactive elements
5. **Brand colors** - Always use `olive-*` classes for brand consistency
6. **Olive-600** for primary buttons and active states
7. **Olive-50/100** for light backgrounds and hover states
8. Keep design clean and modern with olive as the primary accent color

