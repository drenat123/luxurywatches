export default async function run(page, ui) {
  const info = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      title: document.title,
      bodyChars: t.length,
      hasWhatsAppButton: !!document.querySelector('a[href*="wa.me"]'),
      hasBannerHeading: t.includes('Q\u00ebroni 10%'),
      hasBannerSubtext: t.includes('newsletter-in ton\u00eb'),
      hasRegjistrohu: t.includes('Regjistrohu'),
      hasNewsletterWord: t.toLowerCase().includes('newsletter'),
      emailInputCount: document.querySelectorAll('input[type=email]').length,
      formCount: document.querySelectorAll('form').length,
      sectionCount: document.querySelectorAll('section').length,
      h2s: Array.from(document.querySelectorAll('h2')).map((h) => h.innerText.trim()),
      lastSectionText: (() => {
        const s = document.querySelectorAll('section');
        return s.length ? s[s.length - 1].innerText.trim().slice(0, 160) : 'NO SECTIONS';
      })(),
    };
  });
  return info;
}
