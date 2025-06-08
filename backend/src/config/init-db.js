const db = require('./database');
const fs = require('fs');
const path = require('path');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Read SQL file
    const sqlFile = path.join(__dirname, 'database.sql');
    if (!fs.existsSync(sqlFile)) {
      throw new Error('SQL file not found');
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('SQL file loaded successfully');

    // Execute SQL commands
    await db.query(sql);
    console.log('Database tables created successfully');
    
    // Insert default admin user if not exists
    const checkAdmin = await db.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (checkAdmin.rows.length === 0) {
      const hashedPassword = require('bcryptjs').hashSync('admin123', 10);
      await db.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'PIC']
      );
      console.log('Default admin user created');
    }

    console.log('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase(); 