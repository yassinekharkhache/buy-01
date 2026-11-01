import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideBar } from '../components/side-bar/side-bar';

@Component({
  imports: [RouterOutlet,SideBar],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {}
