#!/bin/bash
CONTAINER_NAME="mariadb_maeon"
BACKUP_DIR="./mariadb/backups"
DB_NAME="maeon_db"
DB_ROOT_PASSWORD="ROOT_PASSWORD"

DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/mariadb_backup_$DATE.sql"

echo "Backing up MariaDB database '$DB_NAME' to '$BACKUP_FILE'..."

docker exec -it $CONTAINER_NAME mariadb-dump -u root -p$DB_ROOT_PASSWORD $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "Backup completed. Compressing the backup file..."
    gzip $BACKUP_FILE
    if [ $? -eq 0 ]; then
        echo "Backup file compressed successfully: '$BACKUP_FILE.gz'"
    else
        echo "Error: Failed to compress the backup file."
        exit 1
    fi
else
    echo "Error: Backup failed."
    exit 1
fi
