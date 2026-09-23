import { NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../header/header.component';
import { isExtensionInstalled$ } from '../../../isExtensionInstalled';
import { CarouselComponent } from '../../carousel/carousel.component';
import { SignUpComponent } from '../../sign-up/sign-up.component';

@Component({
  selector: 'app-sign-up-page',
  templateUrl: './sign-up-page.component.html',
  imports: [
    NgIf,
    TranslocoModule,
    HeaderComponent,
    CarouselComponent,
    SignUpComponent,
  ],
})
export class SignUpPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroy$ = new Subject();

  @ViewChild('formAnchor') formAnchor?: ElementRef<HTMLElement>;

  // Undefined until the first ping answers, so the carousel doesn't flash on
  // a page the extension isn't installed for.
  public isExtensionInstalled: boolean | undefined = undefined;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    isExtensionInstalled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isInstalled) => {
        this.isExtensionInstalled = isInstalled;
      });
  }

  ngAfterViewInit(): void {
    // The sign in page links here with #form when the visitor asked for the
    // sign up form, which otherwise sits below the carousel, out of sight.
    if (this.route.snapshot.fragment !== 'form') {
      return;
    }

    setTimeout(() =>
      this.formAnchor?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
    this.destroy$.complete();
  }
}
