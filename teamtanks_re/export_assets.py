#!/usr/bin/env python3
"""Export Team Tanks assets from the extracted Director 12 movie (teamtanks10.dxr).
Usage: export_assets.py <movie.dxr> <outdir>"""
import os, re, struct, sys, zlib, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dirfile import Movie

def png(path, w, h, rgba):
    raw = b''.join(b'\0' + rgba[y * w * 4:(y + 1) * w * 4] for y in range(h))
    c = lambda t, d: struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d))
    open(path, 'wb').write(b'\x89PNG\r\n\x1a\n' + c(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
                           + c(b'IDAT', zlib.compress(raw, 6)) + c(b'IEND', b''))

def unrle(b, want):
    if len(b) >= want: return b[:want]
    o = bytearray(); i = 0
    while i < len(b) and len(o) < want:
        n = b[i]; i += 1
        if n < 0x80: o += b[i:i + n + 1]; i += n + 1
        else: o += bytes([b[i]]) * (257 - n); i += 1
    return bytes(o.ljust(want, b'\0'))

def safe(n): return re.sub(r'[^\w.\- ]', '_', n).strip() or 'unnamed'

def main(src, out):
    m = Movie(src)
    for sub in ('bitmaps', 'sounds', '3d', 'flash', 'fonts', 'text', 'other'):
        os.makedirs(os.path.join(out, sub), exist_ok=True)
    idx = []
    for cid, typ, name, spec in m.casts():
        nm = safe(name) + f'_{cid}'
        if typ == 1:
            sec = m.child(cid, 'BITD')
            if sec is None: continue
            top, left, bot, right = struct.unpack('>4h', spec[2:10])
            w, h = right - left, bot - top
            planes = unrle(m.body(sec), w * h * 4)
            alfa = m.child(cid, 'ALFA')
            a_pl = unrle(m.body(alfa), w * h) if alfa is not None else None
            px = bytearray(w * h * 4)
            for y in range(h):
                row = planes[y * w * 4:(y + 1) * w * 4]  # A R G B planes per row
                for x in range(w):
                    px[(y * w + x) * 4:(y * w + x) * 4 + 4] = bytes((row[w + x], row[2 * w + x], row[3 * w + x],
                                                                     a_pl[y * w + x] if a_pl else 255))
            f = f'bitmaps/{nm}.png'; png(os.path.join(out, f), w, h, bytes(px))
            idx.append(dict(cast=cid, type='bitmap', name=name, file=f, size=[w, h], alpha=alfa is not None))
        elif typ == 6:
            e, hh, ss = m.child(cid, 'ediM'), m.child(cid, 'sndH'), m.child(cid, 'sndS')
            if e is not None:
                b = m.body(e)
                hl = 0 if b[:3] == b'ID3' or (b[0] == 0xFF and b[1] & 0xE0 == 0xE0) else struct.unpack('>I', b[:4])[0]
                k = 0 if hl == 0 else next((i for i in range(hl, len(b) - 1) if b[i] == 0xFF and b[i + 1] & 0xE0 == 0xE0), hl)
                f = f'sounds/{nm}.mp3'; open(os.path.join(out, f), 'wb').write(b[k:])
                idx.append(dict(cast=cid, type='sound', name=name, file=f, codec='SWA/MP3'))
            elif hh is not None and ss is not None:
                H = struct.unpack('>25I', m.body(hh)[:100])
                rate, bits, chans = H[11], H[17] or 8, H[18] or 1
                pcm = m.body(ss)
                if bits == 16: pcm = b''.join(pcm[i + 1:i + 2] + pcm[i:i + 1] for i in range(0, len(pcm) - 1, 2))
                f = f'sounds/{nm}.wav'
                with open(os.path.join(out, f), 'wb') as o:
                    br = rate * chans * bits // 8
                    o.write(b'RIFF' + struct.pack('<I', 36 + len(pcm)) + b'WAVEfmt ' + struct.pack('<IHHIIHH', 16, 1, chans, rate, br, chans * bits // 8, bits)
                            + b'data' + struct.pack('<I', len(pcm)) + pcm)
                idx.append(dict(cast=cid, type='sound', name=name, file=f, codec=f'PCM {rate}Hz {bits}bit x{chans}'))
        elif typ == 15:
            sec = m.child(cid, 'XMED')
            if sec is None: idx.append(dict(cast=cid, type='xtra', name=name, file=None)); continue
            b = m.body(sec)
            if b[:4] == b'3DEM' and b.find(b'IFX', 0, 64) >= 0:
                f = f'3d/{nm}.w3d'; data = b[b.find(b'IFX', 0, 64):]; kind = 'shockwave3d'
            elif b[12:15] in (b'FWS', b'CWS'):
                f = f'flash/{nm}.swf'; data = b[12:]; kind = 'flash'
            elif b[:4] == b'PFR1':
                f = f'fonts/{nm}.pfr'; data = b; kind = 'font'
            elif b[:4] == b'FFFF':
                # styled text: sections are \x03 + id(4 hex) + len(8 hex) + count(8 hex);
                # section 0002 holds "<hex length>,<text>" (absent = empty member)
                data = b''
                for x in re.finditer(rb'\x03([0-9A-F]{4})([0-9A-F]{8})([0-9A-F]{8})', b):
                    if x.group(1) == b'0002':
                        body = b[x.end():x.end() + int(x.group(2), 16)].lstrip(b'\0')
                        n, _, txt = body.partition(b',')
                        data = txt[:int(n, 16)].replace(b'\r', b'\n'); break
                f = f'text/{nm}.txt'; kind = 'text'
            else:
                f = f'other/{nm}.bin'; data = b; kind = 'unknown'
            open(os.path.join(out, f), 'wb').write(data)
            idx.append(dict(cast=cid, type=kind, name=name, file=f, bytes=len(data)))
    json.dump(idx, open(os.path.join(out, 'index.json'), 'w'), indent=1)
    from collections import Counter
    print(Counter(i['type'] for i in idx))

if __name__ == '__main__': main(*sys.argv[1:3])
