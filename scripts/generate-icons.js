import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Official SVG vector representation of the user's uploaded logo
// Preserves exact colors: forest green shield (#125e38), red diagonal band (#e22325), black scorpion (#0d1110)
export function getLogoSvg(size = 1000, isMaskable = false) {
  // If maskable, scale the shield to fit within the 80% safe zone (800x800 centered in 1000x1000)
  // and fill background with matching forest green (#125e38)
  const scale = isMaskable ? 0.78 : 0.94;
  const transX = isMaskable ? 500 : 500;
  const transY = isMaskable ? 500 : 500;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1000 1000">
  <defs>
    <!-- Shield clipping path -->
    <clipPath id="shield-clip">
      <path d="M 175,45
               L 825,45
               C 910,45 935,75 935,160
               C 940,360 935,560 895,715
               C 850,845 680,945 500,975
               C 320,945 150,845 105,715
               C 65,560 60,360 65,160
               C 65,75 90,45 175,45 Z" />
    </clipPath>
  </defs>

  ${isMaskable ? `<rect width="1000" height="1000" fill="#125e38" />` : ''}

  <!-- Shield scaled and centered -->
  <g transform="translate(${transX}, ${transY}) scale(${scale}) translate(-500, -500)">
    <!-- Green Shield Body -->
    <path d="M 175,45
             L 825,45
             C 910,45 935,75 935,160
             C 940,360 935,560 895,715
             C 850,845 680,945 500,975
             C 320,945 150,845 105,715
             C 65,560 60,360 65,160
             C 65,75 90,45 175,45 Z"
          fill="#125e38" />

    <!-- Shield Interior Clipped Elements -->
    <g clip-path="url(#shield-clip)">
      <!-- Red Diagonal Band -->
      <g transform="translate(500, 500) rotate(45)">
        <path d="M -140,-260
                 C -140,-340 140,-340 140,-260
                 L 140,550
                 L -140,550 Z"
              fill="#e22325" />
      </g>
    </g>

    <!-- Scorpion Artwork (Black) -->
    <g transform="translate(500, 500) rotate(-45)" fill="#0d1110" stroke="#0d1110" stroke-linecap="round" stroke-linejoin="round">
      
      <!-- Prosoma (Head) -->
      <ellipse cx="45" cy="0" rx="55" ry="42" />
      
      <!-- 7 Mesosoma Segments (Body Tergites) -->
      <path d="M -10,-45 C 5,-40 12,-20 12,0 C 12,20 5,40 -10,45 C -25,40 -20,20 -20,0 C -20,-20 -25,-40 -10,-45 Z" />
      <path d="M -40,-48 C -25,-42 -18,-20 -18,0 C -18,20 -25,42 -40,48 C -55,42 -50,20 -50,0 C -50,-20 -55,-42 -40,-48 Z" />
      <path d="M -72,-50 C -57,-44 -50,-20 -50,0 C -50,20 -57,44 -72,50 C -87,44 -82,20 -82,0 C -82,-20 -87,-44 -72,-50 Z" />
      <path d="M -104,-48 C -89,-42 -82,-20 -82,0 C -82,20 -89,42 -104,48 C -119,42 -114,20 -114,0 C -114,-20 -119,-42 -104,-48 Z" />
      <path d="M -134,-44 C -119,-38 -114,-20 -114,0 C -114,20 -119,38 -134,44 C -149,38 -144,20 -144,0 C -144,-20 -149,-38 -134,-44 Z" />
      <path d="M -162,-39 C -147,-34 -144,-18 -144,0 C -144,18 -147,34 -162,39 C -177,34 -172,18 -172,0 C -172,-18 -177,-34 -162,-39 Z" />
      <path d="M -188,-33 C -173,-28 -172,-15 -172,0 C -172,15 -173,28 -188,33 C -203,28 -198,15 -198,0 C -198,-15 -203,-28 -188,-33 Z" />

      <!-- Metasoma (Curved Tail - 5 Segments) -->
      <ellipse cx="-215" cy="-10" rx="19" ry="28" transform="rotate(12 -215 -10)" />
      <ellipse cx="-245" cy="-28" rx="18" ry="27" transform="rotate(28 -245 -28)" />
      <ellipse cx="-272" cy="-55" rx="17" ry="26" transform="rotate(48 -272 -55)" />
      <ellipse cx="-288" cy="-90" rx="17" ry="25" transform="rotate(72 -288 -90)" />
      <ellipse cx="-288" cy="-130" rx="16" ry="24" transform="rotate(96 -288 -130)" />

      <!-- Telson & Aculeus (Stinger Bulb and Needle) -->
      <circle cx="-268" cy="-168" r="18" />
      <path d="M -268,-186 C -248,-192 -225,-182 -212,-162 C -222,-168 -240,-174 -260,-172 Z" fill="#0d1110" />

      <!-- Pedipalps / Arms and Pincers (Claws at x > 0) -->
      <!-- Left Pincer (y < 0) -->
      <path d="M 75,-20 C 105,-42 140,-48 175,-32" fill="none" stroke-width="22" />
      <ellipse cx="195" cy="-22" rx="18" ry="28" transform="rotate(-15 195 -22)" />
      <path d="M 205,-45 C 235,-65 275,-62 295,-35 C 315,-8 305,25 275,32 C 250,38 220,18 205,-15 Z" />
      <path d="M 285,-40 C 315,-38 338,-15 342,15 C 330,12 315,0 300,-15 Z" />
      <path d="M 270,25 C 295,30 330,22 342,0 C 335,-8 318,5 295,12 Z" />

      <!-- Right Pincer (y > 0) -->
      <path d="M 75,20 C 105,42 140,48 175,32" fill="none" stroke-width="22" />
      <ellipse cx="195" cy="22" rx="18" ry="28" transform="rotate(15 195 22)" />
      <path d="M 205,45 C 235,65 275,62 295,35 C 315,8 305,-25 275,-32 C 250,-38 220,-18 205,15 Z" />
      <path d="M 285,40 C 315,38 338,15 342,-15 C 330,-12 315,0 300,15 Z" />
      <path d="M 270,-25 C 295,-30 330,-22 342,0 C 335,8 318,-5 295,-12 Z" />

      <!-- 4 Pairs of Walking Legs (8 Legs Total) -->
      <!-- Left Legs (y < 0) -->
      <path d="M 45,-30 C 40,-75 10,-105 -25,-125" fill="none" stroke-width="12" />
      <path d="M 20,-35 C 5,-80 -25,-115 -65,-138" fill="none" stroke-width="12" />
      <path d="M -10,-40 C -25,-85 -60,-120 -105,-142" fill="none" stroke-width="12" />
      <path d="M -40,-42 C -65,-90 -105,-122 -150,-140" fill="none" stroke-width="12" />

      <!-- Right Legs (y > 0) -->
      <path d="M 45,30 C 40,75 10,105 -25,125" fill="none" stroke-width="12" />
      <path d="M 20,35 C 5,80 -25,115 -65,138" fill="none" stroke-width="12" />
      <path d="M -10,40 C -25,85 -60,120 -105,142" fill="none" stroke-width="12" />
      <path d="M -40,42 C -65,90 -105,122 -150,140" fill="none" stroke-width="12" />
    </g>
  </g>
</svg>`;
}

export async function generateAllIcons() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. icon.svg
  const svgContent = getLogoSvg(512, false);
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
  console.log('Saved public/icon.svg');

  // 2. pwa-512x512.png (Transparent outside shield)
  await sharp(Buffer.from(getLogoSvg(512, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));
  console.log('Saved public/pwa-512x512.png');

  // 3. pwa-192x192.png (Transparent outside shield)
  await sharp(Buffer.from(getLogoSvg(192, false)))
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));
  console.log('Saved public/pwa-192x192.png');

  // 4. pwa-maskable-512x512.png (Safe-zone compliant, forest green background)
  await sharp(Buffer.from(getLogoSvg(512, true)))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));
  console.log('Saved public/pwa-maskable-512x512.png');

  // 5. pwa-maskable-192x192.png (Safe-zone compliant, forest green background)
  await sharp(Buffer.from(getLogoSvg(192, true)))
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-192x192.png'));
  console.log('Saved public/pwa-maskable-192x192.png');

  // 6. apple-touch-icon.png (180x180, iOS non-transparent standard)
  await sharp(Buffer.from(getLogoSvg(180, true)))
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Saved public/apple-touch-icon.png');
}

// Run if called directly
generateAllIcons().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
