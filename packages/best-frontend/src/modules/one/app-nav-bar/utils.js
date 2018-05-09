export function debounce(fn, wait) {
    return function _debounce() {
        if (!_debounce.pending) {
            _debounce.pending = true;
            setTimeout(() => {
                fn();
                _debounce.pending = false;
            }, wait);
        }
    };
}
