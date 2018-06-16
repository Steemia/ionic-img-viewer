import {
	DomController,
	NavController,
	NavParams,
	Transition,
	Ion,
	PanGesture,
	Gesture,
	GestureController,
	Config,
	Platform,
	Animation
} from 'ionic-angular';
import { DIRECTION_HORIZONTAL, DIRECTION_VERTICAL } from 'ionic-angular/gestures/hammer';
import {
	AfterViewInit,
	Component,
	ElementRef,
	NgZone,
	OnDestroy,
	OnInit,
	Renderer,
	ViewChild,
	ViewEncapsulation,
} from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SocialSharing } from '@ionic-native/social-sharing';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { Base64ToGallery, Base64ToGalleryOptions } from '@ionic-native/base64-to-gallery';

import { ImageViewerSrcAnimation } from './image-viewer-src-animation';
import { ImageViewerTransitionGesture } from './image-viewer-transition-gesture';
import { ImageViewerZoomGesture } from './image-viewer-zoom-gesture';
import { ImageViewerEnter, ImageViewerLeave } from './image-viewer-transitions';

@Component({
	selector: 'image-viewer',
	template: `
		<ion-header no-border>
			<ion-navbar>
				<ion-buttons end>
					<button ion-button icon-only (click)="downloadImg();">
						<ion-icon name="download"></ion-icon>
					</button>
					<button ion-button icon-only (click)="socialShare();">
						<ion-icon name="share"></ion-icon>              
					</button>
				</ion-buttons>
			</ion-navbar>
		</ion-header>

		<ion-backdrop (click)="bdClick()"></ion-backdrop>

		<div class="image-wrapper">
			<div class="image" #imageContainer>
				<img [src]="imageUrl" tappable #image />
			</div>
		</div>
	`,
	styles: [],
	encapsulation: ViewEncapsulation.None
})
export class ImageViewerComponent extends Ion implements OnInit, OnDestroy, AfterViewInit {
	public imageUrl: SafeUrl;
	private rawUrl: string;

	public dragGesture: ImageViewerTransitionGesture;

	@ViewChild('imageContainer') imageContainer;
	@ViewChild('image') image;

	private pinchGesture: ImageViewerZoomGesture;

	public isZoomed: boolean;

	private unregisterBackButton: Function;

	constructor(
		private base64ToGallery: Base64ToGallery,
		private localNotifications: LocalNotifications,
		private socialSharing: SocialSharing,
		public _gestureCtrl: GestureController,
		public elementRef: ElementRef,
		private _nav: NavController,
		private _zone: NgZone,
		private renderer: Renderer,
		private domCtrl: DomController,
		private platform: Platform,
		private _navParams: NavParams,
		_config: Config,
		private _sanitizer: DomSanitizer
	) {
		super(_config, elementRef, renderer);

		const url = _navParams.get('image');
		this.updateImageSrc(url);
	}

	updateImageSrc(src) {
		this.rawUrl = src;
		this.imageUrl = this._sanitizer.bypassSecurityTrustUrl(src);
	}

	updateImageSrcWithTransition(src) {
		const imageElement = this.image.nativeElement;
		const lowResImgWidth = imageElement.clientWidth;

		this.updateImageSrc(src);

		const animation = new ImageViewerSrcAnimation(this.platform, this.image);
		imageElement.onload = () => animation.scaleFrom(lowResImgWidth);
	}

	ngOnInit() {
		const navPop = () => this._nav.pop();

		this.unregisterBackButton = this.platform.registerBackButtonAction(navPop);
		this._zone.runOutsideAngular(() => this.dragGesture = new ImageViewerTransitionGesture(this.platform, this, this.domCtrl, this.renderer, navPop));
	}

	ngAfterViewInit() {
		// imageContainer is set after the view has been initialized
		this._zone.runOutsideAngular(() => this.pinchGesture = new ImageViewerZoomGesture(this, this.imageContainer, this.platform, this.renderer));
	}

	ngOnDestroy() {
		this.dragGesture && this.dragGesture.destroy();
		this.pinchGesture && this.pinchGesture.destroy();

		this.unregisterBackButton();
	}

	bdClick() {
		if (this._navParams.get('enableBackdropDismiss')) {
			this._nav.pop();
		}
	}

	/**
	 * Shared image in social media
	 * @author Jayser Mendez.
	 */
	socialShare(): void {
		this.socialSharing.share('', '', this.rawUrl).then(() => {
			// Sharing via email is possible
		}).catch(() => {
			// Sharing via email is not possible
		});
	}

	/**
	 * Download opened image to user device
	 * @author Jayser Mendez.
	 */
	downloadImg(): void {

		// Function to generate random name for the image
		const makeid = () => {
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

			for (var i = 0; i < 15; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));

			return text;
		};

		// Function to deliver local notification
		const deliverNotification = (id: number, message: string) => {
			// Deliver a local notification when the image download fail.
			this.localNotifications.schedule({
				id: id,
				text: message,
			});
		};

		const toDataURL = (url, callback) => {
			var xhr = new XMLHttpRequest();
			xhr.onload = () => {
				var reader = new FileReader();
				reader.onloadend = () => {
					callback(reader.result);
				}
				reader.readAsDataURL(xhr.response);
			};
			xhr.open('GET', url);
			xhr.responseType = 'blob';
			xhr.send();
		}

		const img = this.rawUrl.replace('https://steemitimages.com/0x0/', '');

		toDataURL(img, (dataUrl) => {
			// Declare the options of B64 TO GALLERY.
			const options: Base64ToGalleryOptions = { prefix: '_img', mediaScanner: true };

			// Save the image to the gallery/image roll.
			this.base64ToGallery.base64ToGallery(dataUrl, options).then(
				res => {
					// Deliver a local notification when the image is downloaded completely.
					deliverNotification(1, 'Image downloaded and saved to gallery correctly 😏');
				},
				err => {
					// Deliver a local notification when the image download fail.
					deliverNotification(2, 'The image could not be downloaded. Please try again. 😢');
				}
			);
		});


	}
}
