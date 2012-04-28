


var time = Date.now (),
    quad = new ( require ( "./lib/shapequadtree" ).ShapeQuadTree ) ( -180, -90, 180, 90, 4 );


////    Stream the data in.

var Lazy = require ( "lazy" ),
    http = require ( "http" ),
    zlib = require ( "zlib" ),
    data;

http.get
({
    host    : 's3.amazonaws.com',
    path    : '/tznode/tz_world.json.list.gz',
    port    : 80,
    headers :
    {
        'Accept-Encoding' : 'gzip,deflate'
    }
})
.on ( 'response', function ( response )
{
    switch ( response.headers [ 'content-encoding' ] )
    {
        case 'gzip':
            data = new Lazy ( response.pipe ( zlib.createGunzip () ) );
            break;
        case 'deflate':
            data = new Lazy ( response.pipe ( zlib.createInflate () ) );
            break;
        default:
            data = new Lazy ( response );
            break;
    }

    start ();
});


////    Index it.
////    Note that data comes in as LON/LAT, and not lat/lon.

var ok = 0, bad = 0;

function start ()
{
    data.lines.forEach
    (
        function ( line ) 
        { 
            var data;

            try
            {
                ok ++;

                data = JSON.parse ( line );
                quad.insert ( data.geometry.coordinates, data.properties.TZID );
                if ( !( ok % 50 ) )
                    console.log ( 'OK!', ok, bad );
            }
            catch ( e )
            {
                bad ++;

                console.log ( 'BAD!', ok, bad, e );
                if ( bad > 50 )
                    throw new Error ( "Too much corrupt data." );
            }
        }
    );
}


    ////

exports.query = quad.query.bind ( quad );



