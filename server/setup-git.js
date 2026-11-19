import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';

const url = 'https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip';
const zip = path.join(process.env.TEMP, 'mingit.zip');
const dest = 'C:\\Users\\jedso\\mingit';

function download(u, cb) {
  https.get(u, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location, cb);
    }
    const file = fs.createWriteStream(zip);
    res.pipe(file);
    file.on('finish', () => {
      file.close(cb);
    });
  }).on('error', (e) => console.error('Erro download:', e.message));
}

console.log('Baixando MinGit portátil...');
download(url, () => {
  console.log('Download concluído! Extraindo...');
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  execSync(`tar -xf "${zip}" -C "${dest}"`);
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  const gitPath = path.join(dest, 'cmd', 'git.exe');
  const v = execSync(`"${gitPath}" --version`).toString();
  console.log('MinGit instalado com sucesso:', v.trim());
});
