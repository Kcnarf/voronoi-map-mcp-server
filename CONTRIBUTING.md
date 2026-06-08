# Contributing to Voronoi Map MCP Server

First off, thank you for considering contributing to this project!

## 🤖 AI-Assisted Contribution

This repository features advanced Agent-Human interaction guidelines tailored for AI coding assistants (Claude Code, Cursor, Windsurf, etc.). 

Upon starting a session or a complex task, your agent will automatically read `AGENTS.md` and offer a **"Strict Maintainer Mode"** enforcing:
- ReAct workflows (Reason -> Act)
- Strict Code/Test separation 
- Human-in-the-Loop (HITL) checkpoints

Feel free to opt in for a guided, high-quality contribution experience. However, you remain completely free to choose the "Standard" mode and apply your own preferred AI workflows and Agent-Human interaction rules.

## Development Setup

```bash
yarn install            # Install dependencies
yarn test               # Run test suite
```

## Proposing Code Changes

1. `git clone https://github.com/Kcnarf/voronoi-map-mcp-server.git`
2. `yarn install`
3. Make your changes, then:
   - `yarn test` to check for side effects
   - Add or update tests if introducing new API or behavior
4. `git commit` with an adequate message (see [Commit Messages](#commit-messages) below)
5. `git push`

## Commit Messages

Use a short (~50 character) title followed by a blank line and additional details if needed:

```
Add site coordinates to cell output for label placement

This allows clients to position labels at the cell centroid
without needing to compute polygon centers themselves.
```

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/). By participating, you are expected to uphold this code.

## License

This project is licensed under the **BSD 3-Clause License**. See the [LICENSE](LICENSE) file for details. By contributing, you agree that your contributions will be licensed under the same license.