# Gulf Taxis Dispatch Cloud - GitHub Actions CI/CD to Hostinger Guide

This guide details how to configure and execute automatic continuous deployment from your private GitHub repository to Hostinger Shared Hosting (Business, Cloud, or Premium).

---

## 1. Overview

```
[Developer / Dispatch Team]
           │
           ▼ (git push origin main)
[Private GitHub Repo: gulf-taxis-dispatch-cloud]
           │
           ▼
[GitHub Actions CI/CD: .github/workflows/deploy.yml]
  ├── Step 1: PHP 8.2 Syntax Validation (php -l)
  ├── Step 2: TypeScript & ESLint Integrity Check
  ├── Step 3: Pre-Flight Package Validator (scripts/validate-package.js)
  ├── Step 4: React SPA Static Compilation (Vite -> dist/)
  ├── Step 5: Clean Payload Assembly (No node_modules, no .env)
  ├── Step 6: Secure FTPS/SFTP Sync to Hostinger public_html
  ├── Step 7: Safe Database Migration Runner (/api/v1/admin/migrate)
  └── Step 8: Post-Deployment Health Check Probe (/api/v1/health)
           │
           ▼
[Hostinger Shared Hosting (No Node.js Server Required)]
  ├── public_html/ (index.html, assets/, .htaccess, api/index.php)
  ├── backend/ (PHP 8.2+ Controllers, Config, Middleware)
  ├── database/migrations/ (Versioned SQL migrations)
  └── MySQL / MariaDB (All bookings, drivers & users preserved!)
```

---

## 2. Step 1: Create & Push to Private GitHub Repository

Run these commands on your workstation terminal:

```bash
# 1. Initialize git if not already initialized
git init

# 2. Add all project files
git add .

# 3. Create your initial commit
git commit -m "feat: complete Hostinger-ready Gulf Taxis Dispatch Cloud with CI/CD"

# 4. Set main branch
git branch -M main

# 5. Create a new PRIVATE repository on GitHub:
# Go to https://github.com/new -> Name: gulf-taxis-dispatch-cloud -> Select "Private" -> Click "Create repository"

# 6. Add remote origin and push
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/gulf-taxis-dispatch-cloud.git
git push -u origin main
```

---

## 3. Step 2: Retrieve Hostinger FTP / SFTP Credentials

1. Log in to **Hostinger hPanel** (https://hpanel.hostinger.com).
2. Select your website/domain.
3. Under **Files**, click **FTP Accounts** (or **SSH Access** if using SFTP).
4. You will see:
   - **FTP Host / Server**: e.g., `ftp.yourdomain.com` or `185.199.110.153`
   - **FTP Username**: e.g., `u123456789`
   - **FTP Password**: Click "Change password" to set a strong password.
   - **Port**: `21` (for FTPS) or `65002` (if using Hostinger SSH/SFTP).
   - **Directory**: `/public_html` or `/home/u123456789/domains/yourdomain.com/public_html/`.

---

## 4. Step 3: Configure GitHub Repository Secrets

In your GitHub repository:
1. Go to **Settings** -> **Secrets and variables** -> **Actions**.
2. Click **New repository secret** and add the following secrets:

| Secret Name | Required? | Example Value | Description |
|---|---|---|---|
| `HOSTINGER_SERVER` | **Yes** | `ftp.yourdomain.com` | Hostinger FTP/SFTP host address |
| `HOSTINGER_USERNAME` | **Yes** | `u123456789` | Hostinger FTP username |
| `HOSTINGER_PASSWORD` | **Yes** | `••••••••••••` | Hostinger FTP password |
| `HOSTINGER_REMOTE_PATH`| No (defaults to `public_html/`) | `public_html/` | Target folder for web assets |
| `HOSTINGER_PROTOCOL` | No (defaults to `ftps`) | `ftps` | Transfer protocol (`ftps` or `sftp`) |
| `HOSTINGER_PORT` | No (defaults to `21`) | `21` | Port (21 for FTPS, 65002 for Hostinger SFTP) |
| `PRODUCTION_URL` | **Yes** | `https://yourdispatchdomain.com` | Live website domain with HTTPS |
| `DEPLOY_MIGRATION_TOKEN` | Recommended | `gt_mig_98f4a12c8b74` | Secret string for automated DB migrations |

---

## 5. Step 4: First-Time Setup vs. Continuous Deployments

### The First Deployment:
1. When you push to `main`, GitHub Actions uploads all frontend assets and backend PHP files.
2. Visit `https://yourdispatchdomain.com/setup.php` in your browser.
3. Enter your Hostinger MySQL Database name, user, and password.
4. The wizard creates the database tables, applies initial seed drivers and vehicles, creates your Master Administrator, and creates `setup.lock`.
5. In your Hostinger File Manager, delete `setup.php` for security.

### All Future Deployments:
- Every time you push or merge a pull request to `main`:
  1. The workflow runs automated tests and package verification.
  2. It compiles the React frontend.
  3. It syncs updated static assets and PHP controllers to Hostinger.
  4. **Preserves your production MySQL database!** Existing bookings, drivers, assignments, and audit logs are never dropped or overwritten.
  5. **Preserves `config/db_credentials.php`!** The exclusion list prevents overwriting database passwords.
  6. **Runs pending versioned SQL migrations automatically** using `DEPLOY_MIGRATION_TOKEN`.
  7. **Performs an automated health check probe** to verify that `/api/v1/health` is responding with HTTP 200.

---

## 6. Concurrency Protection & Deployment Safety

- The workflow specifies:
  ```yaml
  concurrency:
    group: hostinger-production-deploy
    cancel-in-progress: false
  ```
- This ensures that if multiple developers push simultaneously, GitHub Actions processes them sequentially without canceling an in-flight deployment or corrupting files on the server.

---

## 7. Rollback Procedure

If a faulty release is deployed to production:

### Method 1: Instant GitHub Revert (Recommended)
1. Go to your local git repository:
   ```bash
   git revert HEAD
   git push origin main
   ```
2. GitHub Actions will automatically re-compile and deploy the previous known good state.

### Method 2: Re-run Previous Workflow
1. In GitHub, navigate to the **Actions** tab.
2. Select the previous successful deployment run.
3. Click **Re-run all jobs**.

### Method 3: Emergency Manual Upload (Fail-safe)
1. Open the application web UI -> click **Hostinger Deploy** tab.
2. Click **Download Ready-to-Upload Hostinger ZIP**.
3. Upload the ZIP into Hostinger File Manager and extract to `public_html`.
