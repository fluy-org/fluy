import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ProcedimentosPage } from './procedimentos.page';

describe('ProcedimentosPage', () => {
  let component: ProcedimentosPage;
  let fixture: ComponentFixture<ProcedimentosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProcedimentosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProcedimentosPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
