#!/bin/bash

# Script to check email configuration and logs in production

echo "=================================================="
echo "PRODUCTION EMAIL DIAGNOSTICS"
echo "=================================================="
echo ""

echo "1️⃣ Checking if SMTP environment variables are set..."
echo "---------------------------------------------------"
if [ -z "$SMTP_HOST" ]; then
    echo "❌ SMTP_HOST is NOT set"
else
    echo "✅ SMTP_HOST is set: $SMTP_HOST"
fi

if [ -z "$SMTP_PORT" ]; then
    echo "❌ SMTP_PORT is NOT set"
else
    echo "✅ SMTP_PORT is set: $SMTP_PORT"
fi

if [ -z "$SMTP_USER" ]; then
    echo "❌ SMTP_USER is NOT set"
else
    echo "✅ SMTP_USER is set: $SMTP_USER"
fi

if [ -z "$SMTP_PASS" ]; then
    echo "❌ SMTP_PASS is NOT set"
else
    echo "✅ SMTP_PASS is set: [HIDDEN]"
fi

if [ -z "$SMTP_FROM" ]; then
    echo "❌ SMTP_FROM is NOT set"
else
    echo "✅ SMTP_FROM is set: $SMTP_FROM"
fi

echo ""
echo "2️⃣ Checking recent email-related logs..."
echo "---------------------------------------------------"
pm2 logs backend --lines 50 --nostream | grep -i "email\|smtp" || echo "No email logs found"

echo ""
echo "3️⃣ Checking onboarding application logs..."
echo "---------------------------------------------------"
pm2 logs backend --lines 50 --nostream | grep -i "onboarding" || echo "No onboarding logs found"

echo ""
echo "=================================================="
echo "DIAGNOSTICS COMPLETE"
echo "=================================================="

