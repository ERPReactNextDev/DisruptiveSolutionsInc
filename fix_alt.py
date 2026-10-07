import os, re

files = [
    r"app/components/inventory-manager.tsx",
    r"app/components/pages/BrandsManager.tsx",
    r"app/components/pages/HomePage.tsx",
    r"app/components/pages/PartnersManager.tsx",
    r"app/components/products/Application.tsx",
    r"app/components/products/Category.tsx",
    r"app/dashboard/page.tsx",
    r"app/projects/page.tsx",
    r"app/api/send-email/route.ts"
]

for fpath in files:
    if not os.path.exists(fpath):
        print(f"SKIP: {fpath} not found")
        continue
    with open(fpath, "r", encoding="utf8") as fh:
        content = fh.read()
    # Replace <SmartImage src={...} className with ... alt="Product image" className
    new_content = re.sub(
        r'(<SmartImage src=)(\{[^}]+\})(\s+className)',
        r'\1\2 alt="Product image" \3',
        content
    )
    if new_content != content:
        with open(fpath, "w", encoding="utf8") as fh:
            fh.write(new_content)
        print(f"FIXED: {fpath}")
    else:
        print(f"NO CHANGE: {fpath}")