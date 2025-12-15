import re

file_path = r"c:\Users\Jose Iturralde\Documents\1 thesis\New\capstone\src\pages\admin\EnhancedCourseManagement.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and convert window.confirm() patterns
# Pattern 1: if (!window.confirm(...)) return/action
# Pattern 2: if (window.confirm(...)) { action }

conversions = []
i = 0
while i < len(lines):
    line = lines[i]
    
    # Match: if (!window.confirm(`message`)) return
    match1 = re.match(r'^(\s+)if \(!window\.confirm\(`([^`]+)`\)\) return\s*$', line)
    if match1:
        indent = match1.group(1)
        message = match1.group(2)
        lines[i] = f"{indent}showConfirm(`{message}`, () => {{\n"
        # Find the next line with actual code to wrap
        j = i + 1
        while j < len(lines) and lines[j].strip() == '':
            j += 1
        if j < len(lines):
            # Inject the action wrap
            lines.insert(j + 1, f"{indent}}})\n{indent}return // Await user confirmation\n")
        i = j + 2
        continue
    
    # Match: if (!window.confirm(...)) {
    match2 = re.match(r'^(\s+)if \(!window\.confirm\((.+)\)\) \{', line)
    if match2:
        indent = match2.group(1)
        message_expr = match2.group(2)
        lines[i] = f"{indent}showConfirm({message_expr}, () => {{\n"
        # No need to change logic, just swap the check
        i += 1
        continue
    
    # Match: if (window.confirm(...)) {
    match3 = re.match(r'^(\s+)if \(window\.confirm\((.+)\)\) \{', line)
    if match3:
        indent = match3.group(1)
        message_expr = match3.group(2)
        lines[i] = f"{indent}showConfirm({message_expr}, () => {{\n"
        i += 1
        continue
    
    i += 1

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("window.confirm conversions complete!")
