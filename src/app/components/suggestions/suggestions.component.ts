import { Component, Input, Output, EventEmitter } from '@angular/core';
import {
  IonItem,
  IonLabel,
  IonCheckbox,
  IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bulbOutline, alertCircleOutline, informationCircleOutline } from 'ionicons/icons';

import { IntelligenceSuggestion } from '../../models/intelligence.model';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [
    IonItem,
    IonLabel,
    IonCheckbox,
    IonIcon,
    IonText
  ],
  templateUrl: './suggestions.component.html',
  styleUrl: './suggestions.component.scss'
})
export class SuggestionsComponent {
  @Input() suggestions: IntelligenceSuggestion[] = [];
  @Output() applySuggestion = new EventEmitter<IntelligenceSuggestion>();
  @Output() removeSuggestion = new EventEmitter<IntelligenceSuggestion>();

  constructor() {
    addIcons({ bulbOutline, alertCircleOutline, informationCircleOutline });
  }

  /**
   * Get only actionable suggestions (those with suggestedAdds)
   */
  get actionableSuggestions(): IntelligenceSuggestion[] {
    return this.suggestions.filter(s => s.suggestedAdds);
  }

  /**
   * Get hint/lint suggestions (non-actionable)
   */
  get hintSuggestions(): IntelligenceSuggestion[] {
    return this.suggestions.filter(s => !s.suggestedAdds);
  }

  onToggle(suggestion: IntelligenceSuggestion, event: CustomEvent): void {
    const checked = event.detail.checked;
    if (checked) {
      this.applySuggestion.emit(suggestion);
    } else {
      this.removeSuggestion.emit(suggestion);
    }
  }

  getSeverityIcon(suggestion: IntelligenceSuggestion): string {
    if (suggestion.type === 'synonym') {
      return 'bulb-outline';
    }
    if (suggestion.severity === 'warning') {
      return 'alert-circle-outline';
    }
    return 'information-circle-outline';
  }

  getSeverityColor(suggestion: IntelligenceSuggestion): string {
    if (suggestion.severity === 'warning') {
      return 'warning';
    }
    return 'medium';
  }
}
