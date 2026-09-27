"""Generate per-county browser boundaries from the pinned NLSC township archive."""
import argparse
import hashlib
import io
import json
import zipfile
from collections import defaultdict
from pathlib import Path

import shapefile
import shapely
from shapely.geometry import shape, mapping

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / 'data/townships.source.zip'
OUTPUT = ROOT / 'static/boundaries'
CHECKSUM = 'e028e5a750eee48cf7913330655e5e5c5bb1f176868fbd0afdfc661fca60557c'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    raw = SOURCE.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == CHECKSUM, 'Unexpected source archive'
    archive = zipfile.ZipFile(io.BytesIO(raw))
    base = 'TOWN_MOI_1120317'
    reader = shapefile.Reader(**{ext: archive.open(f'{base}.{ext}') for ext in ['shp', 'shx', 'dbf']}, encoding='utf-8')
    counties = defaultdict(list)
    manifest = {}
    assert len(reader) == 368
    for item in reader.iterShapeRecords():
        props = item.record.as_dict()
        original = shape(item.shape.__geo_interface__)
        geometry = original.simplify(0.00002, preserve_topology=True)
        assert original.is_valid and geometry.is_valid
        if original.hausdorff_distance(geometry) > 0.000021:
            geometry = original
        assert original.geom_type == geometry.geom_type
        if original.geom_type == 'MultiPolygon':
            assert len(original.geoms) == len(geometry.geoms)
        county = props['COUNTYCODE']
        counties[county].append({'type': 'Feature', 'properties': {
            'city': props['COUNTYNAME'], 'name': props['TOWNNAME'], 'code': props['TOWNCODE']
        }, 'geometry': mapping(geometry)})
        manifest[props['COUNTYNAME']] = f'/boundaries/{county}.json'
    assert len(counties) == 22
    outputs = {f'{code}.json': {'type': 'FeatureCollection', 'features': features} for code, features in counties.items()}
    outputs['index.json'] = manifest
    OUTPUT.mkdir(exist_ok=True)
    for name, data in outputs.items():
        encoded = (json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
        path = OUTPUT / name
        if args.check:
            assert path.read_bytes() == encoded, f'Outdated {path}'
        else:
            path.write_bytes(encoded)
    print(f'{len(counties)} counties / {len(reader)} townships / {sum((OUTPUT / n).stat().st_size for n in outputs):,} bytes')


if __name__ == '__main__':
    main()
