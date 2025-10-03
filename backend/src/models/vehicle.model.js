const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Vehicle = sequelize.define('Vehicle', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    plate: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true,
    },
    model: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    manufacturer: {
      type: DataTypes.STRING,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    initial_km: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ativo', 'inativo', 'manutencao'),
      defaultValue: 'ativo',
    },
  }, {
    tableName: 'vehicles',
    timestamps: true,
  });

  return Vehicle;
};