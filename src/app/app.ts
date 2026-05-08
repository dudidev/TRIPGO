import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChatFlotante } from './shared/chat-flotante/chat-flotante';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ChatFlotante],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('TripGO');
}