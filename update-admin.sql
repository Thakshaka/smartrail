-- Update john.doe@example.com to admin role
UPDATE users SET role = 'admin' WHERE email = 'john.doe@example.com';

-- Verify the update
SELECT email, first_name, last_name, role FROM users WHERE email = 'john.doe@example.com';
