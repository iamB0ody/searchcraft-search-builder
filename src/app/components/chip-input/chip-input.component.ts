import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import {
  IonInput,
  IonChip,
  IonIcon,
  IonLabel,
  IonButton,
  IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, add } from 'ionicons/icons';

@Component({
  selector: 'app-chip-input',
  standalone: true,
  imports: [
    FormsModule,
    IonInput,
    IonChip,
    IonIcon,
    IonLabel,
    IonButton,
    IonNote
  ],
  templateUrl: './chip-input.component.html',
  styleUrl: './chip-input.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ChipInputComponent),
    multi: true
  }]
})
export class ChipInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = 'Add item...';
  @Input() chipColor = 'primary';
  @Input() helperText = '';

  protected items: string[] = [];
  protected inputValue = '';
  protected isDisabled = false;

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    addIcons({ close, add });
  }

  // ControlValueAccessor implementation
  writeValue(value: string[]): void {
    this.items = value || [];
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  protected addItem(): void {
    if (this.isDisabled) return;

    const value = this.inputValue.trim();
    if (value && !this.isDuplicate(value)) {
      this.items = [...this.items, value];
      this.inputValue = '';
      this.onChange(this.items);
    }
  }

  protected removeItem(index: number): void {
    if (this.isDisabled) return;

    this.items = this.items.filter((_, i) => i !== index);
    this.onChange(this.items);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addItem();
    }
  }

  protected onInputChange(event: CustomEvent): void {
    const value = event.detail.value || '';

    // Check for paste with multiple values (comma or newline separated)
    if (value.includes(',') || value.includes('\n')) {
      this.handleMultipleValues(value);
    } else {
      this.inputValue = value;
    }
  }

  protected onBlur(): void {
    this.onTouched();
    // Add remaining input value on blur
    if (this.inputValue.trim()) {
      this.addItem();
    }
  }

  private handleMultipleValues(value: string): void {
    const values = value
      .split(/[,\n]/)
      .map(v => v.trim())
      .filter(v => v && !this.isDuplicate(v));

    if (values.length > 0) {
      this.items = [...this.items, ...values];
      this.inputValue = '';
      this.onChange(this.items);
    }
  }

  private isDuplicate(value: string): boolean {
    return this.items.some(item =>
      item.toLowerCase() === value.toLowerCase()
    );
  }
}
