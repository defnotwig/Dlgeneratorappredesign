# ✅ CORRECTED Template JSON - Variable Name Fixed

## ❌ THE PROBLEM

Your template uses: `{{signature_preview}}`
But backend sends: `signature_image_key`

**Variable names MUST match!**

---

## ✅ FIXED JSON - Copy This

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
      "img_key": "{{signature_image_key}}",
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

## 🔄 What Changed

**BEFORE (WRONG):**

```json
"img_key": "{{signature_preview}}"
```

**AFTER (CORRECT):**

```json
"img_key": "{{signature_image_key}}"
```

---

## 📋 How to Apply

### In Message Card Builder:

1. Click **"Import Card"** button
2. Paste the JSON above
3. Click **"Import"**
4. **Save** the template
5. Click **"Publish"**

### OR Edit Manually:

In the Image Key field, change:

- FROM: `{{signature_preview}}`
- TO: `{{signature_image_key}}`

---

## ✅ Backend Variables (Reference)

Your backend sends these variables:

- ✅ `request_type`
- ✅ `request_date`
- ✅ `requested_by`
- ✅ `validity_period`
- ✅ `purpose`
- ✅ `signature_id`
- ✅ **`signature_image_key`** ← Image variable
- ✅ `is_auto`

**All template variables MUST match these exact names!**

---

## 🎯 After Fix

1. ❌ Red error should disappear
2. ✅ All variables will be valid
3. ✅ Template will work
4. ✅ Enable "Visible to all apps"
5. ✅ Publish and test

---

**The key issue: Variable name mismatch! Backend uses `signature_image_key` but template used `signature_preview`.**
