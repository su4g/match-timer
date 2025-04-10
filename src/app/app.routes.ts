import { Routes } from '@angular/router';
import { ControlComponent } from './control/control.component';
import { ScreenComponent } from './screen/screen.component';

export const routes: Routes = [
    {
        path: 'control',
        component: ControlComponent
    },
    {
        path: 'screen',
        component: ScreenComponent
    },
    {
        path: 'screen/:id',
        component: ScreenComponent
    },
    { path: '', redirectTo: 'control', pathMatch: 'full' },
];
