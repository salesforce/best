/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export const up = `
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name character varying(100) NOT NULL,
    organization_id integer NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_release_date timestamp without time zone
);

CREATE UNIQUE INDEX projects_unique_name ON projects(name text_ops);
`

export const down = `DROP TABLE projects;`