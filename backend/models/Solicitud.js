import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Solicitud = sequelize.define('Solicitud', {
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
    type: DataTypes.ENUM(
      'vacaciones',
      'permiso_con_goce',
      'permiso_sin_goce',
      'duelo',
      'estudio',
      'teletrabajo_extra'
    ),
    allowNull: false,
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dias_solicitados: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  motivo: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada'),
    allowNull: false,
    defaultValue: 'pendiente',
  },
  aprobador_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  creada_en: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'solicitudes',
  timestamps: true,
});

export default Solicitud;
