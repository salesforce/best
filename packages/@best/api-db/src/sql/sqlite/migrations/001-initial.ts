export const up = `
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name character varying(100) NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_release_date timestamp
);

CREATE UNIQUE INDEX projects_pkey ON projects(id);
CREATE UNIQUE INDEX projects_unique_name ON projects(name);

CREATE TABLE snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name character varying(200) NOT NULL,
    metrics character varying(2000) NOT NULL,
    environment_hash character varying(100) NOT NULL,
    similarity_hash character varying(100) NOT NULL,
    "commit" character varying(100) NOT NULL,
    commit_date timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temporary boolean NOT NULL,
    updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX snapshots_pkey ON snapshots(id);
CREATE INDEX snapshots_project_id_index ON snapshots(project_id);
CREATE UNIQUE INDEX best_snapshot_unqiue_index ON snapshots(project_id,"commit",name) WHERE temporary = false;
`

export const down = `
DROP TABLE projects;
DROP TABLE snapshots;
`