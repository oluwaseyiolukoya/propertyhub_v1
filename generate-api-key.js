#!/usr/bin/env node

/**
 * Generate a secure API key for verification service
 */

const crypto = require('crypto');

console.log('');
console.log('🔑 ================================');
console.log('   API Key Generator');
console.log('================================');
console.log('');

// Generate a new API key
const apiKey = 'vkey_' + crypto.randomBytes(32).toString('hex');

console.log('✅ New API Key Generated:');
console.log('');
console.log(apiKey);
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 Next Steps:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('1. Update Verification Service Database:');
console.log('   Connect to: private-verification-db-prod');
console.log('   Run:');
console.log(`   UPDATE api_keys SET key = '${apiKey}' WHERE name = 'main_dashboard';`);
console.log('');
console.log('2. Update Verification Service Environment:');
console.log('   App: contrezz-verification-service');
console.log('   Variable: API_KEY_MAIN_DASHBOARD');
console.log(`   Value: ${apiKey}`);
console.log('');
console.log('3. Update Main Backend Environment:');
console.log('   App: contrezz-backend-prod');
console.log('   Variable: VERIFICATION_API_KEY');
console.log(`   Value: ${apiKey}`);
console.log('');
console.log('4. Redeploy Both Services');
console.log('   - Verification service will auto-redeploy after env change');
console.log('   - Main backend will auto-redeploy after env change');
console.log('');
console.log('5. Test KYC Submission');
console.log('   - Wait 2-3 minutes for deployments');
console.log('   - Try submitting KYC verification');
console.log('   - Should work without "Invalid API key" error');
console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');



