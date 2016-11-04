define([
	"dojo/_base/declare",
	'dojo/_base/lang',
	"dojo/debounce",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/topic",
	"dijit/form/FilteringSelect",
	"dijit/form/NumberSpinner",
	"dijit/_TemplatedMixin",
	"dijit/_Widget"
], function(declare, lang, debounce, dom, domConstruct, on, topic,
			FilteringSelect, NumberSpinner, _TemplatedMixin, _Widget){

var ReferenceNumberSpinner = declare("alerque.ReferenceNumberSpinner", [NumberSpinner], {

	selectOnClick: true,
	intermediateChanges: true,
	constraints: {
		min: 1,
		max: 1,
		fractional: false
	},
	required: true,

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
	store: null,
	reference : null,

	widgetsInTemplate: true,
	_target: false,
	_targetChapter: 1,
	_targetVerse: 1,
	_focused: false,
	scrollTopic: 'scrollToReference',
	navigateTopic: 'navigateToReference',

	templateString: '<div class="dijitInline" id="${id}" ' +
		'data-dojo-attach-point="wrapper"></div>',

	postCreate: function() {
		this.book = new FilteringSelect({
			placeHolder: "Book",
			store: this.store,
			style: 'width: 12em',
			searchAttr: "name",
			autoComplete: false,
			selectOnClick: true,
			highlightMatch: 'all',
			ignoreCase: true,
			queryExpr: '*${0}*',
			searchDelay: 0
		});
		this.chapter = new alerque.ReferenceNumberSpinner({
			placeHolder: "Ch.",
			style: 'width: 3.5em;'
		});
		this.verse = new alerque.ReferenceNumberSpinner({
			placeHolder: "Ve.",
			style: 'width: 3em;'
		});
		on(this.book, 'blur', lang.hitch(this, this._useFirstSuggestion));
		on(this.book, 'change', lang.hitch(this, this.changeBook));
		on(this.chapter, 'change', lang.hitch(this, this.changeChapter));
		on(this.verse, 'change', lang.hitch(this, this.changeVerse));

		on(this.book, 'blur', lang.hitch(this, this._blur));
		on(this.book, 'focus', lang.hitch(this, this._focus));
		on(this.chapter, 'blur', lang.hitch(this, this._blur));
		on(this.chapter, 'focus', lang.hitch(this, this._focus));
		on(this.verse, 'blur', lang.hitch(this, this._blur));
		on(this.verse, 'focus', lang.hitch(this, this._focus));

		this.book.placeAt(this.wrapper);
		this.chapter.placeAt(this.wrapper);
		this.verse.placeAt(this.wrapper);
		if (this.reference) {
			this.setReference(this.reference);
		}
		topic.subscribe(this.scrollTopic, lang.hitch(this, '_scrollToReference'));
	},

	_blur: function() {
		this._focused = false;
	},

	_focus: function() {
		this._focused = true;
	},

	_useFirstSuggestion: function() {
		if (this.book.get('value').length === 0) {
			var firstItem = dom.byId(this.book.id + "_popup0");
			if (firstItem) {
				on.emit(firstItem, "click", {bubbles: true, cancelable: true});
			}
		}
	},

	getReference: function() {
		return this.book.get('value') + "." + this.chapter.get('value') + "." + this.verse.get('value');
	},

	parseReferenceString: function(string) {
		var m = string.split('.');
		return {
			book: m[0],
			chapter: m[1],
			verse: m[2]
		};
	},

	_scrollToReference: function(reference) {
		if (this._focused) { return; }
		this.setReference(reference);
	},

	changeBook: function() {
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
		// This won't work until after the book selector has been set and
		// unless there is a valid in range value
		if (this.book.item === null || this.chapter.state !== "" || isNaN(this.chapter.get('value'))) {
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
		// This won't work until after the book selector has been set and
		// unless there is a valid in range value
		if (this.book.item === null || this.verse.state !== "" || isNaN(this.verse.get('value'))) {
			return;
		}
		topic.publish(this.scrollTopic, this.getReference(), null);
	},

	navigateToReference: function(force_load) {
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
		topic.publish(this.navigateTopic, this.getReference(), force_load);
	},

	// Set the spinner to a current scroll location w/out triggering navigation
	setReference: function(reference) {
		reference = reference.split('.');
		this._targetChapter = reference[1];
		this._targetVerse = reference[2];
		if (this.book.get('value') != reference[0]) {
			this._target = true;
			this.book.set('value', reference[0]);
		} else {
			if (this.chapter.get('value') != reference[1]) {
				this._target = true;
				this.chapter.set('value', reference[1]);
			} else {
				if (this.verse.get('value') != reference[2]) {
					this._target = true;
					this.verse.set('value', reference[2]);
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
