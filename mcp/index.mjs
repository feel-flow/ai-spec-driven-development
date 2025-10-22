// Thin loader delegating to compiled TypeScript implementation.
import fs from 'fs';
import path from 'path';
import url from 'url';
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distEntry = path.join(__dirname, 'dist', 'index.js');
if (!fs.existsSync(distEntry)) {
  console.error('[mcp] build artifacts not found. Run: npm run build');
  process.exit(1);
}
await import(url.pathToFileURL(distEntry).href);

