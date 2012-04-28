

    ////    Note that data is LON/LAT, not lat/lon.

var time = Date.now (),
    quad = new ( require ( "./lib/shapequadtree" ).Index ) ( -180, -90, 180, 90, 4 );
    quad.verbose = true;

    geom = require ( "./lib/geom" ),
    dist2poly = geom.dist2poly;


    ////    Run tests.

require ( "./test" );


    ////    Export the query method.

exports.loading = true;
exports.query = function ( lat, lon )
{
    var results,
        i, n, best, bestScore, score;

        ////    Try to point-hit and in case of success return the first match.
        ////        Otherwise fallback to a 200 km radius scan.

    results = quad.query ( [ lon, lat ] );
    if ( !results || !results.length )
        results = quad.query ( kmRadius ( lon, lat, 200 ) );
    else
        return results [ 0 ].data;

        ////    We're here because we're in international waters.

    if ( !results || !( n = results.length ) )
        return null;

    if ( n === 1 )
        return results [ 0 ].data;

        ////    We have several matches, select the closest poly.

    best = results [ 0 ];
    bestScore = dist2poly ( lon, lat, best.geom );

    for ( i = 1; i < n; i ++ )
    {
        score = dist2poly ( lon, lat, results [ i ].geom );
        if ( !( bestScore < score ) )
        {
            console.log ( score, "better than", bestScore );
            best = results [ i ];
            bestScore = score;
        }
    }

    return best.data;
};


    ////    Stream the data in from the internetz.

var Lazy = require ( "lazy" ),
    http = require ( "http" ),
    zlib = require ( "zlib" ),
    data;

console.log ( "Retrieving and indexing data ..." );

http.get
({
    host    : process.env.DATA_HOST || 's3.amazonaws.com',
    path    : process.env.DATA_URI  || '/tznode/tz_world.json.list.gz',
    port    : process.env.DATA_PORT || 80,
    headers :
    {
        'Accept-Encoding' : 'gzip,deflate'
    }
})
.on ( 'response', function ( response )
{
    switch ( response.headers [ 'content-encoding' ] )
    {
        case 'gzip' :
            data = new Lazy ( response.pipe ( zlib.createGunzip () ) );
            break;

        case 'deflate' :
            data = new Lazy ( response.pipe ( zlib.createInflate () ) );
            break;

        default :
            data = new Lazy ( response );
            break;
    }

    response.on ( 'end', function ()
    {
        delete exports.loading;

        quad.stats ();
        console.log ( "READY!" );
    });

    index ( data );
});


    ////    Index it.

function index ( data )
{
    var ok = 0, bad = 0;

    data.lines.forEach
    (
        function ( line ) 
        {
            var data,
                g, d;

            try
            {
                ok ++;

                data = JSON.parse ( line );
                g = data.poly;
                p = data.data;

                if ( g.length && p && p !== "uninhabited" )
                {
                    quad.insert ( g, p );
                    if ( !( ok % 50 ) )
                        console.log ( 'OK!', ok, bad );
                }

                else
                    throw new Error ( "What?" );
            }
            catch ( e )
            {
                bad ++;

                console.log ( 'BAD!', line, e, ok, bad );
                if ( bad > 50 )
                    throw new Error ( "Too much corrupt data." );
            }
        }
    );
}


    ////    Placeholder for something smarter.

function kmRadius ( lon, lat, r )
{
    var rY, rX;

        ////    1deg of lat is always about 111km.

    rY = r / 111;
    
        ////    Beyond imprecise,
        ////        too lazy to think about this more seriously.

    rX = r / ( 111 - ( Math.abs ( lat ) / 90 * 70 ) );

        ////    Return a diamond as a cheap approximation of a circle.

    return [
        lon, lat - rY,
        lon + rX, lat,
        lon, lat + rY,
        lon - rX, lat
    ];
}


