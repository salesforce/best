exports.shorthands = undefined;

exports.up = pgm => {
    pgm.createTable('projects', {
        id: 'id',
        name: { type: 'varchar(100)', notNull: true },
        created_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};

exports.down = pgm => {
    pgm.dropTable('projects');
};
