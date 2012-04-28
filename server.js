

var url = require ( 'url' ),
    db  = require ( './index' );

require ( "http" ).createServer
(
    function ( req, res )
    {
        var data = url.parse ( req.url, true ),
            lon  = Number ( data.query.lon ),
            lat  = Number ( data.query.lat );

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

        if ( !( lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90 ) )
        {
            res.statusCode = 400;
            res.end ( "Bad request." );
            return;
        }

            ////    Query.

        var time = Date.now (),
            data = db.query ( lat, lon ) || null;

            ////    Respond.

        res.setHeader ( "Content-Type", "application/json" );
        res.end ( JSON.stringify ( { data : data, loading : db.loading, time : Date.now () - time } ) );
    }
)
.listen
(
    process.env.PORT || 8181
);


