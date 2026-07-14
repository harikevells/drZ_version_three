const { Jimp } = require('jimp');

async function squareImage() {
  try {
    const image = await Jimp.read('src/assets/logo.png');
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    const size = Math.max(w, h);
    
    const squared = new Jimp({ width: size, height: size, color: 0xffffffff }); // white background
    
    // center the image
    const x = Math.floor((size - w) / 2);
    const y = Math.floor((size - h) / 2);
    
    squared.composite(image, x, y);
    
    await squared.write('src/assets/logo_square.png');
    console.log('Image squared successfully!');
  } catch (err) {
    console.error('Error squaring image:', err);
  }
}

squareImage();
