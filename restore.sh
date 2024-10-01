#!/bin/bash

CONTAINER_NAME="mariadb_maeon"
DB_NAME="maeon_db"
DB_ROOT_PASSWORD="ROOT_PASSWORD"
BACKUP_DIR="./mariadb/backups"

restore_db() {
    local backup_file="$1"
    echo "Restoring the database from '$backup_file'..."
    gunzip -c "$backup_file" | docker exec -i $CONTAINER_NAME mariadb -u root -p$DB_ROOT_PASSWORD $DB_NAME

    if [ $? -eq 0 ]; then
        echo "Database '$DB_NAME' restored successfully."
    else
        echo "Error: Failed to restore the database."
        exit 1
    fi
}

if [ "$1" == "-last" ]; then
    latest_backup=$(ls -t $BACKUP_DIR/*.gz 2>/dev/null | head -n1)
    if [ -z "$latest_backup" ]; then
        echo "Error: No backup files found in $BACKUP_DIR"
        exit 1
    fi
    restore_db "$latest_backup"
else
    if [ -z "$1" ]; then
        echo "Usage: $0 <backup_file.gz> or $0 -last"
        exit 1
    fi

    if [[ $1 != *.gz ]]; then
        echo "Error: The backup file must be a .gz file."
        exit 1
    fi

    backup_file="$BACKUP_DIR/$1"

    if [ ! -f "$backup_file" ]; then
        echo "Error: Backup file '$backup_file' not found."
        exit 1
    fi

    restore_db "$backup_file"
fi