import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavePromptDialogComponent } from './save-prompt-dialog.component';

describe('SavePromptDialogComponent', () => {
  let component: SavePromptDialogComponent;
  let fixture: ComponentFixture<SavePromptDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavePromptDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavePromptDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
