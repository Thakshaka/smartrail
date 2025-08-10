-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- Create index on role column for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'user' role if null
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Create a default admin user (password: admin123)
-- Note: In production, change this password immediately
INSERT INTO users (email, password, first_name, last_name, role) 
VALUES (
  'admin@smartrail.lk', 
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAHAFnK', -- admin123
  'System', 
  'Administrator', 
  'admin'
) ON CONFLICT (email) DO UPDATE SET role = 'admin';

-- Add constraint to ensure role is either 'user' or 'admin'
ALTER TABLE users ADD CONSTRAINT check_user_role CHECK (role IN ('user', 'admin'));
