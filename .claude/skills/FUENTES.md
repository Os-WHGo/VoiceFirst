# Skills de diseño: procedencia y licencias

Copias fijadas a una versión revisada. Para actualizar una skill, revisa el diff de la nueva
versión antes de reemplazar su carpeta.

| Skill | Origen | Versión | Licencia | Uso |
|---|---|---|---|---|
| `brand-identity` | github.com/fatihaydost/brand-identity-skill | etiqueta `v1.1.1` (commit `431366a`) | MIT (+ `THIRD_PARTY_NOTICES.md`, `TRADEMARKS.md`) | Branding y rebranding, logos, tipografía, paletas, manual de identidad (PDF, SVG/PNG, tokens), mockups |
| `frontend-design` | github.com/anthropics/skills | commit `dbd4588` | Apache 2.0 (`LICENSE.txt`) | Dirección estética en el diseño de interfaces |
| `canvas-design` | github.com/anthropics/skills | commit `dbd4588` | Apache 2.0; fuentes OFL en `canvas-fonts/` | Piezas publicitarias, carteles y piezas para redes sociales en PNG/PDF |

`brand-identity` necesita Python 3.10 o superior, un navegador Chromium y, opcionalmente, `uv`
(instala fonttools, uharfbuzz y skia-pathops en un entorno en caché).
`python3 .claude/skills/brand-identity/scripts/brand.py check` indica lo que falta. Solo se
conecta a Google Fonts, a `raw.githubusercontent.com` (google/fonts), a PyPI y a las webs que tú
le indiques. No comprueba el registro de marcas: antes de usar un logo, haz la búsqueda en las
oficinas de los países donde vayas a operar.

Descartadas: `Koomook/claude-frontend-skills` (no tiene el formato `SKILL.md` y su paquete npm
no existe), `anthropics/skills/brand-guidelines` (solo aplica la marca de Anthropic) y
`web-artifacts-builder` (instala pnpm de forma global y unas 40 dependencias npm).
