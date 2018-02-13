import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';
import PouchDB from 'pouchdb';


@Injectable()
export class Database {

  private _DB: any;
  private success: boolean = true;
  private _remoteDB: any;
  private _syncOpts: any;
  constructor(public http: Http,
    public alertCtrl: AlertController) {
    this.initialiseDB();
  }



  initialiseDB() {
    this._DB = new PouchDB('comics');
    this._remoteDB = 'http://admin:password@localhost:5984/comics';
    this._syncOpts = {
      live: true,
      retry: true,
      continuous: true
    };
    this._DB.sync(this._remoteDB, this._syncOpts)
      .on('change', (info) => {
        console.log('Handling syncing change');
        console.dir(info);
      })
      .on('paused', (info) => {
        console.log('Handling syncing pause');
        console.dir(info);
      })
      .on('active', (info) => {
        console.log('Handling syncing resumption');
        console.dir(info);
      })
      .on('denied', (err) => {
        console.log('Handling syncing denied');
        console.dir(err);
      })
      .on('complete', (info) => {
        console.log('Handling syncing complete');
        console.dir(info);
      })
      .on('error', (err) => {
        console.log('Handling syncing error');
        console.dir(err);
      });
  }

  handleSyncing() {
    this._DB.changes({
      since: 'now',
      live: true,
      include_docs: true,
      attachments: true
    })
      .on('change', (change) => {
        // handle change
        console.log('Handling change');
        console.dir(change);
      })
      .on('complete', (info) => {
        // changes() was canceled
        console.log('Changes complete');
        console.dir(info);
      })
      .on('error', (err) => {
        console.log('Changes error');
        console.log(err);
      });
  }

  addComic(title, character, rating, note) {
    var timeStamp = new Date().toISOString(),

      comic = {
        _id: timeStamp,
        title: title,
        character: character,
        rating: rating,
        note: note,
        _attachments: {
        }
      };

    return new Promise(resolve => {
      this._DB.put(comic).catch((err) => {
        this.success = false;
      });

      if (this.success) {
        this.handleSyncing();
        resolve(true);
      }

    });
  }



  updateComic(id, title, character, rating, note, revision) {

    var comic = {
      _id: id,
      _rev: revision,
      title: title,
      character: character,
      rating: rating,
      note: note,
      _attachments: {
      }
    };

    return new Promise(resolve => {
      this._DB.put(comic)
        .catch((err) => {
          this.success = false;
        });

      if (this.success) {
        this.handleSyncing();
        resolve(true);
      }
    });
  }



  retrieveComic(id) {
    return new Promise(resolve => {
      this._DB.get(id, { attachments: true })
        .then((doc) => {
          var item = [],

            attachment;

          if (doc._attachments) {
            attachment = '';
          }

          item.push(
            {
              id: id,
              rev: doc._rev,
              character: doc.character,
              title: doc.title,
              note: doc.note,
              rating: doc.rating
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

            attachment;

          if (item._attachments) {
            attachment = '';
          }

          items.push(
            {
              id: item._id,
              rev: item._rev,
              character: item.character,
              title: item.title,
              note: item.note,
              rating: item.rating
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