#!/bin/bash

echo "Building Healthy Breaks Extension for Production..."

# Clean previous build
rm -rf dist/
mkdir -p dist/src/icons
mkdir -p dist/src/fonts

# Copy essential files
echo "Copying essential files..."
cp manifest.json dist/
cp README.md dist/ 2>/dev/null || true
cp -r src/icons/* dist/src/icons/
cp -r src/fonts/* dist/src/fonts/
cp src/popup.html dist/src/
cp src/popup.js dist/src/
cp src/background.js dist/src/
cp src/tailwind.min.css dist/src/
cp src/input.css dist/src/ 2>/dev/null || true

# Calculate sizes
echo ""
echo "Build complete!"
echo "==============="
echo ""
echo "Distribution size:"
du -sh dist/
echo ""
echo "File breakdown:"
find dist/ -type f -exec du -h {} \; | sort -h
echo ""
echo "Files ready in: ./dist/"
echo ""
echo "To package for Chrome Web Store:"
echo "  cd dist && zip -r ../healthy-breaks.zip ."
