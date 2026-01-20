# Liquid Canvas Design System

## Brand Colors

### Primary Colors
- **Indigo (Primary)**: `#6366f1` - Main brand color for primary actions and accents
- **Purple (Secondary)**: `#9333ea` / `#8b5cf6` - Secondary actions and highlights
- **Pink (Accent)**: `#ec4899` - Accent color for special elements

### Gradient
- **Liquid Gradient**: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)`
- Used for: Logo backgrounds, active states, premium features

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
className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
```

#### Secondary Button
```tsx
className="px-4 py-2 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-all"
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
className="rounded-xl shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-4"
```

### Sidebar

- **Background**: Glass effect with subtle gradient
- **Active Item**: Gradient background (indigo to purple)
- **Hover**: Light gradient background
- **Logo**: Gradient background with LC initials

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

1. **Use gradients** for primary actions and active states
2. **Glassmorphism** for cards and overlays
3. **Consistent spacing** using Tailwind's spacing scale
4. **Smooth transitions** on all interactive elements
5. **Brand colors** for all primary actions (indigo/purple gradient)
6. **Purple** for special features (like Migrate Categories)
7. **Pink** sparingly for accents and highlights

