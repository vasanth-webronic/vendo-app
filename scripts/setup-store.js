/**
 * Setup Script for Vamo Store
 *
 * This script helps you configure the correct store and VM IDs
 * for your Vamo Store installation.
 *
 * Usage:
 *   node scripts/setup-store.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   Vamo Store Configuration Setup     ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log('This script will help you configure your Vamo Store with the correct Store ID and VM ID.\n');

  // Get current configuration
  const storePath = path.join(__dirname, '..', 'src', 'lib', 'stores', 'appStore.ts');
  let currentStoreId = 'not-set';

  try {
    const content = fs.readFileSync(storePath, 'utf8');
    const match = content.match(/storeId:\s*['"]([^'"]+)['"]/);
    if (match) {
      currentStoreId = match[1];
    }
  } catch (err) {
    console.warn('⚠️  Could not read current store configuration');
  }

  console.log(`Current Store ID: ${currentStoreId}\n`);

  // Ask for VM Service URL
  const vmServiceUrl = await question('VM Service URL (default: http://localhost:8080): ');
  const baseUrl = vmServiceUrl || 'http://localhost:8080';

  // Ask for credentials
  const clientId = await question('Client ID: ');
  const clientSecret = await question('Client Secret: ');

  console.log('\n📡 Fetching stores from VM Service...\n');

  // Try to fetch stores
  try {
    // Get token
    const tokenResponse = await fetch(`${baseUrl}/api/v1/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ Authentication failed. Please check your credentials.');
      rl.close();
      return;
    }

    const { access_token } = await tokenResponse.json();
    console.log('✅ Authentication successful\n');

    // Get stores (this endpoint might need adjustment based on your API)
    // For now, we'll ask the user to provide the IDs manually
    console.log('Please check your VM Service database for store IDs.\n');

  } catch (err) {
    console.warn('⚠️  Could not fetch stores automatically:', err.message);
    console.log('Please check your VM Service database for store IDs.\n');
  }

  // Ask for Store ID
  const newStoreId = await question('Enter Store ID (UUID): ');

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(newStoreId)) {
    console.error('❌ Invalid UUID format. Store ID should be a UUID like: 550e8400-e29b-41d4-a716-446655440000');
    rl.close();
    return;
  }

  // Ask for VM ID
  const newVmId = await question('Enter VM ID (UUID): ');
  if (!uuidRegex.test(newVmId)) {
    console.error('❌ Invalid UUID format. VM ID should be a UUID like: 550e8400-e29b-41d4-a716-446655440000');
    rl.close();
    return;
  }

  console.log('\n📝 Configuration Summary:');
  console.log('─────────────────────────');
  console.log(`Store ID: ${newStoreId}`);
  console.log(`VM ID:    ${newVmId}`);
  console.log('─────────────────────────\n');

  const confirm = await question('Apply this configuration? (yes/no): ');

  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('❌ Configuration cancelled.');
    rl.close();
    return;
  }

  // Update appStore.ts
  try {
    let content = fs.readFileSync(storePath, 'utf8');

    // Replace storeId
    content = content.replace(
      /storeId:\s*['"][^'"]*['"]/,
      `storeId: '${newStoreId}'`
    );

    fs.writeFileSync(storePath, content, 'utf8');
    console.log('✅ Updated src/lib/stores/appStore.ts\n');

  } catch (err) {
    console.error('❌ Failed to update appStore.ts:', err.message);
    console.log('\nPlease manually update src/lib/stores/appStore.ts:');
    console.log(`  storeId: '${newStoreId}',\n`);
  }

  // Create a products data file with the correct IDs
  const productsPath = path.join(__dirname, '..', 'src', 'lib', 'data', 'products.ts');
  try {
    let productsContent = fs.readFileSync(productsPath, 'utf8');

    // Update store and VM IDs in products
    productsContent = productsContent.replace(
      /storeId:\s*['"][^'"]*['"]/g,
      `storeId: '${newStoreId}'`
    );
    productsContent = productsContent.replace(
      /vmId:\s*['"][^'"]*['"]/g,
      `vmId: '${newVmId}'`
    );

    fs.writeFileSync(productsPath, productsContent, 'utf8');
    console.log('✅ Updated src/lib/data/products.ts\n');

  } catch (err) {
    console.warn('⚠️  Could not update products.ts automatically');
    console.log('Please manually add storeId and vmId to your products data.\n');
  }

  console.log('╔════════════════════════════════════════╗');
  console.log('║   Configuration Complete! ✨          ║');
  console.log('╚════════════════════════════════════════╝\n');

  console.log('Next steps:');
  console.log('1. Restart your development server (npm run dev)');
  console.log('2. Clear browser cache and localStorage');
  console.log('3. Test the payment page\n');

  rl.close();
}

main().catch((err) => {
  console.error('Error:', err);
  rl.close();
  process.exit(1);
});
