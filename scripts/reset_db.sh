#!/usr/bin/env bash
set -euo pipefail

# LaunchByte Database Reset Script (Local / Development only)
# Safely drops and migrates the database to head, then seeds demo data.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

APP_ENV="${ENV:-local}"

if [ "$APP_ENV" != "local" ] && [ "$APP_ENV" != "development" ] && [ "$APP_ENV" != "test" ]; then
    echo "================================================================="
    echo " [ERROR] Refusing to reset database in non-local environment: '$APP_ENV'"
    echo " ENV must be 'local', 'development', or 'test'."
    echo "================================================================="
    exit 1
fi

echo "================================================================="
echo " Resetting LaunchByte Database (ENV: ${APP_ENV})"
echo "================================================================="

cd "${BACKEND_DIR}"

PYTHON_BIN=".venv/bin/python"
ALEMBIC_BIN=".venv/bin/alembic"

if [ ! -f "${PYTHON_BIN}" ]; then
    PYTHON_BIN="python3"
fi
if [ ! -f "${ALEMBIC_BIN}" ]; then
    ALEMBIC_BIN="alembic"
fi

# Detect DB type
CONFIG_DB_URL=$(${PYTHON_BIN} -c "from app.core.config import get_settings; print(get_settings().DATABASE_URL)" 2>/dev/null || echo "")
TARGET_DB_URL="${DATABASE_URL:-${CONFIG_DB_URL}}"

# If connecting to Postgres fails (e.g. no local daemon), fallback to local SQLite for local testing
if [[ "${TARGET_DB_URL}" == postgresql* ]]; then
    if ! ${PYTHON_BIN} -c "import psycopg2; from app.core.config import get_settings; psycopg2.connect(get_settings().DATABASE_URL)" 2>/dev/null; then
        echo " [INFO] PostgreSQL daemon unreachable on localhost:5432; defaulting to local SQLite (launchbyte.db)"
        TARGET_DB_URL="sqlite:///./launchbyte.db"
        export DATABASE_URL="${TARGET_DB_URL}"
    fi
fi

if [[ "${TARGET_DB_URL}" == sqlite* ]]; then
    DB_FILE=$(echo "${TARGET_DB_URL}" | sed -E 's|^sqlite:///?||')
    if [ -n "${DB_FILE}" ] && [ -f "${DB_FILE}" ]; then
        echo " Removing SQLite database file: ${DB_FILE}"
        rm -f "${DB_FILE}"
    fi
    rm -f app.db launchbyte.db test.db
fi

export DATABASE_URL="${TARGET_DB_URL}"

echo " Running Alembic migrations to head (${TARGET_DB_URL})..."
${ALEMBIC_BIN} upgrade head

echo " Seeding database..."
${PYTHON_BIN} -m app.db.seed

echo "================================================================="
echo " Database reset & seed completed successfully!"
echo "================================================================="
