/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export const up = `
CREATE TABLE snapshots (
    id SERIAL PRIMARY KEY,
    project_id integer NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name character varying(200) NOT NULL,
    metrics character varying(2000) NOT NULL,
    environment_hash character varying(100) NOT NULL,
    similarity_hash character varying(100) NOT NULL,
    commit character varying(100) NOT NULL,
    commit_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    temporary boolean NOT NULL,
    updated_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX snapshots_project_id_index ON snapshots(project_id int4_ops);
CREATE UNIQUE INDEX best_snapshot_unqiue_index ON snapshots(project_id int4_ops,commit text_ops,name text_ops) WHERE temporary = false;
`

export const down = `DROP TABLE snapshots;`