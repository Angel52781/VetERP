import json
from graphify.detect import detect
from pathlib import Path
result = detect(Path('c:/Users/angel/OneDrive/Escritorio/Empresa/VetERP'))
print(json.dumps(result, ensure_ascii=False))
