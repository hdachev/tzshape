

var url = require ( 'url' ),
    // db = { query : function () { return null; } };
    db = require ( './index' );


    ////    Listen for requests.

require ( "http" ).createServer
(
    function ( req, res )
    {
        var data = url.parse ( req.url, true ),
            x    = Number ( data.query.lon ),
            y    = Number ( data.query.lat );

            ////    Validate.

        if ( data.pathname !== '/tz.json' )
        {
            res.statusCode = 404;
            res.end ( "Not found." );
            return;
        }

        if ( req.method !== 'GET' )
        {
            res.statusCode = 405;
            res.end ( "Method not supported." );
            return;
        }

        if ( !( x >= -180 && x <= 180 && y >= -90 && y <= 90 ) )
        {
            res.statusCode = 400;
            res.end ( "Bad request." );
            return;
        }

            ////    Query.

        var time = Date.now (),
            data = db.query ( [ x, y ] ) || [];

        data = data.map ( function ( entry )
        {
            return entry.data;
        });

        res.setHeader ( "Content-Type", "application/json" );
        res.end ( JSON.stringify ( { data : data, progress : db.progress, ready : db.ready, time : Date.now () - time } ) );
    }
)
.listen ( process.env.PORT || 8181 );


