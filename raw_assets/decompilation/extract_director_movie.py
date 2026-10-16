"""
TeamTanks Projector Movie Extractor
Extracts the embedded Adobe Director movie containers (XFIR/RIFX) from teamtanks.exe
"""
import os
import struct

EXE_PATH = "teamtanks.exe"
OUTPUT_DIR = "extracted_movies"

def extract_projector():
    if not os.path.exists(EXE_PATH):
        print(f"Error: {EXE_PATH} not found in the current directory.")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    print(f"Scanning {EXE_PATH} for Director movie containers (XFIR)...")

    with open(EXE_PATH, "rb") as f:
        data = f.read()

    pos = 0
    extracted_count = 0
    while True:
        pos = data.find(b"XFIR", pos)
        if pos == -1:
            break

        if pos + 12 <= len(data):
            size = struct.unpack("<I", data[pos+4:pos+8])[0]
            fourcc = data[pos+8:pos+12]
            fourcc_str = fourcc.decode("ascii", errors="replace")[::-1] # reverse for human-readable big-endian

            # Valid Director top-level container FourCCs
            known_types = ["APPL", "MV93", "DIR ", "DXR ", "DCR "]
            if fourcc_str in known_types or fourcc in [b'LPPA', b'39VM']:
                # The total file chunk is 8 bytes header + size
                total_chunk_size = size + 8
                end_pos = pos + total_chunk_size

                if end_pos <= len(data) and size > 1024:
                    extracted_count += 1
                    out_name = f"movie_{extracted_count}_{fourcc_str.strip()}.dir"
                    out_path = os.path.join(OUTPUT_DIR, out_name)
                    print(f"\n[+] Found container #{extracted_count}:")
                    print(f"    Type: {fourcc_str} ({fourcc})")
                    print(f"    Offset: 0x{pos:08X} ({pos} bytes)")
                    print(f"    Size: {size:,} bytes ({size / (1024*1024):.2f} MB)")

                    chunk_data = data[pos:end_pos]
                    with open(out_path, "wb") as out_f:
                        out_f.write(chunk_data)
                    print(f"    Saved to: {out_path}")

        pos += 4

    print(f"\nFinished! Extracted {extracted_count} movie container(s) to '{OUTPUT_DIR}/'.")

if __name__ == "__main__":
    extract_projector()
