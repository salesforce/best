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

    BENCHMARK_INFO: 'benchmark_send_info',
    BENCHMARK_UPLOAD_REQUEST: 'benchmark_upload_request',
    BENCHMARK_UPLOAD_COMPLETED: 'benchmark_upload_completed',
    BENCHMARK_UPLOAD_ERROR: 'benchmark_upload_error',

    BENCHMARK_START: 'benchmark_start',
    BENCHMARK_UPDATE: 'benchmark_update',
    BENCHMARK_END: 'benchmark_end',
    BENCHMARK_ERROR: 'benchmark_error',
    BENCHMARK_RESULTS: 'benchmark_results'
}
