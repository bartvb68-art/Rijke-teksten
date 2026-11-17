import http from 'node:http';
import os from 'node:os';
import { openDb } from './src/db.js';
import { createApp } from './src/app.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DB_FILE = process.env.DB_FILE || './data/sterrentypers.db';

const db = openDb(DB_FILE);
const server = http.createServer(createApp({ db }));
server.listen(PORT, HOST, () => {
  console.log(`Sterrentypers draait op http://localhost:${PORT} (database: ${DB_FILE})`);
  const lan = Object.values(os.networkInterfaces()).flat()
    .filter((a) => a && a.family === 'IPv4' && !a.internal).map((a) => `http://${a.address}:${PORT}`);
  if (HOST === '0.0.0.0' && lan.length) {
    console.log(`Andere computers in hetzelfde netwerk gebruiken: ${lan.join('  of  ')}`);
  }
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close();
    db.close();
    process.exit(0);
  });
}
