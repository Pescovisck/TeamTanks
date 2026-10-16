import struct,sys,collections
d=open('/tmp/tt/teamtanks.exe','rb').read()
def fourcc(b): return b[::-1].decode('latin1')
def mmap(base):
  # XFIR len kind ; imap at base+12
  assert d[base+12:base+16]==b'pami'
  mo=struct.unpack_from('<I',d,base+24)[0]
  assert d[mo:mo+4]==b'pamm', d[mo:mo+4]
  hl,el,mx,used=struct.unpack_from('<HHii',d,mo+8)
  out=[]
  p=mo+8+hl
  for i in range(used):
    t,ln,off=struct.unpack_from('<4sII',d,p+i*el); out.append((i,fourcc(t),ln,off))
  return out
if __name__=='__main__':
  base=int(sys.argv[1])
  m=mmap(base)
  print(collections.Counter(x[1] for x in m))
  for x in m:
    if x[1] not in('free','junk'): print(x, d[x[3]+8:x[3]+20] if x[1]=='File' else '')
