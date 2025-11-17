#!/bin/bash

# Script to diagnose onboarding email issue in production

echo "=================================================="
echo "ONBOARDING EMAIL DIAGNOSTICS"
echo "=================================================="
echo ""

echo "📋 Step 1: Check recent onboarding submissions..."
echo "---------------------------------------------------"
pm2 logs backend --lines 100 --nostream | grep -i "\[Onboarding\]" | tail -20

echo ""
echo "📧 Step 2: Check email sending attempts..."
echo "---------------------------------------------------"
pm2 logs backend --lines 100 --nostream | grep -i "confirmation email" | tail -20

echo ""
echo "❌ Step 3: Check for email errors..."
echo "---------------------------------------------------"
pm2 logs backend --lines 100 --nostream | grep -i "email error\|failed to send" | tail -20

echo ""
echo "🔧 Step 4: Check SMTP transporter initialization..."
echo "---------------------------------------------------"
pm2 logs backend --lines 200 --nostream | grep -i "initializing email transporter\|smtp" | tail -10

echo ""
echo "=================================================="
echo "SPECIFIC CHECK: Recent submission for olukoyaseyifunmi@gmail.com"
echo "=================================================="
pm2 logs backend --lines 200 --nostream | grep -i "olukoyaseyifunmi" | tail -30

echo ""
echo "=================================================="
echo "DIAGNOSTICS COMPLETE"
echo "=================================================="
echo ""
echo "💡 Next steps:"
echo "1. Check if you see '[Onboarding] Sending confirmation email to:' messages"
echo "2. Look for any error messages after that"
echo "3. Compare with successful customer invitation emails"
echo ""

