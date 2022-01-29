const express = require('express');
const router = express.Router();
const shell = require('shelljs');



router.get('/',async (req,res) => {
  res.send(shell.exec('ifconfig | grep "inet" | head -1| cut -d " " -f 10'));
});   
module.exports = router;
