const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Refueling = sequelize.define('Refueling', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY, // Armazena apenas a data (AAAA-MM-DD)
      allowNull: false,
    },
    liters: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    price_per_liter: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
    },
    total_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    vehicle_km: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'KM do veículo no momento do abastecimento',
    },
    // Chaves estrangeiras serão definidas nas associações
    vehicle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    tableName: 'refuelings',
    timestamps: true,
  });

  return Refueling;
};