## Context

The transaction detail modal has styling inconsistencies between web and mobile. Mobile already uses `BlurContainer` for section cards and the standard font for hashes. Web uses a custom `CardContainer` and monospace font. Both platforms use `colors.accent.primary` (red) for the explorer button.

## Goals / Non-Goals

**Goals:**
- Replace web's `CardContainer` with `BlurContainer` for section cards
- Use project font (`fontFamily.sans`) for transaction hash on web
- Change explorer button color to amber on both platforms

**Non-Goals:**
- Changing the overall dialog/modal structure
- Modifying address font (keep current behavior)
- Changing mobile section cards (already uses BlurContainer)

## Decisions

- **BlurContainer replacement**: Remove `CardContainer` styled component, import and use `BlurContainer` with matching `borderRadius` and `padding` props.
- **Hash font**: Change `fontFamily.mono` to `fontFamily.sans` in `HashValue` styled component.
- **Amber color**: Replace all `colors.accent.primary` references in both ExplorerLinkButton files with `colors.palette.amber`.

## Risks / Trade-offs

- Minimal risk — all changes are visual/styling only.
- BlurContainer already used extensively in the codebase, so adding it to the detail modal maintains consistency.
