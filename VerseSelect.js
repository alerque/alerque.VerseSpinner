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
		valueChanged: function(newval) {
			// hook to be connected to later
		},
		newMax: function(val) {
			this.constraints.max = val;
			if (val < this.get('value')) {
				this.set('value', val);
			}
		},
		adjust: function(val, delta) {
			var newval = this.inherited(arguments);
			this.valueChanged(newval);
			return newval;
		},
		postCreate: function() {
			this.inherited(arguments);
		}
	});
	var VerseSelect = dojo.declare("incilinfo.VerseSelect", [dijit._Widget, dijit._TemplatedMixin], {
		widgetsInTemplate: true,

		templateString: '<div class="dijitInline" id="${id}" data-dojo-attach-point="wrapper"></div>',

		postCreate: function() {
			var store = new dojo.data.ItemFileReadStore({url: this.storeUrl});
			var kitap = new dijit.form.FilteringSelect({placeHolder: "Kitap", store: store, searchAttr: "name", style: 'width: 10em'});
			var bolum = new incilinfo.RakamSpinner({placeHolder: "Bölüm", constraints: {min:1, max:1}, style: 'width: 5.5em;'});
			var ayet = new incilinfo.RakamSpinner({placeHolder: "Ayet", constraints: {min:1, max:100}, style: 'width: 4.5em;'});
			dojo.connect(kitap, 'onChange', function() {
					bolum.newMax(kitap.item.chapters);
					ayet.set('value', 1);
					bolum.set('value', 1);
					console.log("kitap: ", kitap.value);
				});
			dojo.connect(bolum, 'onChange', function(value) {
					bolum.valueChanged(value);
				});
			dojo.connect(bolum, 'valueChanged', function(value) {
					console.log("bolum: ", value, kitap.item.ayetler[value]);
					ayet.newMax(kitap.item.ayetler[value]);
				});
			kitap.placeAt(this.wrapper);
			bolum.placeAt(this.wrapper);
			ayet.placeAt(this.wrapper);
		}
	}); 

	return VerseSelect;
});
