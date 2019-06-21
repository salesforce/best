import * as types from 'store/shared'
import * as actions from 'store/actions'

describe('view actions', () => {
    describe('benchmarksChanged', () => {
        it('should create an action for benchmarks changing', () => {
            const benchmark = 'test'
    
            const expectedAction = {
                type: types.VIEW_BENCHMARKS_CHANGED,
                benchmark
            }
    
            expect(actions.benchmarksChanged(benchmark)).toEqual(expectedAction)
        })
    })

    describe('metricsChanged', () => {
        it('should create an action for metrics changing', () => {
            const metric = 'duration'
    
            const expectedAction = {
                type: types.VIEW_METRICS_CHANGED,
                metric
            }
    
            expect(actions.metricsChanged(metric)).toEqual(expectedAction)
        })
    })

    describe('zoomChanged', () => {
        it('should create an action for zoom changing', () => {
            const zoom = { auto: true }
    
            const expectedAction = {
                type: types.VIEW_ZOOM_CHANGED,
                zoom
            }
    
            expect(actions.zoomChanged(zoom)).toEqual(expectedAction)
        })
    })

    describe('resetView', () => {
        it('should create an action for view resetting', () => {
            const expectedAction = {
                type: types.VIEW_RESET
            }
    
            expect(actions.resetView()).toEqual(expectedAction)
        })
    })
})