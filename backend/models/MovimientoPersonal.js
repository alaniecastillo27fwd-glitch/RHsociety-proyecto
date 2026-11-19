import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const MovimientoPersonal = sequelize.define('MovimientoPersonal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  colaborador_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('ingreso', 'salida', 'ascenso'),
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'movimientos_personal',
  timestamps: true,
});

export default MovimientoPersonal;
