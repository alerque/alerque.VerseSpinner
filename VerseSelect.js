define([
	"dojo",
	"dijit",
	"dojo/debounce",
	"dojo/_base/declare",
	"dojo/data/ItemFileReadStore",
	"dijit/_TemplatedMixin",
	"dijit/_Widget",
	"dijit/form/FilteringSelect",
	"dijit/form/NumberSpinner"
], function(dojo, dijit, debounce){
	var RakamSpinner = dojo.declare(
    "incilinfo.RakamSpinner",
    [dijit.form.NumberSpinner],
    {

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
        var ret =  this.inherited(arguments);
        return ret;
      },

      postCreate: function() {
        this.inherited(arguments);
      }
    }
  );
	var VerseSelect = dojo.declare(
    "incilinfo.VerseSelect",
    [dijit._Widget, dijit._TemplatedMixin],
    {

      widgetsInTemplate: true,
      live: true,

      templateString: '<div class="dijitInline" id="${id}" ' +
        'data-dojo-attach-point="wrapper"></div>',

      postCreate: function() {
        this.store = new dojo.data.ItemFileReadStore({
          url: this.storeUrl
        });
        this.kitap = new dijit.form.FilteringSelect({
          placeHolder: "Kitap",
          store: this.store,
          style: 'width: 12em',
          searchAttr: "name",
          autocomplete: false,
          highlightMatch: 'first',
          ignoreCase: true,
          queryExpr: '*${0}*',
          searchDelay: 500
        });
        this.bolum = new incilinfo.RakamSpinner({
          placeHolder: "Bölüm",
          constraints: {min:1, max:1},
          style: 'width: 4em;'
        });
        this.ayet = new incilinfo.RakamSpinner({
          placeHolder: "Ayet",
          constraints: {min:1, max:1},
          style: 'width: 4em;'
        });
        dojo.connect(this.kitap, 'onChange', this, 'changeKitap');
        dojo.connect(this.bolum, 'onChange', this, 'changeBolum');
        dojo.connect(this.ayet, 'onChange', this, 'changeAyet');
        this.kitap.placeAt(this.wrapper);
        this.bolum.placeAt(this.wrapper);
        this.ayet.placeAt(this.wrapper);
      },

      changeKitap: function() {
        // Set chapter spinner max value to number of chapters in book
        this.bolum.newMax(this.kitap.item.chapters);
        // Rewind to chapter one on book change
        this.bolum.set('value', 1);
        this.bolum.onChange();
      },

      changeBolum: function() {
        // This won't work until after the book selector has been set
        if (this.kitap.item == null) return;
        // Set verse spinner max value to number of verses in chapter
        this.ayet.newMax(this.kitap.item.ayetler[this.bolum.get('value')]);
        // Rewind to verse one on chapter change
        this.ayet.set('value', 1);
        //this.ayet.onChange();
        this.navigate();
      },

      changeAyet: function() {
      },

      navigate: function() {
        if (!this.live) return;
        var kitap = this.kitap.get('value');
        var bolum = this.bolum.get('value');
        var node = dojo.create("a", {
            href: "/kitap/" + kitap + "/" + bolum
          });
        this._navigate(node);
      },

      // This is so mouse scrolls etc don't trigger rapid fire network requests
      _navigate: debounce(function(node) {
        incilsayfa(node);
      }, 500),

      // Set the spinner to a current scroll location (without triggering
      // navigation)
      setLocation: function(val) {
        this.live = false;
        this.kitap.set('value', val.kitap);
        this.bolum.set('value', val.bolum);
        this.ayet.set('value', val.ayet);
        this.live = true;
      }
    }
  );

	return VerseSelect;
});
