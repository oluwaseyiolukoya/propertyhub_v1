#!/bin/bash
# Rebrand from Contrezz to Contrezz

echo "🎨 Rebranding Contrezz to Contrezz..."
echo ""

# Function to replace in files
replace_in_files() {
    local pattern=$1
    local replacement=$2
    local description=$3

    echo "📝 Replacing: $description"

    # Find and replace in all text files, excluding node_modules, .git, dist, and binary files
    find . -type f \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/dist/*" \
        -not -path "*/.next/*" \
        -not -path "*/build/*" \
        -not -path "*/uploads/*" \
        -not -path "*/.terraform/*" \
        -not -path "*/package-lock.json" \
        \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
        -o -name "*.json" -o -name "*.md" -o -name "*.html" -o -name "*.sh" \
        -o -name "*.prisma" -o -name "*.env*" -o -name "*.yml" -o -name "*.yaml" \
        -o -name "*.tf" -o -name "*.tfvars" \) \
        -exec sed -i '' "s/$pattern/$replacement/g" {} +
}

# Replacements
replace_in_files "Contrezz" "Contrezz" "Contrezz → Contrezz"
replace_in_files "contrezz" "contrezz" "contrezz → contrezz"
replace_in_files "contrezz" "contrezz" "contrezz → contrezz"
replace_in_files "CONTREZZ" "CONTREZZ" "CONTREZZ → CONTREZZ"

# Special cases for package names (keep lowercase with hyphens)
replace_in_files "contrezz-saas" "contrezz-saas" "Package name consistency"
replace_in_files "contrezz-backend" "contrezz-backend" "Backend package name"

echo ""
echo "✅ Rebranding complete!"
echo ""
echo "📋 Summary:"
echo "  - Contrezz → Contrezz"
echo "  - contrezz → contrezz"
echo "  - contrezz → contrezz"
echo ""
echo "🔄 Next steps:"
echo "  1. Review changes: git diff"
echo "  2. Test the application"
echo "  3. Commit changes: git add . && git commit -m 'rebrand: Change Contrezz to Contrezz'"
echo ""

