# LandXML in EVLab Infra (version 1.2 subset)
**Export** (Import / Export panel → Export LandXML), always metric:
- Terrain → `Surface` with `Definition surfType="TIN"`, points (`northing easting elevation`) and faces.
- Roads and watercourses → `Alignment` with `Line` and circular `Curve` elements (with PI) and a `Profile/ProfAlign` made of PVIs at the control points.
- Not exported (listed after export): pipes, nodes, bridges, culverts, blocks.
**Import**
- TIN surfaces → terrain. The faces in the file are ignored and the surface is rebuilt as a Delaunay TIN from the points (limit 5000 points per surface).
- Alignments made of `Line` and `Curve` elements → roads (or watercourses; choose "Import lines as"). A curve becomes a control point (its PI) with a radius. The first `ProfAlign` gives elevations; vertical curves are treated as straight grades between PVIs.
- Not supported (listed as not imported): spirals, irregular lines, chains, curves that follow each other directly, GridSurface, pipe networks, parcels, cross-sections.
- Units come from the `Units` element (meter, foot, US survey foot, inch, mm, cm, km, mile). Without it, metres are assumed.
- Large projected coordinates (over 100 000) are re-centered when the project is empty. The origin is stored in the project and added back on export, so real-world coordinates round-trip.
**Limits:** the result is as accurate as the file. Check imported data against the source before using it for anything important.
