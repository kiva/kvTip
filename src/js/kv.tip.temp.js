var count = 0   // counts the number of tooltips
, timer = [];   // time to hover from target element to the tooltip, and back

/**
 * Tooltips
 *
 * @param args
 */
$.fn.kvTip = function (args) {

	if (!this.length ){
        return;
    }

	// If args is a string, treat it as HTML content
	if (typeof args == 'string') {
		args = {content:args};
	}

	// Iterate thru each tooltip
	return this.each(function(index, el) {
        var tip = new KvTip(el, $.extend(true, {}, args, kvTip.defaults));
    });
};



function KvTip ($el, options) {
    $el = $(el);

    // individual tooltip options
    var opts = $.extend({}, options);

    // Prevent default click event on link elements
    if (this.nodeName.toLowerCase() == 'a' && opts.preventDefault) {
        $el.click(function (event) {
            event.preventDefault();
        });
    }

    this._id = count++;
    this.elTitle = $el.attr('title');
    this.initBindings();
}


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
    , position: 'right'
    , width: null
    , height: null
    , showOnClick: false
    , hideOnClick: false
    , hideDelay: 300
};


kvTip.prototype = {

    show: function () {
        // Make sure the browser's default title-tooltip doesn't pop up, store the title's value so it can be replaced on mouseout
        this.$el.attr('title', '');


        // No need to show a tip that is already visible
        if ($tip.hasClass('active')) {
            return;
        }

        $tip.css({display: 'none', visibility: 'visible'})
            .addClass('active')
            .fadeIn(400, function () {
                if (typeof this.onshow == 'function') {
                    this.onshow.apply($tip);
                }
            });
    }


    , hideOnTimeout: function () {
        var self = this;

        // Set a timer, allows time to hover from target element to tooltip and back
        this._timer = setTimeout(function() {
            self.hide();
        }, this.hideDelay);
    }


    , hide: function () {
        var $tip = this.$tip;

        if(!$tip || !$tip.length){
            return;
        }

        // Add the html title attribute back to the target element
        this.$el.attr('title', this.elTitle || '' );

        // Hide the tooltip
        $tip.fadeOut('fast', 'linear', function() {
            if (typeof opts.onhide == 'function') {
                opts.onhide(this);
            }
        }).removeClass('active');
    }


    , id: function () {
        return 'kvTip_' + this._id;
    }



    /**
     *
     * @param {Boolean} skip
     * @returns {$.Deferred}
     */
    , getContent: function (skip) {
        var content = ''
        , deferred = new $.Deferred();

        if (this.ajax && !skip) {
            // Do we want to use an inline attribute as the value for our url?
            if (this.inlineUrl) {
                this.ajax.url = this.$el.attr(this.inlineUrl);
            }

            // Do we want to use an inline attribute as one of the values for our data?
            if (this.inlineData) {
                var tempData = {};
                tempData[this.inlineData] = this.$el.attr(this.inlineData);
                this.ajax.data = $.extend(this.ajax.data, tempData);
            }

            return deferred.promise($.ajax(this.ajax));
        }
        else if (this.selector) {
            content = $(this.selector).html();
        }
        else if (this.content) {
            // Content could be a string, or it could be a function that generates the "content"
            content = $.isFunction(this.content) ? this.content() : this.content;
        }
        else if (this.elTitle) {
            content = tip.elTitle;
        }

        return deferred.resolve(content).promise();
    }


    // Make sure the tooltip shows on top of its triggering element
    // Loop through every ancestor element and get the max z-index
    , getZIndex: function () {
        var zIndex = this.$el.css('z-index');

        this.$el.parentsUntil('html')
            .each(function () {
                var _zIndex = $(this).css('z-index');

                // We only need to update z-index if it is set to a numeric value (not "auto")
                if ($.isNumeric(_zIndex)) {
                    if (!$.isNumeric(zIndex) || (zIndex < _zIndex)) {
                        zIndex = _zIndex;
                    }
                }
            });

        return zIndex;
    }


    , positionTip: function () {
        $el.position({});
    }


    , _resetTimer: function () {
        clearTimeout(this._timer);
        delete(this._timer);
    }


    , handleTargetMouseEnter: function () {
        this._resetTimer();
        this.show();
    }


    // @todo, better integrate with hoverIntent, we should be able to use hoverIntent's "out" method instead of this event handler
    // Currently, the reason for the extra event handler is to take the hover timeout into consideration
    , handleTargetMouseLeave: function () {
        this.hideOnTimeout();
    }


    , handleTargetClick: function (event) {
        event.preventDefault();
        this.show();
    }


    , _initOnHoverHandlers: function () {
        // Use hoverIntent if it's loaded;
        if ($.fn.hoverIntent) {
            $el.hoverIntent($.proxy(this.handleTargetMouseEnter, this), function () {});
        } else {
            $el.mouseenter($.proxy(this.handleTargetMouseEnter, this));
        }

        $el.mouseleave(this.handleTargetMouseLeave);
    }


    , _initOnClickHandlers: function () {
        var self = this;

        $el.click($.proxy(this.handleTargetClick, this))
        .mouseenter(function () {
            self._resetTimer();
        })
        .mouseleave(function () {
            self.hideOnTimeout();
        });
    }



    , _initialize: function () {

        // Disable browser cache if js cache is disabled
        if (this.ajax && this.enableCaching === false) {
            this.enableCaching = false;
        }

        // Make sure we have a tooltip
        // Does one already exist?  Even if it does, have we disabled caching?
        if (!$tip.length || (this.ajax && this.ajax.cache === false) || (this.enableCaching === false)){
            this.initialize();
        }
    }


    , isCachingEnabled: function () {
        return (this.ajax && this.ajax.cache === false) || this.cache === false;
    }


    // Resize and animate the tooltip if this was an ajax call
    , setAsyncContent: function () {
        var $tempTip;  // used for pre-determining the width / height of the tooltip

        // Clone our tooltip, we will use the clone to determine our tooltips eventual size
        $tempTip = $tip.clone();

        // Prep the clone
        $tempTip.removeClass('loading')
            .attr('id','tempTip_' + tip.i)
            .css({width: tip.width || '', height: tip.height || '' })
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
    }


    , setSyncContent: function (content, $tip) {
        $tip = $tip || this.$tip;

        $tip.removeClass('loading')
            .css({
                width: this.width || ''
                , height: this.height || ''
            })
            .find('.kvTipContent')
            .html(content)
            .end();

        if ($tempTip) {
           $tip..position(this.position);
        }
    }



    , setContent: function (content) {
        if (content) {
            if(this.ajax){
                this.setAsyncContent(content);
            } else{
                this.setSyncContent(content);
            }
        } else {
            this.$tip.remove();
        }
    }


    , build: function () {
        var $tip = $('<div id="' + tip.id + '" class="' + opts.className + '">')
        , self = this;

        // Add an externally defined title if it exists
        if (this.title){
            $tip.html('<div class="kvTipTitle">' + this.title + '</div>');
        }

        // Build it
        $tip.css('z-index', this.getZIndex() + 1)
            .append('<div class="kvTipContent">')
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


    , preBuild: function () {
        var self = this;

        if (! this.isCachingEnabled()) {
            this.$tip.remove();
            this.$tip = this.build();

            this.positionTip();
        }

        this.getContent()
            .done(function (content) {
                self.setContent(content);
            })
            .fail(function () {
                // Run getContent again, this time, however, skip the ajax request and get alternate content
                self.getContent(true).done(function (content) {
                    self.setContent(content);
                });
            });
    }


    , initBindings: function () {
        // Immediately create the tooltip upon hovering over the target element...just don't display it
        this.$el.mouseenter(this.preBuild);

        if (this.showOnClick){
            this._initOnClickHandlers();
        } else{
            this._initOnHoverHandlers();
        }
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