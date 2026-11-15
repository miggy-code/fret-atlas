# Concurrent project context: research and adoption

Date: 2026-11-09. Question: how should a local context skill support concurrent initiatives across Codex and Claude Code without branch bleed or unnecessary infrastructure? Research bounded to primary vendor/Git documentation, two independent read-only research passes and disposable Git experiments; not an exhaustive benchmark of every memory product.

## Decision
Adopt optional shared project context, initiative-scoped execution records/specs and worktree-local selection, with deterministic attach/check tooling. Keep the existing single-initiative layout. Use selective loading and explicit provenance/write ownership. No memory service or model change is needed for this adoption.

The original proposal to automatically move context under git-common-dir is not adopted. Git exposes common metadata and shared excludes, but that alone does not make its internal directory a better home for user-authored documents. A stable canonical checkout is simpler, discoverable and compatible with the current Fretory setup. This is a design judgment, not a claim that Git prohibits custom metadata. Its movement/backup limitations are documented and checks make stale attachment visible.

## Options and tradeoffs
| Option | Context correctness | Operations | Decision |
|---|---|---|---|
| Independent context copies per branch | Natural branch scope but shared intent drifts; merge discipline needed | Git-native if tracked; current skill is deliberately untracked | Useful when branch-specific architecture diverges substantially, not this default |
| Shared brief + initiative records + local pointer | Explicit scope and evidence; shared write ownership still cooperative | Small attach/check helper; symlink/path/backup limits | Adopt, optional parallel mode |
| Canonical docs inside Git common metadata | Same scope rules still required | Detached from linked-worktree cleanup but hidden in Git administration; main repo moves/deletion still matter | No advantage large enough to migrate current docs |
| Letta stateful memory blocks | Supports labelled/shared/read-only blocks; sharing alone does not establish branch applicability | Adds agent runtime/service integration | Borrow scoped/read-mostly memory principle; do not deploy |
| Mem0 semantic/filtered memory | Useful retrieval with metadata filters, not an authority or branch-correctness guarantee | Service/index lifecycle, scope filters and evaluation needed | Defer until measured retrieval failures justify it |

## Primary evidence
- [Git worktree](https://git-scm.com/docs/git-worktree): linked checkouts share repository administration but have separate worktree/index/HEAD state. Resolve paths with Git, not an assumed `.git` directory. `repair` concerns Git links, not custom context links.
- [Git rev-parse](https://git-scm.com/docs/git-rev-parse): `--git-common-dir`, `--git-path` and absolute-path formatting support correct discovery, including gitfiles.
- [Git ignore](https://git-scm.com/docs/gitignore): repository-local auxiliary ignores belong in common info/exclude and do not stop tracking already tracked files.
- [Claude Code memory](https://code.claude.com/docs/en/memory): auto-memory is repository-wide/shared across worktrees; its concise index loads automatically, topic files on demand. CLAUDE imports load together, so splitting files into imports does not save context by itself. Inference: branch execution facts require explicit scope and source rather than promotion into undifferentiated auto-memory.
- [Codex AGENTS discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md): instructions are assembled along a directory path with a size budget. Inference: keep routing small and retrieve task data conditionally; an untracked `.context/` is not automatically instruction-loaded.
- [Anthropic context engineering](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents): just-in-time context, retrieval and structured notes support selective loading. It does not establish a universal optimal folder layout.
- [Letta memory blocks](https://docs.letta.com/v1-sdk/memory/memory-blocks): labelled, shared, always-visible and read-only memory blocks illustrate scope/write control, but always-visible shared blocks still consume context.
- [Mem0 search](https://docs.mem0.ai/core-concepts/memory-operations/search): semantic retrieval, metadata filters and reranking select relevant memories. Relevance does not prove applicability to the current Git tree.

## Implementation
Shared skill home: ~/HQ/workspace/shared/skills/project-context (already linked into both agent skill directories). Updated entrypoint, parallel reference, workflow standard, initiative template and stdlib-Python attachment helper. Existing init remains intact. New setup no longer automatically changes repository hooks/CI during a context-only reconstruction.

The helper verifies same-repository identity, preserves existing independent documents and current pointers, creates only missing shared links/records, and provides read-only checks plus explicit symlink repair. It does not create branches, infer ownership, merge divergent documents, enforce document locks, back up context or install an instruction-routing hook. Current branch/head/dirty state and semantic truth still require agent verification.

## Validation and limits
Ten initial integration tests passed: shared updates/local pointer isolation, idempotence/ignore coverage, preflight refusal of local documents, branch-switch mismatch, read-only checks, safe link repair, regular-file preservation, unrelated-repo rejection, canonical-root selection, detached-head handling and independent initiative records. Additional lifecycle tests pass for moving a linked worktree, refusing tracked context and preserving the original non-Git/copy init: 14 tests total after the forward-test correction. Read-only attachment checks pass on all four existing Guitar checkouts. Independent forward testing confirmed two real worktree attachments, clean Git status, branch mismatch refusal and preservation of conflicting documents. It found stale path metadata could pass: the checker now validates recorded worktree/shared-home paths, with regression coverage. Attachment still intentionally scaffolds unknown task metadata for the agent to fill; ownership/backups are documented, not enforced by this helper.

Research agents independently surfaced the same context-scope risk but disagreed on storage. Git-path experiments support discovery/checks, not a universal storage winner. Chose the smaller compatible option and made its limitation explicit. No evidence here proves a model-performance uplift; that would need repeated real tasks measuring wrong-branch assumptions, retrieval effort and handoff correctness.

Follow-ups: evaluate on future initiatives; consider tracked sanitized seeds/backup only when requested; consider indexed retrieval only when records become hard to find with deterministic pointers/search. Do not promote branch reports to shared facts without scope review.

Validation note: the bundled quick validator rejects the preexisting Claude-specific `argument-hint` field. Preserved that documented field; the portable frontmatter/body validates in a temporary copy with only that field omitted. Full YAML parses and the hint was separately checked. Neither the installed validator nor user metadata was changed to hide this limitation.

Final checks: 14 Git/filesystem tests pass; all four existing Guitar attachments pass read-only checks. Shared skill references and both agent symlinks resolve. App edits remain the original 9/7 App.tsx and 2/2 studio.css line deltas; no application tests, production changes, commits or deployment in this task.
