#!/bin/bash

# Portfolio Institution Service Test Runner
# This script runs the comprehensive test suite for the portfolio-institution-service

echo "🚀 Starting Portfolio Institution Service Test Suite"
echo "=================================================="

# Navigate to the service directory
cd "c:\Users\DevSpace\Wanzobe\Wanzo_Backend\apps\portfolio-institution-service"

echo ""
echo "📋 Test Environment Setup"
echo "-------------------------"
echo "✅ Service: portfolio-institution-service"
echo "✅ Test Framework: Jest"
echo "✅ Database: SQLite (in-memory for tests)"
echo "✅ Test Types: Unit, Integration, E2E"

echo ""
echo "🧪 Running Unit Tests"
echo "---------------------"
npm run test:unit

if [ $? -eq 0 ]; then
    echo "✅ Unit tests passed!"
else
    echo "❌ Unit tests failed!"
    exit 1
fi

echo ""
echo "🔗 Running Integration Tests"
echo "----------------------------"
npm run test:integration

if [ $? -eq 0 ]; then
    echo "✅ Integration tests passed!"
else
    echo "❌ Integration tests failed!"
    exit 1
fi

echo ""
echo "🌐 Running End-to-End Tests"
echo "---------------------------"
npm run test:e2e

if [ $? -eq 0 ]; then
    echo "✅ E2E tests passed!"
else
    echo "❌ E2E tests failed!"
    exit 1
fi

echo ""
echo "📊 Generating Coverage Report"
echo "----------------------------"
npm run test:cov

echo ""
echo "🎉 All Tests Completed Successfully!"
echo "====================================="
echo ""
echo "📈 Test Summary:"
echo "- Unit Tests: ✅ Passed"
echo "- Integration Tests: ✅ Passed" 
echo "- End-to-End Tests: ✅ Passed"
echo "- Coverage Report: ✅ Generated"
echo ""
echo "📁 Coverage report available at: coverage/lcov-report/index.html"
echo ""
echo "🚀 Ready for deployment!"
