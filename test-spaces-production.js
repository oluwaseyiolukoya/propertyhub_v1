#!/usr/bin/env node

/**
 * Test DigitalOcean Spaces Connection (Production)
 * Tests upload, download, and delete operations
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Production Spaces Configuration
const SPACES_CONFIG = {
  endpoint: 'https://nyc3.digitaloceanspaces.com',
  region: 'nyc3',
  credentials: {
    accessKeyId: process.env.SPACES_ACCESS_KEY_ID || 'DO00L4RQWXUGF3EGJ7ZX',
    secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY || 'TtRGBm9wnKgO6tVw63RnQ6/F4RRdV7kocmu6vqyMybg',
  },
  forcePathStyle: false,
};

const BUCKET_NAME = 'contrezz-uploads';
const TEST_KEY = 'test/connection-test-' + Date.now() + '.txt';
const TEST_CONTENT = 'Hello from Spaces connection test! ' + new Date().toISOString();

// Create S3 client
const s3Client = new S3Client(SPACES_CONFIG);

async function testSpacesConnection() {
  console.log('');
  console.log('🧪 ================================');
  console.log('   Testing DigitalOcean Spaces');
  console.log('================================');
  console.log('📦 Bucket:', BUCKET_NAME);
  console.log('🌍 Region:', SPACES_CONFIG.region);
  console.log('🔗 Endpoint:', SPACES_CONFIG.endpoint);
  console.log('🔑 Access Key:', SPACES_CONFIG.credentials.accessKeyId.substring(0, 10) + '...');
  console.log('');

  try {
    // Test 1: List objects (verify bucket access)
    console.log('📋 Test 1: List Objects (Verify Access)');
    console.log('   Testing bucket access...');
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      MaxKeys: 5,
    });
    const listResult = await s3Client.send(listCommand);
    console.log('   ✅ Bucket access successful!');
    console.log('   📊 Objects in bucket:', listResult.KeyCount || 0);
    if (listResult.Contents && listResult.Contents.length > 0) {
      console.log('   📁 Sample files:');
      listResult.Contents.slice(0, 3).forEach(obj => {
        console.log('      -', obj.Key);
      });
    }
    console.log('');

    // Test 2: Upload a test file
    console.log('📤 Test 2: Upload Test File');
    console.log('   Uploading:', TEST_KEY);
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_KEY,
      Body: TEST_CONTENT,
      ContentType: 'text/plain',
      ACL: 'private',
    });
    await s3Client.send(putCommand);
    console.log('   ✅ Upload successful!');
    console.log('   🔗 File URL: https://' + BUCKET_NAME + '.' + SPACES_CONFIG.region + '.digitaloceanspaces.com/' + TEST_KEY);
    console.log('');

    // Test 3: Download the test file
    console.log('📥 Test 3: Download Test File');
    console.log('   Downloading:', TEST_KEY);
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_KEY,
    });
    const getResult = await s3Client.send(getCommand);
    const downloadedContent = await streamToString(getResult.Body);
    console.log('   ✅ Download successful!');
    console.log('   📄 Content:', downloadedContent);
    console.log('   ✅ Content matches:', downloadedContent === TEST_CONTENT);
    console.log('');

    // Test 4: Delete the test file
    console.log('🗑️  Test 4: Delete Test File');
    console.log('   Deleting:', TEST_KEY);
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_KEY,
    });
    await s3Client.send(deleteCommand);
    console.log('   ✅ Delete successful!');
    console.log('');

    // Summary
    console.log('🎉 ================================');
    console.log('   ALL TESTS PASSED!');
    console.log('================================');
    console.log('✅ Bucket access: OK');
    console.log('✅ Upload: OK');
    console.log('✅ Download: OK');
    console.log('✅ Delete: OK');
    console.log('');
    console.log('🚀 Your Spaces bucket is ready for production!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ================================');
    console.error('   TEST FAILED!');
    console.error('================================');
    console.error('Error:', error.message);
    if (error.Code) {
      console.error('Error Code:', error.Code);
    }
    if (error.$metadata) {
      console.error('HTTP Status:', error.$metadata.httpStatusCode);
    }
    console.error('');
    console.error('🔍 Troubleshooting:');
    console.error('   1. Verify access key and secret key are correct');
    console.error('   2. Check bucket name:', BUCKET_NAME);
    console.error('   3. Verify region:', SPACES_CONFIG.region);
    console.error('   4. Ensure bucket exists and is accessible');
    console.error('');
    process.exit(1);
  }
}

// Helper function to convert stream to string
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Run the test
testSpacesConnection();

