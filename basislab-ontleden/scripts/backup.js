// Maakt een veilige kopie van de database (ook terwijl de app draait) en bewaart de laatste 14 kopieën.
// Gebruik: npm run backup            -> data/backups/basislab-ontleden-JJJJ-MM-DD-UUMM.db
//          npm run backup -- <map>   -> kopie in een andere map
import { DatabaseSync, backup } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_FILE = process.env.DB_FILE || './data/basislab-ontleden.db';
const dir = process.argv[2] || path.join(path.dirname(DB_FILE), 'backups');
const KEEP = Number(process.env.BACKUP_KEEP || 14);

if (!fs.existsSync(DB_FILE)) {
  console.error(`Database niet gevonden: ${DB_FILE}`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
const target = path.join(dir, `basislab-ontleden-${stamp}.db`);
const db = new DatabaseSync(DB_FILE);
await backup(db, target);
db.close();
// Zet de kopie om naar één los bestand (geen -wal/-shm ernaast) en controleer de inhoud.
const check = new DatabaseSync(target);
check.exec('PRAGMA journal_mode = DELETE;');
const ok = check.prepare('PRAGMA integrity_check').get().integrity_check;
const students = check.prepare('SELECT COUNT(*) AS n FROM students').get().n;
check.close();
if (ok !== 'ok') {
  console.error(`Controle van de back-up mislukt: ${ok}`);
  process.exit(1);
}
console.log(`Back-up gemaakt: ${target} (${students} leerlingen)`);

const old = fs.readdirSync(dir).filter((f) => /^basislab-ontleden-.*\.db$/.test(f)).sort().reverse().slice(KEEP);
for (const f of old) fs.unlinkSync(path.join(dir, f));
if (old.length) console.log(`${old.length} oude back-up(s) verwijderd (bewaard: ${KEEP}).`);
