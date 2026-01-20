# 📸 Complete Guide: Signature Image in Lark Approval Cards

## Overview

This guide shows you how to configure your Lark Message Card to display the signature image preview when sending approval requests from the DL Generator.

**How it works:**

1. When you upload a signature in DL Generator, the backend automatically uploads it to Lark
2. Lark returns an `image_key` that's stored in the database
3. When sending approval request, the `image_key` is passed as a template variable
4. Your Message Card displays the image using this key

---

## Step 1: Configure Message Card Builder (10 minutes)

### 1.1 Open Message Card Builder

1. Go to https://open.larksuite.com/
2. Click on your **DL Generator** app
3. Click **"Message Card Builder"** in the left menu

### 1.2 Create/Edit Your Approval Card

**Card Structure:**

```
┌─────────────────────────────────────────┐
│  📋 DL Signature Approval Request       │
├─────────────────────────────────────────┤
│  [Signature Image Preview]              │ ← Add Image component
│                                         │
│  Request Type: {{request_type}}         │
│  Request Date: {{request_date}}         │
│  Requested By: {{requested_by}}         │
│  Validity Period: {{validity_period}}   │
│  Purpose: {{purpose}}                   │
│  Signature ID: {{signature_id}}         │
│                                         │
│  [ ✅ Approve ]  [ ❌ Reject ]           │
└─────────────────────────────────────────┘
```

### 1.3 Add Image Component

**Step-by-step:**

1. **Add Image Element**

   - Drag **"Image"** component from left panel into your card
   - Place it near the top after the header

2. **Configure Image Source**

   - Click on the image component
   - In the right panel, find **"Image Key"** or **"Image Source"**
   - Select **"Variable"** mode (not Static)
   - Enter variable name: `{{signature_image_key}}`

3. **Set Image Properties**
   - **Mode**: `fit_horizontal` (recommended)
   - **Alt Text**: `Signature Preview`
   - **Size**: Medium or Large
   - **Corner Radius**: Optional (4-8px for rounded corners)

### 1.4 Add Other Components

**Info Fields (use Form Field or Text components):**

- Request Type: `{{request_type}}`
- Request Date: `{{request_date}}`
- Requested By: `{{requested_by}}`
- Validity Period: `{{validity_period}}`
- Purpose: `{{purpose}}`
- Signature ID: `{{signature_id}}`

**Action Buttons:**

1. **Approve Button:**

   - Text: "✅ Approve"
   - Type: Primary
   - Behavior: Open URL
   - URL: `https://subdistichously-unexploitative-benito.ngrok-free.dev/api/lark/approval/approve/{{signature_id}}`

2. **Reject Button:**
   - Text: "❌ Reject"
   - Type: Danger
   - Behavior: Open URL
   - URL: `https://subdistichously-unexploitative-benito.ngrok-free.dev/api/lark/approval/reject/{{signature_id}}`

### 1.5 Save and Get Template ID

1. Click **"Save and Publish"**
2. Click the three dots (•••) menu
3. Select **"Copy Card ID"**
4. Template ID format: `ctp_xxxxxxxxxxxxx`
5. **Save this ID** - you'll need it in the next step!

---

## Step 2: Configure DL Generator (5 minutes)

### 2.1 Open Lark Setup

1. Open DL Generator at http://localhost:3001
2. Go to **"Signature Config"** page
3. Click **"Lark Setup"** button

### 2.2 Enter Credentials

You need **4 pieces of information**:

| Field                 | Where to Find                                                    | Example                          |
| --------------------- | ---------------------------------------------------------------- | -------------------------------- |
| **App ID**            | Lark Developer Console → DL Generator → Credentials & Basic Info | `cli_a1234567890abcd`            |
| **App Secret**        | Same location (click "Show" to reveal)                           | `abcdefghij1234567890ABCDEFGHIJ` |
| **Template ID**       | From Step 1.5 above                                              | `ctp_xxxxxxxxxxxxxxx`            |
| **User ID (open_id)** | Lark Developer Console → API Testing → Get User Info             | `ou_xxxxxxxxxxxxx`               |

### 2.3 How to Find Your User ID (open_id)

**Method 1: API Testing**

1. Go to https://open.larksuite.com/
2. Click **"API Testing"** in left menu
3. Search for **"Get user info"** (`/contact/v3/users/:user_id`)
4. Click **"Test"**
5. Look for `"open_id": "ou_xxxxx"` in response

**Method 2: From Lark App**

1. Open Lark desktop/mobile app
2. Click your profile picture
3. Click **"Copy User ID"** (if available)

### 2.4 Save Configuration

1. Paste all 4 values into DL Generator's Lark Setup
2. Click **"Save Configuration"**
3. Wait for success message: ✅ Configuration saved!

---

## Step 3: Configure Lark Webhook (3 minutes)

### 3.1 Add Event Subscription

1. Go to https://open.larksuite.com/
2. Click **DL Generator** app
3. Click **"Event Subscriptions"** in left menu
4. Click **"Add Request URL"**

### 3.2 Enter Webhook URL

```
https://subdistichously-unexploitative-benito.ngrok-free.dev/api/lark/webhook/button-callback
```

**Important:**

- Make sure your backend is running
- Make sure ngrok tunnel is active
- Click "Verify" - should show green checkmark

### 3.3 Subscribe to Event

1. Click **"Add Event"**
2. Search for: `card.action.trigger`
3. Select it
4. Click **"Save"**

---

## Step 4: Test Everything (5 minutes)

### 4.1 Verify Backend is Running

Open PowerShell and check:

```powershell
# Check if backend is running
curl http://localhost:8000/api/lark/scheduler/status
```

Expected output:

```json
{
  "running": true,
  "nextSunday": "2026-01-18T09:00:00+00:00"
}
```

### 4.2 Test Connection

1. In DL Generator → Signature Config → Lark Setup
2. Click **"Test Connection"**
3. Check your Lark app - you should receive a text message

### 4.3 Upload Signature and Send Request

**Option A: Test with Existing Signature**

1. Go to Signature Config
2. Click **"Send Test Approval Request"**
3. Check your Lark app

**Option B: Upload New Signature**

1. Upload a signature image (PNG/JPG)
2. Click **"Request Approval"**
3. Check your Lark app

### 4.4 Verify Image Displays

In your Lark message, you should see:

- ✅ **Signature image preview** at the top
- ✅ All request details (type, date, requested by, etc.)
- ✅ Two working buttons (Approve/Reject)

**What happens behind the scenes:**

1. DL Generator uploads signature to Lark → gets `image_key`
2. Stores `image_key` in database
3. Sends approval card with `signature_image_key` variable
4. Lark displays the image using the key

---

## Step 5: Click Buttons and Verify (2 minutes)

### 5.1 Click Approve Button

1. Click **"✅ Approve"** in Lark message
2. Check backend logs - should show:
   ```
   📥 Received Lark webhook: card.action.trigger
   🎯 Processing approve for signature_id=1
   ✅ Signature approved!
   ```

### 5.2 Verify in DL Generator

1. Go back to Signature Config page
2. Check **"Approval Requests"** table
3. Status should change from "Pending" → "Approved"
4. **"Signature Asset Active"** banner should appear at top

---

## Troubleshooting

### ❌ Image Not Showing in Card

**Possible Causes:**

1. **Image key variable name mismatch**

   - In Message Card Builder, variable must be exactly: `{{signature_image_key}}`
   - In backend, variable is: `signature_image_key`

2. **Image not uploaded to Lark**

   - Check backend logs when sending request
   - Look for: `✅ Signature image uploaded to Lark: img_xxxxx`
   - If missing, check signature file path exists

3. **Image component set to Static instead of Variable**

   - In Message Card Builder, click image
   - Make sure **"Image Source"** is set to **"Variable"** mode
   - Not "Static" or "URL"

4. **Database column missing**
   - Run this to verify:
   ```powershell
   cd backend
   python -c "from app.database import SignatureAsset; print(SignatureAsset.lark_image_key)"
   ```

### ❌ Error: "Failed to upload image"

**Check:**

1. Signature file exists at the path in database
2. File is valid image (PNG/JPG)
3. File size < 10MB
4. App has `im:image:create` permission in Lark

### ❌ Buttons Don't Work

**Verify:**

1. ngrok tunnel is active (check terminal)
2. Webhook URL is correct in Event Subscriptions
3. Event `card.action.trigger` is subscribed
4. Button URLs include correct ngrok domain

---

## Template Variables Reference

The backend sends these 7 variables:

| Variable Name             | Example Value                          | Description                         |
| ------------------------- | -------------------------------------- | ----------------------------------- |
| `request_type`            | `🤖 AUTO`                              | Type of request (AUTO/MANUAL/RETRY) |
| `request_date`            | `Wednesday, January 15, 2026 02:30 PM` | When request was sent               |
| `requested_by`            | `Rivera, Gabriel Ludwig R.`            | Who requested approval              |
| `validity_period`         | `1 Week (January 20 - January 24)`     | How long signature is valid         |
| `purpose`                 | `DL Generation`                        | What signature will be used for     |
| `signature_id`            | `1`                                    | Database ID (for button callbacks)  |
| **`signature_image_key`** | `img_v3_027t_xxxxx`                    | **Lark image key for preview**      |

**Use in Message Card Builder:**

```
{{request_type}}
{{request_date}}
{{requested_by}}
{{validity_period}}
{{purpose}}
{{signature_id}}
{{signature_image_key}}  ← Use this for the Image component
```

---

## Testing Checklist

- [ ] Message Card Builder configured with image component
- [ ] Image component uses variable: `{{signature_image_key}}`
- [ ] Template ID copied and saved in DL Generator
- [ ] All 4 credentials entered in Lark Setup
- [ ] Webhook URL configured in Event Subscriptions
- [ ] Event `card.action.trigger` subscribed
- [ ] Backend running on port 8000
- [ ] ngrok tunnel active
- [ ] Test Connection works (receives text message)
- [ ] Send approval request
- [ ] **Signature image displays in Lark card** ✨
- [ ] All request details show correctly
- [ ] Approve button works
- [ ] Reject button works
- [ ] Database updates on button click
- [ ] Audit log created

---

## Summary

**Complete Workflow:**

```
1. User uploads signature in DL Generator
   ↓
2. Backend automatically uploads to Lark → gets image_key
   ↓
3. image_key stored in database (signature_assets.lark_image_key)
   ↓
4. When sending approval request:
   - Backend includes signature_image_key in template variables
   ↓
5. Lark Message Card displays image using the key
   ↓
6. Attorney sees signature preview + all details
   ↓
7. Attorney clicks Approve/Reject button
   ↓
8. Webhook triggers → Database updates → Done!
```

**Key Points:**

- ✅ Signature image automatically uploaded to Lark
- ✅ Image displays using Lark's image_key (not external URL)
- ✅ No manual image upload needed
- ✅ Works with Message Card Builder templates
- ✅ Fully automated workflow

---

## Need Help?

**Backend Logs:**

```powershell
# Check if image uploaded successfully
cd backend
# Look for this in logs:
# ✅ Signature image uploaded to Lark: img_v3_027t_xxxxx
```

**Database Check:**

```powershell
cd backend
python
>>> from app.database import async_session, SignatureAsset
>>> from sqlalchemy import select
>>> import asyncio
>>> async def check():
...     async with async_session() as session:
...         result = await session.execute(select(SignatureAsset))
...         for sig in result.scalars():
...             print(f"ID: {sig.id}, Image Key: {sig.lark_image_key}")
>>> asyncio.run(check())
```

**All Systems Ready? ✅**

- Backend running ✅
- ngrok active ✅
- Credentials configured ✅
- Message Card created ✅
- Webhook configured ✅

**→ You're ready to send approval requests with signature image previews! 🎉**
