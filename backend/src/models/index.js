const sequelize = require('../config/database');
const { Sequelize } = require('sequelize');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Importa os modelos
db.User = require('./user.model.js')(sequelize);
db.Vehicle = require('./vehicle.model.js')(sequelize);
db.Employee = require('./employee.model.js')(sequelize);
db.Refueling = require('./refueling.model.js')(sequelize);
db.Maintenance = require('./maintenance.model.js')(sequelize);
db.GeneralExpense = require('./generalExpense.model.js')(sequelize);
db.Revenue = require('./revenue.model.js')(sequelize);

// Futuramente, as associações (relacionamentos) serão definidas aqui.
db.Vehicle.hasMany(db.Refueling, { foreignKey: 'vehicle_id' });
db.Refueling.belongsTo(db.Vehicle, { foreignKey: 'vehicle_id' });
db.Employee.hasMany(db.Refueling, { foreignKey: 'employee_id' });
db.Refueling.belongsTo(db.Employee, { foreignKey: 'employee_id' });
db.Employee.hasMany(db.Revenue, { foreignKey: 'employee_id' });
db.Revenue.belongsTo(db.Employee, { foreignKey: 'employee_id' });
db.Vehicle.hasMany(db.Maintenance, { foreignKey: 'vehicle_id' });
db.Maintenance.belongsTo(db.Vehicle, { foreignKey: 'vehicle_id' });
db.Vehicle.hasMany(db.Revenue, { foreignKey: 'vehicle_id' });
db.Revenue.belongsTo(db.Vehicle, { foreignKey: 'vehicle_id' });

module.exports = db;