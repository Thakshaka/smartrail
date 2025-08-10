const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function createAdminUser() {
  try {
    // Hash the password
    const password = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if admin user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@smartrail.lk']
    );

    if (existingUser.rows.length > 0) {
      // Update existing user to admin
      await query(
        'UPDATE users SET role = $1, password = $2 WHERE email = $3',
        ['admin', hashedPassword, 'admin@smartrail.lk']
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      await query(
        `INSERT INTO users (email, password, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin@smartrail.lk', hashedPassword, 'System', 'Administrator', 'admin']
      );
      console.log('✅ Admin user created successfully');
    }

    console.log('📧 Email: admin@smartrail.lk');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();
