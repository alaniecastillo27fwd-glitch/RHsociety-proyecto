import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const Incapacidad = sequelize.define('Incapacidad', {
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
      'enfermedad_comun_ccss',
      'riesgo_trabajo_ins',
      'maternidad'
    ),
    allowNull: false,
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dias: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  entidad: {
    type: DataTypes.ENUM('CCSS', 'INS'),
    allowNull: false,
  },
  numero_boleta: {
    type: DataTypes.STRING(60),
    allowNull: false,
  },
}, {
  tableName: 'incapacidades',
  timestamps: true,
});

export default Incapacidad;
