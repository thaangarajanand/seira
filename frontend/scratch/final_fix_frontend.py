
import os
import re

frontend_src = r'd:\ecom\ecom\ecom\frontend\src'

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix the wrong placement: credentials should be outside headers
    # Find fetch calls and reorganize
    def fetch_fixer(match):
        options_content = match.group(1)
        
        # Extract headers if they exist
        headers_match = re.search(r"headers:\s*\{([\s\S]*?)\}", options_content)
        
        has_credentials = "credentials: 'include'" in options_content
        
        clean_options = options_content
        if has_credentials:
            # Remove all occurrences of credentials: 'include'
            clean_options = re.sub(r"\s*credentials:\s*['\"]include['\"]\s*,?", "", clean_options)
            
        # Re-insert credentials at the start of the object
        clean_options = re.sub(r"\{\s*", "{ credentials: 'include', ", clean_options, count=1)
        
        # Remove any empty headers: {} or headers: { , }
        clean_options = re.sub(r"headers:\s*\{\s*,\s*\}", "", clean_options)
        clean_options = re.sub(r"headers:\s*\{\s*\}", "", clean_options)
        
        return f'fetch({match.group(2)}, {clean_options}'

    content = re.sub(r'fetch\(([^,]+),\s*(\{[\s\S]*?\})', lambda m: fetch_fixer(m), content)

    # Clean up Authorization leftovers
    content = re.sub(r"['\"]Authorization['\"]\s*:\s*[`'\"]Bearer \$\{token\}[`'\"]\s*,?", "", content)

    # Fix the specific mess found in Products.jsx
    content = content.replace("headers: {\n        credentials: 'include',", "credentials: 'include', \n        headers: {")
    content = content.replace("headers: { ,", "headers: {")
    content = content.replace(", }", "}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

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

print("Frontend final fix complete")
