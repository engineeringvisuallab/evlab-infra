# GIS and coordinates in EVLab Infra
## Today
- Objects live in a **local engineering coordinate system**: metres, X east, Y north, Z up. The project stores its CRS label (`meta.crs`, default `LOCAL-ENG`).
- Optional **geographic origin** (`meta.geo.originLon/originLat`, WGS84 degrees) says where local (0, 0) sits. With it set, the status bar shows lon/lat under the cursor and GeoJSON can be exported or imported as lon/lat.
- Conversion (`js/core/coordinates.js`) uses a local tangent plane: metres per degree of latitude and longitude at the origin latitude. Good for small areas (a few km). It ignores projection scale factors and grid convergence, so it is **not** UTM or state plane and **not survey-grade**.
- Longitude/latitude are never treated as Cartesian metres. GeoJSON export has two explicit modes: `local` (project metres, marked with a legacy `crs` member and a note, not RFC 7946 lon/lat) and `geographic`.
- GeoJSON import asks you to choose how coordinates are to be read and lists every feature it cannot import. A file that declares its own CRS gets a warning that your choice was used.

## Extending later (not implemented)
- **Projected CRS:** replace `toGeo/fromGeo` with a proj4-style transform keyed by an EPSG code stored in `meta.crs`. Keep the local origin so Three.js coordinates stay small and precise.
- **Terrain:** implemented as a TIN from imported x, y, z points (`js/models/terrain.js`, `js/io/terrain-csv.js`). Future: DEM raster (GeoTIFF) import, breaklines, contours, cut/fill.
- **Imagery and 3D Tiles:** add optional loaders as separate modules, off by default, with clear attribution.
- **Online services are optional.** The core app works offline.

## Data licensing, attribution, API limits
No online map, terrain or imagery service is used, so there are no API keys, attribution duties or rate limits today. If you add one, record its license, attribution text, usage limits and terms here before shipping. Respect those terms (many forbid bulk download and caching).
