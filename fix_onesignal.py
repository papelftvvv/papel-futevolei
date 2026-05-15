import re

file_path = r'c:\Users\joaoa\.gemini\antigravity\scratch\APP - Papel Futvolei\api\notify-admin.ts'

with open(file_path, 'rb') as f:
    content = f.read().decode('utf-8', errors='replace')

# Update OneSignal ID
content = content.replace('51486d1b-db76-4996-b5bd-1c88bcb14835', 'e7b75283-a3fc-45f8-aed6-fe1cdd9715b5')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
