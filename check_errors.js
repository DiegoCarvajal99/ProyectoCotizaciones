const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  console.log("Navigating...");
  await page.goto('http://localhost:4321/clientes', { waitUntil: 'networkidle2' });
  
  // wait a bit for any late errors
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
