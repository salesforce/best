/*
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
*/

export const BEST_RPC = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    ERROR: 'error',
    RECONNECT_FAILED: 'reconnect_failed',

    AGENT_STATUS: 'agent_status',
    AGENT_REJECTION: 'agent_rejection',
    AGENT_CONNECTED_CLIENT: 'agent_connected_client',
    AGENT_DISCONNECTED_CLIENT: 'agent_disconnected_client',
    AGENT_DISCONNECTED_FROM_HUB: 'agent_disconnected_from_hub',
    AGENT_QUEUED_CLIENT: 'agent_queued_client',

    HUB_CONNECTED_AGENT: 'hub_connected_agent',
    HUB_DISCONNECTED_AGENT: 'hub_disconnected_agent',

    BENCHMARK_UPLOAD_RESPONSE: 'benchmark_upload_response',
    BENCHMARK_UPLOAD_REQUEST: 'benchmark_upload_request',

    BENCHMARK_START: 'benchmark_start',
    BENCHMARK_UPDATE: 'benchmark_update',
    BENCHMARK_END: 'benchmark_end',
    BENCHMARK_ERROR: 'benchmark_error',
    BENCHMARK_LOG: 'benchmark_log',
    BENCHMARK_RESULTS: 'benchmark_results',

    REMOTE_CLIENT_UPLOAD_COMPLETED: 'remote_client_job_completed',
    REMOTE_CLIENT_EMPTY_QUEUE: 'remote_client_empty_queue'
}
