

/*
@todo - these tests need to be rewritten into buster-js format

var $el, $tip, elTitle, myString;

module('No args');

test('Basics', function(){
	$el = $('#noArgs').kvTip();
	elTitle = $el.attr('title');

	$el.trigger('mouseenter');

	$tip = $('#' + $el.data('kvTip')['tipID']);

	ok( $tip.length === 1, 'The tooltip loaded');
	equal( $tip.find('.kvTipContent').text(), elTitle, 'The tooltip content matches the target element title attribute');

	$el.trigger('mouseleave').remove();
});

test('Handling when no "title" attribute is available', function(){
	$el = $('#noArgsNoTitle').kvTip().trigger('mouseenter');
	$tip = $('#' + $el.data('kvTip')['tipID']);

	ok( $tip.length === 0, 'The tooltip never loaded' );

	$el.trigger('mouseleave').remove();
});

module('String passed as argument');

test('Basics', function(){
	myString = 'This is the string argument';

	$el = $('#stringArg').kvTip(myString).trigger('mouseenter');
	$tip = $('#' + $el.data('kvTip')['tipID']);

	ok( $tip.length === 1, 'The tooltip loaded');
	equal( $tip.find('.kvTipContent').text(), myString, 'The tooltip content matches the string argument');
});

test('When the string argument is an empty string', function(){
	myString = 'This is the string argument';
	
	$el = $('#emptyStringArg').kvTip().trigger('mouseenter');
	$tip = $('#' + $el.data('kvTip')['tipID']);

	ok( $tip.length === 0, 'The tooltip never loaded' );

	$el.trigger('mouseleave').remove();
});
*/
