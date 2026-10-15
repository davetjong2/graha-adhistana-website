#!/usr/bin/env python3
"""Append ?v=<content hash> to every local CSS/JS reference in the pages, so browsers
fetch a file again only when it actually changed. Re-run after editing CSS or JS."""
import hashlib
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
pattern = re.compile(r'((?:href|src)=")(assets/(?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=[0-9a-f]+)?(")')


def stamp(match):
    asset = root / match.group(2)
    if not asset.exists():
        return match.group(0)
    digest = hashlib.md5(asset.read_bytes()).hexdigest()[:8]
    return f"{match.group(1)}{match.group(2)}?v={digest}{match.group(3)}"


for page in sorted(root.glob("*.html")):
    text = page.read_text()
    new = pattern.sub(stamp, text)
    if new != text:
        page.write_text(new)
        print("stamped", page.name)
