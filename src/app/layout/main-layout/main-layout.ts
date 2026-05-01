import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '@layout/navbar/navbar';
import { FooterComponent } from '@layout/footer/footer';
import { ToastHostComponent } from '@shared/molecules/toast-host/toast-host.component';
import { ConfirmDialogComponent } from '@shared/molecules/confirm-dialog/confirm-dialog.component';
import { TourOverlayComponent } from '@shared/organisms/tour-overlay/tour-overlay.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    ToastHostComponent,
    ConfirmDialogComponent,
    TourOverlayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout {}
