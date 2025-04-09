import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChannelService } from './channel.service';
import { NzLayoutModule  } from 'ng-zorro-antd/layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NzLayoutModule ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  standalone: true
})
export class AppComponent implements OnInit {
  title = 'match-timer';

  private channelService = inject(ChannelService)

  ngOnInit(): void {
    this.channelService.initialize();
  }
}
