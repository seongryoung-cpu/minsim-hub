# Project rules

- Resolve automatic app mode only from successfully loaded database settings and election dates; both mode-dependent pages share a neutral loading/error view to avoid speculative layouts.
- Keep app-mode readiness rules in a pure helper with adjacent Bun tests so asynchronous input combinations can be checked without network access.