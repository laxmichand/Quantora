import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnInit,
  OnDestroy,
  TemplateRef,
  InjectionToken,
  Inject,
  Optional,
} from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  minWidth?: string;
  sortable?: boolean;
  hideable?: boolean;
  hidden?: boolean;
  sticky?: boolean;
  class?: string;
  cellTemplate?: TemplateRef<any>;
  pipe?: 'currency' | 'percent' | 'number' | 'date';
  pipeArgs?: string;
}

export interface TableConfig {
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  showHeader?: boolean;
  showSearch?: boolean;
  showColumnToggle?: boolean;
  showPagination?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  maxRows?: number;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc' | null;
}

export interface TablePreferences {
  sort: SortState | null;
  hiddenColumns: string[];
  columnOrder: string[];
  pageSize: number;
  searchTerm: string;
}

export const TABLE_ID = new InjectionToken<string>('TABLE_ID');

const PREFS_KEY_PREFIX = 'quantora_table_prefs_';

function loadPrefs(id: string): TablePreferences | null {
  try {
    const raw = localStorage.getItem(PREFS_KEY_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePrefs(id: string, prefs: TablePreferences): void {
  try {
    localStorage.setItem(PREFS_KEY_PREFIX + id, JSON.stringify(prefs));
  } catch {
    /* quota exceeded or storage unavailable */
  }
}

@Component({
  selector: 'app-data-table',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
})
export class DataTableComponent<T = any> implements OnInit, OnDestroy {
  @Input() columns: TableColumn[] = [];
  @Input() data: T[] = [];
  @Input() config: TableConfig = {};
  @Input() loading = false;
  @Input() loadingRows = 5;

  @Output() rowClick = new EventEmitter<T>();
  @Output() sort = new EventEmitter<SortState>();
  @Output() selectionChange = new EventEmitter<T[]>();
  @Output() columnOrderChange = new EventEmitter<TableColumn[]>();
  @Output() columnVisibilityChange = new EventEmitter<TableColumn[]>();
  @Output() preferencesChange = new EventEmitter<TablePreferences>();

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('tableWrapper') tableWrapperRef!: ElementRef<HTMLDivElement>;

  searchTerm = '';
  activeSort: SortState | null = null;
  processedData: T[] = [];
  paginatedData: T[] = [];
  selectedRows = new Set<T>();
  visibleColumns: TableColumn[] = [];
  columnMenuOpen = false;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private tableId: string;

  constructor(
    private cdr: ChangeDetectorRef,
    @Optional() @Inject(TABLE_ID) id: string | null,
  ) {
    this.tableId = id || 'default';
  }

  ngOnInit(): void {
    this.pageSize = this.config.pageSize || 10;

    // Restore saved preferences
    const saved = loadPrefs(this.tableId);
    if (saved) {
      this.searchTerm = saved.searchTerm || '';
      this.pageSize = saved.pageSize || this.config.pageSize || 10;
      if (saved.sort) this.activeSort = saved.sort;
      if (saved.hiddenColumns?.length) {
        this.columns.forEach((c) => {
          c.hidden = saved.hiddenColumns.includes(c.key);
        });
      }
      if (saved.columnOrder?.length) {
        const orderMap = new Map(saved.columnOrder.map((k, i) => [k, i]));
        this.columns.sort((a, b) => (orderMap.get(a.key) ?? 0) - (orderMap.get(b.key) ?? 0));
      }
    }

    this.visibleColumns = this.columns.filter((c) => !c.hidden);
    this.processData();

    this.search$.pipe(debounceTime(200), distinctUntilChanged()).subscribe((term) => {
      this.searchTerm = term;
      this.currentPage = 1;
      this.processData();
      this.persistPrefs();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.visibleColumns = this.columns.filter((c) => !c.hidden);
    this.processData();
    this.cdr.markForCheck();
  }

  // ─── Sorting ───────────────────────────────────
  toggleSort(col: TableColumn): void {
    if (!col.sortable) return;
    let dir: 'asc' | 'desc' | null = 'asc';
    if (this.activeSort?.column === col.key) {
      if (this.activeSort.direction === 'asc') dir = 'desc';
      else dir = null;
    }
    this.activeSort = dir ? { column: col.key, direction: dir } : null;
    this.processData();
    this.persistPrefs();
    this.sort.emit(this.activeSort!);
    this.cdr.markForCheck();
  }

  getSortIcon(col: TableColumn): string {
    if (this.activeSort?.column !== col.key) return 'unfold_more';
    return this.activeSort.direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  // ─── Search ─────────────────────────────────────
  onSearchInput(value: string): void {
    this.search$.next(value);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.processData();
    this.persistPrefs();
    this.cdr.markForCheck();
  }

  // ─── Column Visibility ──────────────────────────
  toggleColumnMenu(): void {
    this.columnMenuOpen = !this.columnMenuOpen;
  }

  toggleColumn(col: TableColumn): void {
    col.hidden = !col.hidden;
    this.visibleColumns = this.columns.filter((c) => !c.hidden);
    this.columnVisibilityChange.emit(this.columns);
    this.persistPrefs();
    this.cdr.markForCheck();
  }

  showAllColumns(): void {
    this.columns.forEach((c) => (c.hidden = false));
    this.visibleColumns = [...this.columns];
    this.columnVisibilityChange.emit(this.columns);
    this.persistPrefs();
    this.cdr.markForCheck();
  }

  // ─── Drag & Drop ───────────────────────────────
  onColumnDrop(event: CdkDragDrop<TableColumn[]>): void {
    moveItemInArray(this.columns, event.previousIndex, event.currentIndex);
    this.visibleColumns = this.columns.filter((c) => !c.hidden);
    this.columnOrderChange.emit(this.columns);
    this.persistPrefs();
    this.cdr.markForCheck();
  }

  // ─── Pagination ─────────────────────────────────
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePaginatedData();
    this.cdr.markForCheck();
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }
  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.updatePaginatedData();
    this.persistPrefs();
    this.cdr.markForCheck();
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ─── Cell Value ─────────────────────────────────
  getCellValue(row: T, col: TableColumn): any {
    const keys = col.key.split('.');
    let value: any = row;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  }

  formatCellValue(row: T, col: TableColumn): string {
    const val = this.getCellValue(row, col);
    if (val === null || val === undefined) return '—';
    switch (col.pipe) {
      case 'currency':
        return '₹' + Number(val).toLocaleString('en-IN');
      case 'percent':
        return (Number(val) > 0 ? '+' : '') + Number(val).toFixed(2) + '%';
      case 'number':
        return Number(val).toLocaleString('en-IN');
      default:
        return String(val);
    }
  }

  // ─── Selection ──────────────────────────────────
  toggleRow(row: T): void {
    if (this.selectedRows.has(row)) this.selectedRows.delete(row);
    else this.selectedRows.add(row);
    this.selectionChange.emit(Array.from(this.selectedRows));
    this.cdr.markForCheck();
  }

  isSelected(row: T): boolean {
    return this.selectedRows.has(row);
  }

  // ─── Reset ──────────────────────────────────────
  resetPreferences(): void {
    this.searchTerm = '';
    this.activeSort = null;
    this.pageSize = this.config.pageSize || 10;
    this.currentPage = 1;
    this.columns.forEach((c) => (c.hidden = false));
    this.visibleColumns = [...this.columns];
    localStorage.removeItem(PREFS_KEY_PREFIX + this.tableId);
    this.processData();
    this.preferencesChange.emit(this.getPrefs());
    this.cdr.markForCheck();
  }

  // ─── Helpers ────────────────────────────────────
  trackByIndex(index: number): number {
    return index;
  }
  trackByColKey(_index: number, col: TableColumn): string {
    return col.key;
  }

  // ─── Persistence ────────────────────────────────
  private getPrefs(): TablePreferences {
    return {
      sort: this.activeSort,
      hiddenColumns: this.columns.filter((c) => c.hidden).map((c) => c.key),
      columnOrder: this.columns.map((c) => c.key),
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
    };
  }

  private persistPrefs(): void {
    savePrefs(this.tableId, this.getPrefs());
    this.preferencesChange.emit(this.getPrefs());
  }

  private processData(): void {
    let result = [...this.data];

    // Filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter((row) =>
        this.visibleColumns.some((col) => {
          const val = String(this.getCellValue(row, col) ?? '').toLowerCase();
          return val.includes(term);
        }),
      );
    }

    // Sort
    if (this.activeSort) {
      const col = this.columns.find((c) => c.key === this.activeSort!.column);
      if (col) {
        result.sort((a, b) => {
          const aVal = this.getCellValue(a, col);
          const bVal = this.getCellValue(b, col);
          const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), undefined, {
            numeric: true,
          });
          return this.activeSort!.direction === 'asc' ? cmp : -cmp;
        });
      }
    }

    this.processedData = result;
    this.updatePaginatedData();
  }

  private updatePaginatedData(): void {
    this.totalPages = Math.max(1, Math.ceil(this.processedData.length / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    const start = (this.currentPage - 1) * this.pageSize;
    this.paginatedData = this.processedData.slice(start, start + this.pageSize);
  }
}
