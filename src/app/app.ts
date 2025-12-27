import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import {
  IonApp,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonButtons,
  IonMenuButton,
  IonChip,
  IonAvatar,
  IonThumbnail,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonFab,
  IonFabButton,
  IonFabList,
  IonToggle,
  IonCheckbox,
  IonRadio,
  IonRadioGroup,
  IonRange,
  IonNote,
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  heart,
  heartOutline,
  star,
  starOutline,
  search,
  person,
  settings,
  home,
  add,
  remove,
  trash,
  create,
  chevronForward,
  notifications,
  menu,
  close,
  checkmark,
  arrowBack,
  arrowForward,
  share,
  download,
  cloudUpload,
  camera,
  image,
  mail,
  call,
  location,
  time,
  calendar,
  bookmark,
  bookmarkOutline,
  ellipsisVertical,
  ellipsisHorizontal,
  refresh,
  sync,
  warning,
  informationCircle,
  helpCircle,
  logoGithub,
  logoTwitter,
  logoGoogle,
  moon,
  sunny
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    IonApp,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonIcon,
    IonButtons,
    IonMenuButton,
      IonChip,
    IonAvatar,
    IonThumbnail,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonFab,
    IonFabButton,
    IonFabList,
    IonToggle,
    IonCheckbox,
    IonRadio,
    IonRadioGroup,
    IonRange,
    IonNote,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonFooter
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'Searchcraft';
  protected searchText = '';
  protected selectedSegment = 'all';
  protected rangeValue = 50;
  protected isDarkMode = false;

  constructor(@Inject(DOCUMENT) private document: Document) {
    addIcons({
      heart,
      'heart-outline': heartOutline,
      star,
      'star-outline': starOutline,
      search,
      person,
      settings,
      home,
      add,
      remove,
      trash,
      create,
      'chevron-forward': chevronForward,
      notifications,
      menu,
      close,
      checkmark,
      'arrow-back': arrowBack,
      'arrow-forward': arrowForward,
      share,
      download,
      'cloud-upload': cloudUpload,
      camera,
      image,
      mail,
      call,
      location,
      time,
      calendar,
      bookmark,
      'bookmark-outline': bookmarkOutline,
      'ellipsis-vertical': ellipsisVertical,
      'ellipsis-horizontal': ellipsisHorizontal,
      refresh,
      sync,
      warning,
      'information-circle': informationCircle,
      'help-circle': helpCircle,
      'logo-github': logoGithub,
      'logo-twitter': logoTwitter,
      'logo-google': logoGoogle,
      moon,
      sunny
    });
  }

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    this.applyTheme();
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
  }

  private applyTheme(): void {
    this.document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode);
  }

  onSearchChange(event: CustomEvent): void {
    this.searchText = event.detail.value;
  }

  onSegmentChange(event: CustomEvent): void {
    this.selectedSegment = event.detail.value;
  }

  onRangeChange(event: CustomEvent): void {
    this.rangeValue = event.detail.value;
  }

  showAlert(): void {
    alert('Button clicked!');
  }
}
