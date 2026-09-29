// Script to generate/maintain official NASOC PWA icon assets
const { execSync } = require('child_process');
try {
  execSync('python3 scripts/generate-icons.py', { stdio: 'inherit' });
  console.log('Official NASOC icon assets generated successfully.');
} catch (e) {
  console.error('Failed to generate icons:', e.message);
}
