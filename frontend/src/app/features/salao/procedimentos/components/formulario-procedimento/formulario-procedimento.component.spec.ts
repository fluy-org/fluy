import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FormularioProcedimentoComponent } from './formulario-procedimento.component';

describe('FormularioProcedimentoComponent', () => {
  let component: FormularioProcedimentoComponent;
  let fixture: ComponentFixture<FormularioProcedimentoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FormularioProcedimentoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormularioProcedimentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
