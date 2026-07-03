import sys, json
from pathlib import Path
from graphify.extract import collect_files, extract
from graphify.cache import check_semantic_cache

detect = json.loads(Path('graphify-out/.graphify_detect.json').read_text(encoding="utf-8-sig"))

# Part A: AST Extraction
code_files = []
for f in detect.get('files', {}).get('code', []):
    code_files.extend(collect_files(Path(f)) if Path(f).is_dir() else [Path(f)])

if code_files:
    print("Running AST extraction...")
    result = extract(code_files, cache_root=Path('.'))
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f'AST: {len(result["nodes"])} nodes, {len(result["edges"])} edges')
else:
    Path('graphify-out/.graphify_ast.json').write_text(json.dumps({'nodes':[],'edges':[],'input_tokens':0,'output_tokens':0}, ensure_ascii=False), encoding="utf-8")
    print('No code files - skipping AST extraction')

# Part B0: Cache Check
all_files = []
for k, files in detect.get('files', {}).items():
    if k != 'code':
        # wait, the instruction says all_files = [f for files in detect['files'].values() for f in files]
        all_files.extend(files)

# Let's just use all non-code files for semantic extraction
non_code_files = []
for k, files in detect.get('files', {}).items():
    if k != 'code':
        non_code_files.extend(files)

cached_nodes, cached_edges, cached_hyperedges, uncached = check_semantic_cache(non_code_files)

if cached_nodes or cached_edges or cached_hyperedges:
    Path('graphify-out/.graphify_cached.json').write_text(json.dumps({'nodes': cached_nodes, 'edges': cached_edges, 'hyperedges': cached_hyperedges}, ensure_ascii=False), encoding="utf-8")
Path('graphify-out/.graphify_uncached.txt').write_text('\n'.join(uncached), encoding="utf-8")
print(f'Cache: {len(non_code_files)-len(uncached)} files hit, {len(uncached)} files need extraction')
