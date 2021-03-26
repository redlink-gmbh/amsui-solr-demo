import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';
import { archiveOrgConfig } from './archive-org.config';
import {
  FacetConfigSolr,
  Highlighting,
  ResultEntry,
  SolrService,
} from '@redlink/amsui';

@Injectable({
  providedIn: 'root',
})
export class ArchiveOrgService extends SolrService {
  private solrSearchEndpoint = 'advancedsearch.php';
  protected resultTypesConfig = archiveOrgConfig;
  protected solrSearchURL = environment.backendURL + this.solrSearchEndpoint;
  protected facetsConfig: FacetConfigSolr[] =
    this.resultTypesConfig?.all?.facets || [];

  protected transformSearchResults(
    docs: any[],
    highlights: Highlighting
  ): ResultEntry[] {
    const tempResultArray: ResultEntry[] = [];

    for (const doc of docs) {
      tempResultArray.push({
        title: doc.title,
        subTitles: [
          { name: 'genre', description: doc.genre, icon: 'category' },
          { name: 'dowloads', description: doc.downloads, icon: 'download' },
          {
            name: 'mediatype',
            description: doc.mediatype,
            icon: 'play_lesson',
          },
        ],
        tags: doc.format,
        id: doc.identifier,
        description: doc.description,
      });
    }
    return tempResultArray;
  }

  getLinkToDetails(id: string): string {
    return 'http://archive.org/details/' + id;
  }
}
