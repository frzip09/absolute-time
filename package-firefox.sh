#!/bin/bash

# Package Firefox Extension
# This script creates a zip file suitable for Firefox add-on submission

echo "📦 Packaging Absolute Time extension for Firefox..."

# Create a temporary directory for packaging
TEMP_DIR="firefox-package-$(date +%s)"
mkdir "$TEMP_DIR"

# Copy necessary files
echo "📋 Copying extension files..."
cp manifest.json "$TEMP_DIR/"
cp -r scripts "$TEMP_DIR/"
cp -r pages "$TEMP_DIR/"
cp -r icons "$TEMP_DIR/"
cp LICENSE "$TEMP_DIR/"

# Create zip file
ZIP_NAME="absolute-time-firefox-$(date +%Y%m%d).zip"
echo "🗜️  Creating zip file: $ZIP_NAME"
cd "$TEMP_DIR"
zip -r "../$ZIP_NAME" .
cd ..

# Clean up
rm -rf "$TEMP_DIR"

echo "✅ Firefox package created: $ZIP_NAME"
echo "📝 This zip file can be submitted to Mozilla Add-ons for review"
echo "🔗 Submit at: https://addons.mozilla.org/developers/" 