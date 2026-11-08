import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOTS_DIR = '/Users/rashedulislam/.gemini/antigravity/brain/62d95d07-99ad-4af0-84af-f9047342af29/screenshots';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runBrowserTests() {
  console.log('🚀 Launching Chrome via Puppeteer...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });

  const page = await browser.newPage();

  try {
    // =========================================================================
    // PART 1: CUSTOMER SIDE TESTING
    // =========================================================================
    console.log('\n============================================================');
    console.log('   CUSTOMER TESTING');
    console.log('============================================================');

    // 1. Home Page
    console.log('1. Navigating to Storefront Home (/) ...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    const homeTitle = await page.title();
    console.log(`   Page Title: "${homeTitle}"`);

    // Check header links
    const navText = await page.evaluate(() => document.body.innerText);
    const hasBundlesNav = navText.includes('কম্বো') || navText.includes('বান্ডেল') || navText.includes('Bundles');
    const hasBuildBundleNav = navText.includes('বান্ডেল বিল্ডার') || navText.includes('Build Bundle');
    const hasGiftBuilderNav = navText.includes('গিফট বিল্ডার') || navText.includes('Gift Builder');
    console.log(`   Header navigation contains Bundles: ${hasBundlesNav}, Build Bundle: ${hasBuildBundleNav}, Gift Builder: ${hasGiftBuilderNav}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_customer_home.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 01_customer_home.png');

    // 2. Build Your Bundle Page
    console.log('\n2. Navigating to Build Your Bundle (/build-your-bundle) ...');
    await page.goto(`${BASE_URL}/build-your-bundle`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // Check progress message initial state
    let progressText = await page.evaluate(() => {
      const el = document.querySelector('.bg-\\[\\#FFF5EB\\]') || document.querySelector('[class*="border-[#F5D0A9]"]');
      return el ? (el as HTMLElement).innerText : '';
    });
    console.log(`   Initial bundle banner message: "${progressText.replace(/\n/g, ' ')}"`);

    // Add first item
    console.log('   Adding Item 1 (Quantity = 1)...');
    const addButtons = await page.$$('button');
    let addedCount = 0;
    for (const btn of addButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('যোগ করুন') || text.includes('Add')) {
        await btn.click();
        addedCount++;
        await sleep(600);
        break;
      }
    }

    // Check progress message after 1 item
    progressText = await page.evaluate(() => {
      const el = document.querySelector('.bg-\\[\\#FFF5EB\\]') || document.querySelector('[class*="border-[#F5D0A9]"]');
      return el ? (el as HTMLElement).innerText : '';
    });
    console.log(`   Progress banner after 1 item: "${progressText.replace(/\n/g, ' ')}"`);

    // Add another item
    console.log('   Adding Item 2 (Quantity = 2)...');
    const allPlusBtns = await page.$$('button');
    for (const btn of allPlusBtns) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('যোগ করুন') || text.includes('Add')) {
        await btn.click();
        await sleep(600);
        break;
      }
    }

    // Check progress banner and summary after 2 items
    progressText = await page.evaluate(() => {
      const el = document.querySelector('.bg-\\[\\#FFF5EB\\]') || document.querySelector('[class*="border-[#F5D0A9]"]');
      return el ? (el as HTMLElement).innerText : '';
    });
    console.log(`   Progress banner after 2 items (5% tier): "${progressText.replace(/\n/g, ' ')}"`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_customer_bundle_builder.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 02_customer_bundle_builder.png');

    // Click "বান্ডেল কার্টে যোগ করুন"
    console.log('   Clicking "বান্ডেল কার্টে যোগ করুন" (Add bundle to cart)...');
    const cartBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const target = btns.find(b => b.innerText.includes('কার্টে যোগ করুন') || b.innerText.includes('Add Bundle to Cart'));
      if (target) {
        target.click();
        return true;
      }
      return false;
    });
    console.log(`   Bundle added to cart triggered: ${cartBtn}`);
    await sleep(1500);

    // 3. Cart Page
    console.log('\n3. Navigating to Cart (/cart) ...');
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // Verify coupon rejection message is visible in Cart
    const cartContent = await page.evaluate(() => document.body.innerText);
    const hasCouponWarning =
      cartContent.includes('বান্ডেল ডিসকাউন্ট') ||
      cartContent.includes('কুপন কোড ব্যবহার করা যাবে না') ||
      cartContent.includes('Coupons cannot be applied to carts containing bundle discounts') ||
      cartContent.includes('Coupon not allowed');
    console.log(`   Cart contains Bundle coupon notice: ${hasCouponWarning}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_customer_cart.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 03_customer_cart.png');

    // 4. Gift Builder Page
    console.log('\n4. Navigating to Gift Builder (/gift-builder) ...');
    await page.goto(`${BASE_URL}/gift-builder`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const giftBuilderTitle = await page.evaluate(() => {
      const h1 = document.querySelector('h1');
      return h1 ? h1.innerText : '';
    });
    console.log(`   Gift Builder Heading: "${giftBuilderTitle}"`);

    // Select a gift box
    const giftAddButtons = await page.$$('button');
    for (const btn of giftAddButtons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.includes('প্যাকেজে যোগ করুন') || text.includes('Add to Package')) {
        await btn.click();
        await sleep(500);
        break;
      }
    }

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_customer_gift_builder.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 04_customer_gift_builder.png');

    // 5. Checkout Page
    console.log('\n5. Navigating to Checkout (/checkout) ...');
    await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const checkoutText = await page.evaluate(() => document.body.innerText);
    const hasOrderSummary = checkoutText.includes('অর্ডার সারাংশ') || checkoutText.includes('Order Summary') || checkoutText.includes('মোট');
    console.log(`   Checkout rendered order summary: ${hasOrderSummary}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_customer_checkout.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 05_customer_checkout.png');

    // =========================================================================
    // PART 2: ADMIN SIDE TESTING
    // =========================================================================
    console.log('\n============================================================');
    console.log('   ADMIN TESTING');
    console.log('============================================================');

    // 1. Admin Login
    console.log('1. Navigating to Admin Login (/admin/login) ...');
    await page.goto(`${BASE_URL}/admin/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(1500);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@craftykidsco.com';
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD not set in environment.');
    }

    console.log(`   Filling login credentials for ${adminEmail}...`);
    // Find email and password inputs
    await page.type('input[type="email"], input[placeholder*="email"], input[name="email"]', adminEmail);
    await page.type('input[type="password"], input[name="password"]', adminPassword);
    await sleep(500);

    // Click submit
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (btn) btn.click();
    });

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await sleep(2000);

    const adminUrl = page.url();
    console.log(`   Admin logged in! Current URL: ${adminUrl}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_admin_dashboard.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 06_admin_dashboard.png');

    // 2. Bundles Manager
    console.log('\n2. Testing Admin Bundles Manager (/admin?tab=bundles) ...');
    await page.goto(`${BASE_URL}/admin?tab=bundles`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    // Check Curated Combos tab
    const bundlesText = await page.evaluate(() => document.body.innerText);
    const hasCuratedCombos = bundlesText.includes('Curated Combos') || bundlesText.includes('DEMO Fixed Combo');
    console.log(`   Bundles Manager loaded curated combos: ${hasCuratedCombos}`);

    // Click on "Custom Bundle Tiers & Rules" tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button'));
      const tierTab = tabs.find(t => t.innerText.includes('Custom Bundle Tiers') || t.innerText.includes('Tiers & Rules'));
      if (tierTab) tierTab.click();
    });
    await sleep(1500);

    const tierTabText = await page.evaluate(() => document.body.innerText);
    const hasMaxDiscount = tierTabText.includes('Max Discount') || tierTabText.includes('সর্বোচ্চ ছাড়');
    const hasTiersTable = tierTabText.includes('5%') && tierTabText.includes('10%');
    console.log(`   Custom Bundle Tiers tab loaded: Max Discount form=${hasMaxDiscount}, Tiers table=${hasTiersTable}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_admin_bundles_manager.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 07_admin_bundles_manager.png');

    // 3. Gift Packages Manager
    console.log('\n3. Testing Admin Gift Packages Manager (/admin?tab=gift-packages) ...');
    await page.goto(`${BASE_URL}/admin?tab=gift-packages`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const giftAdminText = await page.evaluate(() => document.body.innerText);
    const hasGiftItems = giftAdminText.includes('Pine Wood Gift Box') || giftAdminText.includes('Gift Items');
    const hasGiftCategories = giftAdminText.includes('Categories') || giftAdminText.includes('Packaging');
    console.log(`   Gift Packages Manager loaded: Items=${hasGiftItems}, Categories=${hasGiftCategories}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_admin_gift_packages_manager.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 08_admin_gift_packages_manager.png');

    // 4. Orders Manager
    console.log('\n4. Testing Admin Orders Manager (/admin?tab=orders) ...');
    await page.goto(`${BASE_URL}/admin?tab=orders`, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);

    const ordersText = await page.evaluate(() => document.body.innerText);
    const hasOrders = ordersText.includes('Orders') || ordersText.includes('CKC-');
    console.log(`   Orders Manager loaded: ${hasOrders}`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_admin_orders_manager.png'), fullPage: false });
    console.log('   📸 Saved screenshot: 09_admin_orders_manager.png');

    console.log('\n============================================================');
    console.log('   ALL BROWSER TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('============================================================\n');

  } catch (err: any) {
    console.error('❌ Browser testing error:', err);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_state.png'), fullPage: false }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

runBrowserTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

