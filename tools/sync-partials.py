#!/usr/bin/env python3
"""Copy _partials/header.html and _partials/footer.html into every page, replacing the
blocks between the <!-- header:start/end --> and <!-- footer:start/end --> markers."""
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
parts = {name: (root / "_partials" / f"{name}.html").read_text().strip() for name in ("header", "footer")}
for page in sorted(root.glob("*.html")):
    text = page.read_text()
    new = text
    for name, block in parts.items():
        new = re.sub(rf"<!-- {name}:start -->.*?<!-- {name}:end -->", lambda m: block, new, flags=re.S)
    if new != text:
        page.write_text(new)
        print("synced", page.name)
