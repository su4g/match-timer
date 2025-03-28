import { ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, Input, OnInit, ViewChild } from '@angular/core';
import { ChannelService } from '../channel.service';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map, Subject } from 'rxjs';
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

  private channelService = inject(ChannelService);

  private activatedRoute = inject(ActivatedRoute);

  private destroyRef = inject(DestroyRef);

  private cdr = inject(ChangeDetectorRef);

  private fb = inject(FormBuilder);

  @Input() screenId!: any;

  public timerState!:Record<string, any>;

  public timerScreen: any[] = [];

  public currentScreenId!: number;

  public timeInterval!: any;

  public updateScreenState$ = new Subject<any>();

  public screenFormGroup!: UntypedFormGroup;

  get timeNum() {
    return this.screenFormGroup.controls['timeNum'].value
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
    return this.screenFormGroup.controls['onceText'].value
  }

  get screenText() {
    return this.screenFormGroup.controls['screenText'].value
  }

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

  public fontSize!: string;

  public dotSize!: string;

  public loadingDone = false;

  @ViewChild('screenRef') screenRef!: ElementRef;

  getStyle() {
    const size = window.innerHeight / 5;
    this.fontSize = `${size}px`;
    this.dotSize = `${size / 1.5}px`
  }

  ngOnInit(): void {
    this.screenFormGroup = this.fb.group({
      isStartRound: false,
      onceText: '',
      screenText: '',
      isStart: false,
      isStop: false,
      timeNum: 0,
      timeNumColor: '',
      onlineNum: 0,
      onlineNumColor: '',
      countNum: 0,
      countNumColor: ''
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
    const { screenText, onceText, timeNum,timeNumColor,onlineNum,onlineNumColor,countNum,countNumColor } = this.timerState;    
    this.screenFormGroup.patchValue({
      onceText: onceText,
      screenText: screenText,
      timeNum: Number(timeNum),
      timeNumColor: timeNumColor,
      onlineNum: Number(onlineNum),
      onlineNumColor: onlineNumColor,
      countNum: Number(countNum),
      countNumColor: countNumColor
    });
    this.initializeState = JSON.parse(JSON.stringify(this.screenFormGroup.getRawValue()));
    this.cdr.detectChanges();
  }

  private startTimer() {
    this.timeInterval = setInterval(() => {
      const { timeNum, onlineNum  } = this.screenFormGroup.getRawValue();
      if(onlineNum) {
        this.screenFormGroup.controls['onlineNum'].patchValue(onlineNum - 1);
      } else if(timeNum) {
        this.screenFormGroup.controls['timeNum'].patchValue(timeNum - 1);
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopTimer() {
    const { onlineNum } = this.screenFormGroup.getRawValue();
    if(onlineNum) {
      this.screenFormGroup.controls['onlineNum'].patchValue(this.initializeState['onlineNum']);
    }
    clearInterval(this.timeInterval);
  }
}
