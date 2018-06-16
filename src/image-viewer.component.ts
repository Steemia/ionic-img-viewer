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
import { FileTransfer, FileUploadOptions, FileTransferObject } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { LocalNotifications } from '@ionic-native/local-notifications';

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
		private localNotifications: LocalNotifications,
		private transfer: FileTransfer,
		private file: File,
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

		const fileTransfer: FileTransferObject = this.transfer.create();

		fileTransfer.download(encodeURI(this.rawUrl), this.file.dataDirectory + makeid() + '.jpg').then((entry) => {
			// Deliver a local notification when the image is downloaded completely.
			this.localNotifications.schedule({
				id: 1,
				text: 'Image downloaded correctly 😏',
			});
			// console.log('download complete: ' + entry.toURL());
		}, (error) => {
			// handle error
		});

	}
}
