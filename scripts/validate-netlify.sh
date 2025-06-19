#!/bin/bash

echo "🚀 API Key Wallet - Netlify Deployment Validator"
echo "=============================================="
echo

# Check required files
echo "1. Checking deployment files..."

if [ -f "netlify.toml" ]; then
    echo "✅ netlify.toml found"
else
    echo "❌ netlify.toml missing"
    exit 1
fi

if [ -f "netlify/functions/api.ts" ]; then
    echo "✅ Netlify function found"
else
    echo "❌ Netlify function missing"
    exit 1
fi

if [ -f "package.json" ]; then
    if grep -q "build:netlify" package.json; then
        echo "✅ Netlify build script found"
    else
        echo "❌ Netlify build script missing"
        exit 1
    fi
else
    echo "❌ package.json missing"
    exit 1
fi

echo

# Test build process
echo "2. Testing build process..."
npm run build:netlify > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

echo

# Check dist folder
echo "3. Checking build output..."
if [ -d "dist" ]; then
    echo "✅ Dist folder created"
    
    if [ -f "dist/app.js" ]; then
        echo "✅ Main app compiled"
    else
        echo "❌ Main app missing"
        exit 1
    fi
    
    if [ -d "dist/routes" ]; then
        echo "✅ Routes compiled"
    else
        echo "❌ Routes missing"
        exit 1
    fi
    
    if [ -d "dist/services" ]; then
        echo "✅ Services compiled"
    else
        echo "❌ Services missing"
        exit 1
    fi
else
    echo "❌ Dist folder missing"
    exit 1
fi

echo

# Check dependencies
echo "4. Checking dependencies..."
if grep -q "serverless-http" package.json; then
    echo "✅ serverless-http dependency found"
else
    echo "❌ serverless-http dependency missing"
    exit 1
fi

echo

echo "🎉 Netlify Deployment Ready!"
echo "Next steps:"
echo "1. Push to GitHub"
echo "2. Connect repository to Netlify"
echo "3. Configure environment variables"
echo "4. Deploy!"
echo
echo "📖 See NETLIFY_DEPLOY.md for detailed instructions"
