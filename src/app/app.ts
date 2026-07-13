import { Component } from '@angular/core';
import { ChangeInfo } from './changeinfo/changeinfo';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html'
})
export class App { }