

var time;

try
{
    time = require ( "time" );
}
catch ( e ) {}

module.exports = function ( tz, ts )
{
    try
    {
        time.tzset ( tz );
        return time.localtime ( Math.round ( ts / 1000 ) );
    }
    catch ( e )
    {
        console.log ( e );
    }
};

