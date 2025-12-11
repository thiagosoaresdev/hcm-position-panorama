#!/bin/bash

# Database backup script for Sistema Quadro Lotação
# This script creates daily backups of the PostgreSQL database

set -e

# Configuration
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="sistema_quadro_lotacao"
DB_USER="postgres"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/sistema_quadro_lotacao_$DATE.sql"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup at $(date)"

# Create database backup
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --no-owner --no-privileges \
    --format=custom --compress=9 \
    --file="$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Database backup completed successfully: $BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $BACKUP_SIZE"
    
    # Create a latest symlink
    ln -sf "$(basename "$BACKUP_FILE")" "$BACKUP_DIR/latest.sql.gz"
    
    # Clean up old backups (keep only last 30 days)
    find "$BACKUP_DIR" -name "sistema_quadro_lotacao_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "Backup cleanup completed"
    
    # Log backup info
    echo "$(date): Backup completed - $BACKUP_FILE ($BACKUP_SIZE)" >> "$BACKUP_DIR/backup.log"
    
else
    echo "Database backup failed!" >&2
    exit 1
fi

echo "Backup process finished at $(date)"