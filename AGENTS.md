# Project rules

- Resolve automatic app mode only from successfully loaded database settings and election dates; both mode-dependent pages share a neutral loading/error view to avoid speculative layouts.
- Keep app-mode readiness rules in a pure helper with adjacent Bun tests so asynchronous input combinations can be checked without network access.
- Keep the pilot application form mounted during authenticated application lookup so its draft and queued login-resume action survive; hide it while lookup is pending.