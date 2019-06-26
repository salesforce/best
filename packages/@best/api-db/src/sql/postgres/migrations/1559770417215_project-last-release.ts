import { MigrationBuilder } from 'node-pg-migrate';

exports.up = (pgm: MigrationBuilder) => {
    pgm.addColumns('projects', {
        last_release_date: {
            type: 'timestamptz',
        },
    });
};
