const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GeneralExpense = sequelize.define('GeneralExpense', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Ex: Salários, Contas, Administrativo',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'general_expenses',
    timestamps: true,
  });

  return GeneralExpense;
};