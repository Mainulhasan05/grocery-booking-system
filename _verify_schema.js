const { sequelize } = require('./src/models');

(async () => {
  try {
    const results = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name",
      { raw: true }
    );

    // Debug: show the raw structure
    const rows = results[0];
    console.log('Raw first row:', JSON.stringify(rows[0]));
    console.log('Type:', typeof rows[0]);

    // If rows are strings, the define.freezeTableName or pg driver returns them differently
    console.log('\n=== ALL TABLE ROWS ===');
    console.log(JSON.stringify(rows, null, 2));

    await sequelize.close();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
