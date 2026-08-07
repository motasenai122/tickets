const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Garantir que a pasta de dados exista
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Mutex em memória por arquivo para prevenir acessos concorrentes simultâneos de escrita
const locks = {};

function acquireLock(filename) {
  if (!locks[filename]) {
    locks[filename] = Promise.resolve();
  }
  let release;
  const nextLock = new Promise((resolve) => {
    release = resolve;
  });
  const currentLock = locks[filename];
  locks[filename] = locks[filename].then(() => nextLock);
  return currentLock.then(() => release);
}

/**
 * Lê e analisa um arquivo JSON de forma segura.
 * Retorna array vazio caso o arquivo não exista ou esteja corrompido.
 */
function readData(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const rawContent = fs.readFileSync(filePath, 'utf-8');
    if (!rawContent.trim()) return [];
    return JSON.parse(rawContent);
  } catch (error) {
    console.error(`[DataStore Error] Falha ao ler ${filename}:`, error.message);
    return [];
  }
}

/**
 * Grava dados em arquivo JSON de forma ATÔMICA.
 * Escreve em um arquivo temporário (.tmp) e o renomeia com fs.renameSync.
 * Isso garante que o arquivo final nunca seja corrompido durante a escrita.
 */
async function writeData(filename, data) {
  const release = await acquireLock(filename);
  try {
    const filePath = path.join(DATA_DIR, filename);
    const tempPath = path.join(DATA_DIR, `${filename}.${Date.now()}.tmp`);
    const jsonString = JSON.stringify(data, null, 2);

    // Grava primeiro no temporário
    fs.writeFileSync(tempPath, jsonString, 'utf-8');

    // Renomeia o temporário para o destino final (operação atômica no SO)
    fs.renameSync(tempPath, filePath);
  } catch (error) {
    console.error(`[DataStore Error] Falha na escrita atômica de ${filename}:`, error.message);
    throw error;
  } finally {
    release();
  }
}

module.exports = {
  readData,
  writeData,
  DATA_DIR
};
