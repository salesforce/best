exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('snapshots', {
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};
