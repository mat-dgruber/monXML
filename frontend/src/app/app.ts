import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FileUpload } from './components/file-upload/file-upload';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, FileUpload],
  standalone: true,
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
