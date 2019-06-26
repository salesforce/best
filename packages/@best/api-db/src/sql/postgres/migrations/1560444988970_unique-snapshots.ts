import { MigrationBuilder } from 'node-pg-migrate';

exports.up = (pgm: MigrationBuilder) => {
    pgm.createIndex('snapshots', ['project_id', 'commit', 'name'], { unique: true, where: `temporary = 'f'`, name: 'best_snapshot_unqiue_index' })
};