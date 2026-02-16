const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EmployeeSalary = sequelize.define('EmployeeSalary', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    period: {
      type: DataTypes.STRING(7), // YYYY-MM
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    tableName: 'employee_salaries',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['employee_id', 'period'] },
    ],
  });

  return EmployeeSalary;
};
