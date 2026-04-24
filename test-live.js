import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.stack || err.message);
  });

  try {
    await page.goto('https://scicomm-superbugs.github.io/CHOMPCHEM/#/login', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 5000));
    console.log('Test completed.');
  } catch (err) {
    console.log('GOTO ERROR:', err.message);
  }

  await browser.close();
  process.exit(0);
})();
