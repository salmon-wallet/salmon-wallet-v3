## Overview

Apply BlurContainer to TransactionDetailModal detail cards on web, and fix the hash monospace font on mobile.

## Requirements

### Web (packages/ui)

1. The Date & Time / Confirmation / Block card must use `BlurContainer` with default gradient border and `borderRadius.md`
2. Each `TokenAmountRow` must be wrapped in `BlurContainer` with default gradient border and `borderRadius.md`
3. The Fee / Hash card must use `BlurContainer` with default gradient border and `borderRadius.md`
4. The `HashValue` styled component must use `fontFamily.mono` (already correct on web)
5. Remove `CardContainer` and `TokenRow` styled components (replaced by `BlurContainer`)

### Mobile (apps/mobile)

6. The `hashValue` style must use `fontFamilyNative.mono` instead of `fontFamilyNative.medium`
