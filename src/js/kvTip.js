var count = 0   // counts the number of tooltips


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

    var className = KvTip.defaults.className;
    var options = $.extend(true, {}, KvTip.defaults, args);
    options.className += ' ' + className;

    // Iterate thru each tooltip
    return this.each(function() {
        new KvTip($(this), options);
    });

};


function KvTip ($el, options) {

    var opts = $.extend(this, options)	// individual tooltip options

    this._timer = '';
    this._id = count++;
    this.$el = $el;
    this.width = opts.width || '';
    this.height = opts.height || '';
    this.options = opts;

    // Prevent default click event on link elements
    if($el[0].nodeName.toLowerCase() == 'a' && opts.preventDefault ){
        $el.click(function (e) {
            e.preventDefault();
        });
    }

    this.initBindings();

    // Store a reference in the target elemens data object that references its associated tooltip ( helps with unit testing )
    $el.data('kvTip', {tipID: this.id()});
}


KvTip.prototype = {


    showTip: function () {
        var $tip = this.$tip
        , opts = this.options;

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


    , hideOnTimeout: function () {
        var $tip = this.$tip
        , tip = this
        , opts = this.options;

        if(!isset($tip) || !$tip.length){
            return;
        }

        // Set a timer, allows time to hover from target element to tooltip and back
        this._timer = setTimeout(function() {
            tip.hide();
        }, opts.hideDelay);

    }


    , hide: function () {
        var $el = this.$el;
        var tip = this;
        var $tip = this.$tip;
        var opts = this.options;

        // Add the html title attribute back to the target element
        $el.attr('title', tip.elTitle || '' );

        // Hide the tooltip
        $tip.fadeOut('fast', 'linear', function() {
            if (typeof opts.onhide == 'function'){
                tip.onhide(this);
            }
        }).removeClass('active');

    }



    /**
     * Position's the tooltip in the appropriate place.
     *
     */
    , position: function () {
        var elPos = $.extend({}, $el.offset(), {
            width: $el[0].offsetWidth
            , height: $el[0].offsetHeight
        });

        var tipWidth = $tip[0].offsetWidth
        , tipHeight = $tip[0].offsetHeight;

        var css = {
            'z-index': zIndex + 1
            , top: elPos.top + elPos.height / 2 - tipHeight / 2
            , left: elPos.left + elPos.width
        };

        this.$tip.css(css);
    }


    , getTip: function () {
        var $el = this.$el;
        var tip  = this;
        var opts = this.options;


        var $tip = $('<div id="' + tip.id() + '" class="' + this.className + '" />')
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
                self._resetTimer();
            })
            .mouseleave(function(){
                self.hide();
            })
            .addClass('loading')
            .appendTo('body')
            .click(function() {
                self.hide();
            });

        this.$tip = $tip;
        return $tip;
    }


    , getContent: function (skip) {
        var $el =  this.$el
        , tip = this
        , opts = this.options
        , content = '';

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


    , addContent: function () {
        var $tip = this.$tip
        , tip = this
        , opts = this.options
        , content = this.content;

        var $tempTip;  // used for pre-determining the width / height of the tooltip

        // Resize and animate the tooltip if this was an ajax call
        if(opts.ajax){
            // Clone our tooltip, we will use the clone to determine our tooltips eventual size
            $tempTip = $tip.clone();

            // Prep the clone
            $tempTip.removeClass('loading')
                .attr('id', tip.id())
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




    , id: function () {
        return 'kvTip_' + this._id;
    }


    , _resetTimer: function () {
        clearTimeout(this._timer);		// Keep the tooltip open if it already exists
        delete(this._timer);
    }



    , initBindings: function () {
        var self = this;
        var $tip = this.$tip;
        var $el = this.$el;
        var opts = this.options;

        // Immediately create the tooltip upon hovering over the target element...just don't display it
        $el.mouseenter(function () {

            // Make sure the browser's default title-tooltip doesn't pop up, store the title's value so it can be replaced on mouseout
            self.elTitle = $el.attr('title');
            $el.attr('title', '');

            // Get a reference to the tooltip
            $tip = $('#' + self.id());

            // Disable browser cache if js cache is disabled
            if (self.ajax && self.cache === false) {
                self.cache = false;
            }

            // Make sure we have a tooltip
            // Does one already exist?  Even if it does, have we disabled caching?
            if (!$tip.length || (self.ajax && self.ajax.cache === false) || (self.cache === false)) {

                // If caching is off, remove the old tooltip
                if ((self.ajax && self.ajax.cache === false) || (self.cache === false)){
                    $tip.remove();
                }

                // Get the new tip
                $tip = self.getTip();

                // Get the content, taking async calls into account
                $.when(self.getContent())
                    .done(function(content) {
                        if (typeof self.onload == 'function') {
                            content = self.onload.call($tip, content);
                        }

                        if (content) {
                            self.content = content;
                            self.addContent();
                        } else {
                            $tip.remove();
                        }
                    })
                    .fail(function() {
                        // If the ajax request failed, run getContent again
                        // This time, however, skip the ajax request and get alternate content
                        var content = self.getContent(true);

                        if (content) {
                            self.content = content;
                            self.addContent();
                        } else {
                            $tip.remove();
                        }
                    });
            }
        });

        // Now that we have a tooltip, display it
        if (opts.showOnclick){
            // Otherwise, add the click event
            $el.click(function (event) {
                event.preventDefault();
                self.showTip();
            })
                .mouseenter(function () {
                    self._resetTimer();
                })
                .mouseleave(function () {
                    self.hide();
                });
        }
        else{

            // Attach hover event if onclick is disabled
            $el.hoverIntent(function () {
                    self._resetTimer()
                    self.showTip();
                }
                , function () {} // @todo, see note on mouseleave event
            )
                .mouseleave(function () {
                    // @todo, better integrate with hoverIntent, we should be able to use hoverIntent's "out" method instead of this event handler
                    // Currently, the reason for the extra event handler is to take the hover timeout into consideration
                    self.hide();
                });
        }

    }
}


KvTip.defaults = {
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
};



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