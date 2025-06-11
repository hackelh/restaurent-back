const { sequelize } = require('./config/database');
const path = require('path');
const Umzug = require('umzug');

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, './migrations'),
    params: [
      sequelize.getQueryInterface(),
      sequelize.constructor,
      () => {
        throw new Error('Migration tried to use old style "done" callback.');
      }
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

const runMigrations = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');
    
    const migrations = await umzug.up();
    console.log('Migrations up to date', {
      files: migrations.map(mig => mig.file)
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
};

runMigrations();
