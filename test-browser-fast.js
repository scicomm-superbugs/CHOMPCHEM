import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(msg.type(), msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.message);
  });

  try {
    // Only wait for DOM to load, not network
    await page.goto('http://localhost:4173/#/login', { waitUntil: 'domcontentloaded' });
    
    // Wait 3 seconds to let React crash or render
    await new Promise(r => setTimeout(r, 3000));
    
    console.log('Test completed.');
  } catch (err) {
    console.log('GOTO ERROR:', err.message);
  }

  await browser.close();
  process.exit(0);
})();
