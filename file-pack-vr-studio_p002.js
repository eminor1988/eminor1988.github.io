
  var Module = typeof Module !== 'undefined' ? Module : {};

  if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0;
  }

  Module.expectedDataFileDownloads++;
  (function() {
    // When running as a pthread, FS operations are proxied to the main thread, so we don't need to
    // fetch the .data bundle on the worker
    if (Module['ENVIRONMENT_IS_PTHREAD']) return;
    var loadPackage = function(metadata) {

      var PACKAGE_PATH = '';
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf('/')) + '/');
      } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
        // web worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf('/')) + '/');
      }
      var PACKAGE_NAME = 'file-pack-vr-studio_p002.data';
      var REMOTE_PACKAGE_BASE = 'file-pack-vr-studio_p002.data';
      if (typeof Module['locateFilePackage'] === 'function' && !Module['locateFile']) {
        Module['locateFile'] = Module['locateFilePackage'];
        err('warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)');
      }
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];

      function fetchRemotePackage(packageName, packageSize, callback, errback) {
        if (typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string') {
          require('fs').readFile(packageName, function(err, contents) {
            if (err) {
              errback(err);
            } else {
              callback(contents.buffer);
            }
          });
          return;
        }
        var xhr = new XMLHttpRequest();
        xhr.open('GET', packageName, true);
        xhr.responseType = 'arraybuffer';
        xhr.onprogress = function(event) {
          var url = packageName;
          var size = packageSize;
          if (event.total) size = event.total;
          if (event.loaded) {
            if (!xhr.addedTotal) {
              xhr.addedTotal = true;
              if (!Module.dataFileDownloads) Module.dataFileDownloads = {};
              Module.dataFileDownloads[url] = {
                loaded: event.loaded,
                total: size
              };
            } else {
              Module.dataFileDownloads[url].loaded = event.loaded;
            }
            var total = 0;
            var loaded = 0;
            var num = 0;
            for (var download in Module.dataFileDownloads) {
            var data = Module.dataFileDownloads[download];
              total += data.total;
              loaded += data.loaded;
              num++;
            }
            total = Math.ceil(total * Module.expectedDataFileDownloads/num);
            if (Module['setStatus']) Module['setStatus']('Downloading data... (' + loaded + '/' + total + ')');
          } else if (!Module.dataFileDownloads) {
            if (Module['setStatus']) Module['setStatus']('Downloading data...');
          }
        };
        xhr.onerror = function(event) {
          throw new Error("NetworkError for: " + packageName);
        }
        xhr.onload = function(event) {
          if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            var packageData = xhr.response;
            callback(packageData);
          } else {
            throw new Error(xhr.statusText + " : " + xhr.responseURL);
          }
        };
        xhr.send(null);
      };

      function handleError(error) {
        console.error('package error:', error);
      };

      var fetchedCallback = null;
      var fetched = Module['getPreloadedPackage'] ? Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;

      if (!fetched) fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
        if (fetchedCallback) {
          fetchedCallback(data);
          fetchedCallback = null;
        } else {
          fetched = data;
        }
      }, handleError);

    function runWithFS() {

      function assert(check, msg) {
        if (!check) throw msg + new Error().stack;
      }
Module['FS_createPath']("/", "p002", true, true);
Module['FS_createPath']("/p002", "bin", true, true);
Module['FS_createPath']("/p002/bin", "img", true, true);
Module['FS_createPath']("/p002/bin", "lib", true, true);
Module['FS_createPath']("/p002/bin", "se", true, true);
Module['FS_createPath']("/p002/bin", "songs", true, true);

      /** @constructor */
      function DataRequest(start, end, audio) {
        this.start = start;
        this.end = end;
        this.audio = audio;
      }
      DataRequest.prototype = {
        requests: {},
        open: function(mode, name) {
          this.name = name;
          this.requests[name] = this;
          Module['addRunDependency']('fp ' + this.name);
        },
        send: function() {},
        onload: function() {
          var byteArray = this.byteArray.subarray(this.start, this.end);
          this.finish(byteArray);
        },
        finish: function(byteArray) {
          var that = this;
          // canOwn this data in the filesystem, it is a slide into the heap that will never change
          Module['FS_createDataFile'](this.name, null, byteArray, true, true, true);
          Module['removeRunDependency']('fp ' + that.name);
          this.requests[this.name] = null;
        }
      };

      var files = metadata['files'];
      for (var i = 0; i < files.length; ++i) {
        new DataRequest(files[i]['start'], files[i]['end'], files[i]['audio'] || 0).open('GET', files[i]['filename']);
      }

      function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer instanceof ArrayBuffer, 'bad input to processPackageData');
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        // Reuse the bytearray from the XHR as the source for file reads.
          DataRequest.prototype.byteArray = byteArray;
          var files = metadata['files'];
          for (var i = 0; i < files.length; ++i) {
            DataRequest.prototype.requests[files[i].filename].onload();
          }          Module['removeRunDependency']('datafile_file-pack-vr-studio_p002.data');

      };
      Module['addRunDependency']('datafile_file-pack-vr-studio_p002.data');

      if (!Module.preloadResults) Module.preloadResults = {};

      Module.preloadResults[PACKAGE_NAME] = {fromCache: false};
      if (fetched) {
        processPackageData(fetched);
        fetched = null;
      } else {
        fetchedCallback = processPackageData;
      }

    }
    if (Module['calledRun']) {
      runWithFS();
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module["preRun"].push(runWithFS); // FS is not initialized yet, wait for it
    }

    }
    loadPackage({"files": [{"filename": "/p002/app.sxap", "start": 0, "end": 2792}, {"filename": "/p002/COPYRIGHT.txt", "start": 2792, "end": 51608}, {"filename": "/p002/CREDITS.txt", "start": 51608, "end": 51858}, {"filename": "/p002/README.txt", "start": 51858, "end": 51906}, {"filename": "/p002/bin/functorPreRender.sxjs", "start": 51906, "end": 52761}, {"filename": "/p002/bin/functorPreRender_.sxjs", "start": 52761, "end": 53572}, {"filename": "/p002/bin/functorRender.sxjs", "start": 53572, "end": 119578}, {"filename": "/p002/bin/functorUpdate.sxjs", "start": 119578, "end": 332978}, {"filename": "/p002/bin/program.sxjs", "start": 332978, "end": 339100}, {"filename": "/p002/bin/img/avatar_empty.sxip", "start": 339100, "end": 339692}, {"filename": "/p002/bin/img/bg_song_sel.sxij", "start": 339692, "end": 664623}, {"filename": "/p002/bin/img/black.sxip", "start": 664623, "end": 664742}, {"filename": "/p002/bin/img/button.sxip", "start": 664742, "end": 666019}, {"filename": "/p002/bin/img/cover.sxij", "start": 666019, "end": 912444}, {"filename": "/p002/bin/img/hline.sxip", "start": 912444, "end": 914352}, {"filename": "/p002/bin/img/hline1.sxip", "start": 914352, "end": 914626}, {"filename": "/p002/bin/img/logo.sxip", "start": 914626, "end": 1044288}, {"filename": "/p002/bin/img/mirrorMRA.sxip", "start": 1044288, "end": 1044407}, {"filename": "/p002/bin/img/note.sxip", "start": 1044407, "end": 1077386}, {"filename": "/p002/bin/img/note2.sxip", "start": 1077386, "end": 1080177}, {"filename": "/p002/bin/img/particle.sxip", "start": 1080177, "end": 1122804}, {"filename": "/p002/bin/img/selRect.sxip", "start": 1122804, "end": 1136436}, {"filename": "/p002/bin/lib/global.sxjs", "start": 1136436, "end": 1155786}, {"filename": "/p002/bin/lib/langEnUs.sxjs", "start": 1155786, "end": 1162235}, {"filename": "/p002/bin/lib/langJaJp.sxjs", "start": 1162235, "end": 1169331}, {"filename": "/p002/bin/lib/langZhCn.sxjs", "start": 1169331, "end": 1175763}, {"filename": "/p002/bin/lib/langZhTw.sxjs", "start": 1175763, "end": 1182198}, {"filename": "/p002/bin/se/enter.sxsa", "start": 1182198, "end": 1188524}, {"filename": "/p002/bin/se/selection.sxsa", "start": 1188524, "end": 1193979}, {"filename": "/p002/bin/se/tap.sxsa", "start": 1193979, "end": 1200076}, {"filename": "/p002/bin/se/tap_hit.sxsa", "start": 1200076, "end": 1205323}, {"filename": "/p002/bin/se/tap_miss.sxsa", "start": 1205323, "end": 1212516}, {"filename": "/p002/bin/songs/apocalypse.1.sxsc", "start": 1212516, "end": 1213792}, {"filename": "/p002/bin/songs/apocalypse.2.sxsc", "start": 1213792, "end": 1216164}, {"filename": "/p002/bin/songs/apocalypse.3.sxsc", "start": 1216164, "end": 1218880}, {"filename": "/p002/bin/songs/apocalypse.sxjn", "start": 1218880, "end": 1219361}, {"filename": "/p002/bin/songs/apocalypse.sxsa", "start": 1219361, "end": 2169442}, {"filename": "/p002/bin/songs/apocalypse.sxspect", "start": 2169442, "end": 2875635}, {"filename": "/p002/bin/songs/blue_rain.sxsa", "start": 2875635, "end": 5353488}, {"filename": "/p002/bin/songs/blue_rain.sxspect", "start": 5353488, "end": 7270493}, {"filename": "/p002/bin/songs/bumper_harvest.1.sxsc", "start": 7270493, "end": 7272449}, {"filename": "/p002/bin/songs/bumper_harvest.2.sxsc", "start": 7272449, "end": 7274797}, {"filename": "/p002/bin/songs/bumper_harvest.3.sxsc", "start": 7274797, "end": 7277537}, {"filename": "/p002/bin/songs/bumper_harvest.sxjn", "start": 7277537, "end": 7278025}, {"filename": "/p002/bin/songs/bumper_harvest.sxsa", "start": 7278025, "end": 8903918}, {"filename": "/p002/bin/songs/bumper_harvest.sxspect", "start": 8903918, "end": 9607815}, {"filename": "/p002/bin/songs/dancing_wind.1.sxsc", "start": 9607815, "end": 9609851}, {"filename": "/p002/bin/songs/dancing_wind.2.sxsc", "start": 9609851, "end": 9613031}, {"filename": "/p002/bin/songs/dancing_wind.3.sxsc", "start": 9613031, "end": 9616659}, {"filename": "/p002/bin/songs/dancing_wind.sxjn", "start": 9616659, "end": 9617133}, {"filename": "/p002/bin/songs/dancing_wind.sxsa", "start": 9617133, "end": 11588096}, {"filename": "/p002/bin/songs/dancing_wind.sxspect", "start": 11588096, "end": 12433361}, {"filename": "/p002/bin/songs/fight_it_out.1.sxsc", "start": 12433361, "end": 12438597}, {"filename": "/p002/bin/songs/fight_it_out.2.sxsc", "start": 12438597, "end": 12444761}, {"filename": "/p002/bin/songs/fight_it_out.3.sxsc", "start": 12444761, "end": 12453101}, {"filename": "/p002/bin/songs/fight_it_out.sxjn", "start": 12453101, "end": 12453578}, {"filename": "/p002/bin/songs/fight_it_out.sxsa", "start": 12453578, "end": 16377164}, {"filename": "/p002/bin/songs/fight_it_out.sxspect", "start": 16377164, "end": 18340417}, {"filename": "/p002/bin/songs/fortitude.1.sxsc", "start": 18340417, "end": 18344941}, {"filename": "/p002/bin/songs/fortitude.2.sxsc", "start": 18344941, "end": 18350961}, {"filename": "/p002/bin/songs/fortitude.3.sxsc", "start": 18350961, "end": 18357997}, {"filename": "/p002/bin/songs/fortitude.sxjn", "start": 18357997, "end": 18358465}, {"filename": "/p002/bin/songs/fortitude.sxsa", "start": 18358465, "end": 22379172}, {"filename": "/p002/bin/songs/fortitude.sxspect", "start": 22379172, "end": 24498225}, {"filename": "/p002/bin/songs/guerrilla_warfare.1.sxsc", "start": 24498225, "end": 24499909}, {"filename": "/p002/bin/songs/guerrilla_warfare.2.sxsc", "start": 24499909, "end": 24501833}, {"filename": "/p002/bin/songs/guerrilla_warfare.3.sxsc", "start": 24501833, "end": 24504117}, {"filename": "/p002/bin/songs/guerrilla_warfare.sxjn", "start": 24504117, "end": 24504617}, {"filename": "/p002/bin/songs/guerrilla_warfare.sxsa", "start": 24504617, "end": 26128609}, {"filename": "/p002/bin/songs/guerrilla_warfare.sxspect", "start": 26128609, "end": 26933694}, {"filename": "/p002/bin/songs/morning_light.1.sxsc", "start": 26933694, "end": 26935362}, {"filename": "/p002/bin/songs/morning_light.2.sxsc", "start": 26935362, "end": 26937318}, {"filename": "/p002/bin/songs/morning_light.3.sxsc", "start": 26937318, "end": 26940722}, {"filename": "/p002/bin/songs/morning_light.sxjn", "start": 26940722, "end": 26941197}, {"filename": "/p002/bin/songs/morning_light.sxsa", "start": 26941197, "end": 28360762}, {"filename": "/p002/bin/songs/morning_light.sxspect", "start": 28360762, "end": 29265723}, {"filename": "/p002/bin/songs/new_age.1.sxsc", "start": 29265723, "end": 29270095}, {"filename": "/p002/bin/songs/new_age.2.sxsc", "start": 29270095, "end": 29274635}, {"filename": "/p002/bin/songs/new_age.3.sxsc", "start": 29274635, "end": 29280383}, {"filename": "/p002/bin/songs/new_age.sxjn", "start": 29280383, "end": 29280864}, {"filename": "/p002/bin/songs/new_age.sxsa", "start": 29280864, "end": 32242080}, {"filename": "/p002/bin/songs/new_age.sxspect", "start": 32242080, "end": 34086597}, {"filename": "/p002/bin/songs/new_age_piano_arrangement.1.sxsc", "start": 34086597, "end": 34090473}, {"filename": "/p002/bin/songs/new_age_piano_arrangement.2.sxsc", "start": 34090473, "end": 34095069}, {"filename": "/p002/bin/songs/new_age_piano_arrangement.3.sxsc", "start": 34095069, "end": 34101161}, {"filename": "/p002/bin/songs/new_age_piano_arrangement.sxjn", "start": 34101161, "end": 34101715}, {"filename": "/p002/bin/songs/new_age_piano_arrangement.sxsa", "start": 34101715, "end": 36833583}, {"filename": "/p002/bin/songs/new_age_piano_arrangement.sxspect", "start": 36833583, "end": 38814712}, {"filename": "/p002/bin/songs/old_age.1.sxsc", "start": 38814712, "end": 38819484}, {"filename": "/p002/bin/songs/old_age.2.sxsc", "start": 38819484, "end": 38824936}, {"filename": "/p002/bin/songs/old_age.3.sxsc", "start": 38824936, "end": 38831740}, {"filename": "/p002/bin/songs/old_age.sxjn", "start": 38831740, "end": 38832218}, {"filename": "/p002/bin/songs/old_age.sxsa", "start": 38832218, "end": 41104797}, {"filename": "/p002/bin/songs/old_age.sxspect", "start": 41104797, "end": 42798762}, {"filename": "/p002/bin/songs/on_the_beautiful_street.1.sxsc", "start": 42798762, "end": 42800294}, {"filename": "/p002/bin/songs/on_the_beautiful_street.2.sxsc", "start": 42800294, "end": 42802074}, {"filename": "/p002/bin/songs/on_the_beautiful_street.3.sxsc", "start": 42802074, "end": 42804030}, {"filename": "/p002/bin/songs/on_the_beautiful_street.sxjn", "start": 42804030, "end": 42804566}, {"filename": "/p002/bin/songs/on_the_beautiful_street.sxsa", "start": 42804566, "end": 44022951}, {"filename": "/p002/bin/songs/on_the_beautiful_street.sxspect", "start": 44022951, "end": 44804912}, {"filename": "/p002/bin/songs/opportunity.1.sxsc", "start": 44804912, "end": 44808428}, {"filename": "/p002/bin/songs/opportunity.2.sxsc", "start": 44808428, "end": 44812824}, {"filename": "/p002/bin/songs/opportunity.3.sxsc", "start": 44812824, "end": 44817468}, {"filename": "/p002/bin/songs/opportunity.sxjn", "start": 44817468, "end": 44817968}, {"filename": "/p002/bin/songs/opportunity.sxsa", "start": 44817968, "end": 47357069}, {"filename": "/p002/bin/songs/opportunity.sxspect", "start": 47357069, "end": 48572482}, {"filename": "/p002/bin/songs/sigh_of_left_hander.1.sxsc", "start": 48572482, "end": 48574334}, {"filename": "/p002/bin/songs/sigh_of_left_hander.2.sxsc", "start": 48574334, "end": 48577002}, {"filename": "/p002/bin/songs/sigh_of_left_hander.3.sxsc", "start": 48577002, "end": 48580134}, {"filename": "/p002/bin/songs/sigh_of_left_hander.sxjn", "start": 48580134, "end": 48580651}, {"filename": "/p002/bin/songs/sigh_of_left_hander.sxsa", "start": 48580651, "end": 49451526}, {"filename": "/p002/bin/songs/sigh_of_left_hander.sxspect", "start": 49451526, "end": 50468335}, {"filename": "/p002/bin/songs/the_dream_dying_away.1.sxsc", "start": 50468335, "end": 50471571}, {"filename": "/p002/bin/songs/the_dream_dying_away.2.sxsc", "start": 50471571, "end": 50477911}, {"filename": "/p002/bin/songs/the_dream_dying_away.3.sxsc", "start": 50477911, "end": 50484763}, {"filename": "/p002/bin/songs/the_dream_dying_away.sxjn", "start": 50484763, "end": 50485266}, {"filename": "/p002/bin/songs/the_dream_dying_away.sxsa", "start": 50485266, "end": 54756450}, {"filename": "/p002/bin/songs/the_dream_dying_away.sxspect", "start": 54756450, "end": 56762507}, {"filename": "/p002/bin/songs/throbbing_heart.1.sxsc", "start": 56762507, "end": 56767103}, {"filename": "/p002/bin/songs/throbbing_heart.2.sxsc", "start": 56767103, "end": 56772619}, {"filename": "/p002/bin/songs/throbbing_heart.3.sxsc", "start": 56772619, "end": 56779495}, {"filename": "/p002/bin/songs/throbbing_heart.sxjn", "start": 56779495, "end": 56779975}, {"filename": "/p002/bin/songs/throbbing_heart.sxsa", "start": 56779975, "end": 60899101}, {"filename": "/p002/bin/songs/throbbing_heart.sxspect", "start": 60899101, "end": 62774286}, {"filename": "/p002/bin/songs/thundering_war_drums.1.sxsc", "start": 62774286, "end": 62775162}, {"filename": "/p002/bin/songs/thundering_war_drums.2.sxsc", "start": 62775162, "end": 62776318}, {"filename": "/p002/bin/songs/thundering_war_drums.3.sxsc", "start": 62776318, "end": 62778154}, {"filename": "/p002/bin/songs/thundering_war_drums.sxjn", "start": 62778154, "end": 62778663}, {"filename": "/p002/bin/songs/thundering_war_drums.sxsa", "start": 62778663, "end": 63488694}, {"filename": "/p002/bin/songs/thundering_war_drums.sxspect", "start": 63488694, "end": 63833595}, {"filename": "/p002/bin/songs/undercurrent.1.sxsc", "start": 63833595, "end": 63837631}, {"filename": "/p002/bin/songs/undercurrent.2.sxsc", "start": 63837631, "end": 63842515}, {"filename": "/p002/bin/songs/undercurrent.3.sxsc", "start": 63842515, "end": 63848207}, {"filename": "/p002/bin/songs/undercurrent.sxjn", "start": 63848207, "end": 63848696}, {"filename": "/p002/bin/songs/undercurrent.sxsa", "start": 63848696, "end": 67434538}, {"filename": "/p002/bin/songs/undercurrent.sxspect", "start": 67434538, "end": 69129487}], "remote_package_size": 69129487});

  })();
