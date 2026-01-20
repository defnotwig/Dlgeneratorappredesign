# 🔧 Fix Lark Template Visibility Issue

## ❌ Current Error

```
"template is not visible to app, please confirm whether the app is allowed to use this template"
```

## ✅ Solution: Publish Template in Lark Developer Console

### Step 1: Open Lark Developer Console

1. Go to https://open.larksuite.com/app
2. Login with your account
3. Select your app: **cli_a8b6486fcb399029**

### Step 2: Publish the Template

1. Click **"Message Card Builder"** in left sidebar
2. Find your template: **ctp_AAvmQNJxEOmf**
3. Click on the template to open it
4. Click **"Publish"** button (top right corner)
5. Select **"Publish Current Version"** or create new version

### Step 3: Configure Visibility

When publishing, you'll see visibility options:

**Option A: Make Public (Recommended)**

- Enable: **"Visible to all apps"**
- This allows any app to use this template

**Option B: Specific Apps**

- Add your App ID to allowed list: `cli_a8b6486fcb399029`
- Only specified apps can use this template

### Step 4: Confirm & Save

- Click **"Confirm"** to apply changes
- Wait 1-2 minutes for changes to propagate

### Step 5: Test Again

1. Go back to DL Generator Signature Config
2. Click **"Send Test Approval Request"**
3. Should now work successfully! ✅

---

## 🔍 Verify Template Configuration

Before publishing, ensure your template has:

### Required Components

1. **Image Component** (for signature preview)
   - Source: **Variable** (not Static)
   - Variable name: `signature_image_key`
2. **Text Fields** (for metadata)

   - Variables: `requested_by`, `validity_period`, `purpose`
   - Can use plain text or variables

3. **Action Buttons** (for Approve/Reject)
   - ✅ Approve button
   - ❌ Reject button
   - Button actions should trigger webhook callbacks

### Template Variables Used

```json
{
  "signature_image_key": "img_v3_xxxx...",  // Lark image key
  "requested_by": "Admin User",
  "validity_period": "1 Week",
  "purpose": "DL Generation",
  "request_type": "Auto-Approval" or "Manual Request"
}
```

---

## 🧪 Testing Checklist

After publishing template:

- [ ] Test Connection works (sends simple message)
- [ ] Send Test Approval Request works (no template error)
- [ ] Signature image appears in message card
- [ ] Approve button is visible and clickable
- [ ] Reject button is visible and clickable
- [ ] Button clicks trigger webhook (if configured)

---

## 📝 Notes

- Templates must be published before they can be used by apps
- Unpublished/draft templates are not accessible via API
- Template visibility can be changed anytime without republishing
- After publishing, template can be edited but requires re-publishing

---

## 🆘 Still Having Issues?

Check these common problems:

1. **Template ID wrong**: Verify `ctp_AAvmQNJxEOmf` is correct
2. **App ID wrong**: Verify `cli_a8b6486fcb399029` is correct
3. **Not published**: Template must be published (not draft)
4. **Wrong version**: Publish the latest version
5. **Cache delay**: Wait 2-3 minutes after publishing

---

**Current Configuration:**

- App ID: `cli_a8b6486fcb399029`
- Template ID: `ctp_AAvmQNJxEOmf`
- User ID: `ou_945fd8b7130f2db31077c6e079b9986d`

All credentials are already saved in database. Just need to publish template! 🚀
