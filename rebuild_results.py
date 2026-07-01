import json

log_file = '/Users/ieeeungjoon/.gemini/antigravity-ide/brain/c61d6b45-49b5-4cca-b6da-59f512094feb/.system_generated/logs/transcript_full.jsonl'
with open('src/components/ResultView.jsx', 'r') as f:
    content = f.read()

with open(log_file, 'r') as f:
    for line in f:
        data = json.loads(line)
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                name = call.get('name')
                args = call.get('args', {})
                if name == 'replace_file_content' and args.get('TargetFile', '').endswith('ResultView.jsx'):
                    target = args.get('TargetContent', '')
                    repl = args.get('ReplacementContent', '')
                    if target in content:
                        content = content.replace(target, repl)
                        print("Replaced!")
                    else:
                        print("Failed to replace length:", len(target))
                elif name == 'multi_replace_file_content' and args.get('TargetFile', '').endswith('ResultView.jsx'):
                    for chunk in args.get('ReplacementChunks', []):
                        target = chunk.get('TargetContent', '')
                        repl = chunk.get('ReplacementContent', '')
                        if target in content:
                            content = content.replace(target, repl)
                            print("Multi-replaced!")
                        else:
                            print("Failed multi-replace length:", len(target))

with open('src/components/ResultView_recovered.jsx', 'w') as f:
    f.write(content)
print("Done")
