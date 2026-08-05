import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { createServer } from 'http';
import { readFile } from 'fs/promises';

const BUILD_DIR = 'apps/web-angular/dist/quantora-frontend/browser';
const PORT = 4210;
const BASE_URL = `http://localhost:${PORT}`;

const results = [];
let failedCount = 0;

function pass(check, message) {
  results.push({ check, status: 'PASS', message });
  console.log(`  ✅ ${message}`);
}

function fail(check, message) {
  results.push({ check, status: 'FAIL', message });
  console.log(`  ❌ ${message}`);
  failedCount++;
}

function skip(check, message) {
  results.push({ check, status: 'SKIP', message });
  console.log(`  ⏭️  ${message}`);
}

function startServer(rootDir) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
  };

  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      let filePath = join(rootDir, req.url === '/' ? 'index.html' : req.url);
      const ext = extname(filePath);

      try {
        const content = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(content);
      } catch {
        if (!ext) {
          const indexPath = join(filePath, 'index.html');
          try {
            const content = await readFile(indexPath);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content);
          } catch {
            res.writeHead(404);
            res.end('Not Found');
          }
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      }
    });

    server.listen(PORT, () => {
      console.log(`SEO check server started on ${BASE_URL}`);
      resolve(server);
    });
  });
}

async function fetchPage(url) {
  const http = await import('http');
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      })
      .on('error', reject);
  });
}

async function checkTitle(html) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (match && match[1].trim()) {
    pass('Page has title tag', `Title found: "${match[1].trim()}"`);
  } else {
    fail('Page has title tag', 'Missing or empty <title> tag');
  }
}

async function checkMetaDescription(html) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  if (match && match[1].trim()) {
    pass(
      'Page has meta description',
      `Meta description found: "${match[1].trim().substring(0, 60)}..."`,
    );
  } else {
    fail('Page has meta description', 'Missing or empty <meta name="description">');
  }
}

async function checkViewport(html) {
  const match = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i);
  if (match) {
    pass('Page has viewport meta tag', 'Viewport meta tag present');
  } else {
    fail('Page has viewport meta tag', 'Missing <meta name="viewport">');
  }
}

async function checkH1(html) {
  const matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi);
  if (matches && matches.length > 0) {
    pass('Page has at least one H1', `${matches.length} H1 tag(s) found`);
  } else {
    fail('Page has at least one H1', 'No <h1> tag found');
  }
}

async function checkImagesHaveAlt(html) {
  const imgTags = html.match(/<img[^>]+>/gi) || [];
  let missingAlt = 0;
  for (const img of imgTags) {
    if (!/alt\s*=\s*["']/i.test(img) && !/alt\s*=\s*["']\s*["']/i.test(img)) {
      missingAlt++;
    }
  }
  if (missingAlt === 0) {
    pass('Images have alt attributes', `All ${imgTags.length} image(s) have alt text`);
  } else {
    fail('Images have alt attributes', `${missingAlt}/${imgTags.length} image(s) missing alt text`);
  }
}

async function checkRobotsTxt() {
  try {
    const res = await fetchPage(`${BASE_URL}/robots.txt`);
    if (res.status === 200) {
      pass('robots.txt exists', 'robots.txt found and accessible');
    } else {
      fail('robots.txt exists', `robots.txt returned status ${res.status}`);
    }
  } catch {
    fail('robots.txt exists', 'Could not fetch robots.txt');
  }
}

async function checkSitemapXml() {
  try {
    const res = await fetchPage(`${BASE_URL}/sitemap.xml`);
    if (res.status === 200) {
      pass('sitemap.xml exists', 'sitemap.xml found and accessible');
    } else {
      skip('sitemap.xml exists', 'sitemap.xml not found (optional)');
    }
  } catch {
    skip('sitemap.xml exists', 'Could not fetch sitemap.xml (optional)');
  }
}

async function checkBrokenLinks(html) {
  const linkRegex = /<a[^>]+href=["']([^"']+)["']/gi;
  const links = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (
      href &&
      !href.startsWith('#') &&
      !href.startsWith('javascript:') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:') &&
      !href.startsWith('http') &&
      !href.startsWith('//')
    ) {
      links.push(href);
    }
  }

  const uniqueLinks = [...new Set(links)];
  let broken = 0;

  for (const link of uniqueLinks) {
    const url = link.startsWith('/') ? `${BASE_URL}${link}` : `${BASE_URL}/${link}`;
    try {
      const res = await fetchPage(url);
      if (res.status === 404) {
        broken++;
        console.log(`    ⚠️  Broken link: ${link} (404)`);
      }
    } catch {
      broken++;
    }
  }

  if (broken === 0) {
    pass('No broken internal links', `All ${uniqueLinks.length} internal link(s) resolved`);
  } else {
    fail(
      'No broken internal links',
      `${broken}/${uniqueLinks.length} internal link(s) returned 404`,
    );
  }
}

async function generateReport() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Check Report — Quantora</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; padding: 40px; }
    .container { max-width: 800px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .subtitle { color: #666; margin-bottom: 24px; }
    .summary { display: flex; gap: 16px; margin-bottom: 32px; }
    .stat { background: white; border-radius: 8px; padding: 20px; flex: 1; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .stat.pass { border-top: 3px solid #22c55e; }
    .stat.fail { border-top: 3px solid #ef4444; }
    .stat.skip { border-top: 3px solid #f59e0b; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 14px; color: #666; margin-top: 4px; }
    .overall { text-align: center; font-size: 18px; margin-bottom: 32px; padding: 16px; border-radius: 8px; }
    .overall.pass { background: #dcfce7; color: #166534; }
    .overall.fail { background: #fef2f2; color: #991b1b; }
    table { width: 100%; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #fafafa; font-weight: 600; font-size: 14px; color: #666; }
    td { font-size: 14px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .badge.pass { background: #dcfce7; color: #166534; }
    .badge.fail { background: #fef2f2; color: #991b1b; }
    .badge.skip { background: #fef3c7; color: #92400e; }
    .timestamp { color: #999; font-size: 12px; margin-top: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 SEO Check Report</h1>
    <p class="subtitle">Quantora — Angular Frontend</p>

    <div class="summary">
      <div class="stat pass">
        <div class="stat-value">${results.filter((r) => r.status === 'PASS').length}</div>
        <div class="stat-label">Passed</div>
      </div>
      <div class="stat fail">
        <div class="stat-value">${results.filter((r) => r.status === 'FAIL').length}</div>
        <div class="stat-label">Failed</div>
      </div>
      <div class="stat skip">
        <div class="stat-value">${results.filter((r) => r.status === 'SKIP').length}</div>
        <div class="stat-label">Skipped</div>
      </div>
    </div>

    <div class="overall ${failedCount === 0 ? 'pass' : 'fail'}">
      ${failedCount === 0 ? '✅ All SEO checks passed!' : `❌ ${failedCount} SEO check(s) failed`}
    </div>

    <table>
      <thead>
        <tr>
          <th>Check</th>
          <th>Status</th>
          <th>Detail</th>
        </tr>
      </thead>
      <tbody>
        ${results
          .map(
            (r) => `
          <tr>
            <td>${r.check}</td>
            <td><span class="badge ${r.status.toLowerCase()}">${r.status}</span></td>
            <td>${r.message}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <div class="timestamp">Generated: ${new Date().toISOString()}</div>
  </div>
</body>
</html>`;

  const reportPath = join(process.cwd(), 'seo-report.html');
  writeFileSync(reportPath, html);
  console.log(`\n📄 SEO report saved to ${reportPath}`);
}

async function main() {
  const buildDir = join(process.cwd(), BUILD_DIR);

  if (!existsSync(buildDir)) {
    console.error(`❌ Build directory not found: ${buildDir}`);
    console.error('   Run "npx ng build --configuration production" first');
    process.exit(1);
  }

  console.log('🔍 Starting SEO checks...\n');
  console.log(`📁 Serving from: ${buildDir}\n`);

  const server = await startServer(buildDir);

  await new Promise((r) => setTimeout(r, 1000));

  try {
    const page = await fetchPage(BASE_URL);

    if (page.status !== 200) {
      console.error(`❌ Server returned status ${page.status}`);
      server.close();
      process.exit(1);
    }

    await checkTitle(page.body);
    await checkMetaDescription(page.body);
    await checkViewport(page.body);
    await checkH1(page.body);
    await checkImagesHaveAlt(page.body);
    await checkRobotsTxt();
    await checkSitemapXml();
    await checkBrokenLinks(page.body);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(
      `Results: ${results.filter((r) => r.status === 'PASS').length} passed, ${results.filter((r) => r.status === 'FAIL').length} failed, ${results.filter((r) => r.status === 'SKIP').length} skipped`,
    );

    await generateReport();

    server.close();
    console.log('\n✅ SEO check complete');

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ SEO check error:', err.message);
    server.close();
    process.exit(1);
  }
}

main();
