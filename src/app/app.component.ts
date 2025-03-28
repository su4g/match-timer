import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChannelService } from './channel.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'match-timer';

  private channelService = inject(ChannelService)

  ngOnInit(): void {
    this.channelService.initialize();
  }
}
