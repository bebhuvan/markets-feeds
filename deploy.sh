#!/bin/bash

# RSS Feed Aggregator Deployment Script

set -e

echo "🚀 Starting RSS Feed Aggregator Deployment"
echo "=========================================="

# Check if required tools are installed
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is required but not installed."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo "❌ npm is required but not installed."
        exit 1
    fi
    
    if ! command -v wrangler &> /dev/null; then
        echo "❌ Wrangler CLI is required but not installed."
        echo "   Install with: npm install -g wrangler"
        exit 1
    fi
    
    echo "✅ All dependencies found"
}

# Setup project dependencies
setup_dependencies() {
    echo "📦 Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install worker dependencies
    cd worker
    npm install
    cd ..
    
    # Install frontend dependencies
    cd frontend
    npm install
    cd ..
    
    echo "✅ Dependencies installed"
}

# Create and initialize D1 database
setup_database() {
    echo "🗄️  Setting up D1 database..."
    
    cd worker
    
    # Check if database already exists
    if ! wrangler d1 list | grep -q "research-feeds"; then
        echo "Creating D1 database..."
        wrangler d1 create research-feeds
        echo "⚠️  Please update the database_id in worker/wrangler.toml with the ID shown above"
        echo "   Then run this script again to continue deployment"
        exit 0
    else
        echo "✅ Database already exists"
    fi
    
    # Initialize database schema
    echo "Initializing database schema..."
    wrangler d1 execute research-feeds --file=./src/database-schema.sql
    
    cd ..
    echo "✅ Database setup complete"
}

# Deploy worker
deploy_worker() {
    echo "🔧 Deploying Cloudflare Worker..."
    
    cd worker
    npm run deploy
    
    # Get worker URL
    WORKER_URL=$(wrangler whoami 2>/dev/null | grep -o "https://.*workers.dev" | head -1)
    if [ -z "$WORKER_URL" ]; then
        echo "⚠️  Could not automatically detect worker URL"
        echo "   Please manually set WORKER_URL in frontend/.env"
    else
        echo "✅ Worker deployed at: $WORKER_URL"
        
        # Update frontend environment
        cd ../frontend
        echo "WORKER_URL=$WORKER_URL" > .env
        echo "PUBLIC_SITE_URL=https://your-site.pages.dev" >> .env
        cd ..
    fi
    
    cd ..
}

# Deploy frontend
deploy_frontend() {
    echo "🎨 Deploying Astro frontend..."
    
    cd frontend
    
    # Build the frontend
    npm run build
    
    # Deploy to Cloudflare Pages
    if command -v wrangler &> /dev/null; then
        echo "Deploying to Cloudflare Pages..."
        wrangler pages deploy dist --project-name=research-feed-frontend
    else
        echo "⚠️  Manual deployment required:"
        echo "   1. Run: wrangler pages deploy dist"
        echo "   2. Or upload the 'dist' folder to your hosting provider"
    fi
    
    cd ..
    echo "✅ Frontend deployment complete"
}

# Test deployment
test_deployment() {
    echo "🧪 Testing deployment..."
    
    if [ ! -z "$WORKER_URL" ]; then
        echo "Testing worker endpoints..."
        
        # Test sources endpoint
        if curl -s "$WORKER_URL/api/sources" > /dev/null; then
            echo "✅ Sources endpoint working"
        else
            echo "❌ Sources endpoint failed"
        fi
        
        # Trigger initial feed fetch
        echo "Triggering initial feed fetch..."
        curl -s -X POST "$WORKER_URL/fetch-feeds" > /dev/null
        echo "✅ Feed fetch triggered"
        
    else
        echo "⚠️  Skipping tests - worker URL not available"
    fi
}

# Main deployment flow
main() {
    echo "Select deployment option:"
    echo "1) Full deployment (recommended for first time)"
    echo "2) Worker only"
    echo "3) Frontend only"
    echo "4) Database setup only"
    echo "5) Test existing deployment"
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            check_dependencies
            setup_dependencies
            setup_database
            deploy_worker
            deploy_frontend
            test_deployment
            ;;
        2)
            check_dependencies
            deploy_worker
            ;;
        3)
            check_dependencies
            deploy_frontend
            ;;
        4)
            check_dependencies
            setup_database
            ;;
        5)
            test_deployment
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    echo "🎉 Deployment complete!"
    echo "========================"
    echo ""
    echo "Next steps:"
    echo "1. Check your Cloudflare dashboard for worker and pages status"
    echo "2. Visit your frontend URL to test the interface"
    echo "3. Monitor worker logs: wrangler tail research-feed-worker"
    echo "4. The system will automatically fetch feeds every 30 minutes"
    echo ""
    echo "Useful commands:"
    echo "- Check database: wrangler d1 execute research-feeds --command 'SELECT COUNT(*) FROM articles'"
    echo "- Manual feed fetch: curl -X POST https://your-worker.workers.dev/fetch-feeds"
    echo "- View logs: wrangler tail research-feed-worker"
}

# Run main function
main "$@"