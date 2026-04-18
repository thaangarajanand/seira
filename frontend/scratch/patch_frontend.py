
import os
import re

frontend_src = r'd:\ecom\ecom\ecom\frontend\src'

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace token destructuring
    content = content.replace('const { token } = useAuth();', 'const { isLoggedIn } = useAuth();')
    content = content.replace('const { user, token } = useAuth();', 'const { user, isLoggedIn } = useAuth();')
    content = content.replace('const { token, user } = useAuth();', 'const { isLoggedIn, user } = useAuth();')
    
    # 2. Replace token checks
    content = content.replace('if (!token)', 'if (!isLoggedIn)')
    content = content.replace('if (!token) {', 'if (!isLoggedIn) {')
    
    # 3. Add credentials: 'include' to fetch calls and remove Authorization header
    # This is a bit complex with regex. 
    
    # Pattern to find fetch calls
    def fetch_replacer(match):
        url = match.group(1)
        options = match.group(2)
        
        # Remove Authorization header
        options = re.sub(r"'Authorization':\s*`Bearer \${token}`\s*,?", "", options)
        options = re.sub(r'"Authorization":\s*`Bearer \${token}`\s*,?', "", options)
        
        # Add credentials: 'include'
        if "credentials:" not in options:
            if "headers:" in options:
                options = options.replace("headers: {", "headers: {},\n        credentials: 'include',")
                options = options.replace("headers: {}", "headers: {")
            else:
                options = options.replace("{", "{\n        credentials: 'include',")
                
        return f'fetch({url}, {options}'

    # Simple regex for fetch(url, { ... })
    content = re.sub(r'fetch\(([^,]+),\s*(\{[\s\S]*?\})', fetch_replacer, content)

    # 4. Clean up trailing commas in headers if any
    content = content.replace(',\n        },', '\n        },')

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

print("Frontend patch complete")
