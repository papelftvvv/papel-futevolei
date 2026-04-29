import os

mappings = {
    'Ã¡': 'á', 'Ã£': 'ã', 'Ã³': 'ó', 'Ã©': 'é', 'Ãº': 'ú', 'Ã­': 'í', 
    'Ãª': 'ê', 'Ã´': 'ô', 'Ã§': 'ç', 'Ã»': 'û', 'Ã ': 'à', 'Ã±': 'ñ', 
    'Ãµ': 'õ', 'Ãˆ': 'È', 'Ã‰': 'É', 'Ã†': 'Æ', 'ÃŠ': 'Ê', 'Ã“': 'Ó',
    'Ã‡': 'Ç', 'Ã€': 'À', 'Ãš': 'Ú', 'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã¬': 'ì',
    'â€¢': '•', 'ðŸ †': '🏆', 'ðŸŽ¾': '🎾', 'â˜€ï¸ ': '☀️'
}

def fix_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for key, value in mappings.items():
            content = content.replace(key, value)
        
        if content != original_content:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {path}")
    except Exception as e:
        print(f"Error fixing {path}: {e}")

src_dir = './src'
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))
