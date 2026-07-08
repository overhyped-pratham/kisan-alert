---
name: Kisan Alert
colors:
  surface: '#fbf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fbf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#f0eded'
  surface-container-high: '#eae8e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#40493d'
  inverse-surface: '#303030'
  inverse-on-surface: '#f2f0f0'
  outline: '#707a6c'
  outline-variant: '#bfcaba'
  surface-tint: '#1b6d24'
  primary: '#0d631b'
  on-primary: '#ffffff'
  primary-container: '#2e7d32'
  on-primary-container: '#cbffc2'
  inverse-primary: '#88d982'
  secondary: '#7a5649'
  on-secondary: '#ffffff'
  secondary-container: '#fdcdbc'
  on-secondary-container: '#795548'
  tertiary: '#005a8c'
  on-tertiary: '#ffffff'
  tertiary-container: '#0073b2'
  on-tertiary-container: '#e9f2ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a3f69c'
  primary-fixed-dim: '#88d982'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005312'
  secondary-fixed: '#ffdbcf'
  secondary-fixed-dim: '#ebbcac'
  on-secondary-fixed: '#2e150b'
  on-secondary-fixed-variant: '#603f33'
  tertiary-fixed: '#cee5ff'
  tertiary-fixed-dim: '#96ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004a75'
  background: '#fbf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Outfit
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  button-text:
    fontFamily: Outfit
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 20px
  stack-gap: 16px
  touch-target-min: 48px
  gutter: 16px
---

## Brand & Style

The design system is centered on **radical simplicity** and **functional warmth**. It targets Indian farmers (ages 30–70) who may have varying degrees of digital literacy. The brand personality is that of a "Trusted Digital Companion"—someone who is reliable, calm, and speaks plainly. 

The visual style leverages **Soft Minimalism** with a **Tactile** edge. By using large touch targets, high-contrast elements, and a "One Screen, One Task" philosophy, the UI reduces cognitive load. The aesthetic avoids looking like a complex "tech tool," instead opting for a friendly, approachable environment that feels as natural as the land it serves. 

**Key Principles:**
- **Clarity Over Density:** Maximum whitespace to prevent overwhelming the user.
- **Physicality:** Using soft shadows and rounded corners to make digital buttons feel like physical, pressable objects.
- **Visual Cues:** Heavy reliance on iconography and color-coding to convey meaning without requiring heavy reading.

## Colors

The palette is derived from the natural landscape of a thriving farm. 

- **Primary (Natural Green):** Used for "Success" states and the most important progress actions (e.g., "Confirm," "Paid," "Healthy").
- **Secondary (Earth Brown):** Used for grounding elements, structural navigation, and secondary labels.
- **Accent (Sky Blue):** Dedicated specifically to weather-related alerts, irrigation data, and water management.
- **Semantic Colors:** Warning (Orange) and Danger (Indian Red) are used sparingly but with high saturation to ensure visibility even under direct sunlight in the field.
- **Background & Surface:** An off-white background (#FAFAFA) reduces glare compared to pure white, making the app more comfortable to use outdoors.

## Typography

The typography uses **Outfit** for its geometric clarity and friendly, rounded terminals which aid legibility for older users. 

**Accessibility Rules:**
- **Minimum Size:** No text should ever fall below 16px.
- **Indic Script Support:** When rendering Hindi or Marathi, line-height must be increased by 20% to accommodate tall vowel markers and prevent "clashing" between lines.
- **Contrast:** Text must maintain a minimum 4.5:1 ratio against backgrounds. Use `neutral_color_hex` (#424242) for body text rather than pure black to reduce eye strain.

## Layout & Spacing

This design system is optimized for a **360px width mobile viewport**. The layout uses a **Fluid Stack** model rather than a traditional complex grid.

- **The Power of One:** Focus on one card or one action per row. Avoid multi-column layouts that require horizontal eye scanning.
- **Bottom-Heavy:** All critical interactive elements (buttons, navigation) are placed within the "Natural Thumb Zone" at the bottom 40% of the screen.
- **Safe Areas:** A generous 20px margin is maintained on the left and right of the screen to prevent accidental touches near the bezel.
- **Vertical Rhythm:** Use 8px increments. Cards are separated by 16px to clearly distinguish between different pieces of information.

## Elevation & Depth

Hierarchy is established using **Tonal Layering** combined with **Ambient Shadows**.

- **Level 0 (Background):** #FAFAFA. This is the canvas.
- **Level 1 (Cards):** #FFFFFF with a soft, diffused shadow (Y: 4px, Blur: 12px, Opacity: 6% Black). This identifies interactive or informative containers.
- **Level 2 (Active States/Floating Buttons):** Increased shadow depth (Y: 8px, Blur: 16px, Opacity: 10% Primary Green) to signify importance and "press-ability."
- **Focus:** No "ghost" buttons. All buttons must have a solid fill or a thick 2px border to ensure they are perceived as functional units.

## Shapes

The design system uses a consistent **16px (1rem)** radius for all primary containers and buttons. 

- **Cards:** 16px corner radius to feel approachable and safe.
- **Input Fields:** 12px corner radius.
- **Top Bar/Header:** The bottom corners of the header are rounded by 16px to "hug" the content below.
- **Icons:** Icons should always be enclosed in a circular or "squircle" container when used as navigation to provide a larger hit area.

## Components

### Buttons
- **Primary:** Full-width, 56px height, Green background with White text. Bold weight.
- **Voice Button:** A dedicated floating circular button (min 64px) with a microphone icon, styled in Primary Green to encourage voice-first interaction.

### Cards
- **Info Cards:** White surface, 16px radius, subtle shadow.
- **Alert Cards:** Use a 4px left-border "accent strip" in the color of the alert (e.g., Orange for weather warnings).

### Selection Controls
- **Checkboxes/Radios:** Oversized (min 32px diameter). Use the Primary Green for the active state.
- **Lists:** Every list item must have a minimum height of 64px to accommodate large thumbs and prevent mis-taps.

### Input Fields
- **Style:** Filled style (light grey background) with a heavy bottom border (2px) in Earth Brown. Labels are always visible above the field; never use placeholder text as the only label.

### Bottom Navigation
- **Structure:** 4 items maximum. Large icons (28px) with 16px labels. Use active indicator "pill" backgrounds to show the current selection.