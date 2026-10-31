import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DisponibilidadePage } from './disponibilidade.page';

describe('DisponibilidadePage', () => {
  let component: DisponibilidadePage;
  let fixture: ComponentFixture<DisponibilidadePage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DisponibilidadePage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisponibilidadePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
