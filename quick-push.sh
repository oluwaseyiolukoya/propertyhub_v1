#!/bin/bash
cd /Users/oluwaseyio/.cursor/worktrees/test_ui_figma_and_cursor/aHd5Z
git add -A
git commit -m "fix: Admin customer plan selection - show plans without category"
git checkout main
git pull origin main
git merge 2025-11-15-666q-aHd5Z --no-edit
git push origin main
cd backend
npx prisma generate
npx prisma db push
cd ..
echo "Done!"

