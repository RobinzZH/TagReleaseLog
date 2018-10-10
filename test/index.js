const tg = require('../lib/index');
const chai = require('chai');

describe('tagchanges', function () {
    it('get tags changes', function (done) {
        tg({
            repository: '.',
            save: false
        }).then(result => {
            /* eslint-disable no-unused-expressions */
            chai.expect(result).to.not.be.empty;
            done();
        }).catch(err => {
            done(err);
        });
    });
});
