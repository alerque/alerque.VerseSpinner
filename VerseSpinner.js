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

  var ReferenceNumberSpinner = declare(
    "alerque.ReferenceNumberSpinner",
    [NumberSpinner],
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

  return declare(
    "alerque.VerseSpinner",
    [_Widget, _TemplatedMixin],
    {

      widgetsInTemplate: true,
      _hedef: false,
      _hedefBolum: 1,
      _hedefAyet: 1,

      templateString: '<div class="dijitInline" id="${id}" ' +
        'data-dojo-attach-point="wrapper"></div>',

      postCreate: function() {
        this.store = new ItemFileReadStore({
          url: this.storeUrl
        });
        this.kitap = new FilteringSelect({
          placeHolder: "Kitap",
          store: this.store,
          style: 'width: 12em',
          searchAttr: "name",
          autoComplete: false,
          highlightMatch: 'first',
          ignoreCase: true,
          queryExpr: '*${0}*',
          searchDelay: 0
        });
        this.bolum = new alerque.ReferenceNumberSpinner({
          placeHolder: "Bölüm",
          constraints: {min:1, max:1},
          style: 'width: 4em;'
        });
        this.ayet = new alerque.ReferenceNumberSpinner({
          placeHolder: "Ayet",
          constraints: {min:1, max:1},
          style: 'width: 4em;'
        });
        on(this.kitap, 'change', lang.hitch(this, this.kitapDegistir));
        on(this.bolum, 'change', lang.hitch(this, this.bolumDegistir));
        on(this.ayet, 'change', lang.hitch(this, this.ayetDegistir));
        this.kitap.placeAt(this.wrapper);
        this.bolum.placeAt(this.wrapper);
        this.ayet.placeAt(this.wrapper);
      },

      kitapDegistir: function() {
        // Set chapter spinner max value to number of chapters in book
        this.bolum.newMax(this.kitap.item.chapters);
        var prev = this.bolum.get('value');
        // Rewind to chapter one on book change
        this.bolum.set('value', this._hedefBolum);
        // Trigger a chapter reload on book change even if the chapter number
        // didn't change (as in moving from chapter 1 » 1 of different books)
        if (prev == this._hedefBolum) {
          this.bolum.onChange();
        }
      },

      bolumDegistir: function() {
        // This won't work until after the book selector has been set
        if (this.kitap.item == null) return;
        // Set verse spinner max value to number of verses in chapter
        this.ayet.newMax(this.kitap.item.ayetler[this.bolum.get('value')]);
        var prev = this.ayet.get('value');
        // Rewind to verse one on chapter change
        this.ayet.set('value', this._hedefAyet);
        // Trigger a verse reload on chapter change even if the chapter number
        // didn't change (as in moving from verse 1 » 1 of different chapters)
        if (prev == this._hedefAyet) {
          this.ayet.onChange();
        }
        this.referansaSeyret();
      },

      ayetDegistir: function() {
        console.log("scoll to verse");
      },

      referansaSeyret: function() {
        // Don't actually navigate if we were given a spinner target value
        if (this._hedef) {
          this._hedefBolum = 1;
          this._hedefAyet = 1;
          this._hedef = false;
          return;
        }
        var kitap = this.kitap.get('value');
        var kitapAdi = this.kitap.get('displayedValue');
        var bolum = this.bolum.get('value');
        var ayet = this.ayet.get('value');
        var node = domConstruct.create("a", {
            href: "/kitap/" + kitap + "/" + bolum,
            onclick: "return incilsayfa(this);",
            title: kitapAdi + " " + bolum
          });
        this._referansaSeyret(node);
      },

      // This is so mouse scrolls etc don't trigger rapid fire network requests
      _referansaSeyret: debounce(function(node) {
        incilsayfa(node);
      }, 200),

      // Set the spinner to a current scroll location (without triggering
      // navigation)
      referansiBelirle: function(val) {
        this._hedefBolum = val.bolum;
        this._hedefAyet = val.ayet;
        if (this.kitap.get('value') != val.kitap) {
          this._hedef = true;
          this.kitap.set('value', val.kitap);
        } else {
          if (this.bolum.get('value') != val.bolum) {
            this._hedef = true;
            this.bolum.set('value', val.bolum);
          } else {
            if (this.ayet.get('value') != val.ayet) {
              this._hedef = true;
              this.ayet.set('value', val.ayet);
            } else {
              this._hedef = false;
              this._hedefBolum = 1;
              this._hedefAyet = 1;
            }
          }
        }
      }
    }
  );
});
