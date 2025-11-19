require('dotenv').config();

console.log('🔍 Validating Digital Ocean Spaces Credentials...\n');

const accessKeyId = process.env.DO_SPACES_ACCESS_KEY_ID;
const secretAccessKey = process.env.DO_SPACES_SECRET_ACCESS_KEY;

if (!accessKeyId) {
  console.error('❌ DO_SPACES_ACCESS_KEY_ID is not set');
} else {
  console.log('✅ DO_SPACES_ACCESS_KEY_ID is set');
  console.log(`   Length: ${accessKeyId.length} characters`);
  console.log(`   First 4 chars: ${accessKeyId.substring(0, 4)}...`);
  console.log(`   Last 4 chars: ...${accessKeyId.substring(accessKeyId.length - 4)}`);

  // Check for whitespace
  if (accessKeyId !== accessKeyId.trim()) {
    console.error('   ⚠️  WARNING: Access Key has leading/trailing whitespace!');
    console.error('   Please remove whitespace from your .env file');
  }

  // Check format (Digital Ocean Spaces keys are typically 20 characters)
  if (accessKeyId.length !== 20) {
    console.warn('   ⚠️  WARNING: Access Key length is unusual (expected 20 characters)');
  }
}

console.log('');

if (!secretAccessKey) {
  console.error('❌ DO_SPACES_SECRET_ACCESS_KEY is not set');
} else {
  console.log('✅ DO_SPACES_SECRET_ACCESS_KEY is set');
  console.log(`   Length: ${secretAccessKey.length} characters`);
  console.log(`   First 4 chars: ${secretAccessKey.substring(0, 4)}...`);
  console.log(`   Last 4 chars: ...${secretAccessKey.substring(secretAccessKey.length - 4)}`);

  // Check for whitespace
  if (secretAccessKey !== secretAccessKey.trim()) {
    console.error('   ⚠️  WARNING: Secret Key has leading/trailing whitespace!');
    console.error('   Please remove whitespace from your .env file');
  }

  // Check format (Digital Ocean Spaces secret keys are typically 40 characters)
  if (secretAccessKey.length !== 40) {
    console.warn('   ⚠️  WARNING: Secret Key length is unusual (expected 40 characters)');
  }
}

console.log('\n📝 Recommendations:');
console.log('   1. Make sure there are NO quotes around your keys in .env');
console.log('   2. Make sure there are NO spaces before or after the keys');
console.log('   3. Format should be: DO_SPACES_ACCESS_KEY_ID=YOUR_KEY_HERE');
console.log('   4. If issues persist, regenerate keys in Digital Ocean dashboard');
console.log('\n💡 To regenerate keys:');
console.log('   1. Go to https://cloud.digitalocean.com/account/api/spaces');
console.log('   2. Click "Generate New Key"');
console.log('   3. Copy the keys immediately (they won\'t be shown again)');
console.log('   4. Update your .env file');

