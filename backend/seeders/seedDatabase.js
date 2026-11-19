import bcrypt from 'bcryptjs';
import {
  sequelize,
  syncModels,
  Colaborador,
  SaldoVacaciones,
  Solicitud,
  Incapacidad,
  MovimientoPersonal,
  ConsultaChat,
  ReporteDiario,
  TicketEscalamiento,
} from '../models/index.js';

const TODAY_STR = '2026-11-18';
const TODAY = new Date('2026-11-18T10:00:00Z');

async function seed() {
  const isForce = process.argv.includes('--force');
  console.log(`[Seeder] Iniciando proceso de siembra de datos (Force: ${isForce})...`);

  await syncModels({ alter: true });

  const existingColabs = await Colaborador.count();
  if (existingColabs > 0 && !isForce) {
    console.log(`[Seeder] La base de datos ya contiene ${existingColabs} colaboradores. Usa --force para reiniciar.`);
    process.exit(0);
  }

  // Desactivar restricciones de llaves foráneas para limpieza segura
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
  console.log('[Seeder] Limpiando tablas previas...');
  await TicketEscalamiento.truncate();
  await ConsultaChat.truncate();
  await MovimientoPersonal.truncate();
  await Incapacidad.truncate();
  await Solicitud.truncate();
  await SaldoVacaciones.truncate();
  await ReporteDiario.truncate();
  await Colaborador.truncate();
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

  const defaultPasswordHash = await bcrypt.hash('123456', 10);

  // 1. GENERACIÓN DE COLABORADORES (50 EN TOTAL)
  console.log('[Seeder] Creando colaboradores...');
  
  // Lista de 50 colaboradores sintéticos realistas de Costa Rica
  const colaboradoresData = [
    // 1. Colaborador Principal de Prueba
    {
      codigo_empleado: 'EMP-001',
      nombre: 'Carlos Méndez Alvarado',
      correo: 'carlos.mendez@rhsociety.cr',
      password_hash: defaultPasswordHash,
      departamento: 'Tecnología',
      puesto: 'Desarrollador Full-Stack',
      salario_mensual: 1850000.00,
      fecha_ingreso: '2024-03-15',
      proxima_evaluacion: '2026-12-10',
      fecha_proximo_pago: '2026-11-30',
      rol: 'colaborador',
      estado: 'activo',
    },
    // 2. Compañero para prueba de seguridad (Pregunta 21)
    {
      codigo_empleado: 'EMP-002',
      nombre: 'Juan Rodríguez Chaves',
      correo: 'juan.rodriguez@rhsociety.cr',
      password_hash: defaultPasswordHash,
      departamento: 'Tecnología',
      puesto: 'Ingeniero DevOps',
      salario_mensual: 1950000.00,
      fecha_ingreso: '2023-08-01',
      proxima_evaluacion: '2026-12-15',
      fecha_proximo_pago: '2026-11-30',
      rol: 'colaborador',
      estado: 'activo',
    },
    // 3. Gerente General para prueba de confidencialidad (Pregunta 22)
    {
      codigo_empleado: 'EMP-003',
      nombre: 'Roberto Vargas Mora',
      correo: 'roberto.vargas@rhsociety.cr',
      password_hash: defaultPasswordHash,
      departamento: 'Operaciones',
      puesto: 'Gerente General',
      salario_mensual: 4500000.00, // Salario confidencial
      fecha_ingreso: '2022-01-10',
      proxima_evaluacion: '2026-12-20',
      fecha_proximo_pago: '2026-11-30',
      rol: 'colaborador',
      estado: 'activo',
    },
    // 4. Usuario RRHH Principal de Prueba
    {
      codigo_empleado: 'EMP-004',
      nombre: 'Laura Solís Navarro',
      correo: 'laura.solis@rhsociety.cr',
      password_hash: defaultPasswordHash,
      departamento: 'Recursos Humanos',
      puesto: 'Directora de RRHH',
      salario_mensual: 2800000.00,
      fecha_ingreso: '2022-05-02',
      proxima_evaluacion: '2026-12-05',
      fecha_proximo_pago: '2026-11-30',
      rol: 'rrhh',
      estado: 'activo',
    },
    // 5 y 6. Otros 2 colaboradores con rol rrhh
    {
      codigo_empleado: 'EMP-005',
      nombre: 'Sofía Castro Cordero',
      correo: 'sofia.castro@rhsociety.cr',
      password_hash: defaultPasswordHash,
      departamento: 'Recursos Humanos',
      puesto: 'Especialista en Nómina y Beneficios',
      salario_mensual: 1450000.00,
      fecha_ingreso: '2023-04-18',
      proxima_evaluacion: '2026-12-05',
      fecha_proximo_pago: '2026-11-30',
      rol: 'rrhh',
      estado: 'activo',
    },
    {
      codigo_empleado: 'EMP-006',
      nombre: 'Esteban Morales Valverde',
      correo: 'esteban.morales@rhsociety.cr',
      password_hash: defaultPasswordHash,
      departamento: 'Recursos Humanos',
      puesto: 'Coordinador de Atracción de Talento',
      salario_mensual: 1400000.00,
      fecha_ingreso: '2023-09-01',
      proxima_evaluacion: '2026-12-05',
      fecha_proximo_pago: '2026-11-30',
      rol: 'rrhh',
      estado: 'activo',
    },
  ];

  // Generar los 44 colaboradores adicionales
  const nombresCR = [
    'Alejandro', 'Mariana', 'Diego', 'Valeria', 'Andrés', 'Camila', 'Gabriel', 'Daniela',
    'Felipe', 'Lucía', 'Esteban', 'Paola', 'Mauricio', 'Natalia', 'Javier', 'Elena',
    'Sebastián', 'Adriana', 'Ricardo', 'Beatriz', 'David', 'Silvia', 'Óscar', 'Mónica',
    'Fernando', 'Gabriela', 'Marco', 'Carolina', 'Pablo', 'Verónica', 'Álvaro', 'Patricia',
    'Ignacio', 'Lorena', 'Eduardo', 'Tatiana', 'Gonzalo', 'Irene', 'Manuel', 'Melissa',
    'Guillermo', 'Fabiana', 'Leonardo', 'Clara'
  ];

  const apellidosCR = [
    'Jiménez', 'Quesada', 'Soto', 'Navarro', 'Campos', 'Monge', 'Araya', 'Rojas',
    'Brenes', 'Solano', 'Umaña', 'Carvajal', 'Gutiérrez', 'Vega', 'Alfaro', 'Calderón',
    'Salas', 'Fonseca', 'Herrera', 'Acuña', 'Vargas', 'Cordero', 'Mora', 'Chinchilla',
    'Zúñiga', 'Granados', 'Villalobos', 'Morera', 'Barquero', 'Arguedas', 'Espinoza', 'Sancho',
    'Bolaños', 'Leitón', 'Chacón', 'Segura', 'Madrigal', 'Blanco', 'Murillo', 'Peña',
    'Badilla', 'Montoya', 'Sandoval', 'Pacheco'
  ];

  const depts = ['Tecnología', 'Producto', 'Operaciones', 'Finanzas', 'Ventas'];
  const puestosTech = ['Ingeniero Cloud AWS', 'Arquitecto de Software', 'Desarrollador Frontend', 'QA Automation Lead', 'Data Engineer', 'Ingeniero de Ciberseguridad'];
  const puestosProd = ['Product Manager', 'Diseñador UI/UX', 'Scrum Master', 'Customer Success Specialist'];
  const puestosOps = ['Líder de Soporte 24/7', 'Administrador de Sistemas', 'Analista de Operaciones'];
  const puestosFin = ['Contador General', 'Analista Financiero', 'Especialista en Compras'];
  const puestosVtas = ['Account Executive', 'Business Development Rep', 'Gerente de Alianzas'];

  for (let i = 0; i < 44; i++) {
    const num = i + 7;
    const cod = `EMP-${String(num).padStart(3, '0')}`;
    const nom = `${nombresCR[i]} ${apellidosCR[i]} ${apellidosCR[(i + 5) % apellidosCR.length]}`;
    const dep = depts[i % depts.length];
    let pst = '';
    if (dep === 'Tecnología') pst = puestosTech[i % puestosTech.length];
    else if (dep === 'Producto') pst = puestosProd[i % puestosProd.length];
    else if (dep === 'Operaciones') pst = puestosOps[i % puestosOps.length];
    else if (dep === 'Finanzas') pst = puestosFin[i % puestosFin.length];
    else pst = puestosVtas[i % puestosVtas.length];

    const baseSal = dep === 'Tecnología' ? 1700000 : 1300000;
    const sal = baseSal + ((i * 35000) % 800000);

    const yearIngreso = 2022 + (i % 3);
    const monthIngreso = String((i % 12) + 1).padStart(2, '0');
    const dayIngreso = String((i % 25) + 1).padStart(2, '0');

    colaboradoresData.push({
      codigo_empleado: cod,
      nombre: nom,
      correo: `${nombresCR[i].toLowerCase()}.${apellidosCR[i].toLowerCase()}${i > 25 ? i : ''}@rhsociety.cr`
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      password_hash: defaultPasswordHash,
      departamento: dep,
      puesto: pst,
      salario_mensual: sal,
      fecha_ingreso: `${yearIngreso}-${monthIngreso}-${dayIngreso}`,
      proxima_evaluacion: '2026-12-15',
      fecha_proximo_pago: '2026-11-30',
      rol: 'colaborador',
      estado: (i === 40 || i === 41) ? 'inactivo' : 'activo', // 2 colaboradores dados de baja para historial
    });
  }

  const createdColabs = await Colaborador.bulkCreate(colaboradoresData);
  console.log(`[Seeder] Insertados ${createdColabs.length} colaboradores.`);

  // Configurar jefaturas (Roberto Vargas EMP-003 es jefe general, Laura Solís EMP-004 de RRHH, etc.)
  const roberto = createdColabs.find(c => c.codigo_empleado === 'EMP-003');
  const laura = createdColabs.find(c => c.codigo_empleado === 'EMP-004');
  
  for (const c of createdColabs) {
    if (c.codigo_empleado === 'EMP-003') continue;
    if (c.departamento === 'Recursos Humanos') {
      c.jefe_id = laura.id;
    } else {
      c.jefe_id = roberto.id;
    }
    await c.save();
  }

  // 2. GENERACIÓN DE SALDOS DE VACACIONES
  console.log('[Seeder] Generando saldos de vacaciones...');
  const saldosData = [];

  // Al menos 6 colaboradores deben tener más de 20 días disponibles (ej. 22, 24, 27) para el indicador #5
  const highVacationIndexes = [4, 5, 8, 12, 15, 20, 25]; // 7 colaboradores con riesgo de pasivo

  for (let i = 0; i < createdColabs.length; i++) {
    const colab = createdColabs[i];
    let diasDisponibles = 12.00;
    let diasAsignados = 15.00;
    let diasTomados = 3.00;

    if (colab.codigo_empleado === 'EMP-001') {
      // Carlos Méndez: exactamente 11 días disponibles requeridos por el enunciado
      diasAsignados = 15.00;
      diasTomados = 4.00;
      diasDisponibles = 11.00;
    } else if (colab.codigo_empleado === 'EMP-002') {
      // Juan Rodríguez: 14 días disponibles
      diasAsignados = 15.00;
      diasTomados = 1.00;
      diasDisponibles = 14.00;
    } else if (highVacationIndexes.includes(i)) {
      // Colaboradores con más de 20 días acumulados (riesgo de pasivo laboral)
      const extra = [21.5, 22.0, 24.0, 25.5, 26.0, 27.0, 28.0][highVacationIndexes.indexOf(i)];
      diasAsignados = 30.00; // Acumulado de 2 periodos
      diasTomados = 30.00 - extra;
      diasDisponibles = extra;
    } else {
      diasDisponibles = parseFloat((5 + (i % 12)).toFixed(2));
      diasTomados = parseFloat((diasAsignados - diasDisponibles).toFixed(2));
    }

    saldosData.push({
      colaborador_id: colab.id,
      periodo: '2025-2026',
      dias_asignados: diasAsignados,
      dias_tomados: diasTomados,
      dias_disponibles: diasDisponibles,
    });
  }

  await SaldoVacaciones.bulkCreate(saldosData);
  console.log(`[Seeder] Insertados ${saldosData.length} registros de saldos de vacaciones.`);

  // 3. GENERACIÓN DE SOLICITUDES
  console.log('[Seeder] Generando solicitudes históricas y activas...');
  const solicitudesData = [];

  // A. Solicitud obligatoria de Carlos Méndez: permiso para el viernes (2026-11-20) pendiente (Pregunta 18)
  const carlos = createdColabs.find(c => c.codigo_empleado === 'EMP-001');
  solicitudesData.push({
    colaborador_id: carlos.id,
    tipo: 'permiso_con_goce',
    fecha_inicio: '2026-11-20',
    fecha_fin: '2026-11-20',
    dias_solicitados: 1,
    motivo: 'Cita médica especialista particular y trámites personales',
    estado: 'pendiente',
    aprobador_id: roberto.id,
    creada_en: new Date('2026-11-16T14:30:00Z'),
  });

  // B. 4 solicitudes aprobadas vigentes HOY (2026-11-18) para el indicador #1 ("ausentes hoy")
  solicitudesData.push(
    {
      colaborador_id: createdColabs[7].id,
      tipo: 'vacaciones',
      fecha_inicio: '2026-11-16',
      fecha_fin: '2026-11-20',
      dias_solicitados: 5,
      motivo: 'Vacaciones familiares programadas',
      estado: 'aprobada',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-01T09:00:00Z'),
    },
    {
      colaborador_id: createdColabs[9].id,
      tipo: 'vacaciones',
      fecha_inicio: '2026-11-17',
      fecha_fin: '2026-11-19',
      dias_solicitados: 3,
      motivo: 'Descanso anual fraccionado',
      estado: 'aprobada',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-02T11:00:00Z'),
    },
    {
      colaborador_id: createdColabs[11].id,
      tipo: 'estudio',
      fecha_inicio: '2026-11-18',
      fecha_fin: '2026-11-18',
      dias_solicitados: 1,
      motivo: 'Examen de grado universitario maestría',
      estado: 'aprobada',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-10T08:00:00Z'),
    },
    {
      colaborador_id: createdColabs[13].id,
      tipo: 'duelo',
      fecha_inicio: '2026-11-17',
      fecha_fin: '2026-11-23',
      dias_solicitados: 5,
      motivo: 'Fallecimiento de familiar primer grado (padre)',
      estado: 'aprobada',
      aprobador_id: laura.id,
      creada_en: new Date('2026-11-17T07:30:00Z'),
    }
  );

  // C. 7 solicitudes pendientes adicionales (total 8 pendientes), de las cuales al menos 5 tienen más de 3 días de antigüedad (creadas antes o en 2026-11-14)
  solicitudesData.push(
    // Pendiente > 3 días 1
    {
      colaborador_id: createdColabs[14].id,
      tipo: 'vacaciones',
      fecha_inicio: '2026-12-01',
      fecha_fin: '2026-12-05',
      dias_solicitados: 5,
      motivo: 'Semana de vacaciones en diciembre',
      estado: 'pendiente',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-10T10:00:00Z'), // > 3 días
    },
    // Pendiente > 3 días 2
    {
      colaborador_id: createdColabs[16].id,
      tipo: 'teletrabajo_extra',
      fecha_inicio: '2026-11-23',
      fecha_fin: '2026-11-27',
      dias_solicitados: 2,
      motivo: 'Cuidado temporal de hijo menor convaleciente',
      estado: 'pendiente',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-11T14:15:00Z'), // > 3 días
    },
    // Pendiente > 3 días 3
    {
      colaborador_id: createdColabs[18].id,
      tipo: 'permiso_sin_goce',
      fecha_inicio: '2026-12-10',
      fecha_fin: '2026-12-20',
      dias_solicitados: 8,
      motivo: 'Pasantía técnica internacional',
      estado: 'pendiente',
      aprobador_id: laura.id,
      creada_en: new Date('2026-11-12T09:30:00Z'), // > 3 días
    },
    // Pendiente > 3 días 4
    {
      colaborador_id: createdColabs[21].id,
      tipo: 'vacaciones',
      fecha_inicio: '2026-12-15',
      fecha_fin: '2026-12-22',
      dias_solicitados: 6,
      motivo: 'Vacaciones de fin de año',
      estado: 'pendiente',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-13T16:00:00Z'), // > 3 días
    },
    // Pendiente > 3 días 5
    {
      colaborador_id: createdColabs[23].id,
      tipo: 'estudio',
      fecha_inicio: '2026-11-25',
      fecha_fin: '2026-11-25',
      dias_solicitados: 1,
      motivo: 'Examen de certificación AWS Solutions Architect',
      estado: 'pendiente',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-14T11:20:00Z'), // > 3 días
    },
    // Pendiente reciente (< 3 días) 1
    {
      colaborador_id: createdColabs[26].id,
      tipo: 'vacaciones',
      fecha_inicio: '2026-12-08',
      fecha_fin: '2026-12-11',
      dias_solicitados: 4,
      motivo: 'Asuntos familiares',
      estado: 'pendiente',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-17T15:00:00Z'),
    },
    // Pendiente reciente (< 3 días) 2
    {
      colaborador_id: createdColabs[28].id,
      tipo: 'permiso_con_goce',
      fecha_inicio: '2026-11-24',
      fecha_fin: '2026-11-24',
      dias_solicitados: 1,
      motivo: 'Renovación de pasaporte y visa',
      estado: 'pendiente',
      aprobador_id: roberto.id,
      creada_en: new Date('2026-11-18T08:15:00Z'),
    }
  );

  // D. 30 solicitudes adicionales históricas de septiembre, octubre y principios de noviembre (aprobadas y rechazadas)
  const tiposHistoricos = ['vacaciones', 'permiso_con_goce', 'teletrabajo_extra', 'estudio', 'duelo'];
  for (let i = 0; i < 30; i++) {
    const colab = createdColabs[(i + 5) % createdColabs.length];
    const month = (i % 2 === 0) ? '09' : '10';
    const day = String((i % 20) + 1).padStart(2, '0');
    const dayFin = String((i % 20) + 3).padStart(2, '0');
    const estado = (i % 7 === 0) ? 'rechazada' : 'aprobada';

    solicitudesData.push({
      colaborador_id: colab.id,
      tipo: tiposHistoricos[i % tiposHistoricos.length],
      fecha_inicio: `2026-${month}-${day}`,
      fecha_fin: `2026-${month}-${dayFin}`,
      dias_solicitados: 2,
      motivo: `Solicitud histórica regular #${i + 1}`,
      estado: estado,
      aprobador_id: roberto.id,
      creada_en: new Date(`2026-${month}-${day}T08:30:00Z`),
    });
  }

  await Solicitud.bulkCreate(solicitudesData);
  console.log(`[Seeder] Insertadas ${solicitudesData.length} solicitudes (8 pendientes, 4 vigentes hoy).`);

  // 4. GENERACIÓN DE INCAPACIDADES
  console.log('[Seeder] Generando incapacidades médicas...');
  const incapacidadesData = [
    // 2 incapacidades activas HOY (2026-11-18) para el indicador #1 y #3
    {
      colaborador_id: createdColabs[15].id,
      tipo: 'enfermedad_comun_ccss',
      fecha_inicio: '2026-11-16',
      dias: 5, // del 16 al 20 nov (activa hoy)
      entidad: 'CCSS',
      numero_boleta: 'CCSS-2026-88912',
    },
    {
      colaborador_id: createdColabs[22].id,
      tipo: 'riesgo_trabajo_ins',
      fecha_inicio: '2026-11-14',
      dias: 7, // del 14 al 20 nov (activa hoy)
      entidad: 'INS',
      numero_boleta: 'INS-RT-2026-4401',
    },
  ];

  // 14 incapacidades históricas en septiembre, octubre y noviembre
  for (let i = 0; i < 14; i++) {
    const colab = createdColabs[(i + 10) % createdColabs.length];
    const month = (i < 5) ? '09' : (i < 10 ? '10' : '11');
    const day = String((i % 15) + 1).padStart(2, '0');
    const tipo = (i % 3 === 0) ? 'riesgo_trabajo_ins' : 'enfermedad_comun_ccss';
    const ent = (tipo === 'riesgo_trabajo_ins') ? 'INS' : 'CCSS';

    incapacidadesData.push({
      colaborador_id: colab.id,
      tipo: tipo,
      fecha_inicio: `2026-${month}-${day}`,
      dias: 3 + (i % 4),
      entidad: ent,
      numero_boleta: `${ent}-HIST-2026-${1000 + i}`,
    });
  }

  await Incapacidad.bulkCreate(incapacidadesData);
  console.log(`[Seeder] Insertadas ${incapacidadesData.length} incapacidades (2 activas hoy).`);

  // 5. GENERACIÓN DE MOVIMIENTOS DE PERSONAL
  console.log('[Seeder] Generando movimientos de personal...');
  const movimientosData = [
    // Ingresos y salidas en el mes actual (noviembre 2026) para tasa de rotación
    {
      colaborador_id: createdColabs[42].id,
      tipo: 'ingreso',
      fecha: '2026-11-03',
      motivo: 'Nueva contratación como Desarrollador React',
    },
    {
      colaborador_id: createdColabs[43].id,
      tipo: 'ingreso',
      fecha: '2026-11-10',
      motivo: 'Nueva contratación como QA Specialist',
    },
    {
      colaborador_id: createdColabs[40].id,
      tipo: 'salida',
      fecha: '2026-11-05',
      motivo: 'Renuncia voluntaria por oportunidad en el exterior',
    },
    {
      colaborador_id: createdColabs[41].id,
      tipo: 'salida',
      fecha: '2026-11-12',
      motivo: 'Despido con responsabilidad patronal por reestructuración',
    },
    // Movimientos de septiembre y octubre
    {
      colaborador_id: createdColabs[1].id,
      tipo: 'ascenso',
      fecha: '2026-10-01',
      motivo: 'Promoción a Ingeniero DevOps Senior',
    },
    {
      colaborador_id: createdColabs[8].id,
      tipo: 'ascenso',
      fecha: '2026-09-15',
      motivo: 'Promoción a Product Owner',
    },
    {
      colaborador_id: createdColabs[12].id,
      tipo: 'ingreso',
      fecha: '2026-10-15',
      motivo: 'Contratación para área de ciberseguridad',
    },
    {
      colaborador_id: createdColabs[18].id,
      tipo: 'ingreso',
      fecha: '2026-09-01',
      motivo: 'Ingreso al equipo de datos',
    },
    {
      colaborador_id: createdColabs[24].id,
      tipo: 'salida',
      fecha: '2026-09-30',
      motivo: 'Finalización de contrato temporal',
    },
    {
      colaborador_id: createdColabs[30].id,
      tipo: 'ascenso',
      fecha: '2026-10-15',
      motivo: 'Aumento salarial por mérito técnico',
    },
    {
      colaborador_id: createdColabs[33].id,
      tipo: 'ingreso',
      fecha: '2026-10-02',
      motivo: 'Ingreso al departamento de Ventas',
    },
    {
      colaborador_id: createdColabs[35].id,
      tipo: 'salida',
      fecha: '2026-10-28',
      motivo: 'Renuncia por motivos de salud personal',
    },
  ];

  await MovimientoPersonal.bulkCreate(movimientosData);
  console.log(`[Seeder] Insertados ${movimientosData.length} movimientos de personal.`);

  // 6. GENERACIÓN DE CONSULTAS DE CHAT (65 REGISTROS HISTÓRICOS EN ÚLTIMOS 30 DÍAS)
  console.log('[Seeder] Generando historial de consultas de chat...');
  const consultasData = [];
  const intenciones = ['politicas_vacaciones', 'calculo_aguinaldo', 'reglamento_teletrabajo', 'incapacidades_ccss', 'beneficios_seguro', 'desconocido'];
  const agentes = ['AgentePoliticasRAG', 'AgenteDatosSQL', 'AgenteOrquestador'];

  const preguntasEjemplo = [
    { p: '¿Cuántos días de vacaciones me corresponden al año?', int: 'politicas_vacaciones', docs: ['POL-01'], res: true, esc: false },
    { p: '¿Cuándo se paga el aguinaldo y cómo se calcula?', int: 'calculo_aguinaldo', docs: ['POL-05', 'CAL-01'], res: true, esc: false },
    { p: '¿Cuántos días de teletrabajo puedo hacer por semana?', int: 'reglamento_teletrabajo', docs: ['POL-04'], res: true, esc: false },
    { p: '¿Cómo me pagan si me incapacito 3 días por la CCSS?', int: 'incapacidades_ccss', docs: ['POL-03'], res: true, esc: false },
    { p: '¿Qué cubre el seguro médico privado colectivo?', int: 'beneficios_seguro', docs: ['POL-06'], res: true, esc: false },
    { p: '¿Cuál es el saldo actual de mis vacaciones?', int: 'datos_personales_vacaciones', docs: [], res: true, esc: false },
    { p: '¿Tengo alguna solicitud pendiente de aprobación?', int: 'datos_personales_solicitudes', docs: [], res: true, esc: false },
    { p: '¿Puedo solicitar permiso para trabajar desde otro país 6 meses?', int: 'desconocido', docs: [], res: false, esc: true },
    { p: '¿La empresa paga subsidio para compra de automóvil particular?', int: 'desconocido', docs: [], res: false, esc: true },
    { p: '¿Cómo reporto una denuncia confidencial por acoso laboral?', int: 'codigo_conducta', docs: ['POL-09'], res: true, esc: false },
  ];

  for (let i = 0; i < 65; i++) {
    const item = preguntasEjemplo[i % preguntasEjemplo.length];
    const colab = createdColabs[i % createdColabs.length];
    
    // Distribuir en los últimos 30 días (desde 2026-10-19 hasta 2026-11-18)
    const daysAgo = (i % 28);
    const dateObj = new Date(TODAY.getTime() - (daysAgo * 24 * 60 * 60 * 1000) - (i * 3600000));
    const latency = 1200 + ((i * 137) % 2800); // Entre 1200ms y 4000ms

    consultasData.push({
      colaborador_id: colab.id,
      pregunta: item.p,
      intencion: item.int,
      agente: (item.int.startsWith('datos_personales')) ? 'AgenteDatosSQL' : 'AgentePoliticasRAG',
      documentos_citados: item.docs,
      resuelta: item.res,
      escalada: item.esc,
      latencia_ms: latency,
      fecha: dateObj,
    });
  }

  const createdConsultas = await ConsultaChat.bulkCreate(consultasData);
  console.log(`[Seeder] Insertadas ${createdConsultas.length} consultas históricas de chat.`);

  // 7. GENERACIÓN DE TICKETS DE ESCALAMIENTO (VINCULADOS A CONSULTAS ESCALADAS)
  console.log('[Seeder] Generando tickets de escalamiento...');
  const escaladas = createdConsultas.filter(c => c.escalada);
  const ticketsData = escaladas.map((c, idx) => ({
    colaborador_id: c.colaborador_id,
    consulta_chat_id: c.id,
    pregunta_original: c.pregunta,
    motivo_escalamiento: 'Respuesta no encontrada en la base normativa documental o política no contemplada',
    estado: (idx === 0) ? 'abierto' : (idx === 1 ? 'en_revision' : 'resuelto'),
    respuesta_rrhh: (idx === 2) ? 'El teletrabajo internacional requiere adenda especial aprobada por Gerencia General.' : null,
  }));

  await TicketEscalamiento.bulkCreate(ticketsData);
  console.log(`[Seeder] Insertados ${ticketsData.length} tickets de escalamiento.`);

  // 8. GENERACIÓN DE REPORTES DIARIOS (7 DÍAS HISTÓRICOS: 2026-11-12 A 2026-11-18)
  console.log('[Seeder] Generando 7 reportes diarios para el selector del Dashboard...');
  const reportesData = [];

  for (let d = 0; d < 7; d++) {
    const reportDateObj = new Date(TODAY.getTime() - (d * 24 * 60 * 60 * 1000));
    const dateStr = reportDateObj.toISOString().split('T')[0];

    const metricas = {
      fecha: dateStr,
      colaboradores_activos: 48,
      colaboradores_inactivos: 2,
      ausentes_hoy: (d === 0) ? 6 : (4 + (d % 3)), // 4 por vacaciones/permiso + 2 por incapacidad
      incapacidades_activas: 2,
      solicitudes_pendientes: (d === 0) ? 8 : (6 + (d % 4)),
      solicitudes_pendientes_criticas_gt_3d: (d === 0) ? 5 : (3 + (d % 3)),
      riesgo_pasivo_vacaciones_gt_20d: 7,
      tasa_rotacion_mensual_pct: 4.16, // 2 salidas en el mes sobre ~48 activos
      consultas_chat_dia: 14 + (d * 2),
      tasa_resolucion_chat_pct: 92.5,
      tasa_escalamiento_chat_pct: 7.5,
      top_temas_consultados: [
        { tema: 'Vacaciones y Feriados (POL-01)', porcentaje: 35 },
        { tema: 'Cálculo de Aguinaldo (POL-05)', porcentaje: 25 },
        { tema: 'Modalidad de Teletrabajo (POL-04)', porcentaje: 20 },
        { tema: 'Subsidio por Incapacidades (POL-03)', porcentaje: 12 },
        { tema: 'Seguro Médico Colectivo (POL-06)', porcentaje: 8 },
      ]
    };

    const resumenTexto = `### REPORTE DIARIO DE RECURSOS HUMANOS - ${dateStr}
**Generado por:** AgenteAnalista_v1 a las 07:00 a. m.

1. **Estado de Asistencia y Disponibilidad:** Se registran ${metricas.ausentes_hoy} colaboradores ausentes con justificación formal (${metricas.incapacidades_activas} por incapacidad médica oficial y el resto por permisos o vacaciones aprobadas).
2. **Alertas de Flujo de Solicitudes:** Existen ${metricas.solicitudes_pendientes} solicitudes en estado pendiente, de las cuales ${metricas.solicitudes_pendientes_criticas_gt_3d} superan los 3 días de antigüedad sin resolución de su jefatura directa. Se recomienda enviar recordatorio automático.
3. **Control de Pasivo Laboral:** 7 colaboradores mantienen un saldo superior a 20 días hábiles de vacaciones acumuladas. Se activa alerta preventiva para calendarizar descansos obligatorios.
4. **Métricas de Atención Asistida por IA:** Se procesaron consultas con un 92.5% de resolución autónoma exitosa y solo 7.5% de derivación al Comité de RRHH. El tema con mayor interés fue el disfrute de vacaciones y el calendario de aguinaldo del 15 de diciembre.`;

    reportesData.push({
      fecha: dateStr,
      datos_json: metricas,
      resumen_texto: resumenTexto,
      generado_por: 'AgenteAnalista_v1',
    });
  }

  await ReporteDiario.bulkCreate(reportesData);
  console.log(`[Seeder] Insertados ${reportesData.length} reportes diarios consolidados.`);

  console.log('[Seeder] ¡Siembra de datos finalizada exitosamente!');
}

seed()
  .then(() => {
    console.log('[Seeder] Proceso completado.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('[Seeder Error] Error durante la siembra:', err);
    process.exit(1);
  });
