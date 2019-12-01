import { Component, OnInit } from '@angular/core';
import { ApiService } from 'src/app/api/api.service';

import { Validators, FormBuilder, FormGroup, FormControl } from '@angular/forms';
import { FeedProviderService } from '../services/feed.provider.service';

import { LoadingController, ModalController } from '@ionic/angular';


@Component({
  selector: 'app-feed-upload',
  templateUrl: './feed-upload.component.html',
  styleUrls: ['./feed-upload.component.scss'],
})
export class FeedUploadComponent implements OnInit {
  previewDataUrl;
  file: File;
  uploadForm: FormGroup;

  constructor(
    private feed: FeedProviderService,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController,
    private modalController: ModalController
  ) { }

  ngOnInit() {
    this.uploadForm = this.formBuilder.group({
      caption: new FormControl('', Validators.required)
    });
  }

  // fix per: https://github.com/ionic-team/capacitor/issues/1564#issuecomment-538200971

  privateFileReader(): FileReader {
    const fileReader = new FileReader();
    const zoneOriginalInstance = (fileReader as any)["__zone_symbol__originalInstance"];
    return zoneOriginalInstance || fileReader;
  }

  setPreviewDataUrl(file: Blob) {
    const reader  = this.privateFileReader();
    reader.onloadend = (event) => {
      this.previewDataUrl = reader.result;
    };
    reader.readAsDataURL(file);
  }

  selectImage(event) {
    const file = event.srcElement.files;

    if (!file) {
      console.log(`Invalid file!`);
      return;
    }
    this.file = file[0];

    this.setPreviewDataUrl(this.file);

  }

  onSubmit($event) {
    $event.preventDefault();
    this.loadingController.create();

    if (!this.uploadForm.valid || !this.file) { return; }
    this.feed.uploadFeedItem(this.uploadForm.controls.caption.value, this.file)
      .then((result) => {
        this.modalController.dismiss();
        this.loadingController.dismiss();
      });
  }

  cancel() {
    this.modalController.dismiss();
  }
}
