"""
Safe emoji removal that preserves indentation.
This replaces emojis with plain text alternatives while maintaining code structure.
"""
import os
import re

# Emoji to text replacements (simple character replacements only)
EMOJI_MAP = {
    "\u2705": "[OK]",        # ✅
    "\u274C": "[ERROR]",     # ❌
    "\u26A0\uFE0F": "[WARN]", # ⚠️
    "\u26A0": "[WARN]",      # ⚠️ (without variation selector)
    "\u23F9\uFE0F": "[STOP]", # ⏹️
    "\u23F9": "[STOP]",      # ⏹️
    "\u23F3": "[PENDING]",   # ⏳
    "\U0001F534": "[FAIL]",  # 🔴
    "\U0001F4E5": "[RECV]",  # 📥
    "\U0001F4CC": "[INFO]",  # 📌
    "\U0001F3AF": "[TARGET]", # 🎯
    "\U0001F4CB": "",        # 📋
    "\U0001F4C6": "",        # 📆
    "\U0001F514": "",        # 🔔
    "\U0001F4CA": "",        # 📊
    "\U0001F4C8": "",        # 📈
    "\U0001F9EA": "[TEST]",  # 🧪
    "\U0001F9F9": "[CLEAN]", # 🧹
    "\U0001F50D": "[SEARCH]", # 🔍
    "\U0001F389": "[SUCCESS]", # 🎉
}

def remove_emojis_safe(filepath):
    """Remove emojis from a file while preserving indentation."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        modified = False
        new_lines = []
        
        for line in lines:
            original_line = line
            
            # Replace known emojis
            for emoji, replacement in EMOJI_MAP.items():
                if emoji in line:
                    line = line.replace(emoji, replacement)
                    modified = True
            
            # Remove any remaining emoji characters using regex
            # But be careful not to touch indentation
            leading_space = len(line) - len(line.lstrip())
            indent = line[:leading_space]
            content = line[leading_space:]
            
            # Pattern for emoji characters
            emoji_pattern = re.compile("["
                u"\U0001F600-\U0001F64F"
                u"\U0001F300-\U0001F5FF"
                u"\U0001F680-\U0001F6FF"
                u"\U0001F1E0-\U0001F1FF"
                u"\U00002600-\U000026FF"
                u"\U00002700-\U000027BF"
                u"\U0001F900-\U0001F9FF"
                u"\U0001FA00-\U0001FA6F"
                u"\U0001FA70-\U0001FAFF"
                u"\U00002B50"
                "]+", flags=re.UNICODE)
            
            new_content = emoji_pattern.sub('', content)
            
            if new_content != content:
                modified = True
                content = new_content
            
            # Reconstruct line with original indentation
            new_lines.append(indent + content)
        
        if modified:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            return True
        return False
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def process_directory(directory):
    """Process all Python files in directory."""
    modified_files = []
    
    for root, dirs, files in os.walk(directory):
        dirs[:] = [d for d in dirs if d != '__pycache__']
        
        for file in files:
            if file.endswith('.py'):
                filepath = os.path.join(root, file)
                if remove_emojis_safe(filepath):
                    modified_files.append(filepath)
                    print(f"Modified: {filepath}")
    
    return modified_files

if __name__ == "__main__":
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"Processing directory: {backend_dir}")
    print("-" * 50)
    
    modified = process_directory(backend_dir)
    
    print("-" * 50)
    print(f"Total files modified: {len(modified)}")
