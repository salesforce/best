import { MigrationBuilder } from 'node-pg-migrate';

exports.up = (pgm: MigrationBuilder) => {
    pgm.addColumns('snapshots', {
        updated_at: {
            type: 'timestamptz',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });
};
