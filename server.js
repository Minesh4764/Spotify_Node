var unirest = require('unirest');
var express = require('express');
var events = require('events');
var unirest = require('unirest');

var getFromApi = function (endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
        .qs(args)
        .end(function (response) {
            if (response.ok) {
                //   console.log(response.body);
                emitter.emit('end1', response.body);
            }
            else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};


var app = express();
app.use(express.static('public'));

app.get('/search/:name', function (req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end1', function (item) {
        //console.log(":This is the id " + item.artists.items[0].id);
        var artist = item.artists.items[0];
        var searchReq1 = getFromApi('artists/' + item.artists.items[0].id + '/related-artists', null)
        searchReq1.on('end1', function (itemRelated) {
                artist.related = itemRelated.artists;
                var completed = 0;

                /**
                 * This function will be called each time a top tracks call is completed. When all
                 * top tracks are completed it is time to return the artist object to the client
                 */
                var checkComplete = function () {
                    if (completed === artist.related.length) {
                        // console.log(artist)
                        res.json(artist);
                    }
                }


                artist.related.forEach(function (current, index, related) {
                    var toptracks = getFromApi('artists/' + current.id + '/top-tracks?country=US', null);
                    toptracks.on('end1', function (item) {
                        console.log(index);
                        current.tracks = item.tracks;
                        /**
                         * Increment the completed count
                         */
                        completed = completed + 1;
                        /*
                         * Call on checkComplete to see if all are done.
                         */
                        checkComplete();
                    })
                });


//If the request is successful, then artist.related should be set to item.artists, where item is the object returned by the get related artists endpoint.
//If the request is successful, then the tracks attribute of the related artist should be set to item.tracks, where item is the object returned by the get related artists endpoint.


                // res.json(artist);


            }
        );

    });

    searchReq.on('error', function (code) {
        res.sendStatus(code);
    });
});

app.listen(8080);