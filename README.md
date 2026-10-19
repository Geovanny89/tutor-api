# 🚀 KDice English API

Backend API para la plataforma interactiva de aprendizaje de inglés **KDice English**, con tutor conversacional potenciado por Inteligencia Artificial (Google Gemini & Groq), autenticación JWT, arquitectura MVC y persistencia con Sequelize (PostgreSQL / SQLite).

---

## 📋 Características

- **Arquitectura MVC Modular**: Separación limpia entre rutas, controladores, servicios, modelos y middlewares.
- **Tutor IA Conversacional**:
  - Endpoint `/api/ai/chat` para conversación interactiva con personas nativas y retroalimentación gramatical.
  - Generación de ejemplos y explicaciones gramaticales guiadas paso a paso (`/api/ai/explain`).
  - Evaluación y calificación de pronunciación y oraciones habladas (`/api/ai/grade`).
- **Autenticación y Seguridad**:
  - JWT (JSON Web Tokens) con hashing de contraseñas mediante `bcryptjs`.
  - Headers seguros con `helmet` y protección CORS configurable.
  - Rate limiting inteligente para proteger las cuotas de IA por usuario (`express-rate-limit`).
- **Base de Datos Flexible**:
  - ORM Sequelize compatible con **PostgreSQL** (producción) y **SQLite** (desarrollo local).
  - Modelos relacionales: Users, Tenants, Modules, Lessons, Evaluations, ConversationSessions, AiUsage.
- **Seeds Automatizados**: Script para inicializar los 36 módulos educativos desde el nivel A1 hasta C2.

---

## 🛠️ Tecnologías

- **Entorno**: Node.js v18+ / v20+
- **Framework Web**: Express.js
- **ORM**: Sequelize v6
- **Bases de datos**: PostgreSQL (`pg`), SQLite3 (`sqlite3`)
- **Modelos de IA**:
  - `@google/generative-ai` (Gemini Flash)
  - `groq-sdk` (Llama 3 / Mixtral fallback)
- **Seguridad**: `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `joi`

---

## ⚙️ Variables de Entorno (`.env`)

Crea un archivo `.env` en la carpeta `api/` basándote en `.env.example`:

```env
PORT=5000
NODE_ENV=development

# Base de datos (PostgreSQL o SQLite)
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kdice_english
DB_USER=postgres
DB_PASSWORD=tu_password

# Para usar SQLite en desarrollo local:
# DB_DIALECT=sqlite
# DB_STORAGE=./database.sqlite

# Seguridad y Autenticación
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
JWT_EXPIRES_IN=7d

# Proveedores de Inteligencia Artificial
GEMINI_API_KEY=tu_clave_de_google_gemini
GROQ_API_KEY=tu_clave_de_groq_opcional
```

---

## 🚀 Instalación y Uso

### 1. Instalar dependencias
```bash
npm install
```

### 2. Poblar la base de datos (Seeds de módulos y lecciones)
```bash
npm run seed
```

### 3. Iniciar en modo desarrollo
```bash
npm run dev
```
El servidor arrancará en `http://localhost:5000`.

### 4. Iniciar en producción
```bash
npm start
```

---

## 📡 Endpoints Principales

### Autenticación (`/api/auth`)
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/register` | Registro de nuevos estudiantes |
| `POST` | `/api/auth/login` | Inicio de sesión y entrega de token JWT |
| `GET` | `/api/auth/me` | Obtener perfil del usuario autenticado |

### Tutor e Inteligencia Artificial (`/api/ai`)
| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/ai/chat` | Conversación con el tutor IA |
| `POST` | `/api/ai/explain` | Generar explicación detallada de una regla gramatical |
| `POST` | `/api/ai/grade` | Evaluar y corregir una respuesta de audio/texto |
| `GET` | `/api/ai/usage` | Consultar interacciones restantes del día |

### Módulos y Lecciones (`/api/modules`, `/api/lessons`)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/modules` | Listar todos los módulos agrupados por bloques A1–C2 |
| `GET` | `/api/modules/:id` | Detalle del módulo y sus lecciones |
| `GET` | `/api/lessons/:id` | Detalle completo de la lección con actividades interactivas |

---

## 🔒 Licencia
Distribuido bajo licencia ISC. Desarrollado por el equipo de **KDice English**.
