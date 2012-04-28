

var Index,
    Node,
    Shape,

    geom = require ( './geom' ),
    aabbTest = geom.aabbTest,
    polyTest = geom.polyTest,
    lineIntersect = geom.lineIntersect,

    numNodes = 0,
    numShapes = 0;


    ////    Facade.

Index = function ( ax, ay, bx, by, max, grow )
{
    if ( bx < ax || by < ay )
        throw new Error ( "Bad param order, p2.x < p1.x or p2.y < p1.y." );

    var node = new Node ( ax, ay, bx, by, max, grow );

    this.insert = function ( geom, data )
    {
        var c;

        if ( geom instanceof Shape )
            c = node.insert ( geom );
        else
            c = node.insert ( new Shape ( geom, data ) );

        if ( !c )
        {
            if ( c !== 0 )
                throw new Error ( "WOOT! Bad insert count : " + c );
            else
                throw new Error ( "Rejecting geom / data : " + geom + " / " + data );
        }

        return c;
    };

    this.query  = function ( geom )
    {
        var stat = { sc : 0, nc : 0, lvl : 0 }, out, time = Date.now ();

        if ( !geom )
            throw new Error ( "Querying with falsy geometry." );

        out = node.query ( geom instanceof Shape ? geom : new Shape ( geom ), stat ) || [];

        if ( this.verbose )
            console.log
            (
                'QUERY', geom, out.length,
                '#n', stat.nc,
                '#lvl', stat.lvl,
                '#s', stat.sc,
                'pass', ( 100 * out.length / stat.sc ).toFixed ( '2' ) + '%',
                'time', Date.now () - time
            );

        return out;
    };

    this.stats = function ()
    {
        console.log ( 'STATS FOR ALL TREES, #nodes:', numNodes, '#shapes', numShapes );
    };
};


    ////    Node params:
    ////        x/y of cell center,
    ////        half-width and half-height for this cell,
    ////        max number of shapes per node until split,
    ////        doubles at every level.

Node = function ( ax, ay, bx, by, max, grow )
{
    if ( ax > bx || ay > by )
        throw new Error ( 'WOOT! Bad dimensions.' );

    this.ax   = ax;
    this.ay   = ay;
    this.bx   = bx;
    this.by   = by;

    this.max  = max  || 16;
    this.grow = grow || 1;

    this.data = [];

    this.nc   = ++ numNodes;
};

Node.prototype =
{
    insert : function ( shape )
    {
        var a, i, n,
            ax = this.ax, ay = this.ay, bx = this.bx, by = this.by, 
            x, y,
            obvious;

            ////    A. Cheap bbox reject.

        if ( shape.bx < ax || shape.ax > bx || shape.by < ay || shape.ay > by )
            return 0;

            ////    B. Cheap bbox-vertex accept.

        a = shape.geom;
        n = a.length;
        obvious = false;
        for ( i = 0; i < n; i += 2 )
        {
            x = a [ i ];
            y = a [ i + 1 ];
            if ( x >= ax && x <= bx && y >= ay && y <= by )
            {
                obvious = true;
                break;
            }
        }

            ////    C. Expensive reject.

        if ( !obvious && !shape.intersects ( this ) )
            return 0;

            ////    Leaf nodes keep up to a maximum number of entries and then split.

        if ( this.data )
        {
            if ( this.data.length >= this.max )
            {
                this.split ();
                return this.insert ( shape );
            }

            else
            {
                this.data.push ( shape );
                return 1;
            }
        }

            ////    The shape may get inserted in 1 to 4 child nodes.

        else
        {
            n = this.nw.insert ( shape ) + this.ne.insert ( shape ) + this.sw.insert ( shape ) + this.se.insert ( shape );
            if ( !n )
                throw new Error ( "WOOT! Parent passes, children fail :\n" + shape + "\n" + this + "\n" + this.nw + "\n" + this.ne + "\n" + this.sw + "\n" + this.se );

            return n;
        }
    },

    split : function ()
    {
        var a, i, n,

            ax = this.ax,
            ay = this.ay,
            bx = this.bx,
            by = this.by,

            xx = ( bx + ax ) / 2,
            yy = ( by + ay ) / 2,

            max = this.max * this.grow;

        a = this.data;
        if ( !a || !a.length )
            throw new Error ( "WOOT! Splitting without data." );

        delete this.data;

        this.nw = new Node ( ax, ay, xx, yy, max, this.grow );
        this.ne = new Node ( xx, ay, bx, yy, max, this.grow );
        this.sw = new Node ( ax, yy, xx, by, max, this.grow );
        this.se = new Node ( xx, yy, bx, by, max, this.grow );

        n = a.length;
        for ( i = 0; i < n; i ++ )
            if ( !this.insert ( a [ i ] ) )
                throw new Error ( "WOOT! Losing data on split " + a [ i ] + ", " + this );
    },

    query : function ( shape, state )
    {
        var a, i, n,
            ax = this.ax, ay = this.ay, bx = this.bx, by = this.by, 
            x, y,
            obvious,

            a1, a2;

            ////    A. Cheap bbox reject.

        if ( shape.bx < ax || shape.ax > bx || shape.by < ay || shape.ay > by )
            return null;

            ////    State keeps track of query stats,
            ////        number of node and shape intersects,
            ////        and also prevents the same shape from being tested twice,
            ////        which can happen when it overlaps several nodes in the tree.

        state.nc ++;

            ////    B. Cheap bbox-vertex accept.

        a = shape.geom;
        n = a.length;
        obvious = false;
        for ( i = 0; i < n; i += 2 )
        {
            x = a [ i ];
            y = a [ i + 1 ];
            if ( x >= ax && x <= bx && y >= ay && y <= by )
            {
                obvious = true;
                break;
            }
        }

            ////    C. Expensive reject.

        if ( !obvious && !shape.intersects ( this ) )
            return null;

            ////    Execute the query.

        a1 = this.data;
        if ( a1 )
        {
            a2 = [];
            n  = a1.length;
            for ( i = 0; i < n; i ++ )
                if ( !state [ a1 [ i ].sc ] )
                {
                    state.sc ++;
                    state [ a1 [ i ].sc ] = true;

                    if ( shape.intersects ( a1 [ i ] ) )
                        a2.push ( a1 [ i ] );
                }

            return a2.length ? a2 : null;
        }

        else
        {
            state.lvl ++;

            a1 = this.nw.query ( shape, state );

            a2 = this.ne.query ( shape, state );
            if ( a1 && a2 )
                a1 = a1.concat ( a2 );
            else if ( a2 )
                a1 = a2;

            a2 = this.sw.query ( shape, state );
            if ( a1 && a2 )
                a1 = a1.concat ( a2 );
            else if ( a2 )
                a1 = a2;

            a2 = this.se.query ( shape, state );
            if ( a1 && a2 )
                a1 = a1.concat ( a2 );
            else if ( a2 )
                a1 = a2;

            return a1 && a1.length ? a1 : null;
        }
    },

    toString : function ()
    {
        return "<NODE[" + this.ax + "," + this.ay + "/" + this.bx + "," + this.by + "]>";
    }
};


    ////    A shape is either a point, a line or a poly.

Shape = function ( geom, data )
{
    var minX, maxX, minY, maxY, i, n, v;

    minX = minY = Number.POSITIVE_INFINITY;
    maxX = maxY = Number.NEGATIVE_INFINITY;

    n = geom.length;
    if ( !Array.isArray ( geom ) || n < 2 || n % 2 )
        throw new Error ( "Bad geometry." );

    for ( i = 0; i < n; i += 2 )
    {
        v = geom [ i ];
        if ( !v && v !== 0 ) throw new Error ( "Bad x coordinate [" + i + "] : " + v );
        if ( minX > v ) minX = v;
        if ( maxX < v ) maxX = v;

        v = geom [ i + 1 ];
        if ( !v && v !== 0 ) throw new Error ( "Bad y coordinate [" + ( i + 1 ) + "] : " + v );
        if ( minY > v ) minY = v;
        if ( maxY < v ) maxY = v;
    }

    if ( minX > maxX || minY > maxY )
        throw new Error ( "WOOT! Bad min/max." );

    this.ax = minX;
    this.bx = maxX;
    this.ay = minY;
    this.by = maxY;

    this.geom = geom;
    this.data = data;

    this.sc   = ++ numShapes;
};

Shape.prototype =
{
    intersects : function ( shape )
    {
        var g1, g2,
            i, n,
            j, m,
            gi0, gi1, gi2, gi3,

            ax = shape.ax,
            bx = shape.bx,
            ay = shape.ay,
            by = shape.by;

        if ( ( !ax && ax !== 0 ) || ( !ay && ay !== 0 ) || ( !bx && bx !== 0 ) || ( !by && by !== 0 ) )
            throw new Error ( "WOOT! Corrupt AABB : " + shape );

            ////    Test 0 : Cheap AABB-X-AABB.

        if ( !aabbTest ( this.ax, this.ay, this.bx, this.by, ax, ay, bx, by ) )
            return false;

            ////    If not dealing with a shape, use AABB data as geometry.

        if ( shape instanceof Shape )
            g2 = shape.geom;
        else
            g2 = [ ax, ay, bx, ay, bx, by, ax, by ];

        g1 = this.geom;
        n  = g1.length;
        m  = g2.length;

            ////    Test 1 : One inscribed in the other, or lucky intersect.

        if ( polyTest ( g1, this.ax, g2 [ 0 ], g2 [ 1 ] ) || polyTest ( g2, ax, g1 [ 0 ], g1 [ 1 ] ) )
            return true;

            ////    Test 2 : Poly intersect.

        for ( i = 0; i < n; i += 2 )
        {
            gi0 = g1 [ i ];
            gi1 = g1 [ i + 1 ];
            gi2 = g1 [ ( i + 2 ) % n ];
            gi3 = g1 [ ( i + 3 ) % n ];

            if ( aabbTest
            (
                gi0, gi1, gi2, gi3,
                ax, ay, bx, by
            ))
                for ( j = 0; j < m; j += 2 )
                    if ( lineIntersect
                    (
                        gi0, gi1, gi2, gi3,
                        g2 [ j ], g2 [ j + 1 ], g2 [ ( j + 2 ) % m ], g2 [ ( j + 3 ) % m ]
                    ))
                        return true;
        }

            ////    Nope.

        return false;
    },

    toString : function ()
    {
        return "<SHAPE[" + this.geom + "]:" + this.data + ">";
    }
};


    ////    Exports.

exports.Index = Index;
exports.Node  = Node;
exports.Shape = Shape;


