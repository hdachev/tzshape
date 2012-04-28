
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

var entry;
while (( entry = data.pop () ))
    ws.write ( JSON.stringify ( entry ) + "\n" );
