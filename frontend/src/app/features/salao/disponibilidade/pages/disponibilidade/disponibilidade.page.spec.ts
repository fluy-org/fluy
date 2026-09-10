import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DisponibilidadePage } from './disponibilidade.page';

describe('DisponibilidadePage', () => {
  let component: DisponibilidadePage;
  let fixture: ComponentFixture<DisponibilidadePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DisponibilidadePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
