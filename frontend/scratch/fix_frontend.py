
import os
import re

frontend_src = r'd:\ecom\ecom\ecom\frontend\src'

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Clean up the messed up headers first (from previous run)
    content = content.replace("headers: {,", "headers: {")
    content = content.replace("credentials: 'include', \n          'Content-Type': 'application/json',", "credentials: 'include',\n          'Content-Type': 'application/json',")
    
    # 2. Replace token destructuring
    content = content.replace('const { token } = useAuth();', 'const { isLoggedIn } = useAuth();')
    content = content.replace('const { user, token } = useAuth();', 'const { user, isLoggedIn } = useAuth();')
    content = content.replace('const { token, user } = useAuth();', 'const { isLoggedIn, user } = useAuth();')
    
    # 3. Replace token checks
    content = content.replace('if (!token)', 'if (!isLoggedIn)')
    
    # 4. Remove Authorization header and token references
    # Look for 'Authorization': `Bearer ${token}` and similar
    content = re.sub(r"['\"]Authorization['\"]\s*:\s*[`'\"]Bearer \$\{token\}[`'\"]\s*,?", "", content)
    
    # 5. Add credentials: 'include' to fetch if missing
    def fetch_options_fixer(match):
        options = match.group(1)
        if "credentials:" not in options:
            # Insert before the first key
            options = re.sub(r'\{\s*', "{ credentials: 'include', ", options, count=1)
        return f'fetch({match.group(2)}, {options}'

    # Simple regex for fetch calls
    # fetch(url, { ... })
    content = re.sub(r'fetch\(([^,]+),\s*(\{[\s\S]*?\})', lambda m: m.group(0) if "credentials: 'include'" in m.group(2) else m.group(0).replace("{", "{ credentials: 'include', ", 1), content)

    # 6. Final cleanup of potential double commas or syntax errors in objects
    content = content.replace(", ,", ",")
    content = content.replace("{ ,", "{")
    content = content.replace(", }", "}")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# List of files identified by grep
files_to_patch = [
    r'pages\UserHome.jsx',
    r'pages\Products.jsx',
    r'pages\ProductDetail.jsx',
    r'pages\Dashboard.jsx',
    r'pages\Cart.jsx',
    r'context\CartContext.jsx',
    r'components\CartDrawer.jsx',
    r'components\Dashboard\ProfileSection.jsx',
    r'components\Dashboard\ProductModal.jsx'
]

for rel_path in files_to_patch:
    full_path = os.path.join(frontend_src, rel_path)
    if os.path.exists(full_path):
        patch_file(full_path)
        print(f"Patched {rel_path}")

print("Frontend fix complete")
