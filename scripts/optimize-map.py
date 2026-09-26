"""Rebuild the browser map while validating shared boundaries and all islands."""

import argparse
import gzip
import hashlib
import json
import math
from pathlib import Path

import shapely
from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "data/taiwan_geo.source.json.gz"
OUTPUT = ROOT / "static/taiwan_geo.json"
SOURCE_SHA256 = "db1f118396af033d9c52c804a9666149025f106c633d09e781e58bc4dcaef606"
TOLERANCE = 0.00005
MAX_ERROR_DEGREES = 0.0002


def require(condition, message):
    if not condition:
        raise ValueError(message)


def polygons(geometry):
    return [geometry] if geometry.geom_type == "Polygon" else list(geometry.geoms)


def rings(geometry):
    return [list(r.coords) for polygon in polygons(geometry)
            for r in [polygon.exterior, *polygon.interiors]]


def ring_error(source, simplified):
    """Bound the displacement of each removed chain from its retained chord."""
    require(source[0] == source[-1] and simplified[0] == simplified[-1], "Open ring")
    require(len(simplified) >= 4, "Collapsed ring")
    kept = set(simplified[:-1])
    require(kept.issubset(source), "Simplification introduced a vertex")
    indices = [i for i, point in enumerate(source[:-1]) if point in kept]
    retained = [source[i] for i in indices]
    require(len(retained) == len(kept), "Ambiguous repeated retained vertex")
    edges = lambda points: {frozenset((a, b)) for a, b in zip(points, points[1:] + points[:1])}
    require(edges(retained) == edges(simplified[:-1]), "Ring order changed")
    error = 0.0
    size = len(source) - 1
    for i, start in enumerate(indices):
        end = indices[(i + 1) % len(indices)]
        if end <= start:
            end += size
        a, b = source[start], source[end % size]
        dx, dy = b[0] - a[0], b[1] - a[1]
        squared_length = dx * dx + dy * dy
        require(squared_length > 0, "Collapsed edge")
        for j in range(start + 1, end):
            point = source[j % size]
            t = max(0, min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / squared_length))
            error = max(error, math.hypot(point[0] - a[0] - t * dx, point[1] - a[1] - t * dy))
    return error


def metrics(raw, geometries):
    return {
        "bytes": len(raw),
        "gzip_bytes": len(gzip.compress(raw, compresslevel=9, mtime=0)),
        "features": len(geometries),
        "polygons": sum(len(polygons(g)) for g in geometries),
        "rings": sum(len(rings(g)) for g in geometries),
        "vertices": int(sum(shapely.get_num_coordinates(geometries))),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Validate that the checked-in output is reproducible")
    args = parser.parse_args()
    source_bytes = gzip.decompress(SOURCE.read_bytes())
    require(hashlib.sha256(source_bytes).hexdigest() == SOURCE_SHA256, "Original source checksum changed")
    data = json.loads(source_bytes)
    original = [shape(feature["geometry"]) for feature in data["features"]]
    require(all(shapely.is_valid(original)), "Original contains invalid geometry")
    require(shapely.coverage_is_valid(original), "Original boundaries are not an edge-matched coverage")

    simplified = shapely.coverage_simplify(original, TOLERANCE)
    require(all(shapely.is_valid(simplified)), "Invalid simplified geometry")
    require(shapely.coverage_is_valid(simplified), "Simplification introduced mismatched edges or overlaps")
    max_error = 0.0
    for before, after in zip(original, simplified):
        require(before.geom_type == after.geom_type, "Geometry type changed")
        require(len(polygons(before)) == len(polygons(after)), "An island was removed")
        require(len(rings(before)) == len(rings(after)), "A ring was removed")
        for source_ring, result_ring in zip(rings(before), rings(after)):
            max_error = max(max_error, ring_error(source_ring, result_ring))
    require(max_error <= MAX_ERROR_DEGREES, "Displacement exceeded the configured bound")

    result = {
        "type": "FeatureCollection",
        "features": [
            {"type": "Feature", "properties": {"NAME_2014": feature["properties"]["NAME_2014"]},
             "geometry": mapping(geometry)}
            for feature, geometry in zip(data["features"], simplified)
        ],
    }
    encoded = (json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n").encode()
    # Validate the actual serialized artifact, not only GEOS's in-memory result.
    reloaded = [shape(feature["geometry"]) for feature in json.loads(encoded)["features"]]
    require(all(shapely.is_valid(reloaded)) and shapely.coverage_is_valid(reloaded), "Invalid serialized coverage")
    if args.check:
        require(OUTPUT.read_bytes() == encoded, "Generated map is out of date; run scripts/optimize-map.py")
    else:
        OUTPUT.write_bytes(encoded)
    print(json.dumps({
        "shapely": shapely.__version__, "geos": shapely.geos_version_string,
        "before": metrics(source_bytes, original), "after": metrics(encoded, reloaded),
        "max_displacement_degrees": max_error,
        "max_displacement_metres_upper_bound": max_error * 111700,
        "valid_geometries": True, "valid_shared_boundary_coverage": True,
    }, indent=2))


if __name__ == "__main__":
    main()
