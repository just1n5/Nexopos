#!/bin/bash
# Script to check if the backend compiles without errors

echo "Checking NexoPOS Backend Compilation..."
echo "========================================"
echo ""

cd backend

echo "1. Installing dependencies (if needed)..."
if [ ! -d "node_modules" ]; then
    npm install
fi

echo ""
echo "2. Running TypeScript compilation check..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS: Backend compiles without errors!"
    echo ""
    echo "3. Running the test script..."
    node test-inventory-calc.js
else
    echo ""
    echo "❌ ERROR: TypeScript compilation failed"
    echo "Please check the error messages above"
fi

echo ""
echo "========================================"
echo "Compilation check completed"
