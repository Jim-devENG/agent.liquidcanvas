const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureDashboard() {
  console.log('🚀 Starting dashboard screenshot capture...');
  
  // Ensure public directory exists
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const outputPath = path.join(publicDir, 'dashboard-screenshot.png');
  
  try {
    console.log('📦 Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport to match landing page aspect ratio (16:9)
    // Use a wider viewport for better dashboard display
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2 // Higher quality
    });
    
    // Ensure full viewport coverage
    await page.evaluate(() => {
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      document.documentElement.style.height = '100%';
      document.documentElement.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.width = '100%';
    });
    
    console.log('🌐 Loading dashboard preview...');
    
    // Load the preview HTML file
    const previewPath = path.join(publicDir, 'dashboard-preview.html');
    const fileUrl = `file://${previewPath}`;
    
    await page.goto(fileUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });
    
    // Wait a bit for any animations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('📸 Capturing screenshot...');
    
    // Take screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: false,
      type: 'png',
      clip: {
        x: 0,
        y: 0,
        width: 1920,
        height: 1080
      }
    });
    
    await browser.close();
    
    console.log(`✅ Screenshot saved to: ${outputPath}`);
    console.log('🎉 Dashboard screenshot created successfully!');
    
  } catch (error) {
    console.error('❌ Error capturing screenshot:', error);
    process.exit(1);
  }
}

captureDashboard();

