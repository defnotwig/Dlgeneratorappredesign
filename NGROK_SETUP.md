# ngrok Setup Guide (5 Minutes)

## Step 1: Create Free Account

1. Go to: https://dashboard.ngrok.com/signup
2. Sign up with email or Google account (FREE - no credit card needed)

## Step 2: Get Your Authtoken

1. After signup, you'll see: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2abc123xyz_456abc789def`)

## Step 3: Configure ngrok

Run this in PowerShell:

```powershell
cd C:\ngrok
.\ngrok config add-authtoken YOUR_TOKEN_HERE
```

Replace `YOUR_TOKEN_HERE` with your actual token.

## Step 4: Start Tunnel

```powershell
.\ngrok http 8000
```

You'll see:

```
Session Status                online
Forwarding                    https://abc-123-xyz.ngrok-free.app -> http://localhost:8000
```

## Step 5: Copy the URL

Copy the `https://` URL and use it in Lark Developer Console.

---

## ✅ Done!

Your tunnel is now public and Lark can reach it.
