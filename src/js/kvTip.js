var count = 0   // counts the number of tooltips
, timer = [];   // time to hover from target element to the tooltip, and back


var kvTip = {};

/**
 * Tooltips
 *
 * @param args
 */
$.fn.kvTip = function (args){

    if (!this.length ){ return; }

    // If args is a string, treat it as HTML content
    if (typeof args == 'string'){
        args = {content:args};
    }

    var options = $.extend(true, {}, args, kvTip.defaults);

    // Iterate thru each tooltip
    return this.each(function() {

        var $el = $(this)					// The target element
            , opts = $.extend({}, options)	// individual tooltip options
            , $tip							// The tooltip
            , tip = {						// suplemental tip data
                i: count
                , width: opts.width || ''
                , height: opts.height || ''
            };

        tip.id = 'kvTip_' + tip.i;

        // Prevent default click event on link elements
        if( this.nodeName.toLowerCase() == 'a' && opts.preventDefault ){
            $el.click(function (e) {
                e.preventDefault();
            });
        }

        // Immediately create the tooltip upon hovering over the target element...just don't display it
        $el.mouseenter(function () {

            // Make sure the browser's default title-tooltip doesn't pop up, store the title's value so it can be replaced on mouseout
            tip.elTitle = $el.attr('title');
            $el.attr('title', '');

            // Set the element that we are positioning relative to (used by jquery ui position)
            opts.position.of = $el;

            // Get a reference to the tooltip
            $tip = $('#' + tip.id);

            // Disable browser cache if js cache is disabled
            if (opts.ajax && opts.cache === false) {
                opts.cache = false;
            }

            // Make sure we have a tooltip
            // Does one already exist?  Even if it does, have we disabled caching?
            if (!$tip.length || (opts.ajax && opts.ajax.cache === false) || (opts.cache === false)){

                // If caching is off, remove the old tooltip
                if ((opts.ajax && opts.ajax.cache === false) || (opts.cache === false)){
                    $tip.remove();
                }

                // Get the new tip
                $tip = getTip($el, tip, opts);

                // Get the content, taking async calls into account
                $.when(getContent($el, tip, opts))
                    .done(function(content) {
                        if (typeof opts.onload == 'function') {
                            content = opts.onload.call($tip, content);
                        }

                        if (content) {
                            addContent($tip, tip, opts, content);
                        } else {
                            $tip.remove();
                        }
                    })
                    .fail(function() {
                        // If the ajax request failed, run getContent again
                        // This time, however, skip the ajax request and get alternate content
                        var content = getContent($el, tip, opts, true);

                        if (content) {
                            addContent($tip, tip, opts, content);
                        } else {
                            $tip.remove();
                        }
                    });
            }
        });

        // Now that we have a tooltip, display it
        if (opts.showOnclick){
            // Otherwise, add the click event
            $el.click(function (e) {
                e.preventDefault();
                showTip($tip, opts);
            })
                .mouseenter(function () {
                    clearTimeout(timer[tip.i]);		// Keep the tooltip open if it already exists
                    delete( timer[tip.i]);
                })
                .mouseleave(function () {
                    hideTip($el, $tip, tip, opts);
                });
        }
        else{

            // Attach hover event if onclick is disabled
            $el.hoverIntent(function () {
                    clearTimeout(timer[tip.i]);		// Keep the tooltip if it already exists
                    delete(timer[tip.i]);

                    showTip($tip, opts);
                }
                , function () {} // @todo, see note on mouseleave event
            )
                .mouseleave(function () {
                    // @todo, better integrate with hoverIntent, we should be able to use hoverIntent's "out" method instead of this event handler
                    // Currently, the reason for the extra event handler is to take the hover timeout into consideration
                    hideTip($el, $tip, tip, opts);
                });
        }

        // Store a reference in the target elemens data object that references its associated tooltip ( helps with unit testing )
        $el.data('kvTip', {tipID: tip.id });
        count++;
    });

};


kvTip.defaults = {
    title: ''
    , content: ''
    , selector: ''
    , cache: true	// Javascript cache, unlike ajax.cache which is browser cache
    , ajax: null
    , inlineUrl: ''
    , inlineData: ''
    , preventDefault: true
    , className: 'kvTip'
    , position: 'top-right'
    , width: null
    , height: null
    , showOnClick: false
    , hideOnClick: false // @todo: onclick = true is not yet supported
    , hideOnDelay: 300
}

// Create the tooltip
function getTip ($el, tip, opts) {

    var $tip = $('<div id="' + tip.id + '" class="' + opts.className + '" />')
        , zIndex;

    // Add an externally defined title if it exists
    if (opts.title){
        $tip.html('<div class="kvTipTitle">' + opts.title + '</div>');
    }

    // Make sure the tooltip shows on top of its triggering element
    // Loop through every ancestor element and get the max z-index
    zIndex = $el.css('z-index');
    $el.parentsUntil('html')
        .each(function () {
            var _zIndex = $(this).css('z-index');

            // We only need to update z-index if it is set to a numeric value (not "auto")
            if ($.isNumeric(_zIndex)) {
                if (!$.isNumeric(zIndex) || (zIndex < _zIndex)) {
                    zIndex = _zIndex;
                }
            }
        });

    var pos = $.extend({}, $el.offset(), {
        width: $el[0].offsetWidth
        , height: $el[0].offsetHeight
    });

    var actualWidth = $tip[0].offsetWidth,
        actualHeight = $tip[0].offsetHeight;

    var css = {
        'z-index': zIndex + 1
        , top: pos.top + pos.height / 2 - actualHeight / 2
        , left: pos.left + pos.width
    };

    // Build it
    $tip.css(css)
        .append('<div class="kvTipContent"></div>')
        .mouseenter(function(){
            clearTimeout(timer[tip.i]);
            delete( timer[tip.i]);
        })
        .mouseleave(function(){
            hideTip($el, $tip, tip, opts);
        })
        .addClass('loading')
        .appendTo('body')
        .click(function() {
            hideTip($el, $tip, tip, opts);
        });

    return $tip;
}


function showTip($tip, opts){
    // No need to show a tip that is already visible
    if( $tip.hasClass('active')){
        return;
    }

    $tip.css({display: 'none', visibility: 'visible'})
        .addClass('active')
        .fadeIn(400, function () {
            if (typeof opts.onshow == 'function') {
                opts.onshow.apply($tip);
            }
        });
}

function hideTip($el, $tip, tip, opts){
    if(!isset($tip) || !$tip.length){
        return;
    }

    // Set a timer, allows time to hover from target element to tooltip and back
    timer[tip.i] = setTimeout(function() {
        // Add the html title attribute back to the target element
        $el.attr('title', tip.elTitle || '' );

        // Hide the tooltip
        $tip.fadeOut('fast', 'linear', function() {
            if (typeof opts.onhide == 'function'){
                opts.onhide(this);
            }
        }).removeClass('active');

    }, opts.hideDelay);
}

//Retrieve the content
function getContent($el, tip, opts, skip){
    var content = '';

    if (opts.ajax && !skip){

        // Do we want to use an inline attribute as the value for our url?
        if(opts.inlineUrl){
            opts.ajax.url = $el.attr(opts.inlineUrl);
        }

        // Do we want to use an inline attribute as one of the values for our data?
        if(opts.inlineData){
            var tempData = {};
            tempData[opts.inlineData] = $el.attr(opts.inlineData);
            opts.ajax.data = $.extend(opts.ajax.data, tempData);
        }

        // return a deferred object
        return $.ajax(opts.ajax);
    }
    else if (opts.selector) {
        content = $(opts.selector).html();
    }
    else if (opts.content) {
        // Content could be a string, or it could be a function that generates the "content"
        content = $.isFunction(opts.content) ? opts.content() : opts.content;
    }
    else if (tip.elTitle) {
        content = tip.elTitle;
    }

    return content;
}

function addContent($tip, tip, opts, content) {
    var $tempTip;  // used for pre-determining the width / height of the tooltip

    // Resize and animate the tooltip if this was an ajax call
    if(opts.ajax){
        // Clone our tooltip, we will use the clone to determine our tooltips eventual size
        $tempTip = $tip.clone();

        // Prep the clone
        $tempTip.removeClass('loading')
            .attr('id','tempTip_' + tip.i)
            .css({ width: tip.width || '', height: tip.height || '' })
            .appendTo('body')
            .find('.kvTipContent')
            .html(content);

        // jQuery has a tendency to get the wrong width & height if the element gets cropped off by the boundaries of the viewport
        // Interestingly, it seems moving the element completely out of the viewport fixes this problem, allowing us to obtain the correct width & height
        $tempTip.offset({top: -9999, left: -9999});
        tip.width = tip.width || $tempTip.width();
        tip.height = tip.height || $tempTip.height();
        $tempTip.offset( $tip.offset() );

        // Re-position the tooltip if it won't fit in the viewport
        if(!fitsInViewport($tempTip)){
            $tempTip.position(opts.position);
            $tip.offset( $tempTip.offset() );
        }

        // Top it all off with a fancy little animation and add finally add the content!
        $tip.animate({
                width: tip.width
                , height: tip.height
            }
            , function(){
                $tip.removeClass('loading')
                    .find('.kvTipContent')
                    .html(content);
            });

        $tempTip.remove();
    } else{
        $tip.removeClass('loading')
            .css({
                width: tip.width || ''
                , height: tip.height || ''
            })
            .find('.kvTipContent')
            .html(content)
            .end()
            .position(opts.position);
    }
}

function fitsInViewport($tip) {
    var $win = $(window)
        , $doc = $(document)
        , tipTop = $tip.offset().top
        , tipLeft = $tip.offset().left
        , viewportTop = $doc.scrollTop()
        , viewportLeft = $doc.scrollLeft();

    return !( tipTop < viewportTop || tipLeft < viewportLeft || tipTop + $tip.innerHeight() > viewportTop + $win.height() || tipLeft + $tip.innerWidth() > viewportLeft + $win.width() );
}

function isset(v) {
    return typeof v != 'undefined';
}