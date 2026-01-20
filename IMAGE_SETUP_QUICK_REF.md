# 🎯 Quick Reference: Message Card Builder Image Setup

## Image Component Configuration

### In Message Card Builder

**1. Add Image Component**

```
Drag "Image" element → Drop it in your card (near top)
```

**2. Configure Image Source**

```
┌─────────────────────────────────────┐
│ Image Settings                      │
├─────────────────────────────────────┤
│ Source Type: ● Variable  ○ Static   │ ← Select "Variable"
│                                     │
│ Variable Name: signature_image_key  │ ← Type this exactly
│                                     │
│ Alt Text: Signature Preview         │
│                                     │
│ Display Mode: ● Fit Horizontal      │
│               ○ Fit Vertical        │
│               ○ Crop Center         │
│                                     │
│ Size: ○ Small  ● Medium  ○ Large    │
└─────────────────────────────────────┘
```

### Variable Names (Must Match Exactly!)

In Message Card Builder, use these variable names:

| Component | Variable Name             | Notes                                |
| --------- | ------------------------- | ------------------------------------ |
| Image     | `{{signature_image_key}}` | **Changed from signature_image_url** |
| Text      | `{{request_type}}`        | Request type (AUTO/MANUAL/RETRY)     |
| Text      | `{{request_date}}`        | When request was sent                |
| Text      | `{{requested_by}}`        | Who requested approval               |
| Text      | `{{validity_period}}`     | Validity date range                  |
| Text      | `{{purpose}}`             | Purpose of signature                 |
| Text      | `{{signature_id}}`        | ID for button callbacks              |

---

## Complete Card Layout Example

```
┌──────────────────────────────────────────────┐
│  📋 DL Signature Approval Request            │  ← Header (Static Text)
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  [Signature Image Preview]           │   │  ← Image Component
│  │  Variable: signature_image_key       │   │     (Variable mode)
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Request Type                        │   │  ← Form Field (Label + Value)
│  │  {{request_type}}                    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Request Date                        │   │
│  │  {{request_date}}                    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Requested By                        │   │
│  │  {{requested_by}}                    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Validity Period                     │   │
│  │  {{validity_period}}                 │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Purpose                             │   │
│  │  {{purpose}}                         │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Signature ID                        │   │
│  │  {{signature_id}}                    │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────┐  ┌──────────┐               │
│  │ ✅ Approve│  │ ❌ Reject │               │  ← Buttons (Open URL)
│  └──────────┘  └──────────┘               │
└──────────────────────────────────────────────┘
```

---

## Button Configuration

### ✅ Approve Button

```
┌─────────────────────────────────────────────┐
│ Button Settings                             │
├─────────────────────────────────────────────┤
│ Text: ✅ Approve                            │
│                                             │
│ Type: ● Primary  ○ Default  ○ Danger        │
│                                             │
│ Action: Open URL                            │
│                                             │
│ URL: https://subdistichously-                │
│      unexploitative-benito.ngrok-free.dev/  │
│      api/lark/approval/approve/             │
│      {{signature_id}}                       │
│                                             │
│ ✓ Show confirmation dialog                  │
│   Message: "Approve this signature?"        │
└─────────────────────────────────────────────┘
```

### ❌ Reject Button

```
┌─────────────────────────────────────────────┐
│ Button Settings                             │
├─────────────────────────────────────────────┤
│ Text: ❌ Reject                             │
│                                             │
│ Type: ○ Primary  ○ Default  ● Danger        │
│                                             │
│ Action: Open URL                            │
│                                             │
│ URL: https://subdistichously-                │
│      unexploitative-benito.ngrok-free.dev/  │
│      api/lark/approval/reject/              │
│      {{signature_id}}                       │
│                                             │
│ ✓ Show confirmation dialog                  │
│   Message: "Reject this signature?"         │
└─────────────────────────────────────────────┘
```

---

## Key Differences: Old vs New

### ❌ OLD (External URL - Doesn't work in Lark)

```json
{
  "signature_image_url": "http://localhost:8000/uploads/signatures/sig.png"
}
```

**Problem:** Lark can't access external URLs for images

### ✅ NEW (Lark Image Key - Works!)

```json
{
  "signature_image_key": "img_v3_027t_abc123def456_xxxxx"
}
```

**Solution:** Backend uploads image to Lark first, gets image_key

---

## Backend Flow (Automatic)

```
┌─────────────────────────────────────────────────┐
│ User uploads signature in DL Generator         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ Backend: Check if signature.lark_image_key      │
│ exists in database                              │
└────────┬────────────────────────────────────────┘
         │
         ├─── NO image_key? ──────┐
         │                         ▼
         │              ┌─────────────────────────┐
         │              │ Upload to Lark:         │
         │              │ POST /im/v1/images      │
         │              └──────────┬──────────────┘
         │                         │
         │                         ▼
         │              ┌─────────────────────────┐
         │              │ Get image_key response  │
         │              │ Save to database        │
         │              └──────────┬──────────────┘
         │                         │
         └─────────────────────────┤
                                   ▼
         ┌─────────────────────────────────────────┐
         │ Send approval card with                 │
         │ signature_image_key variable            │
         └─────────────────────────────────────────┘
                                   │
                                   ▼
         ┌─────────────────────────────────────────┐
         │ Lark displays signature image using key │
         └─────────────────────────────────────────┘
```

---

## Testing Steps (Quick)

**1. Open Message Card Builder**

- Add Image component
- Set to Variable mode
- Enter: `signature_image_key`

**2. Add Form Fields**

- 6 fields with variables (request_type, request_date, etc.)

**3. Add Buttons**

- Approve button with ngrok URL
- Reject button with ngrok URL

**4. Save and Get Template ID**

- Click "Save and Publish"
- Copy Card ID: `ctp_xxxxx`

**5. Configure DL Generator**

- Paste Template ID in Lark Setup
- Enter App ID, App Secret, User ID
- Save configuration

**6. Test!**

- Click "Send Test Approval Request"
- Check Lark app
- **Verify signature image appears** ✨

---

## Common Mistakes

| ❌ Wrong                    | ✅ Correct                      |
| --------------------------- | ------------------------------- |
| `{{signature_image_url}}`   | `{{signature_image_key}}`       |
| Image Source: Static        | Image Source: Variable          |
| Image Source: URL           | Image Source: Variable          |
| Variable: `signature_image` | Variable: `signature_image_key` |
| Button URL: localhost       | Button URL: ngrok domain        |

---

## Need More Help?

📖 **Full Guide:** See `SIGNATURE_IMAGE_GUIDE.md` for complete step-by-step instructions

🔧 **Troubleshooting:** Check backend logs for image upload confirmation:

```
✅ Signature image uploaded to Lark: img_v3_027t_xxxxx
```

🗄️ **Database Check:** Verify image_key is stored:

```powershell
cd backend
python -c "from app.database import async_session, SignatureAsset; import asyncio; asyncio.run((lambda: async_session().__aenter__())()).execute('SELECT id, lark_image_key FROM signature_assets')"
```

**All set? Go test it! 🚀**
