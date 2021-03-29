import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { environment } from '../environments/environment';
import { ActivatedRoute } from '@angular/router';
import { take, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ArchiveOrgService } from './archive-org.service';
import { archiveOrgConfig } from './archive-org.config';
import {
  Breakpoints,
  Facet,
  FilterTab,
  NoResultsConfig,
  paramsToSelectedFacets,
  resetToQueryParam,
  ResultEntry,
  ResultEntryActionEvent,
  ResultViewConfig,
  SearchFieldConfig,
  SearchResultMeta,
  SearchService,
  SelectedFacet,
  SuggestionParameter,
} from '@redlink/amsui';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(CdkOverlayOrigin) origin!: CdkOverlayOrigin;
  title = 'Angular Material Search UI - AMSUI';
  searchKeyword = '';
  didYouMeanSearchValue = '';
  facets$: Observable<Facet[]> = of([]);
  results$: Observable<ResultEntry[]> = of([]);
  searchResultMeta$: Observable<SearchResultMeta> = of({
    numFound: -1,
    keyword: '',
    timeTaken: -1,
    numShowed: -1,
  });
  resultViewConfig: ResultViewConfig = {
    sortingOptions: archiveOrgConfig?.all?.sortingOptions || [],
    filterTabs: this.getFilterTabs(),
    resultViewTypes: ['list', 'grid'],
    selectedResultViewType: 'list',
  };
  noResultsConfig: NoResultsConfig = {
    alternativeKeywords: [],
    alternativeResults: [],
    didYouMeanValue: '',
    searchKeyword: this.searchKeyword,
    contactPhoneNumber: '+43 662 27 66 80',
    contactMailAddress: 'office@redlink.at',
  };
  searchFieldConfig: SearchFieldConfig = {
    value: this.didYouMeanSearchValue,
    placeholderLabel: 'app.searchField.placeholder',
    asyncSuggestionDataProvider: this.handleInputEvent.bind(this),
  };
  isMobile = false;
  isTablet = false;
  private notifierDestroySubs = new Subject();

  constructor(
    private readonly breakpointObserver: BreakpointObserver,
    private readonly searchService: SearchService,
    private readonly archiveOrgService: ArchiveOrgService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly translateService: TranslateService
  ) {
    this.activatedRoute.queryParams
      .pipe(take(2), takeUntil(this.notifierDestroySubs))
      .subscribe((params) => {
        if (
          !(
            params &&
            Object.keys(params).length === 0 &&
            params.constructor === Object
          )
        ) {
          this.searchKeyword = params.q || '';
          if (this.searchKeyword !== '') {
            this.searchService.selectedFacets = paramsToSelectedFacets(params);
            this.archiveOrgService.search(this.searchKeyword);
          }
        }
      });
    this.translateService.setDefaultLang('de');
    this.translateService.use('en');
  }

  ngOnInit(): void {
    this.facets$ = this.searchService.facets$;
    this.results$ = this.searchService.searchResults$;
    this.searchResultMeta$ = this.searchService.searchResultMeta$;
    this.searchService.alternativeKeywords$
      .pipe(takeUntil(this.notifierDestroySubs))
      .subscribe(
        (altKeywords) =>
          (this.noResultsConfig.alternativeKeywords = altKeywords)
      );
    this.searchService.alternativeResults$
      .pipe(takeUntil(this.notifierDestroySubs))
      .subscribe(
        (altResults) => (this.noResultsConfig.alternativeResults = altResults)
      );
    this.breakpointObserver
      .observe([Breakpoints.Mobile, Breakpoints.Tablet])
      .pipe(takeUntil(this.notifierDestroySubs))
      .subscribe((result) => {
        this.isMobile = result.breakpoints[Breakpoints.Mobile];
        this.isTablet = result.breakpoints[Breakpoints.Tablet];
      });
    if (environment.showToolTips) {
      this.addToolTips();
    }
  }

  ngOnDestroy(): void {
    this.notifierDestroySubs.next();
    this.notifierDestroySubs.complete();
  }

  ngAfterViewInit(): void {
    this.searchService.overlayElement = this.origin.elementRef;
  }

  facetChanged(selectedFacet: SelectedFacet): void {
    this.searchService.toggleSelectedFacet(selectedFacet);
    this.archiveOrgService.search(this.searchKeyword);
  }

  handleSearchEvent(searchKeyword: string): void {
    this.didYouMeanSearchValue = '';
    this.searchKeyword = searchKeyword;
    this.noResultsConfig.searchKeyword = searchKeyword;
    this.resetFacets();
    this.archiveOrgService.search(this.searchKeyword);
  }

  getBadgeNumber(): number {
    return this.searchService.selectedFacets.length;
  }

  resetSelectedFacets(): void {
    this.resetFacets();
    resetToQueryParam('q', this.searchKeyword);
    this.archiveOrgService.search(this.searchKeyword);
  }

  handleInputEvent(input: SuggestionParameter): Observable<string[]> {
    return this.archiveOrgService.getSearchSuggestions(input);
  }

  didYouMeanSearch(didYouMeanValue: string): void {
    this.didYouMeanSearchValue = didYouMeanValue;
    this.searchFieldConfig = {
      ...this.searchFieldConfig,
      value: didYouMeanValue,
    };
    this.searchKeyword = didYouMeanValue;
    this.resetFacets();
    this.archiveOrgService.search(didYouMeanValue);
  }

  handleLoadMore(): void {
    this.archiveOrgService.loadMore(this.searchKeyword);
  }

  handleFilterChange(filterName: string): void {
    this.archiveOrgService.adjustParamsToChangedFilter(filterName);
    this.resultViewConfig = {
      ...this.resultViewConfig,
      sortingOptions: this.archiveOrgService.getSortingOptions(filterName),
    };
    this.resetSelectedFacets();
  }

  getFilterTabs(): FilterTab[] {
    return this.archiveOrgService.getFiltersForView();
  }

  private resetFacets(): void {
    this.searchService.selectedFacets = [];
  }
  addToolTips(): void {
    const elementsToolTips = [
      {
        selector: 'search-button',
        id: 'must-have-magnifying-glass-icon',
        text:
          'Always use the magnifying class icon in the simplest form that you have',
        position: 'bottom',
      },
      {
        selector: 'search-button',
        id: 'must-have-search-button',
        text: 'A search button is mandatory for every search',
        position: 'bottom',
      },
    ];
    for (const elem of elementsToolTips) {
      const elementForTip = document.querySelector('.' + elem.selector);
      if (elementForTip) {
        elementForTip.parentElement?.insertAdjacentHTML(
          'beforeend',
          `<span class="tip" id="${elem.id}">
                    <p class="tip-text tip-text-${elem.position}">${elem.text}</p>
                </span>
            `
        );
      }
    }
  }

  onResultEntryClicked(resultEntryActionEvent: ResultEntryActionEvent): void {
    console.log(resultEntryActionEvent);
    if (resultEntryActionEvent.entry.id) {
      window.open(
        this.archiveOrgService.getLinkToDetails(
          resultEntryActionEvent.entry.id
        ),
        '_blank'
      );
    }
  }
}
