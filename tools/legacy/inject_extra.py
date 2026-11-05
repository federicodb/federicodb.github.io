import os, glob, re

files = glob.glob("content/apps/*.html")
for f in files:
    with open(f, "r", encoding="utf-8") as fr:
        content = fr.read()
    if not re.search(r'<meta\s+name=["\']description["\']', content):
        # We don't have a custom one prepared, so we skip or we can inject a generic one
        # but build.py will now fallback to "Strumento digitale esplorativo..." which is nice.
        pass

