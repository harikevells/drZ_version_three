const { Jimp } = require('jimp');

async function padIcon() {
  try {
    const image = await Jimp.read('src/assets/logo.png');
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    // Add more padding so the logo fits inside the "safe zone" of Android's adaptive icon masks and appears smaller
    const size = Math.floor(Math.max(w, h) * 1.8);
    
    const squared = new Jimp({ width: size, height: size, color: 0x00000000 }); // transparent background
    
    // center the image
    const x = Math.floor((size - w) / 2);
    const y = Math.floor((size - h) / 2);
    
    squared.composite(image, x, y);
    
    await squared.write('src/assets/logo_padded.png');
    console.log('Image padded successfully!');
  } catch (err) {
    console.error('Error padding image:', err);
  }
}

padIcon();
