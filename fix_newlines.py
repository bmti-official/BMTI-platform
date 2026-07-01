with open('src/bmti_results.js', 'r', encoding='utf-8') as f:
    text = f.read()

inside_string = False
escaped = False
out = []
for c in text:
    if c == '\\' and not escaped:
        escaped = True
        out.append(c)
        continue
    
    if c == '"' and not escaped:
        inside_string = not inside_string
    
    if c == '\n' and inside_string:
        out.append('\\n')
    else:
        out.append(c)
        
    escaped = False

with open('src/bmti_results.js', 'w', encoding='utf-8') as f:
    f.write("".join(out))
print("Fixed newlines!")
