var setup = require('./setup'),
    assert = require('assert');

setup(function(err, cb) {
    assert(!err, "setup failure");

    cb.on("error", function (message) {
        console.log("ERROR: [" + message + "]");
        process.exit(1);
    });

    var testkey = "08-views.js"

    cb.set(testkey, "bar", function (err, meta) {
        assert(!err, "Failed to store object");
        assert.equal(testkey, meta.id, "Set callback called with wrong key!")

        cb.get(testkey, function (err, doc, meta) {
            assert(!err, "Failed to get object");
            assert.equal(testkey, meta.id, "Get existing called with wrong key!")

            // todo: figure out how to get around the delay in view creation
            var ddoc = {
                 "views": {
                     "test-view": {
                         "map": "function(doc,meta){emit(meta.id)}"
                     }
                 }
             };
             cb.deleteDesignDoc('dev_test-design', function() {
                 cb.setDesignDoc('dev_test-design', ddoc,
                                 function(err, code, data) {
                     assert(!err, "error creating design document");
                     // now lets find our key in the view.
                     // We need to add stale=false in order to force the
                     // view to be generated (since we're trying to look
                     // for our key and it may not be in the view yet due
                     // to race conditions..
                     var params =  {key : testkey, stale : "false"};
                     cb.view("dev_test-design", "test-view", params,
			     function(err, code, view) {
				 assert(!err, "error fetching view");
				 assert(code == 200, "error fetching view");
				 json = JSON.parse(view);
				 rows = json.rows;
				 assert(rows.length == 1);
				 assert.equal(testkey, rows[0].key);

				 cb.deleteDesignDoc('dev_test-design', function() {
				     setup.end()
                        });
                    });
                 });
             });
        });
    });
})
