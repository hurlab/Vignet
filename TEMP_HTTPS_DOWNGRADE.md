# TEMPORARY: hurlab.med.und.edu HTTPS → HTTP Downgrade

**Status:** ACTIVE
**Reason:** `https://hurlab.med.und.edu` is currently failing on the server. This is a
temporary mitigation to keep outbound links from the Vignet web app usable until
TLS is restored.

**Applied on:** 2026-05-06
**Applied by:** MoAI session for `juhur`
**Revert when:** TLS on `hurlab.med.und.edu` is back online.
**Sister change:** The same downgrade was applied in the Ignet repo. See
`/data/var/www/html/ignet/TEMP_HTTPS_DOWNGRADE.md` for the full cross-project audit log.

---

## Scope

The change replaces every occurrence of the literal string
`https://hurlab.med.und.edu` with `http://hurlab.med.und.edu` in the Vignet
frontend. No other URLs (e.g. `https://github.com/hurlab/...`, NIH reporter,
Google Fonts, etc.) are touched.

## Source File Changes (2 total)

| # | File | Line | Before | After |
|---|------|------|--------|-------|
| 1 | `frontend/src/pages/About.jsx` | 73 | `href="https://hurlab.med.und.edu"` | `href="http://hurlab.med.und.edu"` |
| 2 | `frontend/src/pages/Contact.jsx` | 7 | `url: 'https://hurlab.med.und.edu',` | `url: 'http://hurlab.med.und.edu',` |

## Built Artifacts Regenerated

`dist-react/` is gitignored in this repo, so no built bundles are committed.
After source edits, `npm run build` was run to regenerate the deployed bundles
on the server:

| New entry bundle | New About chunk | New Contact chunk |
|------------------|-----------------|-------------------|
| `assets/index-Dy9Flhyt.js` | `assets/About-CHQkCLFA.js` | `assets/Contact-BXe5L9Z-.js` |

### Build command used

```bash
export PATH="/home/juhur/miniconda3/envs/openai/bin:$PATH"
( cd /data/var/www/html/vignet/frontend && npm run build )
```

---

## Verification

```bash
# Should return ZERO matches in source after the downgrade:
grep -rn "https://hurlab.med.und.edu" /data/var/www/html/vignet/frontend

# Should return ZERO matches in freshly built bundles:
grep -rn "https://hurlab.med.und.edu" /data/var/www/html/vignet/dist-react
```

---

## Revert Procedure

When TLS is restored:

```bash
# 1. Restore source files from git
git -C /data/var/www/html/vignet checkout -- frontend/src/pages/About.jsx frontend/src/pages/Contact.jsx

# 2. Rebuild the frontend
export PATH="/home/juhur/miniconda3/envs/openai/bin:$PATH"
( cd /data/var/www/html/vignet/frontend && npm run build )

# 3. Verify https is back in source and built bundles
grep -rn "hurlab.med.und.edu" \
  /data/var/www/html/vignet/frontend \
  /data/var/www/html/vignet/dist-react
# Expected: only `https://hurlab.med.und.edu` matches.

# 4. Delete this tracking file
rm /data/var/www/html/vignet/TEMP_HTTPS_DOWNGRADE.md
```

If you would rather avoid relying on `git checkout` (e.g. if other commits have
landed), the equivalent literal-string revert is:

```bash
sed -i 's|http://hurlab\.med\.und\.edu|https://hurlab.med.und.edu|g' \
  /data/var/www/html/vignet/frontend/src/pages/About.jsx \
  /data/var/www/html/vignet/frontend/src/pages/Contact.jsx
```
