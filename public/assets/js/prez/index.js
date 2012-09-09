'use strict';

/**
 * This client reads the URL to get the UUID he has to use.
 * For example, the UUID can be "azerty" if the URL is
 * /prez.html?c=azerty
 *
 * Once it has the UUID, it can connect to the websocket to register
 * itself on it.
 *
 * Then, it has to listen at the click events on the table and
 * send the corresponding key to the websocket.
 */

// Get the channel used with a simple method.
// I could use a fully featured solution, but use the extension
// correctly or not, ffs.
var channel = window.location.search.split( '=' ).pop();

var socket = io.connect( 'http://remoteprez.margaine.com:8080/' );

// Set an object of keyCodes for the event handler
var keyCodes = {
    'top': 38,
    'right': 39,
    'bottom': 40,
    'left': 37
};

socket.on( 'connect', function() {
    // Emit an event to join the channel
    socket.emit( 'join channel', channel );

    // Add an event listener to handle the click events
    document.body.addEventListener( 'click', function( e ) {
        // Check if we clicked on an arrow
        if ( e.target.classList.contains( 'arrow' ) ) {

            // The direction is the second class in alphabetical order,
            // the first being "arrow".
            var direction = e.target.className.split( ' ' ).sort()[ 1 ];

            // Send the event to the websocket
            socket.emit( 'send key', {
                channel: channel,
                key: keyCodes[ direction ]
            });
        }
    }, false );
});

