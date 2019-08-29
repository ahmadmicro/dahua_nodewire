#!/usr/bin/nodejs
var     ipcamera	= require('./dahua');
var nw = require('nw_node').nw;
var node = require('nw_node').node;
const nodemailer = require('nodemailer');

const image2base64 = require('image-to-base64');
const path = require('path');
const fs = require('fs');

console.log(__dirname);

// Options:
var options = {
	host	: '192.168.8.109',
	port 	: '80',
	user 	: 'admin',
	pass 	: 'admin',
	log 	: false
};

const conf = {                          // this will work but you should replace it with your own nodewire account credentials
    username:"9mobile@microscale.net",    // register an account at dashboard.nodewire.org
    password:"aB01@",
    instance:"6b0d64kfw3nc",
    server:"dashboard.nodewire.org",
}

var dahua 	= new ipcamera.dahua(options);
let the_node;
//nw.debug_level=2
nw.connect(conf);
nw.once('gack', async ()=>{
    the_node = new node('camera', {inputs: 'capture save', outputs: 'photo'}); // create the node. the parameters aree the node name and the list of input and output ports
	console.log('gacked');
    the_node.capture = 0; // initialize the port values, this is optional
    the_node.when('capture', (v)=>{
		// Get a snapshot
		if(v===1)
		{
			the_node.capture = 0;
			dahua.getSnapshot();
		}
	});
	the_node.when('save', (v)=>{
		// Save File
		var fileMeta = {
		       Channel: '0',
		       FilePath: '/mnt/sd/2018-05-19/001/dav/10/10.36.45-10.45.00[R][0@0][0].dav',
		       StartTime: '2018-05-19 10:36:45',
			   EndTime: '2018-05-19 10:45:00',
		       Type: 'dav'
		};

		dahua.saveFile(fileMeta);
	});

    setInterval(() => {            // the internal logic of our node: count if the start port is equal to 1
        if(the_node.start===1)
        {
            the_node.count += 1;
            console.log(the_node.count);
        }
    }, 1000);
});


// Switch to Day Profile
dahua.nightProfile()

// PTZ Go to preset 10
//dahua.ptzPreset(0)

//console.log(dahua.ptzStatus());

dahua.ptzMove('Down','start',1)

// Monitor Camera Alarms
dahua.on('alarm', function(code,action,index) {
	if (code === 'VideoMotion' && action === 'Start')	console.log('Video Motion Detected')
	if (code === 'VideoMotion' && action === 'Stop')	console.log('Video Motion Ended')
	if (code === 'AlarmLocal' && action === 'Start')	console.log('Local Alarm Triggered: ' + index)
	if (code === 'AlarmLocal' && action === 'Stop')		console.log('Local Alarm Ended: ' + index)
	if (code === 'VideoLoss' && action === 'Start')		console.log('Video Lost!')
	if (code === 'VideoLoss' && action === 'Stop')		console.log('Video Found!')
	if (code === 'VideoBlind' && action === 'Start')	console.log('Video Blind!')
	if (code === 'VideoBlind' && action === 'Stop')		console.log('Video Unblind!')
});

dahua.on('getSnapshot', function( msg ){
  console.log(msg);
  fs.readdir(__dirname, function (err, files) {
	    //handling error
	    if (err) {
	        return console.log('Unable to scan directory: ' + err);
	    }
	    //listing all files using forEach
	    files.forEach(async function (file) {
	        // Do whatever you want to do with the file
	        if(file.endsWith('.jpg'))
			{
				let transporter = nodemailer.createTransport({
			        host: 'smtp.webfaction.com',
			        port: 587,
			        secure: false, // true for 465, false for other ports
			        auth: {
			            user: 'msemail', // generated ethereal user
			            pass: 'Micro2033inF' // generated ethereal password
			        }
			    });

				// send mail with defined transport object
			    let info = await transporter.sendMail({
			        from: '"9Mobile" <info@microscale-embedded.com>', // sender address
			        to: 'sadiq.a.ahmad@gmail.com', // list of receivers
			        subject: 'Snapshot from Camera', // Subject line
			        text: 'Happening now', // plain text body
			        html: '<b>Happening now</b>', // html body
					attachments: [{   // stream as an attachment
			            filename: file,
			            content: fs.createReadStream(file)
			        }]
			    });

			    console.log('Message sent: %s', info.messageId);
				fs.unlinkSync(file);
				/*image2base64(file) // you can also to use url
			      .then(
			          (response) => {
			            //console.log(response); //cGF0aC90by9maWxlLmpwZw==
			  			the_node.photo = '"data:image/jpeg;charset=utf-8;base64, ' + response +  '"';
						fs.unlinkSync(file);
			          }
			      )
			      .catch(
			          (error) => {
			              console.log(error); //Exepection error....
			          }
			      )*/
			}
	    });
  })
});

dahua.on('saveFile',function( msg ){
  console.log('File saved!');
});
