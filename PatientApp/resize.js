const { Jimp } = require('jimp');

async function resizeImage() {
  try {
    const image = await Jimp.read('src/assets/logo.png'); // read original image
    
    // Resize the image so its maximum dimension is 300px
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    
    const size = 300;
    const scale = size / Math.max(w, h);
    
    const newW = Math.round(w * scale);
    const newH = Math.round(h * scale);
    
    // Instead of squaring, I will just resize it because launch_screen.xml doesn't strictly need a square if it's just `gravity="center"`
    image.resize({ w: newW, h: newH });
    
    await image.write('android/app/src/main/res/drawable/splash_image.png');
    console.log('Image resized and saved successfully!');
  } catch (err) {
    console.error('Error resizing image:', err);
  }
}

resizeImage();
