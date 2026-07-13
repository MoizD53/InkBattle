const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  console.log('Navigating to http://localhost:4173/InkBattle/');
  await page.goto('http://localhost:4173/InkBattle/');
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  console.log('Done.');
})();
