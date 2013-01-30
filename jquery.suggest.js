/*
 * jQuery Suggest - v1.0
 * http://github.com/kemar/jquery.suggest
 * Licensed MIT
 */

(function ($, window, document, undefined) {

    "use strict";

    /*
     * .suggest()
     * 
     * Description:
     *    Cross browser and Mobile Safari compliant suggest jQuery plugin to find and select from a pre-populated list
     *    of suggestions with a careful management of events and full keyboard access.
     *    A.k.a. typeahead, a.k.a. autocomplete.
     * 
     * Usage:
     *    $(element).suggest()
     *    $(element) is a valid <input type="text"> HTML tag.
     * 
     * Options:
     *    Options can be passed via data attributes or JavaScript. Data attributes have a higher precedence.
     *    Default options:
     *        auto_focus: bool, if set to true the first suggestion will automatically be focused.
     *        limit: int, the maximum number of results to display.
     *        min_query_length: int, the minimum character length needed before a search is performed.
     *        source: array, array of objects with label/value properties or function, the data source to query against.
     *        suggestions_menu_markup: str, the full HTML markup of the suggestions menu.
     *        suggestions_menu_width: str, the CSS width of the suggestions menu.
     *        suggestion_markup: str, the full HTML markup of a suggestion.
     *        throbber_markup: str, the full HTML markup of a throbber.
     *    Overridable functions:
     *        source(query, limit)
     *        alterQuery(query)
     *        matcher(candidate, query)
     *        suggest(results)
     *        onSuggestionSelected(event)
     * 
     * Literature, resources and inspiration:
     *    Autocomplete design pattern:
     *        http://ui-patterns.com/patterns/Autocomplete
     *    Other jQuery plugins:
     *        http://api.jqueryui.com/autocomplete/
     *        http://twitter.github.com/bootstrap/javascript.html#typeahead
     *        http://yuilibrary.com/yui/docs/autocomplete/
     *        http://polarblau.github.com/suggest/
     *    Pure CSS throbber:
     *        http://dribbble.com/shots/631496-Spinspinspin-CSS
     *        http://codepen.io/louisbullock/pen/pJmGa/
     *    jQuery plugin syntax:
     *        https://github.com/zenorocha/jquery-plugin-patterns
     *        http://goo.gl/TSvDQ
     * 
     * Example of generated HTML markup:
     *    <input type="text" autocomplete="off">
     *    <div class="throbber"></div>
     *    <ul class="suggest">
     *        <li class="active">
     *            <a href="#">Result 1</a>
     *        </li>
     *        <li>
     *            <a href="#">Result 2</a>
     *        </li>
     *        <li>
     *            <a href="#">Result 3</a>
     *        </li>
     *        <li>
     *            <a href="#">Result 4</a>
     *        </li>
     *    </ul>
    */

    var pluginName = 'suggest';

    var defaults = {
          auto_focus:               false
        , limit:                    8
        , min_query_length:         1
        , source:                   []
        , suggestions_menu_markup:  '<ul class="suggest"></ul>'
        , suggestions_menu_width:   ''
        , suggestion_markup:        '<li><a href="#"></a></li>'
        , throbber_markup:          '<div class="throbber"></div>'
    };

    function Suggest(element, options) {
        this.input = $(element);
        this._defaults = defaults;
        this._name = pluginName;
        this.options = $.extend({}, defaults, options);
        // Options can be passed via data attributes.
        this.options = $.extend({}, this.options, this.input.data());
        // Overridable functions.
        this.alterQuery = this.options.alterQuery || this.alterQuery;
        this.matcher = this.options.matcher || this.matcher;
        this.suggest = this.options.suggest || this.suggest;
        this.onSuggestionSelected = this.options.onSuggestionSelected || this.onSuggestionSelected;
        // Init.
        this.init();
    }

    Suggest.prototype = {

        init: function () {
            this.input.attr('autocomplete', 'off');  // Turn off browser native autocompletion.
            this.input.bind('suggestion.selected', $.proxy(this.onSuggestionSelected, this));
            this.keys = {
                  DOWN:             40
                , ESC:              27
                , ENTER:            13
                , LEFT:             37
                , RIGHT:            39
                , SHIFT:            16
                , TAB:              9
                , UP:               38
                , CMD_FIREFOX:      224
                , CMD_OPERA:        17
                , CMD_WEBKIT_LEFT:  91
                , CMD_WEBKIT_RIGHT: 93
            };
            this.in_process = false;  // A flag used to determine if the plugin is currently performing an action.
            this.query = undefined;
            this.suggestions_menu = this.buildSuggestionsMenu();
            this.throbber = this.buildThrobber();
            this.setThrobberPosition();
            this.source = this.options.source;
            this.listen();
        }

        , buildSuggestionsMenu: function () {
            var suggestions_menu = $(this.options.suggestions_menu_markup);
            $('body').append(suggestions_menu);
            return suggestions_menu.hide();
        }

        , setSuggestionsMenuPosition: function () {
            var offset = this.input.offset();
            this.suggestions_menu
                .css({
                      position: 'absolute'
                    , width: this.options.suggestions_menu_width || this.input.innerWidth()
                    , top: offset.top + this.input.outerHeight()
                    , left: offset.left
                });
        }

        , buildThrobber: function () {
            // A graphic that animates to show the user that the program is performing an action.
            var throbber = $(this.options.throbber_markup);
            this.input.after(throbber);
            return throbber.hide();
        }

        , setThrobberPosition: function () {
            this.throbber
                .css({
                      position: 'absolute'
                    , top: this.input.offset().top + (this.input.innerHeight() / 2) - 2
                    , left: this.input.offset().left + this.input.innerWidth() - this.throbber.outerWidth() - 2
                });
        }

        , listen: function () {
            this.input
                .on('keyup',            $.proxy(this.keyup, this))
                .on('keypress keydown', $.proxy(this.keypress, this))
                .on('blur',             $.proxy(this.blur, this));
            this.suggestions_menu
                .on('click',                'li', $.proxy(this.click, this))
                .on('mouseenter mouseover', 'li', $.proxy(this.mouseenter, this))
                .on('mouseout mouseleave',  'li', $.proxy(this.mouseleave, this));
        }

        , blur: function (e) {
            var self = this;
            setTimeout(function () { self.end(); }, 200);
        }

        , keypress: function (e) {
            switch (e.keyCode) {
                case this.keys.ENTER:
                    // Prevent default form submission.
                    if (this.suggestions_menu.find('li.active').length) {
                        e.preventDefault();
                    }
                    break;
                case this.keys.DOWN:
                case this.keys.UP:
                    // Prevent cursor position change via up or down keys.
                    e.preventDefault();
                    break;
                case this.keys.TAB:
                    this.input.trigger('suggestion.selected');
                    break;
                default:
                    break;
            }
        }

        , keyup: function (e) {
            this.query = $.trim(this.input.val());
            if (this.in_process || this.query === '' || this.query.length < this.options.min_query_length) {
                return this.end();
            }
            switch (e.keyCode) {
                case this.keys.LEFT:
                case this.keys.RIGHT:
                case this.keys.SHIFT:
                case this.keys.TAB:
                case this.keys.CMD_FIREFOX:
                case this.keys.CMD_OPERA:
                case this.keys.CMD_WEBKIT_LEFT:
                case this.keys.CMD_WEBKIT_RIGHT:
                    break;
                case this.keys.ESC:
                    this.end();
                    break;
                case this.keys.DOWN:
                    this.next();
                    break;
                case this.keys.UP:
                    this.prev();
                    break;
                case this.keys.ENTER:
                    this.input.trigger('suggestion.selected');
                    break;
                default:
                    this.in_process = true;
                    this.setThrobberPosition();
                    this.throbber.show();
                    this.lookup(this.query);
            }
        }

        , click: function (e) {
            e.preventDefault();
            this.input.trigger('suggestion.selected').focus();
        }

        , mouseenter: function (e) {
            this.suggestions_menu.find('li').removeClass('active');
            $(e.currentTarget).addClass('active');
        }

        , mouseleave: function (e) {
            this.suggestions_menu.find('li').removeClass('active');
        }

        , next: function () {
            var active_item = this.suggestions_menu.find('li.active');
            this.suggestions_menu.find('li').removeClass('active');
            if (active_item.next().length) {
                active_item.next().addClass('active');
            } else {
                this.suggestions_menu.find('li').first().addClass('active');
            }
        }

        , prev: function () {
            var active_item = this.suggestions_menu.find('li.active');
            this.suggestions_menu.find('li').removeClass('active');
            if (active_item.prev().length) {
                active_item.prev().addClass('active');
            } else {
                this.suggestions_menu.find('li').last().addClass('active');
            }
        }

        , onSuggestionSelected: function (e) {
            var active_item = this.suggestions_menu.find('li.active');
            if (active_item.length) {
                if (active_item.data('value')) {
                    this.input.val(active_item.data('value'));
                } else {
                    this.input.val($.trim(active_item.find('a').text()));
                }
                this.end();
            }
        }

        , end: function () {
            if (this.suggestions_menu.is(':visible')) {
                this.suggestions_menu.hide().find('li.active').removeClass('active');
            }
        }

        , lookup: function (query) {
            this.query = this.alterQuery(query);
            if ($.isFunction(this.source)) {
                this.source(this.query, this.options.limit);
            } else {
                var self = this, results = [];
                if ($.isPlainObject(this.source[0])) {
                    results = $.grep(self.source, function (n, i) {
                        return self.matcher(n.label, self.query);
                    });
                } else {
                    results = $.grep(self.source, function (n, i) {
                        return self.matcher(n, self.query);
                    });
                }
                results = results.slice(0, this.options.limit);
                this.suggest(results);
            }
        }

        , alterQuery: function (query) {
            // Override this function if you need to modify the user query before a search is performed.
            return query;
        }

        , matcher: function (candidate, query) {
            // Determine if a query matches a candidate. Case insensitive starts with by default.
            return candidate.toLowerCase().indexOf(query.toLowerCase()) === 0;
        }

        , suggest: function (results) {
            var self = this;
            var html = $.map(results, function (result, index) {
                var i = $(self.options.suggestion_markup);
                if ($.isPlainObject(results[0])) {
                    i.data('value', result.value).find('a').html(result.label);
                } else {
                    i.find('a').html(result);
                }
                return i[0];
            });
            if (html.length) {
                this.setSuggestionsMenuPosition();
                this.suggestions_menu.html(html).show();
                if (self.options.auto_focus) {
                    self.next();
                }
            }
            this.in_process = false;
            this.throbber.hide();
        }

    };

    $.fn[pluginName] = function (options) {
        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName, new Suggest(this, options));
                }
            });
        }
    };

    $.fn[pluginName].Constructor = Suggest;

})(window.jQuery, window, document);
