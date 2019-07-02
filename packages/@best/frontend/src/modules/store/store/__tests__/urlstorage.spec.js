import * as urlstorage from '../urlstorage';

const setLocation = (pathname, hash) => {
    global.window = Object.create(window);
    Object.defineProperty(window, 'location', {
        writable: true,
        value: {
            pathname,
            hash
        }
    });     
}

describe('urlstorage', () => {
    describe('loadState', () => {
        it('loads nothing when state url is empty', () => {
            setLocation('/', '')

            expect(urlstorage.loadState()).toEqual({})
        })

        it('loads only selectedProjectId into projects from path', () => {
            setLocation('/1', '')

            expect(urlstorage.loadState()).toEqual({ projects: { items: [], selectedProjectId: 1 } })
        })

        it('loads only view with emtpy comparison from path', () => {
            setLocation('/', '?benchmark=test1&timing=all&metric=first&zoom=4.5,1.2')

            const view = {
                benchmark: 'test1',
                timing: 'all',
                metric: 'first',
                zoom: {
                    'xaxis.range': ['4.5', '1.2']
                },
                comparison: {
                    benchmarkName: undefined,
                    commits: [],
                    results: {}
                }
            }

            expect(urlstorage.loadState()).toEqual({ view })
        })

        it('loads only view with full comparison from path', () => {
            setLocation('/', '?benchmark=test1&timing=all&metric=first&zoom=auto&comparison=aaaaaaa,bbbbbbb&comparisonBenchmark=test1')

            const view = {
                benchmark: 'test1',
                timing: 'all',
                metric: 'first',
                zoom: {
                    'xaxis.autorange': true
                },
                comparison: {
                    benchmarkName: 'test1',
                    commits: ['aaaaaaa', 'bbbbbbb'],
                    results: {}
                }
            }

            expect(urlstorage.loadState()).toEqual({ view })
        })

        it('loads selectedProjectId and view from path', () => {
            setLocation('/2', '?benchmark=test1&timing=all&metric=first&zoom=auto&comparison=aaaaaaa,bbbbbbb&comparisonBenchmark=test1')

            const view = {
                benchmark: 'test1',
                timing: 'all',
                metric: 'first',
                zoom: {
                    'xaxis.autorange': true
                },
                comparison: {
                    benchmarkName: 'test1',
                    commits: ['aaaaaaa', 'bbbbbbb'],
                    results: {}
                }
            }

            const projects = {
                items: [],
                selectedProjectId: 2
            }

            expect(urlstorage.loadState()).toEqual({ view, projects })
        })
    })
})