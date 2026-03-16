# Mobile Design Note

## Why this exists

A full standalone mobile design spec is not necessary for the current scope.
This product still shares the same core workflow on desktop and mobile:

1. Upload an image
2. Choose a tool
3. Choose an effect
4. Apply it directly on the canvas
5. Undo if needed
6. Download the result

What mobile needs is not a different product plan, but a focused adaptation note.

## When a separate mobile spec is needed

Create a separate mobile design document later only if one or more of these become true:

- mobile gets touch-only gestures that do not exist on desktop
- mobile uses a different navigation model such as bottom sheets or tab bars
- mobile adds camera capture or share-sheet export flows
- mobile performance constraints force a different rendering strategy
- mobile editing becomes a primary entry point instead of a secondary responsive target

## Current mobile adaptation principles

### 1. Keep the same mental model

- Tool, effect, and adjustment concepts stay the same
- Undo remains action-based, not time-based
- Canvas remains the main work surface

### 2. Reorder, do not reinvent

- On smaller screens, the canvas comes before the control panels
- Panels stack vertically after the work area
- Actions wrap into larger, easier-to-tap buttons

### 3. Favor touch clarity

- buttons must be visually obvious and comfortably tappable
- sliders need enough vertical spacing to avoid accidental touches
- hover-only cues cannot be required to understand the UI

### 4. Protect the canvas area

- the image should stay dominant even on small screens
- controls must compress before the canvas becomes unusable
- the canvas should scale responsively without changing export resolution

## Implemented responsive direction

- Desktop: control sidebar + canvas workspace
- Tablet: canvas first, controls below in a two-column stack
- Mobile: single-column layout with stacked action buttons and control panels

## Follow-up checks

- verify thumb reach on small phones
- confirm range inputs are easy to drag
- confirm rectangle drawing remains usable on touch
- confirm download remains visible without excessive scrolling
