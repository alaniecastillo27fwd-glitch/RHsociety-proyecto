import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const ReporteDiario = sequelize.define('ReporteDiario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    unique: true,
  },
  datos_json: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  resumen_texto: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  generado_por: {
    type: DataTypes.STRING(60),
    allowNull: false,
    defaultValue: 'AgenteAnalista_v1',
  },
}, {
  tableName: 'reportes_diarios',
  timestamps: true,
});

export default ReporteDiario;
