const { S3Client, ListBucketsCommand, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const https = require('https');
require('dotenv').config();

async function testConnection() {
  console.log('🌊 Testing Digital Ocean Spaces Connection...\n');

  // Check environment variables
  console.log('📋 Environment Configuration:');
  console.log(`   Endpoint: ${process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com'}`);
  console.log(`   Region: ${process.env.DO_SPACES_REGION || 'nyc3'}`);
  console.log(`   Bucket: ${process.env.DO_SPACES_BUCKET || 'contrezz-uploads'}`);
  console.log(`   Access Key: ${process.env.DO_SPACES_ACCESS_KEY_ID ? '✅ Set' : '❌ Not Set'}`);
  console.log(`   Secret Key: ${process.env.DO_SPACES_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not Set'}`);
  console.log(`   CDN URL: ${process.env.DO_SPACES_CDN_URL || 'Not configured'}\n`);

  if (!process.env.DO_SPACES_ACCESS_KEY_ID || !process.env.DO_SPACES_SECRET_ACCESS_KEY) {
    console.error('❌ Error: Missing Digital Ocean Spaces credentials!');
    console.error('Please set DO_SPACES_ACCESS_KEY_ID and DO_SPACES_SECRET_ACCESS_KEY in your .env file');
    process.exit(1);
  }

  // Create HTTPS agent that handles SSL certificates properly
  const httpsAgent = new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  });

  const client = new S3Client({
    endpoint: process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
    region: process.env.DO_SPACES_REGION || 'nyc3',
    credentials: {
      accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
      secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
    },
    forcePathStyle: false,
    requestHandler: {
      httpsAgent: httpsAgent,
    },
  });

  try {
    // Test 1: List buckets
    console.log('🧪 Test 1: Listing buckets...');
    const listCommand = new ListBucketsCommand({});
    const buckets = await client.send(listCommand);
    console.log('✅ Connection successful!');
    console.log(`📦 Available buckets: ${buckets.Buckets?.map(b => b.Name).join(', ') || 'None'}\n`);

    // Test 2: Upload test file
    console.log('🧪 Test 2: Uploading test file...');
    const testContent = `Connection test successful!\nTimestamp: ${new Date().toISOString()}\nBucket: ${process.env.DO_SPACES_BUCKET || 'contrezz-uploads'}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET || 'contrezz-uploads',
      Key: 'test/connection-test.txt',
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
      ACL: 'private',
    });

    await client.send(uploadCommand);
    console.log('✅ File upload successful!');
    console.log('📁 Test file uploaded to: test/connection-test.txt\n');

    // Test 3: Check if file exists
    console.log('🧪 Test 3: Verifying file exists...');
    const headCommand = new HeadObjectCommand({
      Bucket: process.env.DO_SPACES_BUCKET || 'contrezz-uploads',
      Key: 'test/connection-test.txt',
    });

    const metadata = await client.send(headCommand);
    console.log('✅ File verification successful!');
    console.log(`📊 File size: ${metadata.ContentLength} bytes`);
    console.log(`📅 Last modified: ${metadata.LastModified}\n`);

    // Success summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✨ All tests passed! Your Digital Ocean Spaces is ready!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📝 Next Steps:');
    console.log('   1. Run the database migration: npm run migrate');
    console.log('   2. Install dependencies: npm install');
    console.log('   3. Start your backend server');
    console.log('   4. Test file upload via API\n');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\n🔍 Troubleshooting:');
    console.error('   1. Check your Digital Ocean Spaces access keys');
    console.error('   2. Verify the bucket name is correct');
    console.error('   3. Ensure your Spaces region matches (nyc3, sfo3, etc.)');
    console.error('   4. Check if your IP is allowed in firewall settings');
    console.error('\n📚 Documentation: https://docs.digitalocean.com/products/spaces/');
    process.exit(1);
  }
}

testConnection();

