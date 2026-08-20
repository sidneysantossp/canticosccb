const base = process.env.SEO_BASE_URL || "http://127.0.0.1:5177";
const site = new URL(base);
const bot = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const cases = [
  ["homepage", "/", 200, "/", false],
  ["hino individual", "/hino/hino-1-ccb-cristo-meu-mestre-elias-brandao-d0c5dff2-679d-4288-b5be-6c9e98c3e2e5", 200, null, false],
  ["hino cifrado", "/cifra/hino-avulso-cana-trilhada", 200, null, false],
  ["categoria/listagem", "/hinos-ccb", 200, null, false],
  ["URL com parâmetros", "/hinos-ccb?utm_source=smoke-test&utm_medium=qa#fragmento", 200, "/hinos-ccb", false],
  ["rota interna estática", "/hinario/1", 200, "/hinario/1", false],
  ["404", "/rota-smoke-404-inexistente-2026", 404, null, true]
];
const results = [];
let failed = false;
function check(name, ok, detail) { results.push({ name, ok, detail }); if (!ok) failed = true; }
function matchOne(html, re) { return html.match(re)?.[1] || ""; }
function canonicalChecks(label, html, expectedPath, noCanonical) {
  const tags = [...html.matchAll(/<link[^>]*rel="canonical"[^>]*>/gi)];
  if (noCanonical) { check(label + " no canonical", tags.length === 0, String(tags.length)); return; }
  check(label + " exactly one canonical", tags.length === 1, String(tags.length));
  const href = matchOne(html, /<link[^>]*rel="canonical"[^>]*href="([^"]+)"/i);
  if (!href) { check(label + " canonical present", false, "absent"); return; }
  const u = new URL(href, site);
  check(label + " canonical HTTPS", u.protocol === "https:", href);
  check(label + " canonical www", u.hostname === "www.canticosccb.com.br", href);
  check(label + " canonical absolute", /^https:\/\//i.test(href), href);
  check(label + " canonical no query/fragment", !u.search && !u.hash, href);
  const path = expectedPath || new URL(label === "URL com parâmetros" ? "/hinos-ccb" : href).pathname;
  if (expectedPath) check(label + " canonical path", u.pathname === expectedPath, u.pathname + " != " + expectedPath);
  if (expectedPath && expectedPath !== "/") check(label + " not homepage canonical", u.pathname !== "/", href);
}
for (const item of cases) {
  const label = item[0], path = item[1], expectedStatus = item[2], expectedPath = item[3], noindex = item[4];
  const response = await fetch(new URL(path, site), { headers: { "user-agent": bot } });
  const html = await response.text();
  check(label + " status", response.status === expectedStatus, String(response.status));
  canonicalChecks(label, html, expectedPath, noindex);
  const robots = matchOne(html, /<meta\s+name="robots"\s+content="([^"]+)"/i);
  if (noindex) {
    check(label + " robots noindex", /noindex/i.test(robots), robots || "absent");
  } else {
    const title = matchOne(html, /<title>([^<]+)<\/title>/i).trim();
    const h1s = [...html.matchAll(/<h1\b[^>]*>/gi)];
    const h1 = matchOne(html, /<h1[^>]*>([^<]+)<\/h1>/i).trim();
    check(label + " robots indexable", /index/i.test(robots) && !/noindex/i.test(robots), robots || "absent");
    check(label + " title non-empty", Boolean(title), "absent");
    check(label + " exactly one H1", h1s.length === 1, String(h1s.length));
    check(label + " SSR content relevant", html.length > 1000 && Boolean(h1), "html=" + html.length + ", h1=" + (h1 || "absent"));
  }
}
const dynamic404Cases = [
  ["rota desconhecida navegador", "/rota-smoke-404-browser-2026", "Mozilla/5.0"],
  ["hino inexistente Googlebot", "/hino/hino-999999-smoke-inexistente", bot],
  ["hino inexistente navegador", "/hino/hino-999999-smoke-browser", "Mozilla/5.0"],
  ["cifra inexistente Googlebot", "/cifra/cifra-999999-smoke-inexistente", bot]
];
for (const item of dynamic404Cases) {
  const label = item[0], path = item[1], ua = item[2];
  const response = await fetch(new URL(path, site), { headers: { "user-agent": ua } });
  const html = await response.text();
  const robots = matchOne(html, /<meta\s+name="robots"\s+content="([^"]+)"/i);
  const dependencyUnavailable = response.status === 503;
  check(label + " status", response.status === 404 || dependencyUnavailable, String(response.status));
  if (dependencyUnavailable) {
    check(label + " 503 retry-after", Boolean(response.headers.get("retry-after")), response.headers.get("retry-after") || "absent");
  }
  check(label + " robots noindex follow", /noindex\s*,\s*follow/i.test(robots), robots || "absent");
  check(label + " no canonical", !/<link[^>]*rel="canonical"/i.test(html), "canonical=" + (/<link[^>]*rel="canonical"/i.test(html) ? "1" : "0"));
  check(label + " one H1", [...html.matchAll(/<h1\b[^>]*>/gi)].length === 1, String([...html.matchAll(/<h1\b[^>]*>/gi)].length));
}
const old = new URL("/hinos", site);
const redirect = await fetch(old, { redirect: "manual", headers: { "user-agent": bot } });
const location = redirect.headers.get("location") || "";
check("legacy /hinos permanent redirect", redirect.status === 301 || redirect.status === 308, String(redirect.status));
check("legacy /hinos destination", new URL(location, old).pathname === "/hinos-ccb", location || "absent");
console.log(JSON.stringify({ base: base, passed: !failed, caseCount: cases.length, results: results }, null, 2));
