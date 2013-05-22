@TODOs before making public:

- add some basic unit testing
- integrate with travis
- add ability to set position
- make hoverIntent dependency optional


While there are many tooltip libraries out there, not one fit the description of what we need for Kiva.org.  So, after nearly 6 months of tooltip-less Chai, it was time we created our own.

# Features
* 3.4K minfied, 1.32K minified + gzip
* Repositions to make sure the tooltip does not bleed out of the viewport
* Allow for quick hovering over target elements without immediately triggering the tooltip
* The show / hide delay is customizable
* No images required
* Ajax support
* Fall back content should the Ajax request fail
* Dynamic sizing...even on ajax requests!
* Dynamic sizing can be overridden 
* Tooltip ajax and position Interface are a direct mappings to jQuery's ajax and position interface
**	This means we can pass ajax parameters to the tooltips plugin just as if we were passing them to an ajax request ( including google analytics )
* Uses built in caching for re-displaying tooltips that have already been called ( this can be disabled )
* Offers onLoad, onShow, and onHide callbacks
* Ability to add custom styling to one tooltip, or many at a time
* Ability to override default settings on a global or local basis
* Ability to use any dom element as content for the tooltip 

AND...
* Includes it's very own testing suite

# Interface
```
// Will use the elements title attribute as the content for the tooltip, if it exists
$('mySelector').kvTip();

// Will use the string as the content for the tooltip
$('mySelector').kvTip('This is the tooltip content'); 

// Below is a list of available settings for kvTip
$('mySelector').kvTip({
	title:			// HTML String, most of the time, one will probably add the title within the content, however, there may be times where you want to pass it in directly
	, content:		// String, use this to pass content to the tooltip, can also be used as alternate text should the ajax call fail
	, selector:		// String, use this to select content already on the page as the content for the tooltip
	, ajax:			// Object, this maps directly to jQuery's $.ajax method ( http://api.jquery.com/jQuery.ajax/ ), so pass it whatever you pass $.ajax
	, className:	// String, use this to customize the look of your tooltip
	, position:		// Object, this maps directly to jQuery UI's Position plugin ( http://jqueryui.com/demos/position/ ), pass it whatever you pass $.ajax 
	, size:			// Object, pass it width & height
	, show:			// Show settings, for now, only used to disable "onhover" display of tooltips by requiring a click
	, hide:			// HIde settings, for now, only used to shorten / extend the amount of delay before hiding a tooltip
	, onload:		// Callback when the content is loaded
	, onshow:		// Callback when the tooltip is displayed
	, onhide:		// Callback when the tooltip is hidden
});
```

# The original scope of Kiva's tooltip jQuery plugin
kvTip was originally developed as a inovation iteration project during iteration 8-23-2011.  Below is some of the initial thinking about what the plugin should be capable of doing.

## Requirements:
* Lightweight ( < 5k compressed ? 
* Automatically position tooltips such that they always display WITHIN the viewport
* Use jQuery UI position plugin ( we already load it )
* Slight delay ( adjustable ) before displaying tooltip on hover
* Use hoverIntent plugin ( we already load it)
* No images! 
* Ajax support
* be sure to resize the tooltip after the ajax has loaded
* by default, track all ajax requests

## Desired Options:
* Allow for caching of ajax content ( Would this be desireable?  Maybe have an option to enable/disable caching ?
* Allow passing of supplemental parameters on ajax requests  
* Create a unique id attribute for each tooltip
* Adjust width/height via kvTip call
* Have an option whereby an tooltip stays open so long as either the original hovered element or the tooltip is hovered over and thus allowing the tooltip to have a clickable link

## Things kvTips will NOT do:
* Will not resize on window resize
* The tooltip will be show when the selected element is either hovered over or clicked, no other options, it will only fadein and fadeout
* The tooltip will aways close/fadeout onhoverout
* There will only be one tooltip at a time ( when one fades in all others fade out )