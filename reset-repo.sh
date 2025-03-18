#!/bin/bash

# Function to check if directory is ignored by git
is_gitignored() {
  git check-ignore -q "$1"
}

# Safely delete node_modules directories
echo "Deleting node_modules folders..."
find . -name "node_modules" -type d -prune | while read dir; do
  if is_gitignored "$dir"; then
    rm -rf "$dir"
    echo "Deleted: $dir"
  else
    echo "Skipped (not ignored): $dir"
  fi
done

# Safely delete build output directories
echo "Deleting build output folders (dist, build, .next, out, generated)..."
find . \( -name "dist" -o -name "build" -o -name ".next" -o -name "out" -o -name "generated" \) -type d -prune | while read dir; do
  if is_gitignored "$dir"; then
    rm -rf "$dir"
    echo "Deleted: $dir"
  else
    echo "Skipped (not ignored): $dir"
  fi
done

# Clear Turbo cache
echo "Clearing Turbo cache..."
pnpx turbo cache clean --force

# Optionally delete lockfiles (uncomment if needed)
# echo "Deleting lockfiles..."
# find . \( -name "package-lock.json" -o -name "yarn.lock" -o -name "pnpm-lock.yaml" \) -type f -exec rm -f '{}' +

# Reinstall dependencies
echo "Reinstalling dependencies with pnpm..."
pnpm install

# Rebuild your projects
echo "Building projects..."
pnpm turbo build

echo "✅ Reset complete."
