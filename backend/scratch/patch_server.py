
import os

filepath = r'd:\ecom\ecom\ecom\backend\server.js'
with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
imports_added = False
error_handling_added = False

for line in lines:
    if "const express =" in line and not imports_added:
        new_lines.append(line)
        new_lines.append("const helmet = require('helmet');\n")
        new_lines.append("const xss = require('xss-clean');\n")
        new_lines.append("const mongoSanitize = require('express-mongo-sanitize');\n")
        new_lines.append("const hpp = require('hpp');\n")
        new_lines.append("const rateLimit = require('express-rate-limit');\n")
        new_lines.append("const cookieParser = require('cookie-parser');\n")
        imports_added = True
    elif "app.use('/api/admin'" in line and not error_handling_added:
        new_lines.append(line)
        new_lines.append("\n// ── Error Handling ────────────────────────────────────────\n")
        new_lines.append("// 404 handler\n")
        new_lines.append("app.use((req, res, next) => {\n")
        new_lines.append("  res.status(404).json({ error: 'Endpoint not found' });\n")
        new_lines.append("});\n\n")
        new_lines.append("// Centralized error handler\n")
        new_lines.append("app.use((err, req, res, next) => {\n")
        new_lines.append("  console.error('🔥 Global Error:', err.stack);\n")
        new_lines.append("  const message = process.env.NODE_ENV === 'production' \n")
        new_lines.append("    ? 'An unexpected error occurred. Please try again later.' \n")
        new_lines.append("    : err.message;\n")
        new_lines.append("  res.status(err.status || 500).json({\n")
        new_lines.append("    error: message,\n")
        new_lines.append("    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })\n")
        new_lines.append("  });\n")
        new_lines.append("});\n")
        error_handling_added = True
    else:
        new_lines.append(line)

with open(filepath, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Patch applied successfully")
