# 🚨 FIX: Image Key Error in Template

## Problem Identified

From your screenshots, I can see:

- ✅ Template "DL Generator" is **Published** (green badge)
- ✅ Template ID: `ctp_AAvmQNJxEOmf` (correct)
- ❌ **"img_key error of image"** in card editor (red error banner)

**This image error is preventing the template from working!**

---

## 🔧 EXACT Steps to Fix

### Step 1: Fix the Image Variable in Template

1. **In Message Card Builder** (you're already there in screenshot 7)
2. Click **"Check Now"** on the red error banner
3. Or click on the **image element** that has the error

### Step 2: Configure Image Variable Correctly

The image element needs to accept a **dynamic image key** variable. Here's how:

1. **Click on the image element** in your template
2. In the right panel under **"Variables"** tab:
   - Look for the image variable (probably called `img_key` or `signature_preview`)
3. **Set the image source type** to:
   - **"Image Key"** (NOT "URL")
   - Variable type: **String**
   - Variable name: `img_key` or `signature_preview`

### Step 3: Expected Configuration

Your image variable should look like this:

```json
{
  "tag": "img",
  "img_key": "{{signature_preview}}"
}
```

Or in the UI:

- **Image Source**: Image Key
- **Variable Name**: `signature_preview` (or `img_key`)
- **Variable Type**: String
- **Required**: Yes

### Step 4: Remove Placeholder Image Key

If there's a placeholder/test image key like `img_v3_xxx` hardcoded:

1. **Remove it**
2. Replace with variable: `{{signature_preview}}`

### Step 5: Save and Publish Again

1. Click **"Save"** button (bottom of editor)
2. Click **"Publish"** button (top right)
3. Confirm the publish dialog
4. Wait for "Published successfully" message

---

## 🔍 Check Visibility Settings

After fixing the image error:

1. **In the template editor**, look for **"Visibility"** section
2. **Enable**: "Visible to all apps" toggle
3. **OR** add your app ID `cli_a8b6486fcb399029` to allowed apps list
4. Click **"Save"** to apply visibility settings

---

## ✅ Verify the Fix

After saving and publishing:

1. **In DL Generator** (localhost:3000)
2. Click **"Send Test Approval Request"** button
3. **Expected result**:
   - ✅ Success message
   - ✅ Approval card appears in Lark app
   - ✅ Image shows in card

---

## 🎯 Alternative: Check Template JSON

If you can't find the image error in UI:

1. Click **"Export Card"** button (top of card builder)
2. Look for the image element in JSON
3. Should look like this:

```json
{
  "tag": "img",
  "img_key": "{{signature_preview}}",
  "alt": {
    "tag": "plain_text",
    "content": "Signature Preview"
  }
}
```

**If you see a hardcoded image key** (starts with `img_v3_`):

- Replace it with variable: `"img_key": "{{signature_preview}}"`

---

## 🚀 After Fixing

Once the image error is fixed and template is published:

1. **Backend will automatically retry** the pending approval request
2. **OR** click "Send Test Approval Request" in DL Generator
3. **You should receive** the approval card in Lark with signature image

---

## 📞 If Still Not Working

If error persists after fixing image variable:

**Try the Dynamic Card Workaround:**

1. In DL Generator → **Lark Setup** tab
2. **CLEAR the Template ID field** (remove `ctp_AAvmQNJxEOmf`)
3. Click **"Save Configuration"**
4. System will use dynamic interactive cards instead
5. Works immediately without template issues

---

## 📸 What You Should See

After fixing:

- ❌ No more red "img_key error" banner
- ✅ Green "Published" badge
- ✅ All variables showing as valid
- ✅ Test message sends successfully

---

**Priority: Fix the image key error FIRST, then check visibility settings!**
