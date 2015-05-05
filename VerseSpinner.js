define([
	"dojo/_base/declare",
	'dojo/_base/lang',
	"dojo/data/ItemFileReadStore",
	"dojo/debounce",
	"dojo/dom-construct",
	"dojo/on",
	"dojo/topic",
	"dijit/form/FilteringSelect",
	"dijit/form/NumberSpinner",
	"dijit/_TemplatedMixin",
	"dijit/_Widget"
], function(declare, lang, ItemFileReadStore, debounce, domConstruct, on, topic,
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
			selectOnClick: true,
			highlightMatch: 'all',
			ignoreCase: true,
			queryExpr: '*${0}*',
			searchDelay: 0
		});
		this.chapter = new alerque.ReferenceNumberSpinner({
			placeHolder: "Chapter",
			constraints: {min:1, max:1},
			style: 'width: 3.5em;'
		});
		this.verse = new alerque.ReferenceNumberSpinner({
			placeHolder: "Verse",
			constraints: {min:1, max:1},
			style: 'width: 3em;'
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
		topic.subscribe('scrollToReference', lang.hitch(this, '_scrollToReference'));
	},

	getReferenceString: function() {
		return this.reference.book + "_" + this.reference.chapter + "_" + this.reference.verse;
	},

	parseReferenceString: function(string) {
		var m = string.split(/_/);
		return {
			book: m[0],
			chapter: m[1],
			verse: m[2]
		};
	},

	_scrollToReference: function(verseref) {
		this.setReference(this.parseReferenceString(verseref));
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
		topic.publish('scrollToReference', this.getReferenceString(), null);
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
		topic.publish('navigateToReference', this.getReferenceString(), force_load);
	},

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
