// Maakt een veilige kopie van de database (ook terwijl de app draait) en bewaart de laatste 14 kopieën.
// Gebruik: npm run backup            -> data/backups/sterrentypers-JJJJ-MM-DD-UUMM.db
//          npm run backup -- <map>   -> kopie in een andere map
import { DatabaseSync, backup } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const DB_FILE = process.env.DB_FILE || './data/sterrentypers.db';
const dir = process.argv[2] || path.join(path.dirname(DB_FILE), 'backups');
const KEEP = Number(process.env.BACKUP_KEEP || 14);

if (!fs.existsSync(DB_FILE)) {
  console.error(`Database niet gevonden: ${DB_FILE}`);
  process.exit(1);
}
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '');
const target = path.join(dir, `sterrentypers-${stamp}.db`);
const db = new DatabaseSync(DB_FILE);
await backup(db, target);
db.close();
const check = new DatabaseSync(target, { readOnly: true });
const students = check.prepare('SELECT COUNT(*) AS n FROM students').get().n;
check.close();
console.log(`Back-up gemaakt: ${target} (${students} leerlingen)`);

const old = fs.readdirSync(dir).filter((f) => /^sterrentypers-.*\.db$/.test(f)).sort().reverse().slice(KEEP);
for (const f of old) fs.unlinkSync(path.join(dir, f));
if (old.length) console.log(`${old.length} oude back-up(s) verwijderd (bewaard: ${KEEP}).`);
