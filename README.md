# GULF TAXIS DISPATCH CLOUD

A complete, modern, enterprise-grade cloud transport dispatch management system tailored for Hostinger shared hosting, VPS, or cloud hosting.

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS (compiled into static HTML, CSS, and JS).
- **Backend**: PHP 8.2+ REST API with PDO prepared statements and secure server-side sessions.
- **Database**: MySQL 8.0+ / MariaDB 10.5+ with InnoDB, foreign keys, utf8mb4 encoding, and transactional consistency.
- **Production Server**: **NO Node.js required in production.** Deploys directly to Hostinger `public_html` with Apache `.htaccess` routing.

---

## 1. Core Architectural Guarantees

1. **Login Page Must Open First**:
   - Access to unauthenticated sessions redirects immediately to the login portal.
   - Zero bookings, customer data, or dispatch details are exposed before authentication.
2. **Role-Based Access Control (RBAC)**:
   - **Administrator**: Full root access, user permissions, backup creation & downloads, audit trails, and system settings.
   - **Dispatcher**: Operational dispatching, driver & vehicle allocations, scheduling conflict overrides, status updates.
   - **Booking Agent**: Create bookings, search reservations, edit authorized fields, print passenger vouchers.
3. **Dispatch Board Mandatory Column Order**:
   - `Pickup Date` | `Pickup Time` | `Booking Reference` | `Flight Number` | `Vehicle Type` | `Passenger Name` | `Passenger Phone` | `Pickup Location` | `Drop-off Location` | `Pax/Luggage` | `Assigned Driver` | `Status` | `Actions`
   - *Vehicle Type appears immediately after Flight Number as required.*
4. **All 8 Configurable Vehicle Types Supported**:
   - Sedan, Business Sedan, SUV, GMC, Minivan, Van, Coaster, Bus.
5. **Conflict Prevention & Capacity Validation**:
   - Automated detection if a chauffeur is scheduled within 2 hours of another trip.
   - Warning if passenger or luggage count exceeds vehicle seating or boot limits.
6. **Optimistic Concurrency Protection**:
   - Prevents simultaneous dispatchers from silently overwriting each other's updates.
7. **Disaster Recovery**:
   - Administrator-authenticated SQL database dump generation with step-by-step instructions for cold storage to `D:\` on Windows.

---

## 2. Hostinger Shared Hosting Deployment Guide

### Option A: Ready-to-Upload ZIP Package (Easiest)
1. Open the application and go to the **Hostinger Deploy** tab.
2. Click **Download Ready-to-Upload Hostinger ZIP**.
3. In Hostinger hPanel:
   - Navigate to **Databases** -> **Management** -> create a new MySQL database and user. Note down the Database Name, Username, and Password.
   - Ensure PHP version is set to 8.2 or 8.3 under **Advanced** -> **PHP Configuration**.
   - Navigate to **Files** -> **File Manager** -> open `public_html`.
   - Upload the extracted contents into `public_html`.
4. In your browser, open:
   `https://yourdispatchdomain.com/setup.php`
5. Enter your Hostinger MySQL Database credentials and choose your Master Administrator password.
6. The setup wizard automatically executes `001_initial_schema.sql` and `002_seed_data.sql`, provisions the database, and locks itself.
7. Delete `setup.php` from `public_html` via File Manager for security.
8. Visit `https://yourdispatchdomain.com` to log in!

### Option B: GitHub Deployment with GitHub Actions
1. Initialize your private GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "feat: initial Gulf Taxis Dispatch Cloud codebase"
   git branch -M main
   git remote add origin https://github.com/YOUR_ACCOUNT/gulf-taxis-dispatch-cloud.git
   git push -u origin main
   ```
2. The included `.github/workflows/deploy.yml` workflow automatically runs on push, compiles the React frontend with Vite, and produces the `gulf-taxis-dispatch-cloud-hostinger.zip` artifact ready for download or automated webhook deployment.

---

## 3. REST API Endpoints (`/api/v1/`)

| Method | Endpoint | Description | Role Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health check & DB connection prober | Public |
| `POST` | `/api/v1/auth/login` | Session login with rate limiting | Public |
| `POST` | `/api/v1/auth/logout` | Session invalidation | Authenticated |
| `GET` | `/api/v1/auth/me` | Fetch active user profile & CSRF token | Authenticated |
| `POST` | `/api/v1/auth/forgot-password` | Generate reset token | Public |
| `POST` | `/api/v1/auth/reset-password` | Verify token & update password | Public |
| `GET` | `/api/v1/bookings` | List trips with pagination, search & filters | Authenticated |
| `POST` | `/api/v1/bookings` | Create new reservation (with dup check) | Agent / Disp / Admin |
| `GET` | `/api/v1/bookings/{id}` | Detailed booking view & assignment log | Authenticated |
| `PATCH` | `/api/v1/bookings/{id}` | Update booking with concurrency control | Agent / Disp / Admin |
| `POST` | `/api/v1/bookings/{id}/assign` | Assign driver & vehicle with conflict check | Dispatcher / Admin |
| `POST` | `/api/v1/bookings/{id}/status` | Transition trip status | Dispatcher / Admin |
| `GET` | `/api/v1/drivers` | Chauffeur roster & duty status | Authenticated |
| `POST` | `/api/v1/drivers` | Register new driver | Dispatcher / Admin |
| `PATCH` | `/api/v1/drivers/{id}` | Update driver details or duty status | Dispatcher / Admin |
| `GET` | `/api/v1/vehicles` | Fleet vehicle list and availability | Authenticated |
| `POST` | `/api/v1/vehicles` | Add vehicle to fleet | Dispatcher / Admin |
| `PATCH` | `/api/v1/vehicles/{id}` | Update vehicle maintenance notes | Dispatcher / Admin |
| `GET` | `/api/v1/reports/daily` | Daily KPI summary, vehicle & hourly stats | Authenticated |
| `GET` | `/api/v1/reports/drivers` | Driver performance and completed trips | Authenticated |
| `GET` | `/api/v1/reports/vehicles` | Fleet utilization report | Authenticated |
| `GET` | `/api/v1/admin/backups` | List verified database SQL backups | Administrator Only |
| `POST` | `/api/v1/admin/backups` | Generate genuine database SQL dump | Administrator Only |
| `GET` | `/api/v1/admin/backups/download` | Authenticated download of backup file | Administrator Only |
| `GET` | `/api/v1/admin/users` | List system users | Administrator Only |
| `POST` | `/api/v1/admin/users` | Create user with assigned role | Administrator Only |
| `GET` | `/api/v1/admin/audit-logs` | Review cryptographic security audit trail | Administrator Only |

---

## 4. Default Demo Credentials (for testing preview)

- **Administrator**: `admin` / `dispatch2026` (or click "Admin" on the login screen)
- **Dispatcher**: `dispatcher` / `dispatch2026` (or click "Dispatcher" on the login screen)
- **Booking Agent**: `agent` / `dispatch2026` (or click "Agent" on the login screen)

---

## 5. Security Architecture

- Passwords hashed using standard PHP `PASSWORD_DEFAULT` (bcrypt / Argon2).
- Strict PDO prepared statements with `PDO::ATTR_EMULATE_PREPARES => false`.
- Server-side rate limiting on authentication attempts.
- HTTP-only, Secure, SameSite Lax session cookies.
- Cross-Site Request Forgery (CSRF) token generation and validation.
- All database credentials stored outside public document root or in restricted `db_credentials.php`.
- Complete immutable audit logging of logins, booking alterations, and backup events.
