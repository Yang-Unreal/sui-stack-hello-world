import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log('Navigating to app...');
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  
  console.log('Clicking DropdownMenuTrigger...');
  try {
    await page.waitForSelector('button, [class*="cursor-pointer"]', { timeout: 5000 });
    
    // Evaluate in page to find the trigger and click it
    await page.evaluate(() => {
      const triggers = Array.from(document.querySelectorAll('button, div')).filter(el => 
        el.textContent.includes('SUI') || el.textContent.includes('0x') || el.className.includes('border-border/50')
      );
      if (triggers.length > 0) {
        triggers[0].click();
      } else {
        throw new Error('Trigger not found');
      }
    });
    console.log('Clicked. Waiting to see if errors occur...');
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: 'screenshot.png' });
    console.log('Saved screenshot.png');
  } catch(e) {
    console.log('Error:', e.message);
  }
  // we can inject a mock account state if the app uses a store, OR we can just observe if it crashes on load.
  // Actually, wait, we can just click the "Connect Wallet" button and see if it turns black immediately?
  // The user says "when I've already connected".
  // Let's mock window.localStorage or whatever dAppKit uses, or just evaluate a script to set currentAccount.
  
  console.log('Closing browser...');
  await browser.close();
})();
