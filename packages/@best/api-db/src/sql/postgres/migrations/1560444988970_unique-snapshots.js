exports.shorthands = undefined;

exports.up = (pgm) => {
    pgm.createIndex('snapshots', ['project_id', 'commit', 'name'], { unique: true, where: `temporary = 'f'`, name: 'best_snapshot_unqiue_index' })
};