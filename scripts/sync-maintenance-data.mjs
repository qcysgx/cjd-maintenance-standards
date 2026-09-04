import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(here, '..');
const sourceRoot = join(projectRoot, '..');
const outputRoot = join(projectRoot, 'public', 'standards');
const dataFile = join(projectRoot, 'app', 'data', 'standards.ts');
const brands = new Set(['Jeep', '道奇', '克莱斯勒']);
const filenamePattern = /^(\d{4})[-—](\d{4})_([^_]+)_(.+)\.html$/i;

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });

const files = await readdir(sourceRoot);
const records = [];

for (const filename of files) {
  const match = filename.match(filenamePattern);
  if (!match || !brands.has(match[3])) continue;
  const [, startYear, endYear, brand, model] = match;
  const safeFilename = `${startYear}-${endYear}_${brand}_${model}.html`;
  let html = await readFile(join(sourceRoot, filename), 'utf8');
  html = html
    .replace(/charset=iso-8859-1/gi, 'charset=utf-8')
    .replace(/<link[^>]+DealerConnectStyle\.css[^>]*>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<body([^>]*)>/i, '<body$1><style>body{font-family:Arial,"Microsoft YaHei",sans-serif;color:#17202b;margin:0;padding:24px;background:#fff}h2{color:#19291d}h3{margin-top:28px}table{font-size:14px!important;border:0!important;border-collapse:separate!important;border-spacing:0;width:100%!important;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px #d9e1da}th{background:#213c2b;color:white}th,td{padding:10px!important;border:0!important;border-right:1px solid #d9e1da!important;border-bottom:1px solid #d9e1da!important;text-align:left}tr:nth-child(even) td{background:#f7f9f7}</style>');
  await writeFile(join(outputRoot, safeFilename), html);
  records.push({
    id: `${startYear}-${endYear}-${brand}-${model}`,
    startYear: Number(startYear),
    endYear: Number(endYear),
    brand,
    model,
    file: `/standards/${encodeURIComponent(safeFilename)}`,
    sourceFilename: filename,
  });
}

records.sort((a, b) => a.brand.localeCompare(b.brand, 'zh-CN') || a.model.localeCompare(b.model, 'zh-CN') || b.startYear - a.startYear);
await mkdir(dirname(dataFile), { recursive: true });
await writeFile(dataFile, `// 由 scripts/sync-maintenance-data.mjs 自动生成，请勿手动修改。\nexport const standards = ${JSON.stringify(records, null, 2)} as const;\n`);
console.log(`Synced ${records.length} maintenance documents.`);
