import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostBinding,
  inject,
  Input, NgZone,
  OnInit, Renderer2,
  ViewChild
} from '@angular/core';
import { ChannelService } from '../channel.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {distinctUntilChanged, filter, map, Subject, take, takeLast} from 'rxjs';
import {FormBuilder, UntypedFormGroup} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-screen',
  imports: [
    CommonModule
  ],
  templateUrl: './screen.component.html',
  standalone: true,
  styleUrl: './screen.component.css'
})
export class ScreenComponent implements OnInit{

  @HostBinding('class') get hostClass(){
    return this.playVoice ? 'full-screen' : 'inner-screen' ;
  }

  private channelService = inject(ChannelService);

  private activatedRoute = inject(ActivatedRoute);

  private destroyRef = inject(DestroyRef);

  private cdr = inject(ChangeDetectorRef);

  private fb = inject(FormBuilder);

  protected  render2 = inject(Renderer2);

  private  ngzone = inject(NgZone);

  @Input() screenId!: any;

  @Input() playVoice = true;

  public timerState!:Record<string, any>;

  public timerScreen: any[] = [];

  public currentScreenId!: number;

  public timeInterval!: any;

  public updateScreenState$ = new Subject<any>();

  public screenFormGroup!: UntypedFormGroup;

  get timeNum() {
    return this.screenFormGroup.controls['timeNum'].value
  }

  get initTimeNum() {
    return this.initializeState?.['timeNum']
  }

  get onlineNum() {
    return this.screenFormGroup.controls['onlineNum'].value
  }

  get isStart() {
    return this.screenFormGroup.controls['isStart'].value
  }

  get isStop() {
    return this.screenFormGroup.controls['isStop'].value
  }

  get onceText() {
    // return this.screenFormGroup.controls['onceText'].value
    return this.screenFormGroup.controls['text'].value
  }

  get screenText() {
    return this.screenFormGroup.controls['screenText'].value
  }

  get backGroundColor() {
    return this.screenFormGroup.controls['backGroundColor'].value
  }

  get fontFamily() {
    return this.screenFormGroup.controls['fontFamily'].value
  }

  get fontFamilyCalc() {
    return this.screenFormGroup.controls['fontFamilyCalc'].value || 3
  }

  public currentLoopIndex = 0;

  public isFullScreen = false;

  private initializeState!: any;

  get background() {
    return this.isStart ?
      (
        this.onlineNum > 0 ?
          this.screenFormGroup.get('onlineNumColor')?.value:
          (
            ( this.screenFormGroup.controls['countNum'].value && this.screenFormGroup.controls['timeNum'].value <= this.screenFormGroup.controls['countNum'].value ) ?
            this.screenFormGroup.get('countNumColor')?.value :
            this.screenFormGroup.get('timeNumColor')?.value
          )
      )
       : (
        this.isStop ?
        (
          ( this.screenFormGroup.controls['countNum'].value && this.screenFormGroup.controls['timeNum'].value <= this.screenFormGroup.controls['countNum'].value ) ?
            this.screenFormGroup.get('countNumColor')?.value :
            this.screenFormGroup.get('timeNumColor')?.value
        )
        : this.screenFormGroup.get('timeNumColor')?.value
       )
  }

  get isTextChangeColor() {
    return this.screenFormGroup.get('textChangeColor')?.value;
  }

  get fontFamilyMargin() {
    return this.playVoice ? `${this.screenFormGroup.get('fontFamilyMargin')?.value || 24}px` : '24px';
  }

  public fontSize!: string;

  public fontTextSize!: string;

  public dotSize!: string;

  public loadingDone = false;

  @ViewChild('screenRef') screenRef!: ElementRef;

  @ViewChild('screenContainer') screenContainerRef!: ElementRef;

  @ViewChild('screenNumberContainer') screenNumberContainerRef!: ElementRef;

  @ViewChild('screenDotContainer') screenDotContainerRef!: ElementRef;

  getStyle() {
    const _fontFamilyCalc = this.playVoice ? this.fontFamilyCalc : 3;
    const size = window.innerHeight / _fontFamilyCalc;
    this.fontSize = `${size}px`;
    this.fontTextSize = `${Math.max(16, size / _fontFamilyCalc)}px`;
    this.dotSize = `${Math.max(18, size / (_fontFamilyCalc / 2))}px`;

    // setTimeout(()=>{
    //   if(this.screenContainerRef?.nativeElement && this.screenNumberContainerRef?.nativeElement) {
    //       // this.render2.removeStyle(this.screenContainerRef?.nativeElement, 'width' );
    //       setTimeout(()=> {
    //         const clientWidth = this.screenNumberContainerRef?.nativeElement?.clientWidth;
    //         const dotWidth = this.screenDotContainerRef?.nativeElement?.clientWidth || clientWidth;
    //
    //         if(clientWidth && this.screenContainerRef?.nativeElement) {
    //           this.render2.setStyle(this.screenContainerRef.nativeElement, 'width' , `${clientWidth + dotWidth + 24}px`)
    //         }
    //       }, 0)
    //     }
    // }, 0)
  }

  ngOnInit(): void {
    this.screenFormGroup = this.fb.group({
      textChangeColor: false,
      backGroundColor: '',
      fontFamily: '',
      fontFamilyMargin: 24,
      fontFamilyCalc: 3,
      isStartRound: false,
      onceText: '',
      text: '',
      screenText: '',
      isStart: false,
      isStop: false,
      isNext: false,
      timeNum: 0,
      timeNumColor: '',
      onlineNum: 0,
      onlineNumColor: '',
      countNum: 0,
      countNumColor: '',
      textGroup: [],
      timeMode: '',
      loopOnlineNum: false,
    });

    if(this.screenId) {
      this.listenScreenState();
      setTimeout(() => {
        this.timerState = this.channelService.timerState;
        this.updateScreenState$.next(this.channelService.timerState.screen);
        this.screenFormGroup.patchValue({
          isStartRound: this.timerState['isStartRound']
        });
      }, 0);
      this.channelService.updateNotice$.pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(()=>{
        this.updateScreenState$.next(this.channelService.timerState.screen);
      });
      setTimeout(()=>{
        this.screenRef.nativeElement.style.height = '100%';
        this.loadingDone = true;
      }, 0)
    } else {
      this.activatedRoute.params
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(params=>{
          return params['id']
        }),
        filter(id=>{
          return id !== null
        })
      )
      .subscribe(id=>{
        this.getStyle();
        this.loadingDone = true;
        this.screenId = id;
        this.listenScreenState();
      });
    }

    this.channelService.channel.onmessage = (e)=>{
      this.timerState = e.data;
      const { isStartRound, timeMode, screen } = this.timerState;
      this.validPatchValue({
        isStartRound: isStartRound,
        timeMode: timeMode
      });
      this.updateScreenState$.next(screen);
    }

    this.listenScreenFromChange();
  }

  private validPatchValue(value: Record<string, any> = {}) {
    const formValue = this.screenFormGroup.getRawValue();
    const patchValue: any = {};
    Object.keys(value).forEach(k=>{
      if(formValue[k] != value[k]) {
        patchValue[k] = value[k];
      }
    });
    this.screenFormGroup.patchValue(patchValue);
    this.cdr.detectChanges();
  }

  private listenScreenFromChange() {
    this.screenFormGroup.controls['isStartRound'].valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(v=>{
      if(v) {
        this.setTimer();
      }
    });

    this.screenFormGroup.controls['isStart'].valueChanges
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(v=>{
      if(v) {
        this.startTimer();
      } else {
        setTimeout(()=>{
          if(!this.screenFormGroup.controls['isStop'].value) {
            this.endTimer();
          }
        }, 0)
      }
    });

    this.screenFormGroup.controls['isNext'].valueChanges
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(v=>{
      if(v) {
        this.nextTimer();
      }
    });

    this.screenFormGroup.controls['isStop'].valueChanges
    .pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(v=>{
      if(v) {
        this.stopTimer();
      }
    });

    this.screenFormGroup.controls['fontFamilyCalc'].valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(v=>{
      if(v && this.playVoice) {
        this.getStyle();
      }
    });
  }

  private listenScreenState() {
    this.updateScreenState$.pipe(
      map(state => {
        return state.find((item: any) => {
          return item.id == this.screenId
        })
      })
    ).subscribe(state =>{
      this.validPatchValue(state);
    })
  }

  private setTimer() {
    const {
      textChangeColor,
      backGroundColor,
      fontFamily ,
      fontFamilyCalc,
      fontFamilyMargin,
      screenText,
      // onceText,
      timeNum,
      timeNumColor,
      onlineNum,
      onlineNumColor,
      countNum,
      countNumColor,
      timeMode,
      loopOnlineNum
    } = this.timerState;
    this.screenFormGroup.patchValue({
      fontFamilyMargin: fontFamilyMargin,
      textChangeColor: textChangeColor,
      backGroundColor: backGroundColor,
      fontFamily: fontFamily,
      fontFamilyCalc: fontFamilyCalc,
      // onceText: onceText,
      screenText: screenText,
      timeNum: Number(timeNum),
      timeNumColor: timeNumColor,
      onlineNum: Number(onlineNum),
      onlineNumColor: onlineNumColor,
      countNum: Number(countNum),
      countNumColor: countNumColor,
      timeMode: timeMode,
      loopOnlineNum: loopOnlineNum
    });
    this.initializeState = JSON.parse(JSON.stringify(this.screenFormGroup.getRawValue()));
    this.cdr.detectChanges();
  }

  private getTimeNumAudio() {
    const audio = localStorage.getItem('timeNumAudioData');
    const audioSetting = JSON.parse(localStorage.getItem('audioSetting') || JSON.stringify({}));
    const volume = audioSetting['timeNumPlayer']?.volume || 1;
    const muted = audioSetting['timeNumPlayer']?.muted || false;
    return {
      audio: this.playVoice ? audio : '',
      volume,
      muted
    }
  }

  private getOnlineNumAudio() {
    const audio = localStorage.getItem('onlineNumAudioData');
    const audioSetting = JSON.parse(localStorage.getItem('audioSetting') || JSON.stringify({}));
    const volume = audioSetting['onlineNumPlayer']?.volume || 1;
    const muted = audioSetting['onlineNumPlayer']?.muted || false;
    return {
      audio: this.playVoice ? audio : '',
      volume,
      muted
    }
  }

  private getCountNumAudio() {
    const audio = localStorage.getItem('countNumAudioData');
    const audioSetting = JSON.parse(localStorage.getItem('audioSetting') || JSON.stringify({}));
    const volume = audioSetting['countNumPlayer']?.volume || 1;
    const muted = audioSetting['countNumPlayer']?.muted || false;
    return {
      audio: this.playVoice ? audio : '',
      volume,
      muted
    }
  }

  private playOnlineAudio() {
    const onlineNumAudio = this.getOnlineNumAudio();
    if(onlineNumAudio.audio) {
      const audio = new Audio(onlineNumAudio.audio);
      audio.muted = onlineNumAudio.muted;
      audio.volume = onlineNumAudio.volume;
      audio.play().catch(error => {
          console.error('播放失败:', error);
      });
    }
  }

  private playTimeAudio() {
    const _timeNumAudio = this.getTimeNumAudio();
    if(_timeNumAudio.audio) {
      const audio = new Audio(_timeNumAudio.audio);
      audio.muted = _timeNumAudio.muted;
      audio.volume = _timeNumAudio.volume;
      audio.play().catch(error => {
          console.error('播放失败:', error);
      });
    }
  }

  private playCountAudio() {
    const countNumAudio = this.getCountNumAudio();
    if(countNumAudio.audio) {
      const audio = new Audio(countNumAudio.audio);
      audio.muted = countNumAudio.muted;
      audio.volume = countNumAudio.volume;
      audio.play().catch(error => {
          console.error('播放失败:', error);
      });
    }
  }

  private playStartVoice(onlineNum: number, timeNum: number) {
    if(this.initializeState['onlineNum'] && onlineNum) {
        const onlineNumAudio = this.getOnlineNumAudio();
        if(onlineNumAudio.audio) {
          const audio = new Audio(onlineNumAudio.audio);
          audio.muted = onlineNumAudio.muted;
          audio.volume = onlineNumAudio.volume;
          audio.play().catch(error => {
              console.error('播放失败:', error);
          });
        }
      } else {
        if(timeNum) {
          const _timeNumAudio = this.getTimeNumAudio();
          if(_timeNumAudio.audio) {
            const audio = new Audio(_timeNumAudio.audio);
            audio.muted = _timeNumAudio.muted;
            audio.volume = _timeNumAudio.volume;
            audio.play().catch(error => {
                console.error('播放失败:', error);
            });
          }
        }
      }
      this.cdr.detectChanges();
  }

  private startTimer() {
    const { timeNum, onlineNum, timeMode , loopOnlineNum, textGroup } = this.screenFormGroup.getRawValue();
    if(timeMode === 'loop') {
      this.currentLoopIndex = 0;
      this.screenFormGroup.controls['text'].patchValue(textGroup[this.currentLoopIndex]);
      this.playStartVoice(onlineNum, timeNum);

      this.timeInterval = setInterval(() => {
        const { timeNum, loopOnlineNum, onlineNum, textGroup  } = this.screenFormGroup.getRawValue();
        console.log(this.currentLoopIndex, textGroup, timeNum)
        this.screenFormGroup.controls['text'].patchValue(textGroup[this.currentLoopIndex]);
        if(onlineNum) {
            this.screenFormGroup.controls['onlineNum'].patchValue(onlineNum - 1);
            if(loopOnlineNum && this.initializeState['onlineNum'] && !(onlineNum - 1)) {
              this.playTimeAudio();
            }
        } else if(timeNum) {
          if(timeNum - 1 === 0) {
            this.playCountAudio();

            if(!loopOnlineNum && this.currentLoopIndex < textGroup.length - 1) {
              setTimeout(()=>{
                this.nextTimer();
              },1000)
            }
          }
          this.screenFormGroup.controls['timeNum'].patchValue(timeNum - 1);
        }
        this.cdr.detectChanges();
      }, 1000);
    } else {
      this.playStartVoice(onlineNum, timeNum);
      this.timeInterval = setInterval(() => {
        const { timeNum, onlineNum, textGroup  } = this.screenFormGroup.getRawValue();
        if(onlineNum) {
          this.screenFormGroup.controls['onlineNum'].patchValue(onlineNum - 1);
          if(this.initializeState['onlineNum'] && !(onlineNum - 1)) {
            const timeNumAudio = this.getTimeNumAudio();
            if(timeNumAudio.audio) {
              const audio = new Audio(timeNumAudio.audio);
              audio.muted = timeNumAudio.muted;
              audio.volume = timeNumAudio.volume;
              audio.play().catch(error => {
                  console.error('播放失败:', error);
              });
            }
          }
        } else if(timeNum) {
          if(timeNum - 1 === 0) {
            const countNumAudio = this.getCountNumAudio();
            if(countNumAudio.audio) {
              const audio = new Audio(countNumAudio.audio);
              audio.muted = countNumAudio.muted;
              audio.volume = countNumAudio.volume;
              audio.play().catch(error => {
                  console.error('播放失败:', error);
              });
            }
          }
          this.screenFormGroup.controls['timeNum'].patchValue(timeNum - 1);
        }
        this.cdr.detectChanges();
      }, 1000);
    }

  }

  private nextTimer() {
    const {
      loopOnlineNum,
      textGroup
    } = this.screenFormGroup.getRawValue();

    this.currentLoopIndex = Math.min(textGroup.length - 1, this.currentLoopIndex + 1);
    this.screenFormGroup.controls['timeNum'].patchValue(this.initializeState['timeNum']);
    this.screenFormGroup.controls['isNext'].patchValue(false);
    this.screenFormGroup.controls['text'].patchValue(textGroup[this.currentLoopIndex]);

    if(loopOnlineNum && this.initializeState['onlineNum']) {
      this.screenFormGroup.controls['onlineNum'].patchValue(this.initializeState['onlineNum']);
      this.playOnlineAudio();
    } else {
      this.playTimeAudio();
    }
    this.cdr.detectChanges();
  }

  private stopTimer() {
    const { onlineNum } = this.screenFormGroup.getRawValue();
    if(onlineNum) {
      this.screenFormGroup.controls['onlineNum'].patchValue(this.initializeState['onlineNum']);

    }
    clearInterval(this.timeInterval);
    this.cdr.detectChanges();
  }

  private endTimer() {
    const { textGroup } = this.screenFormGroup.getRawValue();
    this.screenFormGroup.controls['onlineNum'].patchValue(this.initializeState['onlineNum']);
    this.screenFormGroup.controls['timeNum'].patchValue(this.initializeState['timeNum']);
    this.currentLoopIndex = 0;
    this.screenFormGroup.controls['text'].patchValue(textGroup[this.currentLoopIndex]);
    this.screenFormGroup.controls['isNext'].patchValue(false);
    this.cdr.detectChanges();
    clearInterval(this.timeInterval);
  }
}
