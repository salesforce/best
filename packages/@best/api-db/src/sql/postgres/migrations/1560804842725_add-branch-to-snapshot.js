exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.addColumns('snapshots', {
        branch: {
            type: 'varchar(200)', notNull: true,
            default: 'master'
        },
    });
};