exports.shorthands = undefined;

exports.up = pgm => {
    pgm.addColumns('projects', {
        last_release_date: {
            type: 'timestamptz',
        },
    });
};
