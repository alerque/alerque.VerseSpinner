define([
	"dojo/_base/declare",
	'dojo/_base/lang',
	"dojo/data/ItemFileReadStore",
	"dojo/debounce",
	"dojo/dom-construct",
	"dojo/on",
	"dijit/form/FilteringSelect",
	"dijit/form/NumberSpinner",
	"dijit/_TemplatedMixin",
	"dijit/_Widget"
], function(declare, lang, ItemFileReadStore, debounce, domConstruct, on,
			FilteringSelect, NumberSpinner, _TemplatedMixin, _Widget){

var ReferenceNumberSpinner = declare("alerque.ReferenceNumberSpinner", [NumberSpinner], {

	selectOnClick: true,
	intermediateChanges: true,

	newMax: function(val) {
		this.constraints.max = val;
		if (val < this.get('value')) {
			this.set('value', val);
		}
	},

	// Override scroll function to force increment
	// http://stackoverflow.com/q/24489968/313192
	adjust: function(val, delta) {
		delta = delta > 0 ? 1 : -1;
		return this.inherited(arguments);
	}

});

return declare("alerque.VerseSpinner", [_Widget, _TemplatedMixin], {

	// Expect at least these parameters to be set
	storeUrl: null,
	referenceNavigateCallback: function(reference){
		console.log("Need a callback function to navigate to", reference);
	},
	verseNavigateCallback: function(reference) {
		return this.referenceNavigateCallback(reference);
	},
	reference : null,

	widgetsInTemplate: true,
	_target: false,
	_targetChapter: 1,
	_targetVerse: 1,

	templateString: '<div class="dijitInline" id="${id}" ' +
		'data-dojo-attach-point="wrapper"></div>',

	postCreate: function() {
		this.store = new ItemFileReadStore({
			url: this.storeUrl
		});
		this.book = new FilteringSelect({
			placeHolder: "Book",
			store: this.store,
			style: 'width: 12em',
			searchAttr: "name",
			autoComplete: false,
			highlightMatch: 'first',
			ignoreCase: true,
			queryExpr: '*${0}*',
			searchDelay: 0
		});
		this.chapter = new alerque.ReferenceNumberSpinner({
			placeHolder: "Chapter",
			constraints: {min:1, max:1},
			style: 'width: 4em;'
		});
		this.verse = new alerque.ReferenceNumberSpinner({
			placeHolder: "Verse",
			constraints: {min:1, max:1},
			style: 'width: 4em;'
		});
		on(this.book, 'change', lang.hitch(this, this.changeBook));
		on(this.chapter, 'change', lang.hitch(this, this.changeChapter));
		on(this.verse, 'change', lang.hitch(this, this.changeVerse));
		this.book.placeAt(this.wrapper);
		this.chapter.placeAt(this.wrapper);
		this.verse.placeAt(this.wrapper);
		if (this.reference) {
			this.setReference(this.reference);
		}
	},

	changeBook: function() {
		this.reference.book = this.book.get("value");
		// Set chapter spinner max value to number of chapters in book
		this.chapter.newMax(this.book.item.chapters);
		var prev = this.chapter.get('value');
		// Rewind to chapter one on book change
		this.chapter.set('value', this._targetChapter);
		// Trigger a chapter reload on book change even if the chapter number
		// didn't change (as in moving from chapter 1 » 1 of different books)
		if (prev == this._targetChapter) {
			this.chapter.onChange();
		}
	},

	changeChapter: function() {
		this.reference.chapter = this.chapter.get("value");
		// This won't work until after the book selector has been set
		if (this.book.item === null) {
		return;
		}
		// Set verse spinner max value to number of verses in chapter
		this.verse.newMax(this.book.item.verses[this.chapter.get('value')]);
		var prev = this.verse.get('value');
		// Rewind to verse one on chapter change
		this.verse.set('value', this._targetVerse);
		// Trigger a verse reload on chapter change even if the chapter number
		// didn't change (as in moving from verse 1 » 1 of different chapters)
		if (prev == this._targetVerse) {
			this.verse.onChange();
		}
		this.navigateToReference();
	},

	changeVerse: function() {
		this.reference.verse = this.verse.get("value");
		this.scrollToVerse();
	},

	navigateToReference: function() {
		// Don't actually navigate if we were given a spinner target value
		if (this._target) {
			this._targetChapter = 1;
			this._targetVerse = 1;
			this._target = false;
			return;
		}
		var book = this.book.get('value');
		var book_name = this.book.get('displayedValue');
		var chapter = this.chapter.get('value');
		var verse = this.verse.get('value');
		this._navigateToReference();
	},
	// This is so mouse scrolls etc don't trigger rapid fire network requests
	_navigateToReference: debounce(function(node) {
		this.referenceNavigateCallback(this.reference);
	}, 200),

	scrollToVerse: function() {
		this._scrollToVerse();
	},

	_scrollToVerse: debounce(function() {
		this.verseNavigateCallback(this.reference);
	}, 200),

	// Set the spinner to a current scroll location w/out triggering navigation
	setReference: function(val) {
		this._targetChapter = val.chapter;
		this._targetVerse = val.verse;
		if (this.book.get('value') != val.book) {
			this._target = true;
			this.book.set('value', val.book);
		} else {
			if (this.chapter.get('value') != val.chapter) {
				this._target = true;
				this.chapter.set('value', val.chapter);
			} else {
				if (this.verse.get('value') != val.verse) {
					this._target = true;
					this.verse.set('value', val.verse);
				} else {
					this._target = false;
					this._targetChapter = 1;
					this._targetVerse = 1;
				}
			}
		}
	}

});
});
// vim: ts=4 sw=4 noet tw=0
