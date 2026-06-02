# CLAUDE.md

Claude Code-specific guidance for working on this repository.

For general project information, architecture, testing conventions, and working guidelines applicable to all agents, see **AGENTS.md**.

See **README.md** for Claude Desktop setup and integration instructions.

## Claude Code Workflow

- **Before implementing non-trivial tasks**: Use `EnterPlanMode` to create and present an implementation plan for approval.
- **Multi-file changes**: If a task requires changes to more than 3 source files, use `EnterPlanMode` to break it into smaller tasks first.
- **Commits**: Never commit changes; the user handles this.
