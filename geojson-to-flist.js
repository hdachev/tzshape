
var fs = require ( "fs" ),

    INPUT  = "./data/tz_world.json",
    OUTPUT = "./data/tz_world.json.list";


    ////    Parse the GeoJSON.

var data = JSON.parse
(
    fs.readFileSync ( INPUT )
)
.features;

    ////    Unlink the file if it already exists.

try
{
    fs.unlinkSync ( OUTPUT );
}
catch ( e ) {}

    ////    Output the feature collection
    ////        as one JSON-feature-object per line.

var ws = fs.createWriteStream ( OUTPUT, { flags : 'w', mode : '0666' } );

var entry,
    seen = {};

while (( entry = data.pop () ))
    if ( entry && entry.geometry && entry.geometry.coordinates && entry.properties && entry.properties.TZID && entry.properties.TZID !== 'uninhabited' )
    {
        if ( !seen [ entry.properties.TZID ] )
        {
            seen [ entry.properties.TZID ] = true;
            console.log ( entry.properties.TZID );
        }

        ws.write ( JSON.stringify ( entry ) + "\n" );
    }
