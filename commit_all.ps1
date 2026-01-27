# Commit script for all changes
cd "c:\Users\Ludwig Rivera\Downloads\Dl Gen\Dlgeneratorappredesign"

# Backend main
git add backend/main.py
git commit -m "Update backend main"

# Backend database
git add backend/database/dl_generator.db
git commit -m "Update generator database"

git add backend/database/demand_letters.db
git commit -m "Add demand letters database"

# New backend services
git add backend/app/services/date_preview_service.py backend/app/services/__pycache__/date_preview_service.cpython-313.pyc
git commit -m "Add date preview service"

git add backend/app/services/lark_image_cache.py backend/app/services/__pycache__/lark_image_cache.cpython-313.pyc
git commit -m "Add Lark image cache"

git add backend/app/services/preview_storage.py backend/app/services/__pycache__/preview_storage.cpython-313.pyc
git commit -m "Add preview storage service"

# Backend utils
git add backend/app/utils/active_signature.py backend/app/utils/__pycache__/active_signature.cpython-313.pyc
git commit -m "Add active signature utility"

# Backend uploads - directories
git add -A backend/uploads/lark_previews/
git commit -m "Add Lark preview uploads"

git add -A backend/uploads/previews/
git commit -m "Add preview uploads"

# Signature files
git add backend/uploads/signatures/atty_signature.png
git commit -m "Add attorney signature file"

git add backend/uploads/signatures/atty_signatureSPM.png
git commit -m "Add SPM attorney signature"

git add backend/uploads/signatures/sig_01852fa2-163e-4652-9887-17b5d7933479.png
git commit -m "Add signature variant 1"

git add backend/uploads/signatures/sig_05fbeb05-4c55-4329-b7a2-6174f545035b.png
git commit -m "Add signature variant 2"

git add backend/uploads/signatures/sig_240f6653-f8a6-40f5-b46c-23905f60b8c3.png
git commit -m "Add signature variant 3"

git add backend/uploads/signatures/sig_3701e39a-1916-4bda-8aa5-0a45ac2a27b2.png
git commit -m "Add signature variant 4"

git add backend/uploads/signatures/sig_3e435586-a1e2-4b24-8870-5ff96ceb5afb.png
git commit -m "Add signature variant 5"

git add backend/uploads/signatures/sig_4b445fdf-c24e-4f5a-a2f4-023bd314fae4.png
git commit -m "Add signature variant 6"

git add backend/uploads/signatures/sig_76aaf74e-b744-4561-a29f-f012f483f485.png
git commit -m "Add signature variant 7"

git add backend/uploads/signatures/sig_856adfc4-dc77-4899-959b-14b1c6aee9d9.png
git commit -m "Add signature variant 8"

git add backend/uploads/signatures/sig_b1118298-f258-4190-8fbf-5141e5a81b1d.png
git commit -m "Add signature variant 9"

git add backend/uploads/signatures/sig_b9df8c24-6615-4ec0-8f94-6e5141204214.png
git commit -m "Add signature variant 10"

# Build assets - removed files
git add build/assets/dc72251a662d05d2daef2d6a8aa527763a3ed4e8-hhZjKK14.png
git commit -m "Remove old build asset"

git add build/assets/index-DPI1ijfD.js
git commit -m "Remove old build script"

# Build new files
git add build/assets/index-BmpU8hHi.js
git commit -m "Add new build script"

git add build/index.html
git commit -m "Update build index"

git add build/sign/
git commit -m "Add build sign directory"

# Node modules changes
git add node_modules/.package-lock.json
git commit -m "Update package lock"

git add node_modules/.vite/deps/@radix-ui_react-slot.js node_modules/.vite/deps/@radix-ui_react-slot.js.map
git commit -m "Remove Radix slot deps"

git add node_modules/.vite/deps/_metadata.json
git commit -m "Update Vite metadata"

git add node_modules/.vite/deps/chunk-6PXSGDAH.js node_modules/.vite/deps/chunk-6PXSGDAH.js.map
git commit -m "Remove Vite chunk deps"

git add node_modules/.vite/deps/chunk-U7P2NEEE.js node_modules/.vite/deps/chunk-U7P2NEEE.js.map
git commit -m "Remove additional chunk deps"

git add node_modules/.vite/deps/class-variance-authority.js node_modules/.vite/deps/class-variance-authority.js.map
git commit -m "Remove CVA deps"

git add node_modules/.vite/deps/clsx.js node_modules/.vite/deps/clsx.js.map
git commit -m "Remove clsx deps"

git add node_modules/.vite/deps/react_jsx-runtime.js node_modules/.vite/deps/react_jsx-runtime.js.map
git commit -m "Update React JSX runtime"

git add node_modules/.vite/deps/tailwind-merge.js node_modules/.vite/deps/tailwind-merge.js.map
git commit -m "Remove tailwind merge deps"

git add node_modules/.vite/deps/html-to-image.js node_modules/.vite/deps/html-to-image.js.map
git commit -m "Add html-to-image deps"

# Node modules binaries
git add node_modules/.bin/pixelmatch node_modules/.bin/pixelmatch.cmd node_modules/.bin/pixelmatch.ps1
git commit -m "Add pixelmatch binaries"

git add node_modules/.bin/playwright node_modules/.bin/playwright.cmd node_modules/.bin/playwright.ps1
git commit -m "Add Playwright binaries"

git add node_modules/.bin/playwright-core node_modules/.bin/playwright-core.cmd node_modules/.bin/playwright-core.ps1
git commit -m "Add Playwright core binaries"

# Node modules packages
git add node_modules/html-to-image/
git commit -m "Add html-to-image package"

git add node_modules/pixelmatch/
git commit -m "Add pixelmatch package"

git add node_modules/playwright-core/
git commit -m "Add Playwright core package"

git add node_modules/playwright/
git commit -m "Add Playwright package"

git add node_modules/pngjs/
git commit -m "Add pngjs package"

# Package files
git add package-lock.json
git commit -m "Update package lock"

git add package.json
git commit -m "Update package configuration"

# Public directory
git add public/sign/
git commit -m "Add public sign directory"

# Sign directory
git add sign/atty_signature.png
git commit -m "Add sign attorney signature"

git add sign/atty_signatureSPM.png
git commit -m "Add sign SPM signature"

git add sign/lark_preview_images/
git commit -m "Add Lark preview images"

# Reports
git add reports/lark_preview_diff/
git commit -m "Add Lark preview diffs"

# Source components
git add src/App.tsx
git commit -m "Update main App component"

git add src/components/CustomDateRenderer.tsx
git commit -m "Update custom date renderer"

git add src/components/SignatureConfig.tsx
git commit -m "Update signature configuration"

git add src/components/lawfirm/SignatureConfigLawFirm.tsx
git commit -m "Update law firm signature config"

git add src/components/LarkPreviewPage.tsx
git commit -m "Add Lark preview page"

# Source utilities
git add src/utils/larkPreviewExport.ts
git commit -m "Add Lark preview export utility"

# Vite config
git add vite.config.ts
git commit -m "Update Vite configuration"

# Tools
git add tools/download_lark_previews.js
git commit -m "Add Lark preview download tool"

git add tools/pixel_diff_lark_previews.js
git commit -m "Add pixel diff tool"

git add tools/render_lark_previews.js
git commit -m "Add Lark preview render tool"

# Documentation
git add DL_GENERATOR_V3_IMPLEMENTATION_GUIDE.md
git commit -m "Add V3 implementation guide"

git add DL_GENERATOR_V3_TECHNICAL_DOCUMENTATION.md
git commit -m "Add V3 technical documentation"

git add SIGNATURE_FIX_SUMMARY.md
git commit -m "Add signature fix summary"

Write-Host "All commits created successfully!"
git log --oneline -20
