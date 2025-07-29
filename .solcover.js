module.exports = {
    configureYulOptimizer: true, // (Experimental). Should resolve "stack too deep" in projects using ABIEncoderV2.
    skipFiles: ['mocks/', 'interfaces/', 'libs/', 'test/'],
    mocha: {
        fgrep: "[skip-on-coverage]",
        invert: true
    }
};