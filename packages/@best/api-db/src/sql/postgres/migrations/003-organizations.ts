/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export const up = `
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name character varying(100) NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX org_unique_name ON organizations(name text_ops);

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS organization_id INTEGER;
`

export const down = `DROP TABLE organizations;`