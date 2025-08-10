const { query } = require('../config/database');

async function makeUserAdmin() {
  try {
    // Update john.doe@example.com to admin role
    const result = await query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING email, role',
      ['admin', 'john.doe@example.com']
    );

    if (result.rows.length > 0) {
      console.log('✅ User updated successfully:');
      console.log('📧 Email:', result.rows[0].email);
      console.log('👑 Role:', result.rows[0].role);
      console.log('🔑 Password: password123');
      console.log('🌐 Admin Dashboard: http://localhost:3000/admin');
    } else {
      console.log('❌ User not found');
    }

  } catch (error) {
    console.error('❌ Error updating user:', error.message);
  } finally {
    process.exit(0);
  }
}

makeUserAdmin();
