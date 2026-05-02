"""Build the free-sampler ZIP. Run once after copying free SVGs."""
import zipfile
from pathlib import Path

HERE = Path(__file__).parent
free_dir = HERE / "free"
zip_path = HERE / "vegetable-icons-free.zip"

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for svg in sorted(free_dir.rglob("*.svg")):
        rel = svg.relative_to(free_dir).as_posix()
        zf.write(svg, arcname=rel)
    zf.writestr("README.md", """# Vegetable Icons — Free Sampler

4 hand-curated vegetable SVG icons in 4 color variants (16 SVG files).
Free for personal & commercial use, no attribution required.

Like these? Get the full 29-icon pack on Gumroad:
https://ecomgendesign.gumroad.com/l/vegetable-icons

- e-ComGen Design
""")

print(f"built {zip_path.name} ({zip_path.stat().st_size} bytes)")
