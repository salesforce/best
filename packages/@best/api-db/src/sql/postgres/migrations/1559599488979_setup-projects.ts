import { MigrationBuilder } from 'node-pg-migrate';

exports.up = (pgm: MigrationBuilder) => {
    pgm.createTable('projects', {
        id: 'id',
        name: { type: 'varchar(100)', notNull: true },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    pgm.createIndex('projects', 'name', { unique: true, name: 'projects_unique_name' })
};

exports.down = (pgm: MigrationBuilder) => {
    pgm.dropTable('projects');
};
