# DL Generator v3.0 - Implementation Guide

**Complete Setup and Deployment Guide**  
_Focus: Signature Configuration, Lark Bot Integration, and Production Deployment_

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Development Environment Setup](#development-environment-setup)
3. [Database Initialization](#database-initialization)
4. [Lark Bot Configuration](#lark-bot-configuration)
5. [ngrok Webhook Setup](#ngrok-webhook-setup)
6. [Signature Upload and Approval Workflow](#signature-upload-and-approval-workflow)
7. [PyTorch GAN Handwriting Synthesis](#pytorch-gan-handwriting-synthesis)
8. [User Management and RBAC](#user-management-and-rbac)
9. [Production Deployment (AWS EC2)](#production-deployment-aws-ec2)
10. [Testing and Verification](#testing-and-verification)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Minimum Version | Purpose           |
| -------- | --------------- | ----------------- |
| Python   | 3.10+           | Backend runtime   |
| Node.js  | 18.x+           | Frontend build    |
| npm      | 9.x+            | Package manager   |
| Git      | 2.x+            | Version control   |
| ngrok    | Latest          | Webhook tunneling |

### Required Accounts

- ✅ Lark Developer Account (https://open.larksuite.com/)
- ✅ AWS Account (for production EC2 deployment)
- ✅ ngrok Free Account (for webhook URL)

### Hardware Requirements

**Development:**

- RAM: 8GB minimum (16GB recommended for PyTorch)
- CPU: 4 cores
- Storage: 20GB free space

**Production:**

- RAM: 16GB
- CPU: 4 cores
- Storage: 50GB (+100GB for future)
- Network: Static IP required

---

## Development Environment Setup

### Step 1: Clone Repository

```powershell
# Navigate to project directory
cd "C:\Users\Ludwig Rivera\Downloads\Dl Gen"
cd Dlgeneratorappredesign

# Verify structure
dir
```

**Expected Output:**

```
backend/
src/
sign/
package.json
vite.config.ts
```

### Step 2: Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment (recommended)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

**Key Dependencies (requirements.txt):**

```txt
# Core
fastapi==0.115.0
uvicorn[standard]==0.30.6
python-multipart==0.0.9
aiofiles==24.1.0

# Database
aiosqlite==0.20.0
sqlalchemy==2.0.35

# PyTorch for GAN handwriting generation
torch>=2.0.0
torchvision>=0.15.0
numpy>=1.24.0
Pillow>=10.0.0
opencv-python>=4.8.0

# HTTP client for Lark Bot
httpx==0.27.2
aiohttp==3.10.5

# Utilities
python-dotenv==1.0.1
pydantic==2.9.2
pydantic-settings==2.5.2
cryptography==43.0.1

# Image processing
scikit-image==0.24.0
scipy==1.14.1
matplotlib==3.9.2
```

### Step 3: Frontend Setup

```powershell
# Open new terminal
cd Dlgeneratorappredesign

# Install dependencies
npm install
```

**Key Dependencies (package.json):**

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@radix-ui/react-dialog": "^1.1.6",
    "@radix-ui/react-select": "^2.1.6",
    "@radix-ui/react-tabs": "^1.1.3",
    "lucide-react": "^0.487.0",
    "tailwind-merge": "*",
    "clsx": "*",
    "sonner": "^2.0.3",
    "recharts": "^2.15.2"
  },
  "devDependencies": {
    "vite": "6.3.5",
    "@vitejs/plugin-react-swc": "^3.10.2",
    "typescript": "^5.x"
  }
}
```

### Step 4: Environment Configuration

Create `backend/.env`:

```env
# Database
DATABASE_URL=sqlite:///./database/dl_generator.db

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# CORS Origins
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Lark Bot (configure after Lark setup)
LARK_WEBHOOK_URL=
LARK_SECRET_KEY=
LARK_VERIFICATION_TOKEN=

# Uvicorn
UVICORN_RELOAD=0
```

### Step 5: Start Development Servers

**Terminal 1: Backend**

```powershell
cd backend
python main.py
```

**Expected Output:**

```
Starting DL Generator Backend...
[OK] Database initialized
[OK] PyTorch Handwriting GAN model loaded
[OK] Lark preview cache cleared
[OK] Auto-approval scheduler started (runs every Sunday)
[OK] DL Generator Backend ready!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2: Frontend**

```powershell
npm run dev
```

**Expected Output:**

```
VITE v6.3.5  ready in 1234 ms
➜  Local:   http://localhost:3000/
➜  Network: use --host to expose
```

---

## Database Initialization

### Automatic Initialization

The database is created automatically on first run with:

**Default Admin User:**

- Email: admin@spmadridlaw.com
- Name: Rivera, Gabriel Ludwig R.
- Access Level: Administrator
- Assigned Clients: BPI, EON BANK, USB PLC, BPI BANKO, CITIBANK, HSBC

**Default Handwriting Styles:**

- Natural Cursive (Caveat font)
- Formal Script (Dancing Script font)
- Casual Hand (Indie Flower font)

### Verify Database

```powershell
cd backend
python list_tables.py
```

**Expected Tables:**

- ✅ users
- ✅ user_clients
- ✅ signature_assets
- ✅ signature_approval_requests
- ✅ lark_bot_config
- ✅ lark_event_dedupe
- ✅ lark_recipients
- ✅ lark_approval_messages
- ✅ templates
- ✅ dl_generation_jobs
- ✅ audit_logs
- ✅ handwriting_styles
- ✅ generated_dates

### Manual Database Check

```powershell
cd backend
python check_db.py
```

This will display:

- Total users
- Total signatures
- Total approval requests
- Lark bot config status

---

## Lark Bot Configuration

### Step 1: Create Lark App

1. Go to Lark Developer Console: https://open.larksuite.com/
2. Click **"Create App"** → **"Custom App"**
3. Fill in details:
   - App Name: `DL Generator`
   - Description: `Signature approval bot for DL Generator`
   - App Icon: Upload logo (optional)
4. Click **"Create"**

### Step 2: Enable Bot Capability

1. In left sidebar, click **"Features & Capabilities"**
2. Find **"Bot"** and toggle to **"Enabled"**
3. Set Bot Name: `DL Generator Bot`
4. Click **"Save"**

### Step 3: Add Required Permissions

Click **"Permissions & Scopes"** in left sidebar and enable:

**Message Scopes:**

- ✅ `im:message` - Send messages
- ✅ `im:message:send_as_bot` - Send messages as bot
- ✅ `im:chat` - Access chat information

**Image Upload:**

- ✅ `im:image` - Upload images
- ✅ `im:resource` - Upload resources

**User Info (Optional):**

- ✅ `contact:user.base:readonly` - Get user basic info
- ✅ `contact:user.email:readonly` - Get user email

Click **"Save"** and **"Request Approval"** if prompted.

### Step 4: Get Credentials

1. Click **"Credentials & Basic Info"** in left sidebar
2. Copy these values:
   - **App ID:** `cli_xxxxxxxxxxxxxxxxx`
   - **App Secret:** [Click "Show" to reveal]

**Get Your Open ID (User ID):**

Run the PowerShell script:

```powershell
cd Dlgeneratorappredesign
.\get_my_openid.ps1
```

Or manually find in Lark app: Profile → About → Open ID: `ou_xxxxxxxxxxxxxxxxx`

### Step 5: Configure in DL Generator

1. Open DL Generator: http://localhost:3000
2. Go to **"Signature Config"** page
3. Click **"Lark Setup"** button
4. Fill in the form:
   - App ID: `cli_xxxxxxxxxxxxxxxxx`
   - App Secret: [paste secret]
   - User ID: `ou_xxxxxxxxxxxxxxxxx`
5. Click **"Save Configuration"**

### Step 6: Test Connection

1. In Lark Setup dialog, click **"Test Connection"**
2. ✅ Success: Check your Lark app for test message
3. ❌ Failure: See [Troubleshooting](#troubleshooting)

---

## ngrok Webhook Setup

### Step 1: Install ngrok

1. Download: https://ngrok.com/download
2. Extract to `C:\ngrok\`
3. Sign up for free account
4. Get authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken

### Step 2: Configure ngrok

```powershell
cd C:\ngrok
.\ngrok config add-authtoken YOUR_TOKEN_HERE
```

### Step 3: Start Tunnel

```powershell
.\ngrok http 8000
```

**Expected Output:**

```
Session Status                online
Session Expires               1 hour, 59 minutes
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8000
```

✅ **Copy the HTTPS URL:** `https://abc123.ngrok-free.app`

### Step 4: Configure Lark Webhook

1. Go to Lark Developer Console → Your App
2. Click **"Event Subscriptions"** in left sidebar
3. Click **"Add Request URL"**
4. Enter webhook URL:
   ```
   https://abc123.ngrok-free.app/api/lark/webhook/button-callback
   ```
5. Click **"Verify"**
   - ✅ Backend must be running
   - ✅ ngrok must be active
   - Success: Green checkmark appears

### Step 5: Subscribe to Events

1. Click **"+ Add Event"**
2. Search for: `card`
3. Find and select: `card.action.trigger` (Button clicked)
4. Click **"Confirm"**

### Step 6: Publish Changes

1. Click **"Publish"** or **"Release Version"** at top
2. Select **"Current organization"**
3. Add version notes: `Enabled webhook for signature approval`
4. Click **"Publish"**
5. Wait 30 seconds for changes to take effect

---

## Signature Upload and Approval Workflow

### Upload Signature (Admin Only)

1. Go to http://localhost:3000
2. Navigate to **"Signature Config"**
3. Click **"Upload New Signature"**
4. Fill in the form:
   - File: [Select PNG/JPG image, max 5MB]
   - Validity Period: 1 Week (auto-calculated)
   - Purpose: DL Generation
   - Admin Message: [Optional note]
5. Click **"Upload"**
6. Status: **"Pending"** (awaiting approval)

### Manual Approval Request

1. In Signature Config, find the uploaded signature
2. Click **"Request Approval"**
3. Lark card is sent to configured User ID
4. Check Lark for interactive card

### Approve via Lark

1. Open Lark app (desktop or mobile)
2. Find message from "DL Generator Bot"
3. Review:
   - Request date and time (PH timezone)
   - Signature preview image
   - 5 handwritten date previews (Mon-Fri)
   - Validity period
4. Click **"APPROVE"** button
5. Card updates to show: ✅ "Approved"

### Verify Approval

1. Return to DL Generator → Signature Config
2. Refresh the page
3. Signature status should be: **"Approved"** ✅
4. Signature appears in "Active Signatures" section

---

## PyTorch GAN Handwriting Synthesis

### How It Works

The system uses custom handwritten digit images (`sign/datefont/`) for date rendering:

```python
# Triggered when signature is approved
handwriting_gan.composite_signature_with_custom_date(
    signature_path="/uploads/signatures/sig_xxx.png",
    date=datetime(2026, 1, 20),  # Monday
    output_width=400,
    output_height=160,
    date_font_height=22,
    rotation_deg=-8.0,
    date_rotation_deg=-20.0,
    dot_scale=0.55
)
```

### Datefont Images

Location: `sign/datefont/`

| File              | Content                |
| ----------------- | ---------------------- |
| `0.png`           | Handwritten zero       |
| `1.PNG` - `9.PNG` | Handwritten digits 1-9 |
| `dot.png`         | Period/dot separator   |

### Date Format

Format: `M.D.YY` (e.g., "1.26.26" for January 26, 2026)

### Generated Output

For a week (Mon-Fri), the system generates:

- Monday: 1.20.26
- Tuesday: 1.21.26
- Wednesday: 1.22.26
- Thursday: 1.23.26
- Friday: 1.24.26

Each date is rendered with:

- ✅ Custom handwritten digit images
- ✅ Container rotation (±8°)
- ✅ Date rotation within container (-20°)
- ✅ Dot scale adjustment (0.55)
- ✅ Signature overlap positioning

### Model Files

Location: `backend/app/services/handwriting_gan.py`

**Fallback Mode:** If PyTorch model fails to load, the system uses PIL (Pillow) with custom digit images as fallback.

### Check Status

```bash
curl http://localhost:8000/api/health
```

**Expected:**

```json
{
  "status": "ok",
  "service": "DL Generator API",
  "version": "1.0.0",
  "pytorch_available": true,
  "database": "connected"
}
```

---

## User Management and RBAC

### Create New User

**API Endpoint:**

```http
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "accessLevel": "User",
  "branch": "PITX",
  "clients": ["BPI", "EON BANK"]
}
```

**Via UI:**

1. Go to "User Management" page
2. Click "Add New User"
3. Fill in form and click "Save"

### Access Levels

| Level         | Permissions                                                                                  |
| ------------- | -------------------------------------------------------------------------------------------- |
| Administrator | Full access: Manage users, upload signatures, configure Lark bot, generate DLs for all banks |
| User          | Limited access: Generate DLs only for assigned banks, view audit logs                        |

### Assign Clients (Banks) to User

```http
POST /api/users/:id/clients
Content-Type: application/json

{
  "clients": ["BPI", "CITIBANK", "HSBC"]
}
```

**Available Clients:**

- BPI
- EON BANK
- USB PLC
- BPI BANKO
- CITIBANK
- HSBC

---

## Production Deployment (AWS EC2)

### Server Setup

**EC2 Instance:**

- Instance Type: `t3.medium` (2 vCPU, 4GB RAM minimum)
- OS: Ubuntu 22.04 LTS or Windows Server 2022
- Storage: 50GB SSD
- Security Group: Open ports 80, 443, 8000, 3389 (RDP)

### Deployment Steps

#### 1. Connect to EC2

```powershell
# Via RDP (Windows)
mstsc /v:172.20.0.86

# Via SSH (Linux)
ssh ubuntu@172.20.0.86
```

#### 2. Install Dependencies (Ubuntu)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10+
sudo apt install python3.10 python3-pip python3-venv -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Verify
python3 --version
node --version
npm --version
```

#### 3. Clone and Setup

```bash
# Clone repository
git clone https://github.com/yourorg/dl-generator.git
cd dl-generator/Dlgeneratorappredesign

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend build
cd ..
npm install
npm run build
```

#### 4. Configure Production Environment

Create `backend/.env`:

```env
DATABASE_URL=sqlite:///./database/dl_generator.db
HOST=0.0.0.0
PORT=8000
DEBUG=false
ALLOWED_ORIGINS=http://172.20.0.86,http://172.20.0.121
UVICORN_RELOAD=0
```

#### 5. Setup Systemd Service (Linux)

Create `/etc/systemd/system/dlgen-backend.service`:

```ini
[Unit]
Description=DL Generator Backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/dl-generator/Dlgeneratorappredesign/backend
Environment="PATH=/home/ubuntu/dl-generator/Dlgeneratorappredesign/backend/venv/bin"
ExecStart=/home/ubuntu/dl-generator/Dlgeneratorappredesign/backend/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable dlgen-backend
sudo systemctl start dlgen-backend
sudo systemctl status dlgen-backend
```

#### 6. Setup Nginx (Frontend)

Install Nginx:

```bash
sudo apt install nginx -y
```

Create `/etc/nginx/sites-available/dlgen`:

```nginx
server {
    listen 80;
    server_name 172.20.0.86;

    # Frontend (React build)
    location / {
        root /home/ubuntu/dl-generator/Dlgeneratorappredesign/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files (uploads)
    location /uploads/ {
        alias /home/ubuntu/dl-generator/Dlgeneratorappredesign/backend/uploads/;
    }

    # Sign folder (datefont images)
    location /sign/ {
        alias /home/ubuntu/dl-generator/Dlgeneratorappredesign/sign/;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/dlgen /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Testing and Verification

### Backend Health Check

```bash
curl http://localhost:8000/api/health
```

**Expected:**

```json
{
  "status": "ok",
  "service": "DL Generator API",
  "version": "1.0.0",
  "pytorch_available": true,
  "database": "connected"
}
```

### Frontend Accessibility

```bash
curl http://localhost:3000
```

**Expected:** HTML content with React app

### Lark Bot Test

1. Go to Signature Config → Lark Setup
2. Click "Test Connection"
3. ✅ Check Lark for test message: "🧪 Test message from DL Generator. Connection successful!"

### Approval Workflow Test

1. Upload signature
2. Request approval
3. Check Lark for card
4. Click Approve
5. Verify signature status changes to "Approved"

### DL Generation Test

1. Navigate to DL Generator page
2. Select bank: BPI
3. Upload Excel file with test data
4. Click "Generate DL"
5. ✅ Download ZIP or print directly

---

## Troubleshooting

### Issue: Backend Won't Start

**Symptoms:**

```
ImportError: No module named 'fastapi'
```

**Solution:**

```powershell
cd backend
pip install -r requirements.txt
python main.py
```

### Issue: Database Not Found

**Symptoms:**

```
sqlite3.OperationalError: unable to open database file
```

**Solution:**

```powershell
mkdir backend\database
python main.py  # Will auto-create database
```

### Issue: Lark Buttons Not Working

**Symptoms:** Clicking Approve/Reject does nothing

**Checklist:**

- ✅ ngrok is running?
- ✅ Webhook URL configured in Lark?
- ✅ Event `card.action.trigger` subscribed?
- ✅ Backend logs show webhook received?

**Debug:**

```powershell
# Check ngrok status
curl https://YOUR_NGROK_URL/api/health

# Check backend logs
# Look for: "📥 Received Lark webhook"
```

### Issue: Images Not Showing in Lark Cards

**Symptoms:** Signature preview is blank

**Solution:**

1. Check Lark permissions include `im:resource`
2. Verify `lark_image_key` is saved in database:
   ```powershell
   cd backend
   python check_db.py
   ```

### Issue: Timezone Showing UTC Instead of PH Time

**Symptoms:** Timestamps show wrong time

**Solution:**

1. Check `backend/app/utils/timezone.py` exists
2. Verify all dates use `get_ph_now()` function
3. Restart backend

### Issue: PyTorch Model Not Loading

**Symptoms:**

```
[WARN] Handwriting model loading failed (will use fallback)
```

**Solution:**

- Check PyTorch installation: `pip install torch>=2.0.0`
- For CPU-only: `pip install torch --index-url https://download.pytorch.org/whl/cpu`
- Fallback mode will still work with PIL

---

## Appendix: API Reference

### Core Endpoints

| Method | Endpoint                            | Description           |
| ------ | ----------------------------------- | --------------------- |
| GET    | `/api/health`                       | Health check          |
| GET    | `/api/signatures`                   | List signatures       |
| POST   | `/api/signatures`                   | Upload signature      |
| POST   | `/api/lark/send-approval`           | Send approval request |
| POST   | `/api/lark/webhook/button-callback` | Lark button callback  |
| GET    | `/api/audit`                        | View audit logs       |
| GET    | `/api/users`                        | List users            |
| POST   | `/api/users`                        | Create user           |

---

**Last Updated:** January 26, 2026  
**Version:** 3.0  
**Author:** Rivera, Gabriel Ludwig R.
