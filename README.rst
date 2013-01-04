`jQuery Suggest <http://github.com/kemar/jquery.suggest>`_
==========================================================

Simple, cross browser, easily extendable and Mobile Safari compliant `suggest jQuery plugin <http://kemar.github.com/jquery.suggest/>`_ (a.k.a. typeahead a.k.a. autocomplete) with a careful management of events and full keyboard access.


Installation
------------

Include this script after jQuery.

.. code-block::

    <script src='jquery.js'></script>
    <script src='jquery.suggest.js'></script>


Usage
-----

.. code-block::

    <input id="emails" name="emails" type="text">


Rock'n'roll
-----------

.. code-block:: javascript

    $('input#emails').suggest({ source: ['bob@bob.org', 'tom@tom.org', 'kat@kat.org', ...] });


Keyboard interaction
--------------------

When the suggestions menu is open, the following key commands are available:

- ``UP``: move focus to the previous suggestion.
- ``DOWN``: move focus to the next suggestion.
- ``ESCAPE``: close the suggestions menu.
- ``ENTER``: select the currently focused suggestion, close the suggestions menu, keep focus on the input.
- ``TAB``: select the currently focused suggestion, close the suggestions menu, move focus to the next focusable element.


Available options
-----------------

Options can be passed via data attributes or JavaScript. Data attributes have a higher precedence.

- ``limit`` (``int``): the maximum number of results to display (default: ``8``).
- ``min_query_length`` (``int``): the minimum character length needed before a search is performed (default: ``1``).
- ``source`` (``array``, ``array of objects with label/value properties`` or ``function``): the data source to query against (default: ``[]``).
- ``suggestions_menu_markup`` (``str``): the full HTML markup of the suggestions menu (default: ``<ul class="suggest"></ul>``).
- ``suggestions_menu_width`` (``str``): the CSS width of the suggestions menu (default: ``width`` of the related ``input``).
- ``suggestion_markup`` (``str``): the full HTML markup of a suggestion (default: ``<li><a href="#"></a></li>``).
- ``throbber_markup`` (``str``): the full HTML markup of a throbber (default: ``<div class="throbber"></div>``).


Source
------

The data source to query against, must be specified.


``Array``
~~~~~~~~~

An ``array`` can be used:

.. code-block:: javascript

    $('input').suggest({ source: [ 'Apple', 'Apricot', 'Avocado', ...] });


``Array`` of ``objects`` with ``label``/``value`` properties
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

An ``array`` of ``objects`` with ``label``/``value`` properties can be used. The ``label`` property is displayed in the suggestion menu and the ``value`` is inserted into the input element when a user selects a suggestion:

.. code-block:: javascript

    $('input').suggest({ source: [
            { 'value': 'AF', 'label': 'Afghanistan' },
            { 'value': 'AL', 'label': 'Albania' },
            ...
        ] });


``Function`` source(query, limit)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Connect any data source via the ``source function``:

.. code-block:: javascript

    $('input).suggest({
        source: function (query, limit) {
            var self = this;
            $.get(
                self.input.data('ajax-url'),
                {
                    'query': query,
                    'limit': limit
                },
                function (data) {
                    // Do somethig with the data.
                    self.suggest(data);
                }
            );
        }
    });


Throbber
--------

A throbber is a graphic that animates to show the user that the program is performing an action. You can use a `CSS3 animation <http://dribbble.com/shots/631496-Spinspinspin-CSS>`_ or an animated graphic if you need to support certain older browser versions.

.. code-block::

    .throbber {
        position: absolute;
        width: 5px;
        height: 5px;
        margin: 0 0 0 2px;
        padding: 0;
        border: 2px solid;
        border-top-color: transparent;
        border-left-color: transparent;
        border-radius: 50%;
        color: #397CE9;
        -webkit-animation: load 0.9s linear infinite;
        -moz-animation: load 0.9s linear infinite;
        -o-animation: load 0.9s linear infinite;
        animation: load 0.9s linear infinite;
    }
    @-webkit-keyframes load {
        100% { -webkit-transform: rotate(360deg); }
    }
    @-moz-keyframes load {
        100% { -moz-transform: rotate(360deg); }
    }
    @-o-keyframes load {
        100% { -o-transform: rotate(360deg); }
    }
    @keyframes load {
        100% { transform: rotate(360deg); }
    }


Overridable functions
---------------------

alterQuery(query)
~~~~~~~~~~~~~~~~~

Override this function if you need to modify the user query before a search is performed.

.. code-block:: javascript

    $('input').suggest({
        alterQuery: function (query) {
            var split_query = query.toLowerCase().split(':');
            if (split_query[0].length === 1) {
                split_query[0] = '0' + split_query[0];
            }
            return split_query.join(':');
        }
    });


matcher(candidate, query)
~~~~~~~~~~~~~~~~~~~~~~~~~

Determine if a query matches a candidate.


suggest(results)
~~~~~~~~~~~~~~~~

Display matching results to the user.


onSuggestionSelected(event)
~~~~~~~~~~~~~~~~~~~~~~~~~~~

The function called when a suggestion is selected by the user.


How to extend ``$.suggest()``
-----------------------------

.. code-block::

    (function ($, window, document, undefined) {

        "use strict";

        var pluginName = 'suggestExtended';

        function SuggestExtended(element, options) {
            $.fn.suggest.Constructor.call(this, element, options);
        }

        SuggestExtended.prototype = $.extend({}, $.fn.suggest.Constructor.prototype, {
            // Extend $.suggest() methods.
        });

        $.fn[pluginName] = function (options) {
            if (options === undefined || typeof options === 'object') {
                return this.each(function () {
                    if (!$.data(this, 'plugin_' + pluginName)) {
                        $.data(this, 'plugin_' + pluginName, new SuggestExtended(this, options));
                    }
                });
            }
        };

    })(window.jQuery, window, document);


Generated markup
----------------

.. code-block::

    <input type="text" autocomplete="off">
    <div class="throbber"></div>
    <ul class="suggest">
        <li class="active">
            <a href="#">Result 1</a>
        </li>
        <li>
            <a href="#">Result 2</a>
        </li>
        <li>
            <a href="#">Result 3</a>
        </li>
        <li>
            <a href="#">Result 4</a>
        </li>
    </ul>


Acknowledgements
----------------

Released under the `MIT License <http://www.opensource.org/licenses/mit-license.php>`_.

Issues should be opened through `GitHub Issues <http://github.com/kemar/jquery.suggest/issues/>`_.

`jQuery Suggest <http://github.com/kemar/jquery.suggest>`_ is authored and maintained by `Kemar <http://marcarea.com>`_.
