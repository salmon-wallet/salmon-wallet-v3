#!/bin/bash
set -euo pipefail

ROOT="/Users/lucamazzarello_/Desktop/Repositories/salmon-wallet-v3"

UI_SRC="$ROOT/packages/ui/src/components"
UI_EXT_SRC="$ROOT/packages/ui-extension/src/components"
MOBILE_DST="$ROOT/apps/mobile/src/components"
EXTENSION_DST="$ROOT/apps/extension/src/components"

echo "=== Step 1: Copy components ==="

# Copy ui components to mobile (skip index.ts barrel)
for item in "$UI_SRC"/*/; do
  name=$(basename "$item")
  echo "  [mobile] $name"
  cp -r "$item" "$MOBILE_DST/$name"
done

# Copy ui-extension components to extension (skip index.ts barrel, preserve existing files)
for item in "$UI_EXT_SRC"/*/; do
  name=$(basename "$item")
  echo "  [extension] $name"
  cp -r "$item" "$EXTENSION_DST/$name"
done

echo ""
echo "=== Step 2: Update imports in apps/mobile ==="

# Replace @salmon/ui imports with relative paths in mobile app files
find "$ROOT/apps/mobile/app" -name '*.tsx' -o -name '*.ts' | while read -r file; do
  if grep -q "from '@salmon/ui'" "$file" || grep -q "from '@salmon/ui/'" "$file"; then
    # Calculate relative path from file to src/components
    file_dir=$(dirname "$file")
    rel_path=$(python3 -c "import os.path; print(os.path.relpath('$MOBILE_DST', '$file_dir'))")

    # Replace the import
    sed -i '' "s|from '@salmon/ui'|from '$rel_path'|g" "$file"
    sed -i '' "s|from '@salmon/ui/|from '$rel_path/|g" "$file"
    echo "  [mobile] Updated: $(basename "$file")"
  fi
done

echo ""
echo "=== Step 3: Update imports in apps/extension ==="

# Replace @salmon/ui-extension imports with relative paths in extension app files
find "$ROOT/apps/extension/src" -name '*.tsx' -o -name '*.ts' | while read -r file; do
  if grep -q "from '@salmon/ui-extension'" "$file" || grep -q "from '@salmon/ui-extension/'" "$file"; then
    file_dir=$(dirname "$file")
    rel_path=$(python3 -c "import os.path; print(os.path.relpath('$EXTENSION_DST', '$file_dir'))")

    sed -i '' "s|from '@salmon/ui-extension'|from '$rel_path'|g" "$file"
    sed -i '' "s|from '@salmon/ui-extension/|from '$rel_path/|g" "$file"
    echo "  [extension] Updated: $(basename "$file")"
  fi
done

echo ""
echo "=== Step 4: Copy barrel files (index.ts) ==="
cp "$UI_SRC/index.ts" "$MOBILE_DST/index.ts"
cp "$UI_EXT_SRC/index.ts" "$EXTENSION_DST/index.ts"

echo ""
echo "=== Done ==="
echo "Components moved. Next steps:"
echo "  1. Remove @salmon/ui from apps/mobile/package.json"
echo "  2. Remove @salmon/ui-extension from apps/extension/package.json"
echo "  3. Add direct dependencies (e.g. expo-clipboard, qrcode.react) to each app's package.json"
echo "  4. Run pnpm install && pnpm turbo run typecheck to verify"
