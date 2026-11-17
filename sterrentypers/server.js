import http from 'node:http';
import { openDb } from './src/db.js';
import { createApp } from './src/app.js';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const DB_FILE = process.env.DB_FILE || './data/sterrentypers.db';

const db = openDb(DB_FILE);
const server = http.createServer(createApp({ db }));
server.listen(PORT, HOST, () => {
  console.log(`Sterrentypers draait op http://localhost:${PORT} (database: ${DB_FILE})`);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    server.close();
    db.close();
    process.exit(0);
  });
}
