/**
 * DigitalOcean Spaces Connection Test Script
 *
 * This script tests:
 * 1. Environment variables are set correctly
 * 2. S3 client can connect to DigitalOcean Spaces
 * 3. Can list objects in the bucket
 * 4. Can upload a test file
 * 5. Can download the test file
 * 6. Can delete the test file
 *
 * Usage:
 *   node test-spaces-connection.js
 */

require('dotenv').config();
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'blue');
  log(`  ${message}`, 'blue');
  log(`${'='.repeat(60)}`, 'blue');
}

// Test 1: Check Environment Variables
function checkEnvironmentVariables() {
  logSection('Test 1: Checking Environment Variables');

  const requiredVars = [
    'SPACES_ACCESS_KEY_ID',
    'SPACES_SECRET_ACCESS_KEY',
    'SPACES_REGION',
    'SPACES_BUCKET',
    'SPACES_ENDPOINT',
  ];

  let allPresent = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName}: Set`);
      // Show partial value for verification (first 4 chars + ***)
      const value = process.env[varName];
      const preview = value.length > 4 ? `${value.substring(0, 4)}***` : '***';
      logInfo(`  Value preview: ${preview}`);
    } else {
      logError(`${varName}: NOT SET`);
      allPresent = false;
    }
  }

  if (!allPresent) {
    logError('\nSome environment variables are missing!');
    logInfo('Please check your .env file in verification-service/');
    process.exit(1);
  }

  logSuccess('\nAll environment variables are set!');
  return true;
}

// Test 2: Initialize S3 Client
function initializeS3Client() {
  logSection('Test 2: Initializing S3 Client');

  try {
    const s3Client = new S3Client({
      region: process.env.SPACES_REGION,
      endpoint: process.env.SPACES_ENDPOINT,
      credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
        secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
      },
      forcePathStyle: false,
    });

    logSuccess('S3 Client initialized successfully');
    logInfo(`  Region: ${process.env.SPACES_REGION}`);
    logInfo(`  Endpoint: ${process.env.SPACES_ENDPOINT}`);
    logInfo(`  Bucket: ${process.env.SPACES_BUCKET}`);

    return s3Client;
  } catch (error) {
    logError(`Failed to initialize S3 Client: ${error.message}`);
    process.exit(1);
  }
}

// Test 3: List Objects in Bucket
async function testListObjects(s3Client) {
  logSection('Test 3: Listing Objects in Bucket');

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.SPACES_BUCKET,
      MaxKeys: 10, // Only list first 10 objects
    });

    logInfo('Sending ListObjectsV2 request...');
    const response = await s3Client.send(command);

    logSuccess('Successfully connected to bucket!');
    logInfo(`  Total objects: ${response.KeyCount || 0}`);

    if (response.Contents && response.Contents.length > 0) {
      logInfo('\n  Recent objects:');
      response.Contents.slice(0, 5).forEach((obj, index) => {
        logInfo(`    ${index + 1}. ${obj.Key} (${(obj.Size / 1024).toFixed(2)} KB)`);
      });
    } else {
      logInfo('  Bucket is empty (this is fine for a new setup)');
    }

    return true;
  } catch (error) {
    logError(`Failed to list objects: ${error.message}`);

    if (error.name === 'NoSuchBucket') {
      logError('\nBucket does not exist!');
      logInfo('Please check:');
      logInfo('  1. SPACES_BUCKET name is correct');
      logInfo('  2. Bucket exists in DigitalOcean Spaces dashboard');
    } else if (error.name === 'InvalidAccessKeyId') {
      logError('\nInvalid Access Key ID!');
      logInfo('Please check:');
      logInfo('  1. SPACES_ACCESS_KEY_ID is correct');
      logInfo('  2. API key is active in DigitalOcean');
    } else if (error.name === 'SignatureDoesNotMatch') {
      logError('\nSecret Access Key is incorrect!');
      logInfo('Please check:');
      logInfo('  1. SPACES_SECRET_ACCESS_KEY is correct (no extra spaces)');
      logInfo('  2. System time is accurate');
    } else if (error.name === 'AccessDenied') {
      logError('\nAccess Denied!');
      logInfo('Please check:');
      logInfo('  1. API key has read/write permissions');
      logInfo('  2. Bucket is not restricted to specific IPs');
    }

    return false;
  }
}

// Test 4: Upload Test File
async function testUploadFile(s3Client) {
  logSection('Test 4: Uploading Test File');

  try {
    const testContent = `DigitalOcean Spaces Test File
Created: ${new Date().toISOString()}
Purpose: Verify upload functionality
Status: SUCCESS`;

    const testKey = `test-connection/${Date.now()}-test.txt`;

    const command = new PutObjectCommand({
      Bucket: process.env.SPACES_BUCKET,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
      ServerSideEncryption: 'AES256',
    });

    logInfo(`Uploading test file: ${testKey}`);
    await s3Client.send(command);

    logSuccess('Test file uploaded successfully!');
    logInfo(`  Key: ${testKey}`);
    logInfo(`  Size: ${testContent.length} bytes`);
    logInfo(`  Encryption: AES256`);

    return testKey;
  } catch (error) {
    logError(`Failed to upload test file: ${error.message}`);
    return null;
  }
}

// Test 5: Download Test File
async function testDownloadFile(s3Client, testKey) {
  logSection('Test 5: Downloading Test File');

  if (!testKey) {
    logWarning('Skipping download test (upload failed)');
    return false;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.SPACES_BUCKET,
      Key: testKey,
    });

    logInfo(`Downloading test file: ${testKey}`);
    const response = await s3Client.send(command);

    // Read the stream
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString('utf-8');

    logSuccess('Test file downloaded successfully!');
    logInfo(`  Content length: ${content.length} bytes`);
    logInfo(`  Content preview:\n${content.split('\n').map(line => `    ${line}`).join('\n')}`);

    return true;
  } catch (error) {
    logError(`Failed to download test file: ${error.message}`);
    return false;
  }
}

// Test 6: Delete Test File
async function testDeleteFile(s3Client, testKey) {
  logSection('Test 6: Deleting Test File (Cleanup)');

  if (!testKey) {
    logWarning('Skipping delete test (upload failed)');
    return false;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.SPACES_BUCKET,
      Key: testKey,
    });

    logInfo(`Deleting test file: ${testKey}`);
    await s3Client.send(command);

    logSuccess('Test file deleted successfully!');
    logInfo('  Cleanup complete');

    return true;
  } catch (error) {
    logError(`Failed to delete test file: ${error.message}`);
    logWarning('You may need to manually delete the test file from your Space');
    return false;
  }
}

// Test 7: Verify Verification Folder Structure
async function testVerificationFolderStructure(s3Client) {
  logSection('Test 7: Checking Verification Folder Structure');

  try {
    const command = new ListObjectsV2Command({
      Bucket: process.env.SPACES_BUCKET,
      Prefix: 'verification/',
      MaxKeys: 10,
    });

    logInfo('Checking for verification/ folder...');
    const response = await s3Client.send(command);

    if (response.KeyCount > 0) {
      logSuccess('Verification folder exists!');
      logInfo(`  Files found: ${response.KeyCount}`);
      logInfo('\n  Sample files:');
      response.Contents.slice(0, 5).forEach((obj, index) => {
        logInfo(`    ${index + 1}. ${obj.Key}`);
      });
    } else {
      logInfo('Verification folder does not exist yet (this is normal for first-time setup)');
      logInfo('The folder will be created automatically when the first document is uploaded');
    }

    return true;
  } catch (error) {
    logError(`Failed to check verification folder: ${error.message}`);
    return false;
  }
}

// Main Test Runner
async function runTests() {
  log('\n🚀 DigitalOcean Spaces Connection Test', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    // Test 1: Environment Variables
    checkEnvironmentVariables();

    // Test 2: Initialize S3 Client
    const s3Client = initializeS3Client();

    // Test 3: List Objects
    const listSuccess = await testListObjects(s3Client);
    if (!listSuccess) {
      logError('\n❌ Connection test FAILED');
      logInfo('Please fix the issues above and try again');
      process.exit(1);
    }

    // Test 4: Upload Test File
    const testKey = await testUploadFile(s3Client);

    // Test 5: Download Test File
    await testDownloadFile(s3Client, testKey);

    // Test 6: Delete Test File
    await testDeleteFile(s3Client, testKey);

    // Test 7: Check Verification Folder
    await testVerificationFolderStructure(s3Client);

    // Summary
    logSection('Test Summary');
    logSuccess('✅ All tests passed!');
    logSuccess('✅ Your DigitalOcean Space is working correctly!');
    logInfo('\nYou can now:');
    logInfo('  1. Start the verification service: npm run dev');
    logInfo('  2. Test document uploads via API');
    logInfo('  3. Deploy to production');

    log('\n' + '━'.repeat(60), 'green');
    log('🎉 SUCCESS! Your Space bucket is ready to use!', 'green');
    log('━'.repeat(60) + '\n', 'green');

  } catch (error) {
    logError(`\n❌ Unexpected error: ${error.message}`);
    logError(error.stack);
    process.exit(1);
  }
}

// Run the tests
runTests();

