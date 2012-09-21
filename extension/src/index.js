'use strict';

var uuid = require( 'node-uuid' ),
    qrcode = require( 'qrcode' );

/**
 * This is what the code must do:
 *   - Connect to the websocket.
 *   - Create a channel which name is a generated UUID.
 *   - Listen on "send key" event from the websocket to get
 *   a keyCode.
 *   - Dispatch a KeyboardEvent using this keyCode.
 */

var socket = io.connect( 'http://remoteprez.margaine.com:8080/' );

var channel = uuid.v4(),
    engine = guessEngine();

socket.on( 'connect', function() {
    // Emit an event to create the channel
    socket.emit( 'create channel', channel );

    // And display a link to the controller link on remoteprez.margaine.com
    showLink();

    // Listen on the "send key" event
    socket.on( 'send direction', function( engine, direction ) {
        // Mapping object
        var mapping = {
            'impress.js': {
                'top': 'impress().prev()',
                'bottom': 'impress().next()',
                'left': 'impress().prev()',
                'right': 'impress().next()'
            },
            'reveal.js': {
                'top': 'Reveal.navigateUp()',
                'bottom': 'Reveal.navigateDown()',
                'left': 'Reveal.navigateLeft()',
                'right': 'Reveal.navigateRight()'
            },
            'html5slides': {
                'top': 'prevSlide()',
                'bottom': 'nextSlide()',
                'left': 'prevSlide()',
                'right': 'nextSlide()'
            }
        };

        // Just inject the right function
        injectCode( mapping[ engine ][ direction ] );
    });
});

function guessEngine() {
    // Ugly hack, but hey
    injectCode( ';(' + setEngine.toString() + '());' );

    // There we have the engine in the dataset
    return document.body.dataset.remoteprez;
}

function setEngine() {
    // To avoid errors in the mapping object
    // And let's not forget about hoisting :-)
    var Reveal = window.Reveal || '',
        impress = window.impress || '',
        prevSlide = window.prevSlide || '';

    // Reveal isn't a function, so we need this
    if ( typeof Reveal === 'object' ) {
        Reveal = Reveal.toggleOverview;
    }

    var mapping = {
        'reveal.js': Reveal,
        'impress.js': impress,
        'html5slides': prevSlide
    };

    Object.keys( mapping ).forEach( function( f ) {
        // If the function exists
        if ( typeof mapping[ f ] === 'function' ) {
            // Add it on the body data-*
            document.body.dataset.remoteprez = f;
        }
    });
}

function injectCode( code ) {
    // Create the element
    var script = document.createElement( 'script' );
    script.textContent = code;

    // Inject it
    document.body.appendChild( script );

    // And immediately remove it
    script.parentNode.removeChild( script );
}

function showLink() {
    // Create a wrapper
    var wrapper = document.createElement( 'div' );

    // Remove it when you click on it
    wrapper.addEventListener( 'click', function() {
        this.parentNode.removeChild( this );
    }, false );

    // Store the url
    var url = 'http://remoteprez.margaine.com/prez.html?c=' + channel +
        '&e=' + engine;

    // Create a DOM element to show
    var link = document.createElement( 'a' );
    link.href = url;
    link.textContent = 'Click here to control your presentation';
    link.target = '_blank';

    // Add some style
    link.style.background = 'white';
    link.style.position = 'absolute';
    link.style.top = '10px';
    link.style.left = '10px';
    // For impress.js, or the link won't be clickable
    link.style.pointerEvents = 'auto';

    // Add it to the wrapper
    wrapper.appendChild( link );

    // Now create the QRCode
    var qr = qrcode( 10, 'M' );
    qr.addData( url );
    qr.make();

    wrapper.innerHTML += qr.createImgTag( 5 );

    // And append it to the body
    document.body.appendChild( wrapper );
}
