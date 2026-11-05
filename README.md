# esker-videos

Page publique allégée : la roue Esker et les vidéos de démonstration par module. Rien d'autre.

- Site statique, sans build : `index.html`, `css/`, `js/`.
- Vidéos hébergées sur HubSpot (URLs dans `js/data.js`) ; une vidéo ajoutée = une entrée dans `videos` du module.
- FR par défaut, EN avec `?lang=en` ou le commutateur (seules les vidéos doublées en anglais sont proposées).
- Roue extraite d'all-esker (`js/wheel.js`, `css/wheel.css`).
- Non indexé : `<meta robots>`, `robots.txt`, en-tête `X-Robots-Tag` (`_headers`, pris en charge par Cloudflare Pages).

Aperçu local : `python3 -m http.server 8123`, puis http://127.0.0.1:8123/

## Limite à connaître
`noindex` empêche l'apparition dans les moteurs de recherche, pas l'accès : toute personne qui a le lien peut regarder et le transmettre, et les fichiers .mp4 HubSpot restent atteignables directement. Pour restreindre l'accès : Cloudflare Access devant le site.
