/**
 * List All DigitalOcean Spaces (Buckets)
 *
 * This script lists all Spaces in your DigitalOcean account
 * so you can see which buckets are available.
 */

require('dotenv').config();
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function listSpaces() {
  log('\n🔍 Listing Your DigitalOcean Spaces...', 'cyan');
  log('━'.repeat(60), 'cyan');

  try {
    const s3Client = new S3Client({
      region: process.env.SPACES_REGION || 'nyc3',
      endpoint: process.env.SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
      credentials: {
        accessKeyId: process.env.SPACES_ACCESS_KEY_ID,
        secretAccessKey: process.env.SPACES_SECRET_ACCESS_KEY,
      },
    });

    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    if (response.Buckets && response.Buckets.length > 0) {
      log(`\n✅ Found ${response.Buckets.length} Space(s):\n`, 'green');

      response.Buckets.forEach((bucket, index) => {
        log(`${index + 1}. ${bucket.Name}`, 'cyan');
        log(`   Created: ${bucket.CreationDate.toISOString()}`, 'reset');
      });

      log('\n' + '━'.repeat(60), 'cyan');
      log('💡 To use one of these Spaces:', 'yellow');
      log('   Update SPACES_BUCKET in your .env file', 'yellow');
      log('   Example: SPACES_BUCKET=' + response.Buckets[0].Name, 'yellow');
      log('━'.repeat(60) + '\n', 'cyan');
    } else {
      log('\n⚠️  No Spaces found in your account!', 'yellow');
      log('\nYou need to create a Space first:', 'reset');
      log('  1. Go to https://cloud.digitalocean.com', 'reset');
      log('  2. Click "Create" → "Spaces Object Storage"', 'reset');
      log('  3. Choose region and name', 'reset');
      log('  4. Click "Create a Space"\n', 'reset');
    }

  } catch (error) {
    log(`\n❌ Error: ${error.message}`, 'reset');

    if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
      log('\n⚠️  Your API keys may be incorrect', 'yellow');
      log('Please check:', 'reset');
      log('  1. SPACES_ACCESS_KEY_ID in .env', 'reset');
      log('  2. SPACES_SECRET_ACCESS_KEY in .env', 'reset');
      log('  3. Keys are active in DigitalOcean → API → Spaces access keys\n', 'reset');
    }
  }
}

listSpaces();

