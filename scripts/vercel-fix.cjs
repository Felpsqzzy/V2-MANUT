const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function write(file, value) {
  fs.writeFileSync(path.join(root, file), value, 'utf8');
}

// Production config: API calls must use the same Vercel origin, never localhost.
const configPath = path.join(root, 'config.js');
if (fs.existsSync(configPath)) {
  let config = fs.readFileSync(configPath, 'utf8');
  config = config.replace(/apiBaseUrl:\s*['"][^'"]*['"]/,
    "apiBaseUrl: window.location.origin + '/api'");
  write('config.js', config);
}

// The V2 module used to be exposed only after installOverrides(). If one optional
// enhancement throws during startup, the login layer sees the module as missing.
// Expose the public API first, then run optional initialization defensively.
const productionPath = path.join(root, 'assets/js/biotrop-production-v2.js');
if (fs.existsSync(productionPath)) {
  let source = fs.readFileSync(productionPath, 'utf8');
  const oldBlock = `  injectStyles();\n  installOverrides();\n\n  window.BIOTROP_PRODUCTION_V2 = {\n    state,\n    hasPermission: has,\n    enterAuthenticated,\n    refreshData,\n    openReading,\n    openMeterEditor\n  };`;
  const newBlock = `  window.BIOTROP_PRODUCTION_V2 = {\n    state,\n    hasPermission: has,\n    enterAuthenticated,\n    refreshData,\n    openReading,\n    openMeterEditor\n  };\n\n  try { injectStyles(); } catch (error) { console.warn('[BIOTROP V2] CSS init failed:', error); }\n  try { installOverrides(); } catch (error) { console.warn('[BIOTROP V2] Optional startup override failed:', error); }`;

  if (source.includes(oldBlock)) {
    source = source.replace(oldBlock, newBlock);
    fs.writeFileSync(productionPath, source, 'utf8');
  }
}

console.log('[Vercel fix] frontend production guards applied.');
