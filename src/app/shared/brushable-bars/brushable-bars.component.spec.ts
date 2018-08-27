import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrushableBarsComponent } from './brushable-bars.component';

describe('BrushableBarsComponent', () => {
  let component: BrushableBarsComponent;
  let fixture: ComponentFixture<BrushableBarsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrushableBarsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrushableBarsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
