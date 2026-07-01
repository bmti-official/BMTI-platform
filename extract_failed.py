import json

log_file = '/Users/ieeeungjoon/.gemini/antigravity-ide/brain/c61d6b45-49b5-4cca-b6da-59f512094feb/.system_generated/logs/transcript_full.jsonl'

with open(log_file, 'r') as f:
    for line in f:
        data = json.loads(line)
        if 'tool_calls' in data:
            for call in data['tool_calls']:
                name = call.get('name')
                args = call.get('args', {})
                if name == 'multi_replace_file_content' and args.get('TargetFile', '').endswith('ResultView.jsx'):
                    for chunk in args.get('ReplacementChunks', []):
                        if 'QUIT_REASON_DATA' in chunk.get('ReplacementContent', ''):
                            print("FOUND QUIT_REASON_DATA")
                            print(chunk.get('ReplacementContent', ''))
                        if 'WORST_VIBE_DATA' in chunk.get('ReplacementContent', ''):
                            print("FOUND WORST_VIBE_DATA")
                            print(chunk.get('ReplacementContent', ''))
                        if 'BODY_GUIDE_DATA' in chunk.get('ReplacementContent', ''):
                            print("FOUND BODY_GUIDE_DATA")
                            print(chunk.get('ReplacementContent', ''))
