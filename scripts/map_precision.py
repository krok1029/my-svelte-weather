"""Shorten GeoJSON coordinates without removing vertices, islands, or holes."""
import math

from shapely.geometry import mapping, shape

# Seven decimals retain even the narrow township rings that collapse at six.
DECIMALS = 7


def rounded_geometry(geometry, decimals=DECIMALS):
    """Return validated GeoJSON and the maximum corresponding-vertex displacement."""
    def rounded(values):
        if isinstance(values[0], (list, tuple)):
            return [rounded(value) for value in values]
        return [round(value, decimals) for value in values]

    def rings(value):
        polygons = [value] if value.geom_type == 'Polygon' else list(value.geoms)
        return [ring for polygon in polygons for ring in [polygon.exterior, *polygon.interiors]]

    result = mapping(geometry)
    result['coordinates'] = rounded(result['coordinates'])
    restored = shape(result)
    if not restored.is_valid or restored.geom_type != geometry.geom_type:
        raise ValueError('Coordinate rounding changed geometry validity or type')
    before_rings, after_rings = rings(geometry), rings(restored)
    if len(before_rings) != len(after_rings):
        raise ValueError('Coordinate rounding removed an island or hole')
    max_error = 0.0
    for before, after in zip(before_rings, after_rings):
        if len(before.coords) != len(after.coords) or not after.is_ring or before.is_ccw != after.is_ccw:
            raise ValueError('Coordinate rounding changed ring structure')
        for old, new in zip(before.coords, after.coords):
            max_error = max(max_error, math.dist(old, new))
    # Corresponding endpoints bound every point along the same straight edge.
    if max_error > math.sqrt(2) * 0.5 * 10 ** -decimals + 1e-12:
        raise ValueError('Coordinate rounding exceeded its displacement bound')
    return result, max_error
