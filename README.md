# SojirohPlugins

Dalamud custom plugin repository for Sojiroh plugins.

Users should add this URL in Dalamud:

```text
https://sojiroh.github.io/SojirohPlugins/pluginmaster.json
```

Dalamud path:

```text
/xlsettings → Experimental → Custom Plugin Repositories
```

## Repository structure

```text
entries/
  TreasureRoute.json
pluginmaster.json
scripts/
  generate-pluginmaster.mjs
```

- `entries/*.json` contains one store entry per plugin.
- `pluginmaster.json` is the generated JSON array consumed by Dalamud.
- `scripts/generate-pluginmaster.mjs` validates entries and regenerates `pluginmaster.json`.

## Add another plugin

Add another file under `entries/` with a unique `InternalName`, then run:

```bash
node scripts/generate-pluginmaster.mjs
```

Push to `main`; GitHub Pages will publish the updated catalog.
