import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslocoModule } from '@jsverse/transloco';
import { dateToString } from '@vocably/sulna';
import { StreakComponent } from '../streak/streak.component';
import { StudyStreak } from '@vocably/model';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-srs-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.scss'],
  imports: [MatIcon, StreakComponent, TranslocoModule, MatButton],
})
export class SuccessComponent implements OnInit {
  @Input() studyStreak!: StudyStreak | null;
  @Output() oneMoreRound = new EventEmitter();

  streakAnimationShown = false;

  constructor() {}

  ngOnInit(): void {
    if (!this.studyStreak) {
      return;
    }

    const today = dateToString(new Date());
    const lastStreakAnimationShown = localStorage.getItem(
      'streakAnimationShown'
    );
    this.streakAnimationShown = lastStreakAnimationShown === today;
    localStorage.setItem('streakAnimationShown', today);
  }
}
