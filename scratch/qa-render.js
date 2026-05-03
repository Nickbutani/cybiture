const { chromium } = require("/Users/nickbutani/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const path = require("path");

const pageUrl = `file://${path.resolve(__dirname, "..", "index.html")}`;

async function capture(browser, name, viewport) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pageUrl);
  const totalHeight = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y <= totalHeight; y += Math.floor(viewport.height * 0.55)) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await page.waitForTimeout(120);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(180);
  await page.screenshot({ path: path.resolve(__dirname, `${name}.png`), fullPage: true });
  const metrics = await page.evaluate(() => ({
    title: document.title,
    header: document.querySelector("h1")?.textContent,
    navVisible: getComputedStyle(document.querySelector(".site-nav")).display,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    bodyHeight: document.body.scrollHeight,
    ctaVisible: !!document.querySelector(".cta .button-primary"),
    visibleReveals: document.querySelectorAll(".reveal.is-visible").length,
    revealCount: document.querySelectorAll(".reveal").length,
    counterText: Array.from(document.querySelectorAll(".count")).map((counter) => counter.textContent),
  }));
  await page.close();
  return { name, viewport, errors, metrics };
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const results = [
    await capture(browser, "desktop", { width: 1440, height: 1000 }),
    await capture(browser, "mobile", { width: 390, height: 844 }),
  ];

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
