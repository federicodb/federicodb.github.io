import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace CSS
css_start = content.indexOf('body {\n') if 'body {\n' in content else content.find('body {\n')
# Let's write a python script to patch index.html robustly.
