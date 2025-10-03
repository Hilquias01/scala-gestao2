const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Revenue = sequelize.define('Revenue', {
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
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // A associação com um veículo é opcional
    },
  }, {
    tableName: 'revenues',
    timestamps: true,
  });

  return Revenue;
};