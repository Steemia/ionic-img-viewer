import { DomController, NavController, NavParams, Ion, GestureController, Config, Platform } from 'ionic-angular';
import { AfterViewInit, ElementRef, NgZone, OnDestroy, OnInit, Renderer } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { SocialSharing } from '@ionic-native/social-sharing';
import { FileTransfer } from '@ionic-native/file-transfer';
import { File } from '@ionic-native/file';
import { LocalNotifications } from '@ionic-native/local-notifications';
import { ImageViewerTransitionGesture } from './image-viewer-transition-gesture';
export declare class ImageViewerComponent extends Ion implements OnInit, OnDestroy, AfterViewInit {
    private localNotifications;
    private transfer;
    private file;
    private socialSharing;
    _gestureCtrl: GestureController;
    elementRef: ElementRef;
    private _nav;
    private _zone;
    private renderer;
    private domCtrl;
    private platform;
    private _navParams;
    private _sanitizer;
    imageUrl: SafeUrl;
    private rawUrl;
    dragGesture: ImageViewerTransitionGesture;
    imageContainer: any;
    image: any;
    private pinchGesture;
    isZoomed: boolean;
    private unregisterBackButton;
    constructor(localNotifications: LocalNotifications, transfer: FileTransfer, file: File, socialSharing: SocialSharing, _gestureCtrl: GestureController, elementRef: ElementRef, _nav: NavController, _zone: NgZone, renderer: Renderer, domCtrl: DomController, platform: Platform, _navParams: NavParams, _config: Config, _sanitizer: DomSanitizer);
    updateImageSrc(src: any): void;
    updateImageSrcWithTransition(src: any): void;
    ngOnInit(): void;
    ngAfterViewInit(): void;
    ngOnDestroy(): void;
    bdClick(): void;
    /**
     * Shared image in social media
     * @author Jayser Mendez.
     */
    socialShare(): void;
    /**
     * Download opened image to user device
     * @author Jayser Mendez.
     */
    downloadImg(): void;
}
