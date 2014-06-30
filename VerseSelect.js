define([
	"dojo",
	"dijit",
	"dojo/_base/declare",
	"dojo/data/ItemFileReadStore",
	"dijit/_TemplatedMixin",
	"dijit/_Widget",
	"dijit/form/FilteringSelect",
	"dijit/form/NumberSpinner"
], function(dojo, dijit){
	var RakamSpinner = dojo.declare("incilinfo.RakamSpinner", [dijit.form.NumberSpinner], {
		selectOnClick: true,
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
			var ret =  this.inherited(arguments);
      this.onChange();
      return ret;
		},
		postCreate: function() {
			this.inherited(arguments);
		}
	});
	var VerseSelect = dojo.declare("incilinfo.VerseSelect", [dijit._Widget, dijit._TemplatedMixin], {
		widgetsInTemplate: true,

		templateString: '<div class="dijitInline" id="${id}" data-dojo-attach-point="wrapper"></div>',

		postCreate: function() {
      var store = new dojo.data.ItemFileReadStore({
        url: this.storeUrl
      });
      var kitap = new dijit.form.FilteringSelect({
        placeHolder: "Kitap",
        store: store,
        style: 'width: 12em',
        searchAttr: "name",
        autocomplete: false,
        highlightMatch: 'first',
        ignoreCase: true,
        queryExpr: '*${0}*',
        searchDelay: 500
      });
      var bolum = new incilinfo.RakamSpinner({
        placeHolder: "Bölüm",
        constraints: {min:1, max:1},
        style: 'width: 4em;'
      });
      var ayet = new incilinfo.RakamSpinner({
        placeHolder: "Ayet",
        constraints: {min:1, max:1},
        style: 'width: 4em;'
      });
			dojo.connect(kitap, 'onChange', function() {
          // Set chapter spinner max value to number of chapters in book
          bolum.newMax(kitap.item.chapters);
          // Rewind to chapter one on book change
          bolum.set('value', 1);
          bolum.onChange();
				});
			dojo.connect(bolum, 'onChange', function() {
          // Set verse spinner max value to number of verses in chapter
          ayet.newMax(kitap.item.ayetler[this.value]);
          // Rewind to verse one on chapter change
          ayet.set('value', 1);
          ayet.onChange();
				});
			dojo.connect(ayet, 'onChange', function() {
				});
			kitap.placeAt(this.wrapper);
			bolum.placeAt(this.wrapper);
			ayet.placeAt(this.wrapper);
      this.kitap = kitap;
      this.bolum = bolum;
      this.ayet = ayet;
		},

    setLocation: function(val) {
      this.kitap.set('value', val.kitap);
      this.bolum.set('value', val.bolum);
      this.ayet.set('value', val.ayet);
    }
	});

	return VerseSelect;
});
