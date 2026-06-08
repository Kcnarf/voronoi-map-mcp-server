# Contributing to Voronoi Map MCP Server

First off, thank you for considering contributing to this project!

## 🤖 AI-Assisted Contribution

This repository features advanced Agent-Human interaction guidelines tailored for AI coding assistants (Claude Code, Cursor, Windsurf, etc.). 

Upon starting a session or a complex task, your agent will automatically read `AGENTS.md` and offer a **"Strict Maintainer Mode"** enforcing:
- ReAct workflows (Reason -> Act)
- Strict Code/Test separation 
- Human-in-the-Loop (HITL) checkpoints

Feel free to opt in for a guided, high-quality contribution experience. However, you remain completely free to choose the "Standard" mode and apply your own preferred AI workflows and Agent-Human interaction rules.

## Scope of Contributions

All types of contributions are welcome! This includes:
- **Features** — New functionality or enhancements to existing features
- **Bug Fixes** — Fixes for issues and regressions
- **Refactoring** — Code cleanup, performance improvements, and architectural improvements
- **Documentation** — README updates, guides, examples, and inline code comments
- **Tests** — Improving test coverage and test quality

## Reporting Issues

Found a bug? Have a feature idea? Please [open an issue](https://github.com/Kcnarf/voronoi-map-mcp-server/issues) on GitHub. Include:
- A clear description of the issue
- Steps to reproduce (for bugs)
- Expected vs. actual behavior

## Getting Help

Questions or need clarification? Feel free to [open a discussion](https://github.com/Kcnarf/voronoi-map-mcp-server/discussions) or [file an issue](https://github.com/Kcnarf/voronoi-map-mcp-server/issues).

## Development Setup

**Requirements:** Node.js 18 or 20

```bash
yarn install            # Install dependencies
yarn test               # Run test suite
```

## Testing

Please see [TESTING.md](TESTING.md) for detailed information on our testing practices, conventions, and how to write tests for your contributions.

## Proposing Code Changes

1. `git clone https://github.com/Kcnarf/voronoi-map-mcp-server.git`
2. `yarn install`
3. Make your changes, then:
   - `yarn test` to check for side effects
   - Add or update tests if introducing new API or behavior
4. `git commit` with an adequate message (see [Commit Messages](#commit-messages) below)
5. `git push`
6. Open a pull request against the main branch on GitHub :
  - GitHub will automatically run tests on Node 18 and Node 20 — all checks must pass
   - A maintainer will review your changes and provide feedback
   - Once approved, your PR will be merged

Note: You don't need to worry about code style — focus on functionality and tests.

## Commit Messages

Use a short (~50 character) title followed by a blank line and additional details if needed.

### Title Format

Optionally prefix the title with a category tag for non-feature changes:
- `[docs]` — Documentation updates
- `[fix]` — Bug fixes
- `[QA]` — Test and quality assurance updates
- `[CI]` — CI integration and workflow updates

If multiple categories apply, list all: `[QA, CI]`. Feature development does not require a prefix.

Include the issue number for traceability, especially for bug fixes: `[fix] bug_description (#123)`

### Examples

**Feature (no prefix):**
```
Add site coordinates to cell output for label placement

This allows clients to position labels at the cell centroid
without needing to compute polygon centers themselves.
```

**Bug fix (with prefix and issue number):**
```
[fix] resolve polygon validation crash on degenerate shapes (#42)

Add bounds checking before computing convex hull to prevent
TypeError when input polygon has fewer than 3 unique points.
```

**Documentation update (with prefix):**
```
[docs] strengthen CONTRIBUTING.md with comprehensive contributor guidance

Add missing sections for issue reporting, help channels, and PR process
to improve the contributor experience.
```

## Versioning

This project attempts to follow [semantic versioning](https://semver.org). The major version is bumped only when backwards-incompatible changes are released. This helps ensure that users can safely upgrade to patch and minor versions without breaking their integrations.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). By participating, you are expected to uphold this code.

## License

This project is licensed under the **BSD 3-Clause License**. See the [LICENSE](LICENSE) file for details. By contributing, you agree that your contributions will be licensed under the same license.