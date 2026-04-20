# OMC Backend — Leads API

REST API para gestión de leads con autenticación JWT e integración con IA. Construida con NestJS, PostgreSQL y soporte para múltiples proveedores de IA (Groq, Gemini, OpenAI).

**Swagger UI disponible en** `http://localhost:3000/api/docs`

---

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Framework | NestJS 11 |
| Base de datos | PostgreSQL 16 + TypeORM |
| Autenticación | JWT + Passport |
| Documentación | Swagger / OpenAPI |
| IA | Groq / Gemini / OpenAI (intercambiable) |
| Validación | class-validator + class-transformer |
| Rate limiting | @nestjs/throttler |
| Contenedores | Docker + Docker Compose |

---

## Requisitos previos

- Node.js >= 20
- npm >= 10
- PostgreSQL 16 (o Docker)

---

## Instalación sin Docker

```bash
# 1. Clonar e instalar dependencias
git clone <repo-url>
cd omc-backend
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección de variables)

# 3. Las tablas se crean automáticamente al iniciar (synchronize: true en dev)
# 4. Poblar la base de datos con datos de prueba
npm run seed

# 5. Iniciar en modo desarrollo
npm run start:dev
```

---

## Instalación con Docker

```bash
# 1. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 2. Levantar servicios (API + PostgreSQL)
docker compose up -d

# 3. Poblar la base de datos (una sola vez)
docker compose exec api npm run seed

# 4. Detener servicios
docker compose down
```

> La base de datos persiste en `./postgres`. Para borrarla completamente: `docker compose down -v`

---

## Variables de entorno

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `DB_HOST` | Host de PostgreSQL | `localhost` / `postgres` (Docker) | ✅ |
| `DB_PORT` | Puerto de PostgreSQL | `5432` | ✅ |
| `DB_USERNAME` | Usuario de PostgreSQL | `omc_user` | ✅ |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `secret` | ✅ |
| `DB_NAME` | Nombre de la base de datos | `omc_database` | ✅ |
| `JWT_SECRET` | Secreto para firmar tokens JWT | cadena aleatoria ≥ 32 chars | ✅ |
| `AI_PROVIDER` | Proveedor de IA activo | `groq` \| `openai` \| `gemini` | ❌ (default: `groq`) |
| `AI_PROVIDER_API_KEY` | API key del proveedor seleccionado | `gsk_...` / `sk-...` | ❌ (mock si falta) |
| `PORT` | Puerto del servidor HTTP | `3000` | ❌ (default: `3000`) |

### Obtener API keys gratuitas

| Proveedor | Registro | Modelo usado |
|-----------|----------|--------------|
| **Groq** (recomendado) | [console.groq.com](https://console.groq.com) | `llama-3.3-70b-versatile` |
| **Gemini** | [aistudio.google.com](https://aistudio.google.com) | `gemini-1.5-flash` |
| **OpenAI** | [platform.openai.com](https://platform.openai.com) | `gpt-4o-mini` (requiere billing) |

---

## Endpoints

Todos los endpoints de `/leads` requieren el header `Authorization: Bearer <token>`.

### Auth

#### Registrar usuario

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Admin OMC",
    "email": "admin@omc.com",
    "password": "Admin123!"
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "admin@omc.com",
    "password": "Admin123!"
  }'
```

**Respuesta:**
```json
{
  "id": "uuid",
  "name": "Admin OMC",
  "email": "admin@omc.com",
  "role": "admin",
  "token": "eyJhbGci..."
}
```

#### Validar token

```bash
curl http://localhost:3000/v1/auth/check-status \
  -H 'Authorization: Bearer <token>'
```

---

### Leads

> Reemplaza `<token>` con el JWT obtenido en login.

#### Crear lead

```bash
curl -X POST http://localhost:3000/v1/leads \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "nombre": "María García",
    "email": "maria@example.com",
    "telefono": "+57 300 123 4567",
    "fuente": "instagram",
    "productoInteres": "Curso de Marketing Digital",
    "presupuesto": 150
  }'
```

#### Listar leads con paginación y filtros

```bash
# Todos los leads
curl 'http://localhost:3000/v1/leads' \
  -H 'Authorization: Bearer <token>'

# Con filtros
curl 'http://localhost:3000/v1/leads?page=1&limit=10&fuente=instagram&from=2026-01-01&to=2026-12-31' \
  -H 'Authorization: Bearer <token>'
```

**Parámetros query disponibles:**

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `page` | number | Página (default: 1) |
| `limit` | number | Resultados por página, máx 100 (default: 10) |
| `fuente` | string | `instagram` \| `facebook` \| `landing_page` \| `referido` \| `otro` |
| `from` | string | Fecha inicio `YYYY-MM-DD` (inclusive) |
| `to` | string | Fecha fin `YYYY-MM-DD` (inclusive) |

**Respuesta:**
```json
{
  "data": [...],
  "meta": { "total": 12, "page": 1, "limit": 10, "lastPage": 2 }
}
```

#### Estadísticas

```bash
curl http://localhost:3000/v1/leads/stats \
  -H 'Authorization: Bearer <token>'
```

**Respuesta:**
```json
{
  "total": 12,
  "active": 10,
  "inactive": 2,
  "avgPresupuesto": 147.5,
  "lastSevenDays": 4,
  "bySource": [
    { "fuente": "instagram", "count": "5" },
    { "fuente": "facebook", "count": "3" }
  ]
}
```

#### Resumen IA

```bash
# Sin filtros — analiza todos los leads
curl -X POST http://localhost:3000/v1/leads/ai/summary \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{}'

# Con filtros opcionales
curl -X POST http://localhost:3000/v1/leads/ai/summary \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "fuente": "instagram",
    "from": "2026-01-01",
    "to": "2026-12-31"
  }'
```

**Respuesta:**
```json
{
  "summary": "1. Resumen general: ...\n2. Fuente principal: ...\n3. Recomendaciones: ...",
  "leadsAnalyzed": 5
}
```

#### Obtener lead por ID

```bash
curl http://localhost:3000/v1/leads/<uuid> \
  -H 'Authorization: Bearer <token>'
```

#### Actualizar lead (parcial)

```bash
curl -X PATCH http://localhost:3000/v1/leads/<uuid> \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <token>' \
  -d '{
    "presupuesto": 300,
    "productoInteres": "Mentoría 1 a 1"
  }'
```

#### Eliminar lead (soft delete)

```bash
curl -X DELETE http://localhost:3000/v1/leads/<uuid> \
  -H 'Authorization: Bearer <token>'
```

> Retorna `204 No Content`. El registro no se borra físicamente — queda con `deleted_at` registrado.

---

## Reglas de contraseña

Mínimo 6 caracteres, máximo 50, al menos una mayúscula, una minúscula y un número o carácter especial.

Ejemplo válido: `Admin123!`

---

## Decisiones técnicas

### Soft delete en leads
Los leads eliminados conservan su `deleted_at`. TypeORM los excluye automáticamente de todas las consultas normales, pero el registro queda disponible para auditoría o recuperación futura.

### Strategy / Adapter para IA
`OpenAiCompatibleProvider` soporta Groq, Gemini y OpenAI con el mismo SDK — los tres exponen endpoints compatibles con la API de OpenAI. Cambiar de proveedor requiere solo modificar `AI_PROVIDER` en `.env`, sin tocar código. Si no hay API key configurada, el servicio cae automáticamente a `MockProvider`.

### JWT con payload extendido
El token incluye `{ id, name, email, role }`. Esto evita consultas a la base de datos en cada request autenticado — el guard lee directamente del payload.

### `@Auth()` como decorator compuesto
`@Auth()` aplica automáticamente `UseGuards`, `RoleProtected` y `ApiBearerAuth`. Proteger un endpoint nuevo requiere una sola anotación y queda documentado en Swagger sin configuración adicional.

### `synchronize: true` solo en desarrollo
TypeORM sincroniza el schema automáticamente en desarrollo. **Debe desactivarse en producción** (`synchronize: false`) y reemplazarse por migraciones explícitas para evitar pérdida accidental de datos.

### Rate limiting global
ThrottlerModule limita a 100 requests por minuto por IP. Protección básica contra abuso sin infraestructura adicional.

### Orden de rutas en NestJS
`GET /leads/stats` y `POST /leads/ai/summary` están declarados **antes** de `GET /leads/:id`. NestJS resuelve rutas en orden de declaración — si `:id` fuera primero, los segmentos literales `stats` y `ai` serían interpretados como UUIDs y fallarían la validación.

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start:dev` | Servidor en modo desarrollo con hot-reload |
| `npm run build` | Compilar para producción |
| `npm run start:prod` | Ejecutar build de producción |
| `npm run seed` | Poblar la base de datos con datos de prueba |
| `npm run lint` | Linter con auto-fix |
| `npm run test` | Tests unitarios |
| `npm run test:cov` | Tests con reporte de cobertura |
