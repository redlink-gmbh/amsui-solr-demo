import { FacetConfigSolr, ResultTypesConfig } from '@redlink/amsui';

export const archiveOrgConfig: ResultTypesConfig = {
  all: {
    name: 'app.filterName.all',
    avatarIcon: 'search',
    facets: [
      new FacetConfigSolr('genre', 25, 'Type', 'top_genre').addFunctionality({
        facetType: 'multi',
      }),
    ],
    sortingOptions: [],
    typeCriterias: [],
  },
};
