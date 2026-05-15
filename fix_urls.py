import re

file_path = r'c:\Users\joaoa\.gemini\antigravity\scratch\APP - Papel Futvolei\api\notify-admin.ts'

with open(file_path, 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')

# Update URLs
content = content.replace('https://Papel Futevôlei-ftv.vercel.app', 'https://papel-futevolei.vercel.app')
# Handle potential encoding issues in previous replacements
content = content.replace('https://Papel Futevlei-ftv.vercel.app', 'https://papel-futevolei.vercel.app')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
