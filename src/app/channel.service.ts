import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export  enum MatchModeType {
  AB = 'AB',
  ABC = 'ABC',
  ABCD = 'ABCD'
}

export interface ScreenStateInfo {
  id: any;
  isStart: boolean;
  isStop: boolean;
  text: string;
}

export interface TimerStateInfo {
  isStartRound: boolean;
  isEndRound: boolean;
  isStartGroup: boolean;
  isStopGroup: boolean;
  isEndGroup: boolean;
  roundCount: number;
  screenText: string;
  textChangeColor: boolean;
  timeNum: number,
  timeNumColor: string,
  onlineNum: number,
  onlineNumColor: string,
  countNum: number,
  countNumColor: string,
  // matchMode: MatchModeType | null,
  timeMode: 'once' | 'loop',
  groupMember: number;
  onceText: string;
  loopGroup: [];
  screen: ScreenStateInfo[]
}

@Injectable({
  providedIn: 'root'
})
export class ChannelService {

  channel!: BroadcastChannel;

  timerState: TimerStateInfo = {
    isStartRound: false,
    isEndRound: false,
    isStartGroup: false,
    isStopGroup: false,
    isEndGroup: false,
    roundCount: 1,
    screenText: '',
    textChangeColor: false,
    timeNum: 0,
    timeNumColor: '#00FF00',
    onlineNum: 0,
    onlineNumColor: '#FF0000',
    countNum: 0,
    countNumColor: '#FFFF00',
    timeMode: 'once',
    groupMember: 0,
    onceText: '',
    loopGroup: [],
    screen: []
  };

  private initializeState!: TimerStateInfo;

  public updateNotice$ = new Subject();

  initialize() {
    this.initializeState = JSON.parse(JSON.stringify(this.timerState));
    this.channel = new BroadcastChannel('timerChannel');
  }

  addScreen(info: ScreenStateInfo) {
    this.timerState.screen.push(info);
  }
}
