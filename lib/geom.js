

    ////    some 2D geom basics.

exports.aabbTest = aabbTest;
exports.polyTest = polyTest;

exports.lineIntersect = lineIntersect;

exports.dist2poly = dist2poly;
exports.dist2seg = dist2seg;


    ////    stuff.

function aabbTest ( ax, ay, bx, by, ex, ey, fx, fy )
{
    if ( ( ax > ex && ax > fx && bx > ex && bx > fx ) )
        return 0;
    if ( ( ax < ex && ax < fx && bx < ex && bx < fx ) )
        return 0;
    if ( ( ay > ey && ay > fy && by > ey && by > fy ) )
        return 0;
    if ( ( ay < ey && ay < fy && by < ey && by < fy ) )
        return 0;

    return 1;
}

function polyTest ( geom, x0, x, y )
{
    var i, n = geom.length,
        a, c,
        gi1, gi3;

        ////    If shape is a point.

    if ( n < 2 || n % 2 )
        throw new Error ( "WOOT! Bad geom : " + geom );
    if ( n === 2 )
        return x === geom [ 0 ] && y === geom [ 1 ] ? 1 : 0;

        ////    If shape is a line.
        ////    This is unlikely to succeed for any point
        ////        thats not at the edge of a sloped line though,
        ////        perhaps some approximation?

    else if ( n === 4 )
    {
        a = lineIntersect
        (
            x0, y, x, y,
            geom [ i ], geom [ i + 1 ], geom [ i + 2 ], geom [ i + 3 ],
            false, false, true
        );

        return a && x === a [ 0 ] && y === a [ 1 ] ? 1 : 0;
    }

        ////    If shape is a polygon.

    else
    {
        c = 0;
        for ( i = 0; i < n; i += 2 )
        {
            gi1 = geom [ i + 1 ];
            gi3 = geom [ ( i + 3 ) % n ];

            if ( ( gi1 >= y && gi3 <= y ) || ( gi1 <= y && gi3 >= y ) )
                c += lineIntersect
                (
                    x0, y, x, y,
                    geom [ i ], gi1, geom [ ( i + 2 ) % n ], gi3
                );
        }

        return c % 2;
    }
}

function lineIntersect ( ax, ay, bx, by, ex, ey, fx, fy, aline, bline, rpt )
{
    var ipx, ipy,
        a1, a2, b1, b2, c1, c2,
        d;
 
    a1 = by - ay;
    b1 = ax - bx;
    c1 = bx * ay - ax * by;
    a2 = fy - ey;
    b2 = ex - fx;
    c2 = fx * ey - ex * fy;
 
    d = a1 * b2 - a2 * b1;
    if ( !d )
        return rpt ? null : 0;

    ipx = ( b1 * c2 - b2 * c1 ) / d;
    ipy = ( a2 * c1 - a1 * c2 ) / d;
 
        ////    Deal with rounding errors.

    if ( ax === bx )
        ipx = ax;
    else if ( ex === fx )
        ipx = ex;
    if ( ay === by )
        ipy = ay;
    else if ( ey === fy )
        ipy = ey;

        ////    Constrain to segment.

    if ( !aline )
    {
        if ( ( ax < bx ) ? ipx < ax || ipx > bx : ipx > ax || ipx < bx )
            return rpt ? null : 0;
        if ( ( ay < by ) ? ipy < ay || ipy > by : ipy > ay || ipy < by )
            return rpt ? null : 0;
    }

    if ( !bline )
    {
        if ( ( ex < fx ) ? ipx < ex || ipx > fx : ipx > ex || ipx < fx )
            return rpt ? null : 0;
        if ( ( ey < fy ) ? ipy < ey || ipy > fy : ipy > ey || ipy < fy )
            return rpt ? null : 0;
    }

    return rpt ? [ ipx, ipy ] : 1;
}

/**

naive line intersect in as3 as seen on:
http://blog.controul.com/2009/05/line-segment-intersection/
http://keith-hair.net/blog/2008/08/04/find-intersection-point-of-two-lines-in-as3/

function lineIntersectLine (
    A : Point, B : Point,
    E : Point, F : Point,
    ABasSeg : Boolean = true, EFasSeg : Boolean = true
) : Point
{

    var ip:Point;
    var a1:Number;
    var a2:Number;
    var b1:Number;
    var b2:Number;
    var c1:Number;
    var c2:Number;
 
    a1= B.y-A.y;
    b1= A.x-B.x;
    c1= B.x*A.y - A.x*B.y;
    a2= F.y-E.y;
    b2= E.x-F.x;
    c2= F.x*E.y - E.x*F.y;
 
    var denom:Number=a1*b2 - a2*b1;
    if (denom == 0) {
        return null;
    }
    ip=new Point();
    ip.x=(b1*c2 - b2*c1)/denom;
    ip.y=(a2*c1 - a1*c2)/denom;
 
    //  Deal with rounding errors.

    if ( A.x == B.x )
        ip.x = A.x;
    else if ( E.x == F.x )
        ip.x = E.x;
    if ( A.y == B.y )
        ip.y = A.y;
    else if ( E.y == F.y )
        ip.y = E.y;

    //  Constrain to segment.

    if ( ABasSeg )
    {
        if ( ( A.x < B.x ) ? ip.x < A.x || ip.x > B.x : ip.x > A.x || ip.x < B.x )
            return null;
        if ( ( A.y < B.y ) ? ip.y < A.y || ip.y > B.y : ip.y > A.y || ip.y < B.y )
            return null;
    }
    if ( EFasSeg )
    {
        if ( ( E.x < F.x ) ? ip.x < E.x || ip.x > F.x : ip.x > E.x || ip.x < F.x )
            return null;
        if ( ( E.y < F.y ) ? ip.y < E.y || ip.y > F.y : ip.y > E.y || ip.y < F.y )
            return null;
    }

    return ip;
}

*/

function dist2poly ( x, y, geom )
{
    var i, n = geom.length,
        min, d;

    for ( i = 0; i < n; i += 2 )
    {
        d = dist2seg
        (
            x, y,
            geom [ i ], geom [ i + 1 ],
            geom [ ( i + 2 ) % n ], geom [ ( i + 3 ) % 2 ]
        );

        if ( d && !( min < d ) )
            min = d;
    }

    return min || null;
}

function dist2seg ( x, y, x1, y1, x2, y2 )
{
    var dx = x2 - x1,
        dy = y2 - y1,
        u,
        x, y;

    if ( !dx && !dy )
        u = 0;
    else
        u = ( ( x - x1 ) * dx + ( y - y1 ) * dy ) / ( dx * dx + dy * dy );

    if ( u <= 0 )
    {
        x -= x1;
        y -= y1;
    }
    else if ( u >= 1 )
    {
        x -= x2;
        y -= y2;
    }
    else
    {
        x -= x1 + u * dx;
        y -= y1 + u * dy;
    }

    return Math.sqrt ( x * x + y * y );
}

/**

minimum distance between a point and a line
http://paulbourke.net/geometry/pointline/DistancePoint.java
http://paulbourke.net/geometry/pointline/

public static double distanceToSegment(Point2D p1, Point2D p2, Point2D p3) {

    final double xDelta = p2.getX() - p1.getX();
    final double yDelta = p2.getY() - p1.getY();

    if ((xDelta == 0) && (yDelta == 0)) {
        throw new IllegalArgumentException("p1 and p2 cannot be the same point");
    }

    final double u = ((p3.getX() - p1.getX()) * xDelta + (p3.getY() - p1.getY()) * yDelta) / (xDelta * xDelta + yDelta * yDelta);

    final Point2D closestPoint;
    if (u < 0) {
        closestPoint = p1;
    } else if (u > 1) {
        closestPoint = p2;
    } else {
        closestPoint = new Point2D.Double(p1.getX() + u * xDelta, p1.getY() + u * yDelta);
    }

    return closestPoint.distance(p3);
}

*/

