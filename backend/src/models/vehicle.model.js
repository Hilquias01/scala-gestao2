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
      allowNull: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    initial_km: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    renavam: {
      type: DataTypes.STRING(11), // 11 dígitos do Renavam
      allowNull: true,
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
