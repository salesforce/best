exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('snapshots', {
        updated_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};
