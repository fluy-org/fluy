import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExploreContainerComponent {
  readonly name = input<string>();
}
