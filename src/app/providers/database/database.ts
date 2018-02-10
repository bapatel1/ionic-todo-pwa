import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';


@Injectable()
export class Database {

  private _DB: any;
  private success: boolean = true;

  constructor(public http: Http,
    public alertCtrl: AlertController) {
    this.initialiseDB();
  }



  initialiseDB() {
    this._DB = new PouchDB('comics');
  }



  addComic(title, character, rating, note, image) {
    var timeStamp = new Date().toISOString(),
      base64String = image.substring(23),
      comic = {
        _id: timeStamp,
        title: title,
        character: character,
        rating: rating,
        note: note,
        _attachments: {
          "character.jpg": {
            content_type: 'image/jpeg',
            data: base64String
          }
        }
      };

    return new Promise(resolve => {
      this._DB.put(comic).catch((err) => {
        this.success = false;
      });

      resolve(true);

    });
  }



  updateComic(id, title, character, rating, note, image, revision) {
    var base64String = image.substring(23),
      comic = {
        _id: id,
        _rev: revision,
        title: title,
        character: character,
        rating: rating,
        note: note,
        _attachments: {
          "character.jpg": {
            content_type: 'image/jpeg',
            data: base64String
          }
        }
      };

    return new Promise(resolve => {
      this._DB.put(comic)
        .catch((err) => {
          this.success = false;
        });

      if (this.success) {
        resolve(true);
      }
    });
  }



  retrieveComic(id) {
    return new Promise(resolve => {
      this._DB.get(id, { attachments: true })
        .then((doc) => {
          var item = [],
            dataURIPrefix = 'data:image/jpeg;base64,',
            attachment;

          if (doc._attachments) {
            attachment = doc._attachments["character.jpg"].data;
          }

          item.push(
            {
              id: id,
              rev: doc._rev,
              character: doc.character,
              title: doc.title,
              note: doc.note,
              rating: doc.rating,
              image: dataURIPrefix + attachment
            });
          resolve(item);
        })
    });
  }




  retrieveComics() {
    return new Promise(resolve => {
      this._DB.allDocs({ include_docs: true, descending: true, attachments: true }, function (err, doc) {
        console.log(err);
        console.log(doc);

        let k,
          items = [],
          row = doc.rows;

        for (k in row) {
          var item = row[k].doc,
            dataURIPrefix = 'data:image/jpeg;base64,',
            attachment;

          if (item._attachments) {
            attachment = dataURIPrefix + item._attachments["character.jpg"].data;
          }

          items.push(
            {
              id: item._id,
              rev: item._rev,
              character: item.character,
              title: item.title,
              note: item.note,
              rating: item.rating,
              image: attachment
            });
        }
        resolve(items);
      });
    });
  }



  removeComic(id, rev) {
    return new Promise(resolve => {
      var comic = { _id: id, _rev: rev };

      this._DB.remove(comic)
        .catch((err) => {
          this.success = false;
        });

      if (this.success) {
        resolve(true);
      }
    });
  }



  errorHandler(err) {
    let headsUp = this.alertCtrl.create({
      title: 'Heads Up!',
      subTitle: err,
      buttons: ['Got It!']
    });

    headsUp.present();
  }


}