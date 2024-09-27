#!/bin/bash

CONTAINER_NAME="mariadb_maeon"
DB_NAME="maeon_db"
DB_ROOT_PASSWORD="ROOT_PASSWORD"
BACKUP_DIR="./mariadb/backups"

if [ -z "$1" ]; then
    echo "Error: Please provide the backup file name (with .gz extension)."
    exit 1
fi

if [[ $1 != *.gz ]]; then
    echo "Error: The backup file must be a .gz file."
    exit 1
fi

BACKUP_FILE="$BACKUP_DIR/$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found."
    exit 1
fi

echo "Restoring the database from '$BACKUP_FILE'..."

gunzip -c $BACKUP_FILE | docker exec -i $CONTAINER_NAME mariadb -u root -p$DB_ROOT_PASSWORD $DB_NAME

if [ $? -eq 0 ]; then
    echo "Database '$DB_NAME' restored successfully."
else
    echo "Error: Failed to restore the database."
    exit 1
fi
