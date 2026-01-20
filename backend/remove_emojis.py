"""
Remove all emojis from Python files in the backend directory.
This script replaces emoji icons with plain text alternatives.
"""
import os
import re

# Emoji to text replacements
EMOJI_REPLACEMENTS = {
    # Status indicators
    "[OK]": "[OK]",
    "[ERROR]": "[ERROR]",
    "[WARN]": "[WARN]",
    "[STOP]": "[STOP]",
    "[PENDING]": "[PENDING]",
    "[FAIL]": "[FAIL]",

    # Actions
    "[RECV]": "[RECV]",
    "[INFO]": "[INFO]",
    "[TARGET]": "[TARGET]",
    "": "",
    "": "",
    "": "",
    "": "",
    "": "",
    "[TEST]": "[TEST]",
    "[CLEAN]": "[CLEAN]",
    "[SEARCH]": "[SEARCH]",
    "[SUCCESS]": "[SUCCESS]",

    # Misc
    "-": "-",
}

def remove_emojis_from_file(filepath):
    """Remove emojis from a single file."""
    try:
    with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

    original_content = content

    # Apply replacements
    for emoji, replacement in EMOJI_REPLACEMENTS.items():
    content = content.replace(emoji, replacement)

    # Also remove any remaining emoji patterns using regex
    # This catches any Unicode emoji characters
    emoji_pattern = re.compile("["
    u"\U0001F600-\U0001F64F" # emoticons
    u"\U0001F300-\U0001F5FF" # symbols & pictographs
    u"\U0001F680-\U0001F6FF" # transport & map symbols
    u"\U0001F1E0-\U0001F1FF" # flags
    u"\U00002600-\U000026FF" # misc symbols
    u"\U00002700-\U000027BF" # dingbats
    u"\U0001F900-\U0001F9FF" # supplemental symbols
    u"\U0001FA00-\U0001FA6F" # chess symbols
    u"\U0001FA70-\U0001FAFF" # symbols extended
    u"\U00002B50" # star
    "]+", flags=re.UNICODE)
    content = emoji_pattern.sub('', content)

    # Clean up double spaces and empty brackets
    content = re.sub(r'\[\]', '', content)
    content = re.sub(r' +', ' ', content)
    content = re.sub(r' +\n', '\n', content)

    if content != original_content:
    with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
    return True
    return False
    except Exception as e:
    print(f"Error processing {filepath}: {e}")
    return False

def process_directory(directory):
    """Process all Python files in directory."""
    modified_files =

    for root, dirs, files in os.walk(directory):
    # Skip __pycache__ directories
    dirs[:] = [d for d in dirs if d != '__pycache__']

    for file in files:
    if file.endswith('.py'):
    filepath = os.path.join(root, file)
    if remove_emojis_from_file(filepath):
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

    if modified:
    print("\nModified files:")
    for f in modified:
    print(f" - {f}")
