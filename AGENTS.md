# Project rules

- Resolve automatic app mode only from successfully loaded database settings and election dates; both mode-dependent pages share a neutral loading/error view to avoid speculative layouts.
- Keep app-mode readiness rules in a pure helper with adjacent Bun tests so asynchronous input combinations can be checked without network access.
- Keep the pilot application form mounted during authenticated application lookup so its draft and queued login-resume action survive; hide it while lookup is pending.- UI uses the design system in src/components/ds and the tokens at the top of src/index.css: bordered cards without shadows or gradients, one primary accent plus tone-agree/tone-split/tone-new for meaning only, no emoji headings.
