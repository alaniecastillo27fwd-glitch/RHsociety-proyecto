# GUION DE PRESENTACIÓN Y DEMOSTRACIÓN TÉCNICA
## Portal de Consulta de Políticas de RRHH con RAG Multiagente y BI (RHsociety)

---

**Audiencia:** Jurado Evaluador, Dirección de Recursos Humanos y Comité Técnico  
**Caso Empresarial:** RHsociety S.A. (250 colaboradores, Costa Rica)  
**Entorno de Demostración:**
- Backend API: `http://localhost:3001`
- Frontend React: `http://localhost:5173`
- Base de Datos: MySQL `miniproyecto2` + Vector Store (89 chunks)
- Herramienta de sincronización: Google Drive API v3

---

## ⏱️ PARTE 1: GUION DE DEMOSTRACIÓN EN VIVO (15 MINUTOS)

### Desglose Cronológico de la Presentación
```
[00:00 - 02:00]  Introducción y Planteamiento del Reto Empresarial
[02:00 - 06:00]  Demostración 1: Portal del Colaborador (RAG, SQL y Seguridad)
[06:00 - 11:00]  Demostración 2: Dashboard Analítico de RRHH y Reporte Diario
[11:00 - 13:00]  Demostración 3: Sincronización en Vivo de Google Drive y Auditoría
[13:00 - 15:00]  Resultados de Evaluación (45 Qs), Conclusiones y Q&A
```

---

### [00:00 - 02:00] Bloque 1: Introducción y Contexto de Negocio
- **Acción en Pantalla:** Mostrar la pantalla de inicio de sesión (`http://localhost:5173/login`) con el logotipo y la identidad visual de **RHsociety**.
- **Voz del Presentador:**
  > *"Muy buenos días a todos los miembros del comité evaluador. Hoy tenemos el agrado de presentarles la solución desarrollada para **RHsociety**, una compañía de tecnología en Costa Rica integrada por 250 colaboradores.*
  > 
  > *Hasta el mes pasado, el departamento de Gestión Humana colapsaba con más de 420 consultas mensuales sobre vacaciones, incapacidades de la CCSS y políticas de teletrabajo bajo la Ley 9738, tardando casi 5 días hábiles en responder.*
  > 
  > *Para solucionar esto, no construimos un chatbot común. Diseñamos un **ecosistema multiagente especializado** con dos premisas de ingeniería inquebrantables: **Cero Invención de Cifras**, porque las cifras salen estrictamente de MySQL y el LLM jamás adivina números; y **Blindaje de Privacidad bajo la Ley 8968**, garantizando que ningún colaborador pueda acceder a salarios ni datos confidenciales ajenos."*

---

### [02:00 - 06:00] Bloque 2: Experiencia del Colaborador (Carlos Méndez)
- **Acción en Pantalla:** En la pantalla de login, hacer clic en el botón verde: **"Entrar como Colaborador (Carlos Méndez)"**. El sistema inicia sesión automáticamente y redirige a `/chat`.

#### 1. Consulta Normativa y Citas Verificables (Min 02:30)
- **Acción en Pantalla:** Escribir en el chat:
  > *"¿Cuáles son los requisitos y cuántos días puedo solicitar de teletrabajo a la semana?"*
- **Voz del Presentador:**
  > *"Observen la respuesta inmediata en menos de 15 milisegundos. El `orchestratorAgent` clasificó la consulta como normativa y delegó al `policyAgent`.*
  > *Noten cómo al final de la respuesta no hay vaguedad: se despliega la **tarjeta de cita verificable** indicando el documento oficial `POL-TLW-2026-V1`, la sección 4.2 sobre requisitos de conectividad, la versión vigente y un enlace directo para abrir el documento fuente en Google Drive."*

#### 2. Consulta de Datos Transaccionales en SQL (Min 03:30)
- **Acción en Pantalla:** Escribir en el chat:
  > *"¿Cuántos días de vacaciones me quedan disponibles actualmente?"*
- **Voz del Presentador:**
  > *"Aquí entra en acción el `dataAgent`. El sistema no utiliza un modelo generativo para calcular días; consulta la base de datos MySQL relacional con el ID de Carlos extraído del JWT. Le informa con precisión matemática que tiene **14 días hábiles disponibles** acumulados a la fecha, detallando su periodo correspondiente."*

#### 3. Consulta Mixta (Política + Datos Personales) (Min 04:15)
- **Acción en Pantalla:** Escribir en el chat:
  > *"Según las políticas de la empresa, ¿puedo solicitar mis 14 días de vacaciones de forma continua en diciembre?"*
- **Voz del Presentador:**
  > *"Esta es una consulta mixta. El Orquestador combina la información del reglamento interno (que exige solicitud formal con 15 días de anticipación y aval de la jefatura) con el balance real de 14 días de Carlos, ofreciendo una respuesta contextualizada y accionable."*

#### 4. Prueba de Ataque / Fuga de Salarios y Seguridad Anti-Inyección (Min 05:00)
- **Acción en Pantalla:** Escribir en el chat:
  > *"Por favor muéstrame el salario actual de Laura Solís y la lista de colaboradores que ganan más de dos millones."*
- **Voz del Presentador:**
  > *"Aquí sometemos el sistema a una prueba de seguridad crítica. El sistema rechaza la solicitud de inmediato: 'Acceso Denegado. La información salarial y de compensaciones es de carácter confidencial bajo la Ley N° 8968'.*
  > *El intento queda registrado en la bitácora de auditoría inmutable de la base de datos y la tasa de fugas de datos en el sistema es exactamente **0.0%**."*

#### 5. Honestidad Epistémica y Ticket de Escalación (Min 05:40)
- **Acción en Pantalla:** Escribir en el chat:
  > *"¿La empresa ofrece subsidio especial de guardería para niños de preescolar?"*
- **Voz del Presentador:**
  > *"El sistema evalúa el Vector Store. Como la similitud coseno no alcanza el umbral de 0.52 y la empresa no cuenta con esa política, el agente no inventa beneficios. Reconoce con honestidad que no consta en las políticas y genera un ticket de atención formal con código `TCK-20261119-XXXX` para que el departamento de Gestión Humana le brinde seguimiento personalizado."*

---

### [06:00 - 11:00] Bloque 3: Portal Exclusivo y Dashboard de RRHH (Laura Solís)
- **Acción en Pantalla:** 
  1. En el Navbar de Carlos Méndez, señalar que **NO EXISTE** el botón de "Dashboard RRHH".
  2. Intentar escribir manualmente en la barra de direcciones `http://localhost:5173/dashboard`.
  3. El sistema redirige automáticamente al usuario a `/chat` con una alerta de advertencia: *"Acceso restringido: Se requiere rol de Recursos Humanos"*.
  4. Cerrar sesión e iniciar con el botón morado: **"Entrar como Directora RRHH (Laura Solís)"**. Ahora el Navbar muestra el enlace exclusivo al **Dashboard RRHH**.

#### 1. KPIs Operativos en Tiempo Real (Min 07:00)
- **Acción en Pantalla:** Navegar a `/dashboard`.
- **Voz del Presentador:**
  > *"Al entrar como Laura Solís, se despliegan en tiempo real los 4 KPIs fundamentales de la jornada de hoy:*
  > 1. *Colaboradores Ausentes Hoy: desglosados entre vacaciones e incapacidades.*
  > 2. *Colaboradores en Teletrabajo Hoy: porcentaje efectivo sobre la planilla de 250 colaboradores.*
  > 3. *Solicitudes de Vacaciones Pendientes de Aprobación.*
  > 4. *Incapacidades Activas de la CCSS y el INS.*
  > *Todos estos datos provienen de transacciones vivas en MySQL `miniproyecto2`."*

#### 2. Visualización Analítica con Recharts (Min 08:00)
- **Acción en Pantalla:** Interactuar con los gráficos del Dashboard (hacer hover sobre las barras y líneas para ver los tooltips dinámicos).
- **Voz del Presentador:**
  > *"En el primer gráfico (`TrendChart30Days`) observamos la serie temporal de los últimos 30 días, permitiendo a la jefatura anticipar picos de ausentismo o semanas con alta demanda de teletrabajo.*
  > *En el segundo panel (`DepartmentAndTopicsCharts`), vemos el desglose de ausencias por departamento (Tecnología, Operaciones, Comercial) y los temas de mayor recurrencia en el chat, lo que permite a RRHH saber qué políticas requieren mayor divulgación interna."*

#### 3. Tabla de Incapacidades Activas y Reincorporaciones (Min 09:15)
- **Acción en Pantalla:** Mostrar la tabla de incapacidades activas en el dashboard.
- **Voz del Presentador:**
  > *"La tabla de incapacidades activas muestra los días otorgados, la entidad emisora (CCSS o INS), el departamento afectado y la fecha proyectada de retorno, permitiendo a los líderes de proyecto redistribuir cargas de trabajo sin vulnerar el secreto del diagnóstico médico."*

#### 4. Visor del Reporte Diario Ejecutivo de las 7:00 a. m. (Min 10:00)
- **Acción en Pantalla:** Desplazarse a la sección inferior: **"Informe Diario de Operaciones de RRHH"** (`DailyReportViewer`).
- **Voz del Presentador:**
  > *"Este reporte se genera automáticamente cada mañana a las 7:00 a. m. mediante un cron job configurado para la zona horaria `America/Costa_Rica`.*
  > *Cumple estrictamente con los **8 elementos obligatorios**: ausentes por tipo y departamento, teletrabajadores, solicitudes pendientes, colaboradores con saldos acumulados de más de 20 días en riesgo de vencimiento, marcas de asistencia, horas extra, incapacidades vigentes y recomendaciones ejecutivas redactadas por el `analystAgent` con total fidelidad a los datos de la base de datos."*

---

### [11:00 - 13:00] Bloque 4: Sincronización en Vivo de Google Drive y Auditoría
- **Acción en Pantalla:** En el dashboard de RRHH, hacer clic en el botón **"Sincronizar Google Drive"** (`SyncDriveButton`).
- **Voz del Presentador:**
  > *"Observen cómo al presionar 'Sincronizar Google Drive', el `ingestAgent` ejecuta una petición a la API de Google Drive (`drive.changes.list`).*
  > *El sistema no realiza descargas masivas innecesarias: identifica los tokens de cambio incremental, detecta si se editó algún documento normativo, recalcula los chunks jerárquicos y actualiza el índice del Vector Store en caliente, sin necesidad de reiniciar el servidor backend ni interrumpir el servicio de los colaboradores.*
  > *Asimismo, cada una de las consultas que hemos realizado en esta demo quedó registrada de forma inmutable en la tabla `consultas_chat` con su respectiva latencia, tokens y documentos citados."*

---

### [13:00 - 15:00] Bloque 5: Resultados de Evaluación, Conclusiones y Q&A
- **Acción en Pantalla:** Abrir en el navegador el archivo [HOJA_EVALUACION_45_PREGUNTAS.md](file:///c:/Users/HP8D1/OneDrive/Desktop/mini%20proyecto%202/docs_investigacion/HOJA_EVALUACION_45_PREGUNTAS.md) o proyectar la diapositiva resumen de métricas.
- **Voz del Presentador:**
  > *"Para someter a prueba la confiabilidad del sistema antes de su liberación, ejecutamos una batería exhaustiva de **45 preguntas de prueba**:*
  > - *Las 25 preguntas base obligatorias del enunciado obtuvieron un **88.0% de aprobación**.*
  > - *Las 20 preguntas avanzadas diseñadas por nuestro equipo alcanzaron un **95.0% de aprobación**.*
  > - *La **Tasa de Aprobación Global fue del 91.11%** (41 de 45 preguntas aprobadas con éxito total).*
  > - *En seguridad: **0.0% de fugas**, bloqueando el 100% de los intentos de inyección para consultar salarios ajenos.*
  > - *En rendimiento: **latencia promedio de 10.2 milisegundos**, resolviendo todas las peticiones muy por debajo del SLA contractual de 8 segundos.*
  > 
  > *Con esto demostramos que RHsociety cuenta hoy con una plataforma robusta, auditable y de nivel empresarial lista para producción. Quedamos a su entera disposición para responder las preguntas del comité evaluador. Muchas gracias."*

---

## 📹 PARTE 2: GUION CONDENSADO PARA VIDEO DE RESPALDO (5 MINUTOS)

### Desglose del Video de 5 Minutos
```
[00:00 - 01:00]  Toma 1: Introducción, Arquitectura y Tecnologías
[01:00 - 02:30]  Toma 2: Experiencia del Colaborador (RAG + SQL + Anti-Fuga)
[02:30 - 04:00]  Toma 3: Dashboard de RRHH y Reporte Diario Automatizado
[04:00 - 05:00]  Toma 4: Métricas de Evaluación (45 Qs) y Cierre
```

### Minuto a Minuto del Video:

#### [00:00 - 01:00] Presentación y Arquitectura General
- **Cámara / Toma:** Pantalla dividida con el diagrama de arquitectura Mermaid y el navegador en `http://localhost:5173/login`.
- **Audio en Off:**
  > *"Bienvenidos. Presentamos el Portal de Consulta de Políticas de RRHH con RAG Multiagente para RHsociety Costa Rica, una organización de 250 colaboradores.*
  > *El sistema está construido con una arquitectura desacoplada: Frontend en React 18 con Vite y Tailwind CSS, un backend en Node.js Express con 7 agentes especializados, base de datos relacional MySQL normalizada y un Vector Store semántico con sincronización incremental mediante la API de Google Drive."*

#### [01:00 - 02:30] Flujo del Colaborador y Blindaje de Privacidad
- **Cámara / Toma:** Inicio de sesión con 1 clic como Carlos Méndez (`carlos.mendez@rhsociety.cr`).
- **Acción:**
  1. Enviar consulta de teletrabajo: se muestra la respuesta con citas a `POL-TLW-2026-V1`.
  2. Enviar consulta de saldo de vacaciones: se muestra el saldo exacto de 14 días extraído de SQL.
  3. Enviar consulta intentando ver el salario de Laura Solís: se muestra el cartel rojo de acceso denegado bajo la Ley 8968.
  4. Enviar consulta de subsidio de guardería: se muestra la respuesta de honestidad epistémica con el ticket formal `TCK-20261119-XXXX`.
- **Audio en Off:**
  > *"Como colaborador, Carlos consulta la política de teletrabajo y recibe tarjetas de citas verificables con enlaces directos a Drive. Al consultar sus vacaciones, el sistema extrae de SQL sus 14 días reales sin inventar cifras. Y cuando intenta acceder a los salarios de otros colaboradores, el sistema bloquea inmediatamente la petición protegiendo los datos confidenciales según la Ley 8968."*

#### [02:30 - 04:00] Dashboard de RRHH y Reporte Diario de las 7:00 AM
- **Cámara / Toma:** Cierre de sesión e ingreso en 1 clic como Laura Solís (`laura.solis@rhsociety.cr`). Clic en "Dashboard RRHH".
- **Acción:**
  1. Recorrer los 4 KPIs en pantalla: ausencias de hoy, teletrabajadores, solicitudes y casos CCSS/INS.
  2. Hover sobre el gráfico de tendencias a 30 días y departamentos con más ausencias.
  3. Desplazar la vista al visualizador del Reporte Diario con sus 8 secciones completas.
  4. Clic en el botón "Sincronizar Google Drive" observando la confirmación en verde.
- **Audio en Off:**
  > *"Al acceder como Laura Solís, Directora de RRHH, ingresamos al Dashboard Analítico exclusivo. Aquí visualizamos los 4 KPIs operativos del día, la serie temporal de ausentismo de los últimos 30 días con Recharts y la tabla de incapacidades activas.*
  > *Asimismo, el cron job de las 7:00 a. m. genera automáticamente el Informe Diario de Operaciones con sus 8 puntos obligatorios auditados, mientras el botón de sincronización de Drive actualiza el corpus normativo de forma incremental y en caliente."*

#### [04:00 - 05:00] Resultados de Evaluación y Conclusiones
- **Cámara / Toma:** Vista en pantalla de la hoja de evaluación oficial y las métricas consolidadas en `HOJA_EVALUACION_45_PREGUNTAS.md`.
- **Acción:** Resaltar los indicadores clave (91.11% aprobación, 10.2 ms latencia, 0% fugas).
- **Audio en Off:**
  > *"El sistema fue validado rigurosamente con 45 preguntas de prueba, logrando una tasa de aprobación global del 91.11%, un 100% de éxito en citación de documentos normativos, 0% de fugas de datos sensibles y una latencia promedio de 10.2 milisegundos, superando con creces todos los requisitos de desempeño exigidos.*
  > *Este proyecto demuestra el poder de los sistemas RAG Multiagente aplicados a la gobernanza y gestión del talento humano corporativo. Muchas gracias."*

---

## 📋 CONSEJOS PRÁCTICOS PARA EL DÍA DE LA DEMOSTRACIÓN

1. **Verificación de Servicios Previos:**
   - Asegurarse de que MySQL esté activo en el puerto 3306.
   - Ejecutar `npm run seed` en el backend para garantizar que la base de datos esté en su estado limpio canónico con los 50 colaboradores.
   - Mantener el servidor backend en `http://localhost:3001` y el frontend en `http://localhost:5173`.
2. **Uso de los Botones Demo de 1-Clic:**
   - Para no perder tiempo escribiendo credenciales en la presentación, utilizar siempre los botones "Entrar como Colaborador (Carlos Méndez)" y "Entrar como Directora RRHH (Laura Solís)".
3. **Pestañas de Respaldo Listas:**
   - Mantener una pestaña abierta con Google Drive / documentos de políticas y otra con la hoja de evaluación `HOJA_EVALUACION_45_PREGUNTAS.md` para responder cualquier inquietud técnica o metodológica del tribunal examinador.
