#!/bin/bash

# Markets Feeds - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Markets Feeds..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.11+ first."
    exit 1
fi

echo "✅ Node.js and Python found"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd scripts
pip install -r requirements.txt
cd ..

# Create .env from example if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Cloudflare credentials"
fi

# Test RSS aggregation
echo "🔄 Testing RSS aggregation..."
python scripts/aggregate_feeds.py

# Build the site
echo "🏗️  Building Astro site..."
npm run build

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Cloudflare credentials"
echo "2. Push to GitHub to trigger automated deployment"
echo "3. Start development with: npm run dev"
echo ""
echo "🌐 Your site will be available at: http://localhost:4321"