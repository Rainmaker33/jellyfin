﻿(function ($, document) {

    var data = {};
    function getPageData() {
        var key = getSavedQueryKey();
        var pageData = data[key];

        if (!pageData) {
            pageData = data[key] = {
                query: {
                    SortBy: "SortName",
                    SortOrder: "Ascending",
                    IncludeItemTypes: "BoxSet",
                    Recursive: true,
                    Fields: "PrimaryImageAspectRatio,SortName,SyncInfo,CanDelete",
                    ImageTypeLimit: 1,
                    EnableImageTypes: "Primary,Backdrop,Banner,Thumb",
                    StartIndex: 0,
                    Limit: LibraryBrowser.getDefaultPageSize()
                },
                view: LibraryBrowser.getSavedView(key) || LibraryBrowser.getDefaultItemsView('Poster', 'Poster')
            };

            LibraryBrowser.loadSavedQueryValues(key, pageData.query);
        }
        return pageData;
    }

    function getQuery() {

        return getPageData().query;
    }

    function getSavedQueryKey() {

        return getWindowUrl();
    }

    function reloadItems(page) {

        Dashboard.showLoadingMsg();

        var query = getQuery();
        var promise1 = ApiClient.getItems(Dashboard.getCurrentUserId(), query);
        var promise2 = Dashboard.getCurrentUser();

        $.when(promise1, promise2).done(function (response1, response2) {

            var result = response1[0];
            var user = response2[0];

            // Scroll back up so they can see the results from the beginning
            window.scrollTo(0, 0);

            var html = '';

            var view = getPageData().view;

            $('.listTopPaging', page).html(LibraryBrowser.getQueryPagingHtml({
                startIndex: query.StartIndex,
                limit: query.Limit,
                totalRecordCount: result.TotalRecordCount,
                viewButton: false,
                sortButton: true,
                showLimit: false,
                updatePageSizeSetting: false,
                addLayoutButton: true,
                currentLayout: view

            })).trigger('create');

            var trigger = false;

            if (result.TotalRecordCount) {

                var context = getParameterByName('context');

                if (view == "List") {

                    html = LibraryBrowser.getListViewHtml({
                        items: result.Items,
                        context: context,
                        sortBy: query.SortBy
                    });
                    trigger = true;
                }
                else if (view == "Poster") {
                    html = LibraryBrowser.getPosterViewHtml({
                        items: result.Items,
                        shape: "auto",
                        context: context,
                        showTitle: true,
                        centerText: true,
                        lazy: true
                    });
                }
                else if (view == "PosterCard") {
                    html = LibraryBrowser.getPosterViewHtml({
                        items: result.Items,
                        shape: "auto",
                        context: context,
                        showTitle: true,
                        cardLayout: true,
                        lazy: true,
                        showItemCounts: true
                    });
                }
                else if (view == "Thumb") {
                    html = LibraryBrowser.getPosterViewHtml({
                        items: result.Items,
                        shape: "backdrop",
                        context: context,
                        showTitle: true,
                        centerText: true,
                        lazy: true,
                        preferThumb: true
                    });
                }
                else if (view == "ThumbCard") {
                    html = LibraryBrowser.getPosterViewHtml({
                        items: result.Items,
                        shape: "backdrop",
                        context: context,
                        showTitle: true,
                        lazy: true,
                        preferThumb: true,
                        cardLayout: true,
                        showItemCounts: true
                    });
                }

                $('.noItemsMessage', page).hide();

            } else {

                $('.noItemsMessage', page).show();
            }

            var elem = page.querySelector('.itemsContainer');
            elem.innerHTML = html;
            ImageLoader.lazyChildren(elem);

            if (trigger) {
                $(elem).trigger('create');
            }

            $('.btnNextPage', page).on('click', function () {
                query.StartIndex += query.Limit;
                reloadItems(page);
            });

            $('.btnPreviousPage', page).on('click', function () {
                query.StartIndex -= query.Limit;
                reloadItems(page);
            });

            $('.btnChangeLayout', page).on('layoutchange', function (e, layout) {
                getPageData().view = layout;
                LibraryBrowser.saveViewSetting(getSavedQueryKey(), layout);
                reloadItems(page);
            });

            // On callback make sure to set StartIndex = 0
            $('.btnSort', page).on('click', function () {
                LibraryBrowser.showSortMenu({
                    items: [{
                        name: Globalize.translate('OptionNameSort'),
                        id: 'SortName'
                    },
                    {
                        name: Globalize.translate('OptionImdbRating'),
                        id: 'CommunityRating,SortName'
                    },
                    {
                        name: Globalize.translate('OptionDateAdded'),
                        id: 'DateCreated,SortName'
                    },
                    {
                        name: Globalize.translate('OptionParentalRating'),
                        id: 'OfficialRating,SortName'
                    },
                    {
                        name: Globalize.translate('OptionReleaseDate'),
                        id: 'PremiereDate,SortName'
                    }],
                    callback: function () {
                        reloadItems(page);
                    },
                    query: query
                });
            });

            LibraryBrowser.saveQueryValues(getSavedQueryKey(), query);

            Dashboard.hideLoadingMsg();
        });
    }

    function initPage(tabContent) {

        $('select.selectView').on('change', function () {

            var newView = this.value;
            getPageData().view = newView;

            reloadItems(tabContent);

            LibraryBrowser.saveViewSetting(getSavedQueryKey(), newView);
        });
    }

    $(document).on('pageinitdepends', "#boxsetsPage", function () {

        var page = this;

        var content = page;

        initPage(content);

    }).on('pagebeforeshowready', "#boxsetsPage", function () {

        var page = this;

        var content = page;

        reloadItems(content);
    });

    window.MoviesPage = window.MoviesPage || {};
    window.MoviesPage.renderCollectionsTab = function (page, tabContent) {

        if (LibraryBrowser.needsRefresh(tabContent)) {
            reloadItems(tabContent);
        }
    };
    window.MoviesPage.initCollectionsTab = function (page, tabContent) {

        initPage(tabContent);
    };

})(jQuery, document);