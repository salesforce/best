exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('snapshots', {
        id: 'id',
        project_id: {
            type: 'integer',
            notNull: true,
            references: '"projects"',
            onDelete: 'cascade',
        },
        name: { type: 'varchar(200)', notNull: true },
        metrics: { type: 'varchar(2000)', notNull: true },
        environment_hash: { type: 'varchar(100)', notNull: true },
        similarity_hash: { type: 'varchar(100)', notNull: true },
        commit: { type: 'varchar(100)', notNull: true },
        commit_date: {
            type: 'timestamp',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
        temporary: 'boolean',
    });

    pgm.createIndex('snapshots', 'project_id');
};

exports.down = pgm => {
    pgm.dropTable('snapshots');
};
