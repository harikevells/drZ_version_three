const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');

const sizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

async function generate() {
  try {
    const image = await Jimp.read('src/assets/logo_padded.png');
    
    for (const [density, size] of Object.entries(sizes)) {
      const dir = `android/app/src/main/res/mipmap-${density}`;
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      
      const resized = image.clone().resize({ w: size, h: size });
      await resized.write(`android/app/src/main/res/mipmap-${density}/ic_launcher.png`);
      
      // We can also create a round version (some launchers apply their own masks, but we can provide a circle masked version)
      // For now we'll just save the same image since the padding handles the circular masks of the launcher
      await resized.write(`android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`);
      
      // Also write to v26 adaptive icon folders as ic_foreground.png
      const v26Dir = `android/app/src/main/res/mipmap-${density}-v26`;
      if (fs.existsSync(v26Dir)) {
          await resized.write(`${v26Dir}/ic_foreground.png`);
      }
      
      console.log(`Generated ${density}`);
    }
    console.log('All icons generated successfully!');
  } catch (e) {
    console.error(e);
  }
}

generate();
