# Escalation Protocol

Rules for detecting when an agent is stuck and escalating appropriately. Auto-loaded for all agents (no path scoping).

---

## Stuck Detection

An agent is "stuck" when any of these apply:
- Cannot find required input files after checking all expected locations
- Task description is ambiguous and multiple interpretations produce different results
- A dependency produces output that doesn't match expected format
- Repeated attempts (2+) at the same step produce the same error

## Severity Levels

| Level | Trigger | Example |
|-------|---------|---------|
| L1 Minor | Missing optional input, technical ambiguity resolvable from codebase | Missing one reference file, choice of pattern |
| L1.5 Clarification | Business/domain ambiguity that only the user can answer | Source column used two ways, mapping doc contradicts code, unclear business rule |
| L2 Moderate | Cannot complete without expert guidance | Plan contradicts research, multiple valid technical approaches |
| L3 Blocking | Task cannot proceed, blocks downstream | Required input missing entirely |
| L4 Critical | Multiple tasks blocked, pipeline stalled | Phase gate cannot pass |

## Escalation Paths

### L1: Self-Resolve (Technical Ambiguity Only)
- Re-read task description and referenced files
- Check agent memory for relevant context from prior work
- Make a reasonable choice and document the assumption in agent memory
- Continue working
- **Use L1 ONLY for technical/implementation decisions** (e.g., which design pattern, how to structure a script, which utility to use)
- **Do NOT use L1 for business/domain questions** — use L1.5 instead

### L1.5: Clarify with User (Business/Domain Ambiguity)
When the ambiguity is about business intent, source interpretation, or conflicting requirements — things only the user can answer — do NOT assume. Instead:
1. Create a task: **"CLARIFICATION NEEDED: [brief description]"**
2. Include in the task description:
   - **Context**: What you are working on and what file/section triggered the question
   - **Ambiguity**: What is unclear — describe the two (or more) possible interpretations
   - **Impact**: What downstream work depends on this answer
   - **Your best guess** (optional): If you have a leaning, state it — but do NOT proceed on it
3. Block your current task on the clarification task
4. Move on to other unblocked tasks while waiting

**When to use L1.5 (ask the user) vs L1 (self-resolve):**

| Situation | Level | Why |
|-----------|-------|-----|
| Source code does X but documentation says Y | L1.5 | Only user knows which is the truth |
| Business rule has multiple valid interpretations | L1.5 | Business intent is a human decision |
| Unclear what a column/field means in context | L1.5 | Domain knowledge required |
| Which design pattern to use for a script | L1 | Technical — agent can decide |
| How to structure output files | L1 | Technical — agent can decide |
| Which base class to extend | L1 | Technical — agent can decide |
| Conflicting requirements in prompts.md | L1.5 | User must clarify their own requirements |

The lead orchestrator monitors for CLARIFICATION NEEDED tasks and batches them for the user.

### L2: Consult Expert
- Create an expert consultation task describing what you need
- Block your current task on the consultation
- Include in the task description: what you tried, what failed, your specific question

### L3: Escalate to Lead
- Create a task: **"ESCALATION L3: [brief description]"**
- Include: what is blocked, what was tried, what is needed to unblock
- The lead orchestrator monitors for ESCALATION tasks

### L4: Escalate to Human
- Create a task: **"ESCALATION L4 - HUMAN REQUIRED: [brief description]"**
- Include: full context, impact assessment, what downstream work is blocked
- The lead orchestrator surfaces L4 escalations to the user

## Circuit Breaker

If the same task fails **3 times** with the same error:
1. Stop retrying
2. Escalate to the next severity level
3. Document all 3 attempts in agent memory for future reference
