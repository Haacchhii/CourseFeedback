import re

file_path = r"c:\Users\Jose Iturralde\Documents\1 thesis\New\capstone\src\pages\admin\EnhancedCourseManagement.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern 1: Delete course (line 751)
content = re.sub(
    r"(\s+)if \(window\.confirm\(`⚠️ DELETE \"(\$\{course\.name\})\".*?\)\) \{\s*try \{",
    r"\1showConfirm(\n\1  `⚠️ DELETE \"${course.name}\"?\\n\\nThis action CANNOT be undone!\\n\\nAll associated evaluations and data will be permanently removed.`,\n\1  async () => {\n\1    try {",
    content,
    flags=re.DOTALL
)

# Close delete course callback (find the closing brace after setSubmitting(false))
content = re.sub(
    r"(handleDeleteCourse.*?setSubmitting\(false\)\s*\}\s*)\}\s*\}",
    r"\1    }\n      },\n      '⚠️ Confirm Delete',\n      'Delete Course'\n    )\n  }",
    content,
    flags=re.DOTALL,
    count=1
)

# Pattern 2: Remove student from section (line 863) - simple return
content = re.sub(
    r"(\s+)if \(!window\.confirm\(`Remove \$\{studentName\} from this section\?`\)\) return",
    r"\1showConfirm(`Remove ${studentName} from this section?`, async () => {",
    content
)

# Add closing brace after the remove student logic - find the showAlert success
content = re.sub(
    r"(const studentName = .*)(\s+showAlert\(`\$\{studentName\} removed successfully!`.*?setSubmitting\(false\)\s*\})",
    r"\1\2\n    }, 'Confirm Removal', 'Remove Student')",
    content,
    flags=re.DOTALL,
    count=1
)

# Pattern 3: Remove student from program section (line 919-920) - multiline confirm
content = re.sub(
    r"(\s+)if \(!window\.confirm\(\s*`Remove.*?`\)\) return",
    r"\1showConfirm(\n\1  `Remove student from program section?`,\n\1  async () => {",
    content,
    flags=re.DOTALL
)

# Pattern 4: Bulk enroll validation errors (line 1055)
content = re.sub(
    r"(\s+)if \(!window\.confirm\(`There are \$\{bulkEnrollErrors\.length\} validation errors.*?\)\) \{\s*return\s*\}",
    r"\1showConfirm(\n\1  `There are ${bulkEnrollErrors.length} validation errors. Some enrollments may fail. Continue anyway?`,\n\1  async () => {",
    content,
    flags=re.DOTALL
)

# Pattern 5: Bulk enrollment confirm (line 1220)
content = re.sub(
    r"(\s+)if \(!window\.confirm\(confirmMsg\)\) return",
    r"\1showConfirm(confirmMsg, async () => {",
    content
)

# Pattern 6: Delete section (line 1304)
content = re.sub(
    r"(\s+)if \(!window\.confirm\(`⚠️ DELETE Section.*?\)\) \{\s*return\s*\}",
    r"\1showConfirm(\n\1  `⚠️ DELETE Section \"${section.class_code}\"?\\n\\nThis will remove all student enrollments in this section.\\n\\nThis action CANNOT be undone!`,\n\1  async () => {",
    content,
    flags=re.DOTALL
)

# Pattern 7: Delete multiple sections (line 1350)
content = re.sub(
    r"(\s+)if \(!window\.confirm\(`⚠️ DELETE \$\{selectedSections\.length\}.*?\)\) \{\s*return\s*\}",
    r"\1showConfirm(\n\1  `⚠️ DELETE ${selectedSections.length} Section(s)?\\n\\nSections: ${sectionNames}\\n\\nThis will remove all student enrollments in these sections.\\n\\nThis action CANNOT be undone!`,\n\1  async () => {",
    content,
    flags=re.DOTALL
)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("All window.confirm() replacements complete!")

# Count remaining
remaining = len(re.findall(r"window\.confirm", content))
print(f"Remaining window.confirm calls: {remaining}")
