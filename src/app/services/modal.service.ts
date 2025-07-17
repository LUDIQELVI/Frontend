import { Injectable, Inject } from '@angular/core';
import { isPlatformBrowser} from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  triggerLoginModal() {
    if (isPlatformBrowser(this.platformId)) {
      const loginModal = document.getElementById('loginModal');
      if (loginModal && (window as any).M && (window as any).M.Modal) {
        const modalInstance = (window as any).M.Modal.getInstance(loginModal);
        modalInstance?.open();
      }
    }
  }
}