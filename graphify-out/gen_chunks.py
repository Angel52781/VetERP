import json

base_prompt = """You are a graphify extraction subagent. Read the files listed and extract a knowledge graph fragment.
Output ONLY valid JSON matching the schema below - no explanation, no markdown fences, no preamble.

Files (chunk {CHUNK_NUM} of {TOTAL_CHUNKS}):
{FILE_LIST}

Rules:
- EXTRACTED: relationship explicit in source (import, call, citation, "see §3.2")
- INFERRED: reasonable inference (shared data structure, implied dependency)
- AMBIGUOUS: uncertain - flag for review, do not omit

Code files: focus on semantic edges AST cannot find (call relationships, shared data, arch patterns).
  Do not re-extract imports - AST already has those.
Doc/paper files: extract named concepts, entities, citations. For rationale (WHY decisions were made, trade-offs, design intent): store as a `rationale` attribute on the relevant concept node — do NOT create a separate rationale node or fragment node. Only create a node for something that is itself a named entity or concept. Use `file_type:"rationale"` for concept-like nodes (ideas, principles, mechanisms, design patterns). `file_type` MUST be one of exactly these six values: `code`, `document`, `paper`, `image`, `rationale`, `concept`. Any other value is invalid and will be rejected.
Code files: when adding `calls` edges, source MUST be the caller (the function/class doing the calling), target MUST be the callee. Never reverse this direction. `calls` edges MUST stay within one language: a Python function cannot `calls` a JS/TS/Go/Rust/Java symbol and vice versa — cross-language call edges are phantom artifacts, never emit them.
Image files: use vision to understand what the image IS - do not just OCR.
  UI screenshot: layout patterns, design decisions, key elements, purpose.
  Chart: metric, trend/insight, data source.
  Tweet/post: claim as node, author, concepts mentioned.
  Diagram: components and connections.
  Research figure: what it demonstrates, method, result.
  Handwritten/whiteboard: ideas and arrows, mark uncertain readings AMBIGUOUS.

DEEP_MODE (if --mode deep was given): be aggressive with INFERRED edges - indirect deps,
  shared assumptions, latent couplings. Mark uncertain ones AMBIGUOUS instead of omitting.

Semantic similarity: if two concepts in this chunk solve the same problem or represent the same idea without any structural link (no import, no call, no citation), add a `semantically_similar_to` edge marked INFERRED with a confidence_score reflecting how similar they are (0.6-0.95). Examples:
- Two functions that both validate user input but never call each other
- A class in code and a concept in a paper that describe the same algorithm
- Two error types that handle the same failure mode differently
Only add these when the similarity is genuinely non-obvious and cross-cutting. Do not add them for trivially similar things.

Hyperedges: if 3 or more nodes clearly participate together in a shared concept, flow, or pattern that is not captured by pairwise edges alone, add a hyperedge to a top-level `hyperedges` array. Examples:
- All classes that implement a common protocol or interface
- All functions in an authentication flow (even if they don't all call each other)
- All concepts from a paper section that form one coherent idea
Use sparingly — only when the group relationship adds information beyond the pairwise edges. Maximum 3 hyperedges per chunk.

If a file has YAML frontmatter (--- ... ---), copy source_url, captured_at, author,
  contributor onto every node from that file.

confidence_score is REQUIRED on every edge - never omit it, never use 0.5 as a default:
- EXTRACTED edges: confidence_score = 1.0 always
- INFERRED edges: pick exactly ONE value from this set — never 0.5:
    0.95  direct structural evidence (shared data structure, named cross-file reference).
    0.85  strong inference (clear functional alignment, no direct symbol link).
    0.75  reasonable inference (shared problem domain + similar shape, requires interpretation).
    0.65  weak inference (thematically related, no shape evidence).
    0.55  speculative but plausible (surface-level co-occurrence only).
  Models follow discrete rubrics better than continuous ranges; the bimodal
  distribution observed in production (>50% at 0.5, >40% at 0.85+) shows the
  range guidance is being collapsed to a binary. If no value above fits, mark
  the edge AMBIGUOUS rather than picking 0.4 or below.
- AMBIGUOUS edges: 0.1-0.3

Node ID format: lowercase, only `[a-z0-9_]`, no dots or slashes. Format: `{stem}_{entity}` where stem is `{parent_dir}_{filename_without_ext}` (the **immediate** parent directory name + the filename stem, both lowercased with non-alphanumeric chars replaced by `_`) and entity is the symbol name similarly normalized. Only one level of parent is used — not the full path. Examples: `src/auth/session.py` + `ValidateToken` → `auth_session_validatetoken`; `lib/utils/helpers.py` + `parse_url` → `utils_helpers_parse_url`; `tests/test_foo.py` + `_helper` → `tests_test_foo_helper`. Top-level files (no parent dir, e.g. `setup.py`) use just the filename stem: `setup_my_func`. This must match the ID the AST extractor generates — using just the filename (e.g., `session_validatetoken`) or the full path (e.g., `src_auth_session_validatetoken`) will create orphan ghost-duplicate nodes. If you are re-extracting a project that had ghost duplicates under the old format, the user should run `graphify extract --force` to rebuild cleanly. CRITICAL: never append chunk numbers, sequence numbers, or any suffix to an ID (no `_c1`, `_c2`, `_chunk2`, etc.). IDs must be deterministic from the label alone — the same entity must always produce the same ID regardless of which chunk processes it.

Generate the extraction JSON matching this schema exactly:
{"nodes":[{"id":"session_validatetoken","label":"Human Readable Name","file_type":"code|document|paper|image|rationale|concept","source_file":"relative/path","source_location":null,"source_url":null,"captured_at":null,"author":null,"contributor":null}],"edges":[{"source":"node_id","target":"node_id","relation":"calls|implements|references|cites|conceptually_related_to|shares_data_with|semantically_similar_to|rationale_for","confidence":"EXTRACTED|INFERRED|AMBIGUOUS","confidence_score":1.0,"source_file":"relative/path","source_location":null,"weight":1.0}],"hyperedges":[{"id":"snake_case_id","label":"Human Readable Label","nodes":["node_id1","node_id2","node_id3"],"relation":"participate_in|implement|form","confidence":"EXTRACTED|INFERRED","confidence_score":0.75,"source_file":"relative/path"}],"input_tokens":0,"output_tokens":0}

Then write the JSON to disk using the write_to_file tool at this exact absolute path:
{CHUNK_PATH}

Once you have written the file, your task is complete and you can exit.
"""

files = [
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.agents\AGENTS.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.agents\AGENTS.proposed.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\branch_consolidation_plan.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase1_2_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase1_patch_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase1_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase2_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase3_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase4_storage_patch_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase4_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase5_build_patch_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase5_fix_plan.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase5_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase6_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\phase7_validation.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\documents\veterp_technical_plan.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\fix-phase5-build\checklist.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\fix-phase5-build\spec.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\fix-phase5-build\tasks.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\implement-phase6-inventory\checklist.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\implement-phase6-inventory\spec.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\implement-phase6-inventory\tasks.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\implement-phase7-hardening\checklist.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\implement-phase7-hardening\spec.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\implement-phase7-hardening\tasks.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\rebuild-veterp\checklist.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\rebuild-veterp\spec.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\.trae\specs\rebuild-veterp\tasks.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\AGENTS.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\CLAUDE.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\README.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\Regla obligatoria de UX no mostrar valores internos al usuario.txt",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\VetERP_chatgpt.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\app_flow_map.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\data_model.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\feedback_veterinario.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\landing\landing-copy.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\landing\landing-implementation-notes.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\landing\landing-prd.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\landing\landing-wireframe.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\landing\screenshot-shotlist.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\migration_risks.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\product_spec.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\veterp_beta_smoke_test.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\docs\veterp_roadmap_general.md",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\domain-certificate-veterp.qzz.io.pdf",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-horizontal-cream.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-horizontal-transparent.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-vertical-graphite-cream.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-vertical-light-dark.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-vertical-light-teal.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-vertical-primary-cream.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-vertical-primary-transparent.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-logo-vertical-teal-cream.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-mark-cream.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\brand\veterp-mark-transparent.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\file.svg",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\globe.svg",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\landing\screenshots\feature-agenda-operativa.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\landing\screenshots\feature-atencion-clinica.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\landing\screenshots\feature-finanzas-caja.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\landing\screenshots\feature-historia-clinica.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\landing\screenshots\feature-hospitalizacion-clinica.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\landing\screenshots\feature-inventario-stock.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\landing\screenshots\hero-recepcion-dashboard.png",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\next.svg",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\vercel.svg",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\public\window.svg",
r"C:\Users\angel\OneDrive\Escritorio\Empresa\VetERP\src\app\icon.png"
]

chunks = []
chunks.append(files[0:23])
chunks.append(files[23:46])
for i in range(46, len(files)):
    chunks.append([files[i]])

total_chunks = len(chunks)

subagents = []
for i, chunk in enumerate(chunks):
    prompt = base_prompt.replace("{CHUNK_NUM}", str(i+1)) \
                        .replace("{TOTAL_CHUNKS}", str(total_chunks)) \
                        .replace("{FILE_LIST}", "\\n".join(chunk)) \
                        .replace("{CHUNK_PATH}", f"c:/Users/angel/OneDrive/Escritorio/Empresa/VetERP/graphify-out/.graphify_chunk_{i+1:02d}.json")
    subagents.append({
        "TypeName": "self",
        "Role": "Semantic Extractor",
        "Prompt": prompt
    })

with open('c:/Users/angel/OneDrive/Escritorio/Empresa/VetERP/graphify-out/chunks.json', 'w') as f:
    json.dump(subagents, f, indent=2)
