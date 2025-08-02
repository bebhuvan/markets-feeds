#!/bin/bash

# Build script for Cloudflare Pages
echo "🚀 Starting build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Fetch latest feeds before building
echo "📰 Fetching latest RSS feeds..."
npm run fetch-feeds || echo "⚠️ Feed fetch failed, continuing with existing data"

# Build the site
echo "🔨 Building Astro site..."
npm run build

echo "✅ Build complete!"