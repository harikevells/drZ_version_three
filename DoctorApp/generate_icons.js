const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputImagePath = path.join(__dirname, 'src', 'assets', 'DoctorlogoApp.png');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

async function generateIcons() {
  if (!fs.existsSync(inputImagePath)) {
    console.error('Input image not found:', inputImagePath);
    process.exit(1);
  }

  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const launcherPath = path.join(dir, 'ic_launcher.png');
    const launcherRoundPath = path.join(dir, 'ic_launcher_round.png');

    const padding = Math.round(size * 0.05);
    const innerSize = size - (padding * 2);

    // Square icon
    await sharp(inputImagePath)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: padding,
        bottom: size - innerSize - padding,
        left: padding,
        right: size - innerSize - padding,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(launcherPath);

    // Round icon
    const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`;
    const circleBuffer = Buffer.from(circleSvg);
    
    await sharp(inputImagePath)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: padding,
        bottom: size - innerSize - padding,
        left: padding,
        right: size - innerSize - padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .composite([{ input: circleBuffer, blend: 'dest-in' }])
      .toFile(launcherRoundPath);

    console.log(`Generated ${size}x${size} icons for ${folder}`);
  }
}

generateIcons().catch(console.error);
