import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { EstadoInvitacion, Invitacion } from '@core/models/invitacion/invitacion.model';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ButtonComponent } from '@shared/ui/button/button.component';
import { TagComponent } from '@shared/ui/tag/tag.component';

export type InvitationDirection = 'received' | 'sent';

@Component({
  selector: 'app-invitation-card',
  standalone: true,
  imports: [DatePipe, IconComponent, ButtonComponent, TagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './invitation-card.component.html',
  styleUrl: './invitation-card.component.scss',
})
export class InvitationCardComponent {
  readonly invitacion = input.required<Invitacion>();
  readonly direction = input<InvitationDirection>('received');

  readonly accepted = output<Invitacion>();
  readonly rejected = output<Invitacion>();
  readonly cancelled = output<Invitacion>();

  readonly EstadoInvitacion = EstadoInvitacion;

  accept(): void {
    this.accepted.emit(this.invitacion());
  }

  reject(): void {
    this.rejected.emit(this.invitacion());
  }

  cancel(): void {
    this.cancelled.emit(this.invitacion());
  }
}
