var HermodService = require('./HermodService')

  
const record = require('node-record-lpcm16');
const Detector = require('snowboy').Detector;
const Models = require('snowboy').Models;

var speaker = require('speaker')
var stream = require('stream') 
var Readable = stream.Readable;
var WaveFile = require('wavefile')
var Wav = require('wav')

class HermodHotwordService extends HermodService  {

    constructor(props) {
        super(props);
        let that = this;
        this.callbackIds = {};
		this.listening = {};
		this.silent = {};
		this.messageCount = {};
		
		this.mqttStreams = {};
		this.audioBuffers = {};
		this.audioDump = {}
		
        let eventFunctions = {
        // SESSION
            'hermod/+/hotword/start' : function(topic,siteId,payload) {
				// TODO access control check siteId against props siteId or siteIds
				//console.log('hermod/+/hotword/start')
				that.listening[siteId] = true;
				that.messageCount[siteId]=0;
				that.startMqttListener(siteId)
		    }
		    ,
		    'hermod/+/hotword/stop' : function(topic,siteId,payload) {
				that.listening[siteId] = false;
				that.stopMqttListener(siteId)
		    }
        }
		
        this.manager = this.connectToManager(props.manager,eventFunctions);

    }
    
    startMqttListener(siteId) {
		let that = this;
		// subscribe to audio packets
		// use siteId from start message
		let callbacks = {}
		callbacks['hermod/'+siteId+'/microphone/audio'] = this.onAudioMessage.bind(this)
		this.callbackIds[siteId] = this.manager.addCallbacks(callbacks)
		
		// LOGGING
		var FileWriter = require('wav').FileWriter;	
		//var outputFileStream = new FileWriter('./hotword.wav', {
		  //sampleRate: 16000,
		  //channels: 1
		//});
		this.audioDump[siteId] = new FileWriter('./hotword.wav', {
		  sampleRate: 16000,
		  channels: 1
		});
		//new Readable()
		//this.audioDump[siteId]._read = () => {} // _read is required but you can noop it
		//this.audioDump[siteId].pipe(outputFileStream) // consume the stream
				
				
		/**	
		 * Hotword
		 */

		
		const Detector = require('snowboy').Detector;
		const Models = require('snowboy').Models;
		var silent = {};
		 // snowboy setup
		var models = new Models();
		//if (typeof this.props.models !== 'object') throw new Exception('Missing hotword configuration for models')
		this.props.models.map(function(thisModel) {
			models.add(thisModel);
		})

		var detector = new Detector(Object.assign({models:models},this.props.detector));
		//detector.on('silence', function () {
		  //if (!silent[siteId]) console.log('silence '+siteId);
		  //silent[siteId] = true;
		//});

		//detector.on('sound', function (buffer) {
		  //if (silent[siteId])  console.log(['sound '+siteId,buffer.length]);
		  //silent[siteId] = false;		  // <buffer> contains the last chunk of the audio that triggers the "sound"
		  //// event. It could be written to a wav stream.
		  ////console.log('sound');
		//});

		detector.on('error', function () {
		  console.log('error');
		});

		detector.on('hotword', function (index, hotword, buffer) {
		  console.log(['hotword '+siteId, index, hotword]);
		//	that.sendMqtt('hermod/'+siteId+'/microphone/stop',{})
				//let wav = new WaveFile();
				//console.log('write file and add wav header',siteId,that.audioBuffers[siteId].length)
				//wav.fromScratch(1, 16000, '16', that.audioBuffers[siteId]);
				////console.log(wav);
				//var fs = require('fs');
				//fs.writeFileSync('./hotword.wav',Buffer.from(that.audioBuffers[siteId]))
				
				
				

			that.sendMqtt('hermod/'+siteId+'/hotword/detected',{hotword:hotword});
		
		});
//const Speaker = require('speaker');

//// Create the Speaker instance
//const speaker = new Speaker({
  //channels: 1,          // 2 channels
  //bitDepth: 8,         // 16-bit samples
  //sampleRate: 8000     // 44,100 Hz sample rate
//});


//const fs = require('fs');
//const file = fs.createWriteStream('./hotword-direct.wav');
//console.log('CREATED STREAM TO RWIRTE AUDIO');

		// mqtt to stream - pushed to when audio packet arrives
		//this.mqttStreams[siteId] = new Readable()
		//this.mqttStreams[siteId]._read = () => {} // _read is required but you can noop it
        
		this.mqttStreams[siteId] = new Wav.Writer();
		 
        this.mqttStreams[siteId].pipe(detector)
        //this.mqttStreams[siteId].pipe(file)
        //this.mqttStreams[siteId].resume();	

	}
	
	stopMqttListener(siteId) {
		let that = this;
		this.audioDump[siteId].push(null)
		
		if (this.callbackIds.hasOwnProperty(siteId) && this.callbackIds[siteId]) {
			this.callbackIds[siteId].map(function(callbackId) {
				that.manager.removeCallbackById(callbackId)
				delete that.callbackIds[siteId];
				delete that.mqttStreams[siteId]
				delete that.listening[siteId]
				delete that.silent[siteId]
			1})
		}
	}
	
	onAudioMessage(topic,siteId,buffer) {
		//console.log('audio message hotword')
		if (this.mqttStreams.hasOwnProperty(siteId)) {
			// add wav header to first packet
			//if (this.messageCount[siteId] == 0) {
				//let wav = new WaveFile();
				//wav.fromScratch(1, 16000, '16', buffer);
				//this.mqttStreams[siteId].push(wav.toBuffer())
				//this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
			//} else {
				this.mqttStreams[siteId].push(buffer)
				this.audioDump[siteId].push(buffer)
		
				//this.audioBuffers[siteId].push.apply(this.audioBuffers[siteId],buffer)
			//}
			this.messageCount[siteId]++;
		}
	}	

}     
module.exports=HermodHotwordService
 