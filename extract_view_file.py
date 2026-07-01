import json
import re

log_file = '/Users/ieeeungjoon/.gemini/antigravity-ide/brain/c61d6b45-49b5-4cca-b6da-59f512094feb/.system_generated/logs/transcript_full.jsonl'
lines_dict = {}

with open(log_file, 'r') as f:
    for line in f:
        data = json.loads(line)
        content = data.get('content', '')
        if 'ResultView.jsx' in content:
            # Match lines like "123:             <div className="
            for match in re.finditer(r'^(\d+):\s(.*)$', content, re.MULTILINE):
                line_num = int(match.group(1))
                line_text = match.group(2)
                lines_dict[line_num] = line_text

if lines_dict:
    max_line = max(lines_dict.keys())
    print(f"Extracted up to line {max_line}")
    with open('ResultView_reconstructed.jsx', 'w') as out:
        for i in range(1, max_line + 1):
            out.write(lines_dict.get(i, f"// MISSING LINE {i}") + "\n")
else:
    print("No lines found")
