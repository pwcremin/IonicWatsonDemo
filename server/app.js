var watson = require( 'watson-developer-cloud' );
var fs = require( 'fs' );
var formidable = require( 'formidable' );

var express = require( 'express' ),
    router = express.Router(),
    app = express();

if(process.env.VCAP_SERVICES) {
    var vcapServices = JSON.parse(process.env.VCAP_SERVICES);

    var visual_recognition = watson.visual_recognition( {
        username: vcapServices.visual_recognition[0].credentials.username,
        password: vcapServices.visual_recognition[0].credentials.password,
        version: 'v1'
    } );


    var alchemy_vision = watson.alchemy_vision( {
        api_key: vcapServices.alchemy_api[0].credentials.apikey,
        version: 'v1'
    } );
}
else
{
    // NOTE: do not push your username/password to cf, nor should you put them in git.
    // I have them here just as an example

    var visual_recognition = watson.visual_recognition( {
        username: '5530b1d8-1d00-477f-96a4-c56cf77c3b3d',
        password: 'uO3QkTSnSErg',
        version: 'v1'
    } );

    var alchemy_vision = watson.alchemy_vision( {
        api_key: 'be7dcd293c53db3ae8b9f44e9ee87efc248bb34a',
        version: 'v1'
    } );
}

router.route( '/' )
    .get( function ( req, res )
    {
        res.sendfile( 'public/desktop.html' );
    } );

router.route( '/uploadpic' )
    .post( function ( req, result )
    {

        console.log( 'uploadpic' );

        var form = new formidable.IncomingForm();
        form.keepExtensions = true;

        form.parse( req, function ( err, fields, files )
        {
            var params = {
                image_file: fs.createReadStream( files.image.path )
            };

            visual_recognition.recognize( params, function ( err, body, res )
            {
                if ( err )
                    console.log( err );
                else {
                    console.log("Response code: " + res.statusCode)
                    var results = [];
                    for ( var i = 0; i < body.images[ 0 ].labels.length; i++ ) {
                        results.push( body.images[ 0 ].labels[ i ].label_name );
                    }
                    console.log( 'got ' + results.length + ' labels from good ole watson' );

                    /* simple toggle for desktop/mobile mode */
                    if ( !fields.mode ) {
                        result.send( results );
                    } else {
                        result.send( "<h2>Results from Watson</h2>" + results.join( ', ' ) );
                    }
                }
            } );

        } );

    } );

router.route( '/vision/uploadpic' )
    .post( function ( req, result )
    {
        console.log( 'vision/uploadpic' );

        var form = new formidable.IncomingForm();
        form.keepExtensions = true;

        form.parse( req, function ( err, fields, files )
        {
            var params = {
                image: fs.createReadStream( files.image.path )
            };

            alchemy_vision.getImageKeywords(params, function (err, keywords) {
                if (err)
                    result.json('error:', err);
                else
                    result.json(keywords.imageKeywords)
            });
        } );

    } );


app.use( '/', router );

var port = process.env.PORT || 7878;
app.listen( port);

console.log('Express server listening on port ' + port);

