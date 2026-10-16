#!/usr/bin/env python3
"""Inventory a Shockwave 3D (.w3d / IFX) file: block list, model nodes, resources, shaders.
Shockwave W3D blocks are: u32 type, u32 size, data padded to 4 (no metadata field, unlike U3D).
Usage: w3d_inventory.py <file.w3d> [out.json]"""
import json, struct, sys, re

KIND = {0x00584649: 'header', 0xFFFFFF01: 'file_ref/priority', 0xFFFFFF02: 'modifier_chain_hdr',
        0xFFFFFF72: 'model_node', 0xFFFFFF74: 'view_node', 0xFFFFFF71: 'light_node', 0xFFFFFF50: 'light_resource',
        0xFFFFFF45: 'mesh_declaration', 0xFFFFFF47: 'mesh_skeleton/bones', 0xFFFFFF48: 'mesh_shading',
        0xFFFFFF49: 'mesh_geometry(compressed)', 0xFFFFFF10: 'shader', 0xFFFFFF36: 'material'}

def strings(b):
    out, p = [], 0
    while p + 2 <= len(b):
        n = struct.unpack_from('<H', b, p)[0]
        s = b[p + 2:p + 2 + n]
        if 0 < n < 80 and all(32 <= x < 127 for x in s):
            out.append(s.decode()); p += 2 + n
        else:
            p += 1
    return out

def main(path, out=None):
    d = open(path, 'rb').read(); p = 0; blocks = []
    while p + 8 <= len(d):
        t, n = struct.unpack_from('<II', d, p); body = d[p + 8:p + 8 + n]
        blocks.append(dict(offset=p, type=hex(t), kind=KIND.get(t, 'unknown'), size=n, strings=strings(body)[:6]))
        p += 8 + ((n + 3) & ~3)
    models = {}
    for b in blocks:
        s = b['strings']
        if b['kind'] == 'model_node' and s:
            models[s[0]] = dict(node_refs=s[1:])
        if b['kind'] == 'mesh_geometry(compressed)' and s:
            models.setdefault(s[0], {})['geometry_bytes'] = models.get(s[0], {}).get('geometry_bytes', 0) + b['size']
    res = dict(file=path, bytes=len(d), parsed_to=p, block_count=len(blocks),
               models=models,
               shaders=[b['strings'][0] for b in blocks if b['kind'] == 'shader' and b['strings']],
               materials=[b['strings'][0] for b in blocks if b['kind'] == 'material' and b['strings']],
               blocks=blocks)
    if out: json.dump(res, open(out, 'w'), indent=1)
    print(f"{len(blocks)} blocks, parsed {p}/{len(d)} bytes, {len(models)} models, {len(res['shaders'])} shaders")
    for m, v in models.items(): print(f"  {m:24} geom={v.get('geometry_bytes',0):7}  refs={v.get('node_refs')}")

if __name__ == '__main__': main(*sys.argv[1:3])
