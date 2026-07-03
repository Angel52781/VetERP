import json
from pathlib import Path

try:
    detect = json.loads(Path('c:/Users/angel/OneDrive/Escritorio/Empresa/VetERP/graphify-out/.graphify_detect.json').read_text(encoding='utf-8-sig'))
    print(f"Corpus: {detect.get('total_files', 0)} files · ~{detect.get('total_words', 0)} words")
    for type_name, files in detect.get('files', {}).items():
        if files:
            print(f"  {type_name}: {len(files)} files")
except Exception as e:
    print(f"Error: {e}")
