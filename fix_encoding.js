const fs = require('fs');
const path = require('path');

const mappings = {
    'Ã¡': 'á', 'Ã£': 'ã', 'Ã³': 'ó', 'Ã©': 'é', 'Ãº': 'ú', 'Ã­': 'í', 
    'Ãª': 'ê', 'Ã´': 'ô', 'Ã§': 'ç', 'Ã»': 'û', 'Ã ': 'à', 'Ã±': 'ñ', 
    'Ãµ': 'õ', 'Ãˆ': 'È', 'Ã‰': 'É', 'Ã†': 'Æ', 'ÃŠ': 'Ê', 'Ã“': 'Ó',
    'Ã‡': 'Ç', 'Ã€': 'À', 'Ãš': 'Ú', 'Ã‚': 'Â', 'Ãƒ': 'Ã', 'Ã¬': 'ì',
    'â€¢': '•', 'ðŸ †': '🏆', 'ðŸŽ¾': '🎾', 'â˜€ï¸ ': '☀️'
};

function fixFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        for (const [key, value] of Object.entries(mappings)) {
            content = content.split(key).join(value);
        }
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed: ${filePath}`);
        }
    } catch (e) {
        console.error(`Error fixing ${filePath}: ${e}`);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else if (file.endsWith('.tsx')) {
            fixFile(filePath);
        }
    }
}

walkDir('./src');
