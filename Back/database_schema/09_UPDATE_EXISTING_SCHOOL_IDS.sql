-- Update existing student users to have school_id values
-- Extract from email prefix or generate from user ID

-- For students with emails like "student1@...", extract the prefix
UPDATE users 
SET school_id = SPLIT_PART(email, '@', 1)
WHERE role = 'student' 
  AND (school_id IS NULL OR school_id = '')
  AND email LIKE 'student%@%';

-- For other students without school_id, generate from user ID
UPDATE users 
SET school_id = CONCAT('STU', LPAD(id::TEXT, 5, '0'))
WHERE role = 'student' 
  AND (school_id IS NULL OR school_id = '');

-- Verify the update
SELECT id, email, first_name, last_name, school_id, role
FROM users
WHERE role = 'student'
ORDER BY id
LIMIT 20;
