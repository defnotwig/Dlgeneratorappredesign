# Quick Fix for Message Card Builder

## 1. Fix the Image Error

**Remove the image section:**

1. In Message Card Builder, click on the "Signature Preview:" image
2. Press Delete or click trash icon
3. Save the card

**Your card structure should be:**

```
┌─────────────────────────────────────────┐
│ 📋 Approval Request for Signature...   │
├─────────────────────────────────────────┤
│ 🤖 Request Type: {{request_type}}      │
│ 📅 Request Date: {{request_date}}      │
│ 👤 Requested By: {{requested_by}}      │
│ ⏱️ Validity Period: {{validity_period}}│
│ 📝 Purpose: {{purpose}}                │
│ 🆔 Signature ID: {{signature_id}}      │
├─────────────────────────────────────────┤
│ [✅ Approve]  [❌ Reject]              │
└─────────────────────────────────────────┘
```

## 2. Get Template ID

After fixing and saving:

1. Click **"Save and Publish"** (top right blue button)
2. Find your card in the list
3. Click the **three dots (•••)** next to the card name
4. Select **"Copy Card ID"**
5. Paste it somewhere - it looks like: `ctp_AAvgGU12h2wF9`

## 3. Use in DL Generator

1. Open: http://localhost:3001
2. Go to Signature Config
3. Click "Lark Setup"
4. Paste the Template ID: `ctp_xxxxx`
5. Save

## Note about Images

Lark Message Cards can't use external URLs directly. To show images, you'd need to:

- Upload image to Lark's image service
- Get image_key from Lark
- Use that key in the card

This is complex, so we're removing the image for now. The card will still work perfectly for approvals!
