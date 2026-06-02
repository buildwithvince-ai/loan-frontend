// Minimal .env loader for E2E creds — avoids adding a dotenv dependency.
// Reads e2e/.env.e2e (gitignored) into process.env without overwriting existing vars.
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const file = path.join(__dirname, '.env.e2e')
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

module.exports = { loadEnv }
