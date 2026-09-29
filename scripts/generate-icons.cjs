// Script to generate/maintain official PWA icon assets
const { execSync } = require('child_process');
try {
  execSync('node scripts/generate-icons.js', { stdio: 'inherit' });
  console.log('Official icon assets generated successfully.');
} catch (e) {
  console.error('Failed to generate icons:', e.message);
}

