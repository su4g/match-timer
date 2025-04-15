import {FormArray, FormBuilder, FormsModule, ReactiveFormsModule, UntypedFormGroup} from '@angular/forms';
import { ChannelService } from '../channel.service';
import {Component, DestroyRef, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import { CommonModule } from '@angular/common';
import {ScreenComponent} from '../screen/screen.component';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import {NzFormModule} from 'ng-zorro-antd/form';
import {NzInputNumberModule} from 'ng-zorro-antd/input-number';
import {NzInputModule} from 'ng-zorro-antd/input';
import { NzColorPickerModule } from 'ng-zorro-antd/color-picker';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import {NzCheckboxModule} from 'ng-zorro-antd/checkbox';
import {NzSelectModule} from 'ng-zorro-antd/select';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {NzCollapseModule} from 'ng-zorro-antd/collapse';
import {NzUploadFile, NzUploadModule} from 'ng-zorro-antd/upload';


@Component({
  selector: 'app-control',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ScreenComponent,
    NzButtonModule,
    NzCardModule,
    NzFormModule,
    NzInputNumberModule,
    NzInputModule,
    NzColorPickerModule,
    NzFlexModule,
    NzGridModule,
    NzCheckboxModule,
    NzSelectModule,
    NzIconModule,
    NzCollapseModule,
    NzUploadModule
  ],
  templateUrl: './control.component.html',
  standalone: true,
  styleUrl: './control.component.css'
})
export class ControlComponent implements OnInit {

  private channelService = inject(ChannelService);

  private fb = inject(FormBuilder);

  private  destroyRef = inject(DestroyRef);

  public controlFormGroup!: UntypedFormGroup;

  public panelActive = true;

  get timerState() {
    return this.channelService.timerState
  }

  @ViewChild('screenRef') screenRef!: ElementRef;

  beforeUploadTimeNum = (file: NzUploadFile): boolean => {
    const reader = new FileReader();
    reader.readAsDataURL(file as any);
    reader.onload = () => {
      const base64 = reader.result;
      localStorage.setItem('timeNumAudioData', base64 as string);
      const audioPlayer:any = document.querySelector('#timeNumPlayer');
      const audioData = localStorage.getItem('timeNumAudioData');
      if (audioData && audioPlayer) {
        audioPlayer.src = audioData;
      }
    };
    return false;
  };

  beforeUploadOnlineNum = (file: NzUploadFile): boolean => {
    const reader = new FileReader();
    reader.readAsDataURL(file as any);
    reader.onload = () => {
      const base64 = reader.result;
      localStorage.setItem('onlineNumAudioData', base64 as string);
      const audioPlayer:any = document.querySelector('#onlineNumPlayer');
      const audioData = localStorage.getItem('onlineNumAudioData');
      if (audioData && audioPlayer) {
        audioPlayer.src = audioData;
      }
    };
    return false;
  };

  beforeUploadCountNum = (file: NzUploadFile): boolean => {
    const reader = new FileReader();
    reader.readAsDataURL(file as any);
    reader.onload = () => {
      const base64 = reader.result;
      localStorage.setItem('countNumAudioData', base64 as string);
      const audioPlayer:any = document.querySelector('#countNumPlayer');
      const audioData = localStorage.getItem('countNumAudioData');
      if (audioData && audioPlayer) {
        audioPlayer.src = audioData;
      }
    };
    return false;
  };

  postChannel() {
    this.channelService.channel.postMessage(
      this.channelService.timerState
    );
    this.channelService.updateNotice$.next(true);
  }

  ngOnInit(): void {
    this.controlFormGroup = this.fb.group(Object.assign(this.channelService.timerState, {
      loopGroup: this.fb.array([])
    }));
    this.controlFormGroup = this.fb.group(Object.assign(this.channelService.timerState, {
      onceGroup: this.fb.array([])
    }));
    this.listenControlChange();

    localStorage.removeItem('countNumAudioData');
    localStorage.removeItem('onlineNumAudioData');
    localStorage.removeItem('timeNumAudioData');
    localStorage.removeItem('audioSetting');
  }

  changeVolume(e: Event, key: string) {
    const volume=  (e.target as HTMLAudioElement).volume;
    const isMuted = (e.target as HTMLAudioElement).muted;
    const audioSetting = JSON.parse(localStorage.getItem('audioSetting') || JSON.stringify(({})));
    audioSetting[key] = {
      volume: volume,
      muted: isMuted
    };
    localStorage.setItem('audioSetting', JSON.stringify(audioSetting));
  }

  private  listenControlChange() {
    this.controlFormGroup.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value=>{
      const rawValue = JSON.parse(JSON.stringify(value));
      delete rawValue.screen;
      this.channelService.timerState = Object.assign(
        this.channelService.timerState,
        rawValue
      );
      this.channelService.channel.postMessage(
        this.channelService.timerState
      );
      this.channelService.updateNotice$.next(true);
    });

    this.controlFormGroup.controls['isStartRound'].valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(v=>{
        if(v) {
          const { timeMode, groupMember, onceText } = this.controlFormGroup.getRawValue();
          const fa = this.controlFormGroup.get('onceGroup') as FormArray;
          switch (timeMode) {
            case 'loop':
              break;
            default:
              for (let index = 0; index < groupMember; index++) {
                console.log(fa.at(index).getRawValue())
                this.channelService.addScreen({
                  id: index + 1,
                  isStart: false,
                  isStop: false,
                  text: fa.at(index).getRawValue().text
                  // text: onceText
                });
              }
              if(groupMember) {
                this.screenRef.nativeElement.style.maxHeight = '400px';
                this.panelActive = false;
              }
              break;
          }
        } else {
          this.channelService.timerState.screen = [];
          this.screenRef.nativeElement.style.maxHeight = '0px'
          this.panelActive = true;
        }
      });


    this.controlFormGroup.controls['timeMode'].valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(v=>{
        if(v === 'loop') {
          (this.controlFormGroup.controls['loopGroup'] as FormArray).push(this.fb.group({
            text: ''
          }));
          (this.controlFormGroup.controls['onceGroup'] as FormArray).clear();
        } else {
          (this.controlFormGroup.controls['onceGroup'] as FormArray).push(this.fb.group({
            text: ''
          }));
          (this.controlFormGroup.controls['loopGroup'] as FormArray).clear();
        }
      })
  }

  addOnceGroup() {
    (this.controlFormGroup.controls['onceGroup'] as FormArray).push(this.fb.group({
      text: ''
    }));
    this.controlFormGroup.controls['groupMember'].patchValue(
      (this.controlFormGroup.controls['onceGroup'] as FormArray).length
    );
  }

  removeOnceGroup(index: number) {
    (this.controlFormGroup.controls['onceGroup'] as FormArray).removeAt(index);
    this.controlFormGroup.controls['groupMember'].patchValue(
      (this.controlFormGroup.controls['onceGroup'] as FormArray).length
    );
  }

  addLoopGroup() {
    (this.controlFormGroup.controls['loopGroup'] as FormArray).push(this.fb.group({
      text: ''
    }));
  }

  removeLoopGroup(index: number) {
    (this.controlFormGroup.controls['loopGroup'] as FormArray).removeAt(index);
  }

  startRound() {
    this.controlFormGroup.controls['isStartRound'].patchValue(true);
  }

  endRound() {
    this.controlFormGroup.controls['isStartRound'].patchValue(false);
  }

  pushScreen() {
    this.channelService.timerState['screen'].push({
      id: this.channelService.timerState['screen'].length
    } as any);

    this.postChannel();
  }

  startGroup() {
    this.channelService.timerState['screen'].forEach((item: any) =>{
      item.isStart = true;
      item.isStop = false;
    });
    this.controlFormGroup.controls['isStartGroup'].patchValue(true);
  }

  endGroup() {
    this.channelService.timerState['screen'].forEach((item: any) =>{
      item.isStart = false;
      item.isStop = false;
    });
    this.controlFormGroup.controls['isStartGroup'].patchValue(false);
  }

  stopGroup() {
    this.channelService.timerState['screen'].forEach((item: any) =>{
      item.isStop = true;
      item.isStart = false;
    });
    this.controlFormGroup.controls['isStartGroup'].patchValue(false);
  }

  startTime(id: number) {
    this.channelService.timerState['screen'].forEach((item: any) =>{
      if(item.id === id) {
        item.isStop = false;
        item.isStart = true;
      }
    });
    this.postChannel();
  }

  stopTime(id: number) {
    this.channelService.timerState['screen'].forEach((item: any) =>{
      if(item.id === id) {
        item.isStop = true;
        item.isStart = false;
      }
    });
    this.postChannel();
  }
}
