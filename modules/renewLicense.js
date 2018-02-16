'use strict'
const CronJob = require('cron').CronJob;
const devicesController = require('./../controllers/devices')



setInterval(()=>{
    console.log(new Date().toLocaleString())
  },1000)
  

  new CronJob('0 0 0 * * *', function() {
    console.log('You will see this message every second');
  }, null, true, null);
