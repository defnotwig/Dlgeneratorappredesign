# 🔧 FIXED Template JSON - Copy and Paste This

## ❌ THE PROBLEM

In your template JSON, line with the image has:

```json
"img_key": "img_key"
```

This is a **literal string**, not a **variable**! It should be:

```json
"img_key": "{{signature_preview}}"
```

---

## ✅ CORRECTED TEMPLATE JSON

Copy this entire JSON and import it into Message Card Builder:

```json
{
  "elements": [
    {
      "tag": "column_set",
      "flex_mode": "none",
      "background_style": "default",
      "columns": [
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "vertical_align": "top",
          "elements": [
            {
              "tag": "div",
              "text": {
                "content": "**🤖 Request Type:**\n{{request_type}}",
                "tag": "lark_md"
              }
            }
          ]
        },
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "vertical_align": "top",
          "elements": [
            {
              "tag": "div",
              "text": {
                "content": "**📅 Request Date:**\n{{request_date}}",
                "tag": "lark_md"
              }
            }
          ]
        }
      ]
    },
    {
      "tag": "column_set",
      "flex_mode": "none",
      "background_style": "default",
      "columns": [
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "vertical_align": "top",
          "elements": [
            {
              "tag": "div",
              "text": {
                "content": "**👤 Requested By:**\n{{requested_by}}",
                "tag": "lark_md"
              }
            }
          ]
        },
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "vertical_align": "top",
          "elements": [
            {
              "tag": "div",
              "text": {
                "content": "**⏱️ Validity Period:**\n{{validity_period}}",
                "tag": "lark_md"
              }
            }
          ]
        }
      ]
    },
    {
      "tag": "column_set",
      "flex_mode": "none",
      "background_style": "default",
      "columns": [
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "vertical_align": "top",
          "elements": [
            {
              "tag": "div",
              "text": {
                "content": "**📝 Purpose:**\n{{purpose}}",
                "tag": "lark_md"
              }
            }
          ]
        },
        {
          "tag": "column",
          "width": "weighted",
          "weight": 1,
          "vertical_align": "top",
          "elements": [
            {
              "tag": "div",
              "text": {
                "content": "**🆔 Signature ID:**\n{{signature_id}}",
                "tag": "lark_md"
              }
            }
          ]
        }
      ]
    },
    {
      "tag": "hr"
    },
    {
      "tag": "div",
      "text": {
        "content": "**✍️ Signature Preview:**",
        "tag": "lark_md"
      }
    },
    {
      "tag": "img",
      "img_key": "{{signature_preview}}",
      "alt": {
        "tag": "plain_text",
        "content": "Signature Preview"
      },
      "mode": "fit_horizontal",
      "preview": true,
      "compact_width": false
    },
    {
      "tag": "hr"
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {
            "tag": "plain_text",
            "content": "✅ Approve"
          },
          "type": "primary",
          "value": {
            "action": "approve",
            "signature_id": "{{signature_id}}"
          }
        },
        {
          "tag": "button",
          "text": {
            "tag": "plain_text",
            "content": "❌ Reject"
          },
          "type": "danger",
          "value": {
            "action": "reject",
            "signature_id": "{{signature_id}}"
          }
        }
      ]
    },
    {
      "tag": "hr"
    },
    {
      "tag": "div",
      "text": {
        "content": "🙋🏼 Need help? Contact IT Support | 📝 DL Generator System",
        "tag": "lark_md"
      }
    }
  ],
  "header": {
    "template": "green",
    "title": {
      "content": "📋 Approval Request for Signature on DL Generator",
      "tag": "plain_text"
    }
  }
}
```

---

## 📋 HOW TO APPLY THIS FIX

### Method 1: Import Corrected JSON (FASTEST)

1. **Copy the entire JSON above** (select all and copy)

2. **In Message Card Builder**, click **"Import Card"** button (top right)

3. **Paste the JSON** into the text area

4. Click **"Import"**

5. **Save** the template

6. Click **"Publish"** button

7. Confirm the publish dialog

### Method 2: Edit Manually

1. **In Message Card Builder**, find the template "DL Generator"

2. **Click on the Image element** (the one showing error)

3. In the right panel, find **"Image Key"** field

4. **Change from:** `img_key`

5. **Change to:** `{{signature_preview}}`

6. Click **"Save"**

7. Click **"Publish"**

---

## 🔍 What Changed

**BEFORE (WRONG):**

```json
"img_key": "img_key"  ❌ Literal string - won't work!
```

**AFTER (CORRECT):**

```json
"img_key": "{{signature_preview}}"  ✅ Variable - will work!
```

---

## ✅ After Applying Fix

1. **Template error should disappear** - no more red banner

2. **In Variables tab**, you should see:

   - `request_type`
   - `request_date`
   - `requested_by`
   - `validity_period`
   - `purpose`
   - `signature_id`
   - **`signature_preview`** ← NEW variable for image

3. **Test in DL Generator**:
   - Click "Send Test Approval Request"
   - Should receive approval card in Lark
   - Image should display correctly

---

## 🎯 Variables the Backend Sends

Your backend sends these variables:

- `request_type`: "Signature Approval"
- `request_date`: "2026-01-16"
- `requested_by`: "Admin"
- `validity_period`: "1 Week"
- `purpose`: "DL Generation"
- `signature_id`: "1"
- **`signature_preview`**: "img_v3_xxx..." (the image key)

The template **MUST** use `{{signature_preview}}` to receive the image key!

---

## ⚠️ Important: Visibility Settings

After importing/fixing and publishing:

1. Go to template **"Visibility"** section

2. Enable **"Visible to all apps"** toggle

3. Click **"Save"** to apply

4. Wait 2 minutes for propagation

5. Test again in DL Generator

---

## 🚀 Expected Result

After fix:

- ✅ No template errors
- ✅ Green "Published" badge
- ✅ Image variable working
- ✅ Approval cards sent successfully
- ✅ Image displays in Lark app

---

**The fix is simple: just change `"img_key": "img_key"` to `"img_key": "{{signature_preview}}"` !**
