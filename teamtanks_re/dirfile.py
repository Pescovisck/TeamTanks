import struct
class Movie:
    def __init__(s, path):
        d = s.d = open(path, 'rb').read()
        assert d[:4] == b'XFIR'
        mo = struct.unpack_from('<I', d, 24)[0]
        hl, el, mx, used = struct.unpack_from('<HHii', d, mo + 8)
        p = mo + 8 + hl
        s.ch = {}
        for i in range(used):
            t, ln, off = struct.unpack_from('<4sII', d, p + i * el)
            s.ch[i] = (t[::-1].decode('latin1'), ln, off)
        # KEY*: owner cast chunk -> child chunks
        kid = next(i for i, c in s.ch.items() if c[0] == 'KEY*')
        k = s.body(kid)
        ps, ks, mxk, nk = struct.unpack_from('<HHII', k, 0)
        s.children = {}
        for i in range(nk):
            sec, cast, fc = struct.unpack_from('<II4s', k, ps + i * ks)
            s.children.setdefault(cast, []).append((fc[::-1].decode('latin1'), sec))
    def body(s, i):
        t, ln, off = s.ch[i]
        return s.d[off + 8: off + 8 + ln]
    def child(s, cast, tag):
        for t, sec in s.children.get(cast, []):
            if t == tag: return sec
    def casts(s):
        for i, (t, ln, off) in s.ch.items():
            if t == 'CASt':
                b = s.body(i)
                typ, il, sl = struct.unpack('>III', b[:12])
                info = b[12:12 + il]
                spec = b[12 + il:12 + il + sl]
                yield i, typ, parse_name(info), spec

def parse_name(info):
    # info: u32 dataOffset ... at dataOffset: u16 count, u32 offsets[count+1], strings
    try:
        do = struct.unpack('>I', info[:4])[0]
        n = struct.unpack('>H', info[do:do + 2])[0]
        offs = struct.unpack('>%dI' % (n + 1), info[do + 2:do + 2 + 4 * (n + 1)])
        base = do + 2 + 4 * (n + 1)
        if n < 2: return ''
        nb = info[base + offs[1]: base + offs[2]]
        return nb[1:1 + nb[0]].decode('latin1') if nb else ''
    except Exception:
        return ''
