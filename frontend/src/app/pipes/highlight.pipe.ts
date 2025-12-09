import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
     name: 'highlight',
     standalone: true
})
export class HighlightPipe implements PipeTransform {
     transform(text: string, search: string): string {
          if (!search || !text) {
               return text;
          }

          const pattern = search.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
          const regex = new RegExp(`(${pattern})`, 'gi');
          return text.replace(regex, (match) => `<span class="text-primary font-bold bg-yellow-100 dark:bg-yellow-900/30 px-0.5 rounded">${match}</span>`);
     }
}
