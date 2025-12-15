import re

file_path = r"c:\Users\Jose Iturralde\Documents\1 thesis\New\capstone\src\pages\admin\EnhancedCourseManagement.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define replacements based on context
replacements = [
    # Errors
    (r"showAlert\(`Failed to ([^`]+)`, 'Notification'\)", r"showAlert(`Failed to \1`, 'Error', 'error')"),
    (r"showAlert\(`Error ([^`]+)`, 'Notification'\)", r"showAlert(`Error \1`, 'Error', 'error')"),
    (r"showAlert\('([^']*Failed to[^']*)', 'Notification'\)", r"showAlert('\1', 'Error', 'error')"),
    (r"showAlert\('Selected program section not found', 'Notification'\)", r"showAlert('Selected program section not found', 'Error', 'error')"),
    
    # Success messages
    (r"showAlert\(`([^`]*successfully[^`]*!)`, 'Notification'\)", r"showAlert(`\1`, 'Success', 'success')"),
    (r"showAlert\('([^']*successfully[^']*!)', 'Notification'\)", r"showAlert('\1', 'Success', 'success')"),
    (r"showAlert\(`Successfully ([^`]+)!`, 'Notification'\)", r"showAlert(`Successfully \1!`, 'Success', 'success')"),
    
    # Mixed results (partial success with errors)
    (r"showAlert\(`Imported \$\{successCount\} of \$\{importPreview\.length\} courses\.\\n\\nErrors:\\n\$\{errors\.join\('\\n'\)\}`, 'Notification'\)", 
     r"showAlert(`Imported ${successCount} of ${importPreview.length} courses.\n\nErrors:\n${errors.join('\n')}`, 'Warning', 'warning')"),
    (r"showAlert\(`Updated \$\{successCount\} of \$\{selectedCourses\.length\} courses\.\\n\\nErrors:\\n\$\{errors\.join\('\\n'\)\}`, 'Notification'\)",
     r"showAlert(`Updated ${successCount} of ${selectedCourses.length} courses.\n\nErrors:\n${errors.join('\n')}`, 'Warning', 'warning')"),
    (r"showAlert\(`Archived \$\{successCount\} of \$\{selectedCourses\.length\} courses\.\\n\\nErrors:\\n\$\{errors\.join\('\\n'\)\}`, 'Notification'\)",
     r"showAlert(`Archived ${successCount} of ${selectedCourses.length} courses.\n\nErrors:\n${errors.join('\n')}`, 'Warning', 'warning')"),
]

# Apply replacements
for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacements complete!")

# Count remaining
remaining = len(re.findall(r"showAlert.*'Notification'", content))
print(f"Remaining 'Notification' alerts: {remaining - 1}")  # -1 for function definition
