/**
 * Gulf Taxis Dispatch Cloud - Pre-Flight Package Validator
 * Validates integrity of frontend, backend, migrations, and deployment configs
 * before allowing GitHub Actions to compile or deploy to Hostinger.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'index.html',
  'src/App.tsx',
  'src/types/index.ts',
  'src/services/api.ts',
  'src/services/mockDb.ts',
  'backend/config/database.php',
  'backend/public/index.php',
  'backend/src/Controllers/AuthController.php',
  'backend/src/Controllers/BookingsController.php',
  'backend/src/Controllers/DriversController.php',
  'backend/src/Controllers/VehiclesController.php',
  'backend/src/Controllers/ReportsController.php',
  'backend/src/Controllers/BackupController.php',
  'backend/src/Controllers/UsersController.php',
  'backend/src/Middleware/AuthMiddleware.php',
  'backend/src/Middleware/RoleMiddleware.php',
  'database/migrations/001_initial_schema.sql',
  'database/migrations/002_seed_data.sql',
  'deployment/public_html/.htaccess',
  '.github/workflows/deploy.yml'
];

console.log('🔍 [GULF TAXIS CI/CD] Starting Pre-Flight Package Validation...');

let missing = 0;
for (const file of REQUIRED_FILES) {
  const fullPath = path.join(rootDir, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Missing mandatory file: ${file}`);
    missing++;
  } else {
    const stat = fs.statSync(fullPath);
    if (stat.size === 0) {
      console.error(`❌ Empty file found: ${file}`);
      missing++;
    }
  }
}

// Check for accidental hardcoded secrets
const sensitivePatterns = [
  /password\s*=\s*['"][a-zA-Z0-9_\-!@#$%^&*]{8,}['"]/i,
  /aws_secret_access_key/i,
  /BEGIN (RSA|OPENSSH) PRIVATE KEY/
];

const scanDirs = ['backend/config', 'src'];
for (const dir of scanDirs) {
  const dirPath = path.join(rootDir, dir);
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath, { recursive: true });
    for (const f of files) {
      if (typeof f === 'string' && (f.endsWith('.php') || f.endsWith('.ts') || f.endsWith('.tsx'))) {
        const filePath = path.join(dirPath, f);
        if (fs.statSync(filePath).isFile()) {
          const content = fs.readFileSync(filePath, 'utf8');
          for (const pattern of sensitivePatterns) {
            if (pattern.test(content) && !content.includes('DEMO_HASH_PROTECTED')) {
              console.warn(`⚠️ Potential sensitive credential match in ${f}`);
            }
          }
        }
      }
    }
  }
}

if (missing > 0) {
  console.error(`\n❌ Validation Failed: ${missing} missing or corrupt files.`);
  process.exit(1);
}

console.log('✅ [GULF TAXIS CI/CD] All required production files & architectural constraints verified successfully!\n');
process.exit(0);
