import re
import json

with open('src/bmti_results.js', 'r', encoding='utf-8') as f:
    content = f.read()

data = json.load(open('extracted_reports_final.json'))

for key, fields in data.items():
    section_match = re.search(r'("' + key + r'":\s*\{)(.*?)(    "fourTraits")', content, flags=re.DOTALL)
    if not section_match:
        # Actually fourTraits is BEFORE howToChooseInstructor. Let's match the whole block for a key
        # "ACDZ": { ... },\n  "ACDM"
        pass
        
    # We can just match the fields individually.
    # The fields are within the block of each key. We can find the boundaries.
    
    # Better approach: find the block for the key
    block_pattern = r'("' + key + r'":\s*\{)(.*?\n  \}(?:,|))'
    block_match = re.search(block_pattern, content, flags=re.DOTALL)
    
    if block_match:
        start_str = block_match.group(1)
        middle_str = block_match.group(2)
        
        # Replace the fields inside this block
        for field in ["summary", "howToChooseInstructor", "whyQuit", "worstVibe", "checkPoints"]:
            # Need to find the field: "summary": "...",
            # It might end with a comma, or not (if it's the last item, like checkPoints)
            
            # Use a lambda that returns the JSON-escaped string
            field_pattern = r'("' + field + r'":\s*)".*?"(,|)\n'
            middle_str = re.sub(
                field_pattern,
                lambda m, f=field, fd=fields[field]: f'"{f}": {json.dumps(fd, ensure_ascii=False)}{m.group(2)}\n',
                middle_str,
                flags=re.DOTALL
            )
            
            # Handle checkPoints if it's the last item without a comma
            field_pattern2 = r'("' + field + r'":\s*)".*?"\n'
            middle_str = re.sub(
                field_pattern2,
                lambda m, f=field, fd=fields[field]: f'"{f}": {json.dumps(fd, ensure_ascii=False)}\n',
                middle_str,
                flags=re.DOTALL
            )
        
        content = content[:block_match.start()] + start_str + middle_str + content[block_match.end():]

with open('src/bmti_results.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done injecting!")
