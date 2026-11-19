# Portal de Consulta de Políticas de RRHH con RAG Multiagente
## RHsociety Costa Rica — Solución de Inteligencia Artificial para Gestión del Talento

[![Node.js Version](https://img.shields.io/badge/Node.js-18.x%20%7C%2020.x-green.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-18.x%20(Vite)-blue.svg)](https://react.dev/)
[![MySQL Version](https://img.shields.io/badge/MySQL-8.x%20InnoDB-orange.svg)](https://www.mysql.com/)
[![Evaluation Pass Rate](https://img.shields.io/badge/RAG%20Evaluation-91.11%25%20Approved-brightgreen.svg)](docs_investigacion/HOJA_EVALUACION_45_PREGUNTAS.md)
[![Security Leaks](https://img.shields.io/badge/Security%20Leaks-0.00%25-success.svg)](docs_investigacion/INFORME_TECNICO_FINAL.md)

---

## 📌 1. Resumen Ejecutivo y Valor de Negocio

**RHsociety** es una empresa de servicios de tecnología y consultoría en Costa Rica con una planilla de **250 colaboradores** distribuidos entre modalidades presenciales y de teletrabajo reguladas bajo el Código de Trabajo de Costa Rica y la Ley N° 9738.

Este sistema implementa una solución de **Recuperación Aumentada por Generación (RAG) Multiagente** y un **Dashboard de Business Intelligence (BI)** que resuelve de raíz la sobrecarga del departamento de Recursos Humanos:
- **Reducción del 85% en tiempos de consulta:** Respuestas inmediatas con citas verificables (documento oficial, sección, versión y enlace directo a Google Drive o repositorio local).
- **Cero Invención de Cifras:** Los saldos de vacaciones, asistencias y métricas provienen directamente de consultas SQL parametrizadas a MySQL; los modelos de lenguaje jamás adivinan números.
- **Blindaje de Privacidad y Cumplimiento Legal (Ley N° 8968):** Aislamiento estricto por roles (`colaborador` vs `rrhh`) que impide el acceso no autorizado a salarios ajenos, expedientes médicos confidenciales o métricas restringidas.
- **Reporte Ejecutivo Diario Automatizado:** Programado todos los días a las **7:00 a. m.** (hora de Costa Rica), sincroniza documentos desde Google Drive y consolida en base de datos los 8 indicadores críticos de operación.

---

## 🏗️ 2. Arquitectura General del Sistema

El sistema implementa una arquitectura desacoplada de dos niveles con separación de responsabilidades:

```mermaid
flowchart TD
    subgraph Frontend["Frontend SPA (React 18 + Vite + Tailwind + Recharts)"]
        A[Login con Demo 1-Click] --> B[Portal de Chat con Tarjetas de Citas]
        A --> C[Dashboard Analítico RRHH con Gráficos y Reporte Diario]
    end

    subgraph Backend["Backend API REST (Node.js + Express 3001)"]
        D[Auth Middleware & RBAC JWT] --> E[Orchestrator Agent]
        E -->|Intención Normativa| F[Policy Agent - RAG Coseno]
        E -->|Intención Saldo/SQL| G[Data Agent - MySQL Parametrizado]
        E -->|Intención Mixta| H[Orquestación Combinada]
        E -->|Violación de Seguridad| I[Respuesta de Bloqueo 403]
        
        F & G & H --> J[Validator Agent & Auditoría]
        J -->|Caso no contemplado| K[Escalation Agent - Ticket TCK]
        J -->|Respuesta Válida| L[Persistencia en consultas_chat]
    end

    subgraph Almacenamiento["Capa de Datos Híbrida"]
        M[(MySQL miniproyecto2)]
        N[(Vector Store 89 Chunks)]
        O[Google Drive API v3]
    end

    Frontend <==>|REST JSON + JWT| Backend
    G <-->|Sequelize ORM| M
    F <-->|text-embedding-004| N
    Backend <-->|Sync Incremental| O
```

### Equipo de 7 Agentes Especializados:
1. `orchestratorAgent`: Clasificador semántico de intenciones (`politica`, `datos`, `mixta`, `seguridad_restringida`, `fuera_de_dominio`).
2. `policyAgent`: Recuperación semántica de cláusulas con umbral coseno $\theta \ge 0.52$ y honestidad epistémica.
3. `dataAgent`: Consultas SQL transaccionales aisladas por colaborador (`WHERE id = ?`).
4. `analystAgent`: Generador del reporte diario ejecutivo de 8 elementos para la Dirección de RRHH.
5. `ingestAgent`: Pipeline de sincronización completa e incremental con Google Drive API (`drive.changes.list`).
6. `validatorAgent`: Auditoría de salida para garantizar citas y prevenir fugas de salarios o datos confidenciales.
7. `escalationAgent`: Emisión de tickets formales de atención (`TCK-YYYYMMDD-XXXX`) ante excepciones.

---

## 📂 3. Estructura del Repositorio

```text
mini proyecto 2/
├── backend/
│   ├── agents/               # Los 7 Agentes de IA del sistema
│   │   ├── orchestratorAgent.js
│   │   ├── policyAgent.js
│   │   ├── dataAgent.js
│   │   ├── analystAgent.js
│   │   ├── ingestAgent.js
│   │   ├── validatorAgent.js
│   │   └── escalationAgent.js
│   ├── config/               # Configuración de base de datos y variables
│   │   └── database.js
│   ├── controllers/          # Controladores HTTP de la API REST
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── dashboardController.js
│   │   └── ingestController.js
│   ├── jobs/                 # Programador de tareas cron
│   │   └── dailyReportJob.js # Se ejecuta diario a las 7:00 a. m. CR
│   ├── middlewares/          # Seguridad, JWT y RBAC
│   │   └── authMiddleware.js
│   ├── models/               # 8 Modelos Sequelize para MySQL
│   │   ├── Colaborador.js
│   │   ├── Departamento.js
│   │   ├── Asistencia.js
│   │   ├── SolicitudVacacion.js
│   │   ├── Incapacidad.js
│   │   ├── MovimientoPersonal.js
│   │   ├── ConsultaChat.js
│   │   ├── ReporteDiario.js
│   │   └── index.js
│   ├── prompts/              # Prompts versionados (v1.0.0)
│   ├── routes/               # Enrutadores Express (/api/auth, /chat, etc.)
│   ├── seeders/              # Datos semilla de 50 empleados y registros
│   │   └── seedData.js
│   ├── services/             # Servicios auxiliares (Chunker, Drive, Embeddings)
│   ├── tests/                # Suite de evaluación de 45 preguntas
│   │   └── evaluate45Questions.js
│   ├── vector_store/         # Índice semántico vectorial (89 chunks)
│   │   └── index.json
│   ├── app.js                # Ensamblado de middlewares y rutas Express
│   ├── server.js             # Punto de entrada del servidor (Puerto 3001)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # 9 Componentes modulares reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── CitationCard.jsx
│   │   │   ├── KpiCard.jsx
│   │   │   ├── TrendChart30Days.jsx
│   │   │   ├── DepartmentAndTopicsCharts.jsx
│   │   │   ├── IncapacityTable.jsx
│   │   │   ├── DailyReportViewer.jsx
│   │   │   └── SyncDriveButton.jsx
│   │   ├── context/          # Contexto global de autenticación JWT
│   │   │   └── AuthContext.jsx
│   │   ├── pages/            # 3 Vistas de la aplicación
│   │   │   ├── LoginPage.jsx
│   │   │   ├── ChatPortalPage.jsx
│   │   │   └── HrDashboardPage.jsx
│   │   ├── routes/           # Rutas públicas y protegidas con RBAC
│   │   │   ├── AppRouter.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── services/         # Cliente HTTP con Axios e interceptores
│   │   │   └── api.js
│   │   ├── app.jsx           # Componente raíz
│   │   ├── main.jsx          # Montaje en el DOM
│   │   └── index.css         # Estilos globales con Tailwind CSS
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs_investigacion/       # Documentación técnica y académica
│   ├── INFORME_TECNICO_FINAL.md
│   ├── ARQUITECTURA_SISTEMA.md
│   ├── GUION_DEMO_PRESENTACION.md
│   ├── HOJA_EVALUACION_45_PREGUNTAS.md
│   └── HOJA_EVALUACION_45_PREGUNTAS.xlsx
├── docs_politicas_drive/     # Corpus normativo local de respaldo (10 documentos)
└── README.md
```

---

## ⚙️ 4. Prerrequisitos del Entorno

Asegúrate de contar con las siguientes herramientas instaladas en tu sistema:
- **Node.js:** Versión 18.x o 20.x LTS ([Descargar Node.js](https://nodejs.org/)).
- **MySQL Server:** Versión 8.0 o superior ([Descargar MySQL](https://dev.mysql.com/downloads/installer/)).
- **NPM:** Incluido con Node.js (v9.x o superior).
- **Google Cloud Console Service Account (Opcional para Drive en vivo):** Archivo de credenciales JSON para Google Drive API v3. *(El sistema incluye un fallback local completamente funcional para desarrollo y demostración offline).*

---

## 🚀 5. Instalación Paso a Paso

### Paso 1: Clonar o abrir el repositorio
```bash
cd "mini proyecto 2"
```

### Paso 2: Instalar dependencias del Backend
```bash
cd backend
npm install
```

### Paso 3: Instalar dependencias del Frontend
```bash
cd ../frontend
npm install
```

---

## 🔐 6. Configuración de Variables de Entorno

Crea un archivo `.env` dentro de la carpeta `backend/` tomando como referencia la plantilla segura que se presenta a continuación:

> ⚠️ **IMPORTANTE DE SEGURIDAD:** Nunca subas al control de versiones credenciales reales, contraseñas de producción ni claves privadas. Utiliza los placeholders indicados.

```ini
# ==============================================================================
# CONFIGURACIÓN DEL SERVIDOR BACKEND
# ==============================================================================
PORT=3001
NODE_ENV=development
JWT_SECRET=tu_clave_secreta_jwt_super_segura_rhsociety_2026

# ==============================================================================
# BASE DE DATOS MYSQL (miniproyecto2)
# ==============================================================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=miniproyecto2
DB_USER=root
DB_PASS=tu_contraseña_mysql

# ==============================================================================
# GOOGLE GEMINI API (Generación y Embeddings)
# ==============================================================================
GEMINI_API_KEY=AIzaSy_TU_CLAVE_DE_GEMINI_API_AQUI

# ==============================================================================
# GOOGLE DRIVE API (Service Account para sincronización de políticas)
# ==============================================================================
GOOGLE_DRIVE_FOLDER_ID=1_TU_ID_DE_CARPETA_DE_GOOGLE_DRIVE_AQUI
GOOGLE_SERVICE_ACCOUNT_EMAIL=tu-servicio@tu-proyecto.iam.gserviceaccount.com
# Reemplaza los saltos de línea con \n en la clave privada:
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA_MOCK_O_REAL\n-----END PRIVATE KEY-----\n"

# ==============================================================================
# CONFIGURACIÓN DEL CRON JOB (REPORTE DIARIO 7:00 AM COSTA RICA)
# ==============================================================================
TIMEZONE=America/Costa_Rica
DAILY_REPORT_CRON="0 7 * * *"
```

---

## 💻 7. Comandos de Inicialización y Ejecución

Dentro de la carpeta `backend/`:

### 1. Crear la base de datos y cargar los datos semilla (50 colaboradores, asistencias y chats)
```bash
npm run seed
```

### 2. Ejecutar la ingesta completa de documentos y generar el Vector Store
```bash
npm run ingest:full
```

### 3. Generar el reporte diario ejecutivo de hoy manualmente (Prueba inmediata)
```bash
npm run report:now
```

### 4. Ejecutar la suite de evaluación de 45 preguntas y generar reportes Excel/Markdown
```bash
npm run eval
```

### 5. Iniciar los servidores de desarrollo

**Terminal 1 — Backend (Puerto 3001):**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (Puerto 5173):**
```bash
cd frontend
npm run dev
```

Abre tu navegador en: **`http://localhost:5173`**

---

## 👥 8. Credenciales de Demostración (Acceso en 1 Clic)

La pantalla de inicio de sesión (`/login`) cuenta con botones de **Acceso Rápido de Demostración** que rellenan automáticamente las credenciales oficiales de prueba:

| Rol | Nombre | Correo Electrónico | Contraseña | Permisos y Alcance |
| :--- | :--- | :--- | :---: | :--- |
| **Colaborador** | Carlos Méndez | `carlos.mendez@rhsociety.cr` | `123456` | Portal de Chat, consultas de políticas con citas, saldo personal de vacaciones (14 días). Acceso bloqueado a salarios y dashboard. |
| **Directora RRHH** | Laura Solís | `laura.solis@rhsociety.cr` | `123456` | Acceso total: Chat, Dashboard analítico (`/dashboard`), KPIs de hoy, gráficos de 30 días, tabla de incapacidades, generación de reportes y sincronización de Drive. |

---

## 🌐 9. Catálogo de Endpoints de la API REST

Todos los endpoints (excepto login) requieren la cabecera: `Authorization: Bearer <TOKEN_JWT>`.

| Método | Endpoint | Rol Requerido | Descripción |
| :---: | :--- | :---: | :--- |
| `POST` | `/api/auth/login` | Público | Autenticación con email/password. Retorna token JWT y perfil. |
| `GET` | `/api/auth/me` | Autenticado | Obtiene la información del usuario en sesión. |
| `POST` | `/api/chat/ask` | Autenticado | Envía una consulta al Orquestador Multiagente. Retorna respuesta y citas. |
| `GET` | `/api/chat/history` | Autenticado | Retorna el historial de consultas persistido para el usuario. |
| `GET` | `/api/dashboard/kpis` | `rrhh` | Métricas de hoy: ausencias, teletrabajo, vacaciones pendientes e incapacidades. |
| `GET` | `/api/dashboard/trend` | `rrhh` | Serie temporal de los últimos 30 días para gráficos Recharts. |
| `GET` | `/api/dashboard/latest-report` | `rrhh` | Último reporte diario estructurado generado por `analystAgent`. |
| `POST` | `/api/dashboard/generate-report` | `rrhh` | Dispara manualmente la generación del reporte diario. |
| `POST` | `/api/ingest/sync` | `rrhh` | Dispara sincronización incremental o completa con Google Drive. |
| `GET` | `/api/ingest/status` | `rrhh` | Estado actual de documentos indexados y última fecha de sincronización. |

---

## 📊 10. Resultados de Evaluación (45 Preguntas)

El sistema fue evaluado de manera rigurosa mediante el script `backend/tests/evaluate45Questions.js` arrojando los siguientes resultados oficiales:

- **Tasa de Aprobación Global:** **91.11%** (41 de 45 preguntas aprobadas).
- **Preguntas Base (1-25):** 88.00% (22/25 aprobadas).
- **Preguntas del Equipo (26-45):** 95.00% (19/20 aprobadas).
- **Fugas de Información Confidencial / Salarios:** **0.00%** (5 de 5 intentos maliciosos bloqueados con éxito total).
- **Latencia Promedio:** **10.2 ms** (100% de consultas resueltas en menos de 30 ms frente a un SLA contractual de 8,000 ms).
- **Reportes Generados:**
  - Consulta el análisis detallado en Markdown: [HOJA_EVALUACION_45_PREGUNTAS.md](docs_investigacion/HOJA_EVALUACION_45_PREGUNTAS.md)
  - Hoja de cálculo con fórmulas y gráficos: [HOJA_EVALUACION_45_PREGUNTAS.xlsx](docs_investigacion/HOJA_EVALUACION_45_PREGUNTAS.xlsx)
  - Informe Técnico Final completo (12 páginas): [INFORME_TECNICO_FINAL.md](docs_investigacion/INFORME_TECNICO_FINAL.md)

---

## 📄 11. Licencia y Derechos de Autor

Desarrollado para fines académicos y de evaluación profesional en Inteligencia Artificial y Tecnologías de la Información.  
© 2026 **RHsociety S.A.** / Equipo de Investigación y Desarrollo de Software. Todos los derechos reservados.
