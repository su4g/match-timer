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
    NzGridModule
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

  get timerState() {
    return this.channelService.timerState
  }

  @ViewChild('screenRef') screenRef!: ElementRef;

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
    this.listenControlChange();
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
          switch (timeMode) {
            case 'loop':
              break;
            default:
              for (let index = 0; index < groupMember; index++) {
                this.channelService.addScreen({
                  id: index + 1,
                  isStart: false,
                  isStop: false,
                  text: onceText
                });
              }
              if(groupMember) {
                this.screenRef.nativeElement.style.maxHeight = '300px'
              }
              break;
          }
        } else {
          this.channelService.timerState.screen = [];
          this.screenRef.nativeElement.style.maxHeight = '0px'
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
        } else {
          (this.controlFormGroup.controls['loopGroup'] as FormArray).clear();
        }
      })
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
