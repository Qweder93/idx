#!/bin/bash
set -e

# Function to wait for PostgreSQL to be ready
function wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    # until pg_isready -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    # until pg_isready -h localhost -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
    echo "user and db $POSTGRES_USER $POSTGRES_DB"

    echo "PostgreSQL is not ready yet. Retrying in 5 seconds..."
    sleep 5

    # done
    echo "PostgreSQL seems to be ready!"
}


# Wait for PostgreSQL to start
wait_for_postgres

# Restore the database
echo "Restoring database from custom dump file..."
pg_restore --version
pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" /docker-entrypoint-initdb.d/storage-indexer.dump

echo "Database restored successfully!"