const base = process.env.SEO_BASE_URL || 'https://www.canticosccb.com.br';
const source = new URL('/hinos', base).toString();
const destination = new URL('/hinos-ccb', base).toString();
const cases = [
  ['browser', 'Mozilla/5.0 Chrome/151 Safari/537.36'],
  ['googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
];
const results = [];
let failed = false;
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  if (!ok) failed = true;
}
for (const [label, userAgent] of cases) {
  const headers = { 'user-agent': userAgent };
  const redirect = await fetch(source, { redirect: 'manual', headers });
  const location = redirect.headers.get('location') || '';
  check(label + ' redirect status', redirect.status === 301 || redirect.status === 308, String(redirect.status));
  check(label + ' redirect location', new URL(location, source).pathname === '/hinos-ccb', location || '(ausente)');
  const page = await fetch(destination, { headers });
  const html = await page.text();
  check(label + ' destination status', page.status === 200, String(page.status));
  if (label === 'googlebot') {
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
    const h1 = html.match(/<h1[^>]*>([^<]*)<\/h1>/i)?.[1] || '';
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1] || '';
    const robots = html.match(/<meta name="robots" content="([^"]+)"/i)?.[1] || '';
    check('googlebot SSR title', /Hinos CCB/i.test(title), title || '(ausente)');
    check('googlebot SSR H1', /Hinos CCB/i.test(h1), h1 || '(ausente)');
    check('googlebot SSR canonical', canonical === destination, canonical || '(ausente)');
    check('googlebot SSR robots', /index/i.test(robots) && !/noindex/i.test(robots), robots || '(ausente)');
    check('googlebot SSR body', /Hinos CCB/i.test(html), 'conteudo ausente');
  }
}
console.log(JSON.stringify({ base, passed: !failed, results }, null, 2));
if (failed) process.exitCode = 1;
